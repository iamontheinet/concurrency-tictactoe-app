'use strict';

var aerospikeCluster  = '192.168.199.214';
var aerospikeClusterPort = 3000;

exports.aerospikeConfig = function()	{
	return	{
		hosts: [ { addr: aerospikeCluster, port: aerospikeClusterPort } ]
	};
};

exports.aerospikeDBParams = function()	{
  return {
    dbName: 'test',
    usersTable: 'users',
    gamesTable: 'games'
  };	
};
