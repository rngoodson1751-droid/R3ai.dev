---
title: Putting our buses on the map, live
date: 2026-10-04
section: work
order: 2
topics: Transit tools
summary: How I turned the GPS units already on our buses into a GTFS Realtime feed, and a live map for the public.
---

Our buses already had GPS units. The locations just weren't going anywhere a rider could see.

You can [watch a demo of the map](/demos/bus-map/) with made-up buses, and see the feed behind each one.

## The format that apps already read

Trip-planning apps don't want a custom feed. They want GTFS Realtime, an open standard for vehicle positions and arrival predictions. If you publish in that format, any app that knows the standard can read your buses.

So the job was translation. Take the GPS data and publish it as GTFS Realtime. I wrote that in Node.js with the standard `gtfs-realtime-bindings` library, which handles the compact binary format the standard uses.

## The hard part was not the map

Getting a dot on a map was the easy part. The hard part was trip matching.

The GPS knows where bus 12 is. It doesn't know that bus 12 is currently running the 9:45 trip on a particular route. The standard wants the trip, because that's how an app connects a moving dot to the schedule a rider is looking at. Working out which scheduled trip each bus is on, from only its position and the time, took most of the effort.

## What the validator taught me

I submitted the feed to Google. Their validator is strict, and it sent back errors I had to learn to read. One meant it couldn't fetch the feed at all. Others meant my predictions had a bus arriving or leaving a stop earlier than made sense. Each fix made the feed more honest.

## The live map

The second piece is a public map page. It uses Leaflet with OpenStreetMap tiles and refreshes every 15 seconds. It was approved for the City's website. I styled it in the same blue and green glass look this site uses, because apparently I have a type.

## If you run a small system

You may already own the data. The work is in the translation, and the standard is free.
