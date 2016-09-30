"use strict";
const {describe, it} = require("mocha");
const {expect} = require("chai");
const getHostKey = require("../lib-es5/getHostKey");
const {options} = require("./helpers");



describe("Internal API", () =>
{
	describe("getHostKey()", () =>
	{
		it("supports URL input", () =>
		{
			const opts = options();

			expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("https://www.google.com");
			expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://www.google.com:8080");
			expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1:8080");
		});



		describe("Options", () =>
		{
			it("ignorePorts = true", () =>
			{
				const opts = options({ ignorePorts:true });

				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("https://www.google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://www.google.com");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1");
			});



			it("ignoreProtocols = true", () =>
			{
				const opts = options({ ignoreProtocols:true });

				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("www.google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("www.google.com:8080");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("127.0.0.1:8080");
			});



			it("ignoreSubdomains = true", () =>
			{
				const opts = options({ ignoreSubdomains:true });

				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("https://google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://google.com:8080");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1:8080");
			});



			it("all options true", () =>
			{
				const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true });

				expect( getHostKey( new URL("https://www.google.com/"),opts) ).to.equal("google.com");
				expect( getHostKey( new URL("https://www.google.com:8080/"),opts) ).to.equal("google.com");
				expect( getHostKey( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("127.0.0.1");
			});
		});
	});
});
