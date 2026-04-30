const dotenv = require('dotenv');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const projectRoot = path.resolve(__dirname, '..');
const runId = `smoke-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const smokeDbName = `hotel_management_smoke_${Date.now()}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildSmokeMongoUri(uri, dbName) {
  const match = String(uri).match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(\/[^?]*)?(\?.*)?$/);
  if (!match) throw new Error('Invalid MONGO_URI format.');

  const prefix = match[1];
  const query = match[3] || '';
  return `${prefix}/${dbName}${query}`;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stopChild(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    child.once('exit', () => resolve());
    child.kill('SIGTERM');

    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
      }
    }, 3000);
  });
}

async function requestJson(baseUrl, endpoint, { method = 'GET', token, body, expectedStatus } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch (error) {
    json = null;
  }

  if (expectedStatus !== undefined && response.status !== expectedStatus) {
    throw new Error(
      `${method} ${endpoint} expected ${expectedStatus}, got ${response.status}. Body: ${raw || '<empty>'}`
    );
  }

  return { status: response.status, json, raw };
}

async function waitForServer(baseUrl, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await requestJson(baseUrl, '/', { expectedStatus: 200 });
      assert(
        typeof res.raw === 'string' && res.raw.includes('Hotel Management API is running'),
        'Unexpected health response body.'
      );
      return;
    } catch (error) {
      await sleep(300);
    }
  }

  throw new Error('Timed out waiting for backend server to become healthy.');
}

async function withStep(results, name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error: error.message });
    throw new Error(`[${name}] ${error.message}`);
  }
}

