"use strict";
var utils = require("./utils");

var expect = require("chai").expect;



describe("Public API", function()
{
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
					}, 1500);
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
					}, 1500);
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
		
		
		
		describe("rateLimit=500", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ rateLimit:500 }), function(results, duration)
				{
					expect(duration).to.be.at.least(500);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with ignorePorts=true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignorePorts:true, rateLimit:500 }), function(results, duration)
				{
					expect(duration).to.be.at.least(500);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with ignoreSchemes=true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignoreSchemes:true, rateLimit:500 }), function(results, duration)
				{
					expect(duration).to.be.at.least(500);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with ignoreSubdomains=true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignoreSubdomains:true, rateLimit:500 }), function(results, duration)
				{
					expect(duration).to.be.at.least(500);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
			
			
			
			it("should work with all boolean options true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, rateLimit:500 }), function(results, duration)
				{
					expect(duration).to.be.at.least(500);
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
		});
		
		
		
		describe("all boolean options true, maxSockets=2, maxSocketsPerHost=1, rateLimit=500", function()
		{
			it("should work", function(done)
			{
				this.timeout(0);
				
				utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSockets:2, maxSocketsPerHost:1, rateLimit:500 }), function(results, duration)
				{
					expect(duration).to.be.at.least( (utils.urls.length-4) * (500 + utils.delay) );
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
	
	
	
	describe("Handlers", function()
	{
		describe("drain", function()
		{
			it("should work", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					drain: function()
					{
						done();
					}
				});
				
				utils.urls.forEach( function(url)
				{
					queue.enqueue(url, function(error, id, url)
					{
						setTimeout(queue.dequeue.bind(queue), utils.delay, id);
					});
				});
			});
			
			
			
			it("should not be called simply by calling resume()", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					drain: function()
					{
						done( new Error("this should not have been called") );
					}
				});
				
				queue.resume();
				
				setTimeout(done, 100);
			});
			
			
			
			it("should not be called on erroneous dequeue", function(done)
			{
				var queue = new utils.RequestQueue(utils.options(),
				{
					drain: function()
					{
						done( new Error("this should not have been called") );
					}
				});
				
				queue.dequeue("fakeid");
				
				setTimeout(done, 100);
			});
		});
	});
	
	
	
	describe("Interactivity", function()
	{
		it("should support pause/resume", function(done)
		{
			var count = 0;
			var resumed = false;
			
			utils.testUrls(utils.urls, utils.options(), function(results)
			{
				expect(resumed).to.be.true;
				expect(results).to.deep.equal(utils.urls);
				done();
			},
			function(url, queue)
			{
				if (++count === 1)
				{
					queue.pause();
					
					// Wait longer than queue should take if not paused+resumed
					setTimeout( function()
					{
						resumed = true;
						queue.resume();
					}, 500);
				}
			});
		});
	});
	
	
	
	describe("Edge cases", function()
	{
		it("should report erroneous urls", function(done)
		{
			var urls = [
				"https://www.google.com/",
				"path/to/resource.html",
				"http://www.google.com/"
			];
			
			utils.testUrls(urls, {maxSockets:Infinity, maxSocketsPerHost:Infinity}, function(results)
			{
				expect(results[0]).to.be.instanceOf(Error);
				expect(results[1]).to.equal("https://www.google.com/");
				expect(results[2]).to.equal("http://www.google.com/");
				done();
			});
		});
	});
});
