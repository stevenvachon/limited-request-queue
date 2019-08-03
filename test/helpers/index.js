"use strict";



class WrongCallError extends Error
{
	constructor()
	{
		super("This should not have been called");
	}
}



module.exports =
{
	...require("./durations"),
	...require("./testUrls"),

	options: require("./options"),
	WrongCallError
};
