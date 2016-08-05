"use strict";
var durations = require("./durations");
var testUrls = require("./testUrls");



module.exports = 
{
	addDurationGroup: durations.addGroup,
	clearDurations:   durations.clear,
	compareDurations: durations.compare,
	
	options: require("./options"),
	
	delay:                   testUrls.delay,
	expectedSyncMinDuration: testUrls.expectedSyncMinDuration,
	testUrls:                testUrls.testUrls,
	urls:                    testUrls.urls
};
