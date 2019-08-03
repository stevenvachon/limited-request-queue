"use strict";
const {describe, it} = require("mocha");
const {expect} = require("chai");
const {options, testURLs} = require("./helpers");



// NOTE :: this makes sure that other tests were tested correctly
describe("Test Helpers", () =>
{
	it("testURLs() rejects non-URLs", async () =>
	{
		const opts = options();
		const testError = new Error("An error should have been thrown before this one");
		const urls =
		[
			"https://www.google.com/",
			"path/to/resource.html",
			"http://www.google.com/"
		];

		try
		{
			await testURLs(urls, opts);
			throw testError;
		}
		catch (error)
		{
			if (error === testError)
			{
				throw error;
			}
			else
			{
				// success
			}
		}
	});
});
