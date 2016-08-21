var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var LSUSers = require('./lsusers.js');

var ProposalsSchema = new Schema({
	proposalInfo: String,
	proposalUpdate: Boolean,
	proposalRevealToSupplier: Boolean,
	proposalBy: { type: Schema.Types.ObjectId, required: true, ref: 'LSUsers'},
	proposalCreated: Date,
	proposalStatus: String,
	proposalAssignedTo: { type: Schema.Types.ObjectId, required: true, ref: 'LSUsers'}
});

var Proposals = mongoose.model('Proposals', ProposalsSchema, 'proposals');
module.exports = Proposals;