const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { DateTime } = require("luxon");
const db = new sqlite3.cached.Database('./db/critter.db');

// Morning, Day, LateDay, EarlyEvening, Night
const timeframe = [[4,8],[8,16],[16,17],[17,19],[19,22],[22,4]];
const monthEnum = (hemi) => {
	let year = [];
	for(var i=0;i<12;i++){year.push(2**i);}
	if(hemi === "South"){
		year.forEach((y,i) => year[i] = (i<6) ? y << 6 : y >> 6);
	}
	return year;
};

const getTimeFrame = function(hour){
	var inTimeFrame = (tf) => hour >= tf[0] && hour < tf[1] || (tf[0] > tf[1] && (hour >= tf[0] || hour < tf[1]));
	return 2 ** timeframe.findIndex(inTimeFrame);
};

router.get('/', function(req, res) {
	let insect = [];
	let dt = DateTime.utc();
	let month = monthEnum(req.query.hemi);
	if(req.query.tz != ""){
		let offset = dt.setZone(req.query.tz);
		if(offset.isValid) { dt = offset; }
	}

	//Query Parameters
	let currentMonth = month[dt.month-1];
	let currentTime = getTimeFrame(dt.hour);
	let monthLC = dt.month < 12 ? month[dt.month] : 1;
	let timeLC = currentTime < 2 ** (timeframe.length-1) ? currentTime * 2 : 1;

	db.each(`
		SELECT Name, Price, Location, Note
			,CASE WHEN Month & ? THEN 0 ELSE 1 END MLC
			,CASE WHEN Time & ? THEN 0 ELSE 1 END TLC
		FROM Insect
		WHERE Month & ? != 0 AND Time & ? != 0
		ORDER BY Location, Price DESC
		`, [monthLC, timeLC, currentMonth, currentTime],
		(err, row) => insect.push(row),
		(err, count) => res.json(insect)
	);
});

process.on('SIGINT', () => {
    db.close();
});

module.exports = router;
