'use strict';

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		console.log('');
		console.log('isAuthenticated = true');
		return next();
	} else {
		res.redirect('/');
	}
}

exports.isLoggedIn = isLoggedIn;