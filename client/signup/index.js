'use strict';

// /signup
// =======

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
		console.log('*** client/signup/index.js');
    res.render('../client/signup/signup');
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
		var respData = req.body;
		console.log(respData);
		if (respData.signupIsRestaurant && respData.signupHasLunch) {
			res.redirect(303, '/supply');	
		} else {
			res.redirect(303, '/offers');
		}
});

module.exports = router;