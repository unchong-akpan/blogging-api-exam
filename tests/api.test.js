const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/User');
const app = require('../server');

let mongoServer;
let authToken;
let createdBlogId;

// Start in-memory MongoDB before tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  
  // Connect mongoose to memory server
  await mongoose.connect(mongoServer.getUri());
  
  // Create a test user
  const testUser = await User.create({
    first_name: 'Test',
    last_name: 'User',
    email: 'unchong.test@example.com',
    password: 'strongpass123' // Will be hashed by User schema
  });
});

describe('Blogging API - Full Endpoints Tests', () => {
  // 1. Login (get fresh token)
  test('POST /api/auth/login - should login and return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'unchong.test@example.com',
        password: 'strongpass123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe('unchong.test@example.com');

    authToken = res.body.token; // save for protected tests
  });

  // 2. Create blog (draft)
  test('POST /api/blogs - should create a new draft blog', async () => {
    const title = `Test Blog ${Date.now()}`;
    const res = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title,
        description: 'Test description for API test',
        body: 'This is a test body with enough words to calculate reading time. Hello world from Jest!',
        tags: ['test', 'jest', 'api']
      });

    expect(res.status).toBe(201);
    expect(res.body.state).toBe('draft');
    expect(res.body.title).toBe(title);
    expect(res.body).toHaveProperty('reading_time');
    expect(res.body).toHaveProperty('_id');

    createdBlogId = res.body._id; // save for later
  });

  // 3. Publish the blog
  test('PUT /api/blogs/:id - should publish the blog', async () => {
    const res = await request(app)
      .put(`/api/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        state: 'published'
      });

    expect(res.status).toBe(200);
    expect(res.body.state).toBe('published');
  });

  // 4. Get my blogs
  test('GET /api/blogs/me - should return my blogs', async () => {
    const res = await request(app)
      .get('/api/blogs/me?page=1&limit=5')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some(b => b._id === createdBlogId)).toBe(true);
  });

  // 5. Get public published blogs
  test('GET /api/blogs - should return published blogs', async () => {
    const res = await request(app)
      .get('/api/blogs?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data.some(b => b._id === createdBlogId)).toBe(true);
  });

  // 6. Get single blog + read_count increment
  test('GET /api/blogs/:id - increments read_count', async () => {
    const first = await request(app).get(`/api/blogs/${createdBlogId}`);
    expect(first.status).toBe(200);
    expect(first.body.read_count).toBeGreaterThan(0);

    const second = await request(app).get(`/api/blogs/${createdBlogId}`);
    expect(second.body.read_count).toBe(first.body.read_count + 1);
  });

  // 7. Delete the test blog (cleanup)
  test('DELETE /api/blogs/:id - delete test blog', async () => {
    const res = await request(app)
      .delete(`/api/blogs/${createdBlogId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/);
  });
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});