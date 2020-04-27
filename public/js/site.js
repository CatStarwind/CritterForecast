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
			$("th.catch", id).remove();
			let col = data.shift();
			
			data.forEach(row => {
				let $row = $("<tr>").attr("id", critter[0] + row[col.ID]);
				if (row[col.TLC]) { $row.addClass("lastchanceTime"); }
				if (row[col.MLC]) { $row.addClass("lastchanceMonth"); }

				$("<td>").text(row[col.Name]).appendTo($row);
				$("<td>").text(row[col.Price].toLocaleString()).appendTo($row);
				$("<td>").text(row[col.Location] + (row[col.Note] ? ` (${row[col.Note]})` : '')).appendTo($row);
				if(row[col.S]) { $("<td>").text(row[col.S]).appendTo($row); }
				
				$("table", id).append($row);
			});

			if (cf.caught.disp()) { cf.caught.show(id); }
		});
	},
	setHemi: function(hemi) {
		$("#hemisphere").attr({
			src: `/img/hemi_${hemi.toLowerCase()}.png`,
			alt: hemi + " Hemisphere",
			title: hemi + " Hemisphere"
		});
	},
	switchHemi: function() {
		let hemi = localStorage.getItem("hemi") === "North" ? "South" : "North";
		localStorage.setItem("hemi", hemi);
		this.setHemi(hemi);
		for(var tf in timeframes) { cf.createTable(tf); }
	},
	caught: {
		disp: () => localStorage.getItem("catchDisp") === "false" ? false : true,
		list: function() {
			let caught = localStorage.getItem("caught");
			if(!caught) { return []; }
			return caught.split(",");
		},
		check: id => cf.caught.list().includes(id),
		show: function(table) {
			$(table).addClass("showCatch").removeClass("hideCatch");
			$("thead tr", table).prepend('<th class="catch">');
			$("tbody tr", table).each((i,el) => {
				let id = $(el).attr("id");
				if(this.check(id)) { $(el).addClass("caught"); }
				$("<td>").addClass("catch").click(cf.caught.critter).prependTo(el);
			});
		},
		toggle: function() {
			if(!cf.caught.disp()){
				$("div.critter table").each((i,el) => { cf.caught.show(el); });
				$("#catchToggle").removeClass("hide");
				localStorage.setItem("catchDisp", "true");
			} else {
				$(".catch").remove();
				$("div.critter table").addClass("hideCatch").removeClass("showCatch");
				$("#catchToggle").addClass("hide");
				$(".caught").removeClass("caught");
				localStorage.setItem("catchDisp", "false");
			}
		},
		critter: function(e) {
			let id = $(this).parent("tr").attr("id");
			let caught = cf.caught.list();

			if(cf.caught.check(id)){
				caught.splice(caught.indexOf(id), 1)
				localStorage.setItem("caught", caught);
				$(this).parent("tr").removeClass("caught");
			} else {
				caught.push(id);
				localStorage.setItem("caught", caught);
				$(this).parent("tr").addClass("caught");
			}
		}
	},
	init: function() {
		let dt = luxon.DateTime.local();
		this.updateClock(dt);
		this.setCurrentTimeFrame(dt.hour);
		this.setHemi(localStorage.getItem("hemi"));
		for(var tf in timeframes) { this.createTable(tf); }

		$("#catchToggle").toggleClass("hide", !this.caught.disp());
		$("#acClock").addClass(timeframes.Insect.currentFrame(dt.hour).toLowerCase()).attr("title", localStorage.getItem("tz"));
		$("#hemisphere").click(() => cf.switchHemi());
		$("#catchToggle").click(() => cf.caught.toggle());
	}
};

$(function() {
	cf.init();
	
	cf.tick = window.setInterval(function () {
		cf.updateClock(luxon.DateTime.local());
	}, 1000);
});