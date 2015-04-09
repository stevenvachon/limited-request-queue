"use strict";
var parseDomain,parseUrl;
//var portNumbers = require("port-numbers");



// Avoid browserify shim
var _process;
try {
    _process = eval("process");
} catch (e) {}



// TODO :: use is-node package if it gets updated
if (typeof _process==="object" && _process.toString()==="[object process]")
{
	// Node
	parseDomain = require("parse-domain");
	parseUrl = require("url").parse;
}
else
{
	// Browser
	parseDomain = function(){ return null };
	parseUrl = require("url-parse")
}



function getHostKey(url, options)
{
	var domainObj/*,protocolInfo*/,urlObj;
	var key = "";
	
	if (typeof url==="string" || url instanceof String)
	{
		urlObj = parseUrl(url);
	}
	else
	{
		urlObj = url;
	}
	
	// Not using strict equals because `urlObj` might be a foreign object type
	if (!urlObj.protocol || !urlObj.hostname)
	{
		return false;
	}
	
	// Remove ":" suffix
	if (urlObj.protocol.indexOf(":") === urlObj.protocol.length-1)
	{
		urlObj.protocol = urlObj.protocol.substr(0, urlObj.protocol.length-1);
	}
	
	// Get default port
	if (urlObj.port === null)
	{
		// TODO :: switch to "port-numbers"?
		/*protocolInfo = portNumbers.getPort(urlObj.protocol);
		
		if (protocolInfo !== undefined)
		{
			urlObj.port = protocolInfo.port;
		}*/
		
		if (options.defaultPorts[urlObj.protocol] !== undefined)
		{
			// TODO :: use a local var for port to avoid mutating the input?
			urlObj.port = options.defaultPorts[urlObj.protocol];
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
		// Or, if running in a browser
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
