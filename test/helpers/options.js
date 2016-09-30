"use strict";



function options(overrides)
{
	return Object.assign
	(
		{
			ignorePorts: false,
			ignoreProtocols: false,
			ignoreSubdomains: false,
			maxSockets: Infinity,
			maxSocketsPerHost: Infinity,
			rateLimit: 0
		},
		overrides
	);
}



module.exports = options;
