import { spawnSync } from 'child_process';

/** @param {string} command */
function run(command) {
  const res = spawnSync(command, { stdio: 'inherit', shell: true });

  if (res.error) {
    console.error(res.error);

    return 1;
  }
  return res.status ?? 1;
}

const projectRoot = process.argv[2];

if (!projectRoot) {
  console.error('Missing {projectRoot} argument.');
  process.exit(2);
}

let exitCode = 0;

try {
  exitCode = run(
    'docker compose --profile frontend-e2e up -d --build --wait',
  );

  if (exitCode === 0) {
    exitCode = run(`npx cypress run --project ${projectRoot}`);
  }
} finally {
  const downCode = run('docker compose --profile frontend-e2e down');
  if (exitCode === 0 && downCode !== 0) {
    exitCode = downCode;
  }
}

process.exit(exitCode);
