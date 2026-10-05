---
title: Standing up a website in a weekend
date: 2026-10-04
section: home
order: 42
topics: Using AI, This site
summary: This site is brand new. Here is what I did, what the AI did, and why I could not load my own website the day it went live.
---

You are reading the result of this one. The longer story is in [How this site got built](/blog/how-this-site-got-built/). This is the short version, with the lessons.

## What I wanted

One site with two sides: what I build at work and what I build at home. A blog under both. A place to put my games. A name that had something to do with AI, on a domain that was cheap.

## Picking the name

I liked "R Cubed" for Robert, Rachelle and River. Claude checked which versions of the name were available across many domain endings in a batch, with prices. I picked r3ai.dev and registered it myself.

## Building it

Claude built the whole site:

- A home page, the two sections, a blog and an About page.
- A small script that turns plain text files into finished pages, so adding a post means adding one text file.
- A feed and a site map.

I created the hosting account, connected it and set up the place where the files live. Once those were connected, the site was live.

## I did not like it

The first design was plain. I said so, and asked for something that would look current in 2027: glass effects and modern styling. It took four rounds to get to what you see. Saying "I do not like this" is allowed. It costs one message.

## My own site would not load

Then I could not open the site on my computer at home. My phone could.

Claude checked from my computer and found the cause. My home router had looked up the address before the site existed, been told "no such site," and remembered that answer. The site was fine. My router was out of date.

The fixes were to wait half an hour, check from my phone on cellular data, or unplug the router and plug it back in. I asked Claude to restart the router for me. It declined, because that meant entering the router's access code, and gave me the steps instead. In the end the router caught up on its own.

## Where it falls short

I still had to make the accounts, pay and approve things. That is as it should be. And a site needs something worth reading, which no tool supplies.

```prompt
I want a personal website with [two sections: work and home] and a blog. Before you build anything, ask me what you need to know.

Then suggest a short name, check which domain endings are available and what they cost, and tell me which steps only I can do, like creating accounts and paying.
```

---

*Part of the series [27 ways I actually use AI](/blog/ways-i-use-ai/). Claude drafted this post from the record of our work together.*
