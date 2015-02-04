"use strict";
var ConcurrentHosts = require("../lib");

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



function doneCheck(result, results, urls, callback)
{
	if (results.push(result) >= urls.length)
	{
		callback(results);
	}
}



function testUrls(urls, libOptions, callback)
{
	var concurrency = new ConcurrentHosts(libOptions);
	var results = [];
	
	urls.forEach( function(url)
	{
		concurrency.enqueue(url, function(error, id)
		{
			if (error !== null)
			{
				doneCheck(error, results, urls, callback);
			}
			else
			{
				setTimeout( function()
				{
					concurrency.dequeue(id);
					doneCheck(url, results, urls, callback);
				}, 50);
			}
		});
	});
}



module.exports = 
{
	testUrls: testUrls,
	urls: _urls
};
