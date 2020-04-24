const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { DateTime } = require("luxon");
const db = new sqlite3.cached.Database('./db/critter.db');
process.on('SIGINT', () => { db.close(); });

// Morning, Day, LateDay, EarlyEvening, Night [start,end]
const timeframe = [[4,8],[8,16],[16,17],[17,19],[19,22],[22,4]];

router.get('/', function(req, res) {
	res.setHeader('Cache-Control', 'no-cache, no-store');	
	let insect = [];
	let month = (() => { let y = []; for(var i=0;i<12;i++){y.push(2**i);} return y; })();	
	let dt = DateTime.utc();
	let offset = dt.setZone(req.query.tz);
	if(req.query.hemi === "South"){ month.forEach((y,i) => month[i] = (i<6) ? y << 6 : y >> 6); }
	if(offset.isValid) { dt = offset; }

	//Query Parameters
	let currentMonth = month[dt.month-1];
	let currentTime = 2 ** timeframe.findIndex(tf => (dt.hour >= tf[0] && dt.hour < tf[1]) || (tf[0] > tf[1] && (dt.hour >= tf[0] || dt.hour < tf[1])));
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

module.exports = router;
