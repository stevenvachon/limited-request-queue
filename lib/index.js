"use strict";
var getHostKey = require("./getHostKey");
var getId = require("./getId");

var objectAssign = require("object-assign");

var defaultOptions = 
{
	ignorePorts: true,
	ignoreSchemes: true,
	ignoreSubdomains: true,
	//maxSockets: Infinity,
	maxSocketsPerHost: 1/*,
	rateLimit: 0*/
};



function ConcurrentHosts(options)
{
	this.hosts = {};
	this.items = {};
	this.options = objectAssign({}, defaultOptions, options);
	//this.paused = false;
}



ConcurrentHosts.prototype.dequeue = function(id)
{
	var i;
	var item = this.items[id];
	
	if (item === undefined) return false;
	
	// Let error throw if this.hosts[item.hostKey] does not exist
	// as it'd be a sign of an internal error
	
	i = this.hosts[item.hostKey].indexOf(item);
	
	if (i < 0) return false;
	
	if (this.hosts[item.hostKey].length > 1)
	{
		// Remove specific index
		this.hosts[item.hostKey].splice(i, 1);
		
		getNext(this.hosts[item.hostKey], this.options);
	}
	else
	{
		// Remove whole array instead of leaving it empty in memory
		delete this.hosts[item.hostKey];
	}
	
	delete this.items[id];
	
	// No errors occurred
	return true;
};



ConcurrentHosts.prototype.enqueue = function(url/*, id*/, callback)
{
	var hostKey = getHostKey(url, this.options);
	var item;
	
	if (hostKey instanceof Error)
	{
		callback(hostKey);
		return;
	}
	
	if (this.hosts[hostKey] === undefined)
	{
		// New queue
		this.hosts[hostKey] = [];
	}
	
	item = { active:false, callback:callback, id:/*id || */getId(), hostKey:hostKey };
	
	this.hosts[hostKey].push(item);
	this.items[item.id] = item;
	
	getNext(this.hosts[hostKey], this.options);
};



/*ConcurrentHosts.prototype.pause = function()
{
	this.paused = true;
};



ConcurrentHosts.prototype.resume = function()
{
	this.paused = false;
	
	// TODO :: check if ready for next request
	// TODO :: figure out where to continue from
};*/



function getNext(queue, options, callback)
{
	var i,item;
	var len = Math.min(queue.length, options.maxSocketsPerHost);
	
	for (i=0; i<len; i++)
	{
		item = queue[i];
		
		if (item.active === false)
		{
			item.active = true;
			item.callback(null, item.id);
			return;
		}
	}
}



module.exports = ConcurrentHosts;
