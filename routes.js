'use strict'

module.exports = function(app) {
	app.use('/signup',			require('./client/signup'));
	app.use('/supply', 			require('./client/supply'));
	app.use('/offers', 			require('./client/offers'));
	app.use('/profile', 		require('./client/profile'));
}