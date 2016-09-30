"use strict";
const {before, describe, it} = require("mocha");
const {expect} = require("chai");
const helpers = require("./helpers");
const RequestQueue = require("../lib");
const {URL} = require("universal-url");



describe("Public API", () =>
{
	describe("enqueue(), length", () =>
	{
		it("enqueues valid URLs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(helpers.options()).pause();
			const url1 = new URL("http://domain1/");
			const url2 = new URL("http://domain2/");

			expect( queue.enqueue(url1) ).to.be.a("number");
			expect( queue.enqueue(url2) ).to.be.a("number");
			expect( queue.length ).to.equal(2);
		});



		it("rejects non-URLs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(helpers.options()).pause();

			["string", 1, true, {}, [], null, undefined].forEach(url =>
			{
				expect(() => queue.enqueue(url)).to.throw(TypeError);
				expect(queue.length).to.equal(0);
			});
		});
	});



	describe("dequeue(), length", () =>
	{
		it("dequeues valid IDs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(helpers.options()).pause();

			const url = new URL("http://domain/");
			const id = queue.enqueue(url);

			expect( queue.dequeue(id) ).to.be.true;
			expect( queue.length ).to.equal(0);
		});



		it("rejects invalid IDs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(helpers.options()).pause();

			const url = new URL("http://domain/");
			const id = queue.enqueue(url);

			expect( queue.dequeue(123456) ).to.be.false;
			expect( queue.length ).to.equal(1);
		});
	});



	describe("Events", () =>
	{
		describe("item", () =>
		{
			it("works", done =>
			{
				let count = 0;

				const queue = new RequestQueue(helpers.options())
				.on("item", (url, data, itemDone) =>
				{
					if (++count >= helpers.urls.length)
					{
						done();
					}
				});

				helpers.urls.forEach(url => queue.enqueue(new URL(url)));
			});



			it("supports custom data", done =>
			{
				let count = 0;

				const queue = new RequestQueue(helpers.options())
				.on("item", (url, data, itemDone) =>
				{
					switch (++count)
					{
						case 1:
						{
							expect(url.href).to.equal(helpers.urls[0]);
							expect(data).to.equal(1);
							break;
						}
						case 2:
						{
							expect(url.href).to.equal(helpers.urls[1]);
							expect(data).to.equal(2);
							break;
						}
						case 3:
						{
							expect(url.href).to.equal(helpers.urls[2]);
							expect(data).to.equal(3);
							done();
							break;
						}
					}
				});

				queue.enqueue(new URL(helpers.urls[0]), 1);
				queue.enqueue(new URL(helpers.urls[1]), 2);
				queue.enqueue(new URL(helpers.urls[2]), 3);
			});



			it("is not called with non-URLs", done =>
			{
				const queue = new RequestQueue(helpers.options())
				.on("item", () => done( new Error("this should not have been called") ));

				expect(() => queue.enqueue("url")).to.throw();

				setTimeout(done, helpers.delay*2);
			});
		});



		describe("end", () =>
		{
			it("works", done =>
			{
				const queue = new RequestQueue(helpers.options())
				.on("item", (url, data, itemDone) =>
				{
					setTimeout(itemDone, helpers.delay);
				})
				.on("end", () => done());

				helpers.urls.forEach(url => queue.enqueue(new URL(url)));
			});



			it("is called when last item is dequeued", done =>
			{
				// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
				const queue = new RequestQueue(helpers.options()).pause()
				.on("end", () =>
				{
					// Wait for `dequeued` to receive its value
					// since everything here is performed synchronously
					setImmediate( () =>
					{
						expect(dequeued).to.be.true;
						done();
					});
				});

				const url = new URL("http://domain/");
				const id = queue.enqueue(new URL(url));
				const dequeued = queue.dequeue(id);
			});



			it("is not called simply by calling resume()", done =>
			{
				const queue = new RequestQueue(helpers.options())
				.on("end", () => done( new Error("this should not have been called") ));

				queue.resume();

				setTimeout(done, helpers.delay*2);
			});



			it("is not called on erroneous dequeue", done =>
			{
				const queue = new RequestQueue(helpers.options())
				.on("end", () => done( new Error("this should not have been called") ));

				queue.dequeue(123);

				setTimeout(done, helpers.delay*2);
			});
		});
	});



	describe("pause(), resume(), isPaused()", () =>
	{
		it("works", () =>
		{
			const opts = helpers.options();
			let count = 0;
			let resumed = false;

			return helpers.testUrls(helpers.urls, opts, null, function eachItem(url, data, queue)
			{
				if (++count === 1)
				{
					queue.pause();

					expect(queue.isPaused).to.be.true;

					// Wait longer than queue should take if not paused+resumed
					setTimeout( () =>
					{
						resumed = true;
						queue.resume();

						expect(queue.isPaused).to.be.false;

					}, helpers.expectedSyncMinDuration());
				}
			})
			.then(result =>
			{
				expect(resumed).to.be.true;
				expect(result.urls).to.deep.equal(helpers.urls);
			});
		});
	});



	describe("numActive", () =>
	{
		it("works", done =>
		{
			const queue = new RequestQueue(helpers.options())
			.on("item", (url, data, itemDone) =>
			{
				setTimeout(itemDone, helpers.delay);
			})
			.on("end", () =>
			{
				expect( queue.numActive ).to.equal(0);
				done();
			});

			helpers.urls.forEach(url => queue.enqueue(new URL(url)));

			expect( queue.numActive ).to.equal(helpers.urls.length);
		});



		it("is not affected by dequeue()", done =>
		{
			const queue = new RequestQueue(helpers.options())
			.on("item", (url, data, itemDone) =>
			{
				// Wait for `id` to be assigned its value
				setImmediate( () =>
				{
					expect( queue.dequeue(id) ).to.be.false;
					expect( queue.numActive ).to.equal(1);
				});

				setTimeout(itemDone, helpers.delay);
			})
			.on("end", () =>
			{
				expect( queue.numActive ).to.equal(0);
				done();
			});

			const url = new URL("http://domain/");
			const id = queue.enqueue(url);

			expect( queue.numActive ).to.equal(1);
		});
	});



	describe("numQueued", () =>
	{
		it("works", done =>
		{
			const queue = new RequestQueue(helpers.options())
			.on("item", (url, data, itemDone) =>
			{
				setTimeout(itemDone, helpers.delay);
			})
			.on("end", () =>
			{
				expect( queue.numQueued ).to.equal(0);
				done();
			});

			helpers.urls.forEach(url => queue.enqueue(new URL(url)));

			expect( queue.numQueued ).to.equal(0);
		});
	});



	describe("Options", () =>
	{
		describe("all disabled", () =>
		{
			it("works", () =>
			{
				const opts = helpers.options();

				return helpers.testUrls(helpers.urls, opts)
				.then(result => expect(result.urls).to.deep.equal(helpers.urls));
			});
		});



		describe("maxSockets", () =>
		{
			before( () => helpers.clearDurations() );



			describe("=0", () =>
			{
				it("can't do anything", done =>
				{
					const opts = helpers.options({ maxSockets:0 });

					helpers.testUrls(helpers.urls, opts)
					.then(() => done( new Error("this should not have resolved") ));

					setTimeout( () => done(), helpers.expectedSyncMinDuration() );
				});
			});



			[1,2,3,4,Infinity].forEach(value =>
			{
				describe(`=${value}`, () =>
				{
					it("works", () =>
					{
						const opts = helpers.options({ maxSockets:value });

						return helpers.testUrls(helpers.urls, opts)
						.then(result =>
						{
							expect(result.urls).to.deep.equal(helpers.urls);

							helpers.addDuration(result.duration);

							if (value > 1)
							{
								expect(result.duration).to.be.below( helpers.previousDuration() );
							}
						})
					});



					it("supports ignorePorts=true", () =>
					{
						const opts = helpers.options({ ignorePorts:true, maxSockets:value });

						return helpers.testUrls(helpers.urls, opts)
						.then(result => expect(result.urls).to.deep.equal(helpers.urls));
					});



					it("supports ignoreProtocols=true", () =>
					{
						const opts = helpers.options({ ignoreProtocols:true, maxSockets:value });

						return helpers.testUrls(helpers.urls, opts)
						.then(result => expect(result.urls).to.deep.equal(helpers.urls));
					});



					it("supports ignoreSubdomains=true", () =>
					{
						const opts = helpers.options({ ignoreSubdomains:true, maxSockets:value });

						return helpers.testUrls(helpers.urls, opts)
						.then(result => expect(result.urls).to.deep.equal(helpers.urls));
					});



					it("supports all boolean options true", () =>
					{
						const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSockets:value });

						return helpers.testUrls(helpers.urls, opts)
						.then(result => expect(result.urls).to.deep.equal(helpers.urls));
					});
				});
			});
		});



		// NOTE :: URLs are visually grouped according to how they are prioritized for concurrency within the queue
		describe("maxSocketsPerHost", () =>
		{
			before( () => helpers.clearDurations() );



			describe("=0", () =>
			{
				it("can't do anything", done =>
				{
					const opts = helpers.options({ maxSocketsPerHost:0 });

					helpers.testUrls(helpers.urls, opts)
					.then(() => done( new Error("this should not have resolved") ));

					setTimeout( () => done(), helpers.expectedSyncMinDuration() );
				});
			});



			describe("=1", () =>
			{
				it("works", () =>
				{
					const opts = helpers.options({ maxSocketsPerHost:1 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/something.html",
							"http://google.com/something.html",

							"https://google.com/something.html",
							"http://google.com/something.html"
						]);

						// For next test
						// NOTE :: this is not atomic and technically would fail if running exclusive tests
						helpers.addDuration(result.duration);
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, maxSocketsPerHost:1 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com:8080/",
							"http://google.com:8080/",

							"https://google.com:8080/",
							"http://google.com:8080/",

							"https://google.com/something.html",
							"http://google.com/something.html",

							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreProtocols=true", () =>
				{
					const opts = helpers.options({ ignoreProtocols:true, maxSocketsPerHost:1 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://google.com/",
							"https://google.com:8080/",
							"https://127.0.0.1/",

							"https://www.google.com/",
							"https://google.com/",
							"https://google.com:8080/",
							"https://127.0.0.1/",

							"http://www.google.com/",
							"http://google.com/",
							"http://google.com:8080/",
							"http://127.0.0.1/",

							"http://www.google.com/",
							"http://google.com/",
							"http://google.com:8080/",
							"http://127.0.0.1/",

							"https://google.com/something.html",

							"https://google.com/something.html",

							"http://google.com/something.html",

							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreSubdomains=true", () =>
				{
					const opts = helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:1 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/",
							"http://google.com/",

							"https://google.com/",
							"http://google.com/",

							"https://google.com/something.html",
							"http://google.com/something.html",

							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports all boolean options true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:1 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://127.0.0.1/",

							"https://www.google.com/",
							"https://127.0.0.1/",

							"http://www.google.com/",
							"http://127.0.0.1/",

							"http://www.google.com/",
							"http://127.0.0.1/",

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

							"http://google.com/something.html"
						]);
					});
				});
			});



			describe("=2", () =>
			{
				it("works", () =>
				{
					const opts = helpers.options({ maxSocketsPerHost:2 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
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

							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);

						helpers.addDuration(result.duration);

						expect(result.duration).to.be.below( helpers.previousDuration() );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, maxSocketsPerHost:2 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"https://google.com/",
							"http://google.com/",
							"http://google.com/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",

							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreProtocols=true", () =>
				{
					const opts = helpers.options({ ignoreProtocols:true, maxSocketsPerHost:2 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"https://google.com/",
							"https://google.com/",
							"https://google.com:8080/",
							"https://google.com:8080/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",

							"http://www.google.com/",
							"http://www.google.com/",
							"http://google.com/",
							"http://google.com/",
							"http://google.com:8080/",
							"http://google.com:8080/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/something.html",
							"https://google.com/something.html",

							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreSubdomains=true", () =>
				{
					const opts = helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:2 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/",
							"https://google.com/",
							"http://google.com/",
							"http://google.com/",

							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports all boolean options true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:2 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",

							"http://www.google.com/",
							"http://www.google.com/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

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
							"http://google.com/something.html"
						]);
					});
				});
			});



			describe("=3", () =>
			{
				it("works", () =>
				{
					const opts = helpers.options({ maxSocketsPerHost:3 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
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
							"http://google.com/something.html",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/something.html",
							"http://google.com/something.html"
						]);

						helpers.addDuration(result.duration);

						expect(result.duration).to.be.at.most( helpers.previousDuration() + 10 );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, maxSocketsPerHost:3 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
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
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com:8080/",
							"https://google.com/something.html",
							"http://google.com:8080/",  // TODO :: why is this one here and not after its https cousin?

							"http://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreProtocols=true", () =>
				{
					const opts = helpers.options({ ignoreProtocols:true, maxSocketsPerHost:3 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"http://www.google.com/",
							"http://google.com/",
							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com:8080/",
							"http://127.0.0.1/",

							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreSubdomains=true", () =>
				{
					const opts = helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:3 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							"https://google.com/",
							"http://google.com/",
							"https://google.com:8080/",
							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/",
							"https://google.com/something.html",
							"http://google.com/",  // TODO :: why is this one here and not after its https cousin?
							"http://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports all boolean options true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:3 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",

							"http://www.google.com/",
							"https://google.com/",
							"https://google.com/",
							"http://127.0.0.1/",

							"http://google.com/",
							"http://google.com/",
							"https://google.com:8080/",

							"https://google.com:8080/",
							"http://google.com:8080/",
							"http://google.com:8080/",

							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",

							"http://google.com/something.html"
						]);
					});
				});
			});



			describe("=4", () =>
			{
				it("works", () =>
				{
					const opts = helpers.options({ maxSocketsPerHost:4 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(helpers.urls);

						helpers.addDuration(result.duration);

						expect(result.duration).to.be.below( helpers.previousDuration() );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, maxSocketsPerHost:4 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
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
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreProtocols=true", () =>
				{
					const opts = helpers.options({ ignoreProtocols:true, maxSocketsPerHost:4 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
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
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports ignoreSubdomains=true", () =>
				{
					const opts = helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:4 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
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
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

							"https://google.com/something.html",
							"https://google.com/something.html",
							"http://google.com/something.html",
							"http://google.com/something.html"
						]);
					});
				});



				it("supports all boolean options true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:4 });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(
						[
							"https://www.google.com/",
							"https://www.google.com/",
							"http://www.google.com/",
							"http://www.google.com/",
							"https://127.0.0.1/",
							"https://127.0.0.1/",
							"http://127.0.0.1/",
							"http://127.0.0.1/",

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
							"http://google.com/something.html"
						]);
					});
				});
			});



			describe("=Infinity", () =>
			{
				it("works", () =>
				{
					const opts = helpers.options({ maxSocketsPerHost:Infinity });

					return helpers.testUrls(helpers.urls, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(helpers.urls);

						helpers.addDuration(result.duration);

						expect(result.duration).to.be.at.most( helpers.previousDuration() + 10 );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, maxSocketsPerHost:Infinity });

					return helpers.testUrls(helpers.urls, opts)
					.then(result => expect(result.urls).to.deep.equal(helpers.urls));
				});



				it("supports ignoreProtocols=true", () =>
				{
					const opts = helpers.options({ ignoreProtocols:true, maxSocketsPerHost:Infinity });

					return helpers.testUrls(helpers.urls, opts)
					.then(result => expect(result.urls).to.deep.equal(helpers.urls));
				});



				it("supports ignoreSubdomains=true", () =>
				{
					const opts = helpers.options({ ignoreSubdomains:true, maxSocketsPerHost:Infinity });

					return helpers.testUrls(helpers.urls, opts)
					.then(result => expect(result.urls).to.deep.equal(helpers.urls));
				});



				it("supports all boolean options true", () =>
				{
					const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:Infinity });

					return helpers.testUrls(helpers.urls, opts)
					.then(result => expect(result.urls).to.deep.equal(helpers.urls));
				});
			});
		});



		describe("rateLimit=50", () =>
		{
			it("works", () =>
			{
				const opts = helpers.options({ rateLimit:50 });

				return helpers.testUrls(helpers.urls, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(helpers.urls);
				});
			});



			it("supports ignorePorts=true", () =>
			{
				const opts = helpers.options({ ignorePorts:true, rateLimit:50 });

				return helpers.testUrls(helpers.urls, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(helpers.urls);
				});
			});



			it("supports ignoreProtocols=true", () =>
			{
				const opts = helpers.options({ ignoreProtocols:true, rateLimit:50 });

				return helpers.testUrls(helpers.urls, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(helpers.urls);
				});
			});



			it("supports ignoreSubdomains=true", () =>
			{
				const opts = helpers.options({ ignoreSubdomains:true, rateLimit:50 });

				return helpers.testUrls(helpers.urls, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(helpers.urls);
				});
			});



			it("supports all boolean options true", () =>
			{
				const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, rateLimit:50 });

				return helpers.testUrls(helpers.urls, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(helpers.urls);
				});
			});
		});



		describe("all boolean options true, maxSockets=2, maxSocketsPerHost=1, rateLimit=50", () =>
		{
			it("works", () =>
			{
				const opts = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSockets:2, maxSocketsPerHost:1, rateLimit:50 });

				return helpers.testUrls(helpers.urls, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least( (helpers.urls.length - 4) * (50 + helpers.delay) );
					expect(result.urls).to.deep.equal(
					[
						"https://www.google.com/",
						"https://127.0.0.1/",

						"https://www.google.com/",
						"https://127.0.0.1/",

						"http://www.google.com/",
						"http://127.0.0.1/",

						"http://www.google.com/",
						"http://127.0.0.1/",

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

						"http://google.com/something.html"
					]);
				});
			});
		});



		describe("all boolean options true, maxSockets=2, maxSocketsPerHost=1, rateLimit=50 -- via enqueue()", () =>
		{
			it("works", () =>
			{
				const opts = helpers.options({ maxSockets:2 });
				const optOverrides = helpers.options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:1, rateLimit:50 });

				return helpers.testUrls(helpers.urls, opts, optOverrides)
				.then(result =>
				{
					expect(result.duration).to.be.at.least( (helpers.urls.length - 4) * (50 + helpers.delay) );
					expect(result.urls).to.deep.equal(
					[
						"https://www.google.com/",
						"https://127.0.0.1/",

						"https://www.google.com/",
						"https://127.0.0.1/",

						"http://www.google.com/",
						"http://127.0.0.1/",

						"http://www.google.com/",
						"http://127.0.0.1/",

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

						"http://google.com/something.html"
					]);
				});
			});
		});



		describe("default options", () =>
		{
			it("works", () =>
			{
				return helpers.testUrls(helpers.urls)
				.then(result =>
				{
					expect(result.urls).to.deep.equal(
					[
						"https://www.google.com/",
						"https://www.google.com/",
						"https://127.0.0.1/",
						"https://127.0.0.1/",

						"http://www.google.com/",
						"http://www.google.com/",
						"http://127.0.0.1/",
						"http://127.0.0.1/",

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
						"http://google.com/something.html"
					]);
				});
			});
		});
	});
});
