'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
		console.log('*** client/profile/index.js');
    res.render('../client/profile/profile');
});

module.exports = router;