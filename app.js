/**
 * TAP RUSH V3 // Cyber Arcade Engine
 * Dynamic Sector Protocols, Micro-Events, Quantum Risk & Replayability
 */

(() => {
  'use strict';

  /* ==========================================================================
     AUDIO ENGINE (Synthesized Procedural Audio via Web Audio API)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.2) {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio play error', e);
      }
    }

    playHit(combo = 0) {
      this.init();
      const baseFreq = 440;
      const pitch = baseFreq * Math.pow(1.045, Math.min(combo, 35));
      this.playTone(pitch, 'triangle', 0.08, 0.22);
    }

    playGold() {
      this.init();
      [587.33, 880, 1174.66].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.11, 0.2), i * 35);
      });
    }

    playQuantum() {
      this.init();
      [440, 659.25, 987.77, 1318.51].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sawtooth', 0.14, 0.18), i * 30);
      });
    }

    playShield() {
      this.init();
      [329.63, 493.88, 659.25].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.16, 0.2), i * 45);
      });
    }

    playDisarm() {
      this.init();
      this.playTone(880, 'sine', 0.06, 0.15);
    }

    playPenalty() {
      this.init();
      this.playTone(130, 'sawtooth', 0.26, 0.35);
    }

    playMilestone() {
      this.init();
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.22), i * 50);
      });
    }

    playEventStart() {
      this.init();
      [349.23, 440, 523.25, 698.46].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'square', 0.12, 0.15), i * 40);
      });
    }

    playFever() {
      this.init();
      [440, 554.37, 659.25, 880, 1108.73, 1318.51].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sawtooth', 0.14, 0.2), i * 35);
      });
    }
  }

  /* ==========================================================================
     CANVAS FX ENGINE (Cyber Sparks & Particle Bursts)
     ========================================================================== */
  class FXEngine {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      this.width = this.canvas.width = this.canvas.parentElement.clientWidth;
      this.height = this.canvas.height = this.canvas.parentElement.clientHeight;
    }

    createExplosion(x, y, color = '#00f0ff', count = 16) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5.5;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1.4 + Math.random() * 2.2,
          color,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.03
        });
      }
    }

    loop() {
      this.ctx.clearRect(0, 0, this.width, this.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }
      requestAnimationFrame(this.loop);
    }
  }

  /* ==========================================================================
     PERSISTENCE & ACHIEVEMENTS SYSTEM
     ========================================================================== */
  const ACHIEVEMENTS_DEF = [
    { id: 'first_contact', name: 'FIRST CONTACT', desc: 'Score 1,500 points in a single run', req: s => s.highScore >= 1500 },
    { id: 'streak_20', name: 'OVERCLOCK STREAK', desc: 'Reach a ×20 combo streak', req: s => s.bestCombo >= 20 },
    { id: 'streak_50', name: 'SYSTEM BREACH', desc: 'Attain an epic ×50 combo streak', req: s => s.bestCombo >= 50 },
    { id: 'sector_03', name: 'INSTABILITY PASS', desc: 'Breach into Sector 03: Instability', req: s => s.maxStage >= 3 },
    { id: 'sector_05', name: 'HYPERDRIVE SURVIVOR', desc: 'Survive into Sector 05: Hyperdrive', req: s => s.maxStage >= 5 },
    { id: 'event_master', name: 'SIGNAL MASTER', desc: 'Survive 10 dynamic run events across career', req: s => s.totalEventsSurvived >= 10 },
    { id: 'trap_disarmer', name: 'BOMB SQUAD', desc: 'Safely disarm 15 Danger Traps by letting them expire', req: s => s.totalTrapsDisarmed >= 15 },
    { id: 'neural_precision', name: 'NEURAL ACCURACY', desc: 'Finish a run with ≥ 92% accuracy (min 35 hits)', req: s => s.lastAcc >= 92 && s.lastHits >= 35 }
  ];

  class PersistenceManager {
    constructor() {
      this.key = 'tap_rush_archive_v3';
      this.data = this.load();
    }

    load() {
      const def = {
        highScore: 0,
        bestCombo: 0,
        maxStage: 1,
        totalRuns: 0,
        totalTaps: 0,
        totalEventsSurvived: 0,
        totalTrapsDisarmed: 0,
        lastAcc: 0,
        lastHits: 0,
        unlockedAchievements: [],
        activeTheme: 'theme-default',
        unlockedThemes: ['theme-default']
      };
      try {
        const saved = localStorage.getItem(this.key);
        return saved ? { ...def, ...JSON.parse(saved) } : def;
      } catch (e) {
        return def;
      }
    }

    save() {
      try {
        localStorage.setItem(this.key, JSON.stringify(this.data));
      } catch (e) {}
    }

    checkAchievements(runStats) {
      this.data.totalRuns++;
      this.data.totalTaps += runStats.hits;
      this.data.totalEventsSurvived += runStats.eventsSurvived;
      this.data.totalTrapsDisarmed += runStats.trapsDisarmed;
      this.data.lastAcc = runStats.accuracy;
      this.data.lastHits = runStats.hits;

      if (runStats.score > this.data.highScore) this.data.highScore = runStats.score;
      if (runStats.bestCombo > this.data.bestCombo) this.data.bestCombo = runStats.bestCombo;
      if (runStats.stage > this.data.maxStage) this.data.maxStage = runStats.stage;

      const newlyUnlocked = [];
      ACHIEVEMENTS_DEF.forEach(ach => {
        if (!this.data.unlockedAchievements.includes(ach.id) && ach.req(this.data)) {
          this.data.unlockedAchievements.push(ach.id);
          newlyUnlocked.push(ach.name);
        }
      });

      // Dynamic Theme Unlocks
      if (this.data.unlockedAchievements.length >= 2 && !this.data.unlockedThemes.includes('theme-magenta')) {
        this.data.unlockedThemes.push('theme-magenta');
      }
      if (this.data.unlockedAchievements.length >= 4 && !this.data.unlockedThemes.includes('theme-matrix')) {
        this.data.unlockedThemes.push('theme-matrix');
      }
      if (this.data.unlockedAchievements.length >= 6 && !this.data.unlockedThemes.includes('theme-amber')) {
        this.data.unlockedThemes.push('theme-amber');
      }
      if (this.data.unlockedAchievements.length >= 8 && !this.data.unlockedThemes.includes('theme-void')) {
        this.data.unlockedThemes.push('theme-void');
      }

      this.save();
      return newlyUnlocked;
    }
  }

  /* ==========================================================================
     TARGET TYPES, SECTORS & DYNAMIC EVENT CONFIGURATIONS
     ========================================================================== */
  const TARGET_TYPES = {
    STANDARD: 'standard',
    GOLD: 'gold',
    QUANTUM: 'quantum',
    SHIELD: 'shield',
    DANGER: 'danger'
  };

  const SECTORS = [
    {
      num: 1,
      name: 'CALIBRATION',
      subtitle: 'SYNAPSE INITIALIZATION',
      targetDuration: 1750,
      spawnInterval: 950,
      targetsRequired: 14,
      allowedTypes: [TARGET_TYPES.STANDARD],
      eventChance: 0
    },
    {
      num: 2,
      name: 'CONTACT',
      subtitle: 'ACCELERATION PROTOCOL',
      targetDuration: 1350,
      spawnInterval: 760,
      targetsRequired: 18,
      allowedTypes: [TARGET_TYPES.STANDARD, TARGET_TYPES.GOLD, TARGET_TYPES.SHIELD],
      eventChance: 0.15
    },
    {
      num: 3,
      name: 'INSTABILITY',
      subtitle: 'MULTI-FREQUENCY SURGE',
      targetDuration: 1100,
      spawnInterval: 600,
      targetsRequired: 24,
      allowedTypes: [TARGET_TYPES.STANDARD, TARGET_TYPES.GOLD, TARGET_TYPES.QUANTUM, TARGET_TYPES.SHIELD],
      eventChance: 0.3
    },
    {
      num: 4,
      name: 'CRITICAL',
      subtitle: 'HAZARD THREAT ENGAGED',
      targetDuration: 920,
      spawnInterval: 500,
      targetsRequired: 30,
      allowedTypes: [TARGET_TYPES.STANDARD, TARGET_TYPES.GOLD, TARGET_TYPES.QUANTUM, TARGET_TYPES.SHIELD, TARGET_TYPES.DANGER],
      eventChance: 0.45
    },
    {
      num: 5,
      name: 'HYPERDRIVE',
      subtitle: 'RELENTLESS OVERLOAD',
      targetDuration: 780,
      spawnInterval: 400,
      targetsRequired: 9999, // Endless final trial
      allowedTypes: [TARGET_TYPES.STANDARD, TARGET_TYPES.GOLD, TARGET_TYPES.QUANTUM, TARGET_TYPES.SHIELD, TARGET_TYPES.DANGER],
      eventChance: 0.55
    }
  ];

  const RUN_EVENTS = {
    SIGNAL_SURGE: {
      id: 'SIGNAL_SURGE',
      icon: '⚡',
      title: 'SIGNAL SURGE // FAST SPAWN ×2 PTS',
      duration: 6000
    },
    PRECISION_WINDOW: {
      id: 'PRECISION_WINDOW',
      icon: '🎯',
      title: 'PRECISION WINDOW // TRIPLE SCORE',
      duration: 5500
    }
  };

  /* ==========================================================================
     CORE TAP RUSH GAME CLASS
     ========================================================================== */
  class TapRushGame {
    constructor() {
      // DOM Elements
      this.app = document.getElementById('app-container');
      this.playfield = document.getElementById('playfield');
      this.hud = document.getElementById('hud');
      this.hudScore = document.getElementById('hud-score');
      this.hudStage = document.getElementById('hud-stage');
      this.hudLives = document.getElementById('hud-lives');
      this.feverBar = document.getElementById('fever-bar');
      this.feverMeterWrap = document.getElementById('fever-meter-container');
      this.comboDisplay = document.getElementById('combo-display');
      this.comboNum = document.getElementById('combo-multiplier');
      this.comboRating = document.getElementById('combo-rating');
      this.stageBanner = document.getElementById('stage-banner');
      this.stageAnnTitle = document.getElementById('stage-ann-title');
      this.stageAnnDesc = document.getElementById('stage-ann-desc');
      this.eventTicker = document.getElementById('event-ticker');
      this.eventIcon = document.getElementById('event-icon');
      this.eventTitle = document.getElementById('event-title');
      this.eventProgressFill = document.getElementById('event-progress-fill');

      // Screens
      this.screenStart = document.getElementById('screen-start');
      this.screenGameOver = document.getElementById('screen-gameover');
      this.modalVault = document.getElementById('modal-vault');

      // Debrief & Buttons
      this.btnPlay = document.getElementById('btn-play');
      this.btnRetry = document.getElementById('btn-retry');
      this.btnGoHome = document.getElementById('btn-go-home');
      this.btnOpenVault = document.getElementById('btn-open-vault');
      this.btnCloseVault = document.getElementById('btn-close-vault');

      this.goRank = document.getElementById('go-rank');
      this.goRankSub = document.getElementById('go-rank-sub');
      this.goScore = document.getElementById('go-score');
      this.goCombo = document.getElementById('go-combo');
      this.goAccuracy = document.getElementById('go-accuracy');
      this.goStage = document.getElementById('go-stage');
      this.goEvents = document.getElementById('go-events');
      this.goTraps = document.getElementById('go-traps');
      this.goNewRecord = document.getElementById('go-new-record');
      this.goUnlockedBanner = document.getElementById('go-unlocked-banner');
      this.goUnlockedText = document.getElementById('go-unlocked-text');

      // Subsystems
      this.sound = new SoundEngine();
      this.fx = new FXEngine(document.getElementById('fx-canvas'));
      this.persistence = new PersistenceManager();

      // State Variables
      this.isRunning = false;
      this.activeTargets = new Map();
      this.spawnTimer = null;
      this.targetIdCounter = 0;

      // In-run Metrics
      this.score = 0;
      this.lives = 3;
      this.maxLives = 3;
      this.stageIndex = 0;
      this.stageHits = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.totalTaps = 0;
      this.validHits = 0;
      this.eventsSurvived = 0;
      this.trapsDisarmed = 0;

      // Event & Overdrive State
      this.activeEvent = null;
      this.eventTimeout = null;
      this.lastEventTime = 0;
      this.feverEnergy = 0;
      this.isFeverActive = false;

      this.initEvents();
      this.applyTheme(this.persistence.data.activeTheme);
      this.updateStartStats();
    }

    initEvents() {
      this.btnPlay.addEventListener('click', () => this.startGame());
      this.btnRetry.addEventListener('click', () => this.startGame());
      this.btnGoHome.addEventListener('click', () => this.showStartScreen());
      this.btnOpenVault.addEventListener('click', () => this.openVaultModal());
      this.btnCloseVault.addEventListener('click', () => this.closeVaultModal());

      // Precision Miss Detection
      this.playfield.addEventListener('pointerdown', (e) => {
        if (!this.isRunning) return;
        if (e.target === this.playfield) {
          this.totalTaps++;
          this.breakCombo();
          if (this.activeEvent && this.activeEvent.id === 'PRECISION_WINDOW') {
            this.deductLife(); // Harsh punishment during precision window
          }
        }
      });
    }

    updateStartStats() {
      document.getElementById('start-high-score').textContent = this.persistence.data.highScore.toLocaleString();
      document.getElementById('start-best-combo').textContent = `×${this.persistence.data.bestCombo}`;
      document.getElementById('start-total-runs').textContent = this.persistence.data.totalRuns.toLocaleString();
    }

    applyTheme(themeKey) {
      document.body.className = themeKey;
      this.persistence.data.activeTheme = themeKey;
      this.persistence.save();
    }

    /* ==========================================================================
       GAME RUN LIFECYCLE
       ========================================================================== */
    startGame() {
      this.sound.init();
      this.score = 0;
      this.lives = 3;
      this.stageIndex = 0;
      this.stageHits = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.totalTaps = 0;
      this.validHits = 0;
      this.eventsSurvived = 0;
      this.trapsDisarmed = 0;
      this.feverEnergy = 0;
      this.isFeverActive = false;
      this.activeEvent = null;
      this.lastEventTime = Date.now();
      this.activeTargets.clear();
      this.playfield.innerHTML = '';

      this.screenStart.classList.add('hidden');
      this.screenGameOver.classList.add('hidden');
      this.eventTicker.classList.add('hidden');
      this.hud.classList.remove('hidden');
      this.comboDisplay.classList.remove('hidden');

      this.updateHUD();
      this.updateComboUI();
      this.isRunning = true;

      this.triggerStageAnnouncement(SECTORS[0]);
      this.scheduleNextSpawn();
    }

    endGame() {
      this.isRunning = false;
      clearTimeout(this.spawnTimer);
      clearTimeout(this.eventTimeout);

      this.activeTargets.forEach(t => {
        clearTimeout(t.timer);
        if (t.element && t.element.parentNode) t.element.remove();
      });
      this.activeTargets.clear();

      this.sound.playPenalty();
      this.triggerScreenShake();

      const accuracy = this.totalTaps > 0 ? Math.round((this.validHits / this.totalTaps) * 100) : 0;
      const runStats = {
        score: this.score,
        bestCombo: this.bestCombo,
        stage: this.stageIndex + 1,
        hits: this.validHits,
        eventsSurvived: this.eventsSurvived,
        trapsDisarmed: this.trapsDisarmed,
        accuracy
      };

      const isNewRecord = this.score > this.persistence.data.highScore;
      const newAchievements = this.persistence.checkAchievements(runStats);

      // Populate Post-Run Debrief
      this.goScore.textContent = this.score.toLocaleString();
      this.goCombo.textContent = `×${this.bestCombo}`;
      this.goAccuracy.textContent = `${accuracy}%`;
      this.goStage.textContent = `SECTOR 0${this.stageIndex + 1}`;
      this.goEvents.textContent = `${this.eventsSurvived}`;
      this.goTraps.textContent = `${this.trapsDisarmed}`;
      this.goNewRecord.classList.toggle('hidden', !isNewRecord);

      const rank = this.computeRank(this.score, accuracy, this.bestCombo, this.stageIndex + 1);
      this.goRank.textContent = rank.title;
      this.goRankSub.textContent = `REFLEX RATING: ${rank.subtitle}`;

      if (newAchievements.length > 0) {
        this.goUnlockedBanner.classList.remove('hidden');
        this.goUnlockedText.textContent = `NEW ARCHIVE PROTOCOL: ${newAchievements.join(', ')}`;
      } else {
        this.goUnlockedBanner.classList.add('hidden');
      }

      setTimeout(() => {
        this.hud.classList.add('hidden');
        this.comboDisplay.classList.add('hidden');
        this.eventTicker.classList.add('hidden');
        this.screenGameOver.classList.remove('hidden');
        this.updateStartStats();
      }, 350);
    }

    showStartScreen() {
      this.screenGameOver.classList.add('hidden');
      this.screenStart.classList.remove('hidden');
      this.updateStartStats();
    }

    computeRank(score, acc, combo, sector) {
      if (score >= 12000 && acc >= 92 && combo >= 30) return { title: 'LEGEND', subtitle: 'NEURAL TRANSCENDENCE' };
      if (score >= 7000 && acc >= 85) return { title: 'CYBER ACE', subtitle: 'COMBAT OPTIMIZED' };
      if (score >= 3500 || sector >= 4) return { title: 'ELITE', subtitle: 'HIGH PRECISION' };
      if (score >= 1500 || sector >= 2) return { title: 'OPERATOR', subtitle: 'PROTOCOL QUALIFIED' };
      return { title: 'RECRUIT', subtitle: 'INITIALIZING SYNAPSE' };
    }

    /* ==========================================================================
     SPAWNING, SECTORS & EVENT TRIGGERS
     ========================================================================== */
    scheduleNextSpawn() {
      if (!this.isRunning) return;
      const sector = SECTORS[this.stageIndex];
      let delay = sector.spawnInterval;

      // Event Modifiers
      if (this.activeEvent && this.activeEvent.id === 'SIGNAL_SURGE') delay *= 0.6;
      if (this.isFeverActive) delay *= 0.65;

      // Check random event roll if cooldown elapsed (min 16s)
      const now = Date.now();
      if (!this.activeEvent && sector.eventChance > 0 && (now - this.lastEventTime > 16000)) {
        if (Math.random() < sector.eventChance * 0.4) {
          this.triggerDynamicEvent();
        }
      }

      this.spawnTimer = setTimeout(() => {
        this.spawnTarget();
        this.scheduleNextSpawn();
      }, delay);
    }

    spawnTarget() {
      if (!this.isRunning) return;
      const sector = SECTORS[this.stageIndex];

      const bounds = this.playfield.getBoundingClientRect();
      const radius = 33;
      const minX = radius + 22;
      const maxX = bounds.width - radius - 22;
      const minY = radius + 90; // Clear Top HUD & Tickers
      const maxY = bounds.height - radius - 35;

      const posX = Math.random() * (maxX - minX) + minX;
      const posY = Math.random() * (maxY - minY) + minY;

      const targetType = this.selectTargetType(sector);
      const id = ++this.targetIdCounter;

      const targetEl = document.createElement('div');
      targetEl.className = `target target-${targetType}`;
      targetEl.style.width = `${radius * 2}px`;
      targetEl.style.height = `${radius * 2}px`;
      targetEl.style.left = `${posX}px`;
      targetEl.style.top = `${posY}px`;

      let duration = sector.targetDuration;
      if (targetType === TARGET_TYPES.GOLD) duration *= 0.75;
      if (targetType === TARGET_TYPES.QUANTUM) duration *= 0.65; // Ultra fast risk window
      if (this.isFeverActive) duration *= 0.85;

      targetEl.innerHTML = `
        <svg class="target-timer-svg" viewBox="0 0 100 100">
          <circle class="target-timer-circle" cx="50" cy="50" r="44" 
            style="animation: timer-stroke ${duration}ms linear forwards;"></circle>
        </svg>
      `;

      targetEl.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.handleTargetHit(id, targetType, posX, posY);
      });

      this.playfield.appendChild(targetEl);

      const timer = setTimeout(() => {
        this.handleTargetMiss(id, targetType, posX, posY);
      }, duration);

      this.activeTargets.set(id, { element: targetEl, timer, type: targetType });
    }

    selectTargetType(sector) {
      const allowed = sector.allowedTypes;
      const roll = Math.random();

      // Shield restoration if missing life
      if (allowed.includes(TARGET_TYPES.SHIELD) && this.lives < this.maxLives && roll < 0.12) {
        return TARGET_TYPES.SHIELD;
      }
      // Danger trap check
      if (allowed.includes(TARGET_TYPES.DANGER) && roll < 0.22) {
        return TARGET_TYPES.DANGER;
      }
      // Quantum high-risk check
      if (allowed.includes(TARGET_TYPES.QUANTUM) && roll < 0.34) {
        return TARGET_TYPES.QUANTUM;
      }
      // Gold target check
      if (allowed.includes(TARGET_TYPES.GOLD) && roll < 0.48) {
        return TARGET_TYPES.GOLD;
      }
      return TARGET_TYPES.STANDARD;
    }

    /* ==========================================================================
       TARGET RESOLUTION, COMBO MILESTONES & RISK-REWARD
       ========================================================================== */
    handleTargetHit(id, type, x, y) {
      if (!this.isRunning || !this.activeTargets.has(id)) return;
      const targetObj = this.activeTargets.get(id);
      clearTimeout(targetObj.timer);
      targetObj.element.remove();
      this.activeTargets.delete(id);

      this.totalTaps++;

      // Danger Trap Tapped -> Severe Penalty
      if (type === TARGET_TYPES.DANGER) {
        this.sound.playPenalty();
        this.triggerScreenShake();
        this.fx.createExplosion(x, y, '#ff0055', 24);
        this.breakCombo();
        this.deductLife();
        return;
      }

      this.validHits++;
      this.combo++;
      if (this.combo > this.bestCombo) this.bestCombo = this.combo;

      // Base Rewards
      let basePoints = 100;
      let explosionColor = '#00f0ff';

      if (type === TARGET_TYPES.GOLD) {
        basePoints = 350;
        explosionColor = '#ffb800';
        this.sound.playGold();
        this.addFeverEnergy(20);
      } else if (type === TARGET_TYPES.QUANTUM) {
        basePoints = 600;
        explosionColor = '#b845ff';
        this.sound.playQuantum();
        this.addFeverEnergy(35);
      } else if (type === TARGET_TYPES.SHIELD) {
        basePoints = 150;
        explosionColor = '#00ff88';
        this.sound.playShield();
        if (this.lives < this.maxLives) {
          this.lives++;
          this.updateShieldUI();
        }
      } else {
        this.sound.playHit(this.combo);
        this.addFeverEnergy(7);
      }

      // Combo Milestones Check
      this.checkComboMilestone(this.combo);

      // Multiplier Calculation
      let multiplier = 1.0;
      if (this.combo >= 50) multiplier = 5.0;
      else if (this.combo >= 30) multiplier = 4.0;
      else if (this.combo >= 20) multiplier = 3.0;
      else if (this.combo >= 10) multiplier = 2.0;
      else if (this.combo >= 5) multiplier = 1.5;

      if (this.activeEvent && this.activeEvent.id === 'PRECISION_WINDOW') multiplier *= 3.0;
      if (this.activeEvent && this.activeEvent.id === 'SIGNAL_SURGE') multiplier *= 2.0;
      if (this.isFeverActive) multiplier *= 2.0;

      this.score += Math.round(basePoints * multiplier);
      this.fx.createExplosion(x, y, explosionColor, 16);
      this.updateHUD();
      this.updateComboUI();

      // Sector Progression
      this.stageHits++;
      const currentSector = SECTORS[this.stageIndex];
      if (this.stageHits >= currentSector.targetsRequired && this.stageIndex < SECTORS.length - 1) {
        this.advanceSector();
      }
    }

    handleTargetMiss(id, type, x, y) {
      if (!this.isRunning || !this.activeTargets.has(id)) return;
      const targetObj = this.activeTargets.get(id);
      targetObj.element.remove();
      this.activeTargets.delete(id);

      // Successfully Disarmed a Hazard Trap
      if (type === TARGET_TYPES.DANGER) {
        this.trapsDisarmed++;
        this.score += 50; // Bonus for discipline
        this.sound.playDisarm();
        this.updateHUD();
        return;
      }

      // Missed standard/gold/shield/quantum target
      this.breakCombo();
      this.deductLife();
    }

    checkComboMilestone(c) {
      if (c === 5 || c === 10 || c === 20 || c === 30 || c === 50) {
        this.sound.playMilestone();
        this.triggerScreenShake(3);
      }
    }

    breakCombo() {
      if (this.combo >= 10) this.triggerScreenShake(4);
      this.combo = 0;
      this.updateComboUI();
    }

    deductLife() {
      this.lives--;
      this.sound.playPenalty();
      this.triggerScreenShake(6);
      this.updateShieldUI();
      if (this.lives <= 0) {
        this.endGame();
      }
    }

    advanceSector() {
      this.stageIndex++;
      this.stageHits = 0;
      const nextSector = SECTORS[this.stageIndex];
      this.sound.playMilestone();
      this.triggerStageAnnouncement(nextSector);
      this.updateHUD();
    }

    /* ==========================================================================
       DYNAMIC RUN EVENTS & FEVER OVERDRIVE
       ========================================================================== */
    triggerDynamicEvent() {
      const eventKeys = Object.keys(RUN_EVENTS);
      const chosen = RUN_EVENTS[eventKeys[Math.floor(Math.random() * eventKeys.length)]];
      this.activeEvent = chosen;
      this.lastEventTime = Date.now();

      this.eventIcon.textContent = chosen.icon;
      this.eventTitle.textContent = chosen.title;
      this.eventTicker.classList.remove('hidden');
      this.sound.playEventStart();

      const startTime = Date.now();
      const interval = setInterval(() => {
        if (!this.isRunning || !this.activeEvent) {
          clearInterval(interval);
          return;
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.max(0, 1 - elapsed / chosen.duration);
        this.eventProgressFill.style.width = `${progress * 100}%`;

        if (progress <= 0) {
          clearInterval(interval);
          this.endDynamicEvent();
        }
      }, 50);
    }

    endDynamicEvent() {
      if (this.activeEvent) {
        this.eventsSurvived++;
      }
      this.activeEvent = null;
      this.eventTicker.classList.add('hidden');
    }

    addFeverEnergy(amt) {
      if (this.isFeverActive) return;
      this.feverEnergy = Math.min(100, this.feverEnergy + amt);
      this.feverBar.style.width = `${this.feverEnergy}%`;

      if (this.feverEnergy >= 100) {
        this.activateFever();
      }
    }

    activateFever() {
      this.isFeverActive = true;
      this.feverMeterWrap.classList.add('active');
      this.sound.playFever();

      const duration = 7000;
      const start = Date.now();

      const decay = setInterval(() => {
        if (!this.isRunning || !this.isFeverActive) {
          clearInterval(decay);
          return;
        }
        const elapsed = Date.now() - start;
        const remain = Math.max(0, 1 - elapsed / duration);
        this.feverBar.style.width = `${remain * 100}%`;

        if (remain <= 0) {
          clearInterval(decay);
          this.isFeverActive = false;
          this.feverEnergy = 0;
          this.feverMeterWrap.classList.remove('active');
        }
      }, 50);
    }

    /* ==========================================================================
       UI UPDATES, SHAKE & MODALS
       ========================================================================== */
    triggerStageAnnouncement(sector) {
      this.stageAnnTitle.textContent = `SECTOR 0${sector.num}`;
      this.stageAnnDesc.textContent = `${sector.name} // ${sector.subtitle}`;
      this.stageBanner.classList.remove('hidden');

      setTimeout(() => {
        this.stageBanner.classList.add('hidden');
      }, 1250);
    }

    triggerScreenShake() {
      this.app.classList.remove('screen-shake');
      void this.app.offsetWidth;
      this.app.classList.add('screen-shake');
    }

    updateHUD() {
      this.hudScore.textContent = this.score.toString().padStart(5, '0');
      this.hudStage.textContent = `0${this.stageIndex + 1}`;
      this.updateShieldUI();
    }

    updateShieldUI() {
      const pips = this.hudLives.querySelectorAll('.pip');
      pips.forEach((pip, idx) => {
        pip.classList.toggle('active', idx < this.lives);
      });
    }

    updateComboUI() {
      this.comboNum.textContent = `×${this.combo}`;
      this.comboDisplay.classList.remove('bump');
      void this.comboDisplay.offsetWidth;
      this.comboDisplay.classList.add('bump');

      this.comboDisplay.classList.toggle('level-high', this.combo >= 20);
      this.comboDisplay.classList.toggle('level-overdrive', this.combo >= 50);

      if (this.combo >= 50) this.comboRating.textContent = 'SYSTEM BREACH 5.0×';
      else if (this.combo >= 30) this.comboRating.textContent = 'UNSTOPPABLE 4.0×';
      else if (this.combo >= 20) this.comboRating.textContent = 'OVERCLOCK 3.0×';
      else if (this.combo >= 10) this.comboRating.textContent = 'LOCKED IN 2.0×';
      else if (this.combo >= 5) this.comboRating.textContent = 'SYNCED 1.5×';
      else this.comboRating.textContent = 'CALIBRATING';
    }

    openVaultModal() {
      const themeContainer = document.getElementById('theme-selectors');
      const achieveContainer = document.getElementById('achievements-list');

      // Lifetime stats
      document.getElementById('stat-life-taps').textContent = this.persistence.data.totalTaps.toLocaleString();
      document.getElementById('stat-life-runs').textContent = this.persistence.data.totalRuns.toLocaleString();
      document.getElementById('stat-life-events').textContent = this.persistence.data.totalEventsSurvived.toLocaleString();
      document.getElementById('stat-life-sector').textContent = `0${this.persistence.data.maxStage}`;

      // Populate Chroma Themes
      themeContainer.innerHTML = '';
      const themes = [
        { id: 'theme-default', name: 'CYBER CYAN' },
        { id: 'theme-magenta', name: 'NEON MAGENTA' },
        { id: 'theme-matrix', name: 'MATRIX GREEN' },
        { id: 'theme-amber', name: 'SOLAR AMBER' },
        { id: 'theme-void', name: 'OBSIDIAN VOID' }
      ];

      themes.forEach(t => {
        const isUnlocked = this.persistence.data.unlockedThemes.includes(t.id);
        const isActive = this.persistence.data.activeTheme === t.id;
        const card = document.createElement('div');
        card.className = `theme-card ${isActive ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
        card.textContent = isUnlocked ? t.name : 'LOCKED';
        if (isUnlocked) {
          card.addEventListener('click', () => {
            this.applyTheme(t.id);
            this.openVaultModal();
          });
        }
        themeContainer.appendChild(card);
      });

      // Populate Achievements
      achieveContainer.innerHTML = '';
      ACHIEVEMENTS_DEF.forEach(ach => {
        const isDone = this.persistence.data.unlockedAchievements.includes(ach.id);
        const item = document.createElement('div');
        item.className = `achieve-item ${isDone ? 'unlocked' : ''}`;
        item.innerHTML = `
          <div class="achieve-info">
            <span class="achieve-name">${ach.name}</span>
            <span class="achieve-desc">${ach.desc}</span>
          </div>
          <span class="achieve-status">${isDone ? 'UNLOCKED' : 'LOCKED'}</span>
        `;
        achieveContainer.appendChild(item);
      });

      this.modalVault.classList.remove('hidden');
    }

    closeVaultModal() {
      this.modalVault.classList.add('hidden');
    }
  }

  // Launch on DOM ready
  window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new TapRushGame();
  });
})();