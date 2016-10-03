'use strict';

var express = require('express');
var router = express.Router();
var LSUsers = require('../../models/lsusers');
var Suppliers = require('../../models/suppliers');
var Cities = require('../../models/cities');
var Proposals = require('../../models/proposals');
var Prospects = require('../../models/prospects');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedInAsAdmin, displayAdmin);
router.post('/city', authentication.isLoggedInAsAdmin, recordCity);
router.put('/city', authentication.isLoggedInAsAdmin, setCityStatus);
router.put('/proposal', authentication.isLoggedInAsAdmin, setProposalStatus);

module.exports = router;

function displayAdmin (req, res) {
  console.log('*** client/admin/index.js route - /admin - ');
  var context;
  Cities.find().exec(function(err, city){
    context = { cities: []};
    if (err || city.length === 0) {
      context.cities = [{ cityName: 'no cities recorded yet', cityStatus: false }];
    } else {
      context.cities = city;
    }
    return context;
  }).then(function(){
    Proposals.find({ proposalStatus: { $ne: 'completed'}})
            .populate('proposalBy', 'username')
            .exec(function(err, proposal){
      if (err) { console.log('Something went wrong')} else {
        context.proposals = proposal;
      }
      LSUsers.find()
          .select('username name gender age role selectedCity created')
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
            res.render('../client/admin/admin', context);
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