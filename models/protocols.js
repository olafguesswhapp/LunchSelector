var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var LSUsers = require('./lsusers');

var ProtocolsSchema = new Schema({
	date: Date,
	user: { type: Schema.Types.ObjectId, ref: 'LSUsers' },
	type: Number // 1= request Offers, 2 = Select-Site, 3 = Join-Favorit-R., 4 =request R., 5 = remove R. from Favorits, etc.
});

var Protocols = mongoose.model('Protocols', ProtocolsSchema, 'protocols');
module.exports = Protocols;