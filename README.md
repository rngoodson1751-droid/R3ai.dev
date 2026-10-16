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

City Navigator is a rider guide made for one leadership class exercise (October 2026), in which about 15 people get around Lake Charles using only the buses. Its page is `worker/private/get-around.html` (the address keeps the first name, `/work/get-around/`). It uses the same live buses and timetable as the bus tracker, in its own bright frosted-glass look built to be read outdoors in full sun: near-black text on near-white glass, heavy type and large tap targets.

- **Layout.** On a phone the map fills the screen. A glass header floats at the top (City logo, name and the weather) and a sheet sits at the bottom. The sheet has three heights: peek (just its top), mid (about half the screen) and full. Drag its handle, or tap the handle to tuck it away and bring it back. On a wide screen, or a phone held sideways, the sheet is a panel floating at the right of the map. The phone layout's test is the `@media (max-width:900px) and (min-height:521px),(max-width:639px)` rule in the styles and `phoneMQ` in the script: keep the two the same.
- **Start screen.** The page opens on a start screen, not a tab. It gives one sentence that answers "when is my bus?" (the next departure from the downtown terminal, or, once the phone has shared its location, the next bus at the stop nearest you, with that stop ringed on the map), the five routes as buttons, a **Where to?** search, and three ways in: Near me, Places, How to ride. `homeTick()` writes the sentence every second. On opening, the routes draw themselves outward from the terminal once (`drawIn()`); people who ask their phone for less motion get the finished map straight away.
- **Where to?** opens one search over every place and every bus stop, for both ends of a trip (`openPick()`, `renderPick()`). It matches names, streets, stop numbers, kinds of place and what is there; `ALSO` near the picker code adds words people type that place names lack (dmv, grocery, er). Choosing a place plans the trip at once. The last four choices are kept on the phone as Recent. "Choose a spot on the map" tucks the sheet away and takes the next tap on the map.
- **Searching beyond the list.** From three letters on, Where to? also asks `<page address>/api?q=` (`worker/navigator/search.js`). With the Worker secret `GOOGLE_MAPS_KEY` set (added 13 October 2026), it searches Google Places (Text Search, "Places API (New)") within Lake Charles. If Google is not set up or fails, it asks Photon and Nominatim (OpenStreetMap) at once and uses the first answer. Google answers are never cached (Google's terms); OpenStreetMap answers are cached for a day. The list credits its source. To check the setup, open `<page address>/api?q=pharmacy`: `"source":"google"` means Google answered; a `"google"` field holds Google's reason when it did not. The key must allow Places API (New) and must not have a website (HTTP referrer) restriction, since the call comes from the server. Each result shows its walk from the nearest stop and is marked when far from a route.
- Four tabs once past the start screen, with a home button beside them: **Trip** (a trip planner: walk to a stop, one bus or two with a change at a stop both routes serve, walk to the door, from the timetable adjusted by live delays), **Buses** (stops near you with their next buses, and each route's live bus), **Places** (places a person without a car needs: government offices, clinics and hospitals, groceries, jobs and libraries, help services, and a Kids & family group of free or low-cost parks, library story times and museums open on weekdays, each with its cost, hours and nearest stop) and **Help** (fares and how to ride, phone numbers and links, and trip notes kept on the phone for the class debrief).
- **The map.** Stops are hidden while the whole network is on screen and appear once the map is zoomed in (`STOP_ZOOM`), or for one route when it is picked. The terminal is always marked. The street map is the standard OpenStreetMap one with its colours turned down in the styles (`.leaflet-tile-pane`), so the route colours stand out. Once location is allowed, the blue dot follows the phone.
- The phone's Back button returns to the start screen, or closes the search, instead of leaving the page (`tab()` and `openDialog()`).
- There is no fare pass on the page. Robert took the Pay fare button and bus pass screen out on 12 October 2026 because a comped-fare QR code would not be available; riders pay the posted fare, which the Help tab and trip results describe.
- The weather in the header comes from the same forecast the lobby display uses, sent with the live data. Tap it for the detail.
- The places, fares and phone numbers were researched in October 2026 and are written into the page. To change them, edit the page.
- Its `live` address gives bus positions only. `?vans=1` and `?debug=1` answer "not found" there, so it never shows paratransit vans or the tracker's debug listing.
- The link switches itself off at `until` in `UNLISTED` (end of Friday 16 October 2026). Change or remove that date to keep it longer. `?demo=10:20` works as on the tracker for practice.
- Keep the glass blur at about 16px. Some browsers stop drawing a stronger blur on a large panel, and the panels are kept mostly opaque so the text reads either way.

### Call Center (City staff only)

The Public Works call center's transit page, at `/work/call-center/`. Transit calls are transferred to the call center, so this page puts what a call taker needs on one screen, in this order of importance: where every bus is, how long to its next stop, whether it is late, and step-by-step directions from where the caller is to where they want to go. Its page is `worker/private/call-center.html`; it uses the same live buses and timetable as the bus tracker (`worker/transit/`) and City Navigator's trip planner.

- **Who can open it.** Cloudflare Access signs people in with a one-time code sent to their email, and only `@cityoflc.us` addresses get in. The Worker checks Access's signed token itself as well (`worker/callcenter/access.js`), so the page stays shut even if the Access application is switched off or set up wrong. It needs two Worker variables: `CALL_CENTER_ACCESS_TEAM` (the team domain, such as `r3ai.cloudflareaccess.com`) and `CALL_CENTER_ACCESS_AUD` (the Application Audience Tag from the Access application). Until both are set, the page answers "Sign-in is not set up yet". `CALL_CENTER_EMAILS` (optional, comma separated) lets in extra addresses, for testing. There is no key in the address: the sign-in is the lock.
- **Setting up Access** (Cloudflare dashboard, Zero Trust): Access, Applications, Add an application, Self-hosted. Domain `r3ai.dev`, path `work/call-center`. Session duration: 15 days, typed as `360h` if the list has no 15-day choice, so staff enter a new code every 15 days. Identity provider: One-time PIN. Policy: Allow, Include, Emails ending in `@cityoflc.us`. Then copy the Application Audience (AUD) Tag into `CALL_CENTER_ACCESS_AUD`.
- **Bus board.** One card per route: the bus number, the stop it last passed, its next stop with minutes to it, and On time, N min late (amber, red from 10 minutes) or early. On time means 2 minutes early to 3 minutes late, as on the tracker. A route with no tracked bus says so and shows timetable times. Buses moving with no route yet (pulling out, lunch, going back to the facility) are listed under the cards.
- **Map.** Google Maps (Maps JavaScript API), with the five routes, stops once zoomed in, live buses and the planned trip. The browser needs its own key: set `GOOGLE_MAPS_BROWSER_KEY`, limited to the Maps JavaScript API and to the website `https://r3ai.dev/*`. Until it is set, the server's `GOOGLE_MAPS_KEY` is used, which must then also allow the Maps JavaScript API. If the map cannot load, the board and directions still work.
- **Search.** Both trip boxes and the Stop tab search bus stops (by name or number) from the timetable, and everything else (addresses, businesses, places) through Google Places only, never OpenStreetMap (`googleSearch` in `worker/navigator/search.js`, at `<page>/api?q=`, using `GOOGLE_MAPS_KEY`). There is no built-in list of places. Each result shows the walk from its nearest stop and is flagged when far from a route.
- **Directions.** City Navigator's planner (walk, one bus or two with a change, walk), with times moved for the live bus when the trip is today. "Leave at" takes a day and a time. Each option's steps can be copied as plain text with **Copy directions**, to read out or paste into an email or text. The Stop tab gives the next buses at a stop, or the closest stops to an address with theirs. The Info tab has fares, rules, phone numbers, posted notices and the weekdays with no service, read from the timetable.
- `?demo=10:20` runs it at that time today on simulated buses, for training. Its `live` address refuses `?vans=1` and `?debug=1`, like City Navigator's.

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
