"use strict";
var RequestQueue = require("../lib");

var objectAssign = require("object-assign");

var delay = 50;

var durations = [];

var _urls = 
[
	"https://www.google.com/",
	"https://www.google.com/",
	
	"http://www.google.com/",
	"http://www.google.com/",
	
	"https://google.com/",
	"https://google.com/",
	
	"http://google.com/",
	"http://google.com/",
	
	"https://google.com:8080/",
	"https://google.com:8080/",
	
	"http://google.com:8080/",
	"http://google.com:8080/",
	
	"https://google.com/something.html",
	"https://google.com/something.html",
	
	"http://google.com/something.html",
	"http://google.com/something.html",
	
	"https://127.0.0.1/",
	"https://127.0.0.1/",
	
	"http://127.0.0.1/",
	"http://127.0.0.1/"
];



function addDurationGroup()
{
	durations.push([]);
}



function clearDurations()
{
	durations.length = 0;
}



function compareDurations(duration, callback)
{
	var curGroup = durations[ durations.length-1 ];
	var prevGroupDuration;
	
	curGroup.push(duration);
	
	if (durations.length > 1)
	{
		prevGroupDuration = durations[durations.length-2][ curGroup.length-1 ];
		callback(prevGroupDuration);
	}
}



function doneCheck(result, results, urls, startTime, callback)
{
	var duration;
	
	if (results.push(result) >= urls.length)
	{
		duration = Date.now() - startTime;
		
		callback(results, duration);
	}
}



function options(overrides)
{
	return objectAssign
	(
		{},
		{
			defaultPorts: {ftp:21, http:80, https:443},
			ignorePorts: false,
			ignoreSchemes: false,
			ignoreSubdomains: false,
			maxSockets: Infinity,
			maxSocketsPerHost: Infinity,
			rateLimit: 0
		},
		overrides
	);
}



function testUrls(urls, libOptions, completeCallback, eachCallback)
{
	var queue = new RequestQueue(libOptions);
	var results = [];
	var startTime = Date.now();
	
	urls.forEach( function(url)
	{
		queue.enqueue(url, function(error, id, url)
		{
			if (typeof eachCallback === "function")
			{
				eachCallback(url, queue);
			}
			
			if (error !== null)
			{
				doneCheck(error, results, urls, startTime, completeCallback);
			}
			else
			{
				// Simulate a remote connection
				setTimeout( function()
				{
					queue.dequeue(id);
					doneCheck(url, results, urls, startTime, completeCallback);
				}, delay);
			}
		});
	});
}



module.exports = 
{
	addDurationGroup: addDurationGroup,
	clearDurations: clearDurations,
	compareDurations: compareDurations,
	delay: delay,
	options: options,
	RequestQueue: RequestQueue,
	testUrls: testUrls,
	urls: _urls
};
