"use strict";
var getHostKey = require("../../lib/getHostKey");
var helpers = require("./helpers");

var expect = require("chai").expect;



describe("Internal API", () =>
{
	describe("getHostKey", () =>
	{
		it("works", () =>
		{
			var options = helpers.options();
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://www.google.com:8080/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("https://127.0.0.1:8080/");
		});
		
		
		
		it("supports options.ignorePorts=true", () =>
		{
			var options = helpers.options({ ignorePorts:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://www.google.com/");
			expect( getHostKey("https://127.0.0.1/",options) ).to.equal("https://127.0.0.1/");
		});
		
		
		
		it("supports options.ignoreSchemes=true", () =>
		{
			var options = helpers.options({ ignoreSchemes:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("www.google.com:8080/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("127.0.0.1:8080/");
		});
		
		
		
		it("supports options.ignoreSubdomains=true", () =>
		{
			var options = helpers.options({ ignoreSubdomains:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://google.com:8080/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("https://127.0.0.1:8080/");
		});
		
		
		
		it("supports all options true", () =>
		{
			var options = helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true });
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("google.com/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("127.0.0.1/");
		});
		
		
		
		it("rejects erroneous URLs", () =>
		{
			var options = helpers.options();
			
			expect( getHostKey("/path/",options) ).to.be.false;
			expect( getHostKey("resource.html",options) ).to.be.false;
			expect( getHostKey("",options) ).to.be.false;
		});
	});
});
