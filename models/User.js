// Imports
var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({    
    username : { type : String, match: /^[a-zA-Z0-9-_]+$/ },
    email : { type: String, match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ },
    password: String,
    bio: { type : String, default : '' },
    birthday: { type : Date, default : Date.now() },
    dateCreated : { type : Date, default : Date.now() },
    isAdmin: { type : Boolean, default : 0 }
  });


module.exports = mongoose.model('users', userSchema);