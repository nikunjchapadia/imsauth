var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var User = require('../app/models/user');
var configAuth = require('./auth');

module.exports = function (passport) {

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {

            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {

                User.findOne({ 'local.email': email }, function (err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        return done(null, false, req.flash('signupMessage', 'User already exist with this email.'));
                    } else {
                        var newUser = new User();
                        newUser.local.email = email;
                        newUser.local.password = newUser.generateHash(password);
                        newUser.save(function (err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            });
        }));

    passport.use('local-login', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {
          console.log('Handling Local login : ' + email + '-' + password);
            User.findOne({'local.email': email}, function (err, user) {
                if (err)
                  return done(err);
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Wrong password'));
                    console.log({user :user});
                return done(null,user);
            });
        }));

    passport.use(new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL,
            passReqToCallback: true
        },
        function (req, token, refreshToken, profile, done) {
            process.nextTick(function () {
                if (!req.user) {
                    User.findOne({ 'facebook.id': profile.id }, function (err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            return done(null, user);
                        } else {
                            var newUser = new User();
                            newUser.facebook.id = profile.id;
                            newUser.facebook.token = token;
                            newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                            // facebook can return multiple emails so we'll take the first , i think its good idea to store all of them it will be handy
                            newUser.facebook.email = profile.emails[0].value;
                            newUser.save(function (err) {
                                if (err)
                                    throw err;
                                console.log(newUser);
                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    var user = req.user;
                    user.facebook.id = profile.id;
                    user.facebook.token = token;
                    user.facebook.name = profile.name.givenName + ' ' + profile.name.familyName;
                    user.facebook.email = profile.emails[0].value;
                    user.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        console.log(user);
                        return done(null, user);
                    });
                }
            });
        }));

    passport.use(new TwitterStrategy({
            consumerKey: configAuth.twitterAuth.consumerKey,
            consumerSecret: configAuth.twitterAuth.consumerSecret,
            callbackURL: configAuth.twitterAuth.callbackURL,
            passReqToCallback: true
        },
        function (req, token, tokenSecret, profile, done) {
            process.nextTick(function () {
                if (!req.user) {
                    User.findOne({ 'twitter.id': profile.id }, function (err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            return done(null, user);
                        } else {
                            console.log('Token : ' + token);
                            console.log('Token Secret : ' + tokenSecret);
                            console.log(JSON.stringify(profile));
                            console.log('ID : ' + profile.id);
                            console.log('User Name : ' + profile.username);
                            console.log('Display Name : ' + profile.displayName);
                            var newUser = new User();
                            newUser.twitter.id = profile.id;
                            newUser.twitter.token = token;
                            newUser.twitter.tokenSecret = tokenSecret;
                            newUser.twitter.username = profile.username;
                            newUser.twitter.displayName = profile.displayName;
                            newUser.save(function (err) {
                                if (err) throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    var user = req.user;
                    user.twitter.id = profile.id;
                    user.twitter.token = token;
                    user.twitter.tokenSecret = tokenSecret;
                    user.twitter.username = profile.username;
                    user.twitter.displayName = profile.displayName;
                    user.save(function (err) {
                        if (err) {
                            throw err;
                        }
                        console.log(user);
                        return done(null, user);
                    });
                }
            });
        }));

    passport.use(new GoogleStrategy({
            clientID: configAuth.googleAuth.clientID,
            clientSecret: configAuth.googleAuth.clientSecret,
            callbackURL: configAuth.googleAuth.callbackURL,
            passReqToCallback: true
        },
        function (req, token, refreshToken, profile, done) {
            process.nextTick(function () {
                if (!req.user) {
                    User.findOne({ 'google.id': profile.id }, function (err, user) {
                        if (err)
                            return done(err);
                        if (user) {
                            return done(null, user);
                        } else {
                            var newUser = new User();
                            newUser.google.id = profile.id;
                            newUser.google.token = token;
                            newUser.google.name = profile.displayName;
                            newUser.google.email = profile.emails[0].value;
                            newUser.save(function (err) {
                                if (err) throw err;
                                return done(null, newUser);
                            });
                        }
                    });
                } else {
                    var user = req.user;
                    user.google.id = profile.id;
                    user.google.token = token;
                    user.google.name = profile.displayName;
                    user.google.email = profile.emails[0].value;
                    user.save(function (err) {
                        if (err) throw err;
                        return done(null, user);
                    });
                }
            });
        }));

}
