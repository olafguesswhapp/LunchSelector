'use strict';

var express = require('express');
var router = express.Router();

router.get('/datenschutz', renderDataProtection);
router.get('/impressum', renderImprint);

module.exports = router;

function renderDataProtection(req, res) {
	console.log('*** index.js route - legal/datenschtz - ');
	var layout = defineLayout(req.user);
  res.render('../client/legal/dataprotection', {layout: layout});
};

function renderImprint(req, res){
	console.log('*** index.js route - legal/impressum - ');
	var layout = defineLayout(req.user);
  res.render('../client/legal/imprint', {layout: layout});
};

function defineLayout (user){
	if (user) {
		return 'main';
	} else {
		return 'landingpage';
	}
};