var express = require('express');
var path = require('path')
var app = express()
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var credentials = require('./credentials.js');
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
        if (timeOpen<currentTime && currentTime<timeClose) {return 'geöffnet';} else {return 'geschlossen';}
      },
      checkVar: function(varA, varB, ifTrue, ifFalse) {
        if (varA === varB) {
          return ifTrue;
        } else {
          return ifFalse;
        }
      },
      checkRole: function(roleA, roleB) {
        return (roleA === roleB);
      }
    }
});	
app.engine('handlebars', exphbs.engine);
app.set('view engine', 'handlebars');

if (app.get('env') == 'development') {
    app.set('port', process.env.PORT || 3000);
} else if (app.get('env') == 'production') {
    app.set('port', process.env.PORT || 61099); // Uberspace
}

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
app.use(function(req, res, next){
  if (req.user){res.locals.role = req.user.role;} else {res.locals.role = ''}
  return next();
});

// app.all('*', function(req, res, next){
//   console.log(req.url);
//   console.log(req.method);
//   console.log(req.body);
//   next()}
// );

require('./routes.js')(app);

// All other routes should redirect to the Landing Page
app.all('/*', function(req, res) {
  res.redirect(303, '/');
})

// https.createServer(sslOptions, app).listen(app.get('port'), function(){
//     console.log('Express HTTPS started in ' + app.get('env') + ' mode on port ' + app.get('port') + '.');
// });

// IN ORDER TO RUN ON HTTP instead of https
var server = app.listen(app.get('port'), function () {
  console.log('Server running at http://localhost:' + server.address().port + ' in ' + app.get('env') )
})