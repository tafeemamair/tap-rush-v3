import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');

class FakeClock {
  now = 1_000_000;
  nextId = 1;
  jobs = new Map();

  setTimeout = (callback, delay = 0) => this.add(callback, delay, 0);
  setInterval = (callback, delay = 0) => this.add(callback, delay, Math.max(1, delay));
  clearTimeout = id => this.jobs.delete(id);
  clearInterval = id => this.jobs.delete(id);

  add(callback, delay, interval) {
    const id = this.nextId++;
    this.jobs.set(id, { id, callback, due: this.now + Math.max(0, Number(delay) || 0), interval });
    return id;
  }

  advance(ms) {
    const end = this.now + ms;
    let callbacks = 0;
    while (true) {
      const next = [...this.jobs.values()].filter(job => job.due <= end).sort((a, b) => a.due - b.due || a.id - b.id)[0];
      if (!next) break;
      if (++callbacks > 10_000) throw new Error('Fake clock callback limit exceeded');
      this.now = next.due;
      if (next.interval) next.due += next.interval;
      else this.jobs.delete(next.id);
      next.callback();
    }
    this.now = end;
  }

  countIntervals() { return [...this.jobs.values()].filter(job => job.interval).length; }
}

class FakeElement {
  constructor(id = '') {
    this.id = id;
    this.listeners = new Map();
    this.children = [];
    this.parentNode = null;
    this.parentElement = null;
    this.style = {};
    this.dataset = {};
    this.className = '';
    this.textContent = '';
    this._innerHTML = '';
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      remove: (...names) => names.forEach(name => this.classes.delete(name)),
      contains: name => this.classes.has(name),
      toggle: (name, force) => {
        const add = force === undefined ? !this.classes.has(name) : Boolean(force);
        if (add) this.classes.add(name); else this.classes.delete(name);
        return add;
      }
    };
    this.attributes = {};
  }
  set innerHTML(value) { this._innerHTML = value; if (value === '') this.children = []; }
  get innerHTML() { return this._innerHTML; }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  dispatch(type, event = {}) {
    const normalized = { target: this, stopPropagation() {}, ...event };
    let result;
    for (const callback of this.listeners.get(type) || []) result = callback(normalized);
    return result ?? normalized;
  }
  appendChild(child) { child.parentNode = this; child.parentElement = this; this.children.push(child); return child; }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
    this.parentElement = null;
  }
  querySelectorAll(selector) { return selector === '.pip' ? this.pips : []; }
  querySelector(selector) { return selector === '.btn-group' ? this.buttonGroup : null; }
  insertAdjacentElement(_position, element) { this.adjacent = element; return element; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getBoundingClientRect() { return { left: 0, top: 0, right: 400, bottom: 700, width: 400, height: 700 }; }
}

