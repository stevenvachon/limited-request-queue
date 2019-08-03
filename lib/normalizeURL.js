import parseDomain from "parse-domain";



/**
 * Produce a normalized URL.
 * @param {URL} url
 * @param {object} options
 * @param {object} [optionOverrides]
 * @returns {string}
 */
export default ({hostname, port, protocol}, options, optionOverrides) =>
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
		// Returns `null` if unknown top-level domain or running in a browser
		const {domain, tld} = parseDomain(hostname) ?? {};

		if (domain===undefined && tld===undefined)
		{
			key += hostname;
		}
		else
		{
			key += `${domain}.${tld}`;
		}
	}

	if (!ignorePorts && port!=="")
	{
		key += `:${port}`;
	}

	return key;
};
