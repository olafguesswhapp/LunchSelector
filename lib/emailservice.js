'use strict';

var nodemailer = require('nodemailer');
var credentials = require('../credentials.js');


let connection = {
  host: 'schedar.uberspace.de',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: credentials.email.user,
    pass: credentials.email.password
  },
  logger: true
};

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(connection);

// send mail with defined transport object
function sendEmail(recipient, subject, body){
	// setup e-mail data with unicode symbols
	var mailOptions = {
		from: 		'kundenbetreuung@mytiffin.de', // sender address
		to: 			recipient, // list of receivers
	  subject: 	subject, // Subject line
	  text: 		body, // plaintext body
	    // html: '<b>Hello world ✔</b>' // html body
	};
	console.log(mailOptions);
	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			console.log(error);
		}else{
			console.log('Message sent: ' + info.response);
		}
	});
};

exports.sendEmail = sendEmail;