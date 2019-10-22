// Imports
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var UserModel  = require('../models/User');
var MessageModel   = require('../models/Message');
var asyncLib = require('async');
var jwtUtils = require('../utils/jwt.utils');

// Constants
const TITLE_LIMIT   = 2;
const CONTENT_LIMIT = 4;
const ITEMS_LIMIT   = 50;

// Routes
module.exports = {
  createMessage: function(req, res) {
    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
      return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
    }

    // Params
    var title   = req.body.title;
    var content = req.body.content;

    if (title == null || content == null) {
      return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
    }

    if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
      return res.status(400).json({ 'status': 400, 'message': 'invalid parameters', 'result': 'invalid parameters' });
    }

    asyncLib.waterfall([
      function(done) {
        UserModel.findById(userId, function (err, userFound) {
            if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' }); 
            done(null, userFound);
        })        
      },
      function(userFound, done) {
        if(userFound) {
            var newMessage = new MessageModel({
                title: title,
                content: content,
                UserId : userFound.id,
                User: userFound._id,
                dateCreated: Date.now()
            });
            newMessage.save(function (err, newMessage) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot save message', 'result': 'cannot save message' });
                done(newMessage);
            });
        } else {
          res.status(404).json({ 'status': 404, 'message': 'user not found', 'result': 'user not found' });
        }
      },
    ], function(newMessage) {
      if (newMessage) {
        return res.status(201).json({ 'status': 201, 'message': 'OK', 'result': newMessage });
      } else {
        return res.status(500).json({ 'status': 500, 'message': 'cannot post message', 'result': 'cannot post message' });
      }
    });
  },
  listMessages: function(req, res) {
    var fields  = req.query.fields;
    var limit   = parseInt(req.query.limit);
    var offset  = parseInt(req.query.offset);
    var order   = req.query.order;

    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
      return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
    }
    
    if (limit > ITEMS_LIMIT) {
      limit = ITEMS_LIMIT;
    }

    fields  = (fields !== '*' && fields != null) ? fields : '';
    limit   = (!isNaN(limit)) ? limit : ITEMS_LIMIT;
    offset  = (!isNaN(offset)) ? offset : 0;
    order   = (order != null) ? order : '-dateCreated';

    MessageModel.find({}, fields, { skip: offset, limit: limit, sort: order }, function(err, messages) {
        if (err) {            
            console.log(err);
            res.status(500).json({ 'status': 500, 'message': 'invalid fields', 'result': 'invalid fields' });        
        }
        if (messages) {
            res.status(200).json({ 'status': 200, 'message': MessageModel.length.toString(), 'result': messages });
        } else {
            res.status(404).json({ 'status': 404, 'message': 'no messages found', 'result': 'no messages found' });
        }
    })
  },
  getMessage: function(req, res) {
    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
        return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
    }

    // Params request
    if (!req.params.messageId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
    var paramId = req.params.messageId;

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
            MessageModel.findOne({ '_id': ObjectId(paramId) }, 'title content attachment link dateModified', function (err, messageFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify message', 'result': 'unable to verify message' });
                done(messageFound);
            })
            .catch (function(err) {
                return res.status(500).json({ 'status': 500, 'message': 'unable to verify message', 'result': 'unable to verify message' });
            })
        }
    ], function(messageFound) {
        if (messageFound) {
            // console.log(userFound);
            return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': messageFound });
        } else {
            return res.status(500).json({ 'status': 500, 'message': 'cannot find message', 'result': 'cannot find message' });
        }
    });
  },
  updateMessage: function(req, res) {
    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);

    if (userId < 0) {
        return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
    }

    // Params request
    if (!req.params.messageId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
    var paramId = req.params.messageId;

    // Params
    let title = req.body.title;
    let content = req.body.content;
    let attachment = req.body.attachment;
    let link = req.body.link;
    
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
            MessageModel.findOne({ '_id': ObjectId(paramId) }, 'title content attachment link dateModified', function (err, messageFound) {
                if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify message', 'result': 'unable to verify message' });
                done(null, messageFound);
            })
            .catch (function(err) {
                return res.status(500).json({ 'status': 500, 'message': 'unable to verify message', 'result': 'unable to verify message' });
            })
        },
        function(messageFound, done) {
            if(messageFound) {                    
                MessageModel.updateOne({ '_id': ObjectId(paramId) }, 
                    { 
                      title: (title ? title : messageFound.title),
                      content: (content ? content : messageFound.content),
                      attachment: (attachment ? attachment : messageFound.attachment),
                      link: (link ? link : messageFound.link),                        
                      dateModified: Date.now()
                    }, 
                    function(err, affected) {
                        if (err) console.log(err);
                        console.log(affected);                            
                    })
                    .then(function() {
                        done(messageFound);
                    }).catch(function(err) {
                        return res.status(500).json({ 'status': 500, 'message': 'cannot update message', 'result': 'cannot update message' });
                    }
                );
            } else {
                return res.status(404).json({ 'status': 404, 'message': 'message not found', 'result': 'message not found' });
            }
        },
    ], function(messageFound) {
        if (messageFound) {
            // console.log(userFound);
            return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': messageFound });
        } else {
            return res.status(500).json({ 'status': 500, 'message': 'cannot update message', 'result': 'cannot update message' });
        }
    });
  },
  delMessage: function(req, res) {
    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);        

    if (userId < 0) {
        return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
    }

    // Params
    if (!req.params.messageId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
    var messageId = req.params.messageId;

    asyncLib.waterfall(
      [
        function(done){
          MessageModel.findById(messageId, '', function(err, messageFound) {
            if (err) return res.status(404).json({ 'status': 404, 'message': 'message not found', 'result': 'message not found' });
            done(messageFound);
          })
        }, 
        function(messageFound) {
          UserModel.findOne({ '_id': ObjectId(userId) }, 'id isAdmin', function (err, userAuth) {
              if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });

              if (messageFound.User._id !== userAuth.id && userAuth.isAdmin === false) { return res.status(401).json({ 'status': 401, 'message': 'Unauthorized', 'result': 'Unauthorized' }); }
              done(null, messageFound);
          })
          .catch (function(err) {
              return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
          });
        }
      ],
      function(messageFound) { 
        MessageModel.deleteOne({ '_id': ObjectId(messageId) }, function(err, affected, result) {
          if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot fetch user', 'result': 'cannot fetch user' });
          return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': result });                                  
        });
      } 
    ); 
  } 
}