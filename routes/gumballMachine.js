var mongoDb = require('./mongoModule');
var crypto = require('crypto');

var secretKey = "69F5748D867R2635C2FB44F27SH8H";
var machineSerialNum = "1234998871109";
var db = null, gumball = null;

var dbDetails = {
    "host": "extracredit:extracredit@ds043350.mongolab.com",
    "port": 43350,
    "databaseName": "cmpe281-yash"
};


getGumball = function(callback) {

	mongoDb.connector(dbDetails.host, dbDetails.port, dbDetails.databaseName, function(err, db) {
		if (err)
			throw err;

		db.collection('gumball').find({
			"serial_number" : machineSerialNum
		}, function(err, docs) {
			if (err)
				throw err;

			docs.each(function(err, doc) {
				if (err)
					throw err;

				if (doc == null) {
					console.log("Connection closed");
					db.close();
				} else {
					callback(doc);
				}
			});
		});
	});
};

exports.show = function(req, res) {
	console.log("inside show");
	getGumball(function(gumball) {
		var data = null;
		if (gumball) {
			data = createSuccessMessage("NoCoinState", gumball.model_number,
					gumball.serial_number, "Gumball Machine Found");
		} else {
			data = createFailureMessage("Gumball Machine Not Found");
		}
		res.send(data);
	});
};

exports.insertQuarter = function(req, res) {
	var reqData = req.body;
	var str = reqData.state + "|" + reqData.model + "|" + reqData.serial + "|"
			+ secretKey;
	var shasum = crypto.createHash('sha256');
	shasum.update(str);
	var hash = shasum.digest("hex");

	var data = null;
	if (hash == reqData.hash) {
		data = createSuccessMessage("HasCoinState", reqData.model,
				reqData.serial, " Quarter inserted !!");
	} else {
		data = createFailureMessage("INVALID OPERATION -> INSERT QUARTER !!");
	}
	res.send(data);
};

exports.turnCrank = function(req,res){
	var reqData = req.body;
	var hash = createHash(reqData);
	getGumball(function(gumball){
		console.log("gumball - >" + gumball);
		if(gumball && hash == reqData.hash && reqData.state == "HasCoinState"){
			console.log("-> "+ gumball.count_gumball);
			if(gumball.count_gumball > 0){
				updateDatabase(gumball);
				data = createSuccessMessage("NoCoinState",
		        		  gumball.model_number, gumball.serial_number,
							"GUMBALL EJECTED !!!");
			}else{
				data = createFailureMessage("MACHINE OUT OF GUMBALLS !!");
			}
			
		}else{
			data = createFailureMessage("INVALID OPERATION -> TURN CRANK !!");
		}
		res.send(data);
	});
}



updateDatabase = function(gumball){
		if (gumball.count_gumball > 0) {
			mongoDb
					.connector(dbDetails.host, dbDetails.port, dbDetails.databaseName, function(err, db) {
				if (err) throw err;
				db.collection('gumball').findAndModify( {"serial_number" : machineSerialNum}, 
						[['_id','asc']],
						{$set: {"count_gumball" : gumball.count_gumball-1,"version" : gumball.version+1}},
				  {}, // options
				  function(err, gumballNewObject) {
				      if (err){
				          console.warn(err.message);  // returns error if no matching object found
				          data = createFailureMessage("Error");
				         
				      }else{
				          console.dir(" ***** "+ gumballNewObject);
				          
				      }
				  });
				});
	}
}


createHash = function(reqData){
	var str = reqData.state + "|" + reqData.model + "|" + reqData.serial + "|"
			+ secretKey;
	var shasum = crypto.createHash('sha256');
	shasum.update(str);
	var hash = shasum.digest("hex");
	return hash;
}


createSuccessMessage = function(state, model, serial, msg) {
	var str = state + "|" + model + "|" + serial + "|" + secretKey;
	var shasum = crypto.createHash('sha256');
	shasum.update(str);
	var hash = shasum.digest("hex");
	var data = {
		"state" : state,
		"model" : model,
		"serial" : serial,
		"hash" : hash,
		"status" : "success",
		"message" : msg
	};
	return data;
};

createFailureMessage = function(msg) {
	var data = {
		"status" : "error",
		"message" : msg
	};
	return data;
};

