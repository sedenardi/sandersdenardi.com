---
title: Data Join Techniques in JavaScript
date: 2014-04-25T02:03:09-04:00
author: Sanders
url: /data-join-in-javascript/
tags:
  - data-visualization
  - festival-guide
  - javascript
---
When I decided to cut over my <a href="http://sedenardi.github.io/festival-guide/" target="_blank">festival guide</a> to a standalone site, I needed to figure out a way to do the data operations on the client's browser that I was doing on the MySQL server. Specifically, I needed to emulate joining tables. The <a href="http://en.wikipedia.org/wiki/Nested_loop_join" target="_blank">nested loop join</a> is the simplest join you can do in SQL, but it happens to be the most costly. The <a href="http://en.wikipedia.org/wiki/Sort-merge_join" target="_blank">merge join</a> is a much faster method that can also be easily emulated in JavaScript, but is only advantageous if the sets are sorted (which can offset any performance gain over the nested loop join). I wanted to find out if any of the popular JavaScript data manipulation libraries offer an advantage over using standard JavaScript operations.

The libraries I'm testing are <a href="http://jquery.com/" target="_blank">jQuery</a>, <a href="http://prototypejs.org/" target="_blank">Prototype</a>, and <a href="http://underscorejs.org/" target="_blank">Underscore</a>. All 3 are mature, widely used, and fairly easy to start using.

To create the example data sets, I first make a large array of sequential integers. I then shuffle the array using the <a href="http://bost.ocks.org/mike/shuffle/" target="_blank">Fisher-Yates</a> method. I then take 2 overlapping subsets of the shuffled array. This provides me a with a good mix of hits and misses when doing the join. Since I'm not focusing on the speed of various sorting techniques, I'm going to rely on Underscore's sort operation.

The nested loop join is a fairly simple operation in JavaScript. Given two sets, you loop through each item in the first set, and for each item, you loop through the 2nd set to see if there's a match. If there is, you add it to your result set. If you are only trying to find distinct matches between the two sets, you can break out of the inner loop after you find a match (this increases performance). Nested loops exist in <a href="http://technet.microsoft.com/en-us/library/aa178178(v=sql.80).aspx" target="_blank">SQL Server</a>.

```js
var o = [];
for (var i = 0; i < t1.length; i++) {
  for (var j = 0; j < t2.length; j++) {
    if (t1[i] === t2[j]) {
      o.push(t1[i]);
      break
    }
  }
}
```

For other libraries the syntax is similar to JavaScript's <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach" target="_blank">forEach</a> function. The main difference is that these functions call a separate function for each item in the array.

```js
var o = [];
t1.forEach(function(v) {
  t2.forEach(function(w) {
    if (v === w) {
      o.push(v);
    }
  });
});
```

For Underscore's<span style="color: #333333; font-size: 15.454545021057129px; font-style: normal; line-height: 22.159090042114258px;"> </span><a style="font-size: 15.454545021057129px; font-style: normal; line-height: 22.159090042114258px; text-decoration: underline;" href="http://underscorejs.org/#each" target="_blank">each</a>, like the built-in forEach, there is no "break" function so I made another test using the <a href="http://underscorejs.org/#every" target="_blank">every</a> function. I've also included Underscore's <a href="http://underscorejs.org/#intersection" target="_blank">intersection</a>, <a href="http://underscorejs.org/#reduce" target="_blank">reduce</a>, and <a href="http://underscorejs.org/#filter" target="_blank">filter</a> functions.

Like the nested loop join, the merge join (also called the sort-merge join) is a simple operation. The idea is that, once sorted, you can linearly go through each set and compare values. Merge joins also exist in <a href="http://technet.microsoft.com/en-us/library/ms190967(v=sql.105).aspx" target="_blank">SQL Server</a>.

```js
var i = 0, j = 0, o = [];
while(i < t1.length && j < t2.length) {
  if(t1[i] < t2[j]) i++;   else if(t1[i] > t2[j]) j++;
  else { o.push(t1[i]); i++; j++; }
}
```

Another join technique I tried was converting the arrays to objects, with each item of the original array the field name of the new object. So this

```js
var array = [1,2,3];
```

becomes this.

```js
var object = {
  1: true,
  2: true,
  3: true
};
```

Using two objects instead of two arrays eliminates one of the loops entirely. I loop through the first object's fields, and for each one I check if the field is undefined in the second object.

```js
var o = [];
for (var i in a1) {
  if (typeof a2[i] !== 'undefined') {
    o.push(i);
  }
}
```

I ran two sets of benchmarks, one for <a href="http://jsperf.com/dataset-join/2" target="_blank">unsorted sets</a> and one for <a href="http://jsperf.com/dataset-join/3" target="_blank">sorted sets</a>.

For unsorted sets the native for loops were the fastest. The object as an array method didn't fare too badly, nor did the merge join method. Underscore's filter and reduce methods performed very close to the merge join, which leads me to believe they're both doing something something similar under the hood. All of the other "each" methods performed similarly poorly. Since these functions call a function (passing parameters and changing the scope) and check the return values for each iteration of the loop, it's not surprising that the performance is so much worse.

For sorted sets, there is no question that the merge join is the fastest. This makes sense given that it is a linear operation whereas the nested loop join is a quadratic operation. Since I'm using data from SQL, I can sort the sets using the "order by" clause.

I've often been told to be weary of functions that replace built-in operations, as they are often "syntactical sugar" that obfuscate the true operation and/or perform unnecessary computations. In this case, I was correct in my skepticism, as breaking down the most performant method into its basic JavaScript operations yields the best results. Of course, there are trade-offs between speed and legibility of code - one could argue that the libraries make the joins easier to read. However, for critical sections of code, especially parts on which the UI depends, I recommend basic JavaScript operations. They also have the beneficial side-effect of being both cross-browser and library-agnostic.

You can see all the code on the jsPerf tests <a href="http://jsperf.com/dataset-join/2" target="_blank">here</a> and <a href="http://jsperf.com/dataset-join/3" target="_blank">here</a>.

EDIT: Thanks to my buddy <a href="http://alexehrnschwender.com/" target="_blank">Alex</a> for pointing out some missing but significant join operations, he helped add some tests to the jsPerf benchmarks.
