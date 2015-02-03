# concurrent-host [![NPM Version](http://badge.fury.io/js/concurrent-host.svg)](http://badge.fury.io/js/concurrent-host) [![Build Status](https://secure.travis-ci.org/stevenvachon/concurrent-host.svg)](http://travis-ci.org/stevenvachon/concurrent-host) [![Dependency Status](https://david-dm.org/stevenvachon/concurrent-host.svg)](https://david-dm.org/stevenvachon/concurrent-host)
> Manages per-host concurrency for modules like [request](https://npmjs.com/package/request).

Limiting the number of concurrent outbound requests is one way to prevent overload on *your* server.
Doing so on a per-host basis will prevent overload for everyone else's.

```js
var options = { maxSockets:1 };
var concurrency = new (require("concurrent-host"))(options);

var urls = ["http://website.com/dir1/", "http://website.com/dir2/"];
var count = 0;

urls.forEach( function(url, i, urls) {
	concurrency.enqueue(url, function(error, url, data) {
		request(url, function(error, response) {
			concurrency.dequeue(data);
			
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
npm install concurrent-host --save-dev
```
