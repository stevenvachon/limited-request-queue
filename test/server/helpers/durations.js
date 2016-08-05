"use strict";
var durations = [];



function addDurationGroup()
{
	durations.push([]);
}



function clearDurations()
{
	durations.length = 0;
}



function compareDurations(duration, callback)
{
	var curGroup = durations[ durations.length-1 ];
	var prevGroupDuration;
	
	curGroup.push(duration);
	
	if (durations.length > 1)
	{
		prevGroupDuration = durations[durations.length-2][ curGroup.length-1 ];
		callback(prevGroupDuration);
	}
}



module.exports = 
{
	addGroup: addDurationGroup,
	clear: clearDurations,
	compare: compareDurations
};
