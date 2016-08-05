"use strict";
var appDefaultOptions = require("../../../lib/defaultOptions");

var testDefaultOptions =
{
	// All other options will use default values
	// as this will ensure that when they change, tests WILL break
	ignorePorts: false,
	ignoreSchemes: false,
	ignoreSubdomains: false,
	maxSocketsPerHost: Infinity
};



function options(overrides)
{
	return Object.assign
	(
		{},
		appDefaultOptions,
		testDefaultOptions,
		overrides
	);
}



module.exports = options;
