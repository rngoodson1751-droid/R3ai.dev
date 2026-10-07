# r3ai.dev

Robert Goodson's personal site. Read `README.md` for how content, the build and publishing work.

## Working on the site

- Edit `src/`, `content/`, `static/`, `build.mjs` or `worker/`. Never edit `dist/` by hand: run `node build.mjs` and commit the rebuilt `dist/` with the change.
- Pushing to `main` publishes. Cloudflare deploys the Worker `r3ai-dev` from this repo within a minute or two.
- The service worker (`src/sw.js`) is network-first, so published changes show up right away. If you change what it caches, bump the `PAGES` cache name.
- No dependencies and no framework. Keep it that way unless Robert asks otherwise.
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
- The Zonar and Geotab logins are Worker secrets. Never write them into a file, a commit or a command.

## Limiting Factor (unlisted)

- A tool Robert is developing for local governments: staff log what holds a service back, and it ranks the limits by monthly cost and age. It lives in `worker/private/limiting-factor.html` and `worker/limits/api.js`; `README.md` has the map under "Limiting Factor". It uses the site's blues, greens and clear glass with its own type (Overpass and IBM Plex), in light and dark.
- The data is in the `lf_*` tables of `r3ai-requests`. It holds the Transit Division's real services, steps and roles, which Robert and his staff edit on the page; do not overwrite them from here without asking. Rows with `example = 1` are made-up samples. Never write a real person's name into a report.
- After changing it, test with `npx wrangler dev --local` (the AI summary only works on the live site).

## Design rules

- The look is iOS-style glass over a slow water shader, mostly transparent, in blues and greens only. Robert has approved the current layout and colours, so change them only when he asks.
- Colours come from the tokens at the top of `src/styles.css`, with `light-dark()` for the two themes. Check both themes and a phone width before publishing.
- The blue to green gradient (`--tide`) is for primary buttons, the current nav pill and small marks. Only floating controls use `.glass`; content sits on `.sheet`.
- Headings are Newsreader, body text is Geist, content is left aligned.
- The home page cube is a working 3 by 3 puzzle. Its markup is generated by `cubeHtml()` in `build.mjs`, and the turning logic is the `cube` block in `src/site.js`. Tile colours are the `.n0` to `.n5` rules in `src/styles.css`.
- Respect `prefers-reduced-motion` and keep every page usable without JavaScript.
- Site copy uses no em dashes.
