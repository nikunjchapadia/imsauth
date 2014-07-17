//IMS app

var express= require('express');
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');

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

// routes
router.use(function (req, res, next) {
    console.log('Handling api request ...');
    // do all kind of common validation here for each request
    // if we build oauth based than we validate access token for each request here
    next();
});

router.get('/', function (req, res) {
    res.json({ message: 'Welcome to IMs API :) '});
});

router.get('/login',isLoggedIn, function(req,res){
    console.log('GET : /login');
      res.redirect('/')
  });

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }) );

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


// // Authentication
router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: '/profile',
    failureRedirect: '/'
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
