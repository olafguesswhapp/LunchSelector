'use strict';

// /signup
// =======

var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var Cities = require('../../models/cities');
var emailService = require('../../lib/emailservice');
var moment = require('moment');

router.get('/', displaySignUp);
router.get('/startdb', initAdmin);
router.post('/', processSignUp);
router.post('/verify', verifiyEmail);
router.get('/verify', authenticateEmail);
router.get('/request', requestPassword);
router.post('/reset', resetPassword);
router.get('/reset', updatePassword);
router.post('/updatepw', processResetPassword);

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
		res.render('../client/signup/signup', {layout: 'register', locals: context});
	});
};

function verifiyEmail(req, res) {
	console.log('*** client/signup/index.js route POST - signup/verify - ');
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

function authenticateEmail(req, res) {
	console.log('*** client/signup/index.js route GET - signup/verify - ');
	LSUsers.findOne({'authToken' : req.query.token})
				.exec(function(err, user){
		if (!user) {
			console.log('No user with this username/email could be verified');
			res.redirect(303, '/signup');
		} else {
			console.log('user with this username/email could be verified');
			user.isAuthenticated = true;
      user.save(function (err, newUser) {
        if (err) {
        	console.error(err);
        	res.redirect(303, '/signup');
        } else {
        	console.log('succesfully updated user');
        	console.log(newUser);
        	var bodytext = 'Hallo ' + newUser.name + ',\n\n' +
	          'Dein Konto wurde erfolgreich aktiviert.\n\n' +
	          'Willkommen bei mytiffin.de.\n'
        	emailService.sendEmail(newUser.username, 'Willkommen bei mytiffin', bodytext);
        	res.redirect(303, '/soon');
        }
      });
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
				//generate authentication token
				var seed = crypto.randomBytes(20);
		    var authToken = crypto.createHash('sha1').update(seed + req.body.signupEmail).digest('hex');
				var newUserData = new LSUsers ({
					username: req.body.signupEmail,
					password: req.body.signupPassword,
					authToken: authToken,
					isAuthenticated: false,
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
						var bodytext = 'Hallo ' + req.body.signupName + ',\n\n' +
	          'Dein Konto kann jetzt aktiviert werden. Bitte verifiziere deine E-Mail-Adresse mit einem click auf diesen Link:\n\n' +
	          'http://' + req.headers.host + '/signup/verify/?token=' + newUser.authToken + '\n\n' + 
	          'Wenn du kein mytiffin.de Konto erstellst hast lösch bitte diese E-mail.\n'
						emailService.sendEmail(req.body.signupEmail, 'mytiffin Kontobestätigung', bodytext);
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
		var seed = crypto.randomBytes(20);
		var authToken = crypto.createHash('sha1').update(seed + req.body.signupEmail).digest('hex');
		var newUserData = new LSUsers ({
			username: req.body.signupEmail,
			password: req.body.signupPassword,
			authToken: authToken,
			isAuthenticated: false,
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
				var bodytext = 'Hallo ' + req.body.signupName + ',\n\n' +
        'Dein Konto kann jetzt aktiviert werden. Bitte verifiziere deine E-Mail-Adresse mit einem click auf diesen Link:\n\n' +
        'http://' + req.headers.host + '/signup/verify/?token=' + newUser.authToken + '\n\n' + 
        'Wenn du kein mytiffin.de Konto erstellst hast lösch bitte diese E-mail.\n'
				emailService.sendEmail(req.body.signupEmail, 'mytiffin Kontobestätigung', bodytext);
				if (req.body.signupIsRestaurant && req.body.signupHasLunch) {
					res.redirect(303, '/supply');	
				} else {
					res.redirect(303, '/offers');
				}
			}
		});
	}
};

function initAdmin (req, res) {
	console.log('*** client/signup/index.js route - startdb -');
	var newUserData = new LSUsers ({
		username: 'olaf@guesswhapp.de',
		password: '123',
		isAuthenticated: true,
		name: 'Olaf',
		role: 'admin',
		created: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
		gender: 0,
		age: 0,
		selectedCity: 'Düsseldorf'
	});
	newUserData.save(function(err, newUser){
		if(err) {
			console.log(err);
			res.redirect(303, '/signup');
		} else {
			res.redirect(303, '/');
		}
	});
};

function requestPassword(req, res){
	console.log('*** client/signup/index.js route - signup/request  -');
	res.render('../client/signup/request', {layout: 'landingpage'});
};

function resetPassword(req, res){
	console.log('*** client/signup/index.js route POST - signup/reset -');
	LSUsers.findOne({'username' : req.body.username})
				.exec(function(err, user){
		if (!user){
			console.log('No user found with the declared email');
			res.redirect(303, '/signup');
		} else {
			// var seed = crypto.randomBytes(20);
			var authToken = crypto.createHash('sha1').update(req.body.username).digest('hex');
			user.authToken = authToken;
			user.isAuthenticated = false;
			user.save(function (err, updatedUser){
				if (err){
					console.log(error);
          return res.redirect('signup/request');
				} else {
					var bodytext = 'Hallo ' + req.body.username + ',\n\n' +
						'Du hast Dein Passwort vergessen und diesen Erneuerungs-Link beantreagt.' +
            'Bitte registrier ein neues Passwort auf diesen Link:\n\n' +
            'http://' + req.headers.host + '/signup/reset/?token=' + updatedUser.authToken + '\n'
          emailService.sendEmail(req.body.username, 'mytiffin Email Passwort Erneuerung', bodytext);
          return res.redirect('/');
				}
			});
		}
	});
};

function updatePassword(req, res){
	console.log('*** client/signup/index.js route GET - signup/reset -');
	LSUsers.findOne({'authToken' : req.query.token})
				.select('username')
				.exec(function(err, user){
		if (!user){
			console.log('No user found with the token');
			res.redirect(303, '/');
		} else {
			// var seed = crypto.randomBytes(20);
			var authToken = crypto.createHash('sha1').update(user.username).digest('hex');
			if (authToken === req.query.token){
				res.render('../client/signup/reset', { updatetoken: req.query.token, layout: 'landingpagePre'});
			} else {
				res.redirect(303, '/signup/request');
			}
		}
	});
};

function processResetPassword(req, res){
	console.log('*** client/signup/index.js route POST - signup/updatepw -');
	LSUsers.findOne({'authToken' : req.body.token})
				.exec(function(err, user){
		if (!user){
			console.log('No user found with the token');
			res.redirect(303, '/signup');
		} else {
			if (user.username === req.body.signupEmail && user.authToken === req.body.token && req.body.signupPassword === req.body.signupPassword2){
				console.log('Token and User could be verified');
				user.isAuthenticated = true;
				user.password = req.body.signupPassword;
				user.save(function (err, updatedUser){
					if (err) {
						console.log('Error saving the updated user');
						console.log(err);
						res.redirect(303, '/signup');
					} else {
						res.redirect(303, '/soon');
					}
				});
			}
		}
	});
};