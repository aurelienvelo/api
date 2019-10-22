// Imports
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var fileDownloadSchema = new mongoose.Schema({    
    filename: String,
    link: String,
    filesize: Number,
    filepath: String,
    status: String,
    percent: {type: Number, default: 0 },
    dateCreated: { type: Date, default: Date.now() },
    userId: String,
    user: [{ type: Schema.Types.ObjectId, ref: 'users' }]
  });


module.exports = mongoose.model('downloads', fileDownloadSchema);