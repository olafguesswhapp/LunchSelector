'use strict';

// /signup
// =======

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var moment = require('moment');

router.get('/', function (req, res) {
		console.log('*** client/signup/index.js route - signup/ - ');
    res.render('../client/signup/signup', {layout: 'landingpage'});
});

router.post('/verify', function (req, res) {
		console.log('*** client/signup/index.js route - signup/verify - ');
		console.log(req.body);
		var respData = req.body;
		if (respData.signupEmail === 'olaf.peters@mediacom.de') { // HIER MUSS EIGENTLICH DB PRÜFUNG HIN OB EMAIL SCHON VORHANDEN, ETC.
			res.status(409).json(); 
		} else {
			res.json();
		}
});

router.post('/', function (req, res) {
		console.log('*** client/signup/index.js route - signup/ POST after submit -');
		var newUserRole;
		if (req.body.signupIsRestaurant && req.body.signupHasLunch) {newUserRole = 'supplier'} else {newUserRole = 'user'};
		var newUserData = new LSUsers ({
			username: req.body.signupEmail,
			password: req.body.signupPassword,
			name: req.body.signupName,
			role: newUserRole,
			created: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
			gender: 0,
			age: 0,
			selectedCity: req.body.signupCity
		});
		newUserData.save(function(err, newUser){
			if(err) {
				res.redirect(303, '/signup');
			} else {
				if (req.body.signupIsRestaurant && req.body.signupHasLunch) {
					res.redirect(303, '/supply');	
				} else {
					res.redirect(303, '/offers');
				}
			}
		});
});

module.exports = router;