function createHarness({ storageThrows = false } = {}) {
  const clock = new FakeClock();
  const ids = [...readFileSync(resolve(root, 'index.html'), 'utf8').matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const elements = new Map(ids.map(id => [id, new FakeElement(id)]));
  const listeners = new Map();
  const windowListeners = new Map();
  const storage = new Map();
  const body = new FakeElement('body');
  const playfield = elements.get('playfield');
  const canvas = elements.get('fx-canvas');
  canvas.parentElement = { clientWidth: 400, clientHeight: 700 };
  canvas.getContext = () => ({ clearRect() {}, save() {}, beginPath() {}, arc() {}, fill() {}, restore() {} });
  const gameover = elements.get('screen-gameover');
  const actionGroup = new FakeElement('gameover-actions');
  gameover.buttonGroup = actionGroup;
  gameover.appendChild(actionGroup);
  elements.get('hud-lives').pips = [new FakeElement(), new FakeElement(), new FakeElement()];
  const document = {
    body,
    hidden: false,
    getElementById: id => {
      if (elements.has(id)) return elements.get(id);
      const pending = [gameover, ...elements.values()];
      while (pending.length) {
        const element = pending.pop();
        if (element?.id === id) return element;
        if (element?.children) pending.push(...element.children);
      }
      return null;
    },
    createElement: () => new FakeElement(),
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(callback);
    },
    dispatch(type) { for (const callback of listeners.get(type) || []) callback(); }
  };
  const window = {
    AudioContext: class { constructor() { this.state = 'running'; } },
    addEventListener(type, callback) {
      if (!windowListeners.has(type)) windowListeners.set(type, []);
      windowListeners.get(type).push(callback);
    },
    prompt: (...args) => { window.prompts.push(args); },
    prompts: []
  };
  class FakeDate extends Date {
    static now() { return clock.now; }
  }
  const context = vm.createContext({
    document, window, navigator: {}, Date: FakeDate,
    localStorage: {
      getItem(key) { if (storageThrows) throw new Error('storage blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (storageThrows) throw new Error('storage blocked'); storage.set(key, value); }
    },
    setTimeout: clock.setTimeout, clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval, clearInterval: clock.clearInterval,
    requestAnimationFrame() {}, console,
  });
  vm.runInContext(readFileSync(resolve(root, 'app.js'), 'utf8'), context, { filename: 'app.js' });
  const domReady = [...(windowListeners.get('DOMContentLoaded') || [])];
  for (const callback of domReady) callback();
  const game = window.gameInstance;
  for (const method of ['playHit', 'playGold', 'playQuantum', 'playShield', 'playDisarm', 'playPenalty', 'playMilestone', 'playEventStart', 'playFever']) game.sound[method] = () => {};
  game.fx.createExplosion = () => {};
  return { clock, game, document, window, elements, playfield, storage, context };
}

function stopAutomaticSpawn(game, clock) {
  clock.clearTimeout(game.spawnTimer);
  game.spawnTimer = null;
}

function addTarget(game, type = 'standard', id = 9000) {
  const element = new FakeElement(`target-${id}`);
  game.playfield.appendChild(element);
  game.activeTargets.set(id, { element, timer: 0, type });
  return id;
}

function hitStandard(game, id = 9000) {
  const targetId = addTarget(game, 'standard', id);
  game.handleTargetHit(targetId, 'standard', 10, 10);
}

function saved(harness) {
  return JSON.parse(harness.storage.get('tap_rush_archive_v3'));
}

test('endless spawns targets, scores once per target, and ignores duplicate taps', () => {
  const h = createHarness();
  h.elements.get('btn-play').dispatch('click');
  stopAutomaticSpawn(h.game, h.clock);
  h.game.spawnTarget();
  const [id] = h.game.activeTargets.keys();
  const target = h.game.activeTargets.get(id).element;
  target.dispatch('pointerdown');
  target.dispatch('pointerdown');
  assert.equal(h.game.score, 100);
  assert.equal(h.game.combo, 1);
  assert.equal(h.game.totalTaps, 1);
});

test('endless target expiry removes the target, breaks combo, and costs a life', () => {
  const h = createHarness();
  h.game.startGame('endless');
  stopAutomaticSpawn(h.game, h.clock);
  h.game.spawnTarget();
  const [id] = h.game.activeTargets.keys();
  assert.ok(h.playfield.children.includes(h.game.activeTargets.get(id).element));
  h.game.combo = 3;
  const expiry = h.clock.jobs.get(h.game.activeTargets.get(id).timer);
  h.clock.advance(expiry.due - h.clock.now);
  assert.equal(h.game.lives, 2);
  assert.equal(h.game.combo, 0);
  assert.equal(h.game.activeTargets.size, 0);
});

test('endless game over saves the separate high score once and retry resets run state', () => {
  const h = createHarness();
  h.game.startGame('endless');
  stopAutomaticSpawn(h.game, h.clock);
  hitStandard(h.game);
  h.game.deductLife();
  h.game.deductLife();
  h.game.deductLife();
  h.clock.advance(350);
  assert.equal(saved(h).highScore, 100);
  assert.equal(saved(h).totalRuns, 1);
  h.elements.get('btn-retry').dispatch('click');
  assert.equal(h.game.isRunning, true);
  assert.equal(h.game.mode, 'endless');
  assert.equal(h.game.score, 0);
  assert.equal(h.game.lives, 3);
});

test('timed hit is accepted immediately before the deadline', () => {
  const h = createHarness();
  h.game.startGame('timed');
  stopAutomaticSpawn(h.game, h.clock);
  const id = addTarget(h.game);
  h.clock.now = h.game.timedDeadline - 1;
  h.game.handleTargetHit(id, 'standard', 10, 10);
  assert.equal(h.game.score, 100);
  assert.equal(h.game.isRunning, true);
});

test('timed hits are rejected at expiry and a delayed spawn callback cannot spawn afterward', () => {
  const h = createHarness();
  h.game.startGame('timed');
  stopAutomaticSpawn(h.game, h.clock);
  const id = addTarget(h.game);
  h.clock.now = h.game.timedDeadline;
  h.game.handleTargetHit(id, 'standard', 10, 10);
  assert.equal(h.game.score, 0);
  assert.equal(h.game.isRunning, false);
  assert.equal(h.game.hudTimer.textContent, '0s');
  assert.equal(h.game.activeTargets.size, 0);

  const delayed = createHarness();
  delayed.game.startGame('timed');
  const spawnJob = delayed.clock.jobs.get(delayed.game.spawnTimer);
  assert.ok(spawnJob);
  delayed.clock.now = delayed.game.timedDeadline + 1;
  spawnJob.callback();
  assert.equal(delayed.game.score, 0);
  assert.equal(delayed.game.isRunning, false);
  assert.equal(delayed.game.targetIdCounter, 0);
  assert.equal(delayed.game.activeTargets.size, 0);
});

test('timed expiry clears its interval and timed score does not overwrite endless best', () => {
  const h = createHarness();
  h.game.persistence.data.highScore = 900;
  h.game.startGame('timed');
  stopAutomaticSpawn(h.game, h.clock);
  hitStandard(h.game);
  h.clock.now = h.game.timedDeadline;
  h.game.updateTimedClock();
  assert.equal(h.game.isRunning, false);
  assert.equal(h.game.timedTicker, null);
  assert.equal(h.clock.countIntervals(), 0);
  assert.equal(saved(h).timedHighScore, 100);
  assert.equal(saved(h).highScore, 900);
});

test('timed retry starts a fresh 60-second deadline and preserves its best', () => {
  const h = createHarness();
  h.game.startGame('timed');
  stopAutomaticSpawn(h.game, h.clock);
  const firstDeadline = h.game.timedDeadline;
  hitStandard(h.game);
  h.game.endGame();
  h.clock.advance(350);
  h.clock.advance(20);
  h.elements.get('btn-retry').dispatch('click');
  assert.equal(h.game.mode, 'timed');
  assert.equal(h.game.timedDeadline, h.clock.now + 60_000);
  assert.ok(h.game.timedDeadline > firstDeadline);
  assert.equal(h.game.persistence.data.timedHighScore, 100);
});

test('focus cyan scores; red tap loses shield and ignored red is disarmed without points', () => {
  const h = createHarness();
  h.game.startGame('focus');
  stopAutomaticSpawn(h.game, h.clock);
  let id = addTarget(h.game, 'standard');
  h.game.handleTargetHit(id, 'standard', 10, 10);
  assert.equal(h.game.score, 100);
  assert.equal(h.game.combo, 1);
  const scoreAfterCyan = h.game.score;
  id = addTarget(h.game, 'danger');
  h.game.handleTargetHit(id, 'danger', 10, 10);
  assert.equal(h.game.lives, 2);
  assert.equal(h.game.combo, 0);
  id = addTarget(h.game, 'danger');
  h.game.handleTargetMiss(id, 'danger', 10, 10);
  assert.equal(h.game.lives, 2);
  assert.equal(h.game.score, scoreAfterCyan);
  assert.equal(h.game.trapsDisarmed, 1);
});

test('focus accuracy is reflected in results and focus best remains independent', () => {
  const h = createHarness();
  h.game.persistence.data.highScore = 777;
  h.game.persistence.data.timedHighScore = 333;
  h.game.startGame('focus');
  stopAutomaticSpawn(h.game, h.clock);
  let id = addTarget(h.game, 'standard');
  h.game.handleTargetHit(id, 'standard', 1, 1);
  id = addTarget(h.game, 'danger');
  h.game.handleTargetHit(id, 'danger', 1, 1);
  h.game.endGame();
  assert.equal(h.elements.get('go-accuracy').textContent, '50%');
  assert.equal(saved(h).focusHighScore, 100);
  assert.equal(saved(h).timedHighScore, 333);
  assert.equal(saved(h).highScore, 777);
});

test('focus difficulty increases spawn pressure and shortens target duration with valid hits', () => {
  const h = createHarness();
  h.game.startGame('focus');
  stopAutomaticSpawn(h.game, h.clock);
  h.game.validHits = 0;
  h.game.scheduleNextSpawn();
  const initialDelay = h.clock.jobs.get(h.game.spawnTimer).due - h.clock.now;
  h.clock.clearTimeout(h.game.spawnTimer);
  h.game.validHits = 10;
  h.game.scheduleNextSpawn();
  const fasterDelay = h.clock.jobs.get(h.game.spawnTimer).due - h.clock.now;
  assert.ok(fasterDelay < initialDelay);
  h.clock.clearTimeout(h.game.spawnTimer);
  h.game.spawnTarget();
  const id = [...h.game.activeTargets.keys()][0];
  const targetTimeout = h.game.activeTargets.get(id).timer;
  assert.ok(h.clock.jobs.get(targetTimeout).due - h.clock.now <= 1_360);
});

test('blocked localStorage does not prevent startup, gameplay, or game over', () => {
  const h = createHarness({ storageThrows: true });
  assert.doesNotThrow(() => h.game.startGame('endless'));
  assert.doesNotThrow(() => h.game.endGame());
  assert.equal(h.game.isRunning, false);
});

test('backgrounded timed game ends on resume after deadline without late scoring', () => {
  const h = createHarness();
  h.game.startGame('timed');
  stopAutomaticSpawn(h.game, h.clock);
  h.document.hidden = true;
  h.clock.now = h.game.timedDeadline + 5_000;
  assert.equal(h.game.isRunning, true);
  h.document.hidden = false;
  h.document.dispatch('visibilitychange');
  assert.equal(h.game.score, 0);
  assert.equal(h.game.isRunning, false);
  assert.equal(h.game.hudTimer.textContent, '0s');
});

test('repeated endGame calls finalize and persist only once', () => {
  const h = createHarness();
  h.game.startGame('endless');
  stopAutomaticSpawn(h.game, h.clock);
  hitStandard(h.game);
  h.game.endGame();
  h.game.endGame();
  assert.equal(saved(h).totalRuns, 1);
  assert.equal(saved(h).highScore, 100);
});

function runShare({ share, clipboard } = {}) {
  const h = createHarness();
  h.elements.get('go-score').textContent = '1,250';
  h.elements.get('go-mode').textContent = 'FOCUS RUSH';
  h.context.navigator.share = share;
  h.context.navigator.clipboard = clipboard;
  vm.runInContext(readFileSync(resolve(root, 'score-challenge.js'), 'utf8'), h.context, { filename: 'score-challenge.js' });
  const button = h.elements.get('screen-gameover').buttonGroup.children.find(element => element.id === 'btn-share-challenge');
  const status = h.elements.get('screen-gameover').buttonGroup.adjacent;
  return { h, button, status };
}

test('score sharing reports success, quiet cancellation, and fallback on share failure', async () => {
  let shared;
  const success = runShare({ share: async payload => { shared = payload; } });
  await success.button.dispatch('click');
  await Promise.resolve();
  assert.match(shared.text, /1,250/);
  assert.match(shared.text, /FOCUS RUSH/);
  assert.equal(success.status.textContent, 'Challenge shared!');

  const cancelled = runShare({ share: async () => { throw Object.assign(new Error('cancel'), { name: 'AbortError' }); } });
  await cancelled.button.dispatch('click');
  await Promise.resolve();
  assert.equal(cancelled.status.textContent, '');
  assert.equal(cancelled.h.window.prompts.length, 0);

  const failed = runShare({ share: async () => { throw new Error('share unavailable'); } });
  await failed.button.dispatch('click');
  await Promise.resolve();
  assert.equal(failed.h.window.prompts.length, 1);
  assert.match(failed.status.textContent, /copy the challenge/i);

  let copied;
  const clipboardSuccess = runShare({ clipboard: { writeText: async text => { copied = text; } } });
  await clipboardSuccess.button.dispatch('click');
  assert.match(copied, /FOCUS RUSH/);
  assert.match(clipboardSuccess.status.textContent, /Challenge copied/);
});
