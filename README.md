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

### River and the Nightjar

This game is split into small files instead of one big page, all under `static/games/river-and-the-nightjar/`.

- `index.html` is the page, its styles and the menus.
- `js/main.js` runs the game: the frame loop, the camera, walking, and the helpers the chapters are written with.
- `js/kit.js` builds every shape and painted texture. There are no image or sound files.
- `js/ui.js` is the dialogue cards, menus, keepsake book and reading voice. `js/input.js` is keyboard, controller and touch. `js/audio.js` writes the music.
- `js/story.js` holds the chapter list and the 22 keepsakes.
- `js/chapters/` has one file per chapter (`c00.js` is the prologue, `c10.js` the epilogue), plus `common.js` and `city.js` for pieces they share.

To open a chapter directly while working on it, add `?c=4` to the address (0 to 10). Adding `&auto=1` skips through the dialogue.

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

## Unlisted pages

An unlisted page is online but not on the site: no card, no sitemap entry, nothing in search, and search engines are told to skip it. It opens only for someone who has its exact link. The first one is the transit lobby display.

- The page is one file in `worker/private/`, such as `worker/private/lobby-display.html`. It is not copied into `dist/`.
- `worker/index.js` serves it at `/work/<name>/<key>/`. The `UNLISTED` list at the top holds the SHA-256 of the key, not the key, so the link cannot be read out of this repository. Any other address under that name shows the usual "page not found".
- The project also has an entry in `content/projects.json` with `"unlisted": true`, which keeps it off every page.

### The bus tracker

The lobby display is a live bus tracker. Its page is `worker/private/lobby-display.html`; everything behind it is in `worker/transit/`.

- `network.json` is the routes, stops, route lines and timetable, made from the GTFS feed. When the feed changes, unzip it and run `node tools/gtfs.mjs path/to/folder`, then commit.
- `live.js` answers `<page address>/live` every ten seconds with the buses in service, alerts and weather. Positions come from Zonar once three Worker secrets exist (`ZONAR_CUSTOMER`, `ZONAR_USERNAME`, `ZONAR_PASSWORD`, set in the Cloudflare dashboard under the Worker's Settings, Variables and Secrets). Until then `sim.js` supplies made-up buses 901 to 905 and the page shows a "Simulated data" label. Never put the Zonar login in this repository.
- `matcher.js` works out which route each bus is on. Zonar reports a bus number and a position, never a route, so the matcher follows each bus's recent trail along the route lines; `fleet.js` drops buses that are off, silent or parked at the facility. The settings are at the top of each file. `node tools/transit-test.mjs` checks the matcher against simulated days and should print "All scenarios passed".
- `<page address>/live?debug=1` shows what Zonar sent back (without the login), for when its format needs checking.

Page settings go on the end of the link: `?lobby=1` for the lobby TV (no buttons; adds the weather, notices and phone-code panel), `?demo=10:20` to see it at that time of day with simulated buses and a sample alert, `?lang=es` for Spanish.

Alerts and notices are rows in the `transit_alerts` table of the `r3ai-requests` database (layout in `worker/schema.sql`). An `alert` shows in the banner across the top; a `notice` shows in the lobby panel and the ticker. Times are UTC.

```
INSERT INTO transit_alerts (kind, title, body, title_es, body_es, routes, ends_at)
VALUES ('alert', 'Route 3 detour on Mill Street', 'Mill Street is closed at Bank Street. Buses are using Broad Street.', 'Desvío de la Ruta 3 en Mill Street', 'Mill Street está cerrada en Bank Street. Los autobuses usan Broad Street.', '3', '2026-10-09 23:00:00');
DELETE FROM transit_alerts WHERE id = 1;
```

If the matcher has a bus on the wrong route, or cannot tell, dispatch can say so for the day (`day` is YYYYMMDD, `bus` is the number as Zonar writes it):

```
INSERT OR REPLACE INTO transit_overrides (bus, day, route) VALUES ('0609-37', '20261005', '2');
```

To make a new link (and switch the old one off), pick a new key and put its hash in `UNLISTED`:

```
KEY=$(openssl rand -hex 12); echo "https://r3ai.dev/work/lobby-display/$KEY/"; printf '%s' "$KEY" | sha256sum
```

To publish the page properly later, move the file to `static/`, remove `"unlisted": true` from its project and give the card a link.

The link is a shared key, not a login: anyone it is forwarded to can open the page. This repository is public, so the page's source can also be read on GitHub by someone who looks for it. For sign-in by email address, put Cloudflare Access in front of `/work/lobby-display/*`.

## Cloudflare settings

`wrangler.jsonc` tells Cloudflare to serve `./dist`, run `worker/index.js` for `/api/requests` and the unlisted pages, and connect the requests database. The built site is committed, so no build command is needed. If you would rather have Cloudflare build it, set the build command to `node build.mjs`.
