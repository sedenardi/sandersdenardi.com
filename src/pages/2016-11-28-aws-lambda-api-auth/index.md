---
title: Web Authentication With AWS Lambda and API Gateway
date: 2016-11-30T22:34:05-05:00
author: Sanders
slug: /aws-lambda-api-auth/
tags:
  - aws
  - lambda
  - api-gateway
  - javascript
  - nodejs
---
AWS makes building APIs with serverless architecture easy. Using API Gateway and Lambda, you can define functions that interact with databases, make web requests, and process data. While the API Gateway is primarily designed to serve JSON data, you can be configure it to serve plain HTML files and use it as a rudimentary web server. While API Gateway and Lambda have some limitations, such as relatively high latency compared to standalone web servers, and clunky binary data support, for side projects or simple sites it can be a very low-cost and low-maintenance solution.

If you do set up an API Gateway/Lambda web server, at some point you may want to add authentication to protect some resources. AWS provides "API Keys" as a built-in way to restrict and/or throttle API access, which is a perfectly adequate solution for clients making JSON requests to the API. But if you're using it as a web server, you're probably dealing with humans and browsers, which deal with usernames, passwords, and cookies. Fortunately, we can configure API Gateway to read and write cookies to the browser and perform authentication in our Lambda functions.

# Overview

Our web app will work just like any other normal web server.

- Browser makes request, server checks cookies for user session
- Server redirect to a login page if user is not authorized
- User posts credentials to /login endpoint
- Server authenticates, creates session, stores and returns session cookie to browser

Since this example doesn't use any permanent storage, we'll use a hardcoded set users with plaintext passwords and generate sessions containing the username for easy reference.

# Lambda Functions

Lambda functions perform all the logic of authentication, session creation, and serving web pages. AWS supports functions written in Python, Java, and JavaScript/Node.js, which we will be using. There are 3 functions that implement each of the 3 actions the browser can perform: get request, login, and logout.

## GET Function

The get function itself only does a few things:

- Read the headers to get the cookies, check if valid session exists
- If valid return user page, if not return login page

{{< highlight javascript >}}
/* index.js */
function get(event, context) {
  const sess = session.getSession(event.headers);
  if (sess.valid) {
    render.user({
      username: sess.user.username,
      first: sess.user.first,
      last: sess.user.last
    }, (err, res) => {
      if (err) { return context.done(err); }
      return context.done(null, res);
    });
  } else {
    render.login((err, res) => {
      if (err) { return context.done(err); }
      return context.done(null, res);
    });
  }
}
{{< /highlight >}}

Because we're simply storing the username as part of the session, checking to see whether the session is valid is as simple as checking to see whether the user exists. For example, a user with the username "John" would have the session cookie `SID=Session::john`. Parsing it is simple string manipulation. Later on we'll see how we return the HTTP request headers to the function so we can parse the cookies to get our session.

{{< highlight javascript >}}
/* session.js */
const cookie = require('cookie');
const users = require('./users');
const cookieKey = 'SID';
const cookiePrefix = 'Session::';
function getSession(headers) {
  const cookieStr = headers ? (headers.Cookie || '') : '';
  const cookies = cookie.parse(cookieStr);
  if (!cookies[cookieKey]) {
    return { valid: false };
  }
  const username = cookies[cookieKey].replace(cookiePrefix, '');
  const user = users[username];
  return {
    valid: !!user,
    user: user
  };
}
{{< /highlight >}}

Our users file is an object with usernames as keys with first, last, and plaintext password fields.

{{< highlight javascript >}}
/* users.js */
const users = {
  john: {
    username: 'john',
    first: 'John',
    last: 'Smith',
    pass: 'johnpass'
  },
  jane: {
    username: 'jane',
    first: 'Jane',
    last: 'Doe',
    pass: 'janepass'
  }
};
{{< /highlight >}}

Since we're serving web pages instead of JSON objects, we need to return different HTML depending on the authentication state of the browser. This example simply reads files form the local filesystem. When the user is authenticated, the rendering functions use the <a href="https://lodash.com/docs#template" target="_blank">Lodash template</a> function as a rudimentary template engine.

{{< highlight javascript >}}
/* render.js */
const fs = require('fs');
const path = require('path');
const template = require('lodash.template');
const loginPath = path.resolve(__dirname, './login.html');
const userPath = path.resolve(__dirname, './user.html');
function login(cb) {
  fs.readFile(loginPath, (err, res) => {
    if (err) { return cb(err); }
    return cb(null, res.toString());
  });
};
function user(opts, cb) {
  fs.readFile(userPath, (err, res) => {
    if (err) { return cb(err); }
    const compiled = template(res.toString());
    const body = compiled(opts);
    return cb(null, body);
  });
};
{{< /highlight >}}

## LOGIN Function

The login function is fairly straightforward:

- Authenticate user and pass
- If authentication successful, set session and return session cookie
- If auth fails, return failure and message

