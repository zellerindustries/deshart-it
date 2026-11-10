import { execFileSync } from 'node:child_process';
import { globSync } from 'node:fs';
import path from 'node:path';
import { startDistServer } from './serve-dist.mjs';

const port = 47_284;
const root = path.resolve(import.meta.dirname, '..');
const distDir = path.join(root, 'dist');
const files = globSync('**/*.html', { cwd: distDir });

if (files.length === 0) {
  console.error('No built HTML files found in dist/ — run `npm run build` first.');
  process.exit(1);
}

// Root-absolute asset paths (e.g. /style.css) only resolve correctly against
// an actual web root — file:// URLs resolve them to the filesystem drive root
// instead, so pages must be crawled over HTTP, not opened as local files.
const urls = files.map((f) => `http://localhost:${port}/${f.replace(/\\/g, '/')}`);
const axeCli = path.join(root, 'node_modules', '@axe-core', 'cli', 'dist', 'src', 'bin', 'cli.js');

let stopServer = () => {};

try {
  stopServer = await startDistServer(port);
  execFileSync(process.execPath, [axeCli, ...urls, '--exit'], { stdio: 'inherit' });
} catch (err) {
  process.exitCode = err.status ?? 1;
} finally {
  stopServer();
}
