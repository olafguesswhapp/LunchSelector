'use strict';

var express = require('express');
var router = express.Router();
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedInAsSupplier, function (req, res) {
		console.log('*** client/supply/index.js');
    res.render('../client/supply/supply');
});
router.post('/request', authentication.isLoggedIn, function (req, res) {
		console.log('*** client/supply/index.js route - supply/request - ');
		console.log(req.body);
    res.json('Danke für die Anfrage.')
});
router.post('/request2', authentication.isLoggedIn, function (req, res) {
		console.log('*** client/supply/index.js route - supply/request2 - ');
		console.log(req.body);
    res.json('Danke für die Anfrage2.')
});

module.exports = router;