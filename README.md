# limited-request-queue [![NPM Version](http://badge.fury.io/js/limited-request-queue.svg)](http://badge.fury.io/js/limited-request-queue) [![Build Status](https://secure.travis-ci.org/stevenvachon/limited-request-queue.svg)](http://travis-ci.org/stevenvachon/limited-request-queue) [![Dependency Status](https://david-dm.org/stevenvachon/limited-request-queue.svg)](https://david-dm.org/stevenvachon/limited-request-queue)
> Interactively manage concurrency for modules like [request](https://npmjs.com/package/request).

Features:
* Concurrency & rate limiting prevents overload on your server
* Per-Host concurrency limiting prevents overload on everyone else's server
* Pause/Resume at any time
* Works in the browser (~7KB)

```js
// Will work with any similar module, not just "request"
var request = require("request");
var RequestQueue = require("limited-request-queue");

var options = { maxSocketsPerHost:1 };
var handlers = {
	drain: function() {
		console.log("Queue completed!");
	}
};
var queue = new RequestQueue(options, handlers);

var urls = ["http://website.com/dir1/", "http://website.com/dir2/"];

urls.forEach( function(url) {
	queue.enqueue(url, function(error, id, url) {
		request(url, function(error, response) {
			queue.dequeue(id);
		});
	});
});
```


## Installation

[Node.js](http://nodejs.org/) `~0.10` is required. To install, type this at the command line:
```shell
npm install limited-request-queue --save-dev
```


## Methods

### .dequeue(id)
Removes a URL queue item (from `enqueue()`) from its host queue. Use this when you are finished with a particular URL so that the next in line can be triggered. Returns `true` on success and `false` if the queue item could not be found.

### .enqueue(url[, id], callback)
Adds a URL to a host queue. If `id` is not defined, a value will be generated. When the URL's turn has been reached, `callback` will be called with three arguments: `error` if `url` or `id` is invalid and `id` for use in dequeuing and `url`.

### .length()
Returns the number of items in the queue.

### .pause()
Pauses the queue, but will not pause any active requests.

### .resume()
Resumes the queue.


## Options

### options.ignorePorts
Type: `Boolean`  
Default value: `true`  
Whether or not to treat identical hosts of different ports as a single concurrent group. **Example:** when `true`, http://mywebsite.com:80 and http://mywebsite.com:8080 may not have outgoing connections at the same time, but http://mywebsite.com:80 and http://yourwebsite.com:8080 will.

### options.ignoreSchemes
Type: `Boolean`  
Default value: `true`  
Whether or not to treat identical hosts of different schemes/protocols as a single concurrent group. **Example:** when `true`, http://mywebsite.com and https://mywebsite.com may not have outgoing connections at the same time, but http://mywebsite.com and https://yourwebsite.com will.

### options.ignoreSubdomains
Type: `Boolean`  
Default value: `true`  
Whether or not to treat identical hosts of different subdomains as a single concurrent group. **Example:** when `true`, http://mywebsite.com and http://www.mywebsite.com may not have outgoing connections at the same time, but http://mywebsite.com and http://www.yourwebsite.com will.

This option is not available in the browser version (due to extreme file size).

### options.maxSockets
Type: `Number`  
Default value: `Infinity`  
The maximum number of connections allowed at any given time. A value of `0` will prevent anything from going out. A value of `Infinity` will provide no concurrency limiting.

### options.maxSocketsPerHost
Type: `Number`  
Default value: `1`  
The maximum number of connections per host allowed at any given time. A value of `0` will prevent anything from going out. A value of `Infinity` will provide no per-host concurrency limiting.

### options.rateLimit
Type: `Number`  
Default value: `0`  
The number of milliseconds to wait before each request. For a typical rate limiter, also set `maxSockets` to `1`.


## Handlers

### handlers.drain
Called when the queue has been emptied.
