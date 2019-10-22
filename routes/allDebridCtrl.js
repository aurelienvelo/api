// Imports
var express     = require('express');
var jwtUtils    = require('../utils/jwt.utils');
var allDebridUtils = require('../utils/allDebrid.utils');

// Routes
module.exports = {
    postAllDebrid: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);
        if (userId < 0) {
            return res.status(401).json({ 'status': 401, 'message': 'wrong token', 'result': 'wrong token' });
        }

        // Params
        var link   = req.body.link;
        
        if (link == null) {
            return res.status(400).json({ 'status': 400, 'message': 'missing parameters', 'result': 'missing parameters' });
        }

        allDebridUtils.GetDownloadLink(link, '')
        .then(response => { 
            // console.log(response.data);
            res.status(200).json({'status': 200, 'message': 'OK', 'result': response.data });            
        })        
    }
}