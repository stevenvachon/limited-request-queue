"use strict";
var getHostKey = require("../../lib/getHostKey");
var utils = require("./utils");

var expect = require("chai").expect;



describe("Internal API", function()
{
	describe("getHostKey", function()
	{
		it("should work", function(done)
		{
			var options = utils.options();
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://www.google.com:8080/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("https://127.0.0.1:8080/");
			done();
		});
		
		
		
		it("should support options.ignorePorts=true", function(done)
		{
			var options = utils.options({ ignorePorts:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://www.google.com/");
			expect( getHostKey("https://127.0.0.1/",options) ).to.equal("https://127.0.0.1/");
			done();
		});
		
		
		
		it("should support options.ignoreSchemes=true", function(done)
		{
			var options = utils.options({ ignoreSchemes:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("www.google.com:8080/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("127.0.0.1:8080/");
			done();
		});
		
		
		
		it("should support options.ignoreSubdomains=true", function(done)
		{
			var options = utils.options({ ignoreSubdomains:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://google.com:8080/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("https://127.0.0.1:8080/");
			done();
		});
		
		
		
		it("should support all options true", function(done)
		{
			var options = utils.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("google.com/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("127.0.0.1/");
			done();
		});
		
		
		
		it("should avoid erroneous URLs", function(done)
		{
			var options = utils.options();
			
			expect( getHostKey("/path/",options) ).to.be.false;
			expect( getHostKey("resource.html",options) ).to.be.false;
			expect( getHostKey("",options) ).to.be.false;
			done();
		});
	});
});
