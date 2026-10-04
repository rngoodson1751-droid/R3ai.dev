---
title: A typo on the front of the bus, and no software to fix it
date: 2026-10-04
section: work
order: 0.5
topics: Using AI, Transit tools
summary: One of our route signs had an extra L in it. The editing software was long gone. AI read the sign's raw file, found the two bad spots and swapped the letters without disturbing anything else.
---

One of our routes ends at a local college. The lighted sign on the front of the bus spelled the college's name with two L's. It has one.

It is a small thing. It is also on the front of a bus, in lights, all day.

## Why it was not a five minute fix

The words on those signs live in a file inside a control box by the driver's seat. Someone builds that file with the manufacturer's software and loads it with a thumb drive. We did not have the software. The manufacturer's records showed our file was last updated in 2021.

I gave Claude the operator's manual and asked how to fix the spelling. It walked me through the menus, then told me what I did not want to hear: the fix had to happen in the file, and the file needed the software.

## The first answer was no

I asked whether Claude could just read and write that kind of file, or build me a small program that could.

It said no. The manual did not describe how the file was laid out, and it was not willing to guess. Its reasoning was that a guess could produce a file that would not load, or one that loaded and broke the signs on buses that were in service. It told me to ask the manufacturer for the layout, or for a corrected file.

It was not the answer I was after. It was the right one.

## What the manufacturer said

I wrote to their support desk. The reply cleared up one thing and added another. Our control box did not use the kind of file the manual described. It used a different one. And if I wanted them to make the change, they would need to work up a quote.

A quote, to remove one letter.

## Getting the file out

Earlier I had asked Claude whether a thumb drive could pull the file off the box. The manual said it could. So I did. I came away with two files: the message file and a settings file.

Now Claude had the real thing in front of it. That changed its answer.

## What it found

The message file is not text. Open it in a text editor and it is mostly garbage, with route names showing through here and there. Claude read it as raw bytes, which is the only honest way to read a file like that.

- The misspelled name appeared **twice**, and it gave me the exact position of each one.
- It looked at the start and the end of the file for anything that looked like a check value.
- It compared how the other route names were stored. Each name sat between marker bytes. Nothing stored how long the name was.

That last point decided the method. If the file had kept a length for each name, shortening one would have meant updating the length too, and maybe more. It did not.

## The fix

The wrong spelling had seven letters. The right one has six. Claude did not delete a letter. It replaced the seven letters with the six correct ones **plus a space**.

That kept every other byte in the file exactly where it had been. The file was 42,453 bytes before and 42,453 bytes after. Two words changed and nothing else did. A space on a sign made of lights is just lights that stay off.

It handed me the corrected file and an untouched copy of the original, in case I needed to go back.

I asked about the settings file. Claude read it and said to leave it alone. It held hardware settings like brightness, and no route names at all.

## Where it falls short

- **It could not test the result.** Claude never touched a bus. It told me to load the file on one bus, look at the sign, and only then do the rest of the fleet. That is the right order for any change like this.
- **The manual was wrong for our box**, and Claude's first set of steps came straight from the manual. The file type was wrong and so was the folder name the box looks for on the thumb drive. I knew the folder name only because I had just pulled the files off myself.
- **The space is still a character.** It is blank, but it is there. On a sign that centers its text, look and see that the name still sits where it should.
- **This trick has limits.** Swapping letters for the same number of letters is about the safest edit there is. Adding a route, or making a name longer, is a different job. That one needs the real software.

## What I take from this

The no and the yes came from the same place. Without the file, Claude would have been guessing, and it said so. With the file, it could look, and it told me what it found and why the change was safe.

Keep the original. Change as little as possible. Test on one before you do ten.

## Try it

If you are stuck with an old file and no program to open it, start by asking what is in it, not by asking for a fix.

```prompt
I've attached a file from an old piece of equipment. I don't have the software that made it. I need to change [the old text] to [the new text].

Before you change anything, look at the raw bytes and tell me how the file is laid out around that text. Is there a stored length, a checksum or anything else that would break if the text changed?

If it's safe, make the smallest change that works, keep the file exactly the same size and give me an untouched copy of the original. Tell me what you could not check and how I should test it.
```

---

*Claude drafted this post from the record of our work together.*
