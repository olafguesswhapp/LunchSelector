'use strict';

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var Offers = require('../../models/offers');
var Cities = require('../../models/cities');
var quoteService = require('../../lib/quoteservice');
var logservice = require('../../lib/logservice');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedIn, displayTodaysOffers);
router.post('/remove', authentication.isLoggedIn, removeSupplierFromPreferred);
router.get('/select', authentication.isLoggedIn, displaySupplierSelection);
router.post('/select/append', authentication.isLoggedIn, addSupplierToPreferred);

module.exports = router;

function displayTodaysOffers(req, res) {
	console.log('*** client/offfers/index.js route - offers/ - ');
	var today = new Date(new Date().setUTCHours(0,0,0,0));
	return displayOffers(req, res, today);
};

function displayOffers(req, res, date){
	var helpArray = [];
	Offers.find({ offerCategory: 1 , offerSupplier: { $in: req.user.preferredSuppliers1 }, offerDate: date})
				.select('offerDate offerName offerPrice  offerSortIndex offerSupplier')
				.exec(function(err, currentOffers){
		if (err) {
			console.log('Preferred Suppliers do not have any offers'); // FLASH MESSAGE you have not yet selected a preferred supplier
			req.session.flash = {
        intro: 'Such Dir Deine Lieblings-Restaurants aus!',
        message: 'Bitte wähle aus den folgenden Restaurants bzw. trage unten Dein Wunsch ein.',
      };
			res.redirect('/offers/select');
		} else {
			var returnedOffers = currentOffers.map(function(element){
				return {
					offerDate: element.offerDate,
					offerName: element.offerName,
					offerPrice: element.offerPrice.toFixed(2),
					offerSortIndex: element.offerSortIndex,
					offerSupplier: element.offerSupplier
				};
			});
			Suppliers.find({ _id : { $in: req.user.preferredSuppliers1 }})
					.exec(function(err, supplier){
				if (err || supplier.length === 0) {
					console.log('User has no preferredSupplier'); // Direct to supplier Selectio or MESSAGE
					res.redirect('/offers/select');
				} else {
					var supplierOffers = {
						userName: req.user.username,
						selectedCity: req.user.selectedCity,
						displayDate: date,
						navOffers: true,
						currentlyOnOffers: true,
						suppliers: []
					};
					supplierOffers.suppliers = supplier.filter(function(filterElement){return filterElement.supplierWeekday[date.getDay()]}).map(function(supplierElement){
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
							supplierSite: 				supplierElement.supplierSite,
							supplierEmail: 				supplierElement.supplierEmail,
							supplierFB: 					supplierElement.supplierFB,
							supplierTw: 					supplierElement.supplierTw,
							supplierInst: 				supplierElement.supplierInst,
							supplierPhone: 				supplierElement.supplierPhone ,
							offers: 							returnedOffers.filter(function(offerElement){
								return (JSON.stringify(offerElement.offerSupplier) === JSON.stringify(supplierElement._id))
							}).sort(sortBySortIndex)
						}
					});
					supplierOffers.availableCities = helpArray.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
					quoteService.selectQuote(1).then(function(quote){
						supplierOffers.quote = quote;
						res.render('../client/offers/offers', supplierOffers);
	    			logservice.recLog(req.user._id, 1);
					});
				}
			});
		}
	});
};

function sortBySortIndex (a, b){
	return (a.offerSortIndex - b.offerSortIndex)
};

function addSupplierToPreferred(req, res) {
	console.log('*** client/offfers/index.js route - offers/select/append - ');
	Suppliers.findById(req.body.supplierId, function(err, supplier){
		if (err || !supplier || supplier.lenth === 0) {
			console.log('this supplier might not exist');
			console.log(err);
			console.log(supplier);
			res.status(404).json(); 
		} else {
			LSUsers.findByIdAndUpdate( req.user._id,
					    {$push: {'preferredSuppliers1': req.body.supplierId }},
					    {safe: true, upsert: true, new : true}, function(err, user) {
		    if (err || user.length === 0) {
		    	console.log('Could not be appended');
		    	console.log(err);
		    	res.status(404).json(); 
		    } else {
		    	res.json();
		    	logservice.recLog(req.user._id, 3);
		    }
		  });
		}
	});
};

function removeSupplierFromPreferred(req, res) {
	console.log('*** client/offfers/index.js route - offers/remove - ');
	var adjustedPreferredSuppliers = req.user.preferredSuppliers1.filter(function(supplier){
		return (JSON.stringify(supplier) !== JSON.stringify(req.body.supplierId));
	});
	req.user.preferredSuppliers1 = adjustedPreferredSuppliers;
	LSUsers.findByIdAndUpdate( req.user._id,
			    {$set: {'preferredSuppliers1': adjustedPreferredSuppliers }},
			    {safe: true, upsert: true, new : true}, function(err, user) {
    if (err || user.length === 0) {
    	console.log('adjustedPreferredSuppliers could not be modified');
    	res.status(404).json(); 
    } else {
    	res.json();
    	logservice.recLog(req.user._id, 5);
    }
  });
};

function displaySupplierSelection(req, res) {
	console.log('*** client/offfers/index.js route - offers/select - ');
	var selectedCity = req.user.selectedCity;
	var availableCities;
	if (req.query.selectedCity){
		selectedCity = req.query.selectedCity;
		LSUsers.findOneAndUpdate({_id: req.user._id}, { $set: { selectedCity: req.query.selectedCity }}, {new: true}, function(err, user){
    	if(err){
    		console.log("Something wrong when updating selectedCity data!");
    		console.log(err);
    	} else {
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
	}).then(function(){
		Suppliers.find({ supplierCity: selectedCity, _id: { $nin: req.user.preferredSuppliers1 }})
						.exec(function(err, supplier){
			var supplierHelp; // needed in case no supplier found
			var today = new Date(new Date().setUTCHours(0,0,0,0));
			if (err || supplier.length === 0) {
				console.log('Currently no suppliers available to choose from');
				supplierHelp = [];
			} else {
				supplierHelp = supplier;
			}
			var supplierSelection = {
				selectedCity: selectedCity,
				availableCities: availableCities,
				navSelect: true,
				currentlyOnOffers: false,
				suppliers: supplierHelp
			};
			if (supplierSelection.suppliers.length === 0) {
					res.render('../client/offers/select', supplierSelection);
					logservice.recLog(req.user._id, 2);
				} else {
					supplierSelection.suppliers.forEach(function(supplierElement, supplierIndex){
						Offers.find({ offerCategory: 1 , offerSupplier: supplierElement._id, offerDate: today})
								.select('offerDate offerName offerPrice  offerSortIndex offerSupplier')
								.exec(function(err, currentOffers){
							if (err) {
								console.log('Err while searching offers of supplier ' + supplierElement._id + ' with date ' + today );
								console.log(err);
							} else {
								supplierElement.offers = currentOffers.map(function(offer){
									return {
										offerName: offer.offerName,
										offerPrice: offer.offerPrice,
										offerSortIndex: offer.offerSortIndex
									}
								}).sort(sortBySortIndex);
							}
							console.log(supplierIndex + ' von ' + (supplierSelection.suppliers.length -1));
							if (supplierSelection.suppliers.length - 1 === supplierIndex){
								res.render('../client/offers/select', supplierSelection);
								logservice.recLog(req.user._id, 2);
							}
						});
					});
				}
		});
	});
};