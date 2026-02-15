const Blog = require('../models/Blog');

// Helper: estimate reading time (most common algorithm: ~225–250 words per minute)
const calculateReadingTime = (body) => {
  const words = body.trim().split(/\s+/).length;
  const wpm = 225; // average adult reading speed
  const minutes = words / wpm;
  return Math.ceil(minutes); // round up to nearest minute
};

// Public – list published blogs (paginated, searchable, sortable)
const getPublishedBlogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { state: 'published' };
  const sort = {};

  // Search
  if (req.query.author) filter.author = req.query.author;
  if (req.query.title)   filter.title = { $regex: req.query.title, $options: 'i' };
  if (req.query.tags) {
    filter.tags = { $in: req.query.tags.split(',') };
  }

  // Order by
  if (req.query.sortBy) {
    const [field, order] = req.query.sortBy.split(':');
    sort[field] = order === 'desc' ? -1 : 1;
  } else {
    sort.timestamp = -1; // newest first default
  }

  const blogs = await Blog.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('author', 'first_name last_name email');

  const total = await Blog.countDocuments(filter);

  res.json({
    page,
    pages: Math.ceil(total / limit),
    count: total,
    data: blogs
  });
};

// Public – get single published blog + increment read_count
const getSingleBlog = async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { _id: req.params.id, state: 'published' },
    { $inc: { read_count: 1 } },
    { new: true }
  ).populate('author', 'first_name last_name email');

  if (!blog) return res.status(404).json({ message: 'Blog not found or not published' });

  res.json(blog);
};

// Protected – create blog (starts as draft)
const createBlog = async (req, res) => {
  const { title, description, tags, body } = req.body;

  if (!title || !description || !body) {
    return res.status(400).json({ message: 'Title, description and body are required' });
  }

  const reading_time = calculateReadingTime(body);

  const blog = await Blog.create({
    title,
    description,
    tags: tags || [],
    body,
    author: req.user._id,
    reading_time
  });

  res.status(201).json(blog);
};

// Protected – owner only: update blog (including publish)
const updateBlog = async (req, res) => {
  const blog = req.blog; // from isOwner middleware

  const { title, description, tags, body, state } = req.body;

  if (title)       blog.title       = title;
  if (description) blog.description = description;
  if (tags)        blog.tags        = tags;
  if (body) {
    blog.body = body;
    blog.reading_time = calculateReadingTime(body);
  }
  if (state && ['draft', 'published'].includes(state)) {
    blog.state = state;
  }

  const updated = await blog.save();
  res.json(updated);
};

// Protected – owner only: delete
const deleteBlog = async (req, res) => {
  await req.blog.deleteOne();
  res.json({ message: 'Blog removed' });
};

// Protected – list my blogs (paginated + filter by state)
const getMyBlogs = async (req, res) => {

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authorized – please login again' });
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { author: req.user._id };
  if (req.query.state) filter.state = req.query.state;

  const blogs = await Blog.find(filter)
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Blog.countDocuments(filter);

  res.json({
    page,
    pages: Math.ceil(total / limit),
    count: total,
    data: blogs
  });
};

module.exports = {
  getPublishedBlogs,
  getSingleBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getMyBlogs
};