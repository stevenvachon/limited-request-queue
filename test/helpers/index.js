"use strict";
const durations = require("./durations");
const testUrls = require("./testUrls");



module.exports = 
{
	addDuration:      durations.add,
	clearDurations:   durations.clear,
	previousDuration: durations.previous,
	
	options: require("./options"),
	
	delay:                   testUrls.delay,
	expectedSyncMinDuration: testUrls.expectedSyncMinDuration,
	testUrls:                testUrls.testUrls,
	urls:                    testUrls.urls
};
