const { spawn } = require('child_process');
const path = require('path');

const task = process.argv[2] || 'run';
const wrapper = path.join(__dirname, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');
const child = spawn(wrapper, [task, '--no-daemon'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('error', error => {
  console.error(`Unable to start Gradle: ${error.message}`);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Gradle stopped with signal ${signal}.`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = code ?? 1;
});
