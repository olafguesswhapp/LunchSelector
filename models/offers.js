var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Suppliers = require('./suppliers.js');

var OffersSchema = new Schema({
	offerDate: Date,
	offerCategory: Number, // 1 = lunch
	offerName: String,
	offerPrice: Number,
	offerSortIndex: Number,
	offerSupplier: { type: Schema.Types.ObjectId, required: true, ref: 'Suppliers'},
});

var Offers = mongoose.model('Offers', OffersSchema, 'offers');
module.exports = Offers;