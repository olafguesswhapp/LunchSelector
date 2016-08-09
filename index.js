var express = require('express')
var path = require('path')
var app = express()
var bodyParser = require('body-parser');

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
app.use(express.static(path.join(__dirname + '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

require('./routes.js')(app);

app.get('/', function (req, res) {
  res.render('landingpage');
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