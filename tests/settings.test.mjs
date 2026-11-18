import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const source = readFileSync(resolve(import.meta.dirname, '..', 'settings.js'), 'utf8');

function harness({ initial, storageBlocked = false, audioAvailable = true } = {}) {
  const saved = new Map(initial ? [['tap_rush_settings_v4', JSON.stringify(initial)]] : []);
  const listeners = new Map();
  const elements = new Map();
  const vibrationCalls = [];
  const intervals = new Map();
  let nextInterval = 1;
  let contexts = 0;
  let notes = 0;
  const element = id => {
    if (!elements.has(id)) {
      const handlers = new Map();
      const classes = new Set(id === 'modal-settings' ? ['hidden'] : []);
      elements.set(id, {
        id, checked: false, handlers, classList: {
          add: name => classes.add(name), remove: name => classes.delete(name),
          contains: name => classes.has(name)
        }, focus() {}, addEventListener(name, fn) { handlers.set(name, fn); },
        dispatch(name, event = {}) { handlers.get(name)?.({ target: this, currentTarget: this, ...event }); }
      });
    }
    return elements.get(id);
  };
  const document = {
    hidden: false,
    getElementById: id => element(id),
    addEventListener(name, fn) { listeners.set(name, fn); },
    dispatch(name, event = {}) { listeners.get(name)?.(event); }
  };
  const winListeners = new Map();
  const window = {
    addEventListener(name, fn) { winListeners.set(name, fn); }
  };
  if (audioAvailable) {
    window.AudioContext = class {
      constructor() { contexts++; this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() {
        return { type: '', frequency: { setValueAtTime() {} }, connect() {},
          start() { notes++; }, stop() {} };
      }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
      close() { this.closed = true; return Promise.resolve(); }
    };
  }
  const navigator = { vibrate: duration => { vibrationCalls.push(duration); return true; } };
  const context = vm.createContext({
    document, window, navigator,
    localStorage: {
      getItem(key) { if (storageBlocked) throw Error('blocked'); return saved.get(key) ?? null; },
      setItem(key, value) { if (storageBlocked) throw Error('blocked'); saved.set(key, value); }
    },
    setInterval(fn) { const id = nextInterval++; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); },
    Promise, console
  });
  vm.runInContext(source, context, { filename: 'settings.js' });
  winListeners.get('DOMContentLoaded')();
  return { api: window.tapRushSettings, element, saved, document, intervals, vibrationCalls,
    contexts: () => contexts, notes: () => notes };
}

test('default preferences and switches are initialized correctly', () => {
  const h = harness();
  assert.equal(h.api.soundEnabled, true);
  assert.equal(h.api.musicEnabled, false);
  assert.equal(h.api.vibrationEnabled, true);
  assert.equal(h.element('setting-sound').checked, true);
  assert.equal(h.element('setting-music').checked, false);
  assert.equal(h.element('setting-vibration').checked, true);
});

test('settings button opens dialog; close button dismisses it', () => {
  const h = harness();
  const modal = h.element('modal-settings');
  h.element('btn-open-settings').dispatch('click');
  assert.equal(modal.classList.contains('hidden'), false);
  h.element('btn-close-settings').dispatch('click');
  assert.equal(modal.classList.contains('hidden'), true);
});

test('changes persist separately from the game archive and reload', () => {
  const h = harness();
  h.element('setting-sound').dispatch('change', { target: { checked: false } });
  h.element('setting-vibration').dispatch('change', { target: { checked: false } });
  const record = JSON.parse(h.saved.get('tap_rush_settings_v4'));
  assert.equal(record.sound, false);
  assert.equal(record.vibration, false);
  assert.equal(h.saved.has('tap_rush_archive_v3'), false);
  const restored = harness({ initial: record });
  assert.equal(restored.api.soundEnabled, false);
  assert.equal(restored.api.vibrationEnabled, false);
});

test('blocked localStorage leaves functional in-memory preferences', () => {
  const h = harness({ storageBlocked: true });
  h.api.setPreference('sound', false);
  assert.equal(h.api.soundEnabled, false);
  h.api.setPreference('music', false);
  assert.equal(h.api.musicEnabled, false);
});

test('vibration is gated by preference', () => {
  const h = harness();
  h.api.vibrate(20);
  assert.deepEqual(h.vibrationCalls, [20]);
  h.api.setPreference('vibration', false);
  h.api.vibrate(35);
  assert.deepEqual(h.vibrationCalls, [20]);
});

test('music starts only when enabled, stops when disabled, and pauses when hidden', () => {
  const h = harness();
  assert.equal(h.contexts(), 0);
  h.api.setPreference('music', true);
  assert.equal(h.contexts(), 1);
  assert.equal(h.intervals.size, 1);
  assert.ok(h.notes() > 0);
  h.document.hidden = true;
  h.document.dispatch('visibilitychange');
  assert.equal(h.intervals.size, 0);
  h.api.setPreference('music', false);
  assert.equal(h.intervals.size, 0);
});

test('missing AudioContext cannot start soundtrack and preferences remain usable', () => {
  const h = harness({ audioAvailable: false });
  h.api.setPreference('music', true);
  assert.equal(h.api.musicEnabled, true);
  assert.equal(h.intervals.size, 0);
  h.api.setPreference('music', false);
});

test('music and sound are independent', () => {
  const h = harness();
  h.api.setPreference('sound', false);
  h.api.setPreference('music', true);
  assert.equal(h.api.soundEnabled, false);
  assert.equal(h.api.musicEnabled, true);
  assert.equal(h.intervals.size, 1);
});
