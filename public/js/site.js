const insectTF = [[4,8],[8,16],[16,17],[17,19],[19,22],[22,4]];
const fishTF = [[4,9],[9,16],[16,21],[21,4]];
var curITF = [];
const nameTF = {4:"Morning", 8:"Day", 9:"Day", 16:"Day", 17:"EarlyEvening", 19:"Evening"};

let setCurrentTimeFrame = function(hour) {
	let timeframes = document.getElementsByClassName("timeframe");
	
	//Clear
	document.querySelectorAll('.now').forEach(tf => tf.classList.remove("now"));

	//Set
	for(timeframe of timeframes) {
		let tf = timeframe.id.split('_')[1].split("-").map(t=>parseInt(t));
		
		if (hour >= tf[0] && hour < tf[1] || (tf[0] > tf[1] && (hour >= tf[0] || hour < tf[1]))) {
			timeframe.classList.add("now");
		}
	}
};

let setClock = function(dt) {
	if(dt.toFormat("h:mma") !== $(".time").text()){
		$(".time").html(dt.toFormat("h:mm") + `<span>${dt.toFormat("a")}</span>`);
		$(".date").html(dt.toFormat("LLLL dd") + ` <span>${dt.toFormat("ccc")}</span>`);
		setClockTF(dt);
	}	
};

let setClockTF = function(dt){
	//Clear
	$(".datetime").removeClass().addClass("datetime");
	$(".date span").removeClass();

	insectTF.forEach(tf => {
		if(dt.hour >= tf[0] && dt.hour < tf[1] || (tf[0] > tf[1] && (dt.hour >= tf[0] || dt.hour < tf[1]))){
			$(".datetime, .date span").addClass(`tf_${tf[0]}-${tf[1]}`);
		}
	});
};

let createTable = function(id){
	let url = id.toLowerCase()+"?tz="+Intl.DateTimeFormat().resolvedOptions().timeZone;

	url += "&hemi=" + localStorage.getItem("hemi");

	$.getJSON(url, function(data){
		let header = [];
		$('th', "#"+id).each((i, el) => header.push($(el).text()));

		data.forEach(critter => {
			let $row = $("<tr>");
			if (critter.TLC) { $row.addClass("lastchanceTime"); }
			if (critter.MLC) { $row.addClass("lastchanceMonth"); }

			header.forEach(c => $("<td>").text(critter[c]).appendTo($row));
			$("#"+id).append($row);
		});
	});
};

let setITF = function(hour ){
	insectTF.forEach(tf => {
		if(hour >= tf[0] && hour < tf[1] || (tf[0] > tf[1] && (hour >= tf[0] || hour < tf[1]))){
			curITF = tf;
		}
	});
};

let setHemi = function(hemi) {
	$img = $("<img>")
		.addClass("hemisphere")
		.attr({
			src: `/img/hemi_${hemi.toLowerCase()}.png`,
			alt: hemi + " Hemisphere",
			title: hemi + " Hemisphere"
		})
		.appendTo(".dashboard");
};

let changeHemi = function() {
	localStorage.setItem("hemi", localStorage.getItem("hemi") === "North" ? "South" : "North");
	location.reload();
};

$(function() {
	let dt = luxon.DateTime.local();	
	setClock(dt);
	setCurrentTimeFrame(dt.hour);
	setITF(dt.hour);
	setHemi(localStorage.getItem("hemi"));
	createTable("Insect");
	createTable("Fish");

	$(".datetime").attr("title", localStorage.getItem("tz"));
	$(".hemisphere").click(changeHemi);

	window.setInterval(function(){
		let dt = luxon.DateTime.local();
		let tf = [...curITF];
		setITF(dt.hour);
		if(tf[0] !== curITF[0]){ location.reload(); }

		setClock(dt);
	}, 1000);
});