"use strict";
var defaultOptions = 
{
	defaultPorts: {ftp:21, http:80, https:443},
	ignorePorts: true,
	ignoreSchemes: true,
	ignoreSubdomains: true,
	maxSockets: Infinity,
	maxSocketsPerHost: 1,
	rateLimit: 0
};



module.exports = defaultOptions;
