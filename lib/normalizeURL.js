"use strict";
const {parseDomain, ParseResultType} = require("parse-domain");



/**
 * Produce a normalized URL.
 * @param {URL} url
 * @param {object} options
 * @param {object} [optionOverrides]
 * @returns {string}
 */
module.exports = ({hostname, port, protocol}, options, optionOverrides) =>
{
	const ignorePorts      = optionOverrides?.ignorePorts      ?? options.ignorePorts;
	const ignoreProtocols  = optionOverrides?.ignoreProtocols  ?? options.ignoreProtocols;
	const ignoreSubdomains = optionOverrides?.ignoreSubdomains ?? options.ignoreSubdomains;

	let key = "";

	if (!ignoreProtocols)
	{
		key += `${protocol}//`;
	}

	if (!ignoreSubdomains)
	{
		key += hostname;
	}
	else
	{
		const parsed = parseDomain(hostname);

		if (parsed.type !== ParseResultType.Listed)
		{
			key += hostname;
		}
		else
		{
			const domain = parsed.domain ? [parsed.domain] : [];

			key += [...domain, ...parsed.topLevelDomains].join(".");
		}
	}

	if (!ignorePorts && port!=="")
	{
		key += `:${port}`;
	}

	return key;
};
