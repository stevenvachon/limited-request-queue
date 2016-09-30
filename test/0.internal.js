"use strict";
const {describe, it} = require("mocha");
const {expect} = require("chai");
const getHostKey = require("../lib/getHostKey");
const helpers = require("./helpers");
const {URL} = require("universal-url");



describe("Internal API", function()
{
	describe("getHostKey()", function()
	{
		it("supports URL input", function()
		{
			const opts = helpers.options();
			
			expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("https://www.google.com");
			expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://www.google.com:8080");
			expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1:8080");
		});
		
		
		
		describe("Options", function()
		{
			it("ignorePorts = true", function()
			{
				const opts = helpers.options({ ignorePorts:true });
				
				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("https://www.google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://www.google.com");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1");
			});
			
			
			
			it("ignoreProtocols = true", function()
			{
				const opts = helpers.options({ ignoreProtocols:true });
				
				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("www.google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("www.google.com:8080");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("127.0.0.1:8080");
			});
			
			
			
			it("ignoreSubdomains = true", function()
			{
				const opts = helpers.options({ ignoreSubdomains:true });
				
				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("https://google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://google.com:8080");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1:8080");
			});
			
			
			
			it("all options true", function()
			{
				const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true });
				
				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("google.com");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("127.0.0.1");
			});
		});
	});
});
