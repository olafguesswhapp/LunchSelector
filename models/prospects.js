var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ProspectsSchema = new Schema({
	prospectEmail: { type: String, required:true, unique:true },
	authToken: { type: String, required:true, unique: false },
	isAuthenticated: { type: Boolean, required:true },
	prospectChecked: Boolean,
	hasOptedIn: { type: Boolean, required:true },
	created: Date
});

var Prospects = mongoose.model('Prospects', ProspectsSchema, 'prospects');
module.exports = Prospects;