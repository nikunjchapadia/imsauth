//IMS app

var express= require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var url = require('url');
var _ = require('underscore');
var cors = require('cors');


var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var configDB = require('./config/database.js');

var router = express.Router();
var app = express();
var port = 8080;

mongoose.connect(configDB.url);
require('./config/passport')(passport);

console.log('DB : ' + configDB.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('DB is running');
});

var User = require('./app/models/user');

// setup app
app.use(logger('dev'));
app.use(cookieParser());
app.use(bodyParser());

app.set('view engine', 'ejs');

// passport
app.use(session({
  secret : 'ilovescotchscotchyscotchscotch'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
router.use(cors());

// routes
router.use(function (req, res, next) {
    console.log('Handling api request ...');
    // do all kind of common validation here for each request
    // if we build oauth based than we validate access token for each request here
    // Website you wish to allow to connect

    var domains = ["facebook","localhost","localhost:8080","localhost:9000","http://localhost:8080","http://localhost:9000"];
    res.header('Access-Control-Allow-Credentials', true);
    var origin = req.headers['origin'];
    if (origin) {
      var hostname = url.parse(origin).hostname;
      console.log(hostname);
      var allowed = _.any(domains, function(domain) {
        return (domain === '*') || (hostname.match("(^|\\.)" + domain.replace(/\./, '\\.') + "$") !== null);
      })
      if (allowed) {
        console.log("Allowed " + allowed);
        console.log("Origin " + origin);
        res.header('Access-Control-Allow-Origin', origin);
      }else{
        res.header('Access-Control-Allow-Origin', '*');
      }
    }
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Origin, Referer, User-Agent, Content-Type, Authorization')

    //res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    //res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    //res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

router.get('/', function (req, res) {
    res.json({ message: 'Welcome to IMs API :) '});
});

router.get('/login',isLoggedIn, function(req,res){
    console.log('GET : /login');
      res.redirect('/')
  });

router.post('/login',
 passport.authenticate('local-login'),function(req,res){
    return res.json(req.user)
  });

// Authentication

// router.get('/facebook',function(req,res){
//   //res.redirect('/auth/facebook');
//   router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));
// });

router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

router.get('/auth/facebook/callback',
   passport.authenticate('facebook'), function(req,res){
     console.log('sending facebook auth data');
       return res.json(req.user);
});


router.get('/logout', function (req, res) {
    req.logout();
    console.log('logout ....');
    res.redirect('/');
});

router.get('/profile', function(req,res){
    console.log('GET : /profile');
    console.log({ loginuser : req.user });
    if(!req.user){
      res.json({'message' :'User is not login, please login first'});
    }
    res.json({user : req.user});
  });

router.route('/users')
    .get(function (req, res) {
        console.log('GET : /users');
        User.find(function (err, users) {
            if (err)
                res.send(err);
            res.json(users);
        });
    })
    .post(function (req, res) {
        console.log('POST : /users');
    });


router.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
});

router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
}));



router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback', passport.authenticate('twitter', {
    successRedirect: '/profile',
    failureRedirect: '/'
}));

router.route('/auth/google')
  .get(passport.authenticate('google', { scope : ['profile', 'email'] }));

router.route('/auth/google/callback')
  .get(passport.authenticate('google', {
    successRedirect: '/profile',
    failureRedirect: '/'
}));

// // Authorization
// router.get('/connect/local', function(req, res) {
//     res.render('connect-local.ejs', { message: req.flash('loginMessage') });
// });
// router.post('/connect/local', passport.authenticate('local-signup', {
//     successRedirect : '/profile',
//     failureRedirect : '/connect/local',
//     failureFlash : true
// }));

router.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

router.get('/connect/facebook/callback',
    passport.authorize('facebook', {
        successRedirect : '/profile',
        failureRedirect : '/'
}));

router.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

router.get('/connect/twitter/callback',
    passport.authorize('twitter', {
        successRedirect : '/profile',
        failureRedirect : '/'
}));

// app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));
//
// app.get('/connect/google/callback',
//     passport.authorize('google', {
//         successRedirect : '/profile',
//         failureRedirect : '/'
// }));

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}
























app.use('/', router);
app.listen(port);
console.log('Server running on port : ' + port);
