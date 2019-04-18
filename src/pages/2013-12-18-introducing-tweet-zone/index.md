---
title: Introducing Tweet Zone
date: 2013-12-18T12:13:52-05:00
author: Sanders
url: /introducing-tweet-zone/
tags:
  - javascript
  - nodejs
  - twitter
---
About a month ago a [Washington Capitals](http://capitals.nhl.com/) blog called [Japers Rink](http://www.japersrink.com/) tweeted this out:

> How is it that we're in November 2013 and there isn't a Twitter account that just tweets out every single NHL goal when it's scored?
> &mdash; JapersRink (@JapersRink) [November 16, 2013](https://twitter.com/JapersRink/statuses/401504540933234688)

Good question. Having worked with Twitter's API, I knew that this would be fairly easy to accomplish if only I had a source for the score information. I searched around and found that real-time sports services are pretty expensive, affordable mostly only to big news outlets.

Looking around at different sports sites, I noticed that the leagues' (NHL, NFL) sites themselves seem to update their scores without me having to refresh the page. This told me that they were sending their scores outside of the main page information, and possibly in a format I could work with. Turns out that they both send relatively clean (one issue discussed in a <a title="Parsing JSON Array With Missing Elements" href="/parsing-json-array/">previous</a> post) JSON, so now I had a data source.

Using [node.js](http://nodejs.org/), I built a system that checks scores, detects changes, builds tweets, and sends them out automatically. Each league is its own component, and the code is written so that it'll be easy to add in other leagues (something I plan on doing once baseball starts up).

Without further ado, I present Tweet Zone:

[@NHLTweetZone](https://twitter.com/NHLTweetZone)

[@NFLTweetZone](https://twitter.com/NFLTweetZone)

Follow them and let me know if you spot any problems. Since I'm at the mercy of both leagues' websites' data, I sometimes see consistency issues arise, but I've tried to mitigate them as best as possible.

All the code is available on [GitHub](https://github.com/sedenardi/score-tweets).

**UPDATE**: [@MLBTweetZone](https://twitter.com/MLBTweetZone) is live.

**UPDATE 2**: These accounts are no longer active.
