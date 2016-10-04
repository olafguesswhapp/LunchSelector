'use strict';

var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var passport = require('passport');
var Prospects = require('../../models/prospects');
var emailService = require('../../lib/emailservice');

router.get('/', renderPreLaunch);
router.post('/login', processLogin);
router.get('/soon', renderLandingPage);
router.post('/prospect', registerProspect);
router.get('/prospect/verify', verifyProspect);
router.get('/toon', renderTest);

module.exports = router;

function renderPreLaunch(req, res) {
  console.log('*** index.js route - / - ');
  res.render('../client/landingpage/landingpagePre', {layout: 'landingpagePre'});
};

function renderLandingPage(req, res) {
  console.log('*** index.js route - / soon ');
  res.render('../client/landingpage/landingpageSoon', {layout: 'landingpage'});
};

function processLogin(req, res) {
  console.log('*** index.js route - /login/ - ');
  passport.authenticate('local', function(err, user, info) {
    console.log(err);
    console.log(info);
    if (err) { return next(err) }
    if (!user && info.message == 'Invalid password'){
      console.log('Das Passwort für Username ' + req.body.username + ' stimmt nicht - Bitte versuchen Sie es erneut.');
      return res.redirect('/signup/request');
    } else if (!user) {
      console.log('Der Username ' + req.body.username + ' wurde bisher nicht angelegt. Wir freuen uns auf Deine Anmeldung.');
      return res.redirect('/signup');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      console.log(user);
      if (user.role === 'user'){
        return res.redirect('/offers');
      } else {
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
            return res.redirect('/');
          } else {
            var bodytext = 'Hallo ' + req.body.username + ',\n\n' +
            'Bitte verifiziere deine E-Mail-Adresse mit einem click auf diesen Link:\n\n' +
            'http://' + req.headers.host + '/prospect/verify/?token=' + newUser.authToken + '\n\n' + 
            'Wenn Du Dich nicht bei mytiffin.de registriert hast lösch bitte diese E-mail.\n'
            emailService.sendEmail(req.body.username, 'mytiffin Email Verifizierung', bodytext);
            return res.redirect('/');
          }
        });
      } else {
        return res.redirect('/');
      }
    });
  }
};

function renderTest(req, res) {
  console.log('*** index.js route - / test ');
  emailService.sendEmail('olaf@guesswhapp.de', 'Test Subject Line', 'Lieber email Empfänger, dies ist ein Test');
  res.render('../client/landingpage/test', {layout: 'landingpage'});
};

function verifyProspect(req, res) {
  console.log('*** client/landingpage/index.js route GET - prospect/verify - ');
  Prospects.findOne({'authToken' : req.query.token})
        .exec(function(err, prospect){
    if (!prospect) {
      console.log('No prospect with this email could be verified');
      res.redirect(303, '/');
    } else {
      console.log('prospect with this email could be verified');
      prospect.isAuthenticated = true;
      prospect.save(function (err, newProspect) {
        if (err) {
          console.error(err);
          res.redirect(303, '/');
        } else {
          console.log('succesfully updated prospect');
          console.log(newProspect);
          res.redirect(303, '/');
        }
      });
    }
  });
};