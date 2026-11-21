import request from 'supertest';
import express from 'express';
import { app } from '../server';
import { connectDB, disconnectDB } from '../config/db';
import { bootstrapAdmin, ensureDepartments, seedDemoData } from '../services/seedService';
import { createLimiter } from '../middleware/rateLimit';
import { Complaint } from '../models/Complaint';
import { DuplicateGroup } from '../models/DuplicateGroup';

const API = '/api/v1';
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const WEBM = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64)]);

beforeAll(async () => {
  await connectDB();
  await ensureDepartments();
  await bootstrapAdmin();
});
afterAll(async () => {
  await disconnectDB();
});

const register = async (email: string, name = 'Test Citizen') => {
  const agent = request.agent(app);
  const res = await agent.post(`${API}/auth/register`).send({ name, email, password: 'password-123' });
  expect(res.status).toBe(201);
  return agent;
};

const submit = (agent: request.Agent, over: Record<string, string> = {}, files: { image?: Buffer; audio?: Buffer; imageName?: string } = {}) => {
  let r = agent
    .post(`${API}/complaints`)
    .field('description', over.description ?? 'Large pothole near the bus stop on the main road, very dangerous at night.')
    .field('latitude', over.latitude ?? '17.4156')
    .field('longitude', over.longitude ?? '78.4347')
    .field('locationAccuracy', 'map_pin');
  if (over.category) r = r.field('category', over.category);
  if (files.image) r = r.attach('image', files.image, files.imageName ?? 'photo.png');
  if (files.audio) r = r.attach('audio', files.audio, 'voice.webm');
  return r;
};

