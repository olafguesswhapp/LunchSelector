'use strict';

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var Offers = require('../../models/offers');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedIn, function (req, res) {
		console.log('*** client/offfers/index.js route - offers/ - ');
		var today = new Date(new Date().setUTCHours(0,0,0,0));
		var helpArray = [];
		Offers.find({ offerSupplier: { $in: req.user.preferredSuppliers }, offerDate: today})
					.exec(function(err, currentOffers){
			if (err || currentOffers.length === 0) {
				console.log('Preferred Suppliers do not have any offers'); // ALARM create empty dishes?
			} else {
				Suppliers.find({ _id : { $in: req.user.preferredSuppliers }})
						.exec(function(err, supplier){
					if (err || supplier.length === 0) {
						console.log('User has no preferredSupplier'); // Direct to supplier Selectio or MESSAGE
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
	console.log(req.body);
	var indexToChange = useroffer.suppliers.findIndex(function(supplier) { return supplier.supplierId === req.body.supplierId})
	if (indexToChange > -1) {
		console.log('gefunden ' + indexToChange + ' ' + useroffer.suppliers[indexToChange].supplierName);
		useroffer.suppliers[indexToChange].preferredSupplier = false;
		res.json();
	} else {
		res.status(404).json(); 
	}
});

router.get('/select', authentication.isLoggedIn, function (req, res) {
	console.log('*** client/offfers/index.js route - offers/select - ');
	var helpArray = [];
	if (req.query.selectedCity){
		LSUsers.findOneAndUpdate({_id: req.user._id}, { $set: { selectedCity: req.query.selectedCity }}, {new: true}, function(err, doc){
    	if(err){ console.log("Something wrong when updating data!");} else {
    		console.log(doc);
    		req.user.selectedCity = req.query.selectedCity;
				console.log('Changed selectedCity to ' + req.user.selectedCity);
    	}
    });
	}
	var supplierHelp;
	Suppliers.find({ supplierCity: req.query.selectedCity, _id: { $nin: req.user.preferredSuppliers }})
					.exec(function(err, supplier){
		if (err || supplier.length === 0) {
			console.log('Currently no suppliers available to choose from');
		} else {
			supplierHelp = supplier;
		}
		var supplierSelection = {
			userName: req.user.username, // CHANGE from JWT
			selectedCity: req.user.selectedCity, // CHANGE from POST request
			availableCities: useroffer.availableCities,
			suppliers: supplierHelp
		};
		console.log(supplierSelection);
	  res.render('../client/offers/select', supplierSelection);
	});
});

module.exports = router;


const useroffer = {
	'userName': 'olafguesswhapp',
	'selectedCity':	'Düsseldorf',
	'availableCities': ['Düsseldorf', 'Köln'],
	'suppliers': [
	{	'supplierName':		'Restaurant AAA',
		'supplierId': '1',
		'preferredSupplier': true,
		'street':	'AAA Str. 111',
		'PLZ': 		'40211',
		'city': 	'Düsseldorf',
		'tefl': 	'+49123123111', 
		'site': 	'www.AAA.de',
		'email': 	'aaa.aaa.de',
		'timeOpen': '11:30',
		'timeClose': '14:00',
		'offers': [
			{'dish': 'Suppe AAA', 'price': 2.11 },
			{'dish': 'Salat AAA', 'price': 3.11 },
			{'dish': 'Nudeln AAA', 'price': 4.11 },
			{'dish': 'Steak AAA', 'price': 5.11 }] },
	{	'supplierName':		'Restaurant BBB',
		'supplierId': '2',
		'preferredSupplier': false,
		'street':	'BBB Str. 222',
		'PLZ': 		'40222',
		'city': 	'Düsseldorf',
		'tefl': 	'+49123123222', 
		'site': 	'www.bbb.de',
		'email': 	'bbb.bbb.de',
		'timeOpen': '12:00',
		'timeClose': '15:00',
		'offers': [
			{'dish': 'Suppe BBB', 'price': 2.22 },
			{'dish': 'Salat BBB', 'price': 3.22 },
			{'dish': 'Nudeln BBB', 'price': 4.22 },
			{'dish': 'Steak BBB', 'price': 5.22 }] },
	{	'supplierName':		'Restaurant CCC',
		'supplierId': '3',
		'preferredSupplier': false,
		'street':	'CCC Str. 333',
		'PLZ': 		'40233',
		'city': 	'Düsseldorf',
		'tefl': 	'+49123123333', 
		'site': 	'www.ccc.de',
		'email': 	'ccc.ccc.de',
		'timeOpen': '11:15',
		'timeClose': '13:30',
		'offers': [
			{'dish': 'Suppe CCC', 'price': 2.33 },
			{'dish': 'Salat CCC', 'price': 3.33 },
			{'dish': 'Nudeln CCC', 'price': 4.33 },
			{'dish': 'Steak CCC', 'price': 5.33 }] },
	{	'supplierName':		'Restaurant BBB',
		'supplierId': '4',
		'preferredSupplier': false,
		'street':	'BBB Str. 222',
		'PLZ': 		'40222',
		'city': 	'Köln',
		'tefl': 	'+49123123444', 
		'site': 	'www.ddd.de',
		'email': 	'ddd.ddd.de',
		'timeOpen': '11:45',
		'timeClose': '14:30',
		'offers': [
			{'dish': 'Suppe BBB', 'price': 2.22 },
			{'dish': 'Salat BBB', 'price': 3.22 },
			{'dish': 'Nudeln BBB', 'price': 4.22 },
			{'dish': 'Steak BBB', 'price': 5.22 }] },
	{	'supplierName':		'Restaurant CCC',
		'supplierId': '5',
		'preferredSupplier': false,
		'street':	'CCC Str. 333',
		'PLZ': 		'40233',
		'city': 	'Köln',
		'tefl': 	'+49123123555', 
		'site': 	'www.eee.de',
		'email': 	'eee.eee.de',
		'timeOpen': '11:30',
		'timeClose': '14:00',
		'offers': [
			{'dish': 'Suppe CCC', 'price': 2.33 },
			{'dish': 'Salat CCC', 'price': 3.33 },
			{'dish': 'Nudeln CCC', 'price': 4.33 },
			{'dish': 'Steak CCC', 'price': 5.33 }] }
]};