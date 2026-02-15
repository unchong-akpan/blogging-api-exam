const express = require('express');
const router = express.Router();

const {
  getPublishedBlogs,
  getSingleBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getMyBlogs
} = require('../controllers/blogController');

const { protect, isOwner } = require('../middleware/auth');

// ────────────────────────────────────────────────
// Public routes (no authentication required)
// ────────────────────────────────────────────────
router.get('/', getPublishedBlogs);                // GET /api/blogs

// ────────────────────────────────────────────────
// Protected routes (require authentication)
// ────────────────────────────────────────────────
router.get('/me', protect, getMyBlogs);            // GET /api/blogs/me - MUST be before /:id
router.post('/', protect, createBlog);             // POST /api/blogs

// ────────────────────────────────────────────────
// Public dynamic routes
// ────────────────────────────────────────────────
router.get('/:id', getSingleBlog);                 // GET /api/blogs/:id

// ────────────────────────────────────────────────
// Protected dynamic routes
// ────────────────────────────────────────────────
router.route('/:id')
  .put(protect, isOwner, updateBlog)
  .delete(protect, isOwner, deleteBlog);

module.exports = router;