var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CitiesSchema = new Schema({
	cityName: String,
	cityStatus: Boolean
});

var Cities = mongoose.model('Cities', CitiesSchema, 'cities');
module.exports = Cities;