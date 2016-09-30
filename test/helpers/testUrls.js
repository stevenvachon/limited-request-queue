"use strict";
const RequestQueue = require("../../lib");
const {URL} = require("universal-url");

const delay = 18;	// long enough without trying everyone's patience
const _urls =
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
];



const expectedSyncMinDuration = () => _urls.length * delay + 50;



const testUrls = (urls, options, optionOverrides, eachCallback) => new Promise(resolve =>
{
	const results = [];
	const startTime = Date.now();

	const queue = new RequestQueue(options)
	.on("item", (url, data, done) =>
	{
		results.push(url.href);

		if (typeof eachCallback === "function")
		{
			eachCallback(url, data, queue);
		}

		// Simulate a remote connection
		setTimeout(() => done(), delay);
	})
	.on("end", () =>
	{
		const duration = Date.now() - startTime;

		resolve({ duration, urls:results });
	});

	urls.forEach(url => queue.enqueue(new URL(url), null, optionOverrides));
});



module.exports =
{
	delay,
	expectedSyncMinDuration,
	testUrls,
	urls:_urls
};
