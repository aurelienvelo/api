// Imports
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var messageSchema = new mongoose.Schema({
    title : String,
    content : String,
    attachment: { type: String, default: '' },
    link: { type: String, default: '' },
    likes: { type : Number, default : 0 },
    dateCreated: { type : Date, default : Date.now },
    dateModified: { type : Date, default : Date.now },
    UserId: String,
    User: [{ type: Schema.Types.ObjectId, ref: 'users' }]
  });

module.exports = mongoose.model('messages', messageSchema);