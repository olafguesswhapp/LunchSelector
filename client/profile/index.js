'use strict';

var express = require('express');
var router = express.Router();
var Suppliers = require('../../models/suppliers');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedIn, function (req, res) {
		console.log('*** client/profile/index.js');
		var preferredSuppliers;
		Suppliers.find({_id: { $in: req.user.preferredSuppliers }}, function(err, suppliers){
			if (err || suppliers.length === 0){
				console.log('No suppliers found');
			} else {
				preferredSuppliers = suppliers.map(function(supplier){return supplier.supplierName})
			}
			var context = {
			username: req.user.username,
			name: req.user.name,
			role: req.user.role,
			selectedCity: req.user.selectedCity,
			preferredSuppliers: preferredSuppliers
		};
		console.log(context);
    res.render('../client/profile/profile', context);
		});
});

router.get('/logout', function(req, res){
	console.log('*** client/profile/index.js route - /logout -');
	req.logout();
	res.redirect('/');
})

module.exports = router;