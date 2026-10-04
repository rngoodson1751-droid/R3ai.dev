---
title: Asking AI what a document is missing
date: 2026-10-04
section: work
order: 24
topics: Using AI, Office work
summary: I had a morning meeting about an old scope of work for a backup generator. I asked one question: what is wrong with this, and what is not in it?
---

I inherited a scope of work for a backup generator at our transit facility. It was a few years old, and I had a meeting about it the next morning. I had a feeling it was incomplete. A feeling is not something you can bring to your director.

## What I asked

I uploaded the scope and asked Claude to review it for errors and gaps.

## What came back

Two lists.

**Problems inside the document:**

- A cost estimate that was years out of date.
- The wrong division listed as the project owner.
- A header on the cost sheet that belonged to a different building.
- A generator size chosen before anyone had studied the electrical load.
- A line item that looked like it came from a different project.
- Small arithmetic inconsistencies.

**Things that were not in the document at all:**

- Our parking lot drains run straight to the lake next door, which matters a great deal if you are storing fuel.
- We are downtown, so there is a noise ordinance to meet.
- A generator on an open slab is exposed to weather and theft.
- Nobody had compared fuel types.
- Permits, and room to grow if we ever charge electric buses.

Some of those I already suspected. What the AI did was turn my worries into an organized list I could hand to someone.

It then wrote a one-page memo with a fuel comparison table and four next steps. It left me one question in the draft: where is the money coming from? The answer changes which federal requirements apply.

## Where it falls short

Documents age, and people do good work with the information they have at the time. The AI does not know that history. It also cannot see your site. The best findings came from combining what it read with what I know from walking the lot.

## Try it

Upload the document and ask: "What is wrong here, and what should be here that is not?"

```prompt
I've attached [a scope of work] that was written [a few years ago]. I have a meeting about it [tomorrow].

What is wrong in it, and what should be in it that is not? Give me two lists.

Here is what I know about the site that the document doesn't say: [details].
```

---

*Part of the series [27 ways I actually use AI](/blog/ways-i-use-ai/). Claude drafted this post from the record of our work together.*
