const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Task = require('../models/Task');

let mongoServer;
let adminToken;
let adminUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  adminUser = await User.create({
    name: 'Admin Tester',
    email: 'analytics.admin@salesintel.ai',
    password: 'Password123!',
    role: 'admin'
  });

  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: adminUser.email,
    password: 'Password123!'
  });
  adminToken = loginRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Lead.deleteMany({});
  await Task.deleteMany({});
});

describe('Sales Analytics & Reporting APIs', () => {
  test('GET /api/v1/analytics/overview returns zero-safe metrics when no leads exist', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.totalLeads).toBe(0);
    expect(res.body.summary.pipelineValue).toBe(0);
    expect(res.body.summary.wonRevenue).toBe(0);
    expect(res.body.summary.conversionRate).toBe(0); // Guarded against 0/0 NaN
  });

  test('GET /api/v1/analytics/overview accurately computes pipeline and won metrics', async () => {
    // Insert 1 Won deal ($50,000) and 1 Qualified deal in pipeline ($30,000)
    await Lead.create([
      {
        name: 'Deal One',
        email: 'd1@test.com',
        company: 'Corp 1',
        dealValue: 50000,
        status: 'Won',
        owner: adminUser._id,
        aiScore: 90,
        aiCategory: 'Hot'
      },
      {
        name: 'Deal Two',
        email: 'd2@test.com',
        company: 'Corp 2',
        dealValue: 30000,
        status: 'Qualified',
        owner: adminUser._id,
        aiScore: 65,
        aiCategory: 'Warm'
      }
    ]);

    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.summary.totalLeads).toBe(2);
    expect(res.body.summary.wonRevenue).toBe(50000);
    expect(res.body.summary.pipelineValue).toBe(30000);
    expect(res.body.summary.hotLeads).toBe(1);
    expect(res.body.statusDistribution).toBeDefined();
    expect(res.body.sourceBreakdown).toBeDefined();
    expect(res.body.aiInsights).toBeDefined();
  });

  test('GET /api/v1/analytics/conversions returns conversions by source and industry', async () => {
    await Lead.create([
      {
        name: 'Lead Web Won',
        email: 'w1@test.com',
        company: 'WebCo',
        dealValue: 20000,
        status: 'Won',
        source: 'Website',
        industry: 'Technology',
        owner: adminUser._id
      },
      {
        name: 'Lead Web Lost',
        email: 'w2@test.com',
        company: 'WebCo 2',
        dealValue: 10000,
        status: 'Lost',
        source: 'Website',
        industry: 'Technology',
        owner: adminUser._id
      }
    ]);

    const res = await request(app)
      .get('/api/v1/analytics/conversions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.conversionsBySource).toBeDefined();
    const webSource = res.body.conversionsBySource.find(s => s.source === 'Website');
    expect(webSource).toBeDefined();
    expect(webSource.total).toBe(2);
    expect(webSource.won).toBe(1);
    expect(webSource.conversionRate).toBe(50); // 1 won out of 2 closed = 50%
  });
});
