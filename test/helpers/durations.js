"use strict";
const durations = [];



const addDuration = duration => durations.push(duration);



const clearDurations = () => durations.length = 0;



const previousDuration = () =>
{
	if (durations.length > 1)
	{
		return durations[durations.length - 2];
	}
	else
	{
		return -1;
	}
};



module.exports =
{
	addDuration,
	clearDurations,
	previousDuration
};
