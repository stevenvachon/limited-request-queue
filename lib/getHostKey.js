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
	var domainObj/*,protocolInfo*/;
	var key = "";
	var urlObj = parseUrl(url);
	
	if (urlObj.protocol===null || urlObj.hostname===null)
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
		// Or, if browser
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
