"use strict";
var getKey = require("./getKey");

var objectAssign = require("object-assign");

var defaultOptions = 
{
	ignorePorts: false,
	ignoreSchemes: false,
	ignoreSubdomains: false,
	maxSockets: Infinity
};

//var urlCount = 0;



function concurrentHost(options)
{
	this.hosts = {};
	this.options = objectAssign({}, defaultOptions, options);
}



concurrentHost.prototype.dequeue = function(data)
{
	// TODO :: avoid searching
	var i = this.hosts[data.key].indexOf(data);
	
	if (i >= 0)
	{
		if (this.hosts[data.key].length > 1)
		{
			// Remove specific index
			this.hosts[data.key].splice(i, 1);
			
			getNext(this.hosts[data.key], this.options);
		}
		else
		{
			// Remove whole array instead of leaving it empty in memory
			delete this.hosts[data.key];
		}
	}
	else
	{
		// don't think this could happen
	}
};



concurrentHost.prototype.enqueue = function(url, callback)
{
	var key = getKey(url, this.options);
	
	if (key instanceof Error)
	{
		callback(key, url);
		return;
	}
	
	if (this.hosts[key] === undefined)
	{
		// New queue
		this.hosts[key] = [];
	}
	
	this.hosts[key].push({ active:false, callback:callback, /*id:urlCount++,*/ key:key, url:url });
	
	getNext(this.hosts[key], this.options);
};



function getNext(hostData, options, callback)
{
	var data;
	var len = Math.min(hostData.length, options.maxSockets);
	
	// TODO :: avoid searching
	for (var i=0; i<len; i++)
	{
		data = hostData[i];
		
		if (data.active === false)
		{
			data.active = true;
			
			data.callback(null, data.url, data);
			
			return;
		}
	}
}



module.exports = concurrentHost;
