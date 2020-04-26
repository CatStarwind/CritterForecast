const { DateTime } = require("luxon");
const db = require("./db/critter.json");
const north = (() => { let y = []; for(var i=0;i<12;i++){y.push(2**i);} return y; })();
const south = north.map((n,i) => (i<6) ? n << 6 : n >> 6);
const critters = {
	'insect': {
		'timeframe': [[4,8],[8,16],[16,17],[17,19],[19,22],[22,4]],
		'db': db.insect
	},
	'fish': {
		'timeframe': [[4,9],[9,16],[16,21],[21,4]],
		'db': db.fish
	}
};

module.exports = function(critter) {
	return function(req, res) {
		res.setHeader('Cache-Control', 'no-cache, no-store');
		let db = critters[critter].db;
		let available = [];	

		// Where is Now?
		let month = (req.query.hemi === "South") ? south : north;
		let dt = DateTime.utc();
		let offset = dt.setZone(req.query.tz);
		if(offset.isValid) { dt = offset; }
		
		//Parameters
		let currentMonth = month[dt.month-1];
		let currentTime = 2 ** critters[critter].timeframe.findIndex(tf => (dt.hour >= tf[0] && dt.hour < tf[1]) || (tf[0] > tf[1] && (dt.hour >= tf[0] || dt.hour < tf[1])));
		let monthLC = dt.month < 12 ? month[dt.month] : 1;
		let timeLC = currentTime < 2 ** (critters[critter].timeframe.length-1) ? currentTime * 2 : 1;

		//Create Display Header Index
		let hi = Object.assign({}, db.cols);
		["Month","Time"].forEach(v => delete hi[v]);
		Object.keys(hi).forEach((v,i) => hi[v]=i);

		//Find
		db.rows.forEach((row,i) => {
			if (row[[db.cols.Month]] & currentMonth && row[[db.cols.Time]] & currentTime) {
				let c = [];
				for(let h in hi){ c.push(row[db.cols[h]]); }
				c.push(row[[db.cols.Month]] & monthLC ? 0 : 1);
				c.push(row[[db.cols.Time]] & timeLC ? 0 : 1);
				available.push(c);
			}
		});
		["MLC","TLC"].forEach(v => hi[v] = Object.keys(hi).length);
		
		// Sort Location, Price Desc, ID
		available.sort((a,b) => {
			let locA = a[hi.Location].toUpperCase();
			let locB = b[hi.Location].toUpperCase();

			if(locA < locB) { return -1; }
			if(locA > locB) { return 1; }
			return b[hi.Price] - a[hi.Price] || a[hi.ID] - b[hi.ID];
		});
		
		//Insert Header
		available.unshift(hi);

		res.json(available);
	};
};