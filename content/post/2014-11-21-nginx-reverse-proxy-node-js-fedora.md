---
title: Setting up Nginx Reverse Proxy for Node.JS on Fedora
date: 2014-11-21T13:21:31+00:00
author: Sanders
url: /nginx-reverse-proxy-node-js-fedora/
tags:
  - fedora
  - nginx
  - nodejs
---
One of <a href="http://en.wikipedia.org/wiki/Nginx" target="_blank">Nginx</a>'s popular uses is as a reverse proxy for several different Node.js servers. A reverse proxy makes it easy to point to each separate app without having to remember which instance is on what port. Nginx makes this very easy, but Fedora's <a href="http://en.wikipedia.org/wiki/Security-Enhanced_Linux" target="_blank">SELinux</a> policies make this setup not so straightforward. In this tutorial, I'm going to map 3 Node.js web servers, running on different ports, to different virtual directories on the same domain.

This example assumes you have Node.js and Nginx installed on your system. I'm going to set up arbitrary web servers running on port 3001, 3002, and 3003, and map them to folders /server1, /server2, and /server3, respectively.

Using Node.js I can easily set up an arbitrary number of web servers at once.

{{< highlight javascript >}}
var http = require('http');

var initServer = function(port, name) {
  var server = http.createServer(function(req,res) {
    console.log(port + ' received a request');
    res.write('Running on port ' + port);
    res.end();
  });
  server.listen(port);
  console.log('/' + name + ' running on port ' + port);
};

initServer(3001, 'server1');
initServer(3002, 'server2');
initServer(3003, 'server3');
{{< /highlight >}}

I can confirm that each server is working properly by navigating to each page - http://localhost:3001, http://localhost:3002, http://localhost:3003 - and observing the returned string.

The next step is configuring Nginx to forward the virtual folder requests to my Node.js servers. Thankfully, Nginx is very simple and straightforward to configure. While the main Nginx configuration file is located at /etc/nginx/nginx.conf, there is a directive in that file that tells Nginx to look for *.conf files in the conf.d/ folder. Create a file called "proxy.conf" (or anything ending in ".conf") in /etc/nginx/conf.d/ that looks like this:

<div class="highlight">
<pre>server {
  listen 80;

  server_name sanders-laptop.local;

  location /server1/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}</pre>
</div>

Replace the `server_name` with your domain name (or computer name if you're on your development machine). From now on the URLs I refer to will direct to http://sanders-laptop.local, but obviously yours will differ. This configuration tells the server to accept requests on port 80 (standard http port) and direct any requests for "/server1" to http://localhost:3001. The `proxy_set_header` settings tell Nginx to pass the incoming client information to the proxied server (more details can be found <a href="http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header" target="_blank">here</a> and <a href="http://nginx.org/en/docs/http/websocket.html" target="_blank">here</a>).

In order for Nginx to use our new configuration file, I must restart the service.

<div class="highlight">
<pre>systemctl restart nginx</pre>
</div>

While it seems like I'm all set, when I navigate to http://sanders-laptop.local/server1 I get an error "502 Bad Gateway". What gives? Looking at the Nginx log, I see this entry:

<div class="highlight">
<pre>cat /var/log/audit/audit.log

[crit] 32601#0: *15 connect() to 127.0.0.1:3001 failed (13: Permission denied) while
connecting to upstream, client: 192.168.1.134, server: sanders-laptop.local, request:
"GET /server1/ HTTP/1.1", upstream: "http://127.0.0.1:3001/server1/",
host: "sanders-laptop.local"</pre>
</div>

You may have also seen an SELinux alert pop up. What's happening is that SELinux is blocking Nginx from accessing our new port 3001 because I haven't explicitly granted it permission to do so. Thankfully it's easy to designate 3001 as an HTTP port in SELinux's eyes (as described <a href="http://wiki.gentoo.org/wiki/SELinux/Tutorials/Managing_network_port_labels" target="_blank">here</a>):

<div class="highlight">
<pre>semanage port -a -t http_port_t -p tcp 3001</pre>
</div>

This command tells SELinux to treat TCP requests on port 3001 like other HTTP requests. Once it's finished running, I reload my page at http://sanders-laptop.local/server1 and I see my server's expected output.

Didn't I want to forward multiple servers? I can add more location directives to my /etc/nginx/conf.d/proxy.conf file I created earlier (below the first location block).

<div class="highlight">
<pre>  location /server2/ {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /server3/ {
    proxy_pass http://localhost:3003;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }</pre>
</div>

After adding those, restarting the Nginx service, and again enabling the ports for SELinux, I can see my other 2 servers by going to http://sanders-laptop.local/server2 and http://sanders-laptop.local/server3.

If I only wanted to hit my machine locally, I'd be done. However, I want to connect to my new web server from an external device (within or outside of my network), so I'llll need to open port 80 in my firewall.

<div class="highlight">
<pre>firewall-cmd --permanent --zone=public --add-service=http</pre>
</div>

Then restart the firewall service.

<div class="highlight">
<pre>systemctl restart firewalld</pre>
</div>

Now my Nginx server will accept incoming HTTP requests on port 80 and direct them to the appropriate Node.js server.
