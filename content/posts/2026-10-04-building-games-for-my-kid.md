---
title: Building games for my kid
date: 2026-10-04
section: home
order: 39
topics: Using AI, Games, Family
summary: I am not a game developer. Here is how one request became a twelve-mission space game with our whole family in it, and what I learned about directing an AI.
---

My son River loves rockets. I wanted to make him a game that knew his name.

[Play River's Rocket Works](/games/rivers-rocket-works/), or read [what is in it](/blog/rivers-rocket-works/). This post is about how it got made.

## River's Rocket Works

I asked Claude for a rocket-building game in a browser, with two requirements: it had to call River by name, and it had to tell him he is a great rocket engineer.

What came back is a 3D game in one file. You pick tanks, engines and boosters, read a flight forecast, and then fly: countdown, staging, orbit, landing, docking. A voice narrates. It works with a controller, a keyboard or a touch screen.

Then I kept having ideas, and it grew from seven missions to twelve:

- A Moon landing and a Mars rover delivery.
- A rover race on Saturn's rings.
- A storm rally on Jupiter, with a secret golden tornado.
- A wormhole run through an asteroid field.
- A race around the solar system starring the whole family.

In that last one River rides a star with a rainbow trail. Rachelle rides a unicorn. I drive a Viking ship pulled by two giant goats. Our white Lab, Justice Ruth Bader Ginsburg, competes as herself. I asked for a screen where you can pick any of us, so River does not always have to be River.

The praise changes each time he finishes a mission: rocket builder, aerospace designer, mission commander.

## What I learned about how it works

- I gave specific directions, one round at a time. "Slow the ship to three quarters speed" works better than "make it easier."
- Claude tested the game by playing it automatically from start to finish. Each time, it told me what it could not test: sound, a real controller and how it looks on a real screen. So I tested those.
- One level I had named after a famous movie. Claude renamed it to avoid borrowing someone else's trademark, and kept my jokes.

## Sloth Rocket Grand Prix

The other game is on this site and you can [play it now](/games/sloth-rocket-grand-prix/). I wrote about it in [its own post](/blog/sloth-rocket-grand-prix/).

## Where it falls short

The graphics are simple shapes, not artist-made models. And a game like this is never finished. There is always one more mission to add.

## Try it

Ask your kid what the game should be. Then type exactly what they said.

```prompt
Make a game for my [age]-year-old, [name], that runs in a web browser as one file. [Name] said it should be about: [type exactly what they said].

It has to call [name] by name and tell them they are a great [rocket engineer]. It should work with a keyboard and a touch screen. When you're done, tell me what you could not test.
```

---

*Part of the series [27 ways I actually use AI](/blog/ways-i-use-ai/). Claude drafted this post from the record of our work together.*