async function promoteUserToAdmin(mongoUri, email) {
  await mongoose.connect(mongoUri);
  try {
    const result = await mongoose.connection.db
      .collection('users')
      .updateOne({ email: String(email).toLowerCase() }, { $set: { role: 'admin' } });

    if (!result.matchedCount) {
      throw new Error(`Could not find user to promote: ${email}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

async function runCrudSuite(baseUrl, mongoUri) {
  const results = [];

  const adminEmail = `${runId}@example.com`;
  const adminPassword = 'SmokePass123!';
  const customerEmail = `customer-${runId}@example.com`;
  const customerPassword = 'CustomerPass123!';

  let adminToken;
  let customerToken;
  let customerId;
  let roomId;
  let bookingId;
  let experienceId;

  await withStep(results, 'auth.register_admin', async () => {
    const registerRes = await requestJson(baseUrl, '/api/users/register', {
      method: 'POST',
      expectedStatus: 201,
      body: {
        name: 'Smoke Admin',
        email: adminEmail,
        password: adminPassword,
      },
    });

    assert(registerRes.json && registerRes.json.success === true, 'Register response not successful.');
    await promoteUserToAdmin(mongoUri, adminEmail);

    const loginRes = await requestJson(baseUrl, '/api/users/login', {
      method: 'POST',
      expectedStatus: 200,
      body: {
        email: adminEmail,
        password: adminPassword,
      },
    });
    assert(loginRes.json?.token, 'Admin login failed.');
    adminToken = loginRes.json.token;
  });

  await withStep(results, 'users.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/users/register', {
      method: 'POST',
      expectedStatus: 201,
      body: {
        name: 'Smoke Customer',
        email: customerEmail,
        password: customerPassword,
        phone: '555100200',
      },
    });

    customerToken = createRes.json?.token;

    const loginRes = await requestJson(baseUrl, '/api/users/login', {
      method: 'POST',
      expectedStatus: 200,
      body: {
        email: customerEmail,
        password: customerPassword,
      },
    });
    assert(loginRes.json?.token, 'Customer login failed.');

    const meRes = await requestJson(baseUrl, '/api/users/me', {
      token: loginRes.json.token,
      expectedStatus: 200,
    });

    customerId = meRes.json?.data?._id;
    assert(customerId, 'Missing customer id from /me response.');

    const listRes = await requestJson(baseUrl, '/api/users', {
      token: adminToken,
      expectedStatus: 200,
    });
    assert(Array.isArray(listRes.json?.data), 'User list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === customerId), 'Created customer missing from user list.');

    const updateRes = await requestJson(baseUrl, `/api/users/${customerId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { phone: '555777999' },
    });

    assert(updateRes.json?.data?.phone === '555777999', 'User update did not persist phone.');
  });

  await withStep(results, 'rooms.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/rooms', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        roomNumber: `R-${Date.now()}`,
        type: 'Single',
        capacity: 2,
        pricePerNight: 90,
        status: 'Available',
        features: ['WiFi'],
        description: 'Smoke test room',
      },
    });

    roomId = createRes.json?.data?._id;
    assert(roomId, 'Room create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/rooms', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Room list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === roomId), 'Created room missing from list.');

    await requestJson(baseUrl, `/api/rooms/${roomId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/rooms/${roomId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'Occupied', capacity: 3 },
    });
    assert(updateRes.json?.data?.status === 'Occupied', 'Room update did not persist status.');
    assert(updateRes.json?.data?.capacity === 3, 'Room update did not persist capacity.');
  });

  await withStep(results, 'bookings.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/bookings', {
      method: 'POST',
      token: customerToken,
      expectedStatus: 201,
      body: {
        user: customerId,
        room: roomId,
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + 86400000).toISOString(),
        status: 'pending',
        totalAmount: 120,
      },
    });

    bookingId = createRes.json?.data?._id;
    assert(bookingId, 'Booking create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/bookings', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Booking list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === bookingId), 'Created booking missing from list.');

    await requestJson(baseUrl, `/api/bookings/${bookingId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/bookings/${bookingId}`, {
      method: 'PUT',
      token: customerToken,
      expectedStatus: 200,
      body: { status: 'confirmed', notes: 'Updated by smoke test' },
    });

    assert(updateRes.json?.data?.status === 'confirmed', 'Booking update did not persist status.');
  });

  await withStep(results, 'payments.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/payments', {
      method: 'POST',
      token: customerToken,
      expectedStatus: 201,
      body: {
        amount: 120,
        method: 'Cash',
        status: 'Pending',
        booking: bookingId,
      },
    });

    const paymentId = createRes.json?.data?._id;
    assert(paymentId, 'Payment create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/payments', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Payment list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === paymentId), 'Created payment missing from list.');

    await requestJson(baseUrl, `/api/payments/${paymentId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/payments/${paymentId}`, {
      method: 'PUT',
      token: customerToken,
      expectedStatus: 200,
      body: { status: 'Completed', reference: runId },
    });

    assert(updateRes.json?.data?.status === 'Completed', 'Payment update did not persist status.');

    await requestJson(baseUrl, `/api/payments/${paymentId}`, {
      method: 'DELETE',
      token: customerToken,
      expectedStatus: 200,
    });

    await requestJson(baseUrl, `/api/payments/${paymentId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'experiences.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/experiences', {
      method: 'POST',
      token: adminToken,
      expectedStatus: 201,
      body: {
        title: 'Sunrise Mountain Hike',
        description: 'Guided hike with breakfast.',
        category: 'Hiking',
        price: 60,
        durationHours: 4,
        capacity: 10,
        scheduleDate: new Date(Date.now() + 172800000).toISOString(),
        status: 'Available',
      },
    });

    experienceId = createRes.json?.data?._id;
    assert(experienceId, 'Experience create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/experiences', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Experience list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === experienceId), 'Created experience missing from list.');

    await requestJson(baseUrl, `/api/experiences/${experienceId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/experiences/${experienceId}`, {
      method: 'PUT',
      token: adminToken,
      expectedStatus: 200,
      body: { status: 'Sold Out' },
    });

    assert(updateRes.json?.data?.status === 'Sold Out', 'Experience update did not persist status.');
  });

  await withStep(results, 'reviews.crud', async () => {
    const createRes = await requestJson(baseUrl, '/api/reviews', {
      method: 'POST',
      token: customerToken,
      expectedStatus: 201,
      body: {
        user: customerId,
        room: roomId,
        experience: experienceId,
        rating: 5,
        comment: 'Great stay and excellent hiking activity.',
        status: 'Visible',
      },
    });

    const reviewId = createRes.json?.data?._id;
    assert(reviewId, 'Review create did not return _id.');

    const listRes = await requestJson(baseUrl, '/api/reviews', { expectedStatus: 200 });
    assert(Array.isArray(listRes.json?.data), 'Review list data is not an array.');
    assert(listRes.json.data.some((x) => x._id === reviewId), 'Created review missing from list.');

    await requestJson(baseUrl, `/api/reviews/${reviewId}`, { expectedStatus: 200 });

    const updateRes = await requestJson(baseUrl, `/api/reviews/${reviewId}`, {
      method: 'PUT',
      token: customerToken,
      expectedStatus: 200,
      body: { rating: 4, comment: 'Still great, but room service can improve.' },
    });

    assert(updateRes.json?.data?.rating === 4, 'Review update did not persist rating.');

    await requestJson(baseUrl, `/api/reviews/${reviewId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });

    await requestJson(baseUrl, `/api/reviews/${reviewId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'bookings.delete', async () => {
    await requestJson(baseUrl, `/api/bookings/${bookingId}`, {
      method: 'DELETE',
      token: customerToken,
      expectedStatus: 200,
    });
    await requestJson(baseUrl, `/api/bookings/${bookingId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'experiences.delete', async () => {
    await requestJson(baseUrl, `/api/experiences/${experienceId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });
    await requestJson(baseUrl, `/api/experiences/${experienceId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'rooms.delete', async () => {
    await requestJson(baseUrl, `/api/rooms/${roomId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });
    await requestJson(baseUrl, `/api/rooms/${roomId}`, { expectedStatus: 404 });
  });

  await withStep(results, 'users.delete', async () => {
    await requestJson(baseUrl, `/api/users/${customerId}`, {
      method: 'DELETE',
      token: adminToken,
      expectedStatus: 200,
    });
    await requestJson(baseUrl, `/api/users/${customerId}`, { token: adminToken, expectedStatus: 404 });
  });

  return results;
}

async function cleanupDatabase(uri) {
  await mongoose.connect(uri);
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
}

async function main() {
  assert(process.env.MONGO_URI, 'MONGO_URI is required in backend/.env for CRUD integration test.');
  assert(process.env.JWT_SECRET, 'JWT_SECRET is required in backend/.env for CRUD integration test.');

  const smokeMongoUri = buildSmokeMongoUri(process.env.MONGO_URI, smokeDbName);
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      MONGO_URI: smokeMongoUri,
      PUBLIC_API_URL: baseUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let logs = '';
  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
  });

  let results = [];

  try {
    await waitForServer(baseUrl);
    results = await runCrudSuite(baseUrl, smokeMongoUri);
  } catch (error) {
    throw new Error(`${error.message}\n\nServer logs:\n${logs}`);
  } finally {
    await stopChild(child);
    await cleanupDatabase(smokeMongoUri).catch(() => null);
  }

  console.log('CRUD integration test passed for 6 modules: users, rooms, bookings, payments, experiences, reviews.');
  for (const result of results) {
    console.log(`- ${result.name}: PASS`);
  }
}

main().catch((error) => {
  console.error('CRUD integration test failed.');
  console.error(error.message);
  process.exit(1);
});
