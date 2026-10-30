# r3ai.dev

Robert Goodson's personal site. Read `README.md` for how content, the build and publishing work.

## Working on the site

- Edit `src/`, `content/`, `static/`, `build.mjs` or `worker/`. Never edit `dist/` by hand: run `node build.mjs` and commit the rebuilt `dist/` with the change.
- Pushing to `main` publishes. Cloudflare deploys the Worker `r3ai-dev` from this repo within a minute or two.
- The service worker (`src/sw.js`) is network-first, so published changes show up right away. If you change what it caches, bump the `PAGES` cache name.
- No dependencies and no framework. Keep it that way unless Robert asks otherwise.
- Everything pushed must be mobile ready. This is Robert's standing rule (10 October 2026). Before pushing, check every new or changed page, post, game or tool at phone width (about 390 px wide, and sideways for games), and give anything interactive touch controls. A game that needs a keyboard or controller is not finished. The rule applies to work from 10 October 2026 forward. Pages and games already on the site before then do not need to be gone back over unless Robert asks.
- To test with the request form working, run `npx wrangler dev --local` after `npx wrangler d1 execute r3ai-requests --local --file worker/schema.sql`. Ask the site needs Cloudflare's AI service, which has no local version, so test it on the live site.

## Things Robert may ask for

- "Any new post requests?" Query the D1 database `r3ai-requests` (table `requests`, `status = 'new'`) through the Cloudflare connector.
- "Approve request N" or "mark it posted". Update `status`, `public_title` and `post_url` as described in `README.md`. Write `public_title` yourself as a short neutral topic. Never copy the visitor's wording, name or email into it.
- "Which posts are people reading?" or "What are people asking?" Query the `hits` and `asks` tables in the same database (queries are in `README.md`).
- A new post. Add `topics` to its header, and after building run `node tools/og.mjs <slug>` so it gets a link preview picture.
- Photos for project cards. `projectCards()` in `build.mjs` already supports an `image` on each project. Pictures are only switched on for the games page (`pictures: true`); turn them on for the section pages once every card there has one.

## The bus tracker (unlisted)

- It lives in `worker/private/lobby-display.html` and `worker/transit/`; `README.md` has the map under "The bus tracker". It keeps its own dark navy look, not the site's glass style, and its header says LC TRANSIT in capitals beside the City logo.
- "Post an alert" or "add a notice": insert a row in `transit_alerts` through the Cloudflare connector, with Spanish wording in `title_es` and `body_es`, and an `ends_at` (UTC) unless Robert says it is open-ended. "Take the alert down": delete the row.
- Buses go by the last part of Zonar's fleet number: `0609-47` is Bus 47, on the page and in conversation.
- "Bus N is on Route R today": insert into `transit_overrides` (`bus` can be the short number, such as `47`).
- "New GTFS": unzip it, run `node tools/gtfs.mjs <folder>`, run `node tools/transit-test.mjs`, then commit.
- After changing anything in `worker/transit/`, run `node tools/transit-test.mjs`.
- A bus gets a route only after passing three of that route's own stops in order; until then it is grey with no route. That wait at the start of the day is intended. Do not bring back route guesses from the line a bus is following: the drive in from the facility along Broad Street fooled them (6 October 2026).
- Each route runs 11 trips a day with a lunch break: nothing leaves at 12:45 pm. Buses keep their routes through it, so they should not go grey after the 1:45 pm departure.
- The tracker follows the buses every minute on weekdays through a Cloudflare schedule (`triggers` in `wrangler.jsonc`, `tick` in `worker/transit/live.js`), whether or not the page is open. If buses are grey with no route long after leaving the terminal, check that the schedule is still running: `SELECT t FROM transit_state WHERE k = 'tick'` should be under two minutes old.
- Positions come from Zonar and Geotab, each bus using whichever heard from it last. "Why isn't bus N showing?": open `<page address>/live?debug=1` first.
- Paratransit vans (Geotab names 609-002 to 609-008) are not buses and must never reach the lobby display. Their positions go only to the Para-Transit app through `live?vans=1`, which requires the `PARA_FEED_KEY` secret header. Never relax that check.
- The Zonar and Geotab logins are Worker secrets. Never write them into a file, a commit or a command.
- Stop passages (since 30 October 2026): every refresh, `worker/transit/log.js` records when each matched bus passed each stop into `transit_passages` (route, trip, stop, time, delay; no positions, nothing about riders). The Lake Charles Digital Twin uses it to check modelled run times. "How late was Route 2 this morning?" is a query on that table. A failure there is logged and never stops the tracker.

## City Navigator (unlisted, temporary)

- A rider guide for Robert's leadership class bus exercise: `worker/private/get-around.html`, with its `UNLISTED` entry in `worker/index.js`. `README.md` has the details under "City Navigator". Robert named it City Navigator; its address stays `/work/get-around/`. Its look is bright frosted glass for reading in full sun (near-black on near-white, large type), not the tracker's dark navy. Keep that contrast in any change. It opens on a start screen (a live sentence about the next bus, the five routes, a Where to? search, three ways in) over a full-screen map; the tabs appear after that. On a phone the panel is a sheet with three heights. Robert asked for this landing on 11 October 2026 and wants it to feel like a new Apple interface: keep it uncluttered.
- Its link went out to the class by email and QR code on 11 October 2026. Never change its address or key.
- After changing it, check it at phone size (about 402 by 690, which is an iPhone 17 Pro in Chrome) with location on and off, on a weekday time and on a day with no service.
- It switches off at `until` in its `UNLISTED` entry. Its `live` address must keep refusing `?vans=1` and `?debug=1`.

