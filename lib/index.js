"use strict";
const {EventEmitter} = require("events");
const isURL = require("isurl");
const normalizeURL = require("./normalizeURL");



const DEFAULT_OPTIONS = Object.freeze(
{
	ignorePorts: true,
	ignoreProtocols: true,
	ignoreSubdomains: true,
	maxSockets: Infinity,
	maxSocketsPerHost: 2,
	rateLimit: 0
});

const END_EVENT = "end";
const ITEM_EVENT = "item";



class RequestQueue extends EventEmitter
{
	#activeHosts = {};    // Socket counts stored by host
	#items = {};          // Items stored by ID
	#priorityQueue = [];  // List of IDs

	#activeSockets = 0;
	#idCounter = 0;  // it'd take centuries to exceed MAX_SAFE_INTEGER
	#isPaused = false;
	#options;



	constructor(options)
	{
		super();
		this.#options = { ...DEFAULT_OPTIONS, ...options };
	}



	dequeue(id)
	{
		const item = this.#items[id];

		if (item===undefined || item.active)
		{
			return false;
		}
		else
		{
			this.#dequeueItem(item);
			this.#removeItem(item);
			return true;
		}
	}



	/**
	 * Remove item (id) from queue, but nowhere else.
	 * @param {object} item
	 */
	#dequeueItem({id})
	{
		const itemIndex = this.#priorityQueue.indexOf(id);

		this.#priorityQueue.splice(itemIndex, 1);
	}



	/**
	 * Emit an event, synchronously or asynchronously.
	 * @param {string} event
	 * @param {Array} args
	 * @param {number} timeout
	 */
	#emit2(event, args, timeout)
	{
		if (timeout > 0)
		{
			setTimeout(() => super.emit(event, ...args), timeout);
		}
		else
		{
			super.emit(event, ...args);
		}
	}



	enqueue(url, data, options)
	{
		if (!isURL.lenient(url))
		{
			throw new TypeError("Invalid URL");
		}
		else
		{
			const hostKey = normalizeURL(url, this.#options, options);
			const id = this.#idCounter++;

			this.#items[id] = { active:false, data, hostKey, id, options, url };
			this.#priorityQueue.push(id);

			this.#maybeStartNext();

			return id;
		}
	}



	/**
	 * Generate a `done()` function for use in resuming the queue when an item's
	 * process has been completed.
	 * @param {object} item
	 * @returns {Function}
	 */
	#getDoneCallback(item)
	{
		return () =>
		{
			this.#activeSockets--;
			this.#removeItem(item);
			this.#maybeStartNext();
		};
	}



	has(id)
	{
		return id in this.#items;
	}



	get isPaused()
	{
		return this.#isPaused;
	}



	get length()
	{
		return this.#priorityQueue.length + this.#activeSockets;
	}



	/**
	 * Start the next queue item, if it exists and if it passes any limiting.
	 */
	#maybeStartNext()
	{
		let availableSockets = this.#options.maxSockets - this.#activeSockets;

		if (!this.#isPaused && availableSockets>0)
		{
			let i = 0;

			while (i < this.#priorityQueue.length)
			{
				let canStart = false;
				const item = this.#items[ this.#priorityQueue[i] ];

				const maxSocketsPerHost = item.options?.maxSocketsPerHost ?? this.#options.maxSocketsPerHost;

				// Not important, but feature complete
				if (maxSocketsPerHost > 0)
				{
					if (this.#activeHosts[item.hostKey] === undefined)
					{
						// Create key with first count
						this.#activeHosts[item.hostKey] = 1;
						canStart = true;
					}
					else if (this.#activeHosts[item.hostKey] < maxSocketsPerHost)
					{
						this.#activeHosts[item.hostKey]++;
						canStart = true;
					}
				}

				if (canStart)
				{
					this.#activeSockets++;
					availableSockets--;

					item.active = true;

					this.#dequeueItem(item);

					const rateLimit = item.options?.rateLimit ?? this.#options.rateLimit;

					this.#emit2(ITEM_EVENT, [item.url, item.data, this.#getDoneCallback(item)], rateLimit);

					if (availableSockets <= 0)
					{
						break;
					}
				}
				else
				{
					// Move onto next
					i++;
				}
			}
		}
	}



	get numActive()
	{
		return this.#activeSockets;
	}



	get numQueued()
	{
		return this.#priorityQueue.length;
	}



	pause()
	{
		this.#isPaused = true;
		return this;
	}



	/**
	 * Remove item from item list and activeHosts.
	 * @param {object} item
	 */
	#removeItem({hostKey, id})
	{
		if (--this.#activeHosts[hostKey] <= 0)
		{
			delete this.#activeHosts[hostKey];
		}

		delete this.#items[id];

		if (this.#priorityQueue.length<=0 && this.#activeSockets<=0)
		{
			this.#idCounter = 0;  // reset

			super.emit(END_EVENT);
		}
	}



	resume()
	{
		this.#isPaused = false;
		this.#maybeStartNext();
		return this;
	}
}



// For ESM compatibility
RequestQueue.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
RequestQueue.END_EVENT = END_EVENT;
RequestQueue.ITEM_EVENT = ITEM_EVENT;

// For simpler CJS destructuring
RequestQueue.RequestQueue = RequestQueue;



module.exports = RequestQueue;
