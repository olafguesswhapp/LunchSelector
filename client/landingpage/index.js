'use strict';

var express = require('express');
var router = express.Router();
var passport = require('passport');
var Prospects = require('../../models/prospects');

router.get('/', renderPreLaunch);
router.post('/login', processLogin);
router.get('/soon', renderLandingPage);
router.post('/prospect', registerProspect);
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
      return res.redirect('/');
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
        var newProspect = new Prospects({
          prospectEmail: req.body.username,
          authToken: 'testing2',
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
  res.render('../client/landingpage/test', {layout: 'landingpage'});
};