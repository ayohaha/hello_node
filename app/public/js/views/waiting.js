$(document).ready(function() {

	
	Date.prototype.yyyymmdd = function()
	{
	    var yyyy = this.getFullYear().toString();
	    var mm = (this.getMonth() + 1).toString();
	    var dd = this.getDate().toString();
	    var hh = this.getHours().toString();
	    var ii = this.getMinutes().toString();
	    var ss = this.getSeconds().toString();

	    return yyyy + '-' + (mm[1] ? mm : '0'+mm[0]) + '-' + (dd[1] ? dd : '0'+dd[0]) + ' ' +
	    (hh[1] ? hh : '0'+hh[0]) + ':' + (ii[1] ? ii : '0'+ii[0]) + ':' + (ss[1] ? ss : '0'+ss[0]);
	}
	
	var startTime =  $("#startDate").val();
	var clock = $('.clock').FlipClock({
		clockFace: 'TwelveHourClock'
	    
	});
	var now= new Date();

	setInterval(function(){
     		console.log(now.yyyymmdd());
		if( now >= startTime ){
			window.location.href = '/register';
		}
	}, 1000);



});
