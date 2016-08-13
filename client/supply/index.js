'use strict';

var express = require('express');
var router = express.Router();
var moment = require('moment');
var Offers = require('../../models/offers');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedInAsSupplier, function (req, res) {
	console.log('*** client/supply/index.js route - /supply -');
	var startDate = new Date();
	var endDate = new Date();
  endDate.setDate(endDate.getDate() + 4);
	displaySupplierOffers(req, res, startDate, endDate)	
});

router.post('/', authentication.isLoggedInAsSupplier, function(req, res) {
	console.log('*** client/supply/index.js route POST - /supply -');
	var startDate = new Date(req.body.startDate);
	var endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + parseInt(req.body.endNumberDays));
	displaySupplierOffers(req, res, startDate, endDate)	
});

function displaySupplierOffers(req, res, startDate, endDate) {
	var context = {
		startDate: moment(new Date(startDate)).format('YYYY-MM-DD'),
		numberDays: Math.round((endDate- startDate)/(1000*60*60*24)),
		'category1': []
	};
	Offers.find({ offerSupplier: req.user.supplier[0], "offerDate": {"$gte": startDate, "$lt": endDate}})
				.exec(function(err, offers){
		if(err || offers.length<1){
			console.log('No offer was found? Size of returned array ' + offers.length)
		} else {
			offers.forEach(function(offerElement, feIndex){
				var offerDate = moment(offerElement.offerDate).format('YYYY-MM-DD')
				var helpIndex = context[ 'category' + offerElement.offerCategory].findIndex(function(contextElement){
					return (contextElement.date === offerDate);
				});
				if (helpIndex < 0){
					helpIndex = context[ 'category' + offerElement.offerCategory].length;
					context[ 'category' + offerElement.offerCategory].push({
						date : offerDate,
						offers : []
					});
				}
				var helpObject = {
					offerId: offerElement._id,
					offerName: offerElement.offerName,
					offerPrice: offerElement.offerPrice,
					offerSortIndex: offerElement.offerSortIndex
				};
				context[ 'category' + offerElement.offerCategory][helpIndex]['offers'].push(helpObject);
				context[ 'category' + offerElement.offerCategory][helpIndex]['offers'].sort(function(a,b){
					return (a.offerSortIndex - b.offerSortIndex);
				});
				// if (feIndex === offers.length - 1){
					// console.log(context);
				// res.render('../client/supply/supply', context);
				// }
			});
		}
		res.render('../client/supply/supply', context);
	});
};

router.post('/offer', authentication.isLoggedInAsSupplier, function (req, res){
	console.log('*** client/supply/index.js route POST - /supply/offer -');
	var proposedIndex, maxRange;
	var minRange = parseInt(req.body.offerType, 10);
	switch (minRange) {
		case 0:
			maxRange = 10;
			break;
		case 10:
			maxRange = 100;
			break;
		case 100:
			maxRange = 1000;
			break;
		default:
			maxRange = 10;
	}
	Offers.find({offerDate: req.body.offerDate, offerCategory: 1, $and: [{'offerSortIndex': {$gte: minRange}}, {'offerSortIndex': {$lt: maxRange}}] })
				.select('offerSortIndex')
				.exec(function(err, offerIndex){
		if (err || offerIndex.length === 0) {
			proposedIndex = minRange;
		} else {
			proposedIndex = offerIndex.reduce(function(prev, curr){
				if (curr.offerSortIndex > prev){
					return curr.offerSortIndex;
				} else if ( prev>curr.offerSortIndex) {
					return prev;
				} else {return prev;}
			}, 0);
			proposedIndex+=1;
		}
		var newSupplierOffer = new Offers ({
			offerDate: req.body.offerDate,
			offerCategory: 1, // 1 = lunch
			offerName: req.body.offerName,
			offerPrice: req.body.offerPrice,
			offerSortIndex: proposedIndex,
			offerSupplier: req.user.supplier[0]
		});
		newSupplierOffer.save(function(err, newOffer){
			if(err) {
				res.redirect(303, '/supply');
			} else {
				res.json('Danke für die Anfrage.')
			}
		});
	});
});

router.delete('/offer', authentication.isLoggedInAsSupplier, function(req, res) {
	console.log('*** client/supply/index.js route DELETE - /supply/offer -');
	Offers.findByIdAndRemove(req.body.offerId, function(err, offerRemoved){
		if (err){
			console.log('Not able to remove Offer');
			console.log(req.body);
			res.status(404).json(); 
		} else {
			console.log('This offer has been removed by Supplier:');
			console.log(offerRemoved);
			res.json('Danke für die Anfrage.')
		}
	});
});

router.post('/request', authentication.isLoggedIn, function (req, res) {
	console.log('*** client/supply/index.js route - supply/request - ');
	console.log(req.body);
  res.json('Danke für die Anfrage.')
});

router.post('/request2', authentication.isLoggedIn, function (req, res) {
	console.log('*** client/supply/index.js route - supply/request2 - ');
	console.log(req.body);
  res.json('Danke für die Anfrage2.')
});

module.exports = router;