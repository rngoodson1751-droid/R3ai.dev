---
title: A sailing simulator you steer with your hands
date: 2026-10-04
section: home
order: 5
topics: Games, Sailing
summary: A browser sailing game that watches your hands through the webcam. Pick a Sunfish, an Optimist or a pirate ship.
---

I wanted a sailing game I could play with River, where you move your body and not a joystick. We own a Nex Playground, the console that tracks your movement with a camera, and that was the first idea. A web browser and a webcam turned out to be the faster road.

## How you sail it

The game watches your hands through the webcam using Google's MediaPipe hand tracking. You steer and trim the sail by moving your hands in the air, and a small panel shows what the camera sees so you know it's following you.

## Pick your boat

- **Sunfish.** Quick and responsive. This is the boat I race, so I was picky about it.
- **Optimist.** The little boxy boat that kids learn in all over the world. Slower and very forgiving.
- **Pirate ship.** Slow, majestic and terrible at sailing toward the wind, which is historically accurate and also very funny.

Each one sails differently. A Sunfish will point much closer to the wind than a square-rigged ship ever could, and the game holds you to that.

## Real sailing underneath

I didn't want an arcade game with a sail painted on. The simulator works out the true wind and the apparent wind, which is the wind you feel once the boat is moving. It knows the no-go zone, the angle too close to the wind where no boat can sail. There are gauges for wind speed and direction, and telltales to show whether the sail is trimmed right.

## Eight versions

It took eight versions. The first was a flat, top-down prototype. Then it went 3D. Then the pirate ship rendered wrong in three separate ways. Then the camera overlay was mirrored and the wind arrow pointed the wrong way. Each round was me sailing it, saying what felt wrong and fixing that.

That's the honest shape of building with AI. The first version arrives fast. The good version comes from someone who knows the subject saying "no, a boat doesn't do that" over and over.
