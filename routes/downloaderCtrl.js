// Imports
var express     = require('express');
var jwtUtils    = require('../utils/jwt.utils');
var ObjectId = require('mongoose').Types.ObjectId;
var FileDownloadModel = require('../models/FileDownload');
var UserModel   = require('../models/User');
var request     = require('request');
var fs          = require('fs');
var path        = require('path');
var asyncLib    = require('async');

// Constants
const TITLE_LIMIT   = 2;
const CONTENT_LIMIT = 4;
const ITEMS_LIMIT   = 50;

// Routes
module.exports = {
    postFileDownload: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);
        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }
        
        // Params
        if (!req.body) {        
            return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        } 
        if (!req.body.infosDownload) {
            return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        } 
        if (!req.body.filename) {
            return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        } 
        var infosFileDownload = req.body.infosDownload;
        var link   = req.body.infosDownload.link;
        var filename = req.body.filename.replace(':', '-');                

        asyncLib.waterfall(
            [
                function(done) {
                    UserModel.findById(userId, function (err, userFound) {
                        if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' }); 
                        done(null, userFound);
                    });
                },
                function(userFound, done){
                    FileDownloadModel.findOne({ filename: filename }, '', function(err, fileFound) {
                        if (fileFound) return res.status(404).json({ 'status': 409, 'message': 'file already exist', 'result': 'file already exist' });
                        done(null, userFound);
                    });
                },
                function(userFound, done) {
                    let fileDownload = new FileDownloadModel({
                        filename: filename,
                        link: link,
                        filepath: path.join(path.resolve('public'), 'download', filename) + '.tmp', 
                        status: 'En attente',
                        userId: userId,
                        user: userFound
                    });
                    fileDownload.save(function (err, newfileDownload) {
                        if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot save file download', 'result': 'cannot save file download' });
                        done(newfileDownload);
                    }); 
                }
            ],
            function(newfileDownload) {
                if (newfileDownload) {
                    downloadFile(newfileDownload);
                    return res.status(200).json({ 'status': 200, 'message': 'download en cours', 'result': 'download en cours' });
                }
                else {
                    return res.status(500).json({ 'status': 500, 'message': 'cannot post filedownload', 'result': 'cannot post filedownload' });
                }
            }
        );
    },
    getFilesDownload: function(req, res) {
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
    
        FileDownloadModel.find({}, fields, { skip: offset, limit: limit, sort: order }, function(err, files) {
            if (err) {            
                console.log(err);
                return res.status(500).json({ 'status': 500, 'message': 'invalid fields', 'result': 'invalid fields' });        
            }
            if (files) {
                // console.log(files)
                return res.status(200).json({ 'status': 200, 'message': FileDownloadModel.length.toString(), 'result': files });
            } else {
                return res.status(404).json({ 'status': 404, 'message': 'no messages found', 'result': 'no messages found' });
            }
        })
    },
    getFileDownload: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);        

        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        // Params
        if (!req.params.fileId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        var fileId = req.params.fileId;

        asyncLib.waterfall(
            [
                function(done){
                    FileDownloadModel.findById(fileId, '', function(err, fileFound) {
                        if (err) return res.status(404).json({ 'status': 404, 'message': 'file not found', 'result': 'file not found' });
                        done(fileFound);
                    });
                }, 
                function(fileFound) {
                    UserModel.findOne({ '_id': ObjectId(userId) }, 'id isAdmin', function (err, userAuth) {
                        if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                        if (fileFound.user.id !== userAuth.id && userAuth.isAdmin === false) { return res.status(401).json({ 'status': 401, 'message': 'Unauthorized', 'result': 'Unauthorized' }); }
                        done(null, fileFound);
                    })
                    .catch (function(err) {
                        return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                    });
                }
            ],
            function(fileFound) {                 
                res.download(fileFound.filepath, fileFound.filename);
            } 
        ); 
    },
    delFileDownload: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);        

        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        // Params
        if (!req.params.fileId) return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        var fileId = req.params.fileId;

        asyncLib.waterfall(
            [
                function(done){
                    FileDownloadModel.findById(fileId, '', function(err, fileFound) {
                        if (err) return res.status(404).json({ 'status': 404, 'message': 'file not found', 'result': 'file not found' });
                        done(fileFound);
                    });
                }, 
                function(fileFound) {
                    UserModel.findOne({ '_id': ObjectId(userId) }, 'id isAdmin', function (err, userAuth) {
                        if (err) return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                        console.log('userAuth ' + fileFound.user);
                        if (fileFound.user.id !== userAuth.id && userAuth.isAdmin === false) { return res.status(401).json({ 'status': 401, 'message': 'Unauthorized', 'result': 'Unauthorized' }); }
                        console.log('userAuth ' + userAuth);
                        done(null, fileFound);
                    })
                    .catch (function(err) {
                        return res.status(500).json({ 'status': 500, 'message': 'unable to verify user', 'result': 'unable to verify user' });
                    });
                }
            ],
            function(fileFound) {                 
                FileDownloadModel.deleteOne({ '_id': ObjectId(fileId) }, function(err, affected, result) {
                    if (err) return res.status(500).json({ 'status': 500, 'message': 'cannot fetch user', 'result': 'cannot fetch user' });
                    return res.status(200).json({ 'status': 200, 'message': 'OK', 'result': result });                                  
                });
            } 
        ); 
    } 
}

function downloadFile(fileDownload){
    // Save variable to know progress
    var received_bytes = 0;
    var total_bytes = 0;

    var req = request({
        method: 'GET',
        uri: fileDownload.link
    });
    
    var out = fs.createWriteStream(fileDownload.filepath);
    req.pipe(out);

    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length']);
        fileDownload.filesize = total_bytes;
        fileDownload.status = "En cours de téléchargement";
        fileDownload.save(function (err, newfile) {
            if (err) console.log(err);
            //console.log(fileDownload);
        });
    });

    req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;
        showProgress(fileDownload, received_bytes, total_bytes);
    });

    req.on('end', function() {        
        fs.rename(fileDownload.filepath, path.join(path.dirname(fileDownload.filepath), fileDownload.filename), (err) => {
            if (err) throw err;
            console.log("File succesfully downloaded: " + fileDownload.filename);
        });
        fileDownload.filepath = path.join(path.dirname(fileDownload.filepath), fileDownload.filename); // remove .tmp
        fileDownload.percent = 100;
        fileDownload.status = "Terminé";
        fileDownload.save(function (err, newfile) {
            if (err) console.log(err);
            //console.log(fileDownload);
        });
    });
}

function showProgress(fileDownload, received,total) {
    var percentage = parseInt((received * 100) / total);
    
    // 50% | 50000 bytes received out of 100000 bytes.
    if (percentage !== fileDownload.percent && percentage !== 100) {
        console.log(fileDownload.filename + " | " + percentage + "% | " + received + " bytes out of " + total + " bytes.");
        fileDownload.percent = percentage;
        fileDownload.save(function (err, newfile) {
            if (err) console.log(err);
            //console.log(fileDownload);
        });
    }
}