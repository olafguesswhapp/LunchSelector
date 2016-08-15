'use strict';

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var Offers = require('../../models/offers');
var Cities = require('../../models/cities');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedIn, function (req, res) {
		console.log('*** client/offfers/index.js route - offers/ - ');
		var today = new Date(new Date().setUTCHours(0,0,0,0));
		var helpArray = [];
		Offers.find({ offerCategory: 1 , offerSupplier: { $in: req.user.preferredSuppliers }, offerDate: today})
					.select('offerDate offerName offerPrice  offerSortIndex offerSupplier')
					.exec(function(err, currentOffers){
			console.log(currentOffers);
			if (err ) {
				console.log('Preferred Suppliers do not have any offers'); // FLASH MESSAGE you have not yet selected a preferred supplier
				res.redirect('/offers/select');
			} else {
				Suppliers.find({ _id : { $in: req.user.preferredSuppliers }})
						.exec(function(err, supplier){
					if (err || supplier.length === 0) {
						console.log('User has no preferredSupplier'); // Direct to supplier Selectio or MESSAGE
						res.redirect('/offers/select');
					} else {
						var supplierOffers = {
							userName: req.user.username, // CHANGE from JWT
							selectedCity: req.user.selectedCity, // CHANGE from POST request
							suppliers: []
						};
						supplierOffers.suppliers = supplier.map(function(supplierElement){
							helpArray.push(supplierElement.supplierCity);
							return {
								supplierId: 					supplierElement._id,
								supplierName: 				supplierElement.supplierName,
								supplierDescription: 	supplierElement.supplierDescription,
								supplierType: 				supplierElement.supplierType,
								supplierStart: 				supplierElement.supplierStart,
								supplierEnd: 					supplierElement.supplierEnd,
								supplierStreet: 			supplierElement.supplierStreet,
								supplierZipCode: 			supplierElement.supplierZipCode,
								supplierCity: 				supplierElement.supplierCity,
								offers: 							currentOffers.filter(function(offerElement){
									return (JSON.stringify(offerElement.offerSupplier) === JSON.stringify(supplierElement._id))
								})
							}
						});
						supplierOffers.availableCities = helpArray.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
		    		res.render('../client/offers/offers', supplierOffers);
					}
				});
			}
		});
});

router.post('/select/append', authentication.isLoggedIn, function(req, res) {
	console.log('*** client/offfers/index.js route - offers/select/append - ');
	console.log(req.body);
	LSUsers.findByIdAndUpdate( req.user._id,
			    {$push: {'preferredSuppliers': req.body.supplierId }},
			    {safe: true, upsert: true, new : true}, function(err, user) {
    if (err || user.length === 0) {
    	console.log('Could not be appended');
    	res.status(404).json(); 
    } else {
    	res.json();
    }
  });
});

router.post('/remove', authentication.isLoggedIn, function(req, res) {
	console.log('*** client/offfers/index.js route - offers/remove - ');
	var adjustedPreferredSuppliers = req.user.preferredSuppliers.filter(function(supplier){
		return (JSON.stringify(supplier) !== JSON.stringify(req.body.supplierId));
	});
	req.user.preferredSuppliers = adjustedPreferredSuppliers;
	LSUsers.findByIdAndUpdate( req.user._id,
			    {$set: {'preferredSuppliers': adjustedPreferredSuppliers }},
			    {safe: true, upsert: true, new : true}, function(err, user) {
    if (err || user.length === 0) {
    	console.log('adjustedPreferredSuppliers could not be modified');
    	res.status(404).json(); 
    } else {
    	console.log(user);
    	res.json();
    }
  });
});

router.get('/select', authentication.isLoggedIn, function (req, res) {
	console.log('*** client/offfers/index.js route - offers/select - ');
	var helpArray = [];
	var selectedCity = req.user.selectedCity;
	var availableCities;
	var supplierHelp;
	if (req.query.selectedCity){
		selectedCity = req.query.selectedCity;
		LSUsers.findOneAndUpdate({_id: req.user._id}, { $set: { selectedCity: req.query.selectedCity }}, {new: true}, function(err, user){
    	if(err){ console.log("Something wrong when updating data!");} else {
    		console.log(user);
				console.log('Changed selectedCity to ' + req.user.selectedCity);
    	}
    });
	}
	Cities.find({cityStatus: true}, function(err, cities){
		if (err || cities === null ){
			console.log('No cities with status = true');
			availableCities = ['no City'];
		} else {
			availableCities = cities.map(function(city){return city.cityName});
		}
	});
	Suppliers.find({ supplierCity: selectedCity, _id: { $nin: req.user.preferredSuppliers }})
					.exec(function(err, supplier){
		if (err || supplier.length === 0) {
			console.log('Currently no suppliers available to choose from');
		} else {
			supplierHelp = supplier;
		}
		var supplierSelection = {
			userName: req.user.username, // CHANGE from JWT
			selectedCity: selectedCity, // CHANGE from POST request
			availableCities: availableCities,
			suppliers: supplierHelp
		};
		console.log(supplierSelection);
	  res.render('../client/offers/select', supplierSelection);
	});
});

module.exports = router;