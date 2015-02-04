# concurrent-request-queue [![NPM Version](http://badge.fury.io/js/concurrent-request-queue.svg)](http://badge.fury.io/js/concurrent-request-queue) [![Build Status](https://secure.travis-ci.org/stevenvachon/concurrent-request-queue.svg)](http://travis-ci.org/stevenvachon/concurrent-request-queue) [![Dependency Status](https://david-dm.org/stevenvachon/concurrent-request-queue.svg)](https://david-dm.org/stevenvachon/concurrent-request-queue)
> Interactively manage concurrency for modules like [request](https://npmjs.com/package/request).

Features:
* Concurrency & rate limiting prevents overload on your server
* Per-Host concurrency limiting prevents overload on everyone else's server
* Pause/Resume at any time

```js
// Will work with any similar module, not just this one
var request = require("request");

var options = { maxSocketsPerHost:1 };
var requests = new (require("concurrent-request-queue"))(options);

var urls = ["http://website.com/dir1/", "http://website.com/dir2/"];
var count = 0;

urls.forEach( function(url) {
	requests.enqueue(url, function(error, id) {
		request(url, function(error, response) {
			requests.dequeue(id);
			
			if (++count >= urls.length) {
				console.log("done!");
			}
		});
	});
});
```


## Installation

[Node.js](http://nodejs.org/) `~0.10` is required. To install, type this at the command line:
```shell
npm install concurrent-request-queue --save-dev
```


## Methods

### .dequeue(id)
Removes a URL queue item (from `enqueue()`) from its host queue. Use this when you are finished with a particular URL so that the next in line can be triggered. Returns `true` on a success and `false` if the queue item could not be found.

### .enqueue(url[, id], callback)
Adds a URL to a host queue. If `id` is not defined, a value will be generated. When the URL's turn has been reached, `callback` will be called with two arguments: `error` if `url` or `id` is invalid and `id` for use in dequeuing.

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
The number of milliseconds to wait before each request.


## Roadmap Features
* add complete handler/function; use promises?
* browserify with parse-domain ommitted (due to size)
