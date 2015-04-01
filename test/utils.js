"use strict";
var RequestQueue = require("../lib");

var objectAssign = require("object-assign");

var delay = 15;

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



function expectedSyncMinDuration()
{
	return _urls.length * delay + 50;
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
	var queued;
	var results = [];
	var startTime = Date.now();
	
	var queue = new RequestQueue(libOptions, 
	{
		error: function(error, id, input)
		{
			if (typeof eachCallback === "function")
			{
				eachCallback(input, queue);
			}
			
			doneCheck(error, results, urls, startTime, completeCallback);
		},
		item: function(input, done)
		{
			if (typeof eachCallback === "function")
			{
				eachCallback(input, queue);
			}
			
			// Simulate a remote connection
			setTimeout( function()
			{
				done();
				doneCheck(input.url, results, urls, startTime, completeCallback);
				
			}, delay);
		}
	});
	
	urls.forEach(queue.enqueue, queue);
}



module.exports = 
{
	addDurationGroup: addDurationGroup,
	clearDurations: clearDurations,
	compareDurations: compareDurations,
	delay: delay,
	expectedSyncMinDuration: expectedSyncMinDuration,
	options: options,
	RequestQueue: RequestQueue,
	testUrls: testUrls,
	urls: _urls
};
