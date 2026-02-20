import { execSync } from 'node:child_process';
import path from 'node:path';

declare global {
  var __TEARDOWN_MESSAGE__: string;
}

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const workspaceRoot = path.resolve(__dirname, '../../../../');
  execSync('docker compose down', {
    cwd: workspaceRoot,
    stdio: 'inherit',
  });
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
