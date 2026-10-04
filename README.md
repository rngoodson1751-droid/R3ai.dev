# r3ai.dev

Robert Goodson's personal site: an **At work** section, an **At home** section, and one blog underneath both.

## How it works

- `content/posts/` holds the blog posts, one text file each.
- `content/projects.json` lists the project and game cards shown on each section page.
- `static/` is copied to the site unchanged. Games and images go here.
- `src/styles.css` is the design. `src/site.js` runs the water background, the puzzle cube on the home page and the request form.
- `src/sw.js` is the service worker. It makes the site installable and keeps visited pages and saved games working offline.
- `src/demos/` holds the demos and the small tools that sit inside posts.
- `worker/index.js` is the only server code. It saves post requests, counts page views and answers questions on `/ask/`.
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
topics: Using AI, Office work
summary: One or two sentences shown in the post lists.
---
```

`section` is `work` or `home`. `topics` is optional and drives the filter buttons on the blog page. Pick from: Using AI, Office work, Transit tools, Games, Sailing, Family, This site. To add a new topic, add it to the `TOPICS` list near the top of `build.mjs`. Add `draft: true` to keep a post off the site.

3. Run `node build.mjs` (Node 18 or newer, nothing to install).
4. Commit everything, including `dist/`, and push. Cloudflare publishes it.

## Extras you can put in a post

- A "Try this yourself" box with a copy button: put the prompt in a fenced block that starts with three backticks and the word `prompt`.
- The scoring calculator, or any other small tool: add `widget: portsmouth` to the header and a line that says `{{portsmouth}}` where it should appear. The code is `src/demos/portsmouth.js`.

## Add a game or page

Put the files in `static/`, for example `static/games/my-game/index.html`, and add a card for it in `content/projects.json`. Any card with a link that starts with `/games/` also shows on the games page at `/games/`. Give it a picture with `"image": "/shots/my-game.jpg"` and put a 16:9 screenshot in `static/shots/`.

## Other pages

- `/start/` is the Start here page. Its five posts are the `START` list in `build.mjs`.
- `/demos/` lists four working demos with made-up data: the dispatch board, the procurement wizard, the live bus map and the bus stop sign. Their code is in `src/demos/`. The map and the sign share one made-up bus system in `src/demos/sim.js`.
- `/ask/` is Ask the site. The Worker finds the posts that best match the question and has a Cloudflare Workers AI model answer from those posts only. It runs on the free daily allowance, so when that runs out it says so and stops until the next day. Limits are at the top of `worker/index.js`: eight questions an hour per visitor and 100 a day in total.
- The blog search box reads `search.json`, which the build makes from the posts.

## Visitor counts

Every page view adds one to a count for that page and day in the `hits` table of the `r3ai-requests` database. No cookies, and nothing about the visitor is stored. Visitors whose browser asks not to be tracked are skipped. To see the most-read pages of the last 30 days:

```
npx wrangler d1 execute r3ai-requests --remote --command "SELECT path, SUM(n) AS views FROM hits WHERE day >= date('now', '-30 days') GROUP BY path ORDER BY views DESC LIMIT 20"
```

Questions typed into `/ask/` are saved in the `asks` table.

## Link preview pictures

The picture that shows when a page is texted or posted lives in `static/og/`, one per page and post. After adding a post, make its picture with:

```
npm install --no-save playwright
node build.mjs && node tools/og.mjs && node build.mjs
```

A post without a picture uses `static/og/default.jpg`, so this step is optional.

## Post requests

Visitors can ask for a post at `/request/`. Each request is saved to the Cloudflare D1 database `r3ai-requests`, in the `requests` table (layout in `worker/schema.sql`). Requests are never shown on the site. To read them, open the database in the Cloudflare dashboard under Storage and Databases, or run:

```
npx wrangler d1 execute r3ai-requests --remote --command "SELECT * FROM requests ORDER BY id DESC"
```

A request stays private until it is approved. To show one in the "What readers have asked for" list on `/request/`, give it a short title in your own words and a status:

```
UPDATE requests SET status = 'asked', public_title = 'How the dispatch board picks a cover driver' WHERE id = 3;
```

`status` can be `asked` (on the list), `writing` or `posted`. For `posted`, also set `post_url` to the post's address, such as `/blog/driver-dispatch-board/`. Only `public_title` is ever shown. The visitor's message, name and email never leave the database. Use `declined` to keep one private for good.

The form allows five requests an hour from one visitor and 200 a day in total, and it ignores anything that fills in the hidden spam-trap box.

## Cloudflare settings

`wrangler.jsonc` tells Cloudflare to serve `./dist`, run `worker/index.js` for `/api/requests`, and connect the requests database. The built site is committed, so no build command is needed. If you would rather have Cloudflare build it, set the build command to `node build.mjs`.
