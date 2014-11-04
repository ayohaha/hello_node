
var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;
var moment 		= require('moment');

var dbPort 		= 27017;
var dbHost 		= 'localhost';
var dbName 		= 'node-login';



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
var examhall     = db.collection('examhall');



// 해당 출석고사 회차 신청지역정보 가져오기 
exports.getAllExamHall = function(callback)
{
	examhall.find().toArray(
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

// 고사 정보 가져오기 
exports.getAllGosaRecords = function(callback)
{
	gosainfo.find().toArray(
		function(e, res) {
			if(e) callback(e)
			else callback(null, res)
		}	
	);
}


// 신청한 지역 상태 변경 
exports.updateCountryAbleYn = function(data, callback)
{	
	examhall.update({country:data.country}, {$set:{ableYn:data.ableYn}}, function(err) {
		if (err) callback(err);
		else callback(null);
	});

}


//시험 신청 Data중 Active 최근 1건 가져오기 
//신청 가능 시간과 현제시간 비교하기
//진행중 : 'true', 대기 : 'false'
exports.isAllowRegister = function(callback){
	gosainfo.findOne({status:'Active'}, function(e,o){
		if(o == null) {
			callback({isAllowRegister:false});
		} else {

			if ( parseInt(o.startDate,10) < parseInt(moment().format('YYYYMMDDHHmmss'),10)  ) {
				callback({isAllowRegister:true,
					info:o});
			} else {
				callback({isAllowRegister:false,
					info:o});
			}
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


//출석고사 정보 등록 
exports.gosaRegister = function(gosaData, callback)
{
	gosainfo.findOne({number:gosaData.number}, function(e, o) {
		if (o){
			callback('already gosa');
		}	else{
			gosainfo.insert(gosaData, {safe: true}, callback);		
		}
	});
};

//출석고사 정보 삭제 
exports.gosaDelete = function(gosaData, callback)
{
	gosainfo.remove({number: gosaData.number}, function(err, numberOfRemovedDocs) {
		callback(err, numberOfRemovedDocs);
	});
};

//출석고사 정보 상태 변경  
exports.gosaUpdateStatus = function(gosaData, callback)
{	
	gosainfo.update({number:gosaData.number}, {$set:{status:gosaData.status}}, function(err) {
		if (err) callback(err);
		else callback('update success');
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


//취소하기 
exports.deleteRegister = function(RegisterData, callback)
{
	console.log(RegisterData);
	register.remove({user: RegisterData.user, number: RegisterData.number, country:RegisterData.country}, function(err, numberOfRemovedDocs) {
		callback(err, numberOfRemovedDocs);
	});
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
