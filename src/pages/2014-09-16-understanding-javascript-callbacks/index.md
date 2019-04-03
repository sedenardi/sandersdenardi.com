---
title: Understanding Javascript Callbacks
date: 2014-09-16T18:03:19-04:00
author: Sanders
slug: understanding-javascript-callbacks/
tags:
  - javascript
---
The first step in understanding the concept of Javascript callbacks is to realize that functions are really objects. The thing that makes them special is that you can invoke them (i.e. 'run' them). This is done by using '.call()', or simply '()'. Because functions are objects, you can pass them as parameters to any other function.

Say you have this code:

```js
var f = function() {
  console.log(5);
};
f();
```

This is a pretty simple example. We declare a function 'f' and invoke it by using '()'.

Now, let's create another function:

```js
var f = function() {
  console.log(5);
};
var runFunc = function(func) {
  func();
};
runFunc(f);
```

Our new function 'runFunc' takes in a single parameter, and invokes it. This invocation of the function parameter is essentially a callback.

```js
var f = function() {
  console.log('Moving on...');
};
var runFunc = function(number,callback) {
  console.log('Doing meaningful work on ' + number);
  number++;
  number++;
  console.log('Number is now ' + number);
  callback();
};
runFunc(4,f);
```

So here, my function 'runFunc' takes in 2 parameters. After it does some 'meaningful' work on my first parameter, I want it to move on to my callback function (in this case 'f'). That's the main purpose of a callback function, to define the behavior I want to happen _after_ a given function ends. Javascript is all about re-usability, and this is one of the most powerful tenants of that.

With my super important runFunc function, look what I can do:

```js
var f = function(number) {
  console.log('Saving ' + number);
};
var g = function(number) {
  console.log('Throwing ' + number + ' away!');
};
var runFunc = function(number,callback) {
  console.log('Doing meaningful work on ' + number);
  number++;
  number++;
  console.log('Number is now ' + number);
  callback(number);
};
runFunc(4,f);
runFunc(5,g);
```

Now my callback functions 'f' and 'g' take a parameter to do work on. My main function 'runFunc' does the same logic regardless, but I can reuse the same code and do something differently with the result of it.

So that's mostly the syntactical explanation of callbacks. The other main reason to use them is to maintain asynchronous behavior. Here are a few great explanations on callbacks I'd recommend:

<a href="http://www.impressivewebs.com/callback-functions-javascript/" target="_blank">http://www.impressivewebs.com/callback-functions-javascript/</a>

<a href="http://cwbuecheler.com/web/tutorials/2013/javascript-callbacks/" target="_blank">http://cwbuecheler.com/web/tutorials/2013/javascript-callbacks/</a>

The first is a simple explanation, the second does a bit deeper with asynchronous flow using callbacks. It mentions Node programming (which is server-side JS), but It also applies to client-side JS just as well.

<a href ="http://javascriptissexy.com/understand-javascript-callback-functions-and-use-them/" target="_blank">http://javascriptissexy.com/understand-javascript-callback-functions-and-use-them/</a>

This goes into the subject a bit deeper, with concepts such as scope and closures. Once you're comfortable with the core concept of a callback I'd recommend reading up on it a bit more.

Finally, I highly recommend <a href="http://www.amazon.com/JavaScript-Good-Parts-Douglas-Crockford/dp/0596517742" target="_blank">JavaScript: The Good Parts</a> by <a href="http://en.wikipedia.org/wiki/Douglas_Crockford" target="_blank">Douglas Crockford</a>. It offers a clear and concise explanation of the trickier parts of Javascript.
