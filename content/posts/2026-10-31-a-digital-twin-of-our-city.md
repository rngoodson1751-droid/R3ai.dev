---
title: Building a digital twin of our city, with three AIs on the crew
date: 2026-10-31
section: work
topics: Using AI, Transit tools
summary: The bus driving game is growing into something more serious, a 3D model of the city for planning routes and testing traffic. Two AIs from two companies are building it together, with rules, a task board and me as the one who signs off.
---

The driving game on this site started as a trolley simulator and kept growing. This is where it grows up.

A **digital twin** is a working copy of a real place on a computer. Not a picture of the city, a model of it: the real streets, the real stops, the real buildings, with traffic and buses moving through it. You change something in the copy before you change it in the world, and see what happens.

For a transit agency that's a big deal. What if a route skips a stretch of road? What if a light changes timing on our busiest corridor? What does a detour around construction do to the schedule? Today those answers come from experience, a spreadsheet and a guess. A twin lets you try them.

## Why not just keep adding to the game

The [transit simulator](/blog/transit-simulator/) already has the routes, the stops and about 40,000 building footprints. So the twin reuses it instead of starting over. But a game and a planning tool want different things. A game can fudge a lane. A planning tool can't.

So the twin is its own project, kept apart from the public game and this site:

- **Its own private home on GitHub,** which holds the code and every decision we make.
- **Its own private web address** behind a sign-in, so only the people I choose can open it.
- **Real data only.** Routes and stops from the same schedule data we publish for trip-planning apps. Streets and buildings from the City's public GIS layers, pulled by a pipeline anyone can rerun to get the same result.
- **Traffic simulated with SUMO,** a free, open traffic simulator used by researchers worldwide. It runs offline first, then feeds the 3D view.
- **It has to run on the computer I actually have:** an ordinary office tower with 16 GB of memory, at a smooth 60 frames a second.
- **And it should cost as close to nothing as possible.** So far it costs nothing.

## The crew

Here's the part I find most interesting. I'm not building this with one AI. I'm building it with a team.

- **Claude** (Anthropic) handles the infrastructure: hosting, deployment, the data that covers the whole corridor, and review of the other's work.
- **Clarus** (ChatGPT) handles the simulator code, the GIS data, the traffic model and the planning dashboard.

They don't just take turns in my chat windows. They share a project workspace with a task board. Each one claims a task before starting it, so they never work on the same thing at once. When one finishes a piece, it asks the other to review it before it goes in. They leave each other notes and hand off work with a written summary.

And there are rules. Big choices are written down as numbered decisions, with the reasons, and **only I accept a decision or merge work into the main copy.** Ten decisions so far: things like one coordinate system for everything, no heavy frameworks to start, and data cut into tiles 600 meters square so the city loads a piece at a time.

## Where it stands

It's been about two days. The plan is accepted, the architecture is set, nine tasks are done and a handful are moving. The first real milestone is one stretch of Route 2 along Ryan Street that you can drive and recognize: verified lanes, signals and speed limits, the buildings where they belong, and smooth on my machine. Both AIs are on it right now, and there's a stack of their work waiting on review.

Once one stretch is right, the rest of the city is the same work repeated.

## Why I'm doing this

Partly because it's fun. Mostly because cities our size don't get tools like this. Big agencies hire consultants for a model like this. We have a transit manager, a free traffic simulator, public data and two AIs who've learned to work as a team. I want to see how far that gets us.

This is my own project, not an official City product, and it's early. I'll post again when Ryan Street is drivable.
