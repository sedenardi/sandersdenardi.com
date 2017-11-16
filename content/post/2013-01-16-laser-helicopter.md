---
title: Attaching Lasers To A Syma S107G RC Helicopter
date: 2013-01-16T01:18:45+00:00
author: Sanders
url: /laser-helicopter/
tags:
  - helicopter
  - lasers
  - mods
  - soldering
---
I received the <a href="http://www.amazon.com/Syma-S107-S107G-Helicopter-Colors/dp/8499000606" target="_blank">Syma 107G R/C Helicopter</a> as a present recently. After a few days of flying it around my apartment giddily (and tormenting the person who got it for me) I naturally began to think about different modifications I could perform to make it unique. I thought about adding stronger motors, replacing or a second battery, and changing the propellers. While all of these are still good mods, they weren't immediately practical because I didn't have the materials to do any of them.

![Syma 107G With Lasers](/img/2013-01-16-laser-helicopter/img-1.jpg)

What I do have are over a dozen laser modules from an unfinished project. If you are coming up short thinking of reasons to add lasers to an RC helicopter, this guide is not for you. If you can't stop thinking of reasons to do so, let's get started.

Before we get started, we need to figure out the parts and tools requirements for this project:

- Laser module(s), must operate at 4.2V (I am using <a href="http://dx.com/p/6mm-5mw-red-laser-module-3-5-4-5v-13378" target="_blank">these</a>)
- Phillips head screwdriver, size 00
- Soldering iron
- Super glue or equivalent

The goal is to attach the lasers in parallel to the on/off switch and to ground. This way the lasers will turn off when you turn the helicopter off. Optionally you can install a separate switch just for the lasers, which would just require putting the switch in place of the one built into the helicopter, but I'm intending this as a permanent mod.

We start by removing the front plastic body by removing the two screws near the top. Be careful when removing the body because the LED in the nose of the body is attached with double-sided tape. Ripping any wires could not only damage the LED but the entire helicopter.

![](/img/2013-01-16-laser-helicopter/img-2.jpg)

Next, take off the metal panel on the right side by removing these five screws. Be careful with the support beam connecting the main body and the tail of the helicopter.

![](/img/2013-01-16-laser-helicopter/img-3.jpg)

With the innards exposed, we can see where the switch connects to the main circuit board, and the appropriate pad to attach the positive lead of the laser modules.

![](/img/2013-01-16-laser-helicopter/img-4.jpg)

I recommend soldering a spare wire to the pad and running it to the back of the helicopter, as it creates a single point to which you can attach the laser modules' leads once you've secured them to the undercarriage.

Next, look on the other side and find where the battery's negative lead connects to the main circuit board. We want to connect the lasers' negative lead directly to this pad. Again, I recommend using a spare wire and running it to the back of the helicopter.

![](/img/2013-01-16-laser-helicopter/img-5.jpg)

After soldering, turn the helicopter on to make sure you didn't short anything. If it fails to turn on after soldering those two points, closely examine your work to see if you damaged a nearby resistor or transistor.

If everything works properly, it's time to glue the lasers to the undercarriage. You must pay attention to exactly where on the undercarriage you glue them so you maintain proper balance, as well as make sure the lasers are both pointing the same direction. Since there wasn't quite enough clearance with the laser modules I put some cardboard between them and the body of the helicopter. Once they were glued and dried, I soldered the positive leads of the module to the wire I attached to the switch and the negative leads to the wire I attached to the negative lead of the battery.

![](/img/2013-01-16-laser-helicopter/img-6.jpg)

That's about it. If everything went as planned you should have some bright laser cannons flying around your room. Leave me comments with any questions or suggestions for other mods.
