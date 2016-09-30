"use strict";
const defined = require("defined");
const parseDomain = require("parse-domain");



const getHostKey = (url, options, optionOverrides={}) =>
{
	const ignorePorts      = defined(optionOverrides.ignorePorts,      options.ignorePorts);
	const ignoreProtocols  = defined(optionOverrides.ignoreProtocols,  options.ignoreProtocols);
	const ignoreSubdomains = defined(optionOverrides.ignoreSubdomains, options.ignoreSubdomains);

	let key = "";

	if (ignoreProtocols === false)
	{
		key += `${url.protocol}//`;
	}

	if (ignoreSubdomains === false)
	{
		key += url.hostname;
	}
	else
	{
		const hostname = parseDomain(url.hostname);

		// If unknown top-level domain or running in a browser
		if (hostname === null)
		{
			key += url.hostname;
		}
		else
		{
			key += `${hostname.domain}.${hostname.tld}`;
		}
	}

	if (ignorePorts===false && url.port!=="")
	{
		key += `:${url.port}`;
	}

	return key;
};



module.exports = getHostKey;
