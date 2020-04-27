const timeframe = function(blocks, labels){
	let tf = {};
	
	tf.frameStart = function (hour) {
		let tfstart = [];
		blocks.forEach(b => tfstart.push(b[0]));
		return tfstart.find(fs => fs === hour);
	};

	tf.currentFrame = function (hour) {
		let tfname = "";

		for(var i=0; i<blocks.length; i++){
			let tf = blocks[i];
			if (hour >= tf[0] && hour < tf[1] || (tf[0] > tf[1] && (hour >= tf[0] || hour < tf[1]))) {
				tfname = labels[i];
				break;
			}
		}

		return tfname;
	};

	return tf;
};

const timeframes = {
	"Insect": timeframe([[4,8],[8,16],[16,17],[17,19],[19,22],[22,4]], ["Morning", "Day", "LateDay", "EarlyEvening", "Evening", "Night"]),
	"Fish": timeframe([[4,9],[9,16],[16,21],[21,4]], ["Morning", "Day", "Evening", "Night"])
};

const cf = {
	setCurrentTimeFrame: function(hour) {
		//Clear
		$(".now").removeClass("now");
	
		//Set
		for(let tf in timeframes){
			$("."+timeframes[tf].currentFrame(hour).toLowerCase(), "#"+tf).addClass("now"); 
		}
	},
	updateClock: function(dt) {
		if(dt.toFormat("h:mm a") !== $(".time").text()){
			$(".time").html(dt.toFormat("h:mm") + `<span> ${dt.toFormat("a")}</span>`);
			$(".date").html(dt.toFormat("LLLL dd") + ` <span>${dt.toFormat("ccc")}</span>`);
			
			//Top of Hour Updates
			if (dt.minute === 0) {
				//Clear & Set
				$("#acClock").removeClass().addClass(timeframes.Insect.currentFrame(dt.hour).toLowerCase());

				//Check if entering new Time Frame
				for(let tf in timeframes) {
					if (timeframes[tf].frameStart(dt.hour)) {
						this.createTable(tf);
						this.setCurrentTimeFrame(dt.hour);
					}
				}
			}
		}	
	},
	createTable: function (critter) {
		let id = "#" + critter;
		let url = critter.toLowerCase() + "?tz=" + localStorage.getItem("tz") + "&hemi=" + localStorage.getItem("hemi");
		
		$.getJSON(url, function(data){
			$("tbody", id).empty(); //Reset
			let col = data.shift();

			data.forEach(row => {
				let $row = $("<tr>").attr("id", critter[0]+row[col.ID]);
				if(critter === "Fish"){ $row.addClass("caught"); }
				if (row[col.TLC]) { $row.addClass("lastchanceTime"); }
				if (row[col.MLC]) { $row.addClass("lastchanceMonth"); }

				$("<td>").addClass("catch").appendTo($row);
				$("<td>").text(row[col.Name]).appendTo($row);
				$("<td>").text(row[col.Price].toLocaleString()).appendTo($row);
				$("<td>").text(row[col.Location] + (row[col.Note] ? ` (${row[col.Note]})` : '')).appendTo($row);
				if(row[col.S]) { $("<td>").text(row[col.S]).appendTo($row); }
				
				$("table", id).append($row);
			});
		});
	},
	initHemi: function() {
		let hemi = localStorage.getItem("hemi");

		$img = $("<img>")
			.addClass("hemisphere")
			.attr({
				src: `/img/hemi_${hemi.toLowerCase()}.png`,
				alt: hemi + " Hemisphere",
				title: hemi + " Hemisphere"
			})
			.appendTo(".dashboard");
	},
	switchHemi: function() {
		localStorage.setItem("hemi", localStorage.getItem("hemi") === "North" ? "South" : "North");
		this.initHemi();
		for(var tf in timeframes) { cf.createTable(tf); }
	},
	init: function() {
		let dt = luxon.DateTime.local();	
		this.updateClock(dt);
		this.setCurrentTimeFrame(dt.hour);
		this.initHemi();
		for(var tf in timeframes) { this.createTable(tf); }
		$("#acClock").addClass(timeframes.Insect.currentFrame(dt.hour).toLowerCase()).attr("title", localStorage.getItem("tz"));
		$(".hemisphere").click(cf.switchHemi);
	}
};

$(function() {
	cf.init();
	
	cf.tick = window.setInterval(function () {
		cf.updateClock(luxon.DateTime.local());
	}, 1000);
});