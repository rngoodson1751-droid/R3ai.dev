---
title: Building custom software without being a professional developer
date: 2026-10-04
section: work
order: 35
topics: Using AI, Transit tools
summary: I taught myself to build web pages. With AI doing a large share of the typing, I now build the tools my division needs when nothing off the shelf fits.
---

I am not a software engineer. I taught myself web development because the tools I needed either did not exist or cost more than a small transit system can pay.

## What I have built

- **A driver scheduling system** with a [dispatch board](/blog/driver-dispatch-board/) that runs in a browser.
- **A [paratransit scheduling app](/blog/paratransit-scheduling-app/).**
- **A [live feed of bus locations](/blog/live-bus-positions/)** in the standard format that trip-planning apps read.
- **A [bus stop arrival display](/blog/bus-stop-display/)**, still a prototype, built on a small e-paper board.
- **A [purchasing wizard](/blog/procurement-wizard/)**, which started life as a memo. See [Turning a policy into a tool](/blog/turning-a-policy-into-a-tool/).
- **An emergency operations portal** for coordinating a hurricane shelter: one web page, no installation, built to work on a phone.

## How it works in practice

I describe what I need in plain language. Claude writes the code. I run it, see what is wrong, and say so. We repeat that until it works.

The shelter portal shows the part people do not expect. Claude did not just write it. It opened the page in an automated browser at three phone widths, checked all eleven screens for anything that ran off the edge, and found two real layout bugs. It also told me which wide tables were meant to scroll sideways, so I would not mistake them for bugs.

It keeps a list of what is not done, too. For the portal: saving your work when the page refreshes, an offline indicator, search on the roster and data export.

## Why single files

Several of these are one HTML file. That is on purpose. A single file can be emailed, opened from a thumb drive and used when the network is down, which is exactly when an emergency tool is needed.

## Where it falls short

- You still have to understand what you are building well enough to test it.
- Software that people rely on needs backups, security and someone who will maintain it. AI does not take on that responsibility. I do.
- It tells me what it could not test. I take that list seriously.

## Try it

Start with something small that annoys you every week. Describe it the way you would to a new employee.

```prompt
I'm not a professional developer. Every week I have to [describe the annoying task the way you'd explain it to a new employee].

Build me a small tool for it that runs in a web browser as a single HTML file, with nothing to install. Ask me questions first if anything is unclear. When you're done, tell me what you tested, what you couldn't test and what isn't finished.
```

---

*Part of the series [27 ways I actually use AI](/blog/ways-i-use-ai/). Claude drafted this post from the record of our work together.*
