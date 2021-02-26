"use strict";



module.exports = overrides => Object.freeze(
{
	ignorePorts: false,
	ignoreProtocols: false,
	ignoreSubdomains: false,
	maxSockets: Infinity,
	maxSocketsPerHost: Infinity,
	rateLimit: 0,
	...overrides
});



