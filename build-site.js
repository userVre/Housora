const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { defaultOrigin, port: configuredTestPort } = require('./scripts/test-config');

const root = __dirname;
const isWindows = process.platform === 'win32';
const wrapper = path.join(root, isWindows ? 'gradlew.bat' : 'gradlew');
const port = Number(process.env.BUILD_PORT || configuredTestPort);
const buildOrigin = process.env.BUILD_PORT ? `http://127.0.0.1:${port}` : defaultOrigin;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...options.env },
      stdio: options.stdio || 'inherit',
      shell: isWindows && command.endsWith('.bat')
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with ${signal || `code ${code}`}`));
    });
  });
}

function waitForServer(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const request = http.get(buildOrigin + '/', response => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) resolve();
        else retry();
      });
      request.on('error', retry);
      request.setTimeout(2000, () => request.destroy());
    };
    const retry = () => {
      if (Date.now() >= deadline) {
        reject(new Error(`Ktor did not become ready at ${buildOrigin} within ${timeoutMs / 1000} seconds.`));
      } else {
        setTimeout(attempt, 300);
      }
    };
    attempt();
  });
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  server.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => server.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 5000))
  ]);
  if (server.exitCode === null) server.kill('SIGKILL');
}

async function build() {
  console.log('Compiling the Ktor application...');
  await run(wrapper, ['installDist', '--no-daemon']);

  const executable = path.join(root, 'build', 'install', 'housora-ai', 'bin', isWindows ? 'housora-ai.bat' : 'housora-ai');
  console.log(`Starting the build server at ${buildOrigin}...`);
  const serverEnv = { ...process.env, PORT: String(port) };
  const shellWebsiteUrl = process.env.PUBLIC_SITE_URL || process.env.YOUR_WEBSITE_URL;
  // When neither variable exists in the shell, leave YOUR_WEBSITE_URL unset so
  // the Kotlin dotenv loader can read the value from .env. Passing an empty
  // string here overrides a valid .env value.
  if (shellWebsiteUrl) serverEnv.YOUR_WEBSITE_URL = shellWebsiteUrl;
  const server = spawn(executable, [], {
    cwd: root,
    env: serverEnv,
    stdio: 'inherit',
    shell: isWindows
  });

  try {
    await waitForServer();
    console.log('Exporting public routes...');
    await run(process.execPath, ['build-static.js'], {
      env: { BUILD_ORIGIN: buildOrigin }
    });
    console.log('Verifying Ktor/static route parity, links, fragments, and assets...');
    await run(process.execPath, ['route-crawler.js'], {
      env: { LOCAL_ORIGIN: buildOrigin, DIST_DIR: path.join(root, 'dist') }
    });
  } finally {
    await stopServer(server);
  }
}

build().catch(error => {
  console.error(`Build failed: ${error.message}`);
  process.exitCode = 1;
});