{{< highlight javascript >}}
/* index.js */
function login(event, context) {
  const username = event.data.username;
  const pass = event.data.password;
  const authRes = authentication.auth(username, pass);
  if (authRes.success) {
    const sess = session.setSession(authRes.user);
    return context.done(null, {
      success: authRes.success,
      Cookie: sess.Cookie
    });
  } else {
    return context.done(null, authRes)
  }
};
{{< /highlight >}}

Authentication is done by simply checking the credentials against our hardcoded users.

{{< highlight javascript >}}
/* authentication.js */
const users = require('./users');
function auth(username, pass) {
  if (!username || !pass) {
    return { success: false, message: 'Must provide username and password.' };
  } else if (!users[username]) {
    return { success: false, message: 'User doesn\'t exist.' };
  } else if (users[username].pass !== pass) {
    return { success: false, message: 'Incorrect password.' };
  } else {
    return { success: true, user: users[username] };
  }
};
{{< /highlight >}}

Generating a session is the same string manipulation we performed in parsing it, but in reverse. We'll see later on how the returned cookie is set in the HTTP response header to the browser.

{{< highlight javascript >}}
/* session.js */
const cookieKey = 'SID';
const cookiePrefix = 'Session::';
function setSession(user) {
  const sessionId = `${cookiePrefix}${user.username}`;
  const newCookie = cookie.serialize(cookieKey, sessionId);
  return { Cookie: newCookie };
};
{{< /highlight >}}

## LOGOUT Function

The logout function is very simple:

- Read the headers to get the cookies
- Invalidate and destroy user session (if exists)
- Return immediately expiring session cookie

{{< highlight javascript >}}
/* index.js */
function logout(event, context) {
  const sessionRes = session.getSession(event.headers);
  const sess = session.destroySession(sessionRes.user);
  context.done(null, { Cookie: sess.Cookie });
};
{{< /highlight >}}

If we were using permanent storage, we'd want to check to see if the user was actually returned by getSession and perform other logout procedures, but for now just returning an expired cookie is enough to remove it from the user's browser and effectively log them out.

{{< highlight javascript >}}
/* session.js */
function destroySession(user) => {
  const clearCookie = cookie.serialize(cookieKey, 'empty', { maxAge: 0 });
  return { Cookie: clearCookie };
};
{{< /highlight >}}

## Deploy functions

### Create IAM Role

Most resources in AWS operate under some IAM user or role, and Lambda functions are no different. In order for the functions to access other resources, like logging to CloudWatch or read and write to S3, you must create an IAM role for them. <a href="http://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-service.html#roles-creatingrole-service-console" target="_blank">AWS docs</a> do a good job of breaking down the steps, but the main things to keep in mind are:

- **Select Role Type**: AWS Lambda
- **Policy**: AWSLambdaBasicExecutionRole (allows logging)

In this example we don't need any other policies set.

### Deploy 3 functions

Even though you're using the same code for all 3 functions, you must create 3 separate Lambda functions. The easiest way to do this is to create a ZIP archive of the codebase, including the dependencies (installed using `npm install`), and using that when creating the functions.

