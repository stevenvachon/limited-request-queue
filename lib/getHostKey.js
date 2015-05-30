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
	var domainObj,port,protocol/*,protocolInfo*/,urlObj;
	var key = "";
	
	if (typeof url==="string" || url instanceof String===true)
	{
		urlObj = parseUrl(url);
	}
	else
	{
		urlObj = url;
	}
	
	protocol = urlObj.protocol;
	
	// Not using strict equals because `urlObj` might be a foreign object type
	if (!protocol || !urlObj.hostname)
	{
		return false;
	}
	
	// Remove ":" suffix
	if (protocol.indexOf(":") === protocol.length-1)
	{
		protocol = protocol.substr(0, protocol.length-1);
	}
	
	port = urlObj.port;
	
	// Get default port
	if (port == null)
	{
		// TODO :: switch to "port-numbers"?
		/*protocolInfo = portNumbers.getPort(protocol);
		
		if (protocolInfo !== undefined)
		{
			port = protocolInfo.port;
		}*/
		
		if (options.defaultPorts[protocol] !== undefined)
		{
			port = options.defaultPorts[protocol];
		}
	}
	
	if (options.ignoreSchemes === false)
	{
		key += protocol + "://";
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
	
	if (options.ignorePorts===false && port!=null)
	{
		key += ":" + port;
	}
	
	key += "/";
	
	return key;
}



module.exports = getHostKey;
