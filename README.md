# 七瀬玲華 公式サイト

静的サイト（依存パッケージなし）。`node build.mjs` で `docs/` に書き出し、GitHub Pages（main ブランチの /docs）で公開する。

## 構成
- `data/site.json` … サイト名・公開URL・XのURL（`url` と `xUrl` は公開後に記入）
- `data/books.json` … 作品データ（新しい順に自動ソート。`no` が大きいほど新しい）
- `content/news/*.md` … お知らせ・ブログ記事（ファイル名 `YYYY-MM-DD-英字.md`）
- `assets/` … CSS・JS・画像（表紙は `assets/img/covers/`）
- `tools/optimize_image.py` … 表紙をWeb用（幅600px）に縮小

## 新刊を追加する
1. `python tools/optimize_image.py "<表紙画像のパス>" <slug>`
2. `data/books.json` に1件追加（`status`: 配信前は `coming`、配信後は `available` と `asin` を記入）
3. 新刊のお知らせ記事を `content/news/` に追加
4. `node build.mjs` → コミット → push

## 記事の書き方
```
---
title: タイトル
date: 2026-11-04
category: 新刊のお知らせ
---
本文（空行で段落、`## 見出し`、`- 箇条書き`、`**太字**`、`[リンク](../../works/slug/)` が使える）
```
