---
title: How this site got built
date: 2026-10-04
section: home
order: 16
summary: A domain, a free host, no framework and four rounds of me saying "I don't like it yet." Notes on building r3ai.dev with Claude.
---

This site exists because I asked a question about a go-kart game.

I'd asked Claude to build a kart racer for River. Then I asked where I could put it so we could play it on the Xbox. A few questions later I owned a domain.

## The name

R cubed is Robert, Rachelle and River. I wanted something short that said both "family" and "AI". `r3ai.dev` was available and cheap, so that was that.

## How it's put together

- The domain is registered with Cloudflare, and Cloudflare hosts the site.
- The source lives on GitHub. When a change is pushed there, the live site updates about a minute later.
- There's no framework. A small build script turns plain text files into pages. A post is a text file with a title at the top.
- The games are single HTML files that sit beside the pages.

I described what I wanted in plain language. Claude wrote the code, tested it and published it.

## Four rounds of design

The first version was plain, and I said so. The second was full glass with every color at once, and I didn't like that either. The third was calm and warm, and then I second-guessed it. The fourth is this one: blues and greens, the colors I keep coming back to, with glass you can see the water through.

I'm telling you this because it's the real process. You don't need to know what you want up front. You need to know what you don't like when you see it, and be willing to say so.

## The showing off

A few things here are newer than they need to be.

- The background is a small shader that moves like slow water.
- The navigation bar bends what's behind it, like real glass, in browsers that support it.
- The cube on the home page spins when you drag it.
- Page titles slide into place when you move between pages.

Everything still works without them.

## The one thing that went wrong

The site went live and I couldn't open it. My phone could. My computer couldn't. The culprit was my home router, which had looked for the site before it existed and kept insisting it still didn't. It caught up on its own.
