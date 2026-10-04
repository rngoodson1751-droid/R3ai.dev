---
title: A hometown bus simulator from real map data
date: 2026-10-04
section: home
order: 40
summary: It started as a toy trolley on a made-up grid. It became a driving game on our real streets, with real routes and tens of thousands of real buildings.
---

This one sits between work and home. I wanted a small driving game where you pilot a trolley around downtown and pick up riders. It did not stay small. What is in the game is covered in [A driving game set on our real bus routes](/blog/transit-simulator/). This post is about how it grew.

## How it grew

**Version one** was a first-person trolley on a made-up grid of streets.

**Then I asked for our real routes.** Claude read the published transit schedule data, the same feed trip-planning apps use, and rebuilt the game around the five actual routes with their real names, colors and stops.

**Then I asked for the real city.** I supplied public map data: streets, addresses, parcels and the city limits. Claude rebuilt the world at true scale with real street names and more than forty thousand building footprints, later filled in with public building datasets.

**Then we added the fun parts:**

- A second vehicle, a 35-foot bus, modeled from a photo of the placard and the operator's manual.
- Controller support and two-player split screen.
- A radio with original music.
- A free-drive mode with item crates. The items are local: hot sauce rockets, blue crabs, a crawfish that slows you down and Mardi Gras beads as a shield.
- A five-lap grand prix on a real street circuit, with a five-light start and a podium.
- Driving physics based on the real weight and power of the vehicles.

People who have tried it like it. Somewhere along the way it stopped being a weekend toy and got a proper name: LC Transit Simulator.

## The data problems were the real work

- The first street file only had roads ending in Street, Drive, Road and Lane. No avenues, no boulevards, no highways. We needed a different file.
- The big map files were too large to upload in chat. Claude read them straight from my computer instead.
- Bus stops first appeared in the middle of the road and had to be moved to the curb.

## Making it look like home

I want the buildings to look real. My first idea was to use online street-level imagery. Claude explained that the terms of service for those services rule that out. The better plan is to film the routes myself with a 360 camera that records GPS. I picked a camera and have filming notes: where to mount it, what time of day and how fast to drive. I have not filmed yet.

## Where it falls short

It is still in progress and not posted here yet. The buildings are plain blocks until the filming is done.

---

*Part of the series [27 ways I actually use AI](/blog/ways-i-use-ai/). Claude drafted this post from the record of our work together.*
