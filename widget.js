/* Hype Train Widget — StreamElements */

const state = {
  active: false, level: 1, percent: 0,
  timeLeft: 300, totalTime: 300,
  timerInterval: null,
};

const widget  = document.getElementById('ht-widget');
const fill    = document.getElementById('ht-fill');
const levelEl = document.getElementById('ht-level');
const badgeEl = widget.querySelector('.ht-badge');
const timerEl = document.getElementById('ht-timer');
const pctEl   = document.getElementById('ht-pct');

const FONTS = {
  'Anton':            "'Anton', Arial, sans-serif",
  'Barlow Condensed': "'Barlow Condensed', Arial, sans-serif",
  'Bebas Neue':       "'Bebas Neue', Arial, sans-serif",
  'Russo One':        "'Russo One', Arial, sans-serif",
  'Teko':             "'Teko', Arial, sans-serif",
  'Oswald':           "'Oswald', Arial, sans-serif",
  'Fjalla One':       "'Fjalla One', Arial, sans-serif",
  'Passion One':      "'Passion One', Arial, sans-serif",
  'Alfa Slab One':    "'Alfa Slab One', Georgia, serif",
  'Righteous':        "'Righteous', Arial, sans-serif",
  'Boogaloo':         "'Boogaloo', Arial, sans-serif",
  'Audiowide':        "'Audiowide', monospace",
  'Orbitron':         "'Orbitron', monospace",
  'Exo 2':            "'Exo 2', Arial, sans-serif",
  'Rajdhani':         "'Rajdhani', Arial, sans-serif",
  'Chakra Petch':     "'Chakra Petch', monospace",
  'Oxanium':          "'Oxanium', monospace",
  'Share Tech Mono':  "'Share Tech Mono', monospace",
  'Play':             "'Play', Arial, sans-serif",
  'Kanit':            "'Kanit', Arial, sans-serif",
  'Black Han Sans':   "'Black Han Sans', Arial, sans-serif",
};

function applyFields(f) {
  const root = document.documentElement;
  if (f.barColor)  root.style.setProperty('--bar-color',    f.barColor);
  if (f.bgColor) {
    root.style.setProperty('--bg-color', f.bgColor);
  }
  if (f.fontChoice && FONTS[f.fontChoice])
    root.style.setProperty('--widget-font', FONTS[f.fontChoice]);
  if (f.trainDuration) {
    state.totalTime = parseInt(f.trainDuration) || 300;
    state.timeLeft  = state.totalTime;
  }
}

function fmt(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function render() {
  const pct = Math.min(Math.max(state.percent, 0), 100);
  fill.style.width    = pct + '%';
  pctEl.textContent   = Math.round(pct) + '%';
  timerEl.textContent = fmt(state.timeLeft);
  timerEl.classList.toggle('urgent', state.timeLeft <= 30);
}

function setLevel(lvl) {
  const label = 'LVL ' + lvl;
  if (levelEl.textContent !== label) {
    levelEl.textContent = label;
    badgeEl.classList.remove('level-pop');
    void badgeEl.offsetWidth;
    badgeEl.classList.add('level-pop');
  }
}

function startTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    if (state.timeLeft > 0) {
      state.timeLeft--;
      timerEl.textContent = fmt(state.timeLeft);
      timerEl.classList.toggle('urgent', state.timeLeft <= 30);
    } else { endTrain(); }
  }, 1000);
}

function show() { widget.classList.remove('hidden'); widget.classList.add('visible'); }
function hide() { widget.classList.remove('visible'); widget.classList.add('hidden'); }

function startTrain(level, percent) {
  state.active = true; state.level = level || 1;
  state.percent = percent || 0; state.timeLeft = state.totalTime;
  setLevel(state.level); show(); render(); startTimer();
}

function updateTrain(level, percent, timeLeft) {
  state.level = level; state.percent = percent;
  if (timeLeft != null) state.timeLeft = timeLeft;
  setLevel(state.level);
  if (!state.active) { state.active = true; show(); startTimer(); }
  render();
}

function endTrain() {
  clearInterval(state.timerInterval);
  state.active = false; state.percent = 100; render();
  setTimeout(() => {
    hide();
    setTimeout(() => {
      state.level = 1; state.percent = 0; state.timeLeft = state.totalTime;
      fill.style.width = '0%';
      levelEl.textContent = 'LVL 1'; pctEl.textContent = '0%';
      timerEl.textContent = fmt(state.totalTime);
      timerEl.classList.remove('urgent');
    }, 500);
  }, 3000);
}

function runPreview() {
  clearInterval(state.timerInterval); state.active = false; hide();
  setTimeout(() => startTrain(1, 15),    500);
  setTimeout(() => updateTrain(1, 35),  2500);
  setTimeout(() => updateTrain(1, 58),  4500);
  setTimeout(() => updateTrain(1, 80),  6500);
  setTimeout(() => updateTrain(2,  8),  8000);
  setTimeout(() => updateTrain(2, 38), 10000);
  setTimeout(() => updateTrain(2, 69), 12000);
  setTimeout(() => updateTrain(2, 91), 14000);
  setTimeout(() => updateTrain(3, 22), 15500);
  setTimeout(() => endTrain(),         17500);
}

window.addEventListener('onWidgetLoad', obj => {
  applyFields(obj.detail.fieldData);
  if (obj.detail.fieldData.previewMode === true || obj.detail.fieldData.previewMode === 'true') runPreview();
});

window.addEventListener('onEventReceived', obj => {
  const { listener, event } = obj.detail;
  if (listener === 'hypetrain-progress') {
    const level = event.level || 1;
    const value = event.progress?.value ?? event.percent ?? 0;
    const goal  = event.progress?.goal  ?? 100;
    const pct   = goal > 0 ? Math.round(value / goal * 100) : value;
    state.active ? updateTrain(level, pct, event.time_left) : startTrain(level, pct);
    return;
  }
  if (listener === 'hypetrain-end') { endTrain(); return; }
  if (listener === 'event') {
    if (event.type === 'HypeTrainProgress') {
      const d = event.data || {};
      const pct = d.goal > 0 ? Math.round(d.progress / d.goal * 100) : 0;
      state.active ? updateTrain(d.level||1, pct) : startTrain(d.level||1, pct);
    }
    if (event.type === 'HypeTrainEnd') endTrain();
  }
});
