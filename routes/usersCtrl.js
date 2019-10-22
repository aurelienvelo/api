// Imports
var bcrypt  = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var UserModel  = require('../models/User');
var jwtUtils = require('../utils/jwt.utils');
var asyncLib  = require('async');

// Constants
const EMAIL_REGEX     = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//const PASSWORD_REGEX  = /^(?=.*\d).{4,8}$/;
const PASSWORD_REGEX  = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

// Routes
module.exports = {
    register: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);
        
        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        UserModel.findById(userId, function(err, userDemand){
            if (err) return res.status(500).json({ 'status': 500, 'message': 'internal error', 'result': 'internal error' })
            if (!userDemand.isAdmin) return res.status(401).json({ 'status': 401, 'message': 'Unauthorized', 'result': 'Unauthorized, admin only' })
        });

        // Params
        var email       = req.body.email;
        var username    = req.body.username;
        var password    = req.body.password;

        if (email == null || username == null || password == null) {
            return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        }

        // TODO verify pseudo length, mail regex, password etc...
        if (username.length >= 13 || username.length <= 4) {
            return res.status(400).json({ 'status': 400, 'message': 'wrong username (must be length 5 - 12)', 'result': 'wrong username (must be length 5 - 12)' });            
        }
    
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ 'status': 400, 'message': 400, 'result': 'email is not valid' });
        }
    
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).json({ 'status': 400, 'message': 'password invalid', 'result': 'password invalid (The string must contain at least 1 numeric character, one special character, 1 lowercase and 1 uppercase alphabetical character)' });
        }        
        
        asyncLib.waterfall([
            function(done) {                
                UserModel.findOne({ 'email': email }, 'email', function (err, userFound) {
                    if (err) return res.status(409).json({ 'status': 409, 'message': 'user already exist', 'result': 'user already exist' });
                    done(null, userFound); 
                });
            },
            function(userFound, done) {
                if (!userFound) {
                  bcrypt.hash(password, null, null, function( err, bcryptedPassword ) {
                    done(null, userFound, bcryptedPassword);
                  });
                } else {
                  return res.status(409).json({ 'status': 409, 'message': 'user already exist', 'result': 'user already exist' });
                }
            },
            function(userFound, bcryptedPassword, done) {                 
                var newUser = new UserModel({
                  email: email,
                  username: username,
                  password: bcryptedPassword,
                  isAdmin: 0
                });
                newUser.save(function (err, newUser) {
                    if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot add user', 'result': 'cannot add user' });
                    done(newUser);
                });
              }
            ], 
            function(newUser) {
                if (newUser) {
                  return res.status(201).json({ 
                      'status': 201, 
                      'message': 'OK', 
                      'result': { 
                        '_id': newUser.id 
                      } 
                  });
                } else {
                  return res.status(500).json({ 'status': 500, 'message': 'cannot add user', 'result': 'cannot add user' });
                }
            }
        );
    },
    login: function(req, res) {
    
        // Params
        var email    = req.body.email;
        var password = req.body.password;
        
        if (email == null ||  password == null) {
          return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        }

        asyncLib.waterfall([
            function(done) {                
                UserModel.findOne({ 'email': email }, 'email username password isAdmin', function (err, userFound) {
                    if (err) return res.status(409).json({ 'status': 409, 'message': 'user not exist', 'result': 'user not exist' }); 
                    done(null, userFound); 
                });
            },
            function(userFound, done) {
                if (userFound) {
                bcrypt.compare(password, userFound.password, function(errBycrypt, resBycrypt) {                    
                    done(null, userFound, resBycrypt);
                });
                } else {
                    return res.status(404).json({ 'status': 404, 'message': 'user not exist', 'result': 'user not exist' });                    
                }
            },
            function(userFound, resBycrypt, done) {                
                if(resBycrypt) {
                    done(userFound);
                } else {
                    return res.status(403).json({ 'status': 404, 'message': 'invalid password', 'result': 'invalid password' });
                }
            }
        ]
        , function(userFound) {
          if (userFound) {
            return res.status(200).json({
                'status': 200, 'message': 'OK', 'result': {
                    '_id': userFound.id,
                    'username': userFound.username,
                    'token': jwtUtils.generateTokenForUser(userFound),
                    'isAdmin': userFound.isAdmin
                }
            });
          } else {
            return res.status(500).json({ 'status': 404, 'message': 'cannot log on user', 'result': 'cannot log on user' });
          }
        });
    },
    getUsers: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);        

        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        UserModel.find({}, 'id email username isAdmin birtday dateCreated', function (err, users) {
            if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot fetch user', 'result': 'cannot fetch user' });
            if (users) {
                return res.status(201).json({ 'status': 200, 'message': 'OK', 'result': users });
            } else {
                return res.status(404).json({ 'status': 404, 'message': 'users not found', 'result': 'users not found' });
            }
        });  
    },
    getUserById: function (req, res){
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);        

        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        // Params
        if (!req.params.userId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        var paramId = req.params.userId;

        UserModel.findOne({ '_id': ObjectId(paramId) }, 'id email username bio birthday', function (err, userFound) {
            if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot fetch user', 'result': 'cannot fetch user' });
            if (userFound) {
                // console.log(userFound);
                return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': userFound });
            } else {
                return res.status(404).json({ 'status': 404, 'message': 'user not found', 'result': 'user not found' });
            }
        }); 
    },
    updateUserById: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);

        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        // Params request
        if (!req.params.userId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        var paramId = req.params.userId;

        // Params
        var username = req.body.username;
        var bio = req.body.bio;
        var birthday = new Date(req.body.birthday);

        asyncLib.waterfall([
            function(done) {
                UserModel.findOne({ '_id': ObjectId(userId) }, 'id isAdmin', function (err, userAuth) {
                    if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });

                    if (paramId !== userAuth.id && userAuth.isAdmin === false) { return res.status(401).json({ 'status': 401, 'message': 'Unauthorized', 'result': 'Unauthorized' }); }
                    done();
                })
                .catch (function(err) {
                    return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                })
            },
            function(done) {
                UserModel.findOne({ '_id': ObjectId(paramId) }, 'id username bio birthday', function (err, userFound) {
                    if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                    done(null, userFound);
                })
                .catch (function(err) {
                    return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                })
            },
            function(userFound, done) {
                if(userFound) {                    
                    UserModel.updateOne({ '_id': ObjectId(paramId) }, 
                        { 
                            username: (username ? username : userFound.username), 
                            bio: (bio ? bio : userFound.bio), 
                            birthday: (birthday ? birthday : userFound.birthday) 
                        }, 
                        function(err, affected, userFound) {
                            if (err) console.log(err);
                            console.log(affected);                            
                        })
                        .then(function() {
                            done(userFound);
                        }).catch(function(err) {
                            return res.status(500).json({ 'status': 500, 'message': 'cannot update user', 'result': 'cannot update user' });
                        }
                    );
                } else {
                    return res.status(404).json({ 'status': 404, 'message': 'user not found', 'result': 'user not found' });
                }
            },
        ], function(userFound) {
            if (userFound) {
                // console.log(userFound);
                return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': userFound });
            } else {
                return res.status(500).json({ 'status': 500, 'message': 'cannot update user profile', 'result': 'cannot update user profile' });
            }
        });
    },
    delUserById: function (req, res){
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);        

        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        // Params
        if (!req.params.userId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        var paramId = req.params.userId;

        asyncLib.waterfall([
            function(done) {
                UserModel.findOne({ '_id': ObjectId(userId) }, 'id isAdmin', function (err, userAuth) {
                    if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });

                    if (paramId !== userAuth.id && userAuth.isAdmin === false) { return res.status(401).json({ 'status': 401, 'message': 'Unauthorized', 'result': 'Unauthorized' }); }
                    done();
                })
                .catch (function(err) {
                    return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                })
            }],
            UserModel.deleteOne({ '_id': ObjectId(paramId) }, function(err, affected, result) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot fetch user', 'result': 'cannot fetch user' });
                return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': result });                                  
            })
        ); 
    },
    changePassword: function (req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);

        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        // Body request
        if (!req.body.userId || !req.body.password) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        var userId = req.body.userId;
        var newPassword = req.body.password;

        asyncLib.waterfall([
            function(done) {
                UserModel.findOne({ '_id': ObjectId(userId) }, 'id isAdmin', function (err, userAuth) {
                    if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });

                    if (userId !== userAuth.id && userAuth.isAdmin === false) { return res.status(401).json({ 'status': 401, 'message': 'Unauthorized', 'result': 'Unauthorized' }); }
                    done();
                })
                .catch (function(err) {
                    return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                })
            },
            function(done) {
                UserModel.findOne({ '_id': ObjectId(userId) }, 'id username', function (err, userFound) {
                    if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                    done(null, userFound);
                })
                .catch (function(err) {
                    return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                })
            },
            function(userFound, done) {
                if (userFound) {
                  bcrypt.hash(newPassword, 5, function( err, bcryptedPassword ) {
                    done(null, userFound, bcryptedPassword);
                  });
                } else {
                  return res.status(409).json({ 'status': 409, 'message': 'user already exist', 'result': 'user already exist' });
                }
            },
            function(userFound, bcryptedPassword, done) {
                if(bcryptedPassword) {                    
                    UserModel.updateOne({ '_id': ObjectId(userId) }, 
                        { 
                            password: bcryptedPassword 
                        }, 
                        function(err, affected, userFound) {
                            if (err) console.log(err);
                            console.log(affected);                            
                        })
                        .then(function() {
                            done(userFound);
                        }).catch(function(err) {
                            return res.status(500).json({ 'status': 500, 'message': 'cannot update user', 'result': 'cannot update user' });
                        }
                    );
                } else {
                    return res.status(404).json({ 'status': 404, 'message': 'user not found', 'result': 'user not found' });
                }
            },
        ], function(userFound) {
            if (userFound) {
                // console.log(userFound);
                return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': userFound._id });
            } else {
                return res.status(500).json({ 'status': 500, 'message': 'cannot update user profile', 'result': 'cannot update user profile' });
            }
        });
    }
    

}