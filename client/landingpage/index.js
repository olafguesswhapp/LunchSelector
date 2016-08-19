'use strict';

var express = require('express');
var router = express.Router();
var passport = require('passport');

router.get('/', renderLandingPage);
router.post('/login', processLogin);

module.exports = router;

function renderLandingPage(req, res) {
  console.log('*** index.js route - / - ');
  res.render('../client/landingpage/landingpage', {layout: 'landingpage'});
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