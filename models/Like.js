// Imports
var mongoose = require('mongoose');
const Schema = mongoose.Schema;

var likeSchema = new mongoose.Schema({
    MessageId: String,
    UserId: String,
    User: [{ type: Schema.Types.ObjectId, ref: 'users' }],
    MessageId : String,
    Message: [{ type: Schema.Types.ObjectId, ref: 'messages' }],
    isLike: Boolean
  });

module.exports = mongoose.model('likes', likeSchema);