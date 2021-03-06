'use strict';

var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var passport = require('passport');
var Prospects = require('../../models/prospects');
var quoteService = require('../../lib/quoteservice');
var emailService = require('../../lib/emailservice');

var Suppliers = require('../../models/suppliers');
var Offers = require('../../models/offers');
var quoteService = require('../../lib/quoteservice');
var logservice = require('../../lib/logservice');

router.get('/', renderLandingPage);
router.post('/login', processLogin);
router.post('/prospect', registerProspect);
router.get('/prospect/verify', verifyProspect);
router.get('/toon', renderTest);

module.exports = router;

function processLogin(req, res) {
  console.log('*** index.js route - /login/ - ');
  passport.authenticate('local', function(err, user, info) {
    console.log('Error:');
    console.log(err);
    console.log('Info:');
    console.log(info);
    if (err) {
      return next(err);
    }
    if (!user && info.message == 'Invalid password'){
      console.log('Das Passwort für Username ' + req.body.username + ' stimmt nicht - Bitte versuchen Sie es erneut.');
      req.session.flash = {
        intro: 'Sorry - falsches Passwort',
        message: 'Bitte versuch es erneut oder beantrag ein Neues.',
      };
      return res.redirect('/signup/request');
    } else if (!user && info.message === 'User-Email not authenticated'){
      console.log('Die Email ' + req.body.username + ' wurde vom User noch nicht verifiziert.');
      req.session.flash = {
        intro: 'Bitte Deine Email verifizieren!',
        message: 'Wir haben dir eine Email mit einem Verifizierungs-Link zugesendet.',
      };
      return res.redirect('/signup/request');
    } else if (!user) {
      console.log('Der Username ' + req.body.username + ' wurde bisher nicht angelegt. Wir freuen uns auf Deine Anmeldung.');
      req.session.flash = {
        intro: 'Sorry - Deine Email ist uns unbekannt.',
        message: 'Bitte versuch es mit einer anderen Email oder registrier Dich bei uns.',
      };
      return res.redirect('/signup');
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      console.log(user);
      if (user.role === 'user'){
        req.session.flash = {
          intro: 'Hallo ' + user.username + '. ',
          message: 'Dies sind heute die Angebote Deiner Lieblings-Restaurants.',
        };
        return res.redirect('/offers');
      } else {
        req.session.flash = {
          intro: 'Hallo ' + user.username + '. ',
          message: 'Bitte erfasse Gerichte Deines Restaurants.',
        };
        return res.redirect('/supply');
      }
    });
  })(req, res);
};

function registerProspect(req, res) {
  console.log('*** index.js route - /prospect - ');
  if (req.body.username) {
    Prospects.findOne({ prospectEmail: req.body.username }, function(err, prospect){
      if (err || prospect == null) {
        var seed = crypto.randomBytes(20);
        var authToken = crypto.createHash('sha1').update(seed + req.body.username).digest('hex');
        var newProspect = new Prospects({
          prospectEmail: req.body.username,
          authToken: authToken,
          isAuthenticated: false,
          prospectChecked: false,
          hasOptedIn: false,
          created: new Date()
        });
        newProspect.save(function(error, newUser){
          if(error) {
            console.log(error);
            req.session.flash = {
              intro: 'Sorry - es hat einen Fehler gegeben',
              message: 'Bitte versuche es erneut',
            };
            return res.redirect('/');
          } else {
            quoteService.selectQuote(1).then(function(quote){
              var bodytext = quote.quoteAuthor + ': "' + quote.quoteText + '"\n\n' + 
              'Hallo ' + req.body.username + ',\n\n' +
              'Bitte verifiziere deine E-Mail-Adresse mit einem click auf diesen Link:\n\n' +
              'http://mytiffin.de/prospect/verify/?token=' + newUser.authToken + '\n\n' + 
              'Wenn Du Dich nicht bei mytiffin.de registriert hast lösch bitte diese E-mail.\n'
              emailService.sendEmail(req.body.username, 'mytiffin Email Verifizierung', bodytext);
              req.session.flash = {
                intro: 'Hallo ' + req.body.username + '. ',
                message: 'Wir haben Dir eine Bestätigungs-Email zugesendet! Danke',
              };
              return res.redirect('/');
            });
          }
        });
      } else {
        req.session.flash = {
          intro: 'Schön Dich wiederzusehen!',
          message: 'Wir haben Dich bereits in unserer List erfasst - Danke Dir',
        };
        return res.redirect('/');
      }
    });
  }
};

function renderTest(req, res) {
  console.log('*** index.js route - / test ');
  console.log(req.get('host'));
  // emailService.sendEmail('olaf@guesswhapp.de', 'Test Subject Line', 'Lieber email Empfänger, dies ist ein Test');
  res.render('../client/landingpage/test', {layout: 'landingpage'});
};

