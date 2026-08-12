const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { defaultOrigin, port } = require('./test-config');

const root = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const wrapper = path.join(root, isWindows ? 'gradlew.bat' : 'gradlew');
const targetArgument = process.argv[2];

if (!targetArgument) {
  throw new Error('Usage: node scripts/site-audit-runner.js <audit-script> [arguments...]');
}

const target = path.resolve(root, targetArgument);
if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
  throw new Error(`Audit target must be an existing file inside ${root}: ${targetArgument}`);
}

function run(command, args, environment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...environment },
      stdio: 'inherit',
      shell: isWindows && command.endsWith('.bat'),
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} exited with ${signal || `code ${code}`}`));
    });
  });
}

function assertPortAvailable() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', error => reject(new Error(`Test port ${port} is unavailable: ${error.message}`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}

function waitForServer(server, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const retry = () => {
      if (server.exitCode !== null) {
        reject(new Error(`Test server exited with code ${server.exitCode} before becoming ready.`));
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(`Test server did not become ready at ${defaultOrigin}.`));
        return;
      }
      setTimeout(attempt, 300);
    };
    const attempt = () => {
      const request = http.get(defaultOrigin + '/', response => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) resolve();
        else retry();
      });
      request.on('error', retry);
      request.setTimeout(2_000, () => request.destroy());
    };
    attempt();
  });
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  const stop = signal => {
    try {
      if (isWindows) server.kill(signal);
      else process.kill(-server.pid, signal);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  };
  stop('SIGTERM');
  await Promise.race([
    new Promise(resolve => server.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 5_000)),
  ]);
  if (server.exitCode === null) stop('SIGKILL');
}

async function main() {
  await run(process.execPath, ['scripts/build-assets.js']);
  await run(wrapper, ['installDist', '--no-daemon']);
  await assertPortAvailable();

  const executable = path.join(
    root,
    'build',
    'install',
    'housora-ai',
    'bin',
    isWindows ? 'housora-ai.bat' : 'housora-ai',
  );
  const server = spawn(executable, [], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit',
    shell: isWindows,
    detached: !isWindows,
  });

  try {
    await waitForServer(server);
    await run(process.execPath, ['build-static.js'], { BUILD_ORIGIN: defaultOrigin });
    await run(process.execPath, ['scripts/publish-assets.js']);
    await run(process.execPath, [target, ...process.argv.slice(3)], {
      BUILD_ORIGIN: defaultOrigin,
      LOCAL_ORIGIN: defaultOrigin,
      SITE_URL: defaultOrigin,
      DIST_DIR: path.join(root, 'dist'),
    });
  } finally {
    await stopServer(server);
  }
}

main().catch(error => {
  console.error(`Site audit failed: ${error.stack || error.message}`);
  process.exitCode = 1;
});
