# limited-request-queue [![NPM Version][npm-image]][npm-url] ![File Size][filesize-image] [![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][david-image]][david-url]

> Interactively manage concurrency for outbound requests.


* Concurrency & rate limiting prevents overload on your network.
* Per-Host concurrency limiting prevents overload on everyone else's network.
* Pause/Resume at any time.

```js
const RequestQueue = require('limited-request-queue');

const queue = new RequestQueue()
  .on('item', function(url, data, done) {
    yourRequestLib(url, () => done());
  })
  .on('end', () => console.log('Queue completed!'));

const urls = ['http://domain.com/dir1/', 'http://domain.com/dir2/'];
urls.forEach(url => queue.enqueue(new URL(url)));

setTimeout(queue.pause, 500);
setTimeout(queue.resume, 5000);
```


## Installation

[Node.js](http://nodejs.org/) `>= 6` is required. To install, type this at the command line:
```shell
npm install limited-request-queue
```

Note: for use in a web browser, you will likely need an ES2015/ES6 transpiler for maximum coverage.


## Constructor
```js
new RequestQueue(options);
```


## Methods & Properties

All methods from [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventemitter) are available.

### `.dequeue(id)`
Removes a queue item from the queue. Returns `true` if a queue item was removed and `false` if not. Use of this function is likely not needed as items are auto-dequeued when their turn is reached.

### `.enqueue(url[, data, options])`
Adds a URL to the queue. Returns a queue item ID on success.

* `url` *must* a [`URL`](https://developer.mozilla.org/en/docs/Web/API/URL/) instance.
* `data` is optional and can be of any type.
* `options` is an optional `Object` that overrides any defined options in the constructor (except for `maxSockets`).

### `.length`
Returns the total number of items in the queue, active and inactive.

### `.numActive`
Returns the number of items whose requests are currently in progress.

### `.numQueued`
Returns the number of items that have not yet made requests.

### `.pause()`
Pauses the queue, but will not pause any active requests.

### `.resume()`
Resumes the queue.


## Options

### `options.ignorePorts`
Type: `Boolean`  
Default value: `true`  
Whether or not to treat identical hosts of different ports as a single concurrent group. **Example:** when `true`, http://mydomain.com:80 and http://mydomain.com:8080 may not have outgoing connections at the same time, but http://mydomain.com:80 and http://yourdomain.com:8080 will.

### `options.ignoreProtocols`
Type: `Boolean`  
Default value: `true`  
Whether or not to treat identical hosts of different protocols as a single concurrent group. **Example:** when `true`, http://mydomain.com and https://mydomain.com may not have outgoing connections at the same time, but http://mydomain.com and https://yourdomain.com will.

### `options.ignoreSubdomains`
Type: `Boolean`  
Default value: `true`  
Whether or not to treat identical domains of different subdomains as a single concurrent group. **Example:** when `true`, http://mydomain.com and http://www.mydomain.com may not have outgoing connections at the same time, but http://mydomain.com and http://www.yourdomain.com will.

This option is not available in the browser version (due to extreme file size).

### `options.maxSockets`
Type: `Number`  
Default value: `Infinity`  
The maximum number of connections allowed at any given time. A value of `0` will prevent anything from going out. A value of `Infinity` will provide no concurrency limiting.

### `options.maxSocketsPerHost`
Type: `Number`  
Default value: `2`  
The maximum number of connections per host allowed at any given time. A value of `0` will prevent anything from going out. A value of `Infinity` will provide no per-host concurrency limiting.

### `options.rateLimit`
Type: `Number`  
Default value: `0`  
The number of milliseconds to wait before each request. For a typical rate limiter, also set `maxSockets` to `1`.


## Events

### `end`
Called when the last item in the queue has been completed/dequeued.

### `item`
Called when a queue item's turn has been reached. Arguments are: `url`, `data`, `done`. Call the `done` function when your item's operations are complete.


[npm-image]: https://img.shields.io/npm/v/limited-request-queue.svg
[npm-url]: https://npmjs.org/package/limited-request-queue
[filesize-image]: https://img.shields.io/badge/size-3.1kB%20gzipped-blue.svg
[travis-image]: https://img.shields.io/travis/stevenvachon/limited-request-queue.svg
[travis-url]: https://travis-ci.org/stevenvachon/limited-request-queue
[coveralls-image]: https://img.shields.io/coveralls/stevenvachon/limited-request-queue.svg
[coveralls-url]: https://coveralls.io/github/stevenvachon/limited-request-queue
[david-image]: https://img.shields.io/david/stevenvachon/limited-request-queue.svg
[david-url]: https://david-dm.org/stevenvachon/limited-request-queue
