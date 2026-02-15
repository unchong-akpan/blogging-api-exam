require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: "Welcome to the Blogging API! 🚀",
    description: "A RESTful blogging platform built with Node.js, Express, MongoDB, Mongoose, and JWT authentication for user registration, login, and blog management.",
    author: "Unchong Akpan",
    status: "API is live and running",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login"
      },
      blogs: {
        publicList: "GET /api/blogs (published blogs only)",
        singleBlog: "GET /api/blogs/:id",
        create: "POST /api/blogs (requires JWT)",
        myBlogs: "GET /api/blogs/me (requires JWT)",
        update: "PUT /api/blogs/:id (owner only)",
        delete: "DELETE /api/blogs/:id (owner only)"
      }
    },
    documentation: "All protected routes require Authorization header: Bearer <token>",
    note: "Token expires after 1 hour. Use /api/auth/login to get a new one.",
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blog'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
