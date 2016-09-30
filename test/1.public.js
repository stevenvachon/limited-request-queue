"use strict";
const {addDuration, clearDurations, DELAY, expectedSyncMinDuration, options, previousDuration, testURLs, URLS} = require("./helpers");
const {before, describe, it} = require("mocha");
const {expect} = require("chai");
const RequestQueue = require("../lib-es5");



describe("Public API", () =>
{
	it("does not require options", () =>
	{
		expect(() => new RequestQueue()).not.to.throw();
	});



	describe("enqueue(), length", () =>
	{
		it("enqueues valid URLs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(options()).pause();
			const url1 = new URL("http://domain1/");
			const url2 = new URL("http://domain2/");

			expect( queue.enqueue(url1) ).to.be.a("number");
			expect( queue.enqueue(url2) ).to.be.a("number");
			expect( queue.length ).to.equal(2);
		});



		it("rejects non-URLs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(options()).pause();

			const fixtures =
			[
				"http://domain/",
				Symbol("http://domain/"),
				{},
				[],
				/regex/,
				true,
				1,
				null,
				undefined
			];

			fixtures.forEach(fixture =>
			{
				expect(() => queue.enqueue(fixture)).to.throw(TypeError);
				expect(queue.length).to.equal(0);
			});
		});
	});



	describe("dequeue(), length", () =>
	{
		it("dequeues valid IDs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(options()).pause();

			const url = new URL("http://domain/");
			const id = queue.enqueue(url);

			expect( queue.dequeue(id) ).to.be.true;
			expect( queue.length ).to.equal(0);
		});



		it("rejects invalid IDs", () =>
		{
			// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
			const queue = new RequestQueue(options()).pause();

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

				const queue = new RequestQueue(options())
				.on("item", (url, data, itemDone) =>
				{
					if (++count >= URLS.length)
					{
						done();
					}
				});

				URLS.forEach(url => queue.enqueue(new URL(url)));
			});



			it("supports custom data", done =>
			{
				let count = 0;

				const queue = new RequestQueue(options())
				.on("item", (url, data, itemDone) =>
				{
					switch (++count)
					{
						case 1:
						{
							expect(url.href).to.equal(URLS[0]);
							expect(data).to.equal(1);
							break;
						}
						case 2:
						{
							expect(url.href).to.equal(URLS[1]);
							expect(data).to.equal(2);
							break;
						}
						case 3:
						{
							expect(url.href).to.equal(URLS[2]);
							expect(data).to.equal(3);
							done();
							break;
						}
					}
				});

				queue.enqueue(new URL(URLS[0]), 1);
				queue.enqueue(new URL(URLS[1]), 2);
				queue.enqueue(new URL(URLS[2]), 3);
			});



			it("is not called with non-URLs", done =>
			{
				const queue = new RequestQueue(options())
				.on("item", () => done( new Error("this should not have been called") ));

				expect(() => queue.enqueue("url")).to.throw();

				setTimeout(done, DELAY*2);
			});
		});



		describe("end", () =>
		{
			it("works", done =>
			{
				const queue = new RequestQueue(options())
				.on("item", (url, data, itemDone) =>
				{
					setTimeout(itemDone, DELAY);
				})
				.on("end", () => done());

				URLS.forEach(url => queue.enqueue(new URL(url)));
			});



			it("is called when last item is dequeued", done =>
			{
				// Pause to prevent first queued item from immediately starting (and thus being auto-dequeued)
				const queue = new RequestQueue(options()).pause()
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
				const queue = new RequestQueue(options())
				.on("end", () => done( new Error("this should not have been called") ));

				queue.resume();

				setTimeout(done, DELAY*2);
			});



			it("is not called on erroneous dequeue", done =>
			{
				const queue = new RequestQueue(options())
				.on("end", () => done( new Error("this should not have been called") ));

				queue.dequeue(123);

				setTimeout(done, DELAY*2);
			});
		});
	});



	describe("pause(), resume(), isPaused()", () =>
	{
		it("works", () =>
		{
			const opts = options();
			let count = 0;
			let resumed = false;

			return testURLs(URLS, opts, undefined, function eachItem(url, data, queue)
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

					}, expectedSyncMinDuration());
				}
			})
			.then(result =>
			{
				expect(resumed).to.be.true;
				expect(result.urls).to.deep.equal(URLS);
			});
		});
	});



	describe("numActive", () =>
	{
		it("works", done =>
		{
			const queue = new RequestQueue(options())
			.on("item", (url, data, itemDone) =>
			{
				setTimeout(itemDone, DELAY);
			})
			.on("end", () =>
			{
				expect( queue.numActive ).to.equal(0);
				done();
			});

			URLS.forEach(url => queue.enqueue(new URL(url)));

			expect( queue.numActive ).to.equal(URLS.length);
		});



		it("is not affected by dequeue()", done =>
		{
			const queue = new RequestQueue(options())
			.on("item", (url, data, itemDone) =>
			{
				// Wait for `id` to be assigned its value
				setImmediate( () =>
				{
					expect( queue.dequeue(id) ).to.be.false;
					expect( queue.numActive ).to.equal(1);
				});

				setTimeout(itemDone, DELAY);
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
			const queue = new RequestQueue(options())
			.on("item", (url, data, itemDone) =>
			{
				setTimeout(itemDone, DELAY);
			})
			.on("end", () =>
			{
				expect( queue.numQueued ).to.equal(0);
				done();
			});

			URLS.forEach(url => queue.enqueue(new URL(url)));

			expect( queue.numQueued ).to.equal(0);
		});
	});



	describe("Options", () =>
	{
		describe("all disabled", () =>
		{
			it("works", () =>
			{
				const opts = options();

				return testURLs(URLS, opts)
				.then(result => expect(result.urls).to.deep.equal(URLS));
			});
		});



		describe("maxSockets", () =>
		{
			before( () => clearDurations() );



			describe("=0", () =>
			{
				it("can't do anything", done =>
				{
					const opts = options({ maxSockets:0 });

					testURLs(URLS, opts)
					.then(() => done( new Error("this should not have resolved") ));

					setTimeout( () => done(), expectedSyncMinDuration() );
				});
			});



			[1,2,3,4,Infinity].forEach(value =>
			{
				describe(`=${value}`, () =>
				{
					it("works", () =>
					{
						const opts = options({ maxSockets:value });

						return testURLs(URLS, opts)
						.then(result =>
						{
							expect(result.urls).to.deep.equal(URLS);

							addDuration(result.duration);

							if (value > 1)
							{
								expect(result.duration).to.be.below( previousDuration() );
							}
						})
					});



					it("supports ignorePorts=true", () =>
					{
						const opts = options({ ignorePorts:true, maxSockets:value });

						return testURLs(URLS, opts)
						.then(result => expect(result.urls).to.deep.equal(URLS));
					});



					it("supports ignoreProtocols=true", () =>
					{
						const opts = options({ ignoreProtocols:true, maxSockets:value });

						return testURLs(URLS, opts)
						.then(result => expect(result.urls).to.deep.equal(URLS));
					});



					it("supports ignoreSubdomains=true", () =>
					{
						const opts = options({ ignoreSubdomains:true, maxSockets:value });

						return testURLs(URLS, opts)
						.then(result => expect(result.urls).to.deep.equal(URLS));
					});



					it("supports all boolean options true", () =>
					{
						const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSockets:value });

						return testURLs(URLS, opts)
						.then(result => expect(result.urls).to.deep.equal(URLS));
					});
				});
			});
		});



		// NOTE :: URLs are visually grouped according to how they are prioritized for concurrency within the queue
		describe("maxSocketsPerHost", () =>
		{
			before( () => clearDurations() );



			describe("=0", () =>
			{
				it("can't do anything", done =>
				{
					const opts = options({ maxSocketsPerHost:0 });

					testURLs(URLS, opts)
					.then(() => done( new Error("this should not have resolved") ));

					setTimeout( () => done(), expectedSyncMinDuration() );
				});
			});



			describe("=1", () =>
			{
				it("works", () =>
				{
					const opts = options({ maxSocketsPerHost:1 });

					return testURLs(URLS, opts)
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
						addDuration(result.duration);
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = options({ ignorePorts:true, maxSocketsPerHost:1 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreProtocols:true, maxSocketsPerHost:1 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreSubdomains:true, maxSocketsPerHost:1 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:1 });

					return testURLs(URLS, opts)
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
					const opts = options({ maxSocketsPerHost:2 });

					return testURLs(URLS, opts)
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

						addDuration(result.duration);

						expect(result.duration).to.be.below( previousDuration() );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = options({ ignorePorts:true, maxSocketsPerHost:2 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreProtocols:true, maxSocketsPerHost:2 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreSubdomains:true, maxSocketsPerHost:2 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:2 });

					return testURLs(URLS, opts)
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
					const opts = options({ maxSocketsPerHost:3 });

					return testURLs(URLS, opts)
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

						addDuration(result.duration);

						expect(result.duration).to.be.at.most( previousDuration() + 10 );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = options({ ignorePorts:true, maxSocketsPerHost:3 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreProtocols:true, maxSocketsPerHost:3 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreSubdomains:true, maxSocketsPerHost:3 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:3 });

					return testURLs(URLS, opts)
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
					const opts = options({ maxSocketsPerHost:4 });

					return testURLs(URLS, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(URLS);

						addDuration(result.duration);

						expect(result.duration).to.be.below( previousDuration() );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = options({ ignorePorts:true, maxSocketsPerHost:4 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreProtocols:true, maxSocketsPerHost:4 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignoreSubdomains:true, maxSocketsPerHost:4 });

					return testURLs(URLS, opts)
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
					const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:4 });

					return testURLs(URLS, opts)
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
					const opts = options({ maxSocketsPerHost:Infinity });

					return testURLs(URLS, opts)
					.then(result =>
					{
						expect(result.urls).to.deep.equal(URLS);

						addDuration(result.duration);

						expect(result.duration).to.be.at.most( previousDuration() + 10 );
					});
				});



				it("supports ignorePorts=true", () =>
				{
					const opts = options({ ignorePorts:true, maxSocketsPerHost:Infinity });

					return testURLs(URLS, opts)
					.then(result => expect(result.urls).to.deep.equal(URLS));
				});



				it("supports ignoreProtocols=true", () =>
				{
					const opts = options({ ignoreProtocols:true, maxSocketsPerHost:Infinity });

					return testURLs(URLS, opts)
					.then(result => expect(result.urls).to.deep.equal(URLS));
				});



				it("supports ignoreSubdomains=true", () =>
				{
					const opts = options({ ignoreSubdomains:true, maxSocketsPerHost:Infinity });

					return testURLs(URLS, opts)
					.then(result => expect(result.urls).to.deep.equal(URLS));
				});



				it("supports all boolean options true", () =>
				{
					const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:Infinity });

					return testURLs(URLS, opts)
					.then(result => expect(result.urls).to.deep.equal(URLS));
				});
			});
		});



		describe("rateLimit=50", () =>
		{
			it("works", () =>
			{
				const opts = options({ rateLimit:50 });

				return testURLs(URLS, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(URLS);
				});
			});



			it("supports ignorePorts=true", () =>
			{
				const opts = options({ ignorePorts:true, rateLimit:50 });

				return testURLs(URLS, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(URLS);
				});
			});



			it("supports ignoreProtocols=true", () =>
			{
				const opts = options({ ignoreProtocols:true, rateLimit:50 });

				return testURLs(URLS, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(URLS);
				});
			});



			it("supports ignoreSubdomains=true", () =>
			{
				const opts = options({ ignoreSubdomains:true, rateLimit:50 });

				return testURLs(URLS, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(URLS);
				});
			});



			it("supports all boolean options true", () =>
			{
				const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, rateLimit:50 });

				return testURLs(URLS, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least(50);
					expect(result.urls).to.deep.equal(URLS);
				});
			});
		});



		describe("all boolean options true, maxSockets=2, maxSocketsPerHost=1, rateLimit=50", () =>
		{
			it("works", () =>
			{
				const opts = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSockets:2, maxSocketsPerHost:1, rateLimit:50 });

				return testURLs(URLS, opts)
				.then(result =>
				{
					expect(result.duration).to.be.at.least( (URLS.length - 4) * (50 + DELAY) );
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
				const opts = options({ maxSockets:2 });
				const optOverrides = options({ ignorePorts:true, ignoreProtocols:true, ignoreSubdomains:true, maxSocketsPerHost:1, rateLimit:50 });

				return testURLs(URLS, opts, optOverrides)
				.then(result =>
				{
					expect(result.duration).to.be.at.least( (URLS.length - 4) * (50 + DELAY) );
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
				return testURLs(URLS)
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
