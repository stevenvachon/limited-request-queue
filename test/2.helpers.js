"use strict";
const {describe, it} = require("mocha");
const {expect} = require("chai");
const helpers = require("./helpers");



// NOTE :: this makes sure that other tests were tested correctly
describe("Test Helpers", function()
{
	it("helpers.testUrls() rejects non-URLs", function(done)
	{
		const opts = helpers.options();
		const urls = [
			"https://www.google.com/",
			"path/to/resource.html",
			"http://www.google.com/"
		];
		
		helpers.testUrls(urls, opts)
		.then(() => done( new Error("this should not have been called") ))
		.catch(error => done());
	});
});
