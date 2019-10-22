// Imports
var express     = require('express');
var jwtUtils    = require('../utils/jwt.utils');
//var request = require("request");

// Constantes
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const TOKEN = process.env.API_KEY_TMDB_V3;

// Routes
module.exports = {    
    postTheMovieDb: function(req, res) {
        // Getting auth header
        var headerAuth  = req.headers['authorization'];
        var userId      = jwtUtils.getUserId(headerAuth);
        if (userId < 0) {
            return res.status(400).json({ 'error': 'wrong token' });
        }
        
        // Params
        var query = req.body.query;
        var page = req.body.page > 1 ? req.body.page : 1;
        
        if (query == null) {
            return res.status(400).json({ 'error': 'missing parameters' });
        }

        var options = { method: 'GET',
        url: 'https://api.themoviedb.org/3/search/multi',
        qs: 
        { include_adult: 'false',
          page: page,
          query: query,
          language: 'en-US',
          api_key: TOKEN 
        },
        body: '{}' };

        // request(options, function (error, response, body) {
        //     if (error) return res.status(500).json(error);
        //     if (response.statusCode !== 200) return res.status(response.statusCode).json(body);
        //     //console.log(body);
        //     res.status(200).json(body);
        // });             
    }
}