- In the AWS Console, select **Create a Lambda function**
- For Select Blueprint choose **Blank Function**
- Select "Next" for configure triggers (we'll setup API Gateway to trigger the functions later)
- For **Code entry type** choose ZIP and upload your archive
- Change the handler to the function exported in the index.js file (the get function's handler is `index.get`)
- Use the existing IAM role created in the previous step
- Leave Memory and Timeout for now (adjust if doing real auth and user/session fetching/storing) and create the function

Repeat this process for all 3 functions, remembering which name you used for get, login, and logout.

# API Gateway Resources

Our web app uses API Gateway endpoints to trigger Lambda functions, transforming both the input request and output response into formats our functions and browsers can deal with. We'll be creating 3 methods on 3 resources, one for each of our functions: `GET:/`, `POST:/login`, and `POST:/logout`.

## GET Resource

In order to make authentication work, we have to make our root `GET:/` method aware of the cookies that are sent with the HTTP request. The way we do this is to use a body mapping template to write all the headers to a field that our Lambda function can access.

- On the GET **Method Execution**, select **Integration Response**
- Expand the **Body Mapping Template** section, select **Add mapping template**
- Enter in `applictation/json` as the content type, save it (choosing **Yes, secure this integration**), and enter this template:

{{< highlight velocity >}}
{
  "headers": {
    #foreach($header in $input.params().header.keySet())
    "$header": "$util.escapeJavaScript($input.params().header.get($header))" #if($foreach.hasNext),#end
    #end
  }
}
{{< /highlight >}}

<a href="http://docs.aws.amazon.com/apigateway/latest/developerguide/models-mappings.html" target="_blank">Mapping templates</a> are written in Apache's <a href="http://velocity.apache.org/engine/devel/vtl-reference.html" target="_blank">Velocity Template Language</a> with <a href="http://goessner.net/articles/JsonPath/" target="_blank">JSONPath expressions</a> to define how the HTTP request maps to parameters that our Lambda function can access. This particular mapping template maps the headers of the HTTP request to a `headers` field. Recall that our function passes `event.headers` to our session functions to parse the cookies.

We're also going to use a body mapping template on our response. API Gateway escapes all return strings by default, which makes sense for a JSON API. But since we'll be serving web pages, we'll need to set the `Content-Type` to `text/html` and set a body mapping template to return the HTML unescaped.

- On the GET **Method Execution**, select **Method Response**
- Under **Response Headers for 200**, select **Add Header**, enter `Content-Type`, and hit save.
- Back on the GET **Method Execution**, select **Integration Response**
- Under **Header Mappings**, enter `'text/html'` (with the single quotes) as the **Mapping Value** for the **Content-Type** row, hit save
- Under **Body Mapping Templates**, delete `application/json`, add `text/html`, save it, and enter this template:

{{< highlight velocity >}}
#set($inputRoot = $input.path('$'))
$inputRoot
{{< /highlight >}}

## LOGIN Resource

Our `POST:/login` method needs to pass credentials to our Lambda function and map the output of the Lambda function to the HTTP response header to set the session cookie.

- On the POST **Method Execution**, select **Integration Request**
- Under **Body Mapping Template**, add the `application/json` mapping template content type and enter this template:

{{< highlight velocity >}}
{
    "data": $input.body
}
{{< /highlight >}}

This simply passes the JSON body of the request to the `data` field that our Lambda function can access (recall our `login` function). To map the cookie to the response header:

- Back on the POST **Method Execution**, select **Method Response**
- Under **Response Headers for 200**, add the header name `Set-Cookie` and save
- Back on the POST **Method Execution**, select **Integration Response**
- Under **Header Mappings**, enter `integration.response.body.Cookie` as the **Mapping Value** for **Content-Type** row, hit save

## LOGOUT Request

The `POST:/logout` method has to not only read in cookies from the HTTP request, but also must write cookies to the HTTP response. We can actually just repeat the steps we did for the `GET:/` and `POST:/login` methods.

- In **Integration Request**, add the **Body Mapping Template** to map the request headers to the `headers` field for the function
- Add the `Set-Cookie` header in **Method Response** and set the `integration.response.body.Cookie` **Mapping Value** in **Integration Response**

# Accessing the Endpoint

The pages we serve to the browser have simple login and logout forms. The main difference from an ordinary form post is that we're performing the requests as AJAX requests. We need to specify JSON requests and responses, and AJAX allows us to do that using `Content-Type` headers. The login page intercepts the form's post action and performs a `fetch` post instead.

{{< highlight javascript >}}
/* login.html */
var post = function(event) {
  event.preventDefault();
  var data = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  };
  fetch('./login', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin'
  }).then(function(response) {
    if (response.status === 200) {
      response.json().then(function(res) {
        if (res.success) {
          location.reload();
        } else {
          document.getElementById('result').innerHTML = res.message;
        }
      });
    } else {
      document.getElementById('result').innerHTML = response.statusText;
    }
  }).catch(function(error) {
    document.getElementById('result').innerHTML = error.message;
  });
};
document.getElementById('loginForm').addEventListener('submit', post);
{{< /highlight >}}

A nice side-effect of using AJAX instead of an ordinary form post is more granular error handling and reporting.

# Conclusions

If you do end up using this for a serious project, I strongly consider the following enhancements:

- Deploy to its own domain or sub-domain. Once you deploy the API, the **Invoke URL** provided won't work unless you add a trailing slash so you can access the /login and /logout resources.
- Use an industry-standard password hashing function, like bcrypt, to store and check passwords
- Generate *actual* session hashes and permanently store them for efficient lookup
- Instead of bundling the login and other HTML pages with the app, use the <a href="http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html" target="_blank">aws-sdk</a> to access files stored in S3. This eliminates the need to re-deploy your Lambda functions every time you want to modify your web pages (very useful for testing). An important note is that you'll need to add the S3 policy to your functions' IAM role to grant access.

API Gateway and Lambda functions provide a low-cost and low-maintenance way to serve web pages, and can easily be configured to support authentication. This serverless setup could be used to serve a single page application and API endpoints, or so simply password protect some HTML content. Not having to worry about server infrastructure or scalability issues (outside of your non-S3 storage) is a huge advantage over a traditional environment. While this won't be appropriate for all workloads, it's definitely something to consider when starting a new project.

A working version of this web app can be accessed <a href="https://0x9ic1jj07.execute-api.us-east-1.amazonaws.com/prod/" target="_blank">here</a>. Look up in the post for the test credentials. All code can be found <a href="https://github.com/sedenardi/lambda-session-auth" target="_blank">here</a>, including the exported Swagger + API Gateway Extensions. Reach out to me on Twitter or GitHub with any questions or issues.