function verifyProspect(req, res) {
  console.log('*** client/landingpage/index.js route GET - prospect/verify - ');
  Prospects.findOne({'authToken' : req.query.token})
        .exec(function(err, prospect){
    if (!prospect) {
      console.log('No prospect with this email could be verified');
      req.session.flash = {
        intro: 'Sorry!',
        message: 'Dein Bestätigungs-Link ist nicht mehr gültig.',
      };
      res.redirect(303, '/');
    } else {
      console.log('prospect with this email could be verified');
      prospect.isAuthenticated = true;
      prospect.save(function (err, newProspect) {
        if (err) {
          console.error(err);
          req.session.flash = {
            intro: 'Sorry - es hat einen Fehler gegeben',
            message: 'Bitte versuche es erneut',
          };
          res.redirect(303, '/');
        } else {
          console.log('succesfully updated prospect');
          console.log(newProspect);
          req.session.flash = {
            intro: 'Danke!',
            message: 'Du hast Deine Email bestätigt und wir haben Dich in unsere Liste aufgenommen!',
          };
          res.redirect(303, '/');
        }
      });
    }
  });
};

function renderLandingPage(req, res) {
  console.log('*** index.js route - / test ');
  var date = new Date(new Date().setUTCHours(0,0,0,0));
  var helpArray = [];
  Offers.find({ offerCategory: 1 , offerDate: date})
        .select('offerDate offerName offerPrice  offerSortIndex offerSupplier')
        .exec(function(err, currentOffers){
    if (err) {
      console.log('Today there are not any offers');
      req.session.flash = {
        intro: 'Heute gibt es keine Mittagsangebote',
        message: 'Bitte schau morgen wieder vorbei bzw. trage unten Dein Wunsch ein.',
      };
      res.redirect('/'); // No REDIRECT!!!
    } else {
      var returnedOffers = currentOffers.map(function(element){
        return {
          offerDate: element.offerDate,
          offerName: element.offerName,
          offerPrice: element.offerPrice.toFixed(2),
          offerSortIndex: element.offerSortIndex,
          offerSupplier: element.offerSupplier
        };
      }); // end var returnedOffers
      Suppliers.find()
               .exec(function(err, supplier){
        if (err || supplier.length === 0) {
          console.log('No Suppliers found');
          res.redirect('/'); // No REDIRECT
        } else {
          var supplierOffers = {
            selectedCity: 'Düsseldorf',
            displayDate: date,
            navOffers: true,
            currentlyOnOffers: true,
            suppliers: []
          }; // end var supplierOffers
          var helpSuppliers = supplier.filter(function(filterElement){
            return filterElement.supplierWeekday[date.getDay()]
          }).map(function(supplierElement){
            helpArray.push(supplierElement.supplierCity);
            return {
              supplierId:           supplierElement._id,
              supplierName:         supplierElement.supplierName,
              supplierDescription:  supplierElement.supplierDescription,
              supplierType:         supplierElement.supplierType,
              supplierStart:        supplierElement.supplierStart,
              supplierEnd:          supplierElement.supplierEnd,
              supplierStreet:       supplierElement.supplierStreet,
              supplierZipCode:      supplierElement.supplierZipCode,
              supplierCity:         supplierElement.supplierCity,
              supplierSite:         supplierElement.supplierSite,
              supplierEmail:        supplierElement.supplierEmail,
              supplierFB:           supplierElement.supplierFB,
              supplierTw:           supplierElement.supplierTw,
              supplierInst:         supplierElement.supplierInst,
              supplierPhone:        supplierElement.supplierPhone ,
              offers:               returnedOffers.filter(function(offerElement){
                return (JSON.stringify(offerElement.offerSupplier) === JSON.stringify(supplierElement._id))
              }).sort(sortBySortIndex)
            }
          }); // end supplierOffers.suppliers = supplier.filter
          // Delete Suppliers without an offer and than
          // Reduce number of offers on Landing Page to 3
          supplierOffers.suppliers = helpSuppliers.filter(function(supplierElement){
            return supplierElement.offers.length>0
          }).filter(function(supplier2Element, index){
            return index < 3;
          });
          quoteService.selectQuote(1).then(function(quote){
            if(!res.locals.flash){
              res.locals.flash = {
                intro: quote.quoteAuthor + ': ',
                message: '"' + quote.quoteText + '"',
              };
            }
            res.render('../client/landingpage/landingpage', { data: supplierOffers, layout: 'landingpage'});
          }); // end quoteService.selectQuote(1)
        } // end else no err Suppliers.find
      }); // end Suppliers.find
    } // end else no err Offers.find
  }); // end Offers.find
}; // end renderNewLandingPage

function sortBySortIndex (a, b){
  return (a.offerSortIndex - b.offerSortIndex)
};