'use strict';

var Protocols = require('../models/protocols');


function recLog(userId, type){
	console.log('lib/logservice');
	var newLog = new Protocols ({
		date: new Date(),
		user: userId,
		type: type
	});
	newLog.save(function (err) {
	  if (err) console.log('Could not save Protocol')
	})
};

exports.recLog = recLog;
