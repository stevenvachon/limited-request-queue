import {describe, it} from "mocha";
import {expect} from "chai";
import RequestQueue, {DEFAULT_OPTIONS, END_EVENT, ITEM_EVENT} from '../lib/index.mjs';



describe("ESM", () =>
{
	it("has a default export", () =>
	{
		expect(RequestQueue).not.to.be.undefined;
	});



	it("has named exports", () =>
	{
		const constants =
		[
			DEFAULT_OPTIONS,
			END_EVENT,
			ITEM_EVENT
		];

		constants.forEach(constant => expect(constant).not.to.be.undefined);
	});
});
