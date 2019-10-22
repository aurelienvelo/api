// Imports
var express         = require('express');
var usersCtrl       = require('./routes/usersCtrl');
var messagesCtrl    = require('./routes/messagesCtrl');
var likesCtrl       = require('./routes/likesCtrl');
var allDebridCtrl   = require('./routes/allDebridCtrl');
var downloaderCtrl  = require('./routes/downloaderCtrl');
//var tmdbCtrl        = require('./routes/tmdbCtrl');
var mongoose        = require('mongoose');


// Router
exports.router = (function() {
    var apiRouter = express.Router();
    mongoose.connect('mongodb://localhost/www', {useUnifiedTopology: true, useNewUrlParser: true});
    
    // Users routes
    apiRouter.route('/users/login/').post(usersCtrl.login);

    apiRouter.route('/users/').get(usersCtrl.getUsers);
    apiRouter.route('/users/register/').post(usersCtrl.register);   
    apiRouter.route('/users/password/').post(usersCtrl.changePassword);  
    apiRouter.route('/users/:userId').get(usersCtrl.getUserById);
    apiRouter.route('/users/:userId').put(usersCtrl.updateUserById);    
    apiRouter.route('/users/:userId').delete(usersCtrl.delUserById);
    
    // Messages routes
    apiRouter.route('/messages/new/').post(messagesCtrl.createMessage);
    apiRouter.route('/messages/').get(messagesCtrl.listMessages);
    apiRouter.route('/messages/:messageId').get(messagesCtrl.getMessage);
    apiRouter.route('/messages/:messageId').put(messagesCtrl.updateMessage);
    apiRouter.route('/messages/:messageId').delete(messagesCtrl.delMessage);

    // Likes
    apiRouter.route('/messages/:messageId/vote/like').post(likesCtrl.likePost);
    apiRouter.route('/messages/:messageId/vote/dislike').post(likesCtrl.dislikePost);

    // AllDebrid
    apiRouter.route('/debrid').post(allDebridCtrl.postAllDebrid);

    // Downloader
    apiRouter.route('/download').get(downloaderCtrl.getFilesDownload);
    apiRouter.route('/download/:fileId').get(downloaderCtrl.getFileDownload);
    apiRouter.route('/download').post(downloaderCtrl.postFileDownload);
    apiRouter.route('/download/:fileId').delete(downloaderCtrl.delFileDownload);

    // The Move DataBase
    //apiRouter.route('/tmdb').post(tmdbCtrl.postTheMovieDb);

    return apiRouter;
})();