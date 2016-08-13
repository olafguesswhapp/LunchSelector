'use strict';

// /signup
// =======

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var moment = require('moment');

router.get('/', function (req, res) {
		console.log('*** client/signup/index.js route - signup/ - ');
    res.render('../client/signup/signup', {layout: 'landingpage'});
});

router.post('/verify', function (req, res) {
	console.log('*** client/signup/index.js route - signup/verify - ');
	console.log(req.body);
	LSUsers.findOne({'username' : req.body.signupEmail})
				.select('username')
				.exec(function(err, user){
		if (!user) {
			console.log('No user with this username/email could be verified');
			res.json();
		} else {
			console.log('user with this username/email could be verified');
			res.status(409).json();
		}
	});
});

router.post('/', function (req, res) {
		console.log('*** client/signup/index.js route - signup/ POST after submit -');
		req.logout();
		var newUserRole;
		if (req.body.signupIsRestaurant && req.body.signupHasLunch) {newUserRole = 'supplier'} else {newUserRole = 'user'};
		if (newUserRole === 'supplier') {
			var whoDelivers;
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
				supplierDoesDeliver: req.body.signupRestaurantDoesDeliver,
				supplierDeliversWith: whoDelivers,
				suppplierCreated: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
			});
			newSupplierData.save(function(err, newSupplier) {
				if(err){
					console.log('something went wrong');
					console.log(err);
					res.redirect(303, '/supply');	
				} else {
					console.log('this is the new supplier');
					console.log(newSupplier);
					var newUserData = new LSUsers ({
						username: req.body.signupEmail,
						password: req.body.signupPassword,
						name: req.body.signupName,
						role: newUserRole,
						created: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
						gender: 0,
						age: 0,
						selectedCity: req.body.signupCity,
						supplier: newSupplier._id
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
				}
			});
		}
});

module.exports = router;