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
- A page of its own shown inside the post, such as the fire escape plan in `static/fire-plan/`: add a line that says `{{embed /fire-plan/ A short title for the frame}}`. It also adds an "Open it full screen" link.
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
- `live.js` answers `<page address>/live` every ten seconds with the buses in service, alerts and weather. Positions come from the City's two vehicle trackers, whichever have their login set as Worker secrets (Cloudflare dashboard, the Worker's Settings, Variables and Secrets): Zonar (`ZONAR_CUSTOMER`, `ZONAR_USERNAME`, `ZONAR_PASSWORD`) and Geotab (`GEOTAB_DATABASE`, `GEOTAB_USERNAME`, `GEOTAB_PASSWORD`, plus `GEOTAB_SERVER` if sign-in is not at my.geotab.com). With both, each bus uses whichever tracker heard from it last. With neither, `sim.js` supplies made-up buses 901 to 905 and the page shows a "Simulated data" label. Never put a tracker login in this repository.
- Geotab devices are tied to buses by name. A name carrying the fleet number (`0609-47`) always counts. Other names (`Bus 47`) count only when the tracker's Geotab login can see 30 vehicles or fewer, which is the case once it is limited to the Transit group. To name them outright, add a variable `GEOTAB_BUSES` such as `{"47":"Gillig 47","42":"TR-042"}`.
- Buses are named the way staff name them: Zonar's fleet number `0609-47` shows everywhere as Bus 47 (`busNo` in the page).
- `matcher.js` works out which route each bus is on. The trackers report a bus number and a position, never a route, so a bus is given a route only after it has passed three of that route's own stops in order (stops no other route serves). Until then it shows grey with no route, and arrival times come from the timetable. The drive in from the facility counts for nothing, the count starts again at the terminal, one bus holds a route at a time, and a detour is flagged only for a bus that already has its route and has been off its line for a minute. A bus keeps its route through the lunch break (no trip leaves at 12:45 pm), whether it waits at the terminal, is switched off or goes back to the facility, and shows grey while it drives there and back. Cloudflare runs the tracker every minute on weekdays (`triggers` in `wrangler.jsonc`), so buses are followed all day even when nobody has the page open. `fleet.js` drops buses that are off, silent or parked at the facility. The settings are at the top of each file. `node tools/transit-test.mjs` checks all of this against simulated days and against the real pull-out of 6 October 2026 (`tools/fixtures/`), and should print "All scenarios passed".
- Paratransit vans (Geotab only, named `609-002` to `609-008`: a single-digit unit after `00`) are never treated as buses, so they stay off the lobby display even if Zonar is down. Their positions are served at `<page address>/live?vans=1` only to a request carrying the secret `PARA_FEED_KEY` in an `x-para-feed` header; the Para-Transit app (para.r3ai.dev) calls it over a private service binding. Set `PARA_FEED_KEY` as a Worker secret here and the same value on the `paratransit-app` Worker. Without it the address answers "not found".
- `<page address>/live?debug=1` lists every bus, what each tracker last said about it, which one is being used, and why the bus is or is not on the map. It is the first place to look when a bus is missing.

Page settings go on the end of the link: `?lobby=1` for the lobby TV (no buttons; adds the weather, notices and phone-code panel), `?demo=10:20` to see it at that time of day with simulated buses and a sample alert (this works whether or not Zonar is connected), `?lang=es` for Spanish.

Alerts and notices are rows in the `transit_alerts` table of the `r3ai-requests` database (layout in `worker/schema.sql`). An `alert` shows in the banner across the top; a `notice` shows in the lobby panel and the ticker. Times are UTC.

```
INSERT INTO transit_alerts (kind, title, body, title_es, body_es, routes, ends_at)
VALUES ('alert', 'Route 3 detour on Mill Street', 'Mill Street is closed at Bank Street. Buses are using Broad Street.', 'Desvío de la Ruta 3 en Mill Street', 'Mill Street está cerrada en Bank Street. Los autobuses usan Broad Street.', '3', '2026-10-09 23:00:00');
DELETE FROM transit_alerts WHERE id = 1;
```