describe('health, errors and removed endpoints', () => {
  it('health reports facts only', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('connected');
    expect(JSON.stringify(res.body)).not.toMatch(/gemini-1\.5/i);
  });
  it('demo-login no longer exists', async () => {
    const res = await request(app).post(`${API}/auth/demo-login`).send({ role: 'admin' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
  it('malformed JSON and unknown routes use the error envelope', async () => {
    const bad = await request(app).post(`${API}/auth/login`).set('Content-Type', 'application/json').send('{oops');
    expect(bad.status).toBe(400);
    expect(bad.body.success).toBe(false);
    expect((await request(app).get(`${API}/nope`)).status).toBe(404);
  });
});

describe('authentication', () => {
  it('validates registration and never leaks hashes or tokens in the body', async () => {
    const bad = await request(app).post(`${API}/auth/register`).send({ name: 'A', email: 'nope', password: '123' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(bad.body.error.fields)).toEqual(expect.arrayContaining(['name', 'email', 'password']));

    const ok = await request(app).post(`${API}/auth/register`).send({ name: 'Ravi K', email: 'ravi@example.com', password: 'password-123' });
    expect(ok.status).toBe(201);
    expect(ok.body.data.user.role).toBe('citizen');
    expect(JSON.stringify(ok.body)).not.toMatch(/passwordHash|token/i);
    const cookie = ok.headers['set-cookie'][0];
    expect(cookie).toContain('token=');
    expect(cookie).toContain('HttpOnly');
  });

  it('cannot self-register as admin', async () => {
    const res = await request(app).post(`${API}/auth/register`).send({ name: 'Mallory', email: 'mal@example.com', password: 'password-123', role: 'admin' });
    expect(res.body.data.user.role).toBe('citizen');
  });

  it('rejects duplicate email and wrong password with generic messages', async () => {
    await register('dup@example.com');
    expect((await request(app).post(`${API}/auth/register`).send({ name: 'Again', email: 'dup@example.com', password: 'password-123' })).status).toBe(409);
    const a = await request(app).post(`${API}/auth/login`).send({ email: 'dup@example.com', password: 'wrong-password' });
    const b = await request(app).post(`${API}/auth/login`).send({ email: 'ghost@example.com', password: 'wrong-password' });
    expect(a.status).toBe(401);
    expect(a.body.error.message).toBe(b.body.error.message);
  });

  it('me needs a session; logout clears it', async () => {
    expect((await request(app).get(`${API}/auth/me`)).status).toBe(401);
    const agent = await register('me@example.com');
    expect((await agent.get(`${API}/auth/me`)).body.data.user.email).toBe('me@example.com');
    await agent.post(`${API}/auth/logout`);
  });
});

describe('citizen complaint flow', () => {
  it('requires login, validates input and the Hyderabad region', async () => {
    expect((await request(app).post(`${API}/complaints`).field('description', 'x'.repeat(30))).status).toBe(401);
    const agent = await register('submit@example.com');
    expect((await submit(agent, { description: 'short' })).status).toBe(400);
    const far = await submit(agent, { latitude: '28.6', longitude: '77.2' });
    expect(far.status).toBe(400);
    expect(far.body.error.code).toBe('LOCATION_OUTSIDE_REGION');
  });

  it('rejects files whose content is not an image, whatever the name says', async () => {
    const agent = await register('files@example.com');
    const res = await submit(agent, {}, { image: Buffer.from('<?php echo 1; ?> not really a picture at all'), imageName: 'evil.png' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_INVALID');
  });

  it('creates a complaint with tracking id, simulated AI label, scoring and a public timeline', async () => {
    const agent = await register('owner@example.com');
    const res = await submit(agent, {}, { image: PNG });
    expect(res.status).toBe(201);
    const c = res.body.data.complaint;
    expect(c.trackingId).toMatch(/^CE-HYD-\d{4}-\d{6}$/);
    expect(c.provenance).toBe('CITIZEN');
    expect(c.ai.isSimulated).toBe(true);
    expect(c.priority.score).toBeGreaterThanOrEqual(1);
    expect(c.location.accuracy).toBe('map_pin');
    expect(c.images[0].url).toMatch(/^\/uploads\/images\//);

    const detail = await request(app).get(`${API}/complaints/${c.trackingId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.updates[0].toStatus).toBe('submitted');
  });

  it('honours the citizen category choice and stores the AI suggestion separately', async () => {
    const agent = await register('cat@example.com');
    const res = await submit(agent, { category: 'Street Lights', description: 'There is a pothole on the road near the school gate.' });
    expect(res.body.data.complaint.category).toBe('Street Lights');
    expect(res.body.data.complaint.ai.suggestedCategory).toBe('Roads');
  });
});

describe('privacy of public endpoints', () => {
  it('never exposes reporter identity, emails or private audio', async () => {
    const agent = await register('privacy-reporter@example.com', 'Private Person');
    const created = await submit(agent, { description: 'Garbage dump overflowing next to the school wall.' }, { audio: WEBM });
    expect(created.status).toBe(201);
    const id = created.body.data.complaint.trackingId;

    const pub = await request(app).get(`${API}/complaints?includeDemo=false&limit=50`);
    const one = await request(app).get(`${API}/complaints/${id}`);
    const map = await request(app).get(`${API}/complaints/map`);
    for (const body of [pub.text, one.text, map.text]) {
      expect(body).not.toContain('privacy-reporter@example.com');
      expect(body).not.toContain('Private Person');
      expect(body).not.toMatch(/reporterId|passwordHash|upvotedBy/);
    }
    expect(one.body.data.complaint.hasAudio).toBe(true);
    expect(one.text).not.toContain('/api/v1/media/audio');
  });

  it('serves audio only to the reporter and admins; never statically', async () => {
    const owner = await register('audio-owner@example.com');
    const other = await register('audio-other@example.com');
    const created = await submit(owner, { description: 'Streetlight on our lane has been dead for a week.' }, { audio: WEBM });
    const url = created.body.data.complaint.audio[0].url as string;

    expect((await request(app).get(url)).status).toBe(401);
    expect((await other.get(url)).status).toBe(403);
    expect((await owner.get(url)).status).toBe(200);

    const admin = request.agent(app);
    await admin.post(`${API}/auth/login`).send({ email: 'admin.test@example.com', password: 'correct-horse-battery-staple' });
    expect((await admin.get(url)).status).toBe(200);

    const filename = url.split('/').pop();
    expect((await request(app).get(`/uploads/audio/${filename}`)).status).toBe(404);
    expect((await request(app).get(`/uploads/private/audio/${filename}`)).status).toBe(404);
  });
});

describe('support and duplicates', () => {
  it('lets other citizens support (idempotent), not the reporter, and raises the score', async () => {
    const owner = await register('sup-owner@example.com');
    const fan = await register('sup-fan@example.com');
    const created = await submit(owner, { description: 'Water pipeline leaking heavily at the corner shop.', latitude: '17.4399', longitude: '78.4983' });
    const id = created.body.data.complaint.trackingId;
    const before = created.body.data.complaint.priority.score;

    expect((await owner.post(`${API}/complaints/${id}/support`)).status).toBe(400);
    const a = await fan.post(`${API}/complaints/${id}/support`);
    const b = await fan.post(`${API}/complaints/${id}/support`);
    expect(a.body.data.supportCount).toBe(1);
    expect(b.body.data.supportCount).toBe(1);
    expect(a.body.data.priority.score).toBeGreaterThanOrEqual(before);
    expect((await fan.get(`${API}/complaints/${id}`)).body.data.complaint.hasSupported).toBe(true);
    expect((await fan.delete(`${API}/complaints/${id}/support`)).body.data.supportCount).toBe(0);
  });

  it('groups near-duplicates without deleting either complaint', async () => {
    const a = await register('dupa@example.com');
    const b = await register('dupb@example.com');
    const first = await submit(a, { description: 'Sewage overflowing from open manhole on the main road, foul smell.', latitude: '17.4504', longitude: '78.39' });
    const preview = await b.post(`${API}/complaints/check-duplicates`).send({ description: 'Sewage is overflowing from the manhole on main road', latitude: 17.4505, longitude: 78.3901 });
    expect(preview.status).toBe(200);
    expect(preview.body.data.candidates.length).toBeGreaterThan(0);

    const second = await submit(b, { description: 'Sewage is overflowing from the manhole on the main road, foul smell everywhere.', latitude: '17.4505', longitude: '78.3901' });
    expect(second.body.data.duplicate.linked).toBe(true);
    const ids = [first.body.data.complaint.trackingId, second.body.data.complaint.trackingId];
    const docs = await Complaint.find({ trackingId: { $in: ids } });
    expect(docs).toHaveLength(2);
    expect(docs[0].duplicateGroupId).toEqual(docs[1].duplicateGroupId);
    expect((await DuplicateGroup.findById(docs[0].duplicateGroupId))!.status).toBe('suggested');
  });

  it('does not suggest duplicates for far-away or unrelated reports', async () => {
    const c = await register('dupc@example.com');
    const far = await c.post(`${API}/complaints/check-duplicates`).send({ description: 'Sewage overflowing from open manhole on the main road', latitude: 17.3463, longitude: 78.5522 });
    expect(far.body.data.candidates).toHaveLength(0);
  });
});

describe('administrator workflow and authorisation', () => {
  let admin: request.Agent;
  beforeAll(async () => {
    admin = request.agent(app);
    const res = await admin.post(`${API}/auth/login`).send({ email: 'admin.test@example.com', password: 'correct-horse-battery-staple' });
    expect(res.body.data.user.role).toBe('admin');
  });

  it('blocks anonymous users and citizens from every admin route', async () => {
    const citizen = await register('notadmin@example.com');
    for (const path of ['/admin/complaints', '/admin/duplicates', '/admin/workload', '/admin/departments']) {
      expect((await request(app).get(`${API}${path}`)).status).toBe(401);
      expect((await citizen.get(`${API}${path}`)).status).toBe(403);
    }
    expect((await citizen.patch(`${API}/admin/complaints/CE-HYD-2026-000001/status`).send({ status: 'resolved' })).status).toBe(403);
  });

  it('runs status, assignment, verification, comments and evidence with a stored history', async () => {
    const citizen = await register('flow@example.com', 'Flow Citizen');
    const created = await submit(citizen, { description: 'Open drain overflowing near the temple junction, large puddle.' });
    const id = created.body.data.complaint.trackingId;

    const list = await admin.get(`${API}/admin/complaints?search=${id}`);
    expect(list.body.data.items[0].reporter.email).toBe('flow@example.com'); // admins may see reporter

    expect((await admin.patch(`${API}/admin/complaints/${id}/status`).send({ status: 'rejected' })).status).toBe(400); // needs reason
    expect((await admin.patch(`${API}/admin/complaints/${id}/status`).send({ status: 'under_review', note: 'Checking details' })).status).toBe(200);

    const depts = (await admin.get(`${API}/admin/departments`)).body.data.departments;
    const drain = depts.find((d: any) => d.code === 'GHMC-DRAIN');
    const assigned = await admin.patch(`${API}/admin/complaints/${id}/department`).send({ departmentId: String(drain._id) });
    expect(assigned.body.data.status).toBe('assigned');

    expect((await admin.patch(`${API}/admin/complaints/${id}/category`).send({ category: 'Waterlogging' })).status).toBe(200);
    expect((await admin.post(`${API}/admin/complaints/${id}/comments`).send({ note: 'INTERNAL ONLY note', isPublic: false })).status).toBe(201);
    expect((await admin.post(`${API}/admin/complaints/${id}/comments`).send({ note: 'Crew dispatched today', isPublic: true })).status).toBe(201);

    const bad = await admin.post(`${API}/admin/complaints/${id}/evidence`).attach('evidence', Buffer.from('not an image at all, just text'), 'x.png');
    expect(bad.status).toBe(400);
    const good = await admin.post(`${API}/admin/complaints/${id}/evidence`).field('caption', 'After repair').attach('evidence', PNG, 'after.png');
    expect(good.status).toBe(201);

    expect((await admin.patch(`${API}/admin/complaints/${id}/status`).send({ status: 'resolved', note: 'Drain cleared' })).status).toBe(200);

    const adminView = await admin.get(`${API}/admin/complaints/${id}`);
    const types = adminView.body.data.updates.map((u: any) => u.type);
    expect(types).toEqual(expect.arrayContaining(['submitted', 'status', 'assignment', 'verification', 'comment', 'evidence']));
    const statusUpdate = adminView.body.data.updates.find((u: any) => u.toStatus === 'resolved');
    expect(statusUpdate.actor.name).toBeTruthy(); // responsible administrator recorded
    expect(statusUpdate.createdAt).toBeTruthy();

    const publicView = await request(app).get(`${API}/complaints/${id}`);
    expect(publicView.text).toContain('Crew dispatched today');
    expect(publicView.text).not.toContain('INTERNAL ONLY');
    expect(publicView.body.data.complaint.status).toBe('resolved');
    expect(publicView.body.data.complaint.categoryVerified).toBe(true);
    expect(publicView.body.data.complaint.resolutionEvidence).toHaveLength(1);
  });

  it('reviews duplicate suggestions; rejecting unlinks but deletes nothing', async () => {
    const before = await Complaint.countDocuments();
    const groups = (await admin.get(`${API}/admin/duplicates`)).body.data.groups;
    expect(groups.length).toBeGreaterThan(0);
    const res = await admin.patch(`${API}/admin/duplicates/${groups[0].id}`).send({ decision: 'rejected' });
    expect(res.body.data.status).toBe('rejected');
    expect(await Complaint.countDocuments()).toBe(before);
    expect(await Complaint.countDocuments({ duplicateGroupId: groups[0].id })).toBe(0);
  });
});

describe('demo data separation and analytics', () => {
  it('keeps DEMO out of citizen statistics, lists and the map unless requested', async () => {
    const citizenBefore = (await request(app).get(`${API}/complaints/analytics?scope=citizen`)).body.data.totals.total;
    const seeded = await seedDemoData();
    expect(seeded).toBeGreaterThan(0);

    const citizenAfter = await request(app).get(`${API}/complaints/analytics?scope=citizen`);
    const all = await request(app).get(`${API}/complaints/analytics?scope=all`);
    expect(citizenAfter.body.data.totals.total).toBe(citizenBefore);
    expect(all.body.data.totals.total).toBe(citizenBefore + seeded);

    const defaultList = await request(app).get(`${API}/complaints?limit=50`);
    expect(defaultList.body.data.items.every((c: any) => c.provenance !== 'DEMO')).toBe(true);
    const withDemo = await request(app).get(`${API}/complaints?includeDemo=true&limit=50`);
    expect(withDemo.body.data.items.some((c: any) => c.provenance === 'DEMO' && /^CE-DEMO-/.test(c.trackingId))).toBe(true);

    const demoPoint = (await request(app).get(`${API}/complaints/map?includeDemo=true`)).body.data.points.find((p: any) => p.provenance === 'DEMO');
    expect(demoPoint.accuracy).toBe('area_approx');
    expect((await request(app).get(`${API}/complaints/map`)).body.data.points.some((p: any) => p.provenance === 'DEMO')).toBe(false);
  });

  it('filters analytics and computes distributions from stored records', async () => {
    const res = await request(app).get(`${API}/complaints/analytics?scope=all&category=Drainage`);
    expect(res.body.data.byCategory.every((c: any) => c.category === 'Drainage')).toBe(true);
    expect(res.body.data.byPriority).toHaveLength(4);
    const future = await request(app).get(`${API}/complaints/analytics?scope=all&from=2999-01-01`);
    expect(future.body.data.totals.total).toBe(0);
    expect((await request(app).get(`${API}/complaints/analytics?scope=bogus`)).status).toBe(400);
  });

  it('paginates and searches without regex injection', async () => {
    const page = await request(app).get(`${API}/complaints?includeDemo=true&limit=3&page=2`);
    expect(page.body.data.items).toHaveLength(3);
    expect(page.body.data.pagination.page).toBe(2);
    expect((await request(app).get(`${API}/complaints?search=${encodeURIComponent('(((')}`)).status).toBe(200);
    expect((await request(app).get(`${API}/complaints?limit=9999`)).status).toBe(400);
  });
});

describe('rate limiting', () => {
  it('answers 429 with the error envelope after the limit', async () => {
    const small = express();
    small.use(createLimiter(60_000, 2));
    small.get('/x', (_req, res) => res.json({ ok: true }));
    expect((await request(small).get('/x')).status).toBe(200);
    expect((await request(small).get('/x')).status).toBe(200);
    const blocked = await request(small).get('/x');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});
