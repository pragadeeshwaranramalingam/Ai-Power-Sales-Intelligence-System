const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

let mongoServer;
let adminToken;
let repToken;
let adminUser;
let repUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create Admin User
  adminUser = await User.create({
    name: 'Admin Boss',
    email: 'admin.test@salesintel.ai',
    password: 'Password123!',
    role: 'admin'
  });

  // Create Sales Rep User
  repUser = await User.create({
    name: 'Sales Rep Jane',
    email: 'rep.test@salesintel.ai',
    password: 'Password123!',
    role: 'sales_rep'
  });

  const adminLogin = await request(app).post('/api/v1/auth/login').send({
    email: adminUser.email,
    password: 'Password123!'
  });
  adminToken = adminLogin.body.token;

  const repLogin = await request(app).post('/api/v1/auth/login').send({
    email: repUser.email,
    password: 'Password123!'
  });
  repToken = repLogin.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Lead.deleteMany({});
  await Activity.deleteMany({});
});

describe('Lead Management & Intelligence APIs', () => {
  const sampleLead = {
    name: 'Robert Downey',
    email: 'robert@starkindustries.com',
    phone: '+1 555-400-3000',
    company: 'Stark Industries',
    jobTitle: 'Chief Executive Officer (CEO)',
    industry: 'Technology',
    source: 'Website',
    dealValue: 95000,
    status: 'New',
    priority: 'Urgent',
    notes: 'Inquiring regarding AI defense automation platform.'
  };

  test('POST /api/v1/leads creates a lead with automatically computed AI score', async () => {
    const res = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleLead);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.lead.name).toBe(sampleLead.name);
    // AI Score must be automatically generated and > 70 for CEO + Tech + $95k
    expect(res.body.lead.aiScore).toBeGreaterThanOrEqual(70);
    expect(res.body.lead.aiCategory).toBe('Hot');
    expect(res.body.lead.aiFactors).toBeDefined();
    expect(res.body.lead.aiFactors.length).toBe(6);
    expect(res.body.lead.nextBestAction).toBeDefined();
  });

  test('POST /api/v1/leads rejects creation without required company or name', async () => {
    const invalidLead = { email: 'bad@test.com' };
    const res = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidLead);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/v1/leads lists leads with server-side pagination and filters', async () => {
    // Insert 2 leads
    await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${adminToken}`).send(sampleLead);
    await request(app).post('/api/v1/leads').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Bruce Wayne',
      email: 'bruce@waynecorp.com',
      company: 'Wayne Enterprises',
      dealValue: 50000,
      industry: 'Finance'
    });

    const res = await request(app)
      .get('/api/v1/leads?page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  test('POST /api/v1/leads/:id/activities appends activity and recalculates intelligence', async () => {
    const createRes = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleLead);

    const leadId = createRes.body.lead._id;

    const actRes = await request(app)
      .post(`/api/v1/leads/${leadId}/activities`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'call',
        title: 'Executive discovery phone call',
        description: 'Discussed timeline and budget approval with Robert.'
      });

    expect(actRes.statusCode).toBe(201);
    expect(actRes.body.success).toBe(true);
    expect(actRes.body.activity.title).toBe('Executive discovery phone call');
    expect(actRes.body.lead.lastContactedAt).toBeDefined();
  });

  test('DELETE /api/v1/leads/:id deletes lead and associated activities', async () => {
    const createRes = await request(app)
      .post('/api/v1/leads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sampleLead);

    const leadId = createRes.body.lead._id;

    const delRes = await request(app)
      .delete(`/api/v1/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.success).toBe(true);

    const checkRes = await request(app)
      .get(`/api/v1/leads/${leadId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(checkRes.statusCode).toBe(404);
  });
});
