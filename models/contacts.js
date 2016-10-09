var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ContactsSchema = new Schema({
	contactName: { type: String, required:true },
	contactEmail: { type: String, required:true, unique:true },
	contactText: String,
	contactStatus: { type: Boolean, required:true },
	created: Date
});

var Contacts = mongoose.model('Contacts', ContactsSchema, 'contacts');
module.exports = Contacts;