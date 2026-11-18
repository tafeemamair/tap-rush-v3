import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'www');
const assets = ['index.html', 'style.css', 'app.js', 'score-challenge.js'];

for (const file of assets) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Build failed: missing required web asset ${file}`);
  }
}

const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const file of assets.slice(1)) {
  if (!html.includes(file)) {
    throw new Error(`Build failed: index.html does not reference ${file}`);
  }
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const file of assets) cpSync(join(root, file), join(output, file));
console.log(`Tap Rush Android web assets prepared in ${output}`);
