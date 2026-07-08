/* ============================================
   Hype Train Widget - StreamElements
   ============================================ */

const state = {
  active:    false,
  level:     1,
  percent:   0,
  timeLeft:  300,
  totalTime: 300,
  timerInterval: null,
};

const widget  = document.getElementById('ht-widget');
const bar     = widget.querySelector('.ht-bar');
const fill    = document.getElementById('ht-fill');
const infoEl  = fill.querySelector('.ht-info');
const levelEl = document.getElementById('ht-level');
const timerEl = document.getElementById('ht-timer');
const pctEl   = document.getElementById('ht-pct');

// Largeur reservee a gauche pour la bulle (px) — toujours visible
const INFO_W = 88; // 10px left + 68px bloc + 10px marge droite

// --- Couleurs depuis les Fields ---
function applyColors(fields) {
  document.documentElement.style.setProperty('--bar-color', fields.barColor || '#9147FF');
  if (fields.trainDuration) {
    state.totalTime = parseInt(fields.trainDuration) || 300;
    state.timeLeft  = state.totalTime;
  }
}

// --- Formatage mm:ss ---
function fmt(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

// --- Affichage ---
function render() {
  const pct        = Math.min(Math.max(state.percent, 0), 100);
  const totalWidth = bar.offsetWidth;
  // La barre fill commence apres la zone info (INFO_W), puis grandit vers la droite
  // On laisse toujours INFO_W de libre au debut (la bulle est en position absolute)
  const availWidth = totalWidth - INFO_W;
  const fillPx     = INFO_W + Math.round(availWidth * pct / 100);

  fill.style.width    = fillPx + 'px';
  pctEl.textContent   = Math.round(pct) + '%';
  timerEl.textContent = fmt(state.timeLeft);
  timerEl.classList.toggle('urgent', state.timeLeft <= 30);
}

function setLevel(lvl) {
  const label = 'LVL ' + lvl;
  if (levelEl.textContent !== label) {
    levelEl.textContent = label;
    infoEl.classList.remove('level-pop');
    void infoEl.offsetWidth;
    infoEl.classList.add('level-pop');
  }
}

// --- Timer ---
function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.timeLeft > 0) {
      state.timeLeft--;
      timerEl.textContent = fmt(state.timeLeft);
      timerEl.classList.toggle('urgent', state.timeLeft <= 30);
    } else {
      endTrain();
    }
  }, 1000);
}

// --- Show / Hide ---
function show() { widget.classList.remove('hidden'); widget.classList.add('visible'); }
function hide() { widget.classList.remove('visible'); widget.classList.add('hidden'); }

// --- Lifecycle ---
function startTrain(level, percent) {
  state.active   = true;
  state.level    = level   || 1;
  state.percent  = percent || 0;
  state.timeLeft = state.totalTime;
  setLevel(state.level);
  show();
  render();
  startTimer();
}

function updateTrain(level, percent, timeLeft) {
  state.level   = level;
  state.percent = percent;
  if (timeLeft != null) state.timeLeft = timeLeft;
  setLevel(state.level);
  if (!state.active) { state.active = true; show(); startTimer(); }
  render();
}

function endTrain() {
  clearInterval(state.timerInterval);
  state.active  = false;
  state.percent = 100;
  render();
  setTimeout(() => {
    hide();
    setTimeout(() => {
      state.level    = 1;
      state.percent  = 0;
      state.timeLeft = state.totalTime;
      fill.style.width    = INFO_W + 'px';
      levelEl.textContent = 'LVL 1';
      pctEl.textContent   = '0%';
      timerEl.textContent = fmt(state.totalTime);
      timerEl.classList.remove('urgent');
    }, 500);
  }, 3000);
}

// --- Mode apercu (~17s) ---
function runPreview() {
  clearInterval(state.timerInterval);
  state.active = false;
  hide();
  setTimeout(() => startTrain(1, 15),       500);
  setTimeout(() => updateTrain(1, 35),     2500);
  setTimeout(() => updateTrain(1, 58),     4500);
  setTimeout(() => updateTrain(1, 80),     6500);
  setTimeout(() => updateTrain(2,  8),     8000);
  setTimeout(() => updateTrain(2, 38),    10000);
  setTimeout(() => updateTrain(2, 69),    12000);
  setTimeout(() => updateTrain(2, 91),    14000);
  setTimeout(() => updateTrain(3, 22),    15500);
  setTimeout(() => endTrain(),            17500);
}

// --- Listeners StreamElements ---
window.addEventListener('onWidgetLoad', obj => {
  const f = obj.detail.fieldData;
  applyColors(f);
  if (f.previewMode === true || f.previewMode === 'true') runPreview();
});

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail;

  if (listener === 'hypetrain-progress') {
    const level = event.level || 1;
    const value = event.progress?.value ?? event.percent ?? 0;
    const goal  = event.progress?.goal  ?? 100;
    const pct   = goal > 0 ? Math.round(value / goal * 100) : value;
    const tLeft = event.time_left ?? undefined;
    state.active ? updateTrain(level, pct, tLeft) : startTrain(level, pct);
    return;
  }

  if (listener === 'hypetrain-end') { endTrain(); return; }

  if (listener === 'event') {
    if (event.type === 'HypeTrainProgress') {
      const d   = event.data || {};
      const pct = d.goal > 0 ? Math.round(d.progress / d.goal * 100) : 0;
      state.active ? updateTrain(d.level||1, pct) : startTrain(d.level||1, pct);
    }
    if (event.type === 'HypeTrainEnd') endTrain();
  }
});
