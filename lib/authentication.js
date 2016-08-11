'use strict';

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		console.log('');
		console.log('isAuthenticated = true');
		return next();
	} else {
		console.log('isAuthenticated = false');
		res.redirect('/');
	}
}

function isLoggedInAsSupplier(req, res, next) {
	if(req.isAuthenticated()){
		if (req.user.role==='supplier' || req.user.role === 'admin') {
			console.log('');
			console.log('isAuthenticated as supplier = true');
			return next();
		} else {
			console.log('not authenticated as supplier! redirect to /offers');
			res.redirect('/offers');
		}
	} else {
		console.log('isAuthenticated = false');
		res.redirect('/');
	}
}

exports.isLoggedIn = isLoggedIn;
exports.isLoggedInAsSupplier = isLoggedInAsSupplier;