 module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    if (req.url.indexOf('api') < 0) { 
        if (typeof (err) === 'string') {
            // custom application error
            // return res.status(400).json({ message: err });
            return res.render('error.ejs', { message: err} );
        }

        if (err.name === 'UnauthorizedError') {
            // jwt authentication error
            // return res.status(401).json({ message: 'Invalid Token' });
            return res.render('error.ejs', { message: 'Vous n avez pas les droits.'} );
        }

        if (err.name === 'TokenExpiredError' || err.message.indexOf('TokenExpiredError') >= 0) {
            // jwt authentication error
            // return res.status(401).json({ message: 'Invalid Token' });
            return res.render('login.ejs', { message: 'Authentification expirée.'} );
        }

        if (err.message === 'Authentication error. Token required.') {
            // jwt authentication error
            // return res.status(401).json({ message: 'Invalid Token' });
            return res.render('login.ejs', { message: ''} );
        }

        // default to 500 server error
        // return res.status(500).json({ message: err.message });
        return res.render('error.ejs', { message: err.message } );
    } 
}