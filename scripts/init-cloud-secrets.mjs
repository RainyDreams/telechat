import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import process from 'node:process';

const WRANGLER_CONFIG_PATH = 'backend/wrangler.toml';
const isWindows = process.platform === 'win32';
const WRANGLER_BIN = isWindows ? 'cmd.exe' : 'npx';

const secrets = [
  {
    name: 'INVITE_SIGNING_SECRET',
    value: randomBytes(32).toString('base64url'),
    description: 'Backend invite signing key',
  },
];

const putSecret = ({ name, value, description }) => new Promise((resolve, reject) => {
  const args = isWindows
    ? ['/d', '/s', '/c', `npx wrangler secret put ${name} --config ${WRANGLER_CONFIG_PATH}`]
    : ['wrangler', 'secret', 'put', name, '--config', WRANGLER_CONFIG_PATH];

  const child = spawn(
    WRANGLER_BIN,
    args,
    {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: false,
    }
  );

  child.on('error', reject);
  child.stdin.write(value);
  child.stdin.end();

  child.on('close', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`Failed to write ${name} (${description}), exit code ${code}`));
  });
});

const main = async () => {
  console.log('Initializing Cloudflare secrets...');
  for (const secret of secrets) {
    console.log(`- ${secret.name}: ${secret.description}`);
    await putSecret(secret);
  }
  console.log('Cloudflare secrets initialized.');
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
