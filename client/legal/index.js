'use strict';

var express = require('express');
var router = express.Router();
var Contacts = require('../../models/contacts');
var moment = require('moment');
var emailService = require('../../lib/emailservice');

router.get('/datenschutz', renderDataProtection);
router.get('/impressum', renderImprint);
router.get('/contact', renderContact);
router.post('/contact', processContact);

module.exports = router;

function renderContact(req, res){
	console.log('*** index.js route GET - legal/kontakt - ');
	var layout = defineLayout(req.user);
  res.render('../client/legal/contact', {layout: layout});
};

function processContact(req, res){
	console.log('*** index.js route POST - legal/kontakt - ');
	console.log(req.body);
	var contactData = new Contacts({
    contactName: req.body.contactName,
    contactEmail: req.body.contactEmail,
    contactText: req.body.contactText,
    contactStatus: false,
    created: moment(new Date()).format('YYYY-MM-DDTHH:mm'),
  });
  contactData.save(function(err, newContact){
    if(err) {
      console.log('Something went wrong saving new contact Message');
      req.session.flash = {
        intro: 'Sorry - es hat einen Fehler gegeben',
        message: 'Bitte versuche es erneut',
      };
			res.redirect(303, '/legal/kontakt');
    } else {
      var bodytext = 'Absender ' + req.body.contactName + ' ' + req.body.contactEmail + ',\n\n' + req.body.contactText + '.\n'
      emailService.sendEmail('olaf@guesswhapp.de', 'Kontakt Message mytiffin', bodytext);
    	req.session.flash = {
        intro: 'Danke für Deine Nachricht!',
        message: 'Wir freuen uns über jeden Feedback und melden uns bei Dir zurück!',
      };
      if (req.user.role === 'supplier') {
				res.redirect(303, '/supply');
      } else if (!req.user) {
      	res.redirect(303, '/');
      } else {
      	res.redirect(303, '/offers');
      }
    }
  });
};

function renderDataProtection(req, res) {
	console.log('*** index.js route - legal/datenschtz - ');
	var layout = defineLayout(req.user);
  res.render('../client/legal/dataprotection', {layout: layout});
};

function renderImprint(req, res){
	console.log('*** index.js route - legal/impressum - ');
	var layout = defineLayout(req.user);
  res.render('../client/legal/imprint', {layout: layout});
};

function defineLayout (user){
	if (user) {
		return 'main';
	} else {
		return 'landingpage';
	}
};