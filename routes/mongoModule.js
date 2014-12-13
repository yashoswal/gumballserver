/**
 * New node file
 */

var MongoClient = require('mongodb').MongoClient;

var dbConnection = null;

connector = function(host, port, db,callback) {
	var url = 'mongodb://' + host + ":" + port + "/" + db;
	MongoClient.connect(url, function(err, db) {
		dbConnection = db;
		callback(err,db);
	});
}

showAllDbs = function(callback){
	dbConnection.admin().listDatabases(function(err, dbs) {
		dbConnection.close();
		callback(err,dbs.databases);
	  });
}


exports.connector = connector;
exports.showAllDbs = showAllDbs;