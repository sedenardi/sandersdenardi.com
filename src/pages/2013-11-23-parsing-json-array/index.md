---
title: Parsing JSON Array With Missing Elements
date: 2013-11-23T17:57:10-05:00
author: Sanders
slug: /parsing-json-array/
tags:
  - javascript
  - json
---
A project I'm working on requires me to parse JSON arrays from strings that I do not have control over. One of arrays I see frequently has empty elements at certain positions in the array. This normally isn't a problem if done correctly, but in this case it is not done correctly.

{{< highlight json >}}
["Thu","8:25","Info",,"Entity 1","17","Entity 2","13",,,"55999",,"November","2013"]
{{< /highlight >}}

If you try to interpret this in Javascript, you'll get a syntax error at the fourth element when it encounters the second comma.

{{< highlight javascript >}}
var test = "[\"Thu\",\"8:25\",\"Info\",,\"Entity 1\",\"17\",\"Entity 2\",\"13\",,,\"55999\",,\"November\",\"2013\"]";
console.log(JSON.parse(test)[0]);
{{< /highlight >}}

If you look at the <a href="http://www.json.org/" target="_blank">JSON syntax guide</a> for an array, you'll see that it must encounter an object before another comma.

![](http://www.json.org/array.gif)

As someone pointed out in the comments, if I were to define the above array, and not parse it from a string, the missing elements would be just undefined. When using JSON.parse() it apparently can't interpret them as undefined.

To get around this, I did a simple global replace on the string representation of the array.

{{< highlight javascript >}}
rawArray = rawArray.replace(/\,\,/g,',"",');
{{< /highlight >}}

This should be it, right? Parsing the string again results in another syntax error.

{{< highlight javascript >}}
["Thu","8:25","Info","","Entity 1","17","Entity 2","13","",,"55999",,"November","2013"]
{{< /highlight >}}

So it seems that one replace didn't do the trick. Two empty elements in a row cause sequential commas to go unfixed. If I do another replace it fixes the remaining empty elements. This also fixes the case where I have 3 or more empty elements in a row, so two passes of using the above replace code should be enough.

Someone else pointed out that using the eval() function would work. While this indeed will work for using this simple array, my application nests this array inside of an object. The actual JSON looks like this:

{{< highlight json >}}
{"ss":[["Thu","8:25","Info",,"Entity 1","17","Entity 2","13",,,"55999",,"November","2013"]]};
{{< /highlight >}}

Where my array is inside of another array, which itself is a field of a larger object. This fails:

{{< highlight javascript >}}
var test = "{\"ss\":[[\"Thu\",\"8:25\",\"Info\",,\"Entity 1\",\"17\",\"Entity 2\",\"13\",,,\"55999\",,\"November\",\"2013\"]]}";
console.log(eval(test).ss[0][2]);
{{< /highlight >}}

but this works:

{{< highlight javascript >}}
var test = "{\"ss\":[[\"Thu\",\"8:25\",\"Info\",,\"Entity 1\",\"17\",\"Entity 2\",\"13\",,,\"55999\",,\"November\",\"2013\"]]}";
var test2 = test.replace(/\,\,/g,',"",');
test2 = test2.replace(/\,\,/g,',"",');
console.log(JSON.parse(test2).ss[0][2]);
{{< /highlight >}}

I'm interested in whether anyone else has encountered this issue, and has another solution.
