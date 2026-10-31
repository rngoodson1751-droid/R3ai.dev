---
title: The finance launcher that kept crashing, and the fix that stuck
date: 2026-10-31
section: work
topics: Using AI, Office work
summary: Every time Java updated, my new work computer refused to open the City's finance system. Turning off updates didn't help. Here is what was really going on and the five minute fix that ended it.
---

Every City department runs on one old system for money. Purchase orders, budgets, invoices. If you can't open it, you can't buy a box of zip ties. We call it HTE, after the company that built it decades ago, and it lives on a green screen that looks like 1985 because, in a sense, it is.

My new work computer would not open it. Click the icon, a window flickers, gone. It started after a Java update. We turned off Java's automatic updates. It updated anyway. It crashed again.

My first question to Claude was a hopeful one: could we just build a launcher that doesn't need Java at all?

## The wrong question, answered honestly

Claude's answer was no, and it said why. Whatever opens HTE still needs Java underneath, so a new launcher would only move the problem. The real fix was to stop Java from changing out from under it.

That was useful, but still general. The breakthrough came when I sent it the actual shortcut file we're told to use.

## What the file gave away

That one small file told the whole story. HTE isn't really a program on my computer. It's a terminal session, run by an IBM tool called Access Client Solutions, that connects over an encrypted line to the City's hosted system. Java is just the engine that IBM tool runs on.

Then we dug into the install itself:

- **The IBM tool is from April 2019** and was built for Java 8.
- **It carries no Java of its own.** Every time it starts, it asks Windows "where's Java?" and uses whatever answer it gets.
- **Updates change that answer.** When the system's Java gets updated, replaced or removed, the IBM tool either finds nothing it can use or starts on a version it was never built for. Either way it dies before it can even write an error log.
- **Turning off updates can't fix that.** Patch tools and other software can still swap the system's Java whenever they like.

The crash dumps in my Documents folder turned up a bonus: a second, unrelated crash after the session had been open about 23 hours, a known bug in older Java 8 builds.

## The fix: give it its own Java

IBM documents a way to make its tool use a private copy of Java that lives in a folder right next to it. Nothing else on the computer knows that copy exists, so nothing ever updates it.

1. **Download a private Java.** IBM's free Semeru runtime, Java 8, as a plain zip file, not the installer. A zip adds nothing to Windows and comes with no updater.
2. **Unzip it next to the IBM launcher** and name the folder `jre`. That's the folder name IBM's launcher looks for first.
3. **Add a small launch script** that checks the private Java and the session file are both there, points the launcher straight at that Java, and opens the HTE session.
4. **Put a shortcut to the script on the desktop** and stop using the old icons, which still go hunting for the system's Java.

HTE opened on the first try and has opened every time since. The system's own Java is still installed and can update all it wants. It no longer matters.

One small thing: the first launch brought up a Windows Firewall prompt for the new Java. I clicked Cancel and it still connected fine, because that prompt is about incoming connections and HTE only goes out.

## Passing it on

Then I asked Claude to write the whole thing up for IT: root cause, every step, the file locations, what to tell the firewall, and IBM's own support pages behind each claim. It also recommended three things for the long run:

- **Apply the same fix on every HTE computer.** It takes about five minutes a machine and changes nothing else.
- **Upgrade the IBM tool** from its 2019 version to a current one, packaged with its own Java the same way, so every new install gets it automatically.
- **Tell patching tools to leave that `jre` folder alone.**

## What I took from it

I started by asking for the wrong thing. A non-Java launcher sounded like a clean fix and would have been a waste of a week. What actually solved it was handing over the real evidence, one little file and a folder of crash dumps, and letting the tool read it.

It also didn't stop at "it works on my machine." Most of the value was the write-up, so the next person in the building who hits this gets five minutes of work instead of three days of frustration.

```prompt
My work software crashes on startup every time Java updates, even with updates turned off. Here is the shortcut or config file we use to launch it: [paste it]. Tell me what this program really is, why Java updates break it, and a permanent fix that doesn't depend on the system's Java. Then write it up for my IT department.
```
