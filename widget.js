/* ============================================
   Hype Train Widget - StreamElements JS
   ============================================ */

// --- Etat global ---
const state = {
  active: false,
  level: 1,
  percent: 0,
  timeLeft: 300,
  totalTime: 300,
  timerInterval: null,
  particleInterval: null,
};

// --- References DOM ---
const widget     = document.getElementById('hype-train-widget');
const bar        = document.getElementById('ht-bar');
const levelEl    = document.getElementById('ht-level');
const timerEl    = document.getElementById('ht-timer');
const timerText  = document.getElementById('ht-timer-text');
const percentEl  = document.getElementById('ht-percent');
const particles  = document.getElementById('ht-particles');
const levelBadge = document.querySelector('.ht-level-badge');

// --- Applique les couleurs depuis les champs StreamElements ---
function applyFieldColors(fields) {
  const root = document.documentElement.style;
  const barColor    = fields.barColor    || '#9147FF';
  const barColorEnd = fields.barColorEnd || '#FF6B6B';

  root.setProperty('--bar-color',     barColor);
  root.setProperty('--bar-color-end', barColorEnd);

  // Couleur dynamique du badge et de sa box-shadow
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `${r},${g},${b}`;
  };

  if (levelBadge) {
    levelBadge.style.background = barColor;
    try {
      levelBadge.style.boxShadow = `0 0 14px rgba(${hexToRgb(barColor)},0.55)`;
    } catch(e) {
      levelBadge.style.boxShadow = `0 0 14px ${barColor}`;
    }
  }

  if (fields.trainDuration) {
    state.totalTime = parseInt(fields.trainDuration) || 300;
  }
}

// --- Formate mm:ss ---
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- Met a jour l'affichage ---
function updateDisplay() {
  bar.style.width = Math.min(Math.max(state.percent, 0), 100) + '%';

  const prevLevel = parseInt(levelEl.textContent);
  if (prevLevel !== state.level) {
    levelEl.textContent = state.level;
    levelBadge.classList.remove('level-up-anim');
    void levelBadge.offsetWidth;
    levelBadge.classList.add('level-up-anim');
    spawnLevelUpParticles();
  } else {
    levelEl.textContent = state.level;
  }

  percentEl.textContent = Math.round(state.percent) + '%';
  timerText.textContent = formatTime(state.timeLeft);

  if (state.timeLeft <= 30) {
    timerEl.classList.add('urgent');
  } else {
    timerEl.classList.remove('urgent');
  }
}

// --- Timer compte a rebours ---
function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.timeLeft > 0) {
      state.timeLeft--;
      timerText.textContent = formatTime(state.timeLeft);
      if (state.timeLeft <= 30) timerEl.classList.add('urgent');
    } else {
      endHypeTrain();
    }
  }, 1000);
}

// --- Particules ---
function startParticles() {
  clearInterval(state.particleInterval);
  state.particleInterval = setInterval(spawnParticle, 280);
}

function spawnParticle() {
  const p = document.createElement('div');
  p.className = 'ht-particle';
  const barWidth = bar.offsetWidth;
  p.style.left = Math.random() * Math.max(barWidth - 6, 10) + 'px';
  p.style.bottom = '2px';
  p.style.animationDelay    = (Math.random() * 0.3) + 's';
  p.style.animationDuration = (0.9 + Math.random() * 0.8) + 's';
  particles.appendChild(p);
  setTimeout(() => p.remove(), 1600);
}

function spawnLevelUpParticles() {
  for (let i = 0; i < 14; i++) {
    setTimeout(spawnParticle, i * 55);
  }
}

// --- Afficher / masquer le widget ---
function showWidget() {
  widget.classList.remove('hype-hidden');
  widget.classList.add('hype-visible');
}

function hideWidget() {
  widget.classList.remove('hype-visible');
  widget.classList.add('hype-hidden');
}

// --- Demarre le hype train ---
function startHypeTrain(level, percent) {
  state.active   = true;
  state.level    = level   || 1;
  state.percent  = percent || 0;
  state.timeLeft = state.totalTime;

  showWidget();
  updateDisplay();
  startTimer();
  startParticles();
}

// --- Met a jour la progression ---
function updateProgress(level, percent, timeLeft) {
  state.level   = level;
  state.percent = percent;
  if (timeLeft !== undefined) state.timeLeft = timeLeft;

  updateDisplay();

  if (!state.active) {
    state.active = true;
    showWidget();
    startTimer();
    startParticles();
  }
}

// --- Fin du hype train ---
function endHypeTrain() {
  clearInterval(state.timerInterval);
  clearInterval(state.particleInterval);
  state.active = false;

  // Barre a 100% brievement, puis disparait
  state.percent = 100;
  updateDisplay();

  setTimeout(() => {
    hideWidget();
    setTimeout(() => {
      state.level    = 1;
      state.percent  = 0;
      state.timeLeft = state.totalTime;
      timerEl.classList.remove('urgent');
      bar.style.width         = '0%';
      levelEl.textContent     = '1';
      percentEl.textContent   = '0%';
      timerText.textContent   = formatTime(state.totalTime);
    }, 600);
  }, 3000);
}

// ============================================
// Listeners StreamElements
// ============================================

window.addEventListener('onWidgetLoad', (obj) => {
  const fieldData = obj.detail.fieldData;
  applyFieldColors(fieldData);
});

window.addEventListener('onEventReceived', (obj) => {
  const listener = obj.detail.listener;
  const event    = obj.detail.event;

  // --- Evenement progress hype train ---
  if (listener === 'hypetrain-progress') {
    const level    = event.level || 1;
    const value    = (event.progress && event.progress.value  != null) ? event.progress.value  : (event.percent || 0);
    const goal     = (event.progress && event.progress.goal   != null) ? event.progress.goal   : 100;
    const percent  = goal > 0 ? Math.round((value / goal) * 100) : value;
    const timeLeft = event.time_left !== undefined ? event.time_left : undefined;

    if (!state.active) {
      startHypeTrain(level, percent);
    } else {
      updateProgress(level, percent, timeLeft);
    }
    return;
  }

  // --- Fin hype train ---
  if (listener === 'hypetrain-end') {
    endHypeTrain();
    return;
  }

  // --- Support API Twitch EventSub (event wrapper) ---
  if (listener === 'event') {
    if (event.type === 'HypeTrainProgress') {
      const d = event.data || {};
      const pct = d.goal > 0 ? Math.round((d.progress / d.goal) * 100) : 0;
      if (!state.active) {
        startHypeTrain(d.level || 1, pct);
      } else {
        updateProgress(d.level || 1, pct);
      }
    }
    if (event.type === 'HypeTrainEnd') {
      endHypeTrain();
    }
  }
});

// ============================================
// TEST dans le navigateur (hors StreamElements)
// Decommentez le bloc ci-dessous pour tester :
// ============================================
/*
setTimeout(() => {
  startHypeTrain(1, 20);
  setTimeout(() => updateProgress(1, 55),  3000);
  setTimeout(() => updateProgress(2,  5),  6000);
  setTimeout(() => updateProgress(2, 78),  9000);
  setTimeout(() => updateProgress(3, 30), 12000);
  setTimeout(() => endHypeTrain(),         15000);
}, 1000);
*/
