---
title: Replacing the paratransit spreadsheets
date: 2026-10-04
section: work
order: 7
summary: A small web app for booking paratransit rides, assigning drivers and producing the reports, built with Node.js, Express and SQLite.
---

Paratransit is the door-to-door service for riders who can't use the regular buses. Ours is small: two or three drivers and somewhere between eight and fifteen rides a day. It ran on spreadsheets.

## Why the spreadsheets had to go

A spreadsheet is fine for a list. It's bad at a schedule that changes all day. Every ride gets typed by hand, and every report starts with counting rows.

## What the app does

- A daily schedule that shows every ride and its status.
- A passenger list, so a repeat rider is two clicks and not a retyped address.
- Driver assignment for each ride.
- Mileage and drive time filled in from Google Maps directions, with a manual override for when the map is wrong.
- Reports in the shape our federal reporting needs, and an export to Excel for anyone who still wants the spreadsheet.
- A phone view for drivers that shows only their rides for the day.
- A tab for the vehicles themselves.

Under the hood it's plain HTML, CSS and JavaScript in the browser, with Node.js and Express on the server and a SQLite database, which is a single file.

## The part I'm oddly proud of

I didn't have admin rights on my work computer, so I couldn't install Node.js the normal way. The first version ran from a USB drive with a portable copy of Node on it. Plug it in, double-click and the app was running. That let me keep building and showing it to people without waiting on an install.

## What you won't see here

Rider information is protected, and none of it will ever appear on this site. When I post screenshots, every name and address in them will be made up.
