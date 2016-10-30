'use strict';

var Quotes = require('../models/quotes');

function selectQuote(type){
  return new Promise(function(resolve, reject){
    console.log('lib/quoteservice');
    Quotes.find({'quoteStatus': true, 'quoteType': type})
        .exec(function(err, quotes){
      if (err || quotes.length < 1){
        console.log('Something wrong - did not find any quotes');
        var context = { quoteAuthor: 'Bitte erneut Versuchen', quoteText: 'Es ist ein Fehler aufgetreten'};
        resolve (context);
      } else {
        var quoteCount = Math.floor(Math.random() * quotes.length);
        var context = { quoteAuthor: quotes[quoteCount].quoteAuthor, quoteText: quotes[quoteCount].quoteText};
        resolve (context);
      }
    });
  });
};

exports.selectQuote = selectQuote;
