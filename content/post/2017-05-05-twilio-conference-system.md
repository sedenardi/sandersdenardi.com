---
title: Creating a Conference System in Twilio
date: 2017-05-05T19:12:10-05:00
author: Sanders
url: /twilio-conference-system/
tags:
  - twilio
  - javascript
  - nodejs
---
Twilio's documentation is very useful in showing some of the possible applications of their telephony system. For example, <a href="https://www.twilio.com/docs/guides/how-to-create-conference-calls-in-node-js" target="_blank">they have a guide</a> that walks you through the steps involved in setting up a conference call:

- Buying and configuring a phone number
- Setting up a basic Node.js web application to handle incoming calls
- Routing incoming phone calls to your web application

That guide is great in showing how to setup a singular conference call, and can be easily extended to create an entire conference system.

## State Machine Design

![](/img/2017-05-05-twilio-conference-system/conference-state.png)

Conference systems, like many phone systems, can be represented as simple state machines. This one in particular has just a few steps:

- Call comes in, play greeting
- Ask the caller for their access code
- Once the code has been entered, check the code against the known conferences
- If the conference exists, join the conference
- If the conference doesn't exist, tell the user the code is incorrect and ask for it again

## Application Implementation

Twilio's guide introduced the concept of the TwiML verbs `<Dial>` and `<Conference>` to actually join the conference. To implement our system's state machine, were going to use a few more:

- `<Say>`: Fairly self-explanatory, it uses Twilio's text-to-speech to recite back to the caller whatever you want. You can select between several voices and languages. <a href="https://www.twilio.com/docs/api/twiml/say" target="_blank">Docs.</a>
- `<Redirect>`: Again, self-explanatory, simply redirects the call to another route. <a href="https://www.twilio.com/docs/api/twiml/redirect" target="_blank">Docs.</a>
- `<Gather>`: This introduces interactivity to the system. This verb waits for some input from the caller's dialer and redirects to another route, passing in the digits the caller entered. <a href="https://www.twilio.com/docs/api/twiml/gather" target="_blank">Docs.</a>

When the system receives a phone call, the caller should hear a greeting, letting them know they reached the right number.

{{< highlight javascript >}}
app.post('/voice', (request, response) => {
  const twiml = new VoiceResponse();
  twiml.say('Welcome to the conference system.', {
    voice: 'alice'
  });
  twiml.redirect('/gather');
  response.send(twiml.toString());
});
{{< /highlight >}}

After we say welcome (in the <a href="https://www.twilio.com/docs/api/twiml/say#attributes-voice" target="_blank">friendly "alice" voice</a>), we redirect to the route that gathers the access code.

{{< highlight javascript >}}
app.post('/gather', (request, response) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    timeout: '10',
    finishOnKey: '#',
    action: '/join'
  });
  gather.say('Please enter your access code.', {
    voice: 'alice'
  });
  twiml.redirect('/gather');
  response.send(twiml.toString());
});
{{< /highlight >}}

One notable thing about this route is the placement of this `.say()` verb. Placing it inside of the `.gather()` verb means that the caller can begin entering digits as soon as they hear the instructions. Placing the `.say()` before the `.gather()` verb would mean the caller must wait until the instructions are finished before any input is registered. This can be a frustrating experience.

After the system gets the caller's digits, we redirect to the `/join` route.

{{< highlight javascript >}}
app.post('/join', (request, response) => {
  const twiml = new VoiceResponse();
  const conference = conferences(request.body.Digits);
  if (conference) {
    twiml.say('You are now entering the conference.', {
      voice: 'alice'
    });
    const dial = twiml.dial();
    dial.conference(conference);
  } else {
    twiml.say('The access code you entered is incorrect.', {
      voice: 'alice'
    });
    twiml.redirect('/gather');
  }
  response.send(twiml.toString());
});
{{< /highlight >}}

This route is where we'll verify that the user's access code is actually valid. In this example, we've hardcoded the conferences, and thus the check is trivial:

{{< highlight javascript >}}
const accessCodes = {
  123: 'conference 1',
  456: 'conference 2'
};
module.exports = function(code) {
  return accessCodes[code];
};
{{< /highlight >}}

If the access code is valid, `conference` will contain the name of the conference we'll pass into the `.conference()` verb, thus joining the conference. If it's not valid, we redirect back to the `/gather` route, after alerting the caller that the code they entered is wrong.

## Going Further

We showed how to easy it is to setup a robust, full-fledged conference system, and it may be easy enough to integrate these web routes into your existing application. You can take this example further by customizing the instructions (recording your own voice, changing the language of the instructions based on the caller's phone number), or giving room information (such as saying the room name or announcing how many people are currently in the room).

Additionally, one of the requirements of any robust phone system is reliability and uptime. Ideally your applications never crash or otherwise become unresponsive, but in reality this can happen at any time. One of the ways to mitigate this concern is to move your phone system to a completely separate application. Because of the on-demand nature of call handling, serverless functions, such as AWS Lambda, are an ideal candidate to handle incoming phone requests. Combined with AWS API Gateway, you can create an extremely reliable, and practically infinitely scalable phone system.

All code can be found <a href="https://github.com/sedenardi/twilio-conference" target="_blank">here</a>.
