"use strict";
const durations = [];



function addDuration(duration)
{
	durations.push(duration);
}



function clearDurations()
{
	durations.length = 0;
}



function previousDuration()
{
	if (durations.length > 1)
	{
		return durations[durations.length - 2];
	}
	else
	{
		return -1;
	}
}



module.exports = 
{
	add: addDuration,
	clear: clearDurations,
	previous: previousDuration
};
