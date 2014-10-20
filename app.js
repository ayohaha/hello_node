
/**
	* Node.js Login Boilerplate
	* More Info : http://bit.ly/LsODY8
	* Copyright (c) 2013 Stephen Braitsch
**/

var express = require('express')
, http = require('http')
, app = express()
, server  = http.createServer(app)
, io      = require('socket.io')(server);

app.configure(function(){
	app.set('port', 8080);
	app.set('views', __dirname + '/app/server/views');
	app.set('view engine', 'jade');
	app.locals.pretty = true;
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({ secret: 'super-duper-secret-secret' }));
	app.use(express.methodOverride());
	app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
	app.use(express.static(__dirname + '/app/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});




console.log('prepare connected to socket.io');

io.on('connection', function(socket){
		
		socket.on('noticeAddRegister', function(msg){
			io.emit('noticeAddRegister', { 'msg': msg });
		});

		socket.on('changeStatus', function(msg){
			console.log('changeStatus emit!!');
			if(msg.status == 'Done') {
				io.emit('redirectPage', { 'msg' :msg.number+'회차 종료되었습니다. ','page': '/registerList' });
			} else if(msg.status == 'Active') {
				io.emit('redirectPage', { 'msg' :msg.number+'회차 시작되었습니다. ','page': '/register' });
			} 
			
		});
		
		socket.on('disconnect', function(){
			console.log('user disconnected');
		});
	});
require('./app/server/router')(app, io);

server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
})