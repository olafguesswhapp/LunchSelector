var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Suppliers = require('./suppliers.js');
var uniqueValidator = require('mongoose-unique-validator');
var bcrypt = require('bcrypt'),
	SALT_WORK_FACTOR = 10;

var LSUsersSchema = new Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	name: String,
	role: String,
	created: Date,
	gender: Number,
	age: Number,
	selectedCity: String,
	preferredSuppliers1: [{ type: Schema.Types.ObjectId, ref: 'Suppliers' }],
	supplier: [{ type: Schema.Types.ObjectId, ref: 'Suppliers' }]
});

// make sure username (email) is unique
LSUsersSchema.plugin(uniqueValidator, { message: 
	'Diese Email-Adresse (Email = Username) wird bereits von einem anderen User verwendet.' });

// Bcrypt middleware
LSUsersSchema.pre('save', function(next, done) {
	var user = this; 
	if(!user.isModified('password')) return next(); // Bcrypt middleware
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
		if(err) return next(err);
		bcrypt.hash(user.password, salt, function(err, hash) {
			if(err) return next(err);
			user.password = hash;
			next();
		});
	});
});

// Password verification
LSUsersSchema.methods.comparePassword = function(candidatePassword, cb) {
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
		if(err) return cb(err);
		cb(null, isMatch);
	});
};

var LSUsers = mongoose.model('LSUsers', LSUsersSchema, 'lsusers');
module.exports = LSUsers;