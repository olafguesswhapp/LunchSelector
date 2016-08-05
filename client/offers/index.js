'use strict';

var express = require('express');
var router = express.Router();

const useroffer = {
	'userName': 'olafguesswhapp',
	'selectedCity':	'Düsseldorf',
	'availableCities': ['Düsseldorf', 'Köln', 'Wuppertal'],
	'suppliers': [
	{	'supplierName':		'Restaurant AAA',
		'supplierId': '1',
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
		'street':	'BBB Str. 222',
		'PLZ': 		'40222',
		'city': 	'Wuppertal',
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

router.get('/', function (req, res) {
		console.log('*** client/offfers/index.js route -offers- ');
    res.render('../client/offers/offers', useroffer);
});

router.post('/select/append', function(req, res) {
	console.log('*** client/offfers/index.js route -select/append- ');
	console.log(req.body);
});

router.get('/select', function (req, res) {
	console.log('*** client/offfers/index.js route -select- ');
	var selectedCity = 'Düsseldorf'; // CHANGE from POST request
	var supplierSelection = {
		userName: useroffer.userName, // CHANGE from JWT
		selectedCity: selectedCity, // CHANGE from POST request
		suppliers: useroffer.suppliers.filter(function(offer){
			return (offer.city === selectedCity);
		})
	};
	console.log(supplierSelection);
  res.render('../client/offers/select', supplierSelection);
});


module.exports = router;
