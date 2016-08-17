var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

var suppliersSchema = new Schema({
	supplierName: { type: String, required: true, unique: true },
	supplierDescription: String,
	supplierType: String,
	supplierStart: String,
	supplierEnd: String,
	supplierStreet: String,
	supplierZipCode: String,
	supplierCity: String,
	supplierSite: String,
	supplierEmail: String,
	supplierDoesDeliver: Boolean,
	supplierDeliversWith: String,
	suppplierCreated: Date,
});

// make sure username (email) is unique
suppliersSchema.plugin(uniqueValidator, { message: 
	'Dieses Restaurant wurde bereits angemeldet.' });

var Suppliers = mongoose.model('Suppliers', suppliersSchema, 'suppliers');
module.exports = Suppliers;