import request from 'supertest';
import { app } from '../server';
import { connectDB, disconnectDB } from '../config/db';

beforeAll(async () => {
  await connectDB();
}, 30000);

afterAll(async () => {
  await disconnectDB();
});

describe('CivicEye API Endpoints (Order & Contracts)', () => {
  it('GET /api/health should return 200 with service information', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('CivicEye Backend API');
  });

  it('POST /api/auth/demo-login should log in demo citizen and set httpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'citizen' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('citizen');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toContain('token=');
    expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  });

  it('POST /api/auth/demo-login should log in demo admin', async () => {
    const res = await request(app)
      .post('/api/auth/demo-login')
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');
  });

  it('Static route ordering: GET /api/complaints/map should NOT be trapped by /:id', async () => {
    const res = await request(app).get('/api/complaints/map');
    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.data.features)).toBe(true);
  });

  it('Static route ordering: GET /api/complaints/analytics/summary should return dashboard aggregates', async () => {
    const res = await request(app).get('/api/complaints/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.data.kpis).toBeDefined();
    expect(Array.isArray(res.body.data.byCategory)).toBe(true);
  });
});
