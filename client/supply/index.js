'use strict';

var express = require('express');
var router = express.Router();
var Offers = require('../../models/offers');
var Suppliers = require('../../models/suppliers');
var Proposals = require('../../models/proposals');
var logservice = require('../../lib/logservice');
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
	var selectedSupplier;
	if (req.query.selectedSupplier){selectedSupplier = req.query.selectedSupplier} else {selectedSupplier = 0}
	checkDate(req.user.supplier[selectedSupplier]).then(function(startDate){
		var endDate = new Date();
		endDate.setUTCHours(0,0,0,0);
	  endDate.setDate(endDate.getDate() + 5);
		displaySupplierOffers(req, res, startDate, endDate, offerCategory, selectedSupplier);
	});
};

function suppliersSitePost(req, res) {
	console.log('*** client/supply/index.js route POST - /supply -');
	var offerCategory = 1; // 1 = Lunch
	var selectedSupplier = parseInt(req.body.selectedSupplier, 10);
	var startDate = new Date(req.body.startDate);
	var endDate = new Date(startDate);
	var endDate = new Date();
	startDate.setUTCHours(0,0,0,0);
  endDate.setDate(endDate.getDate() + parseInt(req.body.endNumberDays));
	displaySupplierOffers(req, res, startDate, endDate, offerCategory, selectedSupplier);
};

function checkDate(supplierId){
	return new Promise(function(resolve, reject){
		var startDate = new Date();
		startDate.setUTCHours(0,0,0,0);
		Suppliers.findById(supplierId)
						.select('supplierWeekday')
						.exec(function(err, supplier){
			if(err || supplier.length == 0){
				resolve (startDate)
			} else if (supplier.supplierWeekday.every(function(item){return (item === false)})){
				// this should not be allowed
			} else if (supplier.supplierWeekday[startDate.getDay()]){
				resolve (startDate)
			} else {
				for(var i=1;i<7;i++){
					startDate.setDate(startDate.getDate() + 1);
					if(supplier.supplierWeekday[startDate.getDay()]){
						break;
					}
				}
				resolve (startDate)
			}
		});
	});
};

function displaySupplierOffers(req, res, startDate, endDate, offerCategory, selectedSupplier) {
	var context = {
		navSupply: true,
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
					offerPrice: offerElement.offerPrice.toFixed(2),
					offerSortIndex: offerElement.offerSortIndex
				};
				context[ 'category' + offerElement.offerCategory][helpIndex]['offers'].push(helpObject);
				context[ 'category' + offerElement.offerCategory][helpIndex]['offers'].sort(function(a,b){
					return (a.offerSortIndex - b.offerSortIndex);
				});
			});
		}
	}).then(function(){
		context.category1.sort(function(a,b){
			return new Date(a.date) - new Date(b.date);
		});
		Suppliers.find({ _id: {$in: req.user.supplier}})
						.select('supplierName supplierWeekday')
						.exec(function(err, suppliers){
			if (err || suppliers === null){
				console.log('Something is wrong - cannot find the users suppliers');
			} else {
				context.supplier = suppliers.map(function(supplier){return supplier.supplierName});
			}
		}).then(function(){
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
				req.session.flash = {
          intro: 'Sorry - es hat einen Fehler gegeben',
          message: 'Bitte versuche es erneut',
        };
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
	var newProposal = new Proposals ({
		proposalInfo: req.body.requestInfo,
		proposalMessage: req.body.requestMessage,
		proposalUpdate: req.body.requestUpdate,
		proposalRevealToSupplier: req.body.requestPersonal,
		proposalBy: req.user._id,
		proposalCreated: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
		proposalStatus: 'recorded'
	});
	newProposal.save(function(err, newProp){
		if(err) {
			console.log(err);
			req.session.flash = {
        intro: 'Sorry - es hat einen Fehler gegeben',
        message: 'Bitte versuche es erneut',
      };
			res.redirect(303, '/offers');
		} else {
			res.json('Danke für die Anfrage.');
			logservice.recLog(req.user._id, 4);
		}
	});
};