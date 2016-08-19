'use strict';

var express = require('express');
var router = express.Router();
var Cities = require('../../models/cities');
var Proposals = require('../../models/proposals');
var authentication = require('../../lib/authentication');

router.get('/', authentication.isLoggedInAsAdmin, displayAdmin);
router.post('/city', authentication.isLoggedInAsAdmin, recordCity);
router.put('/city', authentication.isLoggedInAsAdmin, setCityStatus);

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
  }).then(function(){
    Proposals.find({ proposalStatus: { $ne: 'completed'}})
            .populate('proposalBy', 'username')
            .exec(function(err, proposal){
      if (err) { console.log('Something went wrong')} else {
        context.proposals = proposal;
      }
      console.log(context);
      res.render('../client/admin/admin', context);
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
          console.log(newCity);
          res.json(newCity._id);
        }
      });
    }
  });
};

function setCityStatus(req, res) {
  console.log('*** client/admin/index.js route PUT - /admin/city - ');
  console.log(req.body);
  if (req.body){
    Cities.findByIdAndUpdate( req.body.cityId,
            {$set: {'cityStatus': req.body.cityStatus }},
            {safe: true, upsert: true, new : true}, function(err, city) {
      if (err || city.length === 0) {
        console.log('City could not be modified');
        res.status(404).json();
      } else {
        console.log(city);
        res.json();
      }
    });
  } else {
    res.status(404).json();
  }
};