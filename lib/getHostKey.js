"use strict";
var parseDomain = require("parse-domain");
var parseUrl = require("url").parse;
//var portNumbers = require("port-numbers");

// TODO :: switch to "port-numbers" package when it gets faster
var defaultPorts = 
{
	ftp: 21,
	http: 80,
	https: 443
};



function getHostKey(url, options)
{
	var domainObj/*,protocolInfo*/;
	var key = "";
	var urlObj = parseUrl(url);
	
	if (urlObj.protocol===null || urlObj.hostname===null)
	{
		return new Error("Invalid URI");
	}
	
	// Remove ":" suffix
	if (urlObj.protocol.indexOf(":") === urlObj.protocol.length-1)
	{
		urlObj.protocol = urlObj.protocol.substr(0, urlObj.protocol.length-1);
	}
	
	// Get default port
	if (urlObj.port === null)
	{
		/*protocolInfo = portNumbers.getPort(urlObj.protocol);
		
		if (protocolInfo !== undefined)
		{
			urlObj.port = protocolInfo.port;
		}*/
		
		if (defaultPorts[urlObj.protocol] !== undefined)
		{
			urlObj.port = defaultPorts[urlObj.protocol];
		}
	}
	
	if (options.ignoreSchemes === false)
	{
		key += urlObj.protocol + "://";
	}
	
	if (options.ignoreSubdomains === false)
	{
		key += urlObj.hostname;
	}
	else
	{
		domainObj = parseDomain(urlObj.hostname);
		
		// If unknown top-level-domain (.com, etc)
		if (domainObj === null)
		{
			key += urlObj.hostname;
		}
		else
		{
			key += domainObj.domain + "." + domainObj.tld;
		}
	}
	
	if (options.ignorePorts===false && urlObj.port!==null)
	{
		key += ":" + urlObj.port;
	}
	
	key += "/";
	
	return key;
}



module.exports = getHostKey;
