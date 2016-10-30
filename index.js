var express = require('express');
var path = require('path')
var app = express()
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var sm = require('sitemap');
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

var sitemap = sm.createSitemap ({
  hostname: 'https://mytiffin.de',
  cacheTime: 600000,        // 600 sec - cache purge period 
  urls: [
    { url: '/offers/',  changefreq: 'daily', priority: 0.4 },
    { url: '/offers/select/',  changefreq: 'weekly',  priority: 0.2 },
    { url: '/profile/', changefreq: 'monthly',  priority: 0.1},
    { url: '/signup/', changefreq: 'daily',  priority: 0.1},
    { url: '/supply/',   changefreq: 'weekly',  priority: 0.05 },
    { url: '/legal/datenschutz/', changefreq: 'monthly',  priority: 0.05 },
    { url: '/legal/impressum/', changefreq: 'monthly',  priority: 0.05 },
    { url: '/legal/contact/', changefreq: 'monthly',  priority: 0.05 },
  ]
});

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
      },
      displayDate: function(datum) {
        var weekday = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        var months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
        var d = new Date(datum);
        return weekday[d.getDay()] + ', ' + d.getDate() + '.' + months[d.getMonth()];
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
// flash message middleware
app.use(function(req, res, next){
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});
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

app.get('/google4f103d190bd74d31.html',function(req,res){
  res.sendFile('/google4f103d190bd74d31.html');
});

app.get('/sitemap.xml', function(req, res) {
  sitemap.toXML( function (err, xml) {
    if (err) {
      return res.status(500).end();
    }
    res.header('Content-Type', 'application/xml');
    res.send( xml );
  });
});

// 404 catch-all handler (middleware)
app.use(function(req, res, next){
  res.status(404);
  res.redirect('/');
});

// 500 error handler (middleware)
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.redirect('/');
});

// https.createServer(sslOptions, app).listen(app.get('port'), function(){
//     console.log('Express HTTPS started in ' + app.get('env') + ' mode on port ' + app.get('port') + '.');
// });

// IN ORDER TO RUN ON HTTP instead of https
var server = app.listen(app.get('port'), function () {
  console.log('Server running at http://localhost:' + server.address().port + ' in ' + app.get('env') )
})