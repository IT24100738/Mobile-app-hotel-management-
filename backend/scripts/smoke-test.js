const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');

const requiredEnvKeys = ['NODE_ENV', 'PORT', 'MONGO_URI', 'JWT_SECRET'];
const envExamplePath = path.join(projectRoot, '.env.example');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function collectJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'uploads') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function runSyntaxCheck(files) {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const wrapped = `(function (exports, require, module, __filename, __dirname) {${source}\n})`;
    new vm.Script(wrapped, { filename: file });
  }
}

function checkEnvExample() {
  assert(fs.existsSync(envExamplePath), 'Missing backend/.env.example');
  const content = fs.readFileSync(envExamplePath, 'utf8');
  for (const key of requiredEnvKeys) {
    assert(content.includes(`${key}=`), `Missing ${key} in backend/.env.example`);
  }
}

function checkRouteWiring() {
  const routeDefs = [
    ['/api/rooms', '../routes/roomRoutes'],
    ['/api/users', '../routes/userRoutes'],
    ['/api/bookings', '../routes/bookingRoutes'],
    ['/api/payments', '../routes/paymentRoutes'],
    ['/api/experiences', '../routes/experienceRoutes'],
    ['/api/reviews', '../routes/reviewRoutes'],
  ];

  for (const [mountPath, modulePath] of routeDefs) {
    const router = require(modulePath);
    assert(router && Array.isArray(router.stack), `Router ${modulePath} is invalid`);
    assert(router.stack.length > 0, `Router ${modulePath} has no registered routes`);
    assert(mountPath.startsWith('/api/'), `Unexpected mount path: ${mountPath}`);
  }
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

function requestHealth(port) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path: '/',
        timeout: 1000,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      }
    );

    req.on('timeout', () => req.destroy(new Error('Health request timed out')));
    req.on('error', reject);
  });
}

function wait(ms) {
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
    }, 2000);
  });
}

async function runLiveApiPing() {
  const port = await getFreePort();
  const child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      SMOKE_TEST: '1',
      NODE_ENV: 'test',
      PORT: String(port),
      JWT_SECRET: process.env.JWT_SECRET || 'smoke-test-secret',
      MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smoke-test',
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

  try {
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      if (child.exitCode !== null) {
        throw new Error(`Server exited before health check. Logs:\n${logs}`);
      }

      try {
        const response = await requestHealth(port);
        assert(response.statusCode === 200, `Expected GET / to return 200, got ${response.statusCode}`);
        assert(
          response.body.includes('Hotel Management API is running'),
          'Health endpoint body did not match expected text'
        );
        return;
      } catch (error) {
        await wait(250);
      }
    }

    throw new Error(`Timed out waiting for API health response. Logs:\n${logs}`);
  } finally {
    await stopChild(child);
  }
}

async function main() {
  checkEnvExample();

  const jsFiles = collectJsFiles(projectRoot);
  assert(jsFiles.length > 0, 'No JavaScript files found in backend');
  runSyntaxCheck(jsFiles);

  checkRouteWiring();
  await runLiveApiPing();

  console.log('Backend smoke test passed.');
  console.log(`Validated ${jsFiles.length} JS files, env template, route wiring, and live API health check.`);
}

main().catch((error) => {
  console.error('Backend smoke test failed.');
  console.error(error.message);
  process.exit(1);
});
