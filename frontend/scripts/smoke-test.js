const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist-smoke');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requireFiles(paths) {
  for (const relPath of paths) {
    const fullPath = path.join(projectRoot, relPath);
    assert(fs.existsSync(fullPath), `Missing required file: ${relPath}`);
  }
}

function checkEnvExample() {
  const envPath = path.join(projectRoot, '.env.example');
  assert(fs.existsSync(envPath), 'Missing frontend/.env.example');
  const content = fs.readFileSync(envPath, 'utf8');

  const keys = [
    'EXPO_PUBLIC_API_BASE_URL=',
    'EXPO_PUBLIC_API_EXTRA_HOSTS=',
    'EXPO_PUBLIC_API_PORT=',
  ];

  for (const key of keys) {
    assert(content.includes(key), `Missing ${key} in frontend/.env.example`);
  }
}

function runExpoBundleSmoke() {
  fs.rmSync(distDir, { recursive: true, force: true });

  const result = spawnSync(
    'npx',
    ['expo', 'export', '--platform', 'android', '--output-dir', 'dist-smoke'],
    {
      cwd: projectRoot,
      env: { ...process.env, CI: '1' },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  assert(result.status === 0, 'Expo Android export failed');
  assert(fs.existsSync(path.join(distDir, 'metadata.json')), 'Smoke export missing metadata.json');

  fs.rmSync(distDir, { recursive: true, force: true });
}

function main() {
  requireFiles(['App.js', 'app.json', 'src/config/api.js']);
  checkEnvExample();
  runExpoBundleSmoke();

  console.log('Frontend smoke test passed.');
  console.log('Validated env template and Android bundle export.');
}

try {
  main();
} catch (error) {
  console.error('Frontend smoke test failed.');
  console.error(error.message);
  process.exit(1);
}
