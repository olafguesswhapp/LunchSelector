'use strict';

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		console.log('isAuthenticated = true');
		if(req.user.isAuthenticated === true){
			return next();
		} else {
			console.log('isAuthenticated = true but User has not verified Email');
			res.redirect('/');
			return;
		}
		return next();
	} else {
		console.log('isAuthenticated = false');
		res.redirect('/');
	}
}

function isLoggedInAsSupplier(req, res, next) {
	if(req.isAuthenticated()){
		if (req.user.role==='supplier' || req.user.role === 'admin') {
			if(req.user.isAuthenticated === true){
				console.log('isAuthenticated as supplier = true');
				return next();
			} else {
				console.log('isAuthenticated = true but User has not verified Email');
				res.redirect('/');
			}
		} else {
			console.log('not authenticated as supplier! redirect to /offers');
			res.redirect('/offers');
		}
	} else {
		console.log('isAuthenticated = false');
		res.redirect('/');
	}
}

function isLoggedInAsAdmin(req, res, next) {
	if(req.isAuthenticated()){
		if (req.user.role==='admin') {
			console.log('');
			console.log('isAuthenticated as admin = true');
			return next();
		} else {
			console.log('not authenticated as admin! redirect to /offers');
			res.redirect('/offers');
		}
	} else {
		console.log('isAuthenticated = false');
		res.redirect('/');
	}
}

exports.isLoggedIn = isLoggedIn;
exports.isLoggedInAsSupplier = isLoggedInAsSupplier;
exports.isLoggedInAsAdmin = isLoggedInAsAdmin;