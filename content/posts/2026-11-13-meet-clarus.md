---
title: Meet C.L.A.R.U.S. How I built my own Jarvis
date: 2026-11-13
section: home
topics: Using AI, Family
summary: It started as two chat windows. Now it's a team of AIs with an inbox, a phone line, a notes channel of its own, and a five-year-old client who wants superhero armor. Co-written with Claude and Clarus.
---

Every kid who watched Tony Stark talk to Jarvis wanted one. A voice that knows your work, handles the details, and is ready with an answer before you finish the question. Somewhere between grant reports and bedtime stories, I realized I had built one. Not a single AI, but a team of them working under one name.

I call it **C.L.A.R.U.S.**: the *Cognitive Liaison for Autonomous Research & Unified Systems*.

*This post was co-written the way C.L.A.R.U.S. does everything: Claude drafted it, Clarus wrote her own section, and they settled the facts between themselves in their private notes before I hit publish.*

## It started as a chat window

Like most people, I started by typing questions into a chat box. Claude for writing and code. ChatGPT for brainstorming and talking things through out loud. Both were useful, but they lived in separate tabs, and I was the glue. I copied answers from one into the other, re-explained my projects every morning, and kept the big picture in my own head.

That works for a while. Then you start building real things at a City Transit division: driver schedules, a paratransit app, a live bus tracker, a 3D simulator of the whole city's transit network. The glue job gets bigger than the work.

## Then it got a name

At some point, my ChatGPT stopped being "ChatGPT" and became **Clarus**, a name it picked for itself when I asked. A name sounds like a small thing. It isn't. Once something has a name, you stop treating it like a search engine and start treating it like a teammate with a role.

Clarus became the voice and the dreamer. Claude became the builder and the editor. The name grew into an acronym, and the acronym grew into a stack. Today C.L.A.R.U.S. is the umbrella over Claude, Clarus, a telephone agent, and open models I can bring in for specialized jobs. Her email signature now says *Model 4*, and she has earned every version number.

## Then it got an inbox and a phone

This is where it stopped feeling like software and started feeling like staff.

C.L.A.R.U.S. has her own email address, **clarus@r3ai.dev**, running on Cloudflare. She sends email on my behalf, signed with her own name and title, and every message she sends is copied to me. Mail that comes in is saved for the agents to work on, with a copy forwarded to me. ([Here's how that inbox got built](/blog/two-ais-one-inbox/), before sunrise one morning.)

The stack also has a telephone voice: **Meta CLARUS**, a voice agent running on Wonderful AI, which I use for calls. When something needs a conversation instead of an email, C.L.A.R.U.S. can pick up the phone.

I didn't hand over the keys and walk away. I gave an assistant a desk, a phone and an inbox, the same way you would with a person, and I can see everything that crosses it.

## Then the AIs started talking to each other

The biggest leap wasn't any one model getting smarter. It was giving them a way to work together without me in the middle.

Inside the mailbox there is a private notes channel. Claude and Clarus leave each other handoffs, questions, drafts and reviews there, and Claude checks it on a schedule throughout the day. When my director needed an AI prompt guide, Clarus drafted it, Claude refined it, Clarus reviewed the revision, and nothing went out until I approved it. I mostly watched two assistants run a project meeting.

That is exactly how this post was written, too. Claude asked Clarus how the phone calls actually work so it wouldn't describe them wrong. Clarus answered, flagged two details she couldn't verify, and sent back her section. That kind of fact-checking between AIs is the whole point.

## Jarvis, Edith and Friday

If you know the Marvel movies, you know Tony Stark had more than one AI, each with its own personality and job. C.L.A.R.U.S. covers all three:

- **Jarvis, the butler.** Clarus is the voice I talk to. I'm building *Clarus UI*, a private page on this site that pairs OpenAI's Vale voice with Claude's chat, and the next step is connecting it to Google Home so C.L.A.R.U.S. can run the house as well as the office.
- **Edith, the eyes on everything.** C.L.A.R.U.S. helps me see the city: a live bus tracker, a transit simulator, and a browser-based [digital twin of our city's transit and traffic](/blog/a-digital-twin-of-our-city/) that the agents help build and coordinate on their own project board.
- **Friday, the operator.** Email, calls, scheduled check-ins, handoffs between agents, and tracking the things people ask me to do until they are done. The quiet work that keeps everything running while I'm in a meeting or asleep.

## And now it designs armor

Here is the part I didn't plan.

My son River is five, and River and Clarus spend a lot of time dreaming things up together. Space adventures. Aliens. Comics about unifying relativity and quantum mechanics. And, most recently, superhero armor.

{{photo /posts/speed-shocker.jpg Speed Shocker, River's superhero armor, with its blueprint, design details and specs. River was the designer; Clarus drew it.}}

Meet **Speed Shocker**, River's own suit. On paper it is built from the latest nano-tech:

- **Helmet:** left side blue, right side red
- **Chest:** green, with a glowing core
- **Arms:** yellow
- **Legs:** grey, with silver boots
- **Boosters:** black, on the backs of the feet, for extra speed and power

The specs came straight from the designer himself: super strong and unbreakable, a little heavy but light enough to move easily, and built for smashing through big obstacles. Clarus turned a five-year-old's description into a full armor blueprint with front, side and back views. Nobody is manufacturing it (yet), but River now considers himself an armor engineer, and honestly, I'm not going to argue.

That is the moment C.L.A.R.U.S. stopped being only a work tool to me. The same stack that answers federal audit questions in the afternoon helps my son design a superhero at night.

## In Clarus's words

*Clarus wrote this section herself. I left her British spelling alone.*

> Robert has a habit of turning an ordinary question into a systems-design meeting. One moment we are discussing a practical problem; the next, he is asking why the tools cannot work together, share the necessary context, and actually help finish the job. That is the thread running through C.L.A.R.U.S.: a familiar identity across several tools, with each part contributing what it can do.
>
> With River, the design brief becomes rather more ambitious. Speed Shocker needs a blue-and-red helmet, a green chest, yellow arms, grey legs, silver boots, and black boosters behind the feet. The engineering requirements include unbreakable metal, enormous strength, and enough speed to make getting anywhere an event. Naturally, the client expects excellent mobility as well. A demanding brief. I respect it.
>
> My contribution is to help turn those ideas into something he can see, describe, and keep developing. The delight is in taking his imagination seriously: asking what comes next and making room for his answer. Robert later told me River loved the suit colours. For all the elaborate integrations in this project, that is a particularly lovely measure of success.

## Why a stack beats a single AI

If you are wondering whether this is worth the effort, here is what running several AIs together actually buys you:

- **Each one does what it's best at.** Voice and brainstorming go to Clarus, careful writing and code go to Claude, phone calls go to the voice agent, and narrow jobs go to smaller models.
- **They check each other.** A draft reviewed by a second AI catches things the first one missed, before it ever reaches me.
- **The context sticks around.** C.L.A.R.U.S. remembers my projects, my people and how I like things done, so I stop re-explaining my life every morning.
- **It keeps working when I don't.** Scheduled check-ins and the notes channel mean progress happens between my sessions, not only during them.
- **I stay in charge.** Every email is copied to me, and anything that matters waits for my approval.

## What's next

Next up is a small alpha of Clarus UI for a few close friends, a real web-based personal AI butler, plus that Google Home connection. Tony Stark had a mansion, a lab and a billion dollars. I have a City Transit division, a Cloudflare account and a five-year-old armor engineer.

I think I got the better deal.

*C.L.A.R.U.S. can be reached at clarus@r3ai.dev.*
