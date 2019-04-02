---
title: Introducing Tweet Zone
date: 2013-12-18T12:13:52-05:00
author: Sanders
slug: introducing-tweet-zone/
tags:
  - javascript
  - nodejs
  - twitter
---
About a month ago a <a href="http://capitals.nhl.com/" target="_blank">Washington Capitals</a> blog called <a href="http://www.japersrink.com/" target="_blank">JapersRink</a> tweeted this out:

<blockquote class="twitter-tweet" width="550">
  <p>
    How is it that we're in November 2013 and there isn't a Twitter account that just tweets out every single NHL goal when it's scored?
  </p>

  <p>
    &mdash; JapersRink (@JapersRink) <a href="https://twitter.com/JapersRink/statuses/401504540933234688" target="_blank">November 16, 2013</a>
  </p>
</blockquote>

Good question. Having worked with Twitter's API, I knew that this would be fairly easy to accomplish if only I had a source for the score information. I searched around and found that real-time sports services are pretty expensive, affordable mostly only to big news outlets.

Looking around at different sports sites, I noticed that the leagues' (NHL, NFL) sites themselves seem to update their scores without me having to refresh the page. This told me that they were sending their scores outside of the main page information, and possibly in a format I could work with. Turns out that they both send relatively clean (one issue discussed in a <a title="Parsing JSON Array With Missing Elements" href="/parsing-json-array/">previous</a> post) JSON, so now I had a data source.

Using <a href="http://nodejs.org/" target="_blank">node.js</a>, I built a system that checks scores, detects changes, builds tweets, and sends them out automatically. Each league is its own component, and the code is written so that it'll be easy to add in other leagues (something I plan on doing once baseball starts up).

Without further ado, I present Tweet Zone:

<a href="https://twitter.com/NHLTweetZone" target="_blank">NHLTweetZone</a>

<a href="https://twitter.com/NFLTweetZone" target="_blank">NFLTweetZone</a>

Follow them and let me know if you spot any problems. Since I'm at the mercy of both leagues' websites' data, I sometimes see consistency issues arise, but I've tried to mitigate them as best as possible.

All the code is available on <a href="https://github.com/sedenardi/score-tweets" target="_blank">GitHub</a>.

**UPDATE**: <a href="https://twitter.com/MLBTweetZone" target="_blank">MLBTweetZone</a> is live.
