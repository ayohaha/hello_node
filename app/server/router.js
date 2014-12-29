
var TL = require('./modules/team-list');
var AM = require('./modules/account-manager');
var RM = require('./modules/register-manager');
var EM = require('./modules/email-dispatcher');
var EH = require('./modules/examhall-list');

module.exports = function(app, io) {

	app.get('/', function(req, res){
		
		if (req.cookies.user == undefined){
			res.render('login', { title: 'Hello - Please Login To Your Account' });
		}	else{
			
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
					req.session.user = o;
					if(o.is_admin == 'Y'){
						res.redirect('/adminRegister');
					} else {
						res.redirect('/waiting');
					}
				} else {
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
				res.cookie('user', o.user, { maxAge: 900000 });
				res.send(o.is_admin, 200);
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
				teams : TL,
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
				mobile		: req.param('mobile'),
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
		res.render('signup', {  title: 'Signup', teams : TL });
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			mobile  : req.param('mobile'),
			team	: req.param('team')
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
			res.redirect('/');
		}   else{
			//@todo 출석고사 가능한지 체크
			
			RM.isAllowRegister(function(obj){
				if(obj.isAllowRegister === true) {
					
					var gosa = obj.info;
					
					RM.getAllExamHall(obj.info.number, function(e, obj){
						res.render('register_form', {
							title: '출석고사를 신청합니다.',
							examhall : obj,
							udata : req.session.user,
							gosa : gosa
						});
					
					});
					
				} else {
					res.redirect('/waiting');
				}
			});

		}
		
	});
		
	app.get('/waiting', function(req, res) {

		   if (req.session.user == null){
					res.redirect('/');
				}   else{
						RM.isAllowRegister(function(obj){
							var info = obj.info;
							if(obj.isAllowRegister === true) {
								var data = {
									user : req.session.user.name,
									number : info.number
								};
								RM.checkRegister(data, function(r){
									if( r == 'Y'){
										res.redirect('/registerList/'+info.number);
									} else{
										res.redirect('/register');
									}
								});
									
							} else {
								res.render('waiting', {
									title: 'waiting',
								});
							}
						});
				}
	});
	
	app.post('/proxyRegister', function(req, res){
		//1. user 조회 하여 이름, 이메일, 팀, 전화번호를 조회
		AM.getUserRecord(req.param('user'), function(e, obj){
			if(e || obj ==undefined) {
				console.log('INVALID USER');
				res.json({ 'success': false });
			} else {
				//2. addNewRegister
				var register = {
					user 		: req.param('user'),
					name 		: obj.name,
					email 		: obj.email,
					country 	: req.param('country'),
					team 		: obj.team,
					mobile		: obj.mobile,
					number		: req.param('number') // 회차 
				};

			
				RM.addNewRegister(register, function(e, obj){
					console.log('=====================DONE============');
					if (e || obj == undefined){
						console.log('Fail::' + e);
						io.emit('noticeAddRegister', '실패했습니다.');
						res.json({ 'success': false });
					} else {
						console.log('Success');
						//console.log(obj);
						io.emit('noticeAddRegister', req.param('country') +  '성공했습니다.'	);
						io.emit('denyAddRegister', register);

						RM.updateCountryAbleYn({country:req.param('country'),  ableYn: 'N'}
								, function(e){
									console.log(e);
									res.json({ 'success': true });
						});
						

					}
					
				});
			}
		});
		
		
		
		
	});
	
	app.post('/register', function(req, res){
		RM.addNewRegister({
			user 		: req.param('user'),
			name 		: req.param('name'),
			email 		: req.param('email'),
			country 	: req.param('country'),
			team 		: req.param('team'),
			mobile		: req.param('mobile'),
			number		: req.param('number') // 회차 
		}, function(e, obj){
			console.log('=====================DONE============');
			if (e || obj == undefined){
				console.log('Fail::' + e);
				io.emit('noticeAddRegister', '실패했습니다.');
				res.json({ 'success': false });
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
					number		: req.param('number') // 회차 
				});

				RM.updateCountryAbleYn({country:req.param('country'),  ableYn: 'N'}
						, function(e){
							console.log(e);
							res.json({ 'success': true });
				});
				

			}
			
		});

	});

	
	
	app.get('/registerList/:number', function(req, res) {
		var number = req.param('number'),
			isAllowUpdate = '';
		
		
		if (req.session.user == null){
		// if user is not logged-in redirect back to login page //
			res.redirect('/');
		} else{			
			RM.getGosaInfoStatus(number, function(status){
				isAllowUpdate = status.isAllowUpdate;
				RM.getAllRecords(number, function(e, obj){
					res.render('register_list', {
						title: '신청리스트',
						list : obj,
						isAllowUpdate: isAllowUpdate,
						udata : req.session.user
					});
				
				});			
			});
			

		}
	});
	
	app.get('/examhallList/:number', function(req, res) {
		RM.getAllExamHall(req.param('number'), function(e, obj){
			res.json({ examhall : obj });
		});
	});
	
	app.post('/registerCancel', function(req, res){
		if (req.session.user == null){
			// if user is not logged-in redirect back to login page //
			res.json({ 'success': false });
			}else{			

				RM.deleteRegister({
					user 		: req.param('user'),
					country 	: req.param('country'),
					number		: req.param('number') // 회차 
				}, function(e, obj){
					if (e || obj == undefined){
						res.json({ 'success': false });
					} else {
						if (obj >= 1) {
							RM.updateCountryAbleYn({country:req.param('country'),  ableYn: 'Y'}
							, function(e, obj){
								
								io.emit('ActiveAddRegister', {
									country 	: req.param('country')
								});
								
								res.json({ 'success': true });
							});
							
						} else {
							res.json({ 'success': false });
						}

					}
				});
			}
	});
	
	app.post('/gosaRegister', function(req, res){
		if (req.session.user == null) {
			res.json({ 'success': false });
		} else {
			RM.gosaRegister({
				number 		: req.param('number'),
				startDate	: req.param('startDate'),
				examDate 	: req.param('examDate'),
				status		: req.param('status')
			}, function(e, obj){
				if (e || obj == undefined){
					res.json({ 'success': false });
				} else {
					res.json({ 'success': true });
				}

			});
		}
	});
	
	
	app.post('/examhallRegister', function(req, res){
		if (req.session.user == null) {
			res.json({ 'success': false });
		} else {
			RM.examhallRegister({
					number 		: req.param('number'),
					country  	: req.param('country')
				}, function(e, obj){
				if (e || obj == undefined){
					res.json({ 'success': false });
				} else {
					res.json({ 'success': true });
				}

			});
		}
	});
	
	app.post('/gosaUpdate', function(req, res){
		if (req.session.user == null) {
			res.json({ 'success': false });
		} else {
			RM.gosaUpdateStatus({
				number 		: req.param('number'),
				status		: req.param('status')
			}, function(callback){
				if (callback != 'update success'){
					res.json({ 'success': false });
				} else {
					res.json({ 'success': true });
					if (req.param('status') == 'Active') {
						var _result = '/register';
					} else {
						var _result = '/registerList/'+req.param('number');
					}
					io.emit('redirectPage', {
						page 	: _result
					});
				}

			});
		}
	});	
	
	app.post('/gosaDelete', function(req, res){
		if (req.session.user == null) {
			res.json({ 'success': false });
		} else {
			RM.gosaDelete({
				number 		: req.param('number')
			}, function(e, obj){
				if (e || obj == undefined){
					res.json({ 'success': false});
				} else {
					res.json({ 'success': true });
				}

			});
		}
	});
	
	app.get('/adminRegister', function(req, res){
		   if (req.session.user == null){
				// if user is not logged-in redirect back to login page //
					res.redirect('/');
				}   else{
					RM.getAllGosaRecords(function(e, obj){
						res.render('admin_register', {
							title: '신청리스트',
						//	countries : TL,
							list : obj,
							udata : req.session.user
						});
					
					});	
				}
				
			});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

	
}