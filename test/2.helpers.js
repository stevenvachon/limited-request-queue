"use strict";
const {describe, it} = require("mocha");
const {expect} = require("chai");
const helpers = require("./helpers");



// NOTE :: this makes sure that other tests were tested correctly
describe("Test Helpers", () =>
{
	it("helpers.testUrls() rejects non-URLs", async () =>
	{
		const opts = helpers.options();
		const testError = new Error("this should not have resolved");
		const urls =
		[
			"https://www.google.com/",
			"path/to/resource.html",
			"http://www.google.com/"
		];

		try
		{
			await helpers.testUrls(urls, opts);
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
