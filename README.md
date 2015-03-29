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

var queue = new RequestQueue(null, {
	item: function(id, url, data) {
		request(url, function(error, response) {
			queue.dequeue(id);
		});
	},
	end: function() {
		console.log("Queue completed!");
	}
});

var urls = ["http://website.com/dir1/", "http://website.com/dir2/"];
urls.forEach(queue.enqueue, queue);
```


## Installation

[Node.js](http://nodejs.org/) `~0.10` is required. To install, type this at the command line:
```shell
npm install limited-request-queue --save-dev
```


## Constructor
```js
new RequestQueue(options, handlers);
```


## Methods

### .dequeue(id)
Removes a URL queue item from its host queue. Use this when you are finished with a particular URL so that the next in line can be triggered. Returns `true` on success or an `Error` on failure.

### .enqueue(input)
Adds a URL to a host queue. `input` can either be a URL `String` or an `Object`. Returns a queue ID on success or an `Error` on failure.

If `input` is an `Object`, it will acccept the following keys:
* `url`: a URL `String`
* `id`: a unique ID (`String` or `Number`). If not defined, one will be generated.
* `data`: custom data to be stored in the queue.

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

### handlers.end
Called when the last item in the queue has been dequeued. Arguments are: `id`, `url`, `data`.

### handlers.error
Called when an item could not be enqueued or dequeued. Arguments are: `error`, `id`, `url`, `data`.

### handlers.item
Called when a queue item's turn has been reached. There are no arguments.
