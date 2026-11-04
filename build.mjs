// 七瀬玲華 公式サイト ビルドスクリプト（依存パッケージなし）
// 使い方: node build.mjs  → docs/ に静的サイトを書き出す
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "docs");
const site = JSON.parse(fs.readFileSync(path.join(ROOT, "data/site.json"), "utf8"));
const books = JSON.parse(fs.readFileSync(path.join(ROOT, "data/books.json"), "utf8")).sort((a, b) => b.no - a.no);
const posts = loadPosts();

// ---------- utilities ----------
function esc(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
const amazon = (b) => (b.asin ? `https://www.amazon.co.jp/dp/${b.asin}` : "");
const fmtDate = (d) => d.replace(/-/g, ".");

// ---------- markdown (必要最小限) ----------
function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}
function markdown(src) {
  const out = [];
  for (const block of src.trim().split(/\n\s*\n/)) {
    const lines = block.split("\n");
    if (/^###\s/.test(lines[0])) out.push(`<h3>${inline(lines[0].slice(4))}</h3>`);
    else if (/^##\s/.test(lines[0])) out.push(`<h2>${inline(lines[0].slice(3))}</h2>`);
    else if (/^- /.test(lines[0])) {
      const items = [];
      for (const l of lines) /^- /.test(l) ? items.push(l.slice(2)) : (items[items.length - 1] += "\n" + l.trim());
      out.push("<ul>" + items.map((i) => `<li>${i.split("\n").map(inline).join("<br>")}</li>`).join("") + "</ul>");
    } else out.push(`<p>${lines.map(inline).join("<br>")}</p>`);
  }
  return out.join("\n");
}
function loadPosts() {
  const dir = path.join(ROOT, "content/news");
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n");
    const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const meta = Object.fromEntries(m[1].split("\n").map((l) => l.split(/:\s*/).map((v, i, a) => (i ? a.slice(1).join(": ") : v))).map(([k, v]) => [k.trim(), v.trim()]));
    const body = m[2];
    const plain = body.replace(/^#+\s.*$/gm, "").replace(/\[(.+?)\]\(.+?\)/g, "$1").replace(/[*\-]/g, "").replace(/\s+/g, " ").trim();
    return { ...meta, slug: f.replace(/\.md$/, ""), html: markdown(body), excerpt: plain.slice(0, 90) + (plain.length > 90 ? "…" : "") };
  }).sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));
}

