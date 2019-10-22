// Imports
var ModelUser   = require('../models/User');
var MessageModel   = require('../models/Message');
var LikeModel   = require('../models/Like');
var ObjectId = require('mongoose').Types.ObjectId;
var jwtUtils = require('../utils/jwt.utils');
var asyncLib = require('async');

// Constants
const DISLIKED = false;
const LIKED    = true;

// Routes
module.exports = {
  likePost: function(req, res) {
    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
      return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
    }

    // Params
    var messageId = req.params.messageId;

    if (messageId <= 0) {
      return res.status(400).json({ 'status': 400, 'message': 'invalid parameters', 'result': 'invalid parameters' });
    }

    asyncLib.waterfall([
        function(done) {
            MessageModel.findById(messageId, function(err, messageFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify message', 'result': 'unable to verify message' }); 
                done(null, messageFound);
            });        
      },
      function(messageFound, done) {
        if(messageFound) {
            ModelUser.findById(userId, function(err, userFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                done(null, messageFound, userFound);
            });
        } else {
          res.status(404).json({ 'status': 404, 'message': 'post already liked', 'result': 'post already liked' });
        }
      },
      function(messageFound, userFound, done) {
        if(userFound) {
            LikeModel.findOne({ User: { '_id': userId }, Message: { '_id': messageId } }, function(err, userAlreadyLikedFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify is user already liked', 'result': 'unable to verify is user already liked' });
                done(null, messageFound, userFound, userAlreadyLikedFound);
            });
        } else {
          res.status(404).json({ 'status': 404, 'message': 'user not exist', 'result': 'user not exist' });
        }
      },
      function(messageFound, userFound, userAlreadyLikedFound, done) {
        if(!userAlreadyLikedFound) {
            userAlreadyLikedFound = new LikeModel( {
                userId: userFound.id,
                User: userFound._id,
                messageId: messageFound.id,
                Message: messageFound._id,
                isLike: LIKED
            });
            userAlreadyLikedFound.save(function (err, userAlreadyLikedFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to set user reaction', 'result': 'unable to set user reaction' });
                done(null, messageFound, userFound);
            });
        } else {
            if (userAlreadyLikedFound.isLike === DISLIKED) {
                LikeModel.updateOne({ '_id': ObjectId(userAlreadyLikedFound.id) }, { isLike: LIKED}, function(err, affected, userFound) {
                    console.log(affected);
                })
                .then(function() {
                    done(null, messageFound, userFound);
                }).catch(function(err) {
                    res.status(500).json({ 'status': 500, 'message': 'cannot update user reaction', 'result': 'cannot update user reaction' });
                });
          } else {
            res.status(409).json({ 'status': 409, 'message': 'message already liked', 'result': 'message already liked' });
          }
        }
      },
      function(messageFound, userFound, done) {
        MessageModel.updateOne({ '_id': ObjectId(messageFound._id) }, { likes: messageFound.likes + 1 }, function(err, affected, userFound) {
            console.log(affected);
        })
        .then(function() {
            done(messageFound);
        }).catch(function(err) {
            res.status(500).json({ 'status': 500, 'message': 'cannot update message like counter', 'result': 'cannot update message like counter' });
        });
      },
    ], function(messageFound) {
      if (messageFound) {
        return res.status(201).json({ 'status': 201, 'message': 'OK', 'result': messageFound });
      } else {
        return res.status(500).json({ 'status': 500, 'message': 'cannot update message', 'result': 'cannot update message' });
      }
    });
  },
  dislikePost: function(req, res) {
    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
      return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
    }

    // Params
    var messageId = req.params.messageId;

    if (messageId <= 0) {
      return res.status(400).json({ 'status': 400, 'message': 'invalid parameters', 'result': 'invalid parameters' });
    }

    asyncLib.waterfall([
        function(done) {
            MessageModel.findById(messageId, function(err, messageFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify message', 'result': 'unable to verify message' }); 
                done(null, messageFound);
            });        
      },
      function(messageFound, done) {
        if(messageFound) {
            ModelUser.findById(userId, function(err, userFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                done(null, messageFound, userFound);
            });
        } else {
          res.status(404).json({ 'status': 404, 'message': 'post already disliked', 'result': 'post already disliked' });
        }
      },
      function(messageFound, userFound, done) {
        if(userFound) {
            LikeModel.findOne({ User: { '_id': userId }, Message: { '_id': messageId } }, function(err, userAlreadyLikedFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify is user already liked', 'result': 'unable to verify is user already liked' });
                done(null, messageFound, userFound, userAlreadyLikedFound);
            });
        } else {
          res.status(404).json({ 'status': 404, 'message': 'user not exist', 'result': 'user not exist' });
        }
      },
      function(messageFound, userFound, userAlreadyLikedFound, done) {
        if(!userAlreadyLikedFound) {
            var newLike = new LikeModel( {
                userId: userFound.id,
                User: userFound._id,
                Message: messageFound._id,
                isLike: DISLIKED
            });
            newLike.save(function (err, newLike) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to set user reaction', 'result': 'unable to set user reaction' });
                done(null, messageFound, userFound);
            });
        } else {
            if (userAlreadyLikedFound.isLike === LIKED) {
                LikeModel.updateOne({ '_id': ObjectId(userAlreadyLikedFound.id) }, { isLike: DISLIKED}, function(err, affected, userFound) {
                    console.log(affected);
                })
                .then(function() {
                    done(null, messageFound, userFound);
                }).catch(function(err) {
                    res.status(500).json({ 'status': 500, 'message': 'cannot update user reaction', 'result': 'cannot update user reaction' });
                });
          } else {
            res.status(409).json({ 'status': 409, 'message': 'message already disliked', 'result': 'message already disliked' });
          }
        }
      },
      function(messageFound, userFound, done) {
        MessageModel.updateOne({ '_id': ObjectId(messageFound.id) }, { likes: messageFound.likes - 1 }, function(err, affected, userFound) {
            console.log(affected);
        })
        .then(function() {
            done(messageFound);
        }).catch(function(err) {
            res.status(500).json({ 'status': 500, 'message': 'cannot update message like counter', 'result': 'cannot update message like counter' });
        });
      },
    ], function(messageFound) {
      if (messageFound) {
        return res.status(201).json({ 'status': 201, 'message': 'OK', 'result': messageFound });
      } else {
        return res.status(500).json({ 'status': 500, 'message': 'cannot update message', 'result': 'cannot update message' });
      }
    });
  }
}