const express = require('express');
const authJwt = require('../middleware/authJwt');
const ForumPost = require('../models/ForumPost');
const ForumComment = require('../models/ForumComment');

const router = express.Router();

// Get all forum posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await ForumPost.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load posts' });
  }
});

// Create a new forum post
router.post('/posts', authJwt, async (req, res) => {
  try {
    const { title, content, reason } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const post = await ForumPost.create({
      user: req.user.userId,
      title,
      content,
      reason: reason || '',
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// Get a single post with comments
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id).populate('user', 'name email');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comments = await ForumComment.find({ post: post._id }).populate('user', 'name email').sort({ createdAt: 1 });
    res.json({ post, comments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load post' });
  }
});

// Add a comment to a post
router.post('/posts/:id/comments', authJwt, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const comment = await ForumComment.create({
      post: req.params.id,
      user: req.user.userId,
      content,
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

module.exports = router;
