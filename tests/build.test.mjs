import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const read = path => readFileSync(resolve(root, path), 'utf8');
const html = read('index.html');
const js = read('app.js');
const share = read('score-challenge.js');

test('all three game modes have start buttons and separate high-score fields', () => {
  for (const id of ['btn-play', 'btn-play-timed', 'btn-play-focus',
    'start-high-score', 'start-timed-high-score', 'start-focus-high-score']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  for (const key of ['highScore', 'timedHighScore', 'focusHighScore']) {
    assert.match(js, new RegExp(`\\b${key}\\b`));
  }
});

test('score challenge is loaded after main engine', () => {
  const main = html.indexOf('src="app.js"');
  const challenge = html.indexOf('src="score-challenge.js"');
  assert.ok(main !== -1 && challenge > main);
  assert.match(share, /navigator\.share/);
});

test('timed modes have deadline guards at gameplay boundaries', () => {
  assert.match(js, /enforceTimedDeadline\(\)/);
  for (const entry of ['scheduleNextSpawn()', 'spawnTarget()', 'handleTargetHit(id, type, x, y)',
    'handleTargetMiss(id, type, x, y)']) {
    assert.ok(js.includes(entry), `Missing engine entry ${entry}`);
  }
  assert.match(js, /if \(Date\.now\(\) < this\.timedDeadline\) return false;/);
});

test('native web asset paths are relative', () => {
  assert.doesNotMatch(html, /(?:src|href)="\/(?!\/)/);
  assert.match(html, /name="viewport"/);
});
