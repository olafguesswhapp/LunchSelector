var express = require('express');
var path = require('path')
var app = express()
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var credentials = require('./credentials.js');
var passport = require('passport');
var auth = require('./lib/auth.js')(app, {
    successRedirect: '/offers',
    failureRedirect: '/',
});

var opts = {
    server: {
        socketOptions: {keepAlive: 1}
    }
};
// do not forget to open a 2nd terminal window and start mongoDB with "mongod" upfront
switch(app.get('env')){
    case 'development':
        var sessionStore = new MongoStore({ mongooseConnection: mongoose.connection,
                                            ttl: 2 * 24 * 60 * 60  });
        mongoose.Promise = global.Promise;
        mongoose.connect(credentials.mongo.development.connectionString, opts);
        console.log('Using MongoDB development mode');
        break;
    case 'production':
        var sessionStore = new MongoStore({ url: credentials.mongo.production.connectionString });
        mongoose.connect(credentials.mongo.production.connectionString, opts);
        console.log('Using MongoDB production mode');
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}

var exphbs  = require('express-handlebars')
	.create({ defaultLayout:'main',
		helpers: {
      restaurantOpen: function(timeOpen, timeClose) {
        var d = new Date();
        var currentTime = d.getHours() + ':' + d.getMinutes();
        if (timeOpen<currentTime && currentTime<timeClose) {return 'open';} else {return 'closed';}
      },
      checkCity: function(selectedCity, dataSetCity, ifTrue, ifFalse) {
        if (selectedCity === dataSetCity) {
          return ifTrue;
        } else {
          return ifFalse;
        }
      }
    }
});	
app.engine('handlebars', exphbs.engine);
app.set('view engine', 'handlebars');

// MIDDLEWARE
app.use(cookieParser(credentials.cookieSecret));
app.use(session({
    secret: credentials.sessionSecret,
    store: sessionStore,
    saveUninitialized: true,
    resave: true
}));
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
auth.init();

require('./routes.js')(app);

app.get('/', function (req, res) {
  console.log('*** index.js route - / - ');
  res.render('landingpage', {layout: 'landingpage'});
})

app.post('/login', function(req, res) {
  console.log('*** index.js route - /login/ - ');
  passport.authenticate('local', function(err, user, info) {
    console.log(err);
    console.log(info);
    if (err) { return next(err) }
    if (!user && info.message == 'Invalid password'){
      console.log('Das Passwort für Username ' + req.body.username + ' stimmt nicht - Bitte versuchen Sie es erneut.');
      return res.redirect('/');
    } else if (!user) {
      console.log('Der Username ' + req.body.username + ' wurde bisher nicht angelegt. Wir freuen uns auf Deine Anmeldung.');
      return res.redirect('/signup');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      console.log(user);
      if (user.role === 'user'){
        return res.redirect('/offers');
      } else {
        return res.redirect('/supply');
      }
    });
  })(req, res);
})


// All other routes should redirect to the Landing Page
app.get('/*', function(req, res) {
  res.redirect(303, '/');
})

// https.createServer(sslOptions, app).listen(app.get('port'), function(){
//     console.log('Express HTTPS started in ' + app.get('env') + ' mode on port ' + app.get('port') + '.');
// });

// IN ORDER TO RUN ON HTTP instead of https
var server = app.listen(3000, function () {
  console.log('Server running at http://localhost:' + server.address().port + ' in ' + app.get('env') )
})