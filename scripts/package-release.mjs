import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const required = ['track-cafedra-backend/pom.xml', 'track-cafedra-backend/src/main/resources/schema.sql',
  'track-cafedra-backend/telegram-bot/pom.xml'];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing backend source: ${file}`);
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const name = `track-cafedra-${stamp}`;
const stage = path.join(root, 'dist', name);
fs.mkdirSync(stage, { recursive: true });
const ignored = new Set(['.git', 'node_modules', '.next', 'out', 'dist', 'target', '.idea', '.deploy-keys', 'backups']);
const filter = file => {
  const base = path.basename(file);
  if (base.startsWith('.verify.')) return false;
  if (ignored.has(base) || /\.(log|tsbuildinfo|pem|key|dump)$/.test(base)) return false;
  if (base.startsWith('.env')) return base.endsWith('.example');
  return !['RELEASE.json', 'server_ed25519', 'server_ed25519.pub'].includes(base);
};
const entries = ['Components', 'fonts', 'hooks', 'image', 'lib', 'pages', 'public', 'styles', 'types', 'utils',
  'scripts', 'deploy', '__tests__', '__mocks__', '.github', 'track-cafedra-backend', '.dockerignore',
  '.gitignore', '.gitattributes', '.env.example', '.eslintrc.json', 'Dockerfile', 'compose.production.yml',
  'package.json', 'package-lock.json', 'next.config.js', 'tsconfig.json', 'postcss.config.js',
  'tailwind.config.js', 'jest.config.js', 'jest.setup.ts', 'jest.d.ts', 'typedoc.json', 'README.md', 'DEPLOY.md'];
for (const entry of entries) fs.cpSync(entry, path.join(stage, entry), { recursive: true, filter });
function git(dir, ...args) {
  try { return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return 'unavailable'; }
}
const manifest = { createdAt: new Date().toISOString(), frontendCommit: git(root, 'rev-parse', 'HEAD'),
  backendCommit: git(path.join(root, 'track-cafedra-backend'), 'rev-parse', 'HEAD'),
  frontendChanges: git(root, 'status', '--porcelain'),
  backendChanges: git(path.join(root, 'track-cafedra-backend'), 'status', '--porcelain'),
  nextVersion: JSON.parse(fs.readFileSync('package.json', 'utf8')).dependencies.next };
fs.writeFileSync(path.join(stage, 'deploy', 'RELEASE.json'), JSON.stringify(manifest, null, 2) + '\n');
const archive = path.join(root, 'dist', `${name}.tar.gz`);
execFileSync('tar', ['-czf', archive, '-C', path.join(root, 'dist'), name], { stdio: 'inherit' });
const sha = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
fs.writeFileSync(`${archive}.sha256`, `${sha}  ${path.basename(archive)}\n`);
console.log(`Release: ${archive}\nSHA256: ${sha}\nIncludes both repositories and local changes. Secrets and build outputs are excluded.`);
