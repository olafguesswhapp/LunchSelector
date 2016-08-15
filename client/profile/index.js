'use strict';

var express = require('express');
var router = express.Router();
var Suppliers = require('../../models/suppliers');
var LSUsers = require('../../models/lsusers');
var authentication = require('../../lib/authentication');
var moment = require('moment');

router.get('/', authentication.isLoggedIn, function (req, res) {
		console.log('*** client/profile/index.js');
		var preferredSuppliers;
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
});

router.post('/supplier', authentication.isLoggedIn, function(req, res){
	console.log('*** client/profile/index.js route POST - /profile/supplier -');
	var supplierDoesDeliver;
	var whoDelivers;
	if (req.body.hasOwnProperty('signupRestaurantDoesDeliver')){ supplierDoesDeliver = true} else {supplierDoesDeliver = false};
	if (req.body.signupRestaurantDelivery === 'Andere') {
		if (req.body.signupRestaurantOtherDelivery) {whoDelivers = req.body.signupRestaurantOtherDelivery} else (whoDelivers = 'Andere')
	} else {whoDelivers = req.body.signupRestaurantDelivery}
	var newSupplierData = new Suppliers ({
		supplierName: req.body.signupRestaurantName,
		supplierDescription: req.body.signupRestaurantType,
		supplierType: req.body.signupRestaurantType,
		supplierStart: req.body.signupRestaurantStart,
		supplierEnd: req.body.signupRestaurantEnd,
		supplierStreet: req.body.signupRestaurantStreet,
		supplierZipCode: req.body.signupRestaurantPLZ,
		supplierCity: req.body.signupRestaurantCity,
		supplierDoesDeliver: supplierDoesDeliver,
		supplierDeliversWith: whoDelivers,
		suppplierCreated: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
	});
	newSupplierData.save(function(err, newSupplier) {
		if(err){
			console.log('something went wrong');
			console.log(err);
			res.redirect(303, '/profile');
		} else {
			var newRole;
			if (req.user.role === 'user') {newRole = 'supplier'} else {newRole = req.user.role}
			req.user.supplier.push(newSupplier._id);
			LSUsers.findByIdAndUpdate( req.user._id,
						{$set: {'supplier': req.user.supplier, 'role': newRole }},
						{safe: true, upsert: true, new : true}, function(err, user) {
				console.log(user);
				res.redirect(303, '/profile');
			});
		}
	});
});

module.exports = router;