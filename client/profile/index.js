'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
		console.log('*** client/profile/index.js');
		console.log(req.user);
		var context = {
			username: req.user.username,
			name: req.user.name,
			role: req.user.role,
			selectedCity: req.user.selectedCity
		};
    res.render('../client/profile/profile', context);
});

router.get('/logout', function(req, res){
	console.log('*** client/profile/index.js route - /logout -');
	req.logout();
	res.redirect('/');
})

module.exports = router;