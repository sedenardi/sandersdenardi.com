---
title: Improving an RSS Twitter Bot
date: 2017-03-31T22:04:52-04:00
author: Sanders
slug: /once-twitter-bot/
tags:
  - aws
  - lambda
  - dynamodb
  - twitter
  - javascript
  - nodejs
---
Shortly after creating the <a href="/rss-twitter-bot/" target="_blank">RSS twitter bot</a> to tweet out an unduplicated list of published items, I realized a few issues with the approach:

- RSS feeds aren't available for all publications
- RSS feeds are hyper-specific, which can lead to blind spots if not all feeds are considered
- RSS feeds are delayed, often by several hours
- RSS feeds often don't contain images or video, and don't contain hashtags and people tags

Because of this, the "_once" accounts now retweet the publications' original tweets instead of composing their own tweets.

## Resolving URLs

We'll still need a way to keep track of the articles that are retweeted so we don't retweet a tweet that contains an article that's already been sent out. Most of the infrastructure and logic from the RSS bot still applies: store article URLs in a keyed DynamoDB table and query against it to determine if the article's been sent out already.

Using the article's URL as a key was simple with an RSS feed, since it was the key itself for the feed. With tweets, URLs are usually shortened, making them unsuitable for use as a unique key because the same link would be shortened to 2 separate links.

To fix this issue, we can take the shortened link and resolve it by using the <a href="https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9.4" target="_blank">HEAD</a> HTTP method, and follow any redirects. The HEAD method is the same as a GET, but the server won't return the body of the target page. This is great because we don't care about the body, and we want the call to be quick. Following redirects is necessary because a shortened link is essentially just a redirect.

The popular <a href="https://github.com/request/request" target="_blank">request</a> module has an easy way to perform this resolution:

{{< highlight javascript >}}
request({
  method: 'HEAD',
  url: 'shortened url',
  followAllRedirects: true
}, (err, res) => {
  const resolvedUrl = res.request.href;
});
{{< /highlight >}}

After that, we can determine whether the incoming tweet contains a link that's been retweeted before, and use the Twitter API to retweet it if not.

All code and current list of feeds can be found <a href="https://github.com/sedenardi/once-tweet" target="_blank">here</a>. These feeds are active, tweet at <a href="https://twitter.com/srednass">@srednass</a> or add an issue to the GitHub project to suggest a new publication's feed.