// ---------- layout ----------
const NAV = [
  ["", "Home", "トップ"],
  ["works/", "Works", "作品"],
  ["profile/", "Profile", "プロフィール"],
  ["news/", "News", "お知らせ"],
];
function layout({ p, title, desc, current, body, ogImage }) {
  const fullTitle = title ? `${title}｜${site.title}` : site.title;
  const d = esc(desc || site.description);
  const og = site.url ? `${site.url}${ogImage || "assets/img/ogp-base.png"}` : "";
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${d}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${d}">
<meta property="og:type" content="website">
${og ? `<meta property="og:image" content="${og}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${p}assets/img/favicon.png">
<link rel="apple-touch-icon" href="${p}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${p}assets/css/style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="${p}">
    <img src="${p}assets/img/logo.png" alt="" width="44" height="44">
    <span class="brand-text"><span class="brand-ja">七瀬玲華</span><span class="brand-en">Reika Nanase</span></span>
  </a>
  <button class="nav-toggle" aria-label="メニュー" aria-expanded="false"><span></span><span></span></button>
  <nav class="site-nav">
    ${NAV.map(([href, en, ja]) => `<a href="${p}${href}"${current === en ? ' aria-current="page"' : ""}><span class="en">${en}</span><span class="ja">${ja}</span></a>`).join("\n    ")}
  </nav>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <img class="footer-logo" src="${p}assets/img/logo.png" alt="" width="72" height="72">
  <p class="footer-name">七瀬玲華 <span>Reika Nanase</span></p>
  <div class="footer-links">
    <a href="${site.amazonAuthorUrl}" target="_blank" rel="noopener">Amazon Kindle</a>
    ${site.xUrl ? `<a href="${site.xUrl}" target="_blank" rel="noopener">X（旧Twitter）</a>` : ""}
  </div>
  <p class="copyright">&copy; ${new Date().getFullYear()} Reika Nanase. All rights reserved.</p>
</footer>
<script src="${p}assets/js/main.js"></script>
</body>
</html>
`;
}
const ornament = `<span class="ornament" aria-hidden="true"><svg viewBox="0 0 120 12" width="120" height="12"><path d="M0 6h48M72 6h48" stroke="currentColor" stroke-width="1"/><path d="M60 1l5 5-5 5-5-5z" fill="currentColor"/><circle cx="50" cy="6" r="1.5" fill="currentColor"/><circle cx="70" cy="6" r="1.5" fill="currentColor"/></svg></span>`;
const heading = (en, ja) => `<div class="section-head"><p class="en">${en}</p><h2>${ja}</h2>${ornament}</div>`;

// ---------- components ----------
function bookCard(b, p) {
  const genre = site.genres[b.genre];
  return `<article class="book-card" data-genre="${b.genre}" data-format="${b.format.includes("漫画") ? "comic" : "novel"}">
  <a href="${p}works/${b.slug}/">
    <div class="cover"><img src="${p}assets/img/covers/${b.cover}" alt="${esc(b.title)} 表紙" loading="lazy" width="600" height="960">${b.status === "coming" ? '<span class="badge">近日配信</span>' : ""}</div>
    <p class="meta"><span class="genre genre-${b.genre}">${genre}</span><span>${esc(b.format)}</span></p>
    <h3>${esc(b.title)}</h3>
  </a>
</article>`;
}
function buyButton(b, cls = "btn") {
  return b.status === "available" && b.asin
    ? `<a class="${cls}" href="${amazon(b)}" target="_blank" rel="noopener">Amazonで読む<small>Kindle</small></a>`
    : `<span class="${cls} is-disabled">近日配信予定</span>`;
}
function postItem(post, p) {
  return `<li><a href="${p}news/${post.slug}/"><time datetime="${post.date}">${fmtDate(post.date)}</time><span class="cat">${esc(post.category || "")}</span><span class="t">${esc(post.title)}</span></a></li>`;
}

// ---------- pages ----------
function home() {
  const p = "";
  const latest = books.find((b) => b.status === "available") || books[0];
  return layout({
    p, current: "Home", body: `
<section class="hero">
  <div class="hero-inner">
    <img class="hero-logo" src="assets/img/logo.png" alt="七瀬玲華 カメオロゴ" width="480" height="480">
    <div class="hero-copy">
      <p class="hero-en">Romance Novelist</p>
      <h1>七瀬玲華</h1>
      <p class="hero-lead">奪われた名前も、言えなかった想いも。<br>物語の中で、あなたの手に。</p>
      <div class="hero-actions"><a class="btn" href="works/">作品を見る</a><a class="btn btn-ghost" href="profile/">七瀬玲華について</a></div>
    </div>
  </div>
</section>

<section class="section feature">
  ${heading(latest.status === "coming" ? "Coming Soon" : "New Release", latest.status === "coming" ? "近日配信" : "最新刊")}
  ${featureBlock(latest, p)}
</section>

<section class="section">
  ${heading("Works", "作品一覧")}
  <div class="book-grid">${books.slice(0, 6).map((b) => bookCard(b, p)).join("\n")}</div>
  <p class="more"><a class="btn btn-ghost" href="works/">すべての作品を見る</a></p>
</section>

<section class="section two-doors">
  ${heading("Two Doors", "ふたつの扉")}
  <div class="doors">
    <a class="door door-royal" href="works/?genre=royal"><p class="en">Royal Romance</p><h3>王宮ロマンス</h3><p>夜会、ドレス、政略結婚。<br>誇りを取り戻す令嬢たちの恋。</p></a>
    <a class="door door-modern" href="works/?genre=modern"><p class="en">Modern Romance</p><h3>現代ロマンス</h3><p>四十二歳からの、もう一度。<br>自分の人生と恋を選び直す物語。</p></a>
  </div>
</section>

<section class="section">
  ${heading("News", "お知らせ")}
  <ul class="news-list">${posts.slice(0, 5).map((x) => postItem(x, p)).join("")}</ul>
  <p class="more"><a class="btn btn-ghost" href="news/">お知らせ一覧</a></p>
</section>

<section class="section profile-teaser">
  <div class="profile-card">
    <img src="assets/img/logo.png" alt="" width="160" height="160">
    <div>
      <p class="en">About</p>
      <h2>七瀬玲華</h2>
      <p>ロマンス作家。王宮の大広間から、閉店間際の喫茶店まで。<br>奪われたものを自分の手で取り戻し、選んだ人の隣で笑う女性たちを書いています。</p>
      <a class="text-link" href="profile/">プロフィールを読む →</a>
    </div>
  </div>
</section>
${site.xUrl ? `<section class="section x-follow"><p>新刊情報と、ロマンスにまつわる小さなコラムをXで毎日お届けしています。</p><a class="btn" href="${site.xUrl}" target="_blank" rel="noopener">Xでフォローする</a></section>` : ""}
`,
  });
}
function featureBlock(b, p) {
  return `<div class="feature-block">
    <a class="feature-cover" href="${p}works/${b.slug}/"><img src="${p}assets/img/covers/${b.cover}" alt="${esc(b.title)} 表紙" width="600" height="960"></a>
    <div class="feature-text">
      <p class="meta"><span class="genre genre-${b.genre}">${site.genres[b.genre]}</span><span>${esc(b.format)}</span></p>
      <h3>${esc(b.title)}</h3>
      <p class="subtitle">${esc(b.subtitle)}</p>
      <p class="catch">${esc(b.catch)}</p>
      <p class="excerpt">${esc(b.description.slice(0, 2).join(""))}</p>
      <div class="actions">${buyButton(b)}<a class="btn btn-ghost" href="${p}works/${b.slug}/">あらすじを読む</a></div>
    </div>
  </div>`;
}
function worksIndex() {
  const p = "../";
  const filters = [["all", "すべて"], ["royal", "王宮ロマンス"], ["modern", "現代ロマンス"], ["omnibus", "短編集"], ["comic", "漫画小説"]];
  return layout({
    p, current: "Works", title: "作品一覧", desc: "七瀬玲華の作品一覧。王宮ロマンス・現代ロマンス・短編集・漫画小説をKindleで配信中。", body: `
<section class="page-head">${heading("Works", "作品一覧")}<p>全${books.length}作品（配信中 ${books.filter((b) => b.status === "available").length}作）</p></section>
<section class="section">
  <div class="filters" role="group" aria-label="ジャンルで絞り込む">${filters.map(([k, v], i) => `<button data-filter="${k}"${i === 0 ? ' class="is-active"' : ""}>${v}</button>`).join("")}</div>
  <div class="book-grid" id="book-grid">${books.map((b) => bookCard(b, p)).join("\n")}</div>
  <p class="empty" hidden>該当する作品はまだありません。</p>
</section>`,
  });
}
function workPage(b) {
  const p = "../../";
  const related = books.filter((x) => x.slug !== b.slug && x.genre === b.genre).slice(0, 3);
  const others = related.length ? related : books.filter((x) => x.slug !== b.slug).slice(0, 3);
  const episodes = b.episodes ? `<div class="episodes"><h3>収録作品</h3>${b.episodes.map((e) => `<details><summary>${esc(e.title)}</summary><p>${esc(e.text)}</p></details>`).join("")}</div>` : "";
  const after = b.afterword ? b.afterword.map((t) => `<p>${esc(t)}</p>`).join("") : "";
  const jsonld = { "@context": "https://schema.org", "@type": "Book", name: b.title, alternativeHeadline: b.subtitle, author: { "@type": "Person", name: site.name }, inLanguage: "ja", bookFormat: "https://schema.org/EBook", ...(b.asin ? { url: amazon(b) } : {}) };
  return layout({
    p, current: "Works", title: b.title, desc: `${b.subtitle}。${b.description[0]}`.slice(0, 120), ogImage: `assets/img/covers/${b.cover}`, body: `
<article class="work">
  <nav class="breadcrumb"><a href="${p}">トップ</a> / <a href="${p}works/">作品一覧</a></nav>
  <div class="work-main">
    <div class="work-cover"><img src="${p}assets/img/covers/${b.cover}" alt="${esc(b.title)} 表紙" width="600" height="960"></div>
    <div class="work-info">
      <p class="meta"><span class="genre genre-${b.genre}">${site.genres[b.genre]}</span><span>${esc(b.format)}</span><span>${esc(b.pages)}</span></p>
      <h1>${esc(b.title)}</h1>
      <p class="subtitle">${esc(b.subtitle)}</p>
      <p class="author">著：七瀬玲華</p>
      <div class="actions">${buyButton(b)}</div>
      <ul class="tags">${b.tags.map((t) => `<li>#${esc(t)}</li>`).join("")}</ul>
    </div>
  </div>
  <section class="synopsis">
    ${heading("Story", "あらすじ")}
    <blockquote class="catch">${esc(b.catch)}</blockquote>
    ${b.description.map((t) => `<p>${esc(t)}</p>`).join("")}
    ${episodes}
    ${after}
    <div class="actions center">${buyButton(b)}</div>
  </section>
  <section class="section">
    ${heading("More Stories", "こちらもおすすめ")}
    <div class="book-grid small">${others.map((x) => bookCard(x, p)).join("\n")}</div>
  </section>
</article>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
  });
}
function profile() {
  const p = "../";
  return layout({
    p, current: "Profile", title: "プロフィール", desc: "ロマンス作家・七瀬玲華のプロフィール。", body: `
<section class="page-head">${heading("Profile", "プロフィール")}</section>
<section class="section profile">
  <div class="profile-photo"><img src="${p}assets/img/logo.png" alt="七瀬玲華 カメオロゴ" width="480" height="480"></div>
  <div class="profile-body">
    <h1>七瀬玲華<span>Reika Nanase</span></h1>
    <p class="role">Romance Novelist</p>
    <p>ロマンス作家。年齢は、物語の中の時間と同じく、内緒です。</p>
    <p>王宮の大広間で婚約破棄を告げられる令嬢も、四十二歳で離婚届を出した夜に初恋の人と再会する女性も、私にとっては同じひとりのヒロインです。</p>
    <p>奪われた名前、言えなかった言葉、手放しかけた自分の時間。それを誰かに返してもらうのではなく、自分の手で取り戻す。そして、選んだ人の隣で笑う。そんな物語を書いています。</p>
    <p>舞台は、西洋風の王宮、平安の宮廷、大正の浅草、そして今の日本。時代が変わっても、誇りを取り戻す瞬間の美しさは変わらないと信じています。</p>
    <dl class="profile-list">
      <dt>ジャンル</dt><dd>王宮ロマンス／現代ロマンス／ざまぁ・逆転劇／大人の恋愛</dd>
      <dt>作品</dt><dd>Amazon Kindleにて配信中（小説・漫画小説）</dd>
      <dt>お約束</dt><dd>どの物語も、最後は必ずハッピーエンド</dd>
    </dl>
    <div class="actions"><a class="btn" href="${p}works/">作品一覧へ</a>${site.xUrl ? `<a class="btn btn-ghost" href="${site.xUrl}" target="_blank" rel="noopener">X（旧Twitter）</a>` : ""}</div>
  </div>
</section>`,
  });
}
function newsIndex() {
  const p = "../";
  return layout({
    p, current: "News", title: "お知らせ", desc: "七瀬玲華の新刊情報・作品の裏話・お知らせ。", body: `
<section class="page-head">${heading("News", "お知らせ・ブログ")}</section>
<section class="section"><ul class="news-cards">${posts.map((x) => `<li><a href="${p}news/${x.slug}/"><p class="meta"><time datetime="${x.date}">${fmtDate(x.date)}</time><span class="cat">${esc(x.category || "")}</span></p><h3>${esc(x.title)}</h3><p>${esc(x.excerpt)}</p></a></li>`).join("")}</ul></section>`,
  });
}
function postPage(x, i) {
  const p = "../../";
  const prev = posts[i + 1], next = posts[i - 1];
  return layout({
    p, current: "News", title: x.title, desc: x.excerpt, body: `
<article class="post">
  <nav class="breadcrumb"><a href="${p}">トップ</a> / <a href="${p}news/">お知らせ</a></nav>
  <header><p class="meta"><time datetime="${x.date}">${fmtDate(x.date)}</time><span class="cat">${esc(x.category || "")}</span></p><h1>${esc(x.title)}</h1>${ornament}</header>
  <div class="post-body">${x.html}</div>
  <p class="sign">七瀬玲華</p>
  <nav class="post-nav">${prev ? `<a href="${p}news/${prev.slug}/">← ${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a href="${p}news/${next.slug}/">${esc(next.title)} →</a>` : "<span></span>"}</nav>
</article>`,
  });
}
function notFound() {
  // 404はどの階層からでも表示されるため、公開URLが決まっていればそれを基準にする
  const p = site.url || "/";
  return layout({ p, title: "ページが見つかりません", body: `<section class="page-head">${heading("404", "ページが見つかりません")}<p>お探しの物語は、別の扉の向こうにあるようです。</p><p class="more"><a class="btn" href="${p}">トップへ戻る</a></p></section>` });
}

// ---------- build ----------
// docs/ は削除せず上書きする（作品を取り下げた場合は手動で削除用フォルダへ移す）
copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"));
write("index.html", home());
write("works/index.html", worksIndex());
books.forEach((b) => write(`works/${b.slug}/index.html`, workPage(b)));
write("profile/index.html", profile());
write("news/index.html", newsIndex());
posts.forEach((x, i) => write(`news/${x.slug}/index.html`, postPage(x, i)));
write("404.html", notFound());
write(".nojekyll", "");
if (site.url) {
  const urls = ["", "works/", "profile/", "news/", ...books.map((b) => `works/${b.slug}/`), ...posts.map((x) => `news/${x.slug}/`)];
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.url}sitemap.xml\n`);
}
console.log(`built: ${books.length} works, ${posts.length} posts → docs/`);
