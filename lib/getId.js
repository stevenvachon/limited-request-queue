"use strict";



function getId()
{
	// Use 2 randoms to avoid same number ever re-occuring
	return Math.floor( Date.now() * Math.random() * Math.random() );
}



module.exports = getId;
