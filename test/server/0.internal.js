"use strict";
var getHostKey = require("../../lib/getHostKey");
var helpers = require("./helpers");

var expect = require("chai").expect;
var parseUrl = require("url").parse;
var URL = require("whatwg-url").URL;



describe("Internal API", function()
{
	describe("getHostKey", function()
	{
		it("supports String input", function()
		{
			var options = helpers.options();
			
			expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://www.google.com:8080/");
			expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("https://127.0.0.1:8080/");
		});
		
		
		
		it("supports URL input", function()
		{
			var options = helpers.options();
			
			expect( getHostKey( new URL("https://www.google.com:8080/"),options) ).to.equal("https://www.google.com:8080/");
			expect( getHostKey( new URL("https://127.0.0.1:8080/"),options) ).to.equal("https://127.0.0.1:8080/");
		});
		
		
		
		it("supports Node URL input", function()
		{
			var options = helpers.options();
			
			expect( getHostKey( parseUrl("https://www.google.com:8080/"),options) ).to.equal("https://www.google.com:8080/");
			expect( getHostKey( parseUrl("https://127.0.0.1:8080/"),options) ).to.equal("https://127.0.0.1:8080/");
		});
		
		
		
		it("rejects invalid input", function()
		{
			var options = helpers.options();
			
			expect( getHostKey("/path/",options) ).to.be.false;
			expect( getHostKey("resource.html",options) ).to.be.false;
			expect( getHostKey("",options) ).to.be.false;
			expect( getHostKey({},options) ).to.be.false;
			expect( getHostKey([],options) ).to.be.false;
			expect( getHostKey(true,options) ).to.be.false;
			expect( getHostKey(0,options) ).to.be.false;
			expect( getHostKey(null,options) ).to.be.false;
			expect( getHostKey(undefined,options) ).to.be.false;
		});
		
		
		
		describe("Options", function()
		{
			it("ignorePorts = true", function()
			{
				var options = helpers.options({ ignorePorts:true });
				
				expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://www.google.com/");
				expect( getHostKey("https://127.0.0.1/",options) ).to.equal("https://127.0.0.1/");
			});
			
			
			
			it("ignoreSchemes = true", function()
			{
				var options = helpers.options({ ignoreSchemes:true });
				
				expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("www.google.com:8080/");
				expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("127.0.0.1:8080/");
			});
			
			
			
			it("ignoreSubdomains = true", function()
			{
				var options = helpers.options({ ignoreSubdomains:true });
				
				expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("https://google.com:8080/");
				expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("https://127.0.0.1:8080/");
			});
			
			
			
			it("all options true", function()
			{
				var options = helpers.options({ ignorePorts:true, ignoreSchemes:true, ignoreSubdomains:true });
				
				expect( getHostKey("https://www.google.com:8080/",options) ).to.equal("google.com/");
				expect( getHostKey("https://127.0.0.1:8080/",options) ).to.equal("127.0.0.1/");
			});
		});
	});
});
