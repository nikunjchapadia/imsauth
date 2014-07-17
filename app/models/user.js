// user model
var logger = require('morgan');
var mongoose = require('mongoose');
var crypto = require('bcrypt-nodejs');
//console.log(mongoose);

var userSchema = mongoose.Schema({

  local : {
    email : String,
    password : String
  },
  facebook :{
    id : String,
    token : String,
    email : String,
    name : String
  },
  twitter :{
    id : String,
    token : String,
    tokenSecret : String,
    email : String,
    name : String,
    username : String,
    displayName : String
  },
  google :{
    id : String,
    token : String,
    email : String,
    name : String
  }

});

console.log('Schema : '+ JSON.stringify(userSchema));

userSchema.methods.generateHash = function(password){
  console.log('Generate Hash for password : ' +password);
  return crypto.hashSync(password, crypto.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password){
  console.log('Validate Password : ' + password);
  return crypto.compareSync(password,this.local.password);
}

module.exports = mongoose.model('User', userSchema);
