"use strict";
var broquire = require("broquire")(require);
var isString = require("is-string");
var parseDomain = broquire("parse-domain", function(){ return null });
var URL = broquire("whatwg-url", "window").URL;



function getHostKey(url, options)
{
	var key,port,protocol,urlDomain;
	
	if (url == null)
	{
		return false;
	}
	else if (isString(url) === true)
	{
		try
		{
			url = new URL(url);
		}
		catch (error)
		{
			return false;
		}
	}
	
	protocol = url.protocol;
	
	// TODO :: remove support for node-js url.parse objects
	if (isEmptyString(protocol)===true || isEmptyString(url.hostname)===true)
	{
		return false;
	}
	
	// Remove ":" suffix
	if (protocol.indexOf(":") === protocol.length-1)
	{
		protocol = protocol.substr(0, protocol.length-1);
	}
	
	port = url.port;
	
	// Get default port
	// TODO :: remove support for node-js url.parse objects
	if (isEmptyStringOrNumber(port)===true && options.defaultPorts[protocol]!==undefined)
	{
		port = options.defaultPorts[protocol];
	}
	
	key = "";
	
	if (options.ignoreSchemes === false)
	{
		key += protocol + "://";
	}
	
	if (options.ignoreSubdomains === false)
	{
		key += url.hostname;
	}
	else
	{
		urlDomain = parseDomain(url.hostname);
		
		// If unknown top-level-domain (.com, etc)
		// Or, if running in a browser
		if (urlDomain === null)
		{
			key += url.hostname;
		}
		else
		{
			key += urlDomain.domain + "." + urlDomain.tld;
		}
	}
	
	if (options.ignorePorts===false && port!=null)
	{
		key += ":" + port;
	}
	
	key += "/";
	
	return key;
}



function isEmptyString(value)
{
	return value==="" || value==null || isString(value)===false;
}



function isEmptyStringOrNumber(value)
{
	return value==="" || value==null || isNaN(value)===true;
}



module.exports = getHostKey;
