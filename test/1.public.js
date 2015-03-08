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
						"https://google.com/something.html",
						"http://google.com/something.html",
						"http://google.com/something.html",
						"https://127.0.0.1/",
						"https://127.0.0.1/",
						"http://127.0.0.1/",
						"http://127.0.0.1/"
					]);
					done();
				});
			});
		});
		
		
		
		describe("maxSocketsPerHost=1", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:1 }), function(results)
				{
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
			
			
			
			it("should work with all options true", function(done)
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
		
		
		
		describe("maxSocketsPerHost=2", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:2 }), function(results)
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
			
			
			
			it("should work with all options true", function(done)
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
		
		
		
		describe("maxSocketsPerHost=3", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:3 }), function(results)
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
			
			
			
			it("should work with all options true", function(done)
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
		
		
		
		describe("maxSocketsPerHost=4", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:4 }), function(results)
				{
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
			
			
			
			it("should work with all options true", function(done)
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
		
		
		
		describe("maxSocketsPerHost=Infinity", function()
		{
			it("should work", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ maxSocketsPerHost:Infinity }), function(results)
				{
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
			
			
			
			it("should work with all options true", function(done)
			{
				utils.testUrls(utils.urls, utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true, maxSocketsPerHost:Infinity }), function(results)
				{
					expect(results).to.deep.equal(utils.urls);
					done();
				});
			});
		});
		
		
		
		it.skip("should support maxSocketsPerHost=0", function(done)
		{
			utils.testUrls(utils.urls, {ignorePorts:false, ignoreSchemes:false, ignoreSubdomains:false, maxSockets:Infinity, maxSocketsPerHost:0}, function(results)
			{
				console.log("hmm");
				done();
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
