const { spawn } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting The Apollo University Lost & Found Portal (Backend + Frontend)...');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const server = spawn(npmCmd, ['start', '--prefix', 'backend'], {
  stdio: 'inherit',
  shell: true
});

const client = spawn(npmCmd, ['run', 'dev', '--prefix', 'frontend'], {
  stdio: 'inherit',
  shell: true
});

const cleanExit = () => {
  try { server.kill(); } catch (e) {}
  try { client.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
