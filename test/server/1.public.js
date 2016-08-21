"use strict";
var helpers = require("./helpers");
var RequestQueue = require("../../lib");

var expect = require("chai").expect;
var parseUrl = require("url").parse;
var URL = require("whatwg-url").URL;



describe("Public API", function()
{
	describe("enqueue() / dequeue() / length()", function()
	{
		it("enqueues valid URLs", function()
		{
			var queue = new RequestQueue(helpers.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			[
				helpers.urls[0],
				{ url:helpers.urls[0] },
				{ url:parseUrl(helpers.urls[0]) },
				{ url:new URL(helpers.urls[0]) }
				
			].forEach(url =>
			{
				expect( queue.enqueue(url) ).to.be.a("number");
			});
			
			expect( queue.length() ).to.equal(4);
		});
		
		
		
		it("dequeues valid IDs", function()
		{
			var queue = new RequestQueue(helpers.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			var id = queue.enqueue(helpers.urls[0]);
			
			expect( queue.dequeue(id) ).to.be.true;
			expect( queue.length() ).to.equal(0);
		});
		
		
		
		it("rejects and does not enqueue erroneous URLs", function()
		{
			var queue = new RequestQueue(helpers.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			[
				"/path/",
				"resource.html",
				"",
				1,
				null,
				{ url:parseUrl("/path/") },
				{ url:{} },
				{ url:[] },
				{ url:"/path/" },
				{ url:1 },
				{ url:null }
				
			].forEach(url =>
			{
				expect( queue.enqueue(url) ).to.be.instanceOf(Error);
				expect( queue.length() ).to.equal(0);
			});
		});
		
		
		
		it("rejects and neither enqueues nor dequeues invalid IDs", function()
		{
			var queue = new RequestQueue(helpers.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			expect( queue.enqueue({id:123, url:helpers.urls[0]}) ).to.not.be.instanceOf(Error);
			expect( queue.enqueue({id:123, url:helpers.urls[0]}) ).to.be.instanceOf(Error);
			
			expect( queue.dequeue(123456) ).to.be.instanceOf(Error);
			
			expect( queue.length() ).to.equal(1);
		});
	});
	
	
	
	describe("Handlers", function()
	{
		describe("item", function()
		{
			it("works", function(done)
			{
				var count = 0;
				var queue = new RequestQueue(helpers.options(),
				{
					item: function(input, itemDone)
					{
						if (++count >= helpers.urls.length)
						{
							done();
						}
					}
				});
				
				helpers.urls.forEach(queue.enqueue, queue);
			});
			
			
			
			it("supports custom IDs and custom data", function(done)
			{
				var count = 0;
				var queue = new RequestQueue(helpers.options(),
				{
					item: function(input, itemDone)
					{
						switch (++count)
						{
							case 1:
							{
								expect(input.id).to.equal(0);
								expect(input.url).to.equal(helpers.urls[0]);
								expect(input.data).to.equal(1);
								break;
							}
							case 2:
							{
								expect(input.id).to.equal(1);
								expect(input.url).to.equal(helpers.urls[1]);
								expect(input.data).to.equal(2);
								break;
							}
							case 3:
							{
								expect(input.id).to.equal(2);
								expect(input.url).to.equal(helpers.urls[2]);
								expect(input.data).to.equal(3);
								done();
								break;
							}
						}
					}
				});
				
				queue.enqueue({ id:0, url:helpers.urls[0], data:1 });
				queue.enqueue({ id:1, url:helpers.urls[1], data:2 });
				queue.enqueue({ id:2, url:helpers.urls[2], data:3 });
			});
			
			
			
			it("is not called with erroneous URLs", function(done)
			{
				var queue = new RequestQueue(helpers.options(),
				{
					item: function(input, itemDone)
					{
						done( new Error("this should not have been called") );
					}
				});
				
				["/path/","resource.html",""].forEach(queue.enqueue, queue);
				
				done();
			});
			
			
			
			it("is not called with erroneous custom IDs", function(done)
			{
				var count = 0;
				
				var queue = new RequestQueue(helpers.options(),
				{
					item: function(input, itemDone)
					{
						if (++count == 1)
						{
							// Simulate a remote connection
							setTimeout(done, helpers.delay);
						}
						else
						{
							done( new Error("this should not have been called") );
						}
					}
				});
				
				queue.enqueue({id:123, url:helpers.urls[0]});
				queue.enqueue({id:123, url:helpers.urls[0]});
				queue.dequeue(123456);
			});
		});
		
		
		
		describe("end", function()
		{
			it("works", function(done)
			{
				var queue = new RequestQueue(helpers.options(),
				{
					item: function(input, itemDone)
					{
						setTimeout(itemDone, helpers.delay);
					},
					end: function()
					{
						done();
					}
				});
				
				helpers.urls.forEach(queue.enqueue, queue);
			});
			
			
			
			it("is called when last item is dequeued", function(done)
			{
				var queue = new RequestQueue(helpers.options(),
				{
					end: function()
					{
						// Wait for `dequeued` to receive its value
						// since everything here is performed synchronously
						setImmediate( () =>
						{
							expect(dequeued).to.be.true;
							done();
						});
					}
				});
				
				// Prevent first queued item from immediately starting (and thus being auto-dequeued)
				queue.pause();
				
				var id = queue.enqueue(helpers.urls[0]);
				var dequeued = queue.dequeue(id);
			});
			
			
			
			it("is not called simply by calling resume()", function(done)
			{
				var queue = new RequestQueue(helpers.options(),
				{
					end: function()
					{
						done( new Error("this should not have been called") );
					}
				});
				
				queue.resume();
				
				setTimeout(done, helpers.delay*2);
			});
			
			
			
			it("is not called on erroneous dequeue", function(done)
			{
				var queue = new RequestQueue(helpers.options(),
				{
					end: function()
					{
						done( new Error("this should not have been called") );
					}
				});
				
				queue.dequeue("fakeid");
				
				setTimeout(done, helpers.delay*2);
			});
		});
	});
	
	
	
	describe("pause() / resume()", function()
	{
		it("works", function(done)
		{
			var count = 0;
			var resumed = false;
			
			helpers.testUrls(helpers.urls, helpers.options(), function(results)
			{
				expect(resumed).to.be.true;
				expect(results).to.deep.equal(helpers.urls);
				done();
			},
			function(input, queue)
			{
				if (++count === 1)
				{
					queue.pause();
					
					// Wait longer than queue should take if not paused+resumed
					setTimeout( () =>
					{
						resumed = true;
						queue.resume();
						
					}, helpers.expectedSyncMinDuration());
				}
			});
		});
	});
	
	
	
	describe("numActive()", function()
	{
		it("works", function(done)
		{
			var queue = new RequestQueue(helpers.options(),
			{
				item: function(input, itemDone)
				{
					setTimeout(itemDone, helpers.delay);
				},
				end: function()
				{
					expect( queue.numActive() ).to.equal(0);
					done();
				}
			});
			
			helpers.urls.forEach(queue.enqueue, queue);
			
			expect( queue.numActive() ).to.equal(helpers.urls.length);
		});
	});
	
	
	
	describe("numQueued()", function()
	{
		it("works", function(done)
		{
			var queue = new RequestQueue(helpers.options(),
			{
				item: function(input, itemDone)
				{
					setTimeout(itemDone, helpers.delay);
				},
				end: function()
				{
					expect( queue.numQueued() ).to.equal(0);
					done();
				}
			});
			
			helpers.urls.forEach(queue.enqueue, queue);
			
			expect( queue.numQueued() ).to.equal(0);
		});
	});
	
	
	
	describe("Options", function()
	{
		describe("all disabled", function()
		{
			it("works", function(done)
			{
				helpers.testUrls(helpers.urls, helpers.options(), function(results)
				{
					expect(results).to.deep.equal(helpers.urls);
					done();
				});
			});
		});
		
		
		
		describe("maxSockets", function()
		{
			before( () => helpers.clearDurations() );
			
			
			
			describe("=0", function()
			{
				it("does nothing", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ maxSockets:0 }), function(results)
					{
						done( new Error("this should not have been called") );
					});
					
					setTimeout( () => done(), helpers.expectedSyncMinDuration() );
				});
			});
			
			
			
			[1,2,3,4,Infinity].forEach(value =>
			{
				describe("="+value, function()
				{
					before( () => helpers.addDurationGroup() );
					
					
					
					it("works", function(done)
					{
						helpers.testUrls(helpers.urls, helpers.options({ maxSockets:value }), function(results, duration)
						{
							helpers.compareDurations(duration, function(prevGroupDuration)
							{
								expect(duration).to.be.below(prevGroupDuration);
							});
							
							expect(results).to.deep.equal(helpers.urls);
							done();
						});
					});
					
					
					
					it("supports ignorePorts=true", function(done)
					{
						helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(helpers.urls);
							done();
						});
					});
					
					
					
					it("supports ignoreSchemes=true", function(done)
					{
						helpers.testUrls(helpers.urls, helpers.options({ ignoreSchemes:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(helpers.urls);
							done();
						});
					});
					
					
					
					it("supports ignoreSubdomains=true", function(done)
					{
						helpers.testUrls(helpers.urls, helpers.options({ ignoreSubdomains:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(helpers.urls);
							done();
						});
					});
					
					
					
					it("supports all boolean options true", function(done)
					{
						helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(helpers.urls);
							done();
						});
					});
				});
			});
		});
		
		
		
		describe("maxSocketsPerHost", function()
		{
			before( () => helpers.clearDurations() );
			
			
			
			describe("=0", function()
			{
				it("does nothing", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ maxSocketsPerHost:0 }), function(results)
					{
						done( new Error("this should not have been called") );
					});
					
					setTimeout( () => done(), helpers.expectedSyncMinDuration() );
				});
			});
			
			
			
			describe("=1", function()
			{
				before( () => helpers.addDurationGroup() );
				
				
				
				it("works", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ maxSocketsPerHost:1 }), function(results, duration)
					{
						helpers.compareDurations(duration, function(prevGroupDuration)
						{
							expect(duration).to.be.below(prevGroupDuration);
						});
						
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							"http://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports ignorePorts=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, maxSocketsPerHost:1 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							
							"https://google.com/something.html",
							"http://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports ignoreSchemes=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSchemes:true, maxSocketsPerHost:1 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"http://www.google.com/",	// this LOOKS wrong, but isn't; it's consecutive because port is different from above (80 vs 443)
							"https://google.com/",
							"http://google.com/",
							
							"https://google.com:8080/",
							
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							
							"https://google.com:8080/",
							
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							"http://google.com/something.html",
							
							"http://google.com:8080/",
							
							"https://google.com/something.html",
							"http://google.com/something.html",
							
							"http://google.com:8080/"
						]);
						done();
					});
				});
				
				
				
				it("supports ignoreSubdomains=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:1 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"http://www.google.com/",
							
							"https://google.com:8080/",
							"http://google.com:8080/",
							
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/",
							"http://google.com/",
							"https://google.com/",
							"http://google.com/",
							
							"https://google.com/something.html",
							"http://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports all boolean options true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:1 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"https://127.0.0.1/",
							"https://www.google.com/",
							"https://127.0.0.1/",
							"http://www.google.com/",
							"http://127.0.0.1/",
							"http://www.google.com/",
							"http://127.0.0.1/",
							
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
							"http://google.com/something.html"
						]);
						done();
					});
				});
			});
			
			
			
			describe("=2", function()
			{
				before( () => helpers.addDurationGroup() );
				
				
				
				it("works", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ maxSocketsPerHost:2 }), function(results, duration)
					{
						helpers.compareDurations(duration, function(prevGroupDuration)
						{
							expect(duration).to.be.below(prevGroupDuration);
						});
						
						expect(results).to.deep.equal(
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
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports ignorePorts=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, maxSocketsPerHost:2 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"https://google.com/",
							"http://google.com/",
							"http://google.com/",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",
							
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports ignoreSchemes=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSchemes:true, maxSocketsPerHost:2 }), function(results)
					{
						expect(results).to.deep.equal(
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
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html",
							
							"http://google.com:8080/",
							"http://google.com:8080/"
						]);
						done();
					});
				});
				
				
				
				it("supports ignoreSubdomains=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:2 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							
							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/",
							"https://google.com/",
							"http://google.com/",
							"http://google.com/",
							
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports all boolean options true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:2 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							
							"http://www.google.com/",
							"http://www.google.com/",
							
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
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
							"http://google.com/something.html"
						]);
						done();
					});
				});
			});
			
			
			
			describe("=3", function()
			{
				before( () => helpers.addDurationGroup() );
				
				
				
				it("works", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ maxSocketsPerHost:3 }), function(results, duration)
					{
						helpers.compareDurations(duration, function(prevGroupDuration)
						{
							expect(duration).to.be.within(prevGroupDuration-20, prevGroupDuration+20);
						});
						
						expect(results).to.deep.equal(
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
							
							"http://google.com/something.html",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports ignorePorts=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, maxSocketsPerHost:3 }), function(results)
					{
						expect(results).to.deep.equal(
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
							"http://google.com:8080/",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com:8080/",
							
							"https://google.com/something.html",
							
							"http://google.com:8080/",
							
							"http://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports ignoreSchemes=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSchemes:true, maxSocketsPerHost:3 }), function(results)
					{
						expect(results).to.deep.equal(
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
							
							"https://google.com/something.html",
							
							"http://google.com/something.html",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							
							"http://google.com/something.html",
							
							"http://google.com:8080/"
						]);
						done();
					});
				});
				
				
				
				it("supports ignoreSubdomains=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:3 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							
							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/",
							
							"https://google.com/something.html",
							
							"http://google.com/",
							
							"http://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports all boolean options true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:3 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							
							"http://www.google.com/",
							
							"https://google.com/",
							"https://google.com/",
							
							"http://127.0.0.1/",
							
							"http://google.com/",
							"http://google.com/",
							
							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",
							
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
			});
			
			
			
			describe("=4", function()
			{
				before( () => helpers.addDurationGroup() );
				
				
				
				it("works", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ maxSocketsPerHost:4 }), function(results, duration)
					{
						helpers.compareDurations(duration, function(prevGroupDuration)
						{
							expect(duration).to.be.below(prevGroupDuration);
						});
						
						expect(results).to.deep.equal(helpers.urls);
						done();
					});
				});
				
				
				
				it("supports ignorePorts=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, maxSocketsPerHost:4 }), function(results)
					{
						expect(results).to.deep.equal(
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
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports ignoreSchemes=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSchemes:true, maxSocketsPerHost:4 }), function(results)
					{
						expect(results).to.deep.equal(helpers.urls);
						done();
					});
				});
				
				
				
				it("supports ignoreSubdomains=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:4 }), function(results)
					{
						expect(results).to.deep.equal(
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
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
						done();
					});
				});
				
				
				
				it("supports all boolean options true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:4 }), function(results)
					{
						expect(results).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",
							
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
							"http://google.com/something.html"
						]);
						done();
					});
				});
			});
			
			
			
			describe("=Infinity", function()
			{
				before( () => helpers.addDurationGroup() );
				
				
				
				it("works", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ maxSocketsPerHost:Infinity }), function(results, duration)
					{
						helpers.compareDurations(duration, function(prevGroupDuration)
						{
							expect(duration).to.be.within(prevGroupDuration-20, prevGroupDuration+20);
						});
						
						expect(results).to.deep.equal(helpers.urls);
						done();
					});
				});
				
				
				
				it("supports ignorePorts=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(helpers.urls);
						done();
					});
				});
				
				
				
				it("supports ignoreSchemes=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSchemes:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(helpers.urls);
						done();
					});
				});
				
				
				
				it("supports ignoreSubdomains=true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(helpers.urls);
						done();
					});
				});
				
				
				
				it("supports all boolean options true", function(done)
				{
					helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(helpers.urls);
						done();
					});
				});
			});
		});
		
		
		
		describe("rateLimit=50", function()
		{
			it("works", function(done)
			{
				helpers.testUrls(helpers.urls, helpers.options({ rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(helpers.urls);
					done();
				});
			});
			
			
			
			it("supports ignorePorts=true", function(done)
			{
				helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(helpers.urls);
					done();
				});
			});
			
			
			
			it("supports ignoreSchemes=true", function(done)
			{
				helpers.testUrls(helpers.urls, helpers.options({ ignoreSchemes:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(helpers.urls);
					done();
				});
			});
			
			
			
			it("supports ignoreSubdomains=true", function(done)
			{
				helpers.testUrls(helpers.urls, helpers.options({ ignoreSubdomains:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(helpers.urls);
					done();
				});
			});
			
			
			
			it("supports all boolean options true", function(done)
			{
				helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(helpers.urls);
					done();
				});
			});
		});
		
		
		
		describe("all boolean options true, maxSockets=2, maxSocketsPerHost=1, rateLimit=50", function()
		{
			it("works", function(done)
			{
				this.timeout(0);
				
				helpers.testUrls(helpers.urls, helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSockets:2, maxSocketsPerHost:1, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least( (helpers.urls.length-4) * (50 + helpers.delay) );
					expect(results).to.deep.equal(
					[
						"https://www.google.com/",
						
						"https://127.0.0.1/",
						
						"https://www.google.com/",
						
						"https://127.0.0.1/",
						
						"http://www.google.com/",
						
						"http://127.0.0.1/",
						
						"http://www.google.com/",
						
						"http://127.0.0.1/",
						
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
						"http://google.com/something.html"
					]);
					done();
				});
			});
		});
		
		
		
		describe("default options", function()
		{
			it("works", function(done)
			{
				helpers.testUrls(helpers.urls, undefined, function(results)
				{
					expect(results).to.deep.equal(
					[
						"https://www.google.com/",
						"https://127.0.0.1/",
						"https://www.google.com/",
						"https://127.0.0.1/",
						"http://www.google.com/",
						"http://127.0.0.1/",
						"http://www.google.com/",
						"http://127.0.0.1/",
						
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
						"http://google.com/something.html"
					]);
					done();
				});
			});
		});
	});
	
	
	
	describe("Test suite functions", function()
	{
		it("helpers.testUrls reports erroneous URLs", function(done)
		{
			var urls = [
				"https://www.google.com/",
				"path/to/resource.html",
				"http://www.google.com/"
			];
			
			helpers.testUrls(urls, helpers.options(), function(results)
			{
				expect(results[0]).to.be.instanceOf(Error);
				expect(results[1]).to.equal("https://www.google.com/");
				expect(results[2]).to.equal("http://www.google.com/");
				done();
			});
		});
	});
});
