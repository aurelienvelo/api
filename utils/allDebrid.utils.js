// JavaScript Document
var axios = require('axios');

// Constantes
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const TOKEN = process.env.API_KEY_ALLDEBRID;
axios.defaults.baseURL = process.env.API_URL_ALLDEBRID;

// Exports
module.exports = {

  // Fonction
  GetDownloadLink: function(link, password) {
    if (password) {
      var params = {
        agent: 'Mozilla/5.0',
        token: TOKEN,
        link: link,
        password: password
      };
    } else {
      var params = {
        agent: 'Mozilla/5.0',
        token: TOKEN,
        link: link      
      };
    }
        
    try {
      return axios.get('link/unlock', { params });      
    } catch(error) {      
      console.log(error);
    };
    
  } 
}