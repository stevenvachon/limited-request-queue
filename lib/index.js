"use strict";
var getHostKey = require("./getHostKey");
var getId = require("./getId");

var objectAssign = require("object-assign");

var defaultOptions = 
{
	defaultPorts: {ftp:21, http:80, https:443},
	ignorePorts: true,
	ignoreSchemes: true,
	ignoreSubdomains: true,
	maxSockets: Infinity,
	maxSocketsPerHost: 1,
	rateLimit: 0
};



function RequestQueue(options, handlers)
{
	this.activeHosts = {};		// Socket counts stored by host
	this.items = {};			// Items stored by ID
	this.priorityQueue = [];	// List of IDs
	
	this.activeSockets = 0;
	this.handlers = handlers || {};
	this.options = objectAssign({}, defaultOptions, options);
	this.paused = false;
}



RequestQueue.prototype.dequeue = function(id)
{
	var item = this.items[id];
	var dequeued;
	
	if (item === undefined)
	{
		dequeued = new Error("Could not dequeue non-existent ID");
		callHandler(this.handlers.error, [dequeued, id]);
		return dequeued;
	}
	
	dequeued = dequeue(item, this);
	
	// If item was not in queue, then it's had its turn
	// and is not being manually dequeued before such time
	if (dequeued === false)
	{
		this.activeSockets--;
	}
	
	remove(item, this);
	
	startNext(this);
	
	if (this.priorityQueue.length===0 && this.activeSockets===0)
	{
		callHandler(this.handlers.end, []);
	}
	
	return true;
};



RequestQueue.prototype.enqueue = function(input)
{
	var data,id,queued,url;
	
	// enqueue("url");
	if (typeof input==="string" || input instanceof String)
	{
		url = input;
	}
	// enqueue({ url:"url" });
	else if (typeof input === "object")
	{
		data = input.data;
		id = input.id;
		url = input.url;
	}
	
	queued = enqueue(id, url, data, this);
	
	if (queued instanceof Error)
	{
		callHandler(this.handlers.error, [queued, id, url, data]);
	}
	else
	{
		startNext(this);
	}
	
	// ID or Error
	return queued;
};



RequestQueue.prototype.length = function()
{
	return this.priorityQueue.length;
};



RequestQueue.prototype.pause = function()
{
	this.paused = true;
};



RequestQueue.prototype.resume = function()
{
	this.paused = false;
	
	startNext(this);
};



//::: PRIVATE FUNCTIONS



/*
	Call a class' event handler if it exists.
*/
function callHandler(handler, args, timeout)
{
	if (typeof handler === "function")
	{
		if (timeout > 0)
		{
			setTimeout( function()
			{
				handler.apply(null, args);
				
			}, timeout);
		}
		else
		{
			handler.apply(null, args);
		}
	}
}



/*
	Remove item (id) from queue, but nowhere else.
*/
function dequeue(item, instance)
{
	var queueIndex = instance.priorityQueue.indexOf(item.id);
	
	if (queueIndex < 0) return false;
	
	instance.priorityQueue.splice(queueIndex, 1);
	
	return true;
}



/*
	Add item to queue and item list.
*/
function enqueue(id, url, data, instance)
{
	var hostKey = getHostKey(url, instance.options);
	
	if (hostKey === false)
	{
		return new Error("Could not enqueue invalid URI");
	}
	
	if (id===undefined || id===null || id==="") id = getId();
	
	if (instance.items[id] !== undefined)
	{
		return new Error("Could not enqueue non-unique ID");
	}
	
	instance.items[id] = { id:id, url:url, data:data || {}, hostKey:hostKey };
	instance.priorityQueue.push(id);
	
	return hostKey;
}



/*
	Remove item from item list and activeHosts.
*/
function remove(item, instance)
{
	instance.activeHosts[item.hostKey]--;
	
	if (instance.activeHosts[item.hostKey] <= 0)
	{
		delete instance.activeHosts[item.hostKey];
	}
	
	delete instance.items[item.id];
}



/*
	Possibly start next request(s).
*/
function startNext(instance)
{
	var availableSockets = instance.options.maxSockets - instance.activeSockets;
	var i = 0;
	var canStart,currItem,numItems;
	
	if (instance.paused === true) return;
	if (availableSockets <= 0) return;
	
	while (i < instance.priorityQueue.length)
	{
		canStart = false;
		currItem = instance.items[ instance.priorityQueue[i] ];
		
		// Not important, but feature complete
		if (instance.options.maxSocketsPerHost > 0)
		{
			if (instance.activeHosts[currItem.hostKey] === undefined)
			{
				// Create key with first count
				instance.activeHosts[currItem.hostKey] = 1;
				canStart = true;
			}
			else if (instance.activeHosts[currItem.hostKey] < instance.options.maxSocketsPerHost)
			{
				instance.activeHosts[currItem.hostKey]++;
				canStart = true;
			}
		}
		
		if (canStart === true)
		{
			instance.activeSockets++;
			availableSockets--;
			
			dequeue(currItem, instance);
			callHandler(instance.handlers.item, [currItem.id, currItem.url, currItem.data], instance.options.rateLimit);
			
			if (availableSockets <= 0) break;
		}
		else
		{
			// Move onto next
			i++;
		}
	}
}



module.exports = RequestQueue;
