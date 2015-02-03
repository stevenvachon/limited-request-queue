"use strict";
var ConcurrentHost = require("./lib");

// URLs purposely doubled up
var urls = 
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



describe("asdf", function()
{
	it("should work", function(done)
	{
		// temp
		this.timeout(10000);
		
		var concurrency = new ConcurrentHost({ maxSockets:1 });
		var count = 0;
		
		for (var i=0; i<urls.length; i++)
		{
			concurrency.enqueue(urls[i], function(error, url, data)
			{
				if (error !== null)
				{
					done(error);
				}
				else
				{
					setTimeout( function()
					{
						console.log("checked "+url);
						
						concurrency.dequeue(data);
						
						if (++count >= urls.length)
						{
							done();
						}
					}, 500);
				}
			});
		}
	});
});
