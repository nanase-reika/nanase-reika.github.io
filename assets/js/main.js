// スマホ用メニュー
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
});

// 作品一覧のジャンル絞り込み（?genre=royal などのURLにも対応）
const grid = document.getElementById("book-grid");
if (grid) {
  const buttons = document.querySelectorAll(".filters button");
  const empty = document.querySelector(".empty");
  const apply = (key) => {
    let shown = 0;
    grid.querySelectorAll(".book-card").forEach((card) => {
      const hit = key === "all" || card.dataset.genre === key || card.dataset.format === key;
      card.classList.toggle("is-hidden", !hit);
      if (hit) shown++;
    });
    buttons.forEach((b) => b.classList.toggle("is-active", b.dataset.filter === key));
    empty.hidden = shown > 0;
  };
  buttons.forEach((b) => b.addEventListener("click", () => {
    apply(b.dataset.filter);
    const url = new URL(location);
    b.dataset.filter === "all" ? url.searchParams.delete("genre") : url.searchParams.set("genre", b.dataset.filter);
    history.replaceState(null, "", url);
  }));
  const initial = new URLSearchParams(location.search).get("genre");
  if (initial && [...buttons].some((b) => b.dataset.filter === initial)) apply(initial);
}

// スクロールでふわっと表示
const targets = document.querySelectorAll(".section, .synopsis, .feature-block");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -10% 0px" });
  targets.forEach((t) => { t.classList.add("reveal"); io.observe(t); });
}