If the matcher has a bus on the wrong route, or cannot tell, dispatch can say so for the day (`day` is YYYYMMDD; `bus` is the bus number, either the short form staff use, `47`, or Zonar's full `0609-47`):

```
INSERT OR REPLACE INTO transit_overrides (bus, day, route) VALUES ('47', '20261005', '2');
```

### City Navigator (temporary)

City Navigator is a rider guide made for one leadership class exercise (October 2026), in which about 15 people get around Lake Charles using only the buses. Its page is `worker/private/get-around.html` (the address keeps the first name, `/work/get-around/`). It uses the same live buses and timetable as the bus tracker, in its own bright frosted-glass look built to be read outdoors in full sun: near-black text on near-white glass, heavy type and large tap targets. On a wide screen the panel floats over the map; on a phone it is a sheet under the map.

- Four tabs: **Trip** (a trip planner: walk to a stop, one bus or two with a change at a stop both routes serve, walk to the door, from the timetable adjusted by live delays; tap the map to use any spot), **Buses** (stops near you with their next buses, and each route's live bus), **Places** (places a person without a car needs: government offices, clinics and hospitals, groceries, jobs and libraries, help services, and a Kids & family group of free or low-cost parks, library story times and museums open on weekdays, each with its cost, hours and nearest stop) and **Help** (fares and how to ride, phone numbers and links, and trip notes kept on the phone for the class debrief).
- **Pay fare** (header button) opens a bus pass screen with a live clock. The QR code goes in `FARE_QR` near the end of the page script (a `data:` image or an image address); until then it shows a placeholder and the $1.00 cash fare.
- The places, fares and phone numbers were researched in October 2026 and are written into the page. To change them, edit the page.
- Its `live` address gives bus positions only. `?vans=1` and `?debug=1` answer "not found" there, so it never shows paratransit vans or the tracker's debug listing.
- The link switches itself off at `until` in `UNLISTED` (end of Friday 16 October 2026). Change or remove that date to keep it longer. `?demo=10:20` works as on the tracker for practice.

### Limiting Factor

Limiting Factor is a working first version of a tool for finding what holds a service back. Staff log what got in the way of a step and roughly how many hours it costs a month; the page ranks those limits by cost and by how long they have been open, and writes a one-page brief for whoever controls the budget. Its page is `worker/private/limiting-factor.html`. It uses the site's blues, greens and clear glass with its own type, and has a Theme button (Auto, Light, Dark) in the header.

- `worker/limits/api.js` answers `<page address>/api`. A plain read returns everything the page shows; a POST makes one change (a report, an import, a service, a status, the hourly rate) and returns the fresh data. The page asks again every 20 seconds, so two people see each other's entries.
- The data is in the `lf_services`, `lf_reports`, `lf_status` and `lf_settings` tables of the `r3ai-requests` database (layout in `worker/schema.sql`). Reports store the role a person picked, never a name. The services, their steps, the roles and the hourly rate are all edited on the page itself (Services and Data tabs), not in this repository.
- Several estimates of the same limit use the middle value, so one problem reported by five people is not counted five times. Imported records (the CSV box on the Data tab) replace estimates for that limit.
- "Summarize themes with AI" uses Cloudflare Workers AI on the free allowance, at most 40 summaries a day. The model sees only the report text.
- Anyone holding the link can add and change records. Keep names, health details and anything else personal out of it.

To make a new link for any of these pages (and switch the old one off), pick a new key and put its hash in `UNLISTED`, using the page's own name in the address:

```
KEY=$(openssl rand -hex 12); echo "https://r3ai.dev/work/lobby-display/$KEY/"; printf '%s' "$KEY" | sha256sum
```

To publish the page properly later, move the file to `static/`, remove `"unlisted": true` from its project and give the card a link.

The link is a shared key, not a login: anyone it is forwarded to can open the page. This repository is public, so the page's source can also be read on GitHub by someone who looks for it. For sign-in by email address, put Cloudflare Access in front of `/work/lobby-display/*`.

## Cloudflare settings

`wrangler.jsonc` tells Cloudflare to serve `./dist`, run `worker/index.js` for `/api/requests` and the unlisted pages, and connect the requests database. The built site is committed, so no build command is needed. If you would rather have Cloudflare build it, set the build command to `node build.mjs`.
