import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sitekitDir = path.join(root, 'node_modules', '@minimaz', 'sitekit');
const defaultPort = 4173;

/**
 * Port `mz serve` listens on, from `serve.port` in minimaz.config.json.
 * @returns {number} The configured port, or 4173 when unset.
 */
export function getServePort() {
  try {
    const config = JSON.parse(readFileSync(path.join(root, 'minimaz.config.json'), 'utf8'));
    return config.serve?.port ?? defaultPort;
  } catch {
    return defaultPort;
  }
}

/**
 * Starts `mz serve` for ./dist and waits until it serves this site's index page.
 * @param {number} port - Port from getServePort().
 * @returns {Promise<() => void>} Function that stops the server.
 */
export async function startDistServer(port) {
  const pkg = JSON.parse(readFileSync(path.join(sitekitDir, 'package.json'), 'utf8'));
  const mzBin = path.join(sitekitDir, pkg.bin.mz);
  const getTitle = (html) => /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1].trim() ?? '';
  const expectedTitle = getTitle(readFileSync(path.join(root, 'dist', 'index.html'), 'utf8'));
  const server = spawn(process.execPath, [mzBin, 'serve'], { cwd: root, stdio: 'ignore' });

  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok) {
        // mz serve injects a live-reload snippet, so compare the page title rather than the full body.
        if (getTitle(await res.text()) !== expectedTitle) {
          server.kill();
          throw new Error(
            `Port ${port} is serving unrelated content (not this site) — stop the other server or change serve.port in minimaz.config.json.`,
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
