'use strict';

// /signup
// =======

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var Cities = require('../../models/cities');
var moment = require('moment');

router.get('/', displaySignUp);
router.post('/', processSignUp);
router.post('/verify', verifiyEmail);

module.exports = router;

function displaySignUp(req, res) {
	console.log('*** client/signup/index.js route - signup/ - ');
	Cities.find().exec(function(err, city){
		var context;
		if (err){console.log('Something went wrong');} else {
			context = {
				availableCities : city.map(function(cityElement){ return cityElement.cityName })
			};
		}
		res.render('../client/signup/signup', {layout: 'landingpage', locals: context});
	});
};

function verifiyEmail(req, res) {
	console.log('*** client/signup/index.js route - signup/verify - ');
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
};

function processSignUp(req, res) {
	console.log('*** client/signup/index.js route - signup/ POST after submit -');
	req.logout();
	var newUserRole;
	if (req.body.signupIsRestaurant && req.body.signupHasLunch) {newUserRole = 'supplier'} else {newUserRole = 'user'};
	if (newUserRole === 'supplier') {
		var whoDelivers;
		var supplierDoesDeliver;
		if (req.body.hasOwnProperty('signupRestaurantDoesDeliver')){ supplierDoesDeliver = true} else {supplierDoesDeliver = false};
		if (req.body.signupRestaurantDelivery === 'Andere') {
			if (req.body.signupRestaurantOtherDelivery) {whoDelivers = req.body.signupRestaurantOtherDelivery} else {whoDelivers = 'Andere'}
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
			supplierSite: req.body.signupRestaurantSite,
			supplierEmail: req.body.signupRestaurantEmail,
			supplierPhone: req.body.signupRestaurantPhone,
			supplierDoesDeliver: supplierDoesDeliver,
			supplierDeliversWith: whoDelivers,
			suppplierCreated: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
		});
		newSupplierData.save(function(err, newSupplier) {
			if(err){
				console.log('something went wrong');
				console.log(err);
				res.redirect(303, '/supply');	
			} else {
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
	} else {
		var newUserData = new LSUsers ({
			username: req.body.signupEmail,
			password: req.body.signupPassword,
			name: req.body.signupName,
			role: newUserRole,
			created: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
			gender: 0,
			age: 0,
			selectedCity: req.body.signupCity,
			supplier: []
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
};