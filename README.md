# r3ai.dev

Robert Goodson's personal site: an **At work** section, an **At home** section, and one blog underneath both.

## How it works

- `content/posts/` holds the blog posts, one text file each.
- `content/projects.json` lists the project and game cards shown on each section page.
- `static/` is copied to the site unchanged. Games and images go here.
- `src/styles.css` is the design.
- `build.mjs` turns all of that into the finished site in `dist/`.
- `dist/` is what Cloudflare serves.

## Add a post

1. Create a file in `content/posts/` named `YYYY-MM-DD-short-title.md`.
2. Start it with this header, then write the post underneath in Markdown:

```
---
title: The post title
date: 2026-10-04
section: work
summary: One or two sentences shown in the post lists.
---
```

`section` is `work` or `home`. Add `draft: true` to keep a post off the site.

3. Run `node build.mjs` (Node 18 or newer, nothing to install).
4. Commit everything, including `dist/`, and push. Cloudflare publishes it.

## Add a game or page

Put the files in `static/`, for example `static/games/my-game/index.html`, and add a card for it in `content/projects.json`.

## Cloudflare settings

`wrangler.jsonc` tells Cloudflare to serve `./dist`. The built site is committed, so no build command is needed. If you would rather have Cloudflare build it, set the build command to `node build.mjs`.
