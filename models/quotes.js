var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuotesSchema = new Schema({
	quoteText: String,
	quoteAuthor: String,
	quoteType: Number,
	quoteStatus: Boolean
});

var Quotes = mongoose.model('Quotes', QuotesSchema, 'quotes');
module.exports = Quotes;