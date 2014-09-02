
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

var dbPort 		= 27017;
var dbHost 		= 'localhost';
var dbName 		= 'node-login';

var EX = require('./exam-list');

/* establish the database connection */

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
	db.open(function(e, d){
	if (e) {
		console.log(e);
	}	else{
		console.log('connected to database :: ' + dbName);
	}
});
var register = db.collection('register');
var gosainfo     = db.collection('gosainfo');

//시험 신청 Data중 Active 최근 1건 가져오기 
//신청 가능 시간과 현제시간 비교하기
//진행중 : 'true', 대기 : 'false'
exports.isAllowRegister = function(callback){
	gosainfo.findOne({status:'Active'}, function(e,o){

		if (o.startDate < moment().format('YYYY-MM-DD hh:mm:ss')) {
			callback({isAllowRegister:true,
				      info:o});
		} else {
			//console.log( 'dddd' + moment().format('YYYY-MM-DD hh:mm:ss'));
			callback({isAllowRegister:false,
			      info:o});
		}	
	});
	
}

exports.insert = function(user, pass, callback)
{
	register.findOne({user:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

/* record insertion, update & deletion methods */

exports.addNewRegister = function(newData, callback)
{
	// 같은 회차에 동일 아이디로 신청한 이력이 있는가?
	register.findOne({user:newData.user, number:newData.number}, function(e, o) {
		if (o){
			callback('already user');
		}	else{
			
			register.findOne({country:newData.country,schoolName:newData.schoolName, number:newData.number}, function(e, o) {
				if (o){
					callback('already country');
				}	else{
					newData.date = moment().format('MMMM Do YYYY, h:mm:ss a');
					register.insert(newData, {safe: true}, callback);				}
			});
				

		}
	});
}



exports.updateAccount = function(newData, callback)
{
	register.findOne({user:newData.user}, function(e, o){
		o.name 		= newData.name;
		o.email 	= newData.email;
		o.country 	= newData.country;
		if (newData.pass == ''){
			register.save(o, {safe: true}, function(err) {
				if (err) callback(err);
				else callback(null, o);
			});
		}	else{
			saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				accounts.save(o, {safe: true}, function(err) {
					if (err) callback(err);
					else callback(null, o);
				});
			});
		}
	});
}


/* account lookup methods */

exports.deleteAccount = function(id, callback)
{
	register.remove({_id: getObjectId(id)}, callback);
}

exports.getAccountByEmail = function(email, callback)
{
	register.findOne({email:email}, function(e, o){ callback(o); });
}

exports.validateResetLink = function(email, passHash, callback)
{
	register.find({ $and: [{email:email, pass:passHash}] }, function(e, o){
		callback(o ? 'ok' : null);
	});
}

exports.getAllRecords = function(callback)
{
	register.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

exports.delAllRecords = function(callback)
{
	register.remove({}, callback); // reset accounts collection for testing //
}

/* private encryption & validation methods */

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < 10; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
}

var md5 = function(str) {
	return crypto.createHash('md5').update(str).digest('hex');
}

var saltAndHash = function(pass, callback)
{
	var salt = generateSalt();
	callback(salt + md5(pass + salt));
}

var validatePassword = function(plainPass, hashedPass, callback)
{
	var salt = hashedPass.substr(0, 10);
	var validHash = salt + md5(plainPass + salt);
	callback(null, hashedPass === validHash);
}

/* auxiliary methods */

var getObjectId = function(id)
{
	return register.db.bson_serializer.ObjectID.createFromHexString(id)
}

var findById = function(id, callback)
{
	register.findOne({_id: getObjectId(id)},
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


var findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	register.find( { $or : a } ).toArray(
		function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
