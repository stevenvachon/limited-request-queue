"use strict";
var utils = require("./utils");

var expect = require("chai").expect;
var urllib = require("url");



// TODO :: test numActive()
describe("Public API", function()
{
	describe("enqueue() / dequeue() / length()", function()
	{
		it("valid URLs should be enqueued", function(done)
		{
			var queue = new utils.RequestQueue(utils.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			[
				utils.urls[0],
				{ url:utils.urls[0] },
				{ url:urllib.parse(utils.urls[0]) }
				
			].forEach( function(url)
			{
				expect( queue.enqueue(url) ).to.be.a("number");
			});
			
			expect( queue.length() ).to.equal(3);
			done();
		});
		
		
		
		it("valid IDs should be dequeued", function(done)
		{
			var queue = new utils.RequestQueue(utils.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			var id = queue.enqueue(utils.urls[0]);
			
			expect( queue.dequeue(id) ).to.be.true;
			expect( queue.length() ).to.equal(0);
			done();
		});
		
		
		
		it("erroneous URLs should be reported with enqueue()", function(done)
		{
			var queue = new utils.RequestQueue(utils.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			[
				"/path/",
				"resource.html",
				"",
				{ url:urllib.parse("/path/") },
				{ url:{} }
				
			].forEach( function(url)
			{
				expect( queue.enqueue(url) ).to.be.instanceOf(Error);
				expect( queue.length() ).to.equal(0);
			});
			
			done();
		});
		
		
		
		it("erroneous IDs should be reported with enqueue() and dequeue()", function(done)
		{
			var queue = new utils.RequestQueue(utils.options());
			
			// Prevent first queued item from immediately starting (and thus being auto-dequeued)
			queue.pause();
			
			expect( queue.enqueue({id:123, url:utils.urls[0]}) ).to.not.be.instanceOf(Error);
			expect( queue.enqueue({id:123, url:utils.urls[0]}) ).to.be.instanceOf(Error);
			
			expect( queue.dequeue(123456) ).to.be.instanceOf(Error);
			
			expect( queue.length() ).to.equal(1);
			
			done();
		});
	});
	
	
	
	describe("Handlers", function()
	{
		describe("item", function()
		{
			it("should work", function(done)
			{
				var count = 0;
				var queue = new utils.RequestQueue(utils.options(),
				{
					item: function(url, data, done2)
					{
						if (++count >= utils.urls.length)
						{
							done();
						}
					}
				});
				
				utils.urls.forEach(queue.enqueue, queue);
			});
			
			
			
			it("should support custom IDs and custom data", function(done)
			{
				var count = 0;
				var queue = new utils.RequestQueue(utils.options(),
				{
					item: function(input, done2)
					{
						switch (++count)
						{
							case 1:
							{
								expect(input.id).to.equal(0);
								expect(input.url).to.equal(utils.urls[0]);
								expect(input.data).to.equal(1);
								break;
							}
							case 2:
							{
								expect(input.id).to.equal(1);
								expect(input.url).to.equal(utils.urls[1]);
								expect(input.data).to.equal(2);
								break;
							}
							case 3:
							{
								expect(input.id).to.equal(2);
								expect(input.url).to.equal(utils.urls[2]);
								expect(input.data).to.equal(3);
								done();
								break;
							}
						}
					}
				});
				
				queue.enqueue({ id:0, url:utils.urls[0], data:1 });
				queue.enqueue({ id:1, url:utils.urls[1], data:2 });
				queue.enqueue({ id:2, url:utils.urls[2], data:3 });
			});
			
			
			
			it("should not be called with erroneous URLs", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					item: function(input, done2)
					{
						done( new Error("this should not have been called") );
					}
				});
				
				["/path/","resource.html",""].forEach(queue.enqueue, queue);
				
				done();
			});
			
			
			
			it("should not be called with erroneous custom IDs", function(done)
			{
				var count = 0;
				
				var queue = new utils.RequestQueue(utils.options(),
				{
					item: function(input, done2)
					{
						if (++count == 1)
						{
							// Simulate a remote connection
							setTimeout(done, utils.delay);
						}
						else
						{
							done( new Error("this should not have been called") );
						}
					}
				});
				
				queue.enqueue({id:123, url:utils.urls[0]});
				queue.enqueue({id:123, url:utils.urls[0]});
				queue.dequeue(123456);
			});
		});
		
		
		
		describe("end", function()
		{
			it("should work", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					item: function(input, done2)
					{
						setTimeout(done2, utils.delay);
					},
					end: function()
					{
						done();
					}
				});
				
				utils.urls.forEach(queue.enqueue, queue);
			});
			
			
			
			it("should be called when last item is dequeued", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					end: function()
					{
						// Wait for `dequeued` to receive its value
						// since everything here is performed synchronously
						setImmediate( function()
						{
							expect(dequeued).to.be.true;
							done();
						});
					}
				});
				
				// Prevent first queued item from immediately starting (and thus being auto-dequeued)
				queue.pause();
				
				var id = queue.enqueue(utils.urls[0]);
				var dequeued = queue.dequeue(id);
			});
			
			
			
			it("should not be called simply by calling resume()", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					end: function()
					{
						done( new Error("this should not have been called") );
					}
				});
				
				queue.resume();
				
				setTimeout(done, utils.delay*2);
			});
			
			
			
			it("should not be called on erroneous dequeue", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					end: function()
					{
						done( new Error("this should not have been called") );
					}
				});
				
				queue.dequeue("fakeid");
				
				setTimeout(done, utils.delay*2);
			});
		});
		
		
		
		describe("error", function()
		{
			it("should report erroneous custom IDs", function(done)
			{
				var errorCount = 0;
				var successCount = 0;
				
				var queue = new utils.RequestQueue(utils.options(),
				{
					error: function(error, id, input)
					{
						errorCount++;
					},
					item: function(input, done2)
					{
						successCount++;
						
						// Simulate a remote connection
						setTimeout(done2, utils.delay);
					},
					end: function()
					{
						expect(errorCount).to.equal(2);
						expect(successCount).to.equal(1);
						done();
					}
				});
				
				queue.enqueue({id:123, url:utils.urls[0]});
				queue.enqueue({id:123, url:utils.urls[0]});
				queue.dequeue(123456);
			});
			
			
			
			it("should report erroneous URLs", function(done)
			{
				var errorCount = 0;
				
				var queue = new utils.RequestQueue(utils.options(),
				{
					error: function(error, id, input)
					{
						errorCount++;
					},
					item: function(input, done2)
					{
						done( new Error("this should not have been called") );
					},
					end: function()
					{
						done( new Error("this should not have been called") );
					}
				});
				
				["/path/","resource.html",""].forEach(queue.enqueue, queue);
				
				expect(errorCount).to.equal(3);
				done();
			});
		});
	});
	
	
	
	describe("pause() / resume()", function()
	{
		it("should work", function(done)
		{
			var count = 0;
			var resumed = false;
			
			utils.testUrls(utils.urls, utils.options(), function(results)
			{
				expect(resumed).to.be.true;
				expect(results).to.deep.equal(utils.urls);
				done();
			},
			function(input, queue)
			{
				if (++count === 1)
				{
					queue.pause();
					
					// Wait longer than queue should take if not paused+resumed
					setTimeout( function()
					{
						resumed = true;
						queue.resume();
						
					}, utils.expectedSyncMinDuration());
				}
			});
		});
	});
	
	
	
	describe("numActive()", function()
	{
		it("should work", function(done)
		{
			var queue = new utils.RequestQueue(utils.options(),
			{
				item: function(input, done2)
				{
					setTimeout(done2, utils.delay);
				},
				end: function()
				{
					expect( queue.numActive() ).to.equal(0);
					done();
				}
			});
			
			utils.urls.forEach(queue.enqueue, queue);
			
			expect( queue.numActive() ).to.equal(utils.urls.length);
		});
	});
	
	
	
	describe("Options", function()
	{
		describe("all disabled", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options(), function(results)
				{
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
		});
		
		
		
		describe("maxSockets", function()
		{
			before( function(done)
			{
				utils.clearDurations();
				done();
			});
			
			
			
			describe("=0", function()
			{
				it("should do nothing", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ maxSockets:0 }), function(results)
					{
						done( new Error("this should not have been called") );
					});
					
					setTimeout( function()
					{
						done();
					}, utils.expectedSyncMinDuration());
				});
			});
			
			
			
			[1,2,3,4,Infinity].forEach( function(value)
			{
				describe("="+value, function()
				{
					before( function(done)
					{
						utils.addDurationGroup();
						done();
					});
					
					
					
					it("should work", function(done)
					{
						utils.testUrls(utils.urls, utils.options({ maxSockets:value }), function(results, duration)
						{
							utils.compareDurations(duration, function(prevGroupDuration)
							{
								expect(duration).to.be.below(prevGroupDuration);
							});
							
							expect(results).to.deep.equal(utils.urls);
							done();
						});
					});
					
					
					
					it("should work with ignorePorts=true", function(done)
					{
						utils.testUrls(utils.urls, utils.options({ ignorePorts:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(utils.urls);
							done();
						});
					});
					
					
					
					it("should work with ignoreSchemes=true", function(done)
					{
						utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(utils.urls);
							done();
						});
					});
					
					
					
					it("should work with ignoreSubdomains=true", function(done)
					{
						utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(utils.urls);
							done();
						});
					});
					
					
					
					it("should work with all boolean options true", function(done)
					{
						utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSockets:value }), function(results)
						{
							expect(results).to.deep.equal(utils.urls);
							done();
						});
					});
				});
			});
		});
		
		
		
		describe("maxSocketsPerHost", function()
		{
			before( function(done)
			{
				utils.clearDurations();
				done();
			});
			
			
			
			describe("=0", function()
			{
				it("should do nothing", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:0 }), function(results)
					{
						done( new Error("this should not have been called") );
					});
					
					setTimeout( function()
					{
						done();
					}, utils.expectedSyncMinDuration());
				});
			});
			
			
			
			describe("=1", function()
			{
				before( function(done)
				{
					utils.addDurationGroup();
					done();
				});
				
				
				
				it("should work", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:1 }), function(results, duration)
					{
						utils.compareDurations(duration, function(prevGroupDuration)
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
				
				
				
				it("should work with ignorePorts=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, maxSocketsPerHost:1 }), function(results)
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
				
				
				
				it("should work with ignoreSchemes=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, maxSocketsPerHost:1 }), function(results)
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
				
				
				
				it("should work with ignoreSubdomains=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, maxSocketsPerHost:1 }), function(results)
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
				
				
				
				it("should work with all boolean options true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:1 }), function(results)
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
				before( function(done)
				{
					utils.addDurationGroup();
					done();
				});
				
				
				
				it("should work", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:2 }), function(results, duration)
					{
						utils.compareDurations(duration, function(prevGroupDuration)
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
				
				
				
				it("should work with ignorePorts=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, maxSocketsPerHost:2 }), function(results)
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
				
				
				
				it("should work with ignoreSchemes=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, maxSocketsPerHost:2 }), function(results)
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
				
				
				
				it("should work with ignoreSubdomains=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, maxSocketsPerHost:2 }), function(results)
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
				
				
				
				it("should work with all boolean options true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:2 }), function(results)
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
				before( function(done)
				{
					utils.addDurationGroup();
					done();
				});
				
				
				
				it("should work", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:3 }), function(results, duration)
					{
						utils.compareDurations(duration, function(prevGroupDuration)
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
				
				
				
				it("should work with ignorePorts=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, maxSocketsPerHost:3 }), function(results)
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
				
				
				
				it("should work with ignoreSchemes=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, maxSocketsPerHost:3 }), function(results)
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
				
				
				
				it("should work with ignoreSubdomains=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, maxSocketsPerHost:3 }), function(results)
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
				
				
				
				it("should work with all boolean options true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:3 }), function(results)
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
				before( function(done)
				{
					utils.addDurationGroup();
					done();
				});
				
				
				
				it("should work", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:4 }), function(results, duration)
					{
						utils.compareDurations(duration, function(prevGroupDuration)
						{
							expect(duration).to.be.below(prevGroupDuration);
						});
						
						expect(results).to.deep.equal(utils.urls);
						done();
					});
				});
				
				
				
				it("should work with ignorePorts=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, maxSocketsPerHost:4 }), function(results)
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
				
				
				
				it("should work with ignoreSchemes=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, maxSocketsPerHost:4 }), function(results)
					{
						expect(results).to.deep.equal(utils.urls);
						done();
					});
				});
				
				
				
				it("should work with ignoreSubdomains=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, maxSocketsPerHost:4 }), function(results)
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
				
				
				
				it("should work with all boolean options true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:4 }), function(results)
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
				before( function(done)
				{
					utils.addDurationGroup();
					done();
				});
				
				
				
				it("should work", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:Infinity }), function(results, duration)
					{
						utils.compareDurations(duration, function(prevGroupDuration)
						{
							expect(duration).to.be.within(prevGroupDuration-20, prevGroupDuration+20);
						});
						
						expect(results).to.deep.equal(utils.urls);
						done();
					});
				});
				
				
				
				it("should work with ignorePorts=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(utils.urls);
						done();
					});
				});
				
				
				
				it("should work with ignoreSchemes=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(utils.urls);
						done();
					});
				});
				
				
				
				it("should work with ignoreSubdomains=true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(utils.urls);
						done();
					});
				});
				
				
				
				it("should work with all boolean options true", function(done)
				{
					utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:Infinity }), function(results)
					{
						expect(results).to.deep.equal(utils.urls);
						done();
					});
				});
			});
		});
		
		
		
		describe("rateLimit=50", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with ignorePorts=true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignorePorts:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with ignoreSchemes=true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with ignoreSubdomains=true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with all boolean options true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least(50);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
		});
		
		
		
		describe("all boolean options true, maxSockets=2, maxSocketsPerHost=1, rateLimit=50", function()
		{
			it("should work", function(done)
			{
				this.timeout(0);
				
				utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSockets:2, maxSocketsPerHost:1, rateLimit:50 }), function(results, duration)
				{
					expect(duration).to.be.at.least( (utils.urls.length-4) * (50 + utils.delay) );
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
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, undefined, function(results)
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
		it("utils.testUrls should report erroneous URLs", function(done)
		{
			var urls = [
				"https://www.google.com/",
				"path/to/resource.html",
				"http://www.google.com/"
			];
			
			utils.testUrls(urls, utils.options(), function(results)
			{
				expect(results[0]).to.be.instanceOf(Error);
				expect(results[1]).to.equal("https://www.google.com/");
				expect(results[2]).to.equal("http://www.google.com/");
				done();
			});
		});
	});
});
