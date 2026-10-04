---
title: A countdown sign for bus stops, built from a $32 board
date: 2026-10-04
section: work
order: 8
topics: Transit tools
summary: Commercial e-paper bus stop signs cost thousands of dollars each. I'm building a single-stop prototype around a $32 e-paper board and a long-range radio.
---

"When is the bus coming?" is the question every rider has. A sign at the stop that counts down the minutes answers it without a phone.

You can [try an on-screen version of the sign](/demos/stop-sign/) fed by made-up buses.

## The price of the off-the-shelf answer

The commercial e-paper signs I priced ran roughly $3,500 to $5,000 each, plus a monthly fee of about $50 to $150 per screen. Multiply that by a system's worth of stops and it never gets past a budget meeting.

## What the sign has to be

I wrote the requirements before I looked at parts.

- A screen at least 4 inches by 2 inches.
- No more than 1.25 inches deep.
- Fully enclosed against weather.
- Battery powered, because most stops have no electricity.

## The parts

- An Elecrow CrowPanel, which is an ESP32-S3 board with a 5.79 inch e-paper screen built in. About $32.
- An RFM95W LoRa radio on 915 MHz. LoRa sends tiny messages over long distances on very little power, and a countdown is a tiny message.
- A rechargeable LiPo battery.
- Code written in Arduino.

E-paper matters here. It only uses power when the picture changes, and it's readable in direct sun, which is where bus stops are.

## The idea I talked myself out of

For a while I thought the answer was a jailbroken Kindle. It's cheap and it has a good screen. It also has the wrong shape and no weatherproofing, and it would be a support headache forever. I dropped it.

## Where it stands

This one is in progress. The plan is a single working stop first, fed by the [live vehicle positions feed](/blog/live-bus-positions/). Once one sign is working at one stop, I'll write up the build properly.
