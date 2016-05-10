'use strict';

var async = require('async');
var asConfig = require('./aerospike_config');
var aerospikeConfig = asConfig.aerospikeConfig();
var aerospikeDBParams = asConfig.aerospikeDBParams();
var aerospike = require('aerospike');

// Connect to the cluster
var client = aerospike.client(aerospikeConfig);
client.connect(function (response) {
  if ( response.code === 0) {
    // handle success
    console.log("\nConnection to Aerospike cluster succeeded!\n");
  }
  else {
    // handle failure
    console.log("\nConnection to Aerospike cluster failed!\n");
    console.log(response);
  }
});

function incrementAPIUsageCounter(username, apiMethod, apiKey, apiParams) {
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,username);
  var operator = aerospike.operator;
  var operations = [operator.incr('apicounter', 1),operator.read('apicounter')];
  client.operate(key, operations, function(err, bins, metadata, key) {
      // Check for errors
      if ( err.code === aerospike.status.AEROSPIKE_OK ) {
        // handle success
        // console.error('incrementAPIUsageCounter success: ', bins);

        //Log API usage for admin/reporting purposes
        key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usageTable,username+":usage:"+bins.apicounter);
        client.put(key, {api: apiMethod, key: apiKey, params: apiParams}, function(err, rec, meta) {
          // Check for errors
          if ( err.code === aerospike.status.AEROSPIKE_OK ) {
            // console.error('Log API usage success');
          }
          else {
            // An error occurred
            console.error('Log API usage error: ', err);
          }
        });
      }
      else {
        // handle failure
        console.error('incrementAPIUsageCounter error: ', err);
      }
  });
}

function test() {
  var key = aerospike.key("test", "test", "test");
  var record = {hello: "world"};
  client.put(key, record, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully created
      console.error('test record created!');
    }
    else {
      // An error occurred
      console.error('addObject error:', err);
    }
  });
}

// APP APIs ////////////////////////////////

exports.checkUsername = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,params.username);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully read.
      console.log(rec);
      res.json({status : 'Ok', uid : rec.uid, auth: rec.auth});
    }
    else {
      // An error occurred
      console.error('checkUsername error: ', err);
      res.json({status: 'Invalid Username'});
    }
  });
};

exports.checkPassword = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,params.uid);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK && rec.password === params.password) {
      // The record was successfully read.
      console.log(rec, meta);
      res.json({status : 'Ok', auth: rec.auth});
    }
    else {
      // An error occurred
      console.error('checkPassword error: ', err);
      res.json({status: 'Invalid Password'});
    }
  });
};

exports.createUser = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,params.uid);
  var userRecord = {uid: params.uid, username: params.username, password: params.password, auth: params.auth};
  client.put(key, userRecord, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully created.
      // console.log(rec, meta);
      res.json({status : 'Ok'});
    }
    else {
      // An error occurred
      console.error('createUser error: ', err);
      res.json({status: err});
    }
  });
};

exports.createGame = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.gamesTable,params.gameKey);
  var userRecord = {gameKey: params.gameKey, initiated: params.initiated, opponent: params.opponent, status: "PENDING", turn: params.opponent, winner: "", TopLeft: "", TopMiddle: "", TopRight: "", MiddleLeft: "", MiddleMiddle: "", MiddleRight: "", BottomLeft: "", BottomMiddle: "", BottomRight: ""};
  client.put(key, userRecord, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully created.
      // console.log(rec);
      res.json({status : 'Ok'});
    }
    else {
      // An error occurred
      console.error('createGame error: ', err);
      res.json({status: err});
    }
  });
};

exports.retrieveGame = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.gamesTable,params.key);
  // console.log(key);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK) {
      // The record was successfully read.
      console.log(rec);
      if (rec.initiated === params.username || rec.opponent === params.username)  {
        res.json({status : 'Ok', game: rec});
      } else  {
        res.json({status : 'Invalid Game key!'});
      }
    }
    else {
      // An error occurred
      console.error('retrieveGame error: ', err);
      res.json({status: 'Invalid Game key!'});
    }
  });
};

exports.acceptGame = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.gamesTable,params.key);
  // console.log(key);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK) {
      // The record was successfully read.
      // console.log(rec);
      var operator = aerospike.operator;
      var operations = [operator.write('status', 'IN_PROGRESS'),operator.read('status')];
      client.operate(key, operations, function(err, bins, metadata, key) {
        if ( err.code === aerospike.status.AEROSPIKE_OK) {
          res.json({status : 'Ok', gamestatus: bins.status});
        } else  {
          res.json({status: err});
        }
      });
    }
    else {
      // An error occurred
      console.error('retrieveGame error: ', err);
      res.json({status: 'Invalid Game key!'});
    }
  });
};

exports.updateGameViaUDF = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var file = './lib/udf/updateGame.lua';

  client.udfRegister(file, function(err) {
    // console.log(err);
    if ( err.code === aerospike.status.AEROSPIKE_OK) {
      var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.gamesTable,params.key);  
      var udf = { module:'updateGame', funcname: 'update', args: [params.username, params.square]};
      client.execute(key, udf, function(err, result) {
        if ( err.code === aerospike.status.AEROSPIKE_OK) {
          console.log(result);
          if (result.status == 0) {
            res.json({status : 'Ok'});
          } else  {
            res.json({status: result.message});
          }
        } else  {
          res.json({status: err});
        }
      });
    } else  {
      res.json({status: err});
    }
  });
};
