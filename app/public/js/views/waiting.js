
$(document).ready(function() {

	var startTime =  "081130";
	var clock = $('.clock').FlipClock({
		clockFace: 'TwelveHourClock'
	    
	});
	
	setInterval(function(){
		var curTime = clock.getTime().getTime().toString().replace(/,/g,'');

		if( curTime >= startTime ){
			window.location.href = '/register';
		}
	}, 1000);
});
