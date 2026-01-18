---
layout: post
title: "Windows Black Box Fuzzing for Vulnerability Discovery"
date: 2025-08-31 12:00:00 +0000
categories: blog
---
Fuzzing is a great way to automate vulnerability discovery to an extent. However, it is not easy or fast. If it took you 5 mins to write a harness and fuzz your binary, you are probably not doing it right. Any bugs you find were sheer luck and not outputs of efficiency. In this post I'll dive into: what to fuzz, how to fuzz it right, and what to fuzz it with.  


## Pre-fuzz setup

For the demo, I will use mp3 player, a real-world windows software which is known to be vulnerable to multiple buffer overflows. My choice of target is to easy, real-world, and good for resource-constrained fuzzing. Here's the agenda:

1. Get the target bin.
2. Find interesting functions.
3. Write a harnesss.
4. Fuzz
5. ???
6. Profit. 

So for this, you will need the tools - Ghidra/IDA/Binary Ninja, DynamoRIO, Jackalope, and of course, the binary itself - EasyMP3Player.
## Software design of Windows Applications


## What to fuzz
