'use strict';

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var Cities = require('../../models/cities');
var Proposals = require('../../models/proposals');
var Prospects = require('../../models/prospects');
var Protocols = require('../../models/protocols');
var Contacts = require('../../models/contacts');
var Quotes = require('../../models/quotes');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedInAsAdmin, displayAdmin);
router.post('/city', authentication.isLoggedInAsAdmin, recordCity);
router.put('/city', authentication.isLoggedInAsAdmin, setCityStatus);
router.put('/proposal', authentication.isLoggedInAsAdmin, setProposalStatus);
router.get('/quotes', authentication.isLoggedInAsAdmin, displayQuotes);
router.post('/quotes', authentication.isLoggedInAsAdmin, processInputQuotes);

module.exports = router;

function displayQuotes(req, res) {
  console.log('*** client/admin/index.js route GET - /admin/quotes - ');
  var context = { quotes : [] };
  Quotes.find().exec(function(err, quote){
    if (err || quote.length === 0) {
      context.quotes = [{ quoteText: 'no quotes recorded yet', quoteStatus: false }];
    } else {
      context.quotes = quote;
    }
    res.render('../client/admin/quotes', context);
  });
};

function processInputQuotes(req, res) {
  console.log('*** client/admin/index.js route POST - /admin/quotes - ');
  var newQuote = new Quotes({
    quoteAuthor: req.body.quoteAuthor,
    quoteText: req.body.quoteText,
    quoteType: 1,
    quoteStatus: true
  });
  newQuote.save(function(err, savedQuote){
    if(err){
      console.log('Fehler beim speichern des Zitats');
    } else {
      res.redirect('/admin/quotes');
    }
  });
};

function displayAdmin (req, res) {
  console.log('*** client/admin/index.js route - /admin - ');
  var context = {
    navAdmin: true,
    cities: [],
    logs: []
  };
  Cities.find().exec(function(err, city){
    if (err || city.length === 0) {
      context.cities = [{ cityName: 'no cities recorded yet', cityStatus: false }];
    } else {
      context.cities = city;
    }
  }).then(function(){
    var yesterday = new Date();
    yesterday.setHours(2,0,0,0);
    Protocols.find({ 'date': {"$gt": yesterday }})
            .populate('user', 'username')
            .exec(function(err, logs){
      var help = logs.forEach(function(logItem, logIndex){
        context.logs.push({
          type: logItem.type,
          date: logItem.date,
          user: logItem.user.username
        });
      });
    }).then(function(){
      Proposals.find({ proposalStatus: { $ne: 'completed'}})
              .populate('proposalBy', 'username')
              .exec(function(err, proposal){
        if (err) { console.log('Something went wrong')} else {
          context.proposals = proposal;
        }
        LSUsers.find()
            .select('username name gender age role selectedCity created isAuthenticated')
            .limit(5)
            .sort({ 'created': 'desc' })
            .exec(function(err, users){
          if (err) {
            console.log('Something went wrong');
          } else {
            context.users = users;
          }
          Suppliers.find()
                  .select('supplierName supplierType supplierCity')
                  .limit(5)
                  .sort({ 'suppplierCreated': 'desc'})
                  .exec(function(err, suppliers){
            if (err) {
              console.log('Something went wrong');
            } else {
              context.suppliers = suppliers;
            }
            Prospects.find()
                  .select('prospectEmail isAuthenticated created')
                  .limit(5)
                  .sort({ 'created': 'desc'})
                  .exec(function(err, prospect){
              if (err) {
                console.log('Something went wrong');
              } else {
                context.prospects = prospect;
              }
              Contacts.find()
                      .limit(5)
                      .sort({ 'created': 'desc'})
                      .exec(function(err, contact){
                if(err){
                  console.log('Something went wrong');
                } else {
                  context.contacts = contact;
                }
                res.render('../client/admin/admin', context);
              });
            });
          });
        });
      });
    });
  });
};

function recordCity(req, res){
  console.log('*** client/admin/index.js route POST - /admin/city - ');
  Cities.findOne({ cityName: req.body.cityName}, function(err, city){
    if (err || city != null) {
      console.log('City already in database or query error');
      console.log(err);
      res.status(403).json();
    } else {
      var cityData = new Cities({
        cityName: req.body.cityName,
        cityStatus: false
      });
      cityData.save(function(err, newCity){
        if(err) {
          res.status(500).json();
        } else {
          res.json(newCity._id);
        }
      });
    }
  });
};

function setCityStatus(req, res) {
  console.log('*** client/admin/index.js route PUT - /admin/city - ');
  if (req.body){
    Cities.findByIdAndUpdate( req.body.cityId,
            {$set: {'cityStatus': req.body.cityStatus }},
            {safe: true, upsert: true, new : true}, function(err, city) {
      if (err || !city) {
        console.log('City could not be modified');
        res.status(404).json();
      } else {
        res.json();
      }
    });
  } else {
    res.status(404).json();
  }
};

function setProposalStatus(req, res) {
  console.log('*** client/admin/index.js route PUT - /admin/proposal - ');
  if (['recorded', 'assigned', 'completed', 'rejected'].indexOf(req.body.proposalStatus) < 0) {
    console.log('Request new status ' + req.body.proposalStatus + ' is unknown and not allowed to be saved to db');
    res.status(404).json();
  } else {
    if (req.body){
      Proposals.findByIdAndUpdate( req.body.proposalId,
              {$set: {'proposalStatus': req.body.proposalStatus }},
              {safe: true, upsert: true, new : true}, function(err, proposal) {
        if (err || !proposal) {
          console.log('Proposal could not be modified');
          res.status(404).json();
        } else {
          res.json();
        }
      });
    } else {
      res.status(404).json();
    }
  }
};