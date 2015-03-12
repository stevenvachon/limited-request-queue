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
	
	// If item wasn't found
	if (item === undefined) return false;
	
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
		callHandler("drain", this);
	}
	
	return true;
};



RequestQueue.prototype.enqueue = function(url, id, callback)
{
	// enqueue(url, callback)
	if (typeof id === "function")
	{
		callback = id;
		id = undefined;
	}
	
	var queued = enqueue(url, id, callback, this);
	
	// If invalid url or id
	if (queued === false) return false;
	
	startNext(this);
	
	return true;
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



/*
	Call item's callback with no error.
*/
function callCallback(item, instance)
{
	if (instance.options.rateLimit > 0)
	{
		setTimeout( function()
		{
			item.callback(null, item.id, item.url);
			
		}, instance.options.rateLimit);
	}
	else
	{
		item.callback(null, item.id, item.url);
	}
}


/*
	Call a class' event handler.
*/
function callHandler(event, instance)
{
	if (typeof instance.handlers[event] === "function")
	{
		instance.handlers[event]();
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
function enqueue(url, id, callback, instance)
{
	var hostKey = getHostKey(url, instance.options);
	
	if (hostKey instanceof Error)
	{
		callback(hostKey);
		return false;
	}
	
	if (id === undefined) id = getId();
	
	if (instance.items[id] !== undefined)
	{
		callback(new Error("Invalid ID"), id, url);
		return false;
	}
	
	instance.items[id] = { callback:callback, url:url, id:id, hostKey:hostKey };
	instance.priorityQueue.push(id);
	
	return true;
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
			callCallback(currItem, instance);
			
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
