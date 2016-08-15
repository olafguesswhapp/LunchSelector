'use strict';

var express = require('express');
var router = express.Router();
var Suppliers = require('../../models/suppliers');
var authentication = require('../../lib/authentication');
var preferredSuppliers;
router.get('/', authentication.isLoggedIn, function (req, res) {
		console.log('*** client/profile/index.js');
		Suppliers.find({_id: { $in: req.user.preferredSuppliers }}, function(err, suppliers){
			if (err || suppliers.length === 0){
				console.log('No suppliers found');
			} else {
				preferredSuppliers = suppliers.map(function(supplier){return supplier.supplierName})
			}
		}).then(function(){
			Suppliers.find({ _id: { $in: req.user.supplier }})
							.select( 'supplierName')
							.exec(function(err, suppliers){
				if (err){
					console.log('This user is not in charge of any supplier');
				} else {
					var context = {
						username: req.user.username,
						name: req.user.name,
						role: req.user.role,
						selectedCity: req.user.selectedCity,
						preferredSuppliers: preferredSuppliers,
						supplier: suppliers.map(function(supplier){return supplier.supplierName})
					};
					console.log(context);
			    res.render('../client/profile/profile', context);
				}
			});
		});
});

router.get('/logout', function(req, res){
	console.log('*** client/profile/index.js route - /logout -');
	req.logout();
	res.redirect('/');
})

module.exports = router;