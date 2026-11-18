/* Tap Rush V4 preferences and original procedural music. No external audio assets. */
(() => {
  'use strict';

  const STORAGE_KEY = 'tap_rush_settings_v4';
  const DEFAULTS = Object.freeze({ sound: true, music: false, vibration: true });
  const settings = { ...DEFAULTS };
  let musicContext = null;
  let musicTimer = null;
  let noteIndex = 0;

  function load() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const key of Object.keys(DEFAULTS)) {
          if (typeof value[key] === 'boolean') settings[key] = value[key];
        }
      }
    } catch (_error) {
      // Storage can be blocked or invalid; defaults remain usable in memory.
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
    catch (_error) { /* Preferences still work for this session. */ }
  }

  function stopMusic() {
    if (musicTimer !== null) clearInterval(musicTimer);
    musicTimer = null;
    noteIndex = 0;
    if (musicContext) {
      const oldContext = musicContext;
      musicContext = null;
      if (typeof oldContext.close === 'function') {
        try { Promise.resolve(oldContext.close()).catch(() => {}); }
        catch (_error) { /* Audio may already be closed. */ }
      }
    }
  }

  function playMusicNote() {
    if (!settings.music || document.hidden || !musicContext) return;
    if (musicContext.state === 'suspended') return;
    const melody = [220, 261.63, 329.63, 392, 329.63, 261.63, 246.94, 196];
    const frequency = melody[noteIndex++ % melody.length];
    try {
      const oscillator = musicContext.createOscillator();
      const gain = musicContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, musicContext.currentTime);
      gain.gain.setValueAtTime(0.0001, musicContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025, musicContext.currentTime + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, musicContext.currentTime + 0.21);
      oscillator.connect(gain);
      gain.connect(musicContext.destination);
      oscillator.start();
      oscillator.stop(musicContext.currentTime + 0.22);
    } catch (_error) {
      stopMusic();
    }
  }

  function startMusic() {
    if (!settings.music || document.hidden || musicTimer !== null) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      musicContext = new AudioContextClass();
      if (musicContext.state === 'suspended' && typeof musicContext.resume === 'function') {
        Promise.resolve(musicContext.resume()).catch(() => {});
      }
      playMusicNote();
      musicTimer = setInterval(playMusicNote, 280);
    } catch (_error) {
      stopMusic();
    }
  }

  function syncInputs() {
    for (const key of Object.keys(DEFAULTS)) {
      const input = document.getElementById('setting-' + key);
      if (input) input.checked = settings[key];
    }
  }

  function setPreference(key, enabled) {
    if (!Object.hasOwn(DEFAULTS, key)) return;
    settings[key] = Boolean(enabled);
    save();
    syncInputs();
    if (key === 'music') {
      if (settings.music) startMusic();
      else stopMusic();
    }
  }

  function vibrate(milliseconds = 12) {
    if (!settings.vibration || typeof navigator.vibrate !== 'function') return;
    try { navigator.vibrate(milliseconds); }
    catch (_error) { /* Unsupported devices ignore vibration. */ }
  }

  function openSettings() {
    const modal = document.getElementById('modal-settings');
    if (!modal) return;
    syncInputs();
    modal.classList.remove('hidden');
    const close = document.getElementById('btn-close-settings');
    if (close && typeof close.focus === 'function') close.focus();
  }

  function closeSettings() {
    const modal = document.getElementById('modal-settings');
    if (modal) modal.classList.add('hidden');
    const open = document.getElementById('btn-open-settings');
    if (open && typeof open.focus === 'function') open.focus();
  }

  load();

  window.tapRushSettings = {
    get soundEnabled() { return settings.sound; },
    get musicEnabled() { return settings.music; },
    get vibrationEnabled() { return settings.vibration; },
    setPreference, vibrate, stopMusic
  };

  window.addEventListener('DOMContentLoaded', () => {
    syncInputs();
    document.getElementById('btn-open-settings')?.addEventListener('click', openSettings);
    document.getElementById('btn-close-settings')?.addEventListener('click', closeSettings);
    document.getElementById('modal-settings')?.addEventListener('click', event => {
      if (event.target === event.currentTarget) closeSettings();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !document.getElementById('modal-settings')?.classList.contains('hidden')) closeSettings();
    });
    for (const key of Object.keys(DEFAULTS)) {
      document.getElementById('setting-' + key)?.addEventListener('change', event => {
        setPreference(key, event.target.checked);
      });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopMusic();
      // Browser autoplay policies may require a fresh user gesture to resume music.
      else if (settings.music) startMusic();
    });
    if (settings.music && !document.hidden) {
      // Restore the preference but defer playback until an explicit interaction.
      document.addEventListener('pointerdown', startMusic, { once: true });
    }
  });
})();
