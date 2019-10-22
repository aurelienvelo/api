// Imports
var express     = require('express');
var helmet      = require('helmet');
var bodyParser  = require('body-parser');
var apiRouter   = require('./apiRouter').router;


// Variables environnement
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
const PORT = process.env.PORT || 3000;

// Instantition server
var server = express();

// Use Helmet for Disable header X-Powered-By
server.use(helmet());
server.use(helmet.hidePoweredBy());

// Route static
server.use(express.static(__dirname + '/public'));

// Body Parser configurtation
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

server.use(function(req, res, next) {
    if (process.env.NODE_ENV !== 'production') {
        res.header("Access-Control-Allow-Origin", '*' );
    } else {
        res.header("Access-Control-Allow-Origin", "velo-nas.ovh"); // update to match the domain you will make the request from
    }
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, PATCH, PUT, POST, DELETE, OPTIONS');
    next();
});

// Configuration routes
server.use('/api/', apiRouter);

// Launch server
server.listen(PORT, function() {
    console.log('Server en écoute sur le port %s :', PORT);
})