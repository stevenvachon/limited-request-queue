"use strict";
const {describe, it} = require("mocha");
const {expect} = require("chai");
const normalizeURL = require("../lib/normalizeURL");
const {options} = require("./helpers");



describe("Internal API", () =>
{
	describe("normalizeURL()", () =>
	{
		it("supports URL input", () =>
		{
			const opts = options();

			expect( normalizeURL( new URL("https://www.google.com/path/to/index.html?var=value#hash"),opts) ).to.equal("https://www.google.com");
			expect( normalizeURL( new URL("https://www.google.com:8080/path/to/index.html?var=value#hash"),opts) ).to.equal("https://www.google.com:8080");
			expect( normalizeURL( new URL("https://localhost/path/to/index.html?var=value#hash"),opts) ).to.equal("https://localhost");
			expect( normalizeURL( new URL("https://com/path/to/index.html?var=value#hash"),opts) ).to.equal("https://com");
			expect( normalizeURL( new URL("https://127.0.0.1:8080/path/to/index.html?var=value#hash"),opts) ).to.equal("https://127.0.0.1:8080");
		});



		describe("Options", () =>
		{
			it("ignorePorts = true", () =>
			{
				const opts = options({ ignorePorts:true });

				expect( normalizeURL( new URL("https://www.google.com/"),opts) ).to.equal("https://www.google.com");
				expect( normalizeURL( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://www.google.com");
				expect( normalizeURL( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1");
			});



			it("ignoreProtocols = true", () =>
			{
				const opts = options({ ignoreProtocols:true });

				expect( normalizeURL( new URL("https://www.google.com/"),opts) ).to.equal("www.google.com");
				expect( normalizeURL( new URL("https://www.google.com:8080/"),opts) ).to.equal("www.google.com:8080");
				expect( normalizeURL( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("127.0.0.1:8080");
			});



			it("ignoreSubdomains = true", () =>
			{
				const opts = options({ ignoreSubdomains:true });

				expect( normalizeURL( new URL("https://www.google.com/"),opts) ).to.equal("https://google.com");
				expect( normalizeURL( new URL("https://www.google.com:8080/"),opts) ).to.equal("https://google.com:8080");
				expect( normalizeURL( new URL("https://com/"),opts) ).to.equal("https://com");
				expect( normalizeURL( new URL("https://localhost/"),opts) ).to.equal("https://localhost");
				expect( normalizeURL( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("https://127.0.0.1:8080");
			});



			it("all options true", () =>
			{
				const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true });

				expect( normalizeURL( new URL("https://www.google.com/"),opts) ).to.equal("google.com");
				expect( normalizeURL( new URL("https://www.google.com:8080/"),opts) ).to.equal("google.com");
				expect( normalizeURL( new URL("https://com/"),opts) ).to.equal("com");
				expect( normalizeURL( new URL("https://localhost/"),opts) ).to.equal("localhost");
				expect( normalizeURL( new URL("https://127.0.0.1:8080/"),opts) ).to.equal("127.0.0.1");
			});
		});
	});
});
