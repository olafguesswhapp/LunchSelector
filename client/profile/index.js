'use strict';

var express = require('express');
var router = express.Router();
var Suppliers = require('../../models/suppliers');
var LSUsers = require('../../models/lsusers');
var authentication = require('../../lib/authentication');
var moment = require('moment');

router.get('/', authentication.isLoggedIn, displayProfile);
router.get('/logout', logoutUser);
router.post('/supplier', authentication.isLoggedIn, addSupplier);
router.get('/supplier/:supplierName', authentication.isLoggedInAsSupplier, supplierEdit);
router.post('/supplier/update', authentication.isLoggedInAsSupplier, processSupplierEdit);

module.exports = router;

function processSupplierEdit(req, res){
	console.log('*** client/profile/index.js route POST - /profile/supplier/update -');
	var whoDelivers;
	var supplierDoesDeliver;
	if (req.body.hasOwnProperty('supplierDoesDeliver')){ supplierDoesDeliver = true} else {supplierDoesDeliver = false};
	if (req.body.signupRestaurantDelivery === 'Andere') {
		if (req.body.signupRestaurantOtherDelivery) {
			whoDelivers = req.body.signupRestaurantOtherDelivery
		} else {whoDelivers = 'Andere'}
	} else {whoDelivers = req.body.signupRestaurantDelivery}
	Suppliers.findByIdAndUpdate(req.body.supplierId,
					{$set: {
						supplierName: req.body.supplierName,
						supplierDescription: req.body.supplierDescription,
						supplierType: req.body.supplierType,
						supplierStart: req.body.supplierStart,
						supplierEnd: req.body.supplierEnd,
						supplierStreet: req.body.supplierStreet,
						supplierZipCode: req.body.supplierZipCode,
						supplierCity: req.body.supplierCity,
						supplierSite: req.body.supplierSite,
						supplierEmail: req.body.supplierEmail,
						supplierPhone: req.body.supplierPhone,
						supplierDoesDeliver: supplierDoesDeliver,
						supplierDeliversWith: whoDelivers
					}},
					{safe: true, upsert: true, new : true}, function(err, newSupplier){
	});
	res.redirect('/profile/supplier/' + req.body.supplierName);
};

function supplierEdit(req, res) {
	console.log('*** client/profile/index.js route - /profile/supplier/supplierName -');
	console.log(req.params.supplierName);
	Suppliers.findOne({ supplierName: req.params.supplierName})
					.exec(function(err, supplier){
		if (err) {
			console.log('Something went wrong');
			console.log(err);
			res.redirect('/profile');
		} else {
			var supplierOtherDelivery;
			var supplierDeliversWith;
			if (supplier.supplierDoesDeliver===true && ['Intern', 'Foodora', 'Deliveroo', 'Lieferheld'].indexOf(supplier.supplierDeliversWith)<0) {
				supplierOtherDelivery = supplier.supplierDeliversWith;
				supplierDeliversWith = 'Andere';
			} else {
				supplierOtherDelivery = '';
				supplierDeliversWith = supplier.supplierDeliversWith;
			}
			var context = {
				supplierId: supplier._id,
				supplierName: supplier.supplierName,
				supplierDescription: supplier.supplierDescription,
				supplierType: supplier.supplierType,
				supplierStart: supplier.supplierStart,
				supplierEnd: supplier.supplierEnd,
				supplierStreet: supplier.supplierStreet,
				supplierZipCode: supplier.supplierZipCode,
				supplierCity: supplier.supplierCity,
				supplierSite: supplier.supplierSite,
				supplierEmail: supplier.supplierEmail,
				supplierPhone: supplier.supplierPhone,
				supplierDoesDeliver: supplier.supplierDoesDeliver,
				supplierDeliversWith: supplierDeliversWith,
				supplierOtherDelivery: supplierOtherDelivery
			};
			res.render('../client/profile/supplier', context);
		}
	});
};

function displayProfile(req, res) {
	console.log('*** client/profile/index.js route - /profile -');
	var preferredSuppliers;
	Suppliers.find({_id: { $in: req.user.preferredSuppliers1 }}, function(err, suppliers){
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
		    res.render('../client/profile/profile', context);
			}
		});
	});
};

function logoutUser(req, res) {
	console.log('*** client/profile/index.js route - /logout -');
	req.logout();
	res.redirect('/');
};

function addSupplier(req, res) {
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
				res.redirect(303, '/profile');
			});
		}
	});
};