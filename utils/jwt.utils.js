// Imports
var jwt = require('jsonwebtoken');
var role = require('./role');

// Variables environnement
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const JWT_SIGN_SECRET = process.env.JWT_SIGN_SECRET;

// Exported function
module.exports = {
    generateTokenForUser: function(userData) {
        return jwt.sign({
          userId: userData.id,
          isAdmin: userData.isAdmin
        },
        JWT_SIGN_SECRET,
        {
          expiresIn: '1h'
        })
      },
      parseAuthorization: function(authorization) {
        return (authorization != null) ? authorization.replace('Bearer ', '') : null;
      },
      getUserId: function(authorization) {
        var userId = -1;        
        var token = module.exports.parseAuthorization(authorization);
        if(token != null) {
          try {
            var jwtToken = jwt.verify(token, JWT_SIGN_SECRET);
            if(jwtToken != null)
              userId = jwtToken.userId;
          } catch(err) { }
        }
        return userId;
      },
      validateToken: (req, res, next) => {
        let token = req.headers.authorization || req.cookies.token;
        // const authorizationHeader = req.headers.authorization;                
        let result;
        if (token) {          
          const options = {
            expiresIn: '2h',
            //issuer: 'https://scotch.io'
          };
          try {
            // verify makes sure that the token hasn't expired and has been issued by us
            result = jwt.verify(token, JWT_SIGN_SECRET, options);
    
            // Let's pass back the decoded token to the request object
            req.decoded = result;
            // We call next to pass execution to the subsequent middleware
            next();
          } catch (err) {            
            // Throw an error just in case anything goes wrong with verification
            throw new Error(err);
          }
        } else {
          throw new Error('Authentication error. Token required.');
        }
      }
}