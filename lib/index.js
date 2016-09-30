import {EventEmitter} from "events";
import getHostKey from "./getHostKey";
import isURL from "isurl";



const DEFAULT_OPTIONS =
{
	ignorePorts: true,
	ignoreProtocols: true,
	ignoreSubdomains: true,
	maxSockets: Infinity,
	maxSocketsPerHost: 2,
	rateLimit: 0
};



export default class RequestQueue extends EventEmitter
{
	#activeHosts = {};    // Socket counts stored by host
	#items = {};          // Items stored by ID
	#priorityQueue = [];  // List of IDs

	#activeSockets = 0;
	#idCounter = 0;
	#options;
	#paused = false;



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



	/*
		Remove item (id) from queue, but nowhere else.
	*/
	#dequeueItem({id})
	{
		const itemIndex = this.#priorityQueue.indexOf(id);

		this.#priorityQueue.splice(itemIndex, 1);
	}



	emit(event, args=[], timeout=0)
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



	enqueue(url, data, options=this.#options)
	{
		if (!isURL.lenient(url))
		{
			throw new TypeError("Invalid URL");
		}
		else
		{
			const hostKey = getHostKey(url, this.#options, options);
			const id = this.#idCounter++;

			this.#items[id] = { active:false, data, hostKey, id, options, url };
			this.#priorityQueue.push(id);

			this.#maybeStartNext();

			return id;
		}
	}



	/*
		Generate a `done()` function for use in resuming the queue when an item's
		process has been completed.
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



	get isPaused()
	{
		return this.#paused;
	}



	get length()
	{
		return this.#priorityQueue.length + this.#activeSockets;
	}



	#maybeStartNext()
	{
		let availableSockets = this.#options.maxSockets - this.#activeSockets;

		if (!this.#paused && availableSockets > 0)
		{
			let i = 0;

			while (i < this.#priorityQueue.length)
			{
				let canStart = false;
				const item = this.#items[ this.#priorityQueue[i] ];

				const maxSocketsPerHost = item.options.maxSocketsPerHost ?? this.#options.maxSocketsPerHost;

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

					const rateLimit = item.options.rateLimit ?? this.#options.rateLimit;

					this.emit("item", [item.url, item.data, this.#getDoneCallback(item)], rateLimit);

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
		this.#paused = true;
		return this;
	}



	/*
		Remove item from item list and activeHosts.
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

			this.emit("end");
		}
	}



	resume()
	{
		this.#paused = false;
		this.#maybeStartNext();
		return this;
	}
}
