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
const fill    = document.getElementById('ht-fill');
const levelEl = document.getElementById('ht-level');
const timerEl = document.getElementById('ht-timer');
const pctEl   = document.getElementById('ht-pct');

// ── Couleurs depuis les Fields ──────────────────
function applyColors(fields) {
  const s = document.documentElement.style;
  s.setProperty('--bar-color',     fields.barColor    || '#9147FF');
  s.setProperty('--bar-color-end', fields.barColorEnd || '#BF94FF');
  if (fields.trainDuration) {
    state.totalTime = parseInt(fields.trainDuration) || 300;
    state.timeLeft  = state.totalTime;
  }
}

// ── Formatage mm:ss ─────────────────────────────
function fmt(s) {
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

// ── Affichage ───────────────────────────────────
function render() {
  fill.style.width  = Math.min(Math.max(state.percent, 0), 100) + '%';
  pctEl.textContent = Math.round(state.percent) + '%';
  timerEl.textContent = fmt(state.timeLeft);
  timerEl.classList.toggle('urgent', state.timeLeft <= 30);
}

function setLevel(lvl) {
  if (parseInt(levelEl.textContent) !== lvl) {
    levelEl.textContent = lvl;
    levelEl.classList.remove('level-pop');
    void levelEl.offsetWidth;
    levelEl.classList.add('level-pop');
  }
}

// ── Timer ───────────────────────────────────────
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

// ── Show / Hide ─────────────────────────────────
function show() {
  widget.classList.replace('hidden', 'visible') || widget.classList.add('visible');
  widget.classList.remove('hidden');
}
function hide() {
  widget.classList.replace('visible', 'hidden') || widget.classList.add('hidden');
  widget.classList.remove('visible');
}

// ── Lifecycle ───────────────────────────────────
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
      fill.style.width        = '0%';
      levelEl.textContent     = '1';
      pctEl.textContent       = '0%';
      timerEl.textContent     = fmt(state.totalTime);
      timerEl.classList.remove('urgent');
    }, 500);
  }, 3000);
}

// ── Mode apercu ─────────────────────────────────
function runPreview() {
  endTrain();
  setTimeout(() => startTrain(1, 15),              800);
  setTimeout(() => updateTrain(1, 45),            2800);
  setTimeout(() => updateTrain(1, 82),            4800);
  setTimeout(() => updateTrain(2,  8),            6300);
  setTimeout(() => updateTrain(2, 55),            8300);
  setTimeout(() => updateTrain(3, 25),           10800);
  setTimeout(() => endTrain(),                   13000);
}

// ── Listeners StreamElements ────────────────────
window.addEventListener('onWidgetLoad', obj => {
  const f = obj.detail.fieldData;
  applyColors(f);
  if (f.previewMode === true || f.previewMode === 'true') runPreview();
});

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail;

  if (listener === 'hypetrain-progress') {
    const level   = event.level || 1;
    const value   = event.progress?.value   ?? event.percent ?? 0;
    const goal    = event.progress?.goal    ?? 100;
    const pct     = goal > 0 ? Math.round(value / goal * 100) : value;
    const tLeft   = event.time_left ?? undefined;
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
