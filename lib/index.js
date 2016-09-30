"use strict";
const defined = require("defined");
const {EventEmitter} = require("events");
const getHostKey = require("./getHostKey");
const isURL = require("isurl");



const defaultOptions =
{
	ignorePorts: true,
	ignoreProtocols: true,
	ignoreSubdomains: true,
	maxSockets: Infinity,
	maxSocketsPerHost: 2,
	rateLimit: 0
};



class RequestQueue extends EventEmitter
{
	constructor(options)
	{
		super();

		this.activeHosts = {};    // Socket counts stored by host
		this.items = {};          // Items stored by ID
		this.priorityQueue = [];  // List of IDs

		this.activeSockets = 0;
		this.counter = 0;
		this.options = { ...defaultOptions, ...options };
		this.paused = false;
	}



	dequeue(id)
	{
		const item = this.items[id];

		if (item===undefined || item.active)
		{
			return false;
		}
		else
		{
			dequeue(this, item);
			remove(this, item);
			return true;
		}
	}



	enqueue(url, data, options)
	{
		if (!isURL.lenient(url))
		{
			throw new TypeError("Invalid URL");
		}
		else if (options == null)
		{
			options = this.options;
		}

		const hostKey = getHostKey(url, this.options, options);
		const id = this.counter++;

		this.items[id] = { active:false, data, hostKey, id, options, url };
		this.priorityQueue.push(id);

		startNext(this);

		return id;
	}



	get isPaused()
	{
		return this.paused;
	}



	get length()
	{
		return this.priorityQueue.length + this.activeSockets;
	}



	get numActive()
	{
		return this.activeSockets;
	}



	get numQueued()
	{
		return this.priorityQueue.length;
	}



	pause()
	{
		this.paused = true;
		return this;
	}



	resume()
	{
		this.paused = false;

		startNext(this);

		return this;
	}
}



//::: PRIVATE FUNCTIONS



/*
	Remove item (id) from queue, but nowhere else.
*/
const dequeue = (instance, item) =>
{
	const queueIndex = instance.priorityQueue.indexOf(item.id);

	instance.priorityQueue.splice(queueIndex, 1);
};



const emitEvent = (instance, event, args=[], timeout=0) =>
{
	if (timeout > 0)
	{
		setTimeout(() => instance.emit(event, ...args), timeout);
	}
	else
	{
		instance.emit(event, ...args);
	}
};



/*
	Generate a `done()` function for use in resuming the queue when an item's
	process has been completed.
*/
const getDoneCallback = (instance, item) =>
{
	return function()
	{
		instance.activeSockets--;

		remove(instance, item);
		startNext(instance);
	};
};



/*
	Remove item from item list and activeHosts.
*/
const remove = (instance, item) =>
{
	if (--instance.activeHosts[item.hostKey] <= 0)
	{
		delete instance.activeHosts[item.hostKey];
	}

	delete instance.items[item.id];

	if (instance.priorityQueue.length<=0 && instance.activeSockets<=0)
	{
		instance.counter = 0;  // reset

		emitEvent(instance, "end");
	}
};



/*
	Possibly start next request(s).
*/
const startNext = instance =>
{
	if (instance.paused === true) return;

	let availableSockets = instance.options.maxSockets - instance.activeSockets;

	if (availableSockets <= 0) return;

	let i = 0;

	while (i < instance.priorityQueue.length)
	{
		let canStart = false;
		const item = instance.items[ instance.priorityQueue[i] ];

		const maxSocketsPerHost = defined(item.options.maxSocketsPerHost, instance.options.maxSocketsPerHost);

		// Not important, but feature complete
		if (maxSocketsPerHost > 0)
		{
			if (instance.activeHosts[item.hostKey] === undefined)
			{
				// Create key with first count
				instance.activeHosts[item.hostKey] = 1;
				canStart = true;
			}
			else if (instance.activeHosts[item.hostKey] < maxSocketsPerHost)
			{
				instance.activeHosts[item.hostKey]++;
				canStart = true;
			}
		}

		if (canStart)
		{
			instance.activeSockets++;
			availableSockets--;

			item.active = true;

			dequeue(instance, item);

			const rateLimit = defined(item.options.rateLimit, instance.options.rateLimit);

			emitEvent(instance, "item", [item.url, item.data, getDoneCallback(instance,item)], rateLimit);

			if (availableSockets <= 0) break;
		}
		else
		{
			// Move onto next
			i++;
		}
	}
};



module.exports = RequestQueue;
