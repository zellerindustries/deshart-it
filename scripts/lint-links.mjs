import { spawn } from 'node:child_process';
import path from 'node:path';
import { startDistServer } from './serve-dist.mjs';

const port = 47_283;
const root = path.resolve(import.meta.dirname, '..');
const linkinatorCli = path.join(root, 'node_modules', 'linkinator', 'build', 'src', 'cli.js');

let stopServer = () => {};

try {
  stopServer = await startDistServer(port);
  await new Promise((resolve, reject) => {
    const linkinator = spawn(
      process.execPath,
      [linkinatorCli, `http://localhost:${port}`, '--recurse'],
      { cwd: root, stdio: 'inherit' },
    );
    linkinator.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  stopServer();
}
