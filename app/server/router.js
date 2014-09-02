
var CT = require('./modules/country-list');
var AM = require('./modules/account-manager');
var RM = require('./modules/register-manager');
var EM = require('./modules/email-dispatcher');
var EH = require('./modules/examhall-list');

module.exports = function(app, io) {
	// 304-> 200
//	app.get('/*', function(req, res, next){ 
//		  res.setHeader('Last-Modified', (new Date()).toUTCString());
//		  next(); 
//		});

	// main login page //
	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/register');
				}	else{
					res.render('login', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
			if (!o){
				res.send(e, 400);
			}	else{
			    req.session.user = o;
				if (req.param('remember-me') == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.send(o, 200);
			}
		});
	});
	
// logged-in user homepage //
	
	app.get('/home', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
			res.render('home', {
				title : 'Control Panel',
				countries : CT,
				udata : req.session.user
			});
	    }
	});
	
	app.post('/home', function(req, res){
		if (req.param('user') != undefined) {
			AM.updateAccount({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				country 	: req.param('country'),
				team 		: req.param('team'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.send('error-updating-account', 400);
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});
	
// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', countries : CT });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			country : req.param('country'),
			team     : req.param('team')
		}, function(e){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.param('email'), function(o){
			if (o){
				res.send('ok', 200);
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
					//	res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});
	
	
	app.get('/register', function(req, res) {
       if (req.session.user == null){
    	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
	    	//@todo 출석고사 가능한지 체크
	    	
	    	RM.isAllowRegister(function(obj){
	    		console.log('obj~~');

		    	if(obj.isAllowRegister === true) {
		    		//console.log('isAllowRegister ' + isAllowRegister);
		    		res.render('register_form', {
						title: '출석고사를 신청합니다.',
						countries : CT,
						examhall : EH,					
						udata : req.session.user
					});
		    	} else {
		    		console.log('isAllowRegister11 ' + obj.isAllowRegister);
		    		res.render('register_info', {
						title: 'register_info',					
						udata : req.session.user
					});
		    		
		    	}
		    });

	    }
		
	});
		
	
	app.post('/register', function(req, res){
		RM.addNewRegister({
			user 		: req.param('user'),
			name 		: req.param('name'),
			email 		: req.param('email'),
			country 	: req.param('country'),
			team 		: req.param('team'),
			mobile		: req.param('mobile'),
			number		: 1 // 회차 
		}, function(e, obj){
			console.log('=====================DONE============');
			if (e || obj == undefined){
				console.log('Fail::' + e);
				io.emit('noticeAddRegister', '실패했습니다.');
			} else {
				console.log('Success');
				//console.log(obj);
				io.emit('noticeAddRegister', req.param('country') +  '성공했습니다.'	);
				
				io.emit('denyAddRegister', {
					user 		: req.param('user'),
					name 		: req.param('name'),
					email 		: req.param('email'),
					country 	: req.param('country'),
					team 		: req.param('team'),
					schoolNme	: req.param('schoolNme'),
					mobile		: req.param('mobile'),
					number		: 1 // 회차 
				});
			
				res.redirect('/registerList');
			}
			
		});

	});

	
	
	app.get('/registerList', function(req, res) {
	       if (req.session.user == null){
	    	// if user is not logged-in redirect back to login page //
		        res.redirect('/');
		    }   else{		    

				RM.getAllRecords(function(e, obj){
					res.render('register_list', {
						title: '신청리스트',
					//	countries : CT,
						list : obj,
						udata : req.session.user
					});
				
			    });								
		    }
			
		});
	
	app.get('/admin', function(req, res){
		res.sendfile('./app/server/views/admin.html', {
				udata : req.session.user
			});
	})
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

	

	
};