import parseDomain from "parse-domain";



export default (url, options, optionOverrides) =>
{
	const ignorePorts      = optionOverrides?.ignorePorts      ?? options.ignorePorts;
	const ignoreProtocols  = optionOverrides?.ignoreProtocols  ?? options.ignoreProtocols;
	const ignoreSubdomains = optionOverrides?.ignoreSubdomains ?? options.ignoreSubdomains;

	let key = "";

	if (!ignoreProtocols)
	{
		key += `${url.protocol}//`;
	}

	if (!ignoreSubdomains)
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

	if (!ignorePorts && url.port!=="")
	{
		key += `:${url.port}`;
	}

	return key;
};
