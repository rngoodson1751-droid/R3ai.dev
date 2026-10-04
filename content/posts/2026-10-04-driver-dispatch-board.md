---
title: A dispatch board for when a driver calls in
date: 2026-10-04
section: work
order: 6
topics: Transit tools
summary: An eight-week driver rotation in a spreadsheet, plus a one-page board that works out who covers which route when someone calls in.
---

The hardest part of scheduling a small bus system isn't the schedule. It's the early morning phone call when someone is out and every route still has to leave on time.

You can [try a demo of the board](/demos/dispatch-board/) with made-up drivers and routes.

## The problem

We run five routes with hourly trips from 5:45 in the morning to 5:45 in the evening, and nine drivers to cover them. On paper that works. In practice the plan changes the moment one person is out, and whoever is on the phone has to work out the new plan from memory.

## What I built

Two pieces that share the same data.

The first is a spreadsheet with an eight-week rotation. It has a read-me page, the driver roster, the daily schedule, the weekly rotation and a call-in quick lookup. Anyone can open it and see who drives what on any day.

The second is the dispatch board. It's a single web page that opens in any browser, with nothing to install.

- Pick the rotation week and the day.
- Tap "Called in" next to anyone who is out.
- The board reassigns their route from the extra board.
- If the extra board is empty, it falls back to supervisors.
- If nobody is left, it flags the route "NO COVERAGE" in a way you can't miss.

There's also a custom day mode for the days that fit no pattern. Every assignment becomes a dropdown, and the board warns you if you put the same person on two routes. One button resets the day and another prints it.

## What I learned

The rules were already in people's heads. The work was getting them written down precisely enough for a computer to follow. Who covers first? Who covers next? What happens when nobody is left? Once those answers are on paper, the code is the easy part.

I also learned to keep the spreadsheet. People trust a spreadsheet. The board sits on top of it instead of replacing it.
