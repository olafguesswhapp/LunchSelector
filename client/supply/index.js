'use strict';

var express = require('express');
var router = express.Router();
var Offers = require('../../models/offers');
var Suppliers = require('../../models/suppliers');
var Proposals = require('../../models/proposals');
var authentication = require('../../lib/authentication');
var moment = require('moment');

router.get('/', authentication.isLoggedInAsSupplier, suppliersSiteGet);
router.post('/', authentication.isLoggedInAsSupplier, suppliersSitePost);
router.post('/offer', authentication.isLoggedInAsSupplier, recordNewOffer);
router.delete('/offer', authentication.isLoggedInAsSupplier, deleteOffer);
router.post('/request', authentication.isLoggedIn, recordProposal);

module.exports = router;

function suppliersSiteGet(req, res) {
	console.log('*** client/supply/index.js route - /supply -');
	var offerCategory = 1; // 1 = Lunch
	var startDate = new Date();
	var endDate = new Date();
	var selectedSupplier;
	startDate.setUTCHours(0,0,0,0);
	endDate.setUTCHours(0,0,0,0);
  endDate.setDate(endDate.getDate() + 5);
  if (req.query.selectedSupplier){selectedSupplier = req.query.selectedSupplier} else {selectedSupplier = 0}
	displaySupplierOffers(req, res, startDate, endDate, offerCategory, selectedSupplier);
};

function suppliersSitePost(req, res) {
	console.log('*** client/supply/index.js route POST - /supply -');
	var offerCategory = 1; // 1 = Lunch
	var startDate = new Date(req.body.startDate);
	var endDate = new Date(startDate);
	var endDate = new Date();
	var selectedSupplier = parseInt(req.body.selectedSupplier, 10);
	startDate.setUTCHours(0,0,0,0);
  endDate.setDate(endDate.getDate() + parseInt(req.body.endNumberDays));
	displaySupplierOffers(req, res, startDate, endDate, offerCategory, selectedSupplier);
};

function displaySupplierOffers(req, res, startDate, endDate, offerCategory, selectedSupplier) {
	var context = {
		startDate: moment(new Date(startDate)).format('YYYY-MM-DD'),
		numberDays: Math.round((endDate- startDate)/(1000*60*60*24)),
		'category1': [],
		supplier: [],
		selectedSupplier: parseInt(selectedSupplier, 10)
	};
	Offers.find({ 'offerSupplier': req.user.supplier[selectedSupplier],
							'offerDate': {'$gte': startDate, '$lte': endDate},
							'offerCategory': 1})
				.exec(function(err, offers){
		console.log(offers);
		if(err){
			console.log('No offer was found due to error ');
			console.log(err);
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
			});
		}
	}).then(function(){
		Suppliers.find({ _id: {$in: req.user.supplier}})
						.select('supplierName')
						.exec(function(err, suppliers){
			console.log(suppliers);
			if (err || suppliers === null){
				console.log('Something is wrong - cannot find the users suppliers');
			} else {
				context.supplier = suppliers.map(function(supplier){return supplier.supplierName});
			}
		}).then(function(){
			console.log(context);
			res.render('../client/supply/supply', context);
		});
	});
};

function recordNewOffer(req, res) {
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
	Offers.find({ offerDate: req.body.offerDate, offerCategory: 1, offerSupplier: req.user.supplier[parseInt(req.body.selectedSupplier, 10)],
		$and: [{'offerSortIndex': {$gte: minRange}}, {'offerSortIndex': {$lt: maxRange}}] })
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
			offerSupplier: req.user.supplier[parseInt(req.body.selectedSupplier, 10)]
		});
		newSupplierOffer.save(function(err, newOffer){
			if(err) {
				res.redirect(303, '/supply');
			} else {
				res.json('Danke für die Anfrage.')
			}
		});
	});
};

function deleteOffer(req, res) {
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
};

function recordProposal(req, res) {
	console.log('*** client/supply/index.js route - supply/request - ');
	console.log(req.body);
	var newProposal = new Proposals ({
		proposalInfo: req.body.requestInfo,
		proposalUpdate: req.body.requestUpdate,
		proposalRevealToSupplier: req.body.requestPersonal,
		proposalBy: req.user._id,
		proposalCreated: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
		proposalStatus: 'recorded'
	});
	newProposal.save(function(err, newProp){
		if(err) {
			console.log(err);
			res.redirect(303, '/offers');
		} else {
			res.json('Danke für die Anfrage.')
		}
	});
};