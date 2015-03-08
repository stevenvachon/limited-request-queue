"use strict";
var getHostKey = require("./getHostKey");
var getId = require("./getId");

var objectAssign = require("object-assign");

var defaultOptions = 
{
	ignorePorts: true,
	ignoreSchemes: true,
	ignoreSubdomains: true,
	maxSockets: Infinity,
	maxSocketsPerHost: 1,
	rateLimit: 0
};



function ConcurrentHosts(options)
{
	this.activeHosts = {};		// Socket counts stored by host
	this.items = {};			// Items stored by ID
	this.priorityQueue = [];	// List of IDs
	
	this.activeSockets = 0;
	this.options = objectAssign({}, defaultOptions, options);
	this.paused = false;
}



ConcurrentHosts.prototype.dequeue = function(id)
{
	var item = this.items[id];
	
	// If item wasn't found
	if (item === undefined) return false;
	
	dequeue(item, this);
	remove(item, this);
	
	startNext(this);
	
	return true;
};



ConcurrentHosts.prototype.enqueue = function(url, id, callback)
{
	// enqueue(url, callback)
	if (typeof id === "function")
	{
		callback = id;
		id = undefined;
	}
	
	var item = enqueue(url, id, callback, this);
	
	// If invalid url or id
	if (item === false) return false;
	
	startNext(this);
	
	return true;
};



ConcurrentHosts.prototype.pause = function()
{
	this.paused = true;
};



ConcurrentHosts.prototype.resume = function()
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
			item.callback(null, item.id);
			
		}, instance.options.rateLimit);
	}
	else
	{
		item.callback(null, item.id);
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
	
	return item;
}



/*
	Add item to queue and item list.
*/
function enqueue(url, id, callback, instance)
{
	var hostKey = getHostKey(url, instance.options);
	var item;
	
	if (hostKey instanceof Error)
	{
		callback(hostKey);
		return false;
	}
	
	if (id === undefined) id = getId();
	
	item = { callback:callback, id:id, hostKey:hostKey };
	
	instance.items[id] = item;
	instance.priorityQueue.push(id);
	
	return item;
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
		
		if (canStart === true)
		{
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



module.exports = ConcurrentHosts;
