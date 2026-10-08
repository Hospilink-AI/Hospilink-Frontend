// Web build: the app and the public site on one domain.
//   1. Export the Expo web app to dist/ and move its page to dist/app.html.
//   2. Build the Astro site (marketing/) and copy it into dist/, so "/" and the public pages are static.
// vercel.json serves real files first and sends every other path (the app's routes) to /app.html.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const site = join(root, 'marketing');
const siteOut = join(root, '.site-dist');
const run = (cmd, cwd = root, env = {}) => execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, ...env } });

rmSync(dist, { recursive: true, force: true });
rmSync(siteOut, { recursive: true, force: true });

run('npx expo export --platform web --output-dir dist', root, { EXPO_PUBLIC_MARKETING_URL: process.env.EXPO_PUBLIC_MARKETING_URL ?? '/' });
renameSync(join(dist, 'index.html'), join(dist, 'app.html'));

if (!existsSync(join(site, 'node_modules'))) run('npm ci', site);
run('npx astro build', site, { ASTRO_OUT: siteOut });

// The site must not overwrite the app's files.
const clashes = [];
const walk = (dir, rel = '') => {
  for (const name of readdirSync(dir)) {
    const from = join(dir, name);
    const to = join(dist, rel, name);
    if (statSync(from).isDirectory()) walk(from, join(rel, name));
    else if (existsSync(to)) clashes.push(join(rel, name));
  }
};
walk(siteOut);
if (clashes.length) {
  console.error(`The site and the app both produce: ${clashes.join(', ')}`);
  process.exit(1);
}
cpSync(siteOut, dist, { recursive: true });
rmSync(siteOut, { recursive: true, force: true });
console.log('Web build ready in dist/ (site at /, app at /app.html for every other route).');