## Call Center (City staff only)

- The Public Works call center's transit page: `worker/private/call-center.html` at `/work/call-center/`, with `worker/callcenter/access.js`. `README.md` has the details under "Call Center". Robert asked for it on 16 October 2026: live bus locations, time to next stop, late or on time, and Google search with step-by-step directions are what matter most. Keep those first.
- Only `@cityoflc.us` emails get in, through Cloudflare Access (one-time code by email, 15-day sessions). The Worker checks the Access token itself and refuses everything until `CALL_CENTER_ACCESS_TEAM` and `CALL_CENTER_ACCESS_AUD` are set. Never add a way around that check.
- Map and search are Google only (Robert's choice): no OpenStreetMap, and no built-in list of places. Its `live` address must keep refusing `?vans=1` and `?debug=1`.
- "Stop N has a bench and shelter": upsert into `transit_stop_features` (each feature 1, 0 or NULL for not checked) through the Cloudflare connector, with `updated_by` set to Robert's request and `updated_at` to now. Editors on the page are the addresses in `CALL_CENTER_EDITORS`.
- After changing it, check it at about 1440 wide, 1024 wide and 390 wide, with `?demo=10:20`.

## Limiting Factor (unlisted)

- A tool Robert is developing for local governments: staff log what holds a service back, and it ranks the limits by monthly cost and age. It lives in `worker/private/limiting-factor.html` and `worker/limits/api.js`; `README.md` has the map under "Limiting Factor". It keeps its own blues, greens and clear glass (from before the October 2026 Liquid Glass restyle) with its own type (Overpass and IBM Plex), in light and dark.
- The data is in the `lf_*` tables of `r3ai-requests`. It holds the Transit Division's real services, steps and roles, which Robert and his staff edit on the page; do not overwrite them from here without asking. Rows with `example = 1` are made-up samples. Never write a real person's name into a report.
- After changing it, test with `npx wrangler dev --local` (the AI summary only works on the live site).

## Design rules

- Concept: "Glass on the lake" (25 October 2026). Robert gave full creative permission and asked for something extraordinary, built on Apple's current Liquid Glass. There is no brand colour. The whole site is lit by the real sky over the lake he sails on, right now.
- The sky: `SKY` in `src/site.js` works out the sun's height and direction over the lake (30.22 N, 93.22 W, America/Chicago) and picks a palette for night, twilight, sunrise or sunset, golden hour or day, in light and dark versions (`LIGHT`, `DARK`). The wallpaper shader (`SKY_GLSL`, drawn on `#silk`) adds a sun glow where the sun is and stars at night in dark mode. `?sky=18:40` previews any time, and the sky pill on the home page opens a slider that relights the site. `SKY` also sets the CSS colours `--sky`, `--sky2` and `--sun`.
- The sky reaches the interface only lightly and always mixed with ink: the "R Cubed" headline (`.sky-ink`), section titles, the current nav item, primary button glows, link underlines, the sun dot and selection. Keep text contrast safe in every palette.
- The home hero: three drops of liquid glass, Robert, Rachelle and River (`drops` in `site.js`, canvas `#drops`). They are a WebGL metaball field that refracts the same sky with a thick-lens bend, a slight colour split at the rim, a reflection, a specular highlight facing the sun, a shadow and a caustic. They drift, can be dragged or flicked with mouse or touch, merge like mercury when pushed together, and jump when tapped. A touch that starts on a drop stops the page scrolling; anywhere else scrolls as normal. Without WebGL, three still CSS bubbles show instead.
- The cube is a working 3 by 3 puzzle in its own section under the hero. Its markup is generated by `cubeHtml()` in `build.mjs`, the turning logic is the `cube` block in `src/site.js`, and tile colours are `.n0` to `.n5` in `src/styles.css`: white, graphite, orange, yellow, pink and violet.
- Glass comes in two strengths. Floating controls (`.glass`: the top bar, the phone tab bar, glass buttons) are the clearest glass (`--clear`), and in Chromium they also refract the page through the SVG filter `#lg` in the page template (`.lens` on `<html>`). Content sits on frosted `.sheet` surfaces (`--frost`). Both get the specular rim drawn by their `::before`; do not use `::before` on those elements for anything else. Clickable sheets and cards catch a pointer glint on `::after`.
- The bars have an iOS scroll edge (`body::before` and, on phones, `body::after`) that blurs content sliding under them.
- Colours come from the tokens at the top of `src/styles.css`, with `light-dark()` for the two themes. `--tide` is the solid ink fill for primary buttons and pressed chips; `--blue` and `--green` are neutral aliases kept so older rules still work. Check both themes, several times of day (`?sky=`) and a phone width before publishing.
- Type is San Francisco on Apple devices and Inter elsewhere (`--display`, `--body`), heavy headings with tight tracking. Content is left aligned.
- The unlisted tools (bus tracker, City Navigator, Call Center, Limiting Factor) keep their own looks.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency`, and keep every page usable without JavaScript.
- Site copy uses no em dashes.
