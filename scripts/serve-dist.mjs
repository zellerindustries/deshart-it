import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const serveBin = path.join(root, 'node_modules', 'serve', 'build', 'main.js');

export async function startDistServer(port) {
  const server = spawn(process.execPath, [serveBin, './dist', '-l', String(port)], {
    cwd: root,
    stdio: 'ignore',
  });

  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok) {
        const body = await res.text();
        const expected = readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
        if (body.trim() !== expected.trim()) {
          server.kill();
          throw new Error(
            `Port ${port} is serving unrelated content (not this site) — pick a different port.`,
          );
        }
        return () => server.kill();
      }
    } catch (err) {
      if (err.message.includes('unrelated content')) throw err;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  server.kill();
  throw new Error('Local server did not start in time');
}
