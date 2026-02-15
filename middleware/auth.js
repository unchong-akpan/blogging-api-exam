const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Blog = require('../models/Blog');   // ← THIS WAS MISSING — ADD THIS LINE

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (err) {
      return res.status(401).json({ status: 'error', message: 'Not authorized – invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authorized – no token' });
  }
};

// Ownership check (used for update/delete/my-blogs actions)
const isOwner = async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });

  if (blog.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You are not the owner of this blog' });
  }

  req.blog = blog; // optional – pass it forward
  next();
};

module.exports = { protect, isOwner };