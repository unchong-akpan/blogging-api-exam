const request = require('supertest');
const app = require('../server'); // change to '../app' if your main file is app.js
const { disconnectDB } = require('../config/db');

describe('Basic API Health Check', () => {
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Welcome to the Blogging API');
  });
});

afterAll(async () => {
  await disconnectDB();
});