'use strict'

module.exports = function(app) {
	app.use('/signup',			require('./client/signup'));
	app.use('/supply', 			require('./client/supply'));
	app.use('/offers', 			require('./client/offers'));
	app.use('/profile', 		require('./client/profile'));
	app.use('/admin',				require('./client/admin'));
	app.use('/legal',				require('./client/legal'));
	app.use('/login', 			require('./client/landingpage'));
	app.use('/', 						require('./client/landingpage'));
}