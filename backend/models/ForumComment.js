const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('ForumComment', forumCommentSchema);
