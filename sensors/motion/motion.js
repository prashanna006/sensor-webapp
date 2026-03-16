// --- Config ---
const MAX_POINTS    = 100;   // data points shown on chart
const ALPHA     = 0.05;  // low-pass smoothing factor
const INTERVAL  = 1000 / 30; // ~30 Hz target

// --- State ---
const accel = { x: 0, y: 0, z: 0 };
const vel   = { x: 0, y: 0, z: 0 };
let lastTime = null;
let dirty = false;

// --- DOM ---
const valX   = document.getElementById('val-x');
const valY   = document.getElementById('val-y');
const valZ   = document.getElementById('val-z');
const valMag = document.getElementById('val-mag');
const statusPill = document.getElementById('status-pill');
const statusText = document.getElementById('status-text');
const banner     = document.getElementById('permission-banner');
const requestBtn = document.getElementById('request-btn');

// --- Chart setup ---
function makeDatasets(axisColors) {
  const labels = ['X', 'Y', 'Z', '|v|'];
  return labels.map((label, i) => ({
    label,
    data: new Array(MAX_POINTS).fill(0),
    borderColor: axisColors[i],
    borderWidth: 1.5,
    pointRadius: 0,
    tension: 0.3,
    fill: false,
  }));
}

const chartDefaults = {
  type: 'line',
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: {
        grid: { color: '#1e1e2e' },
        ticks: { color: '#555', font: { size: 10 }, maxTicksLimit: 5 },
        border: { color: '#1e1e2e' },
      }
    }
  }
};

const accelColors = [
  getComputedStyle(document.documentElement).getPropertyValue('--x').trim()   || '#ff6a6a',
  getComputedStyle(document.documentElement).getPropertyValue('--y').trim()   || '#6affb0',
  getComputedStyle(document.documentElement).getPropertyValue('--z').trim()   || '#6ac8ff',
  getComputedStyle(document.documentElement).getPropertyValue('--mag').trim() || '#ffd96a',
];

const accelChart = new Chart(document.getElementById('accel-chart'), {
  ...chartDefaults,
  data: { labels: new Array(MAX_POINTS).fill(''), datasets: makeDatasets(accelColors) }
});

const velChart = new Chart(document.getElementById('vel-chart'), {
  ...chartDefaults,
  data: { labels: new Array(MAX_POINTS).fill(''), datasets: makeDatasets(accelColors) }
});

// --- Push data into chart datasets ---
function pushData(chart, values) {
  chart.data.datasets.forEach((ds, i) => {
    ds.data.push(values[i]);
    if (ds.data.length > MAX_POINTS) ds.data.shift();
  });
}

// --- Render loop ---
function renderLoop() {
  if (dirty) {
    accelChart.update('none');
    velChart.update('none');

    const mag = Math.sqrt(accel.x**2 + accel.y**2 + accel.z**2);
    const vMag = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2);

    valX.textContent   = accel.x.toFixed(2);
    valY.textContent   = accel.y.toFixed(2);
    valZ.textContent   = accel.z.toFixed(2);
    valMag.textContent = mag.toFixed(2);

    dirty = false;
  }
  requestAnimationFrame(renderLoop);
}

// --- Motion handler ---
function onMotion(e) {
  const raw = e.accelerationIncludingGravity;
  if (!raw) return;

  const now = performance.now();
  const dt  = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
  lastTime  = now;

  // Low-pass filter
  accel.x += ALPHA * ((raw.x ?? 0) - accel.x);
  accel.y += ALPHA * ((raw.y ?? 0) - accel.y);
  accel.z += ALPHA * ((raw.z ?? 0) - accel.z);

  // Integrate velocity (simple Euler)
  if (dt > 0) {
    vel.x += accel.x * dt;
    vel.y += accel.y * dt;
    vel.z += accel.z * dt;
  }

  const mag  = Math.sqrt(accel.x**2 + accel.y**2 + accel.z**2);
  const vMag = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2);

  pushData(accelChart, [accel.x, accel.y, accel.z, mag]);
  pushData(velChart,   [vel.x,   vel.y,   vel.z,   vMag]);

  dirty = true;
}

// --- Start listening ---
function startListening() {
  if (!MAX_POINTS.DeviceMotionEvent) {
    statusText.textContent = 'Not supported';
    banner.classList.add('hidden');
    return;
  }

  MAX_POINTS.addEventListener('devicemotion', onMotion);
  statusPill.classList.add('live');
  statusText.textContent = 'Live';
  banner.classList.add('hidden');
}

// --- iOS permission ---
function init() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    // iOS 13+ — show banner, wait for tap
    banner.classList.remove('hidden');
    requestBtn.addEventListener('click', () => {
      DeviceMotionEvent.requestPermission()
        .then(state => {
          if (state === 'granted') startListening();
          else {
            statusText.textContent = 'Denied';
            banner.classList.add('hidden');
          }
        })
        .catch(() => {
          statusText.textContent = 'Error';
          banner.classList.add('hidden');
        });
    });
  } else {
    // Android / desktop — start immediately, hide banner
    banner.classList.add('hidden');
    startListening();
  }
}

// --- Boot ---
init();
requestAnimationFrame(renderLoop);

// --- Purple haze bloom ---
function triggerHaze(x, y) {
  const blob = document.createElement('div');
  blob.className = 'haze-blob';
  blob.style.left = x + 'px';
  blob.style.top  = y + 'px';
  document.body.appendChild(blob);
  blob.getBoundingClientRect();
  blob.classList.add('active');
  blob.addEventListener('animationend', () => blob.remove());
}

MAX_POINTS.addEventListener('click', e => triggerHaze(e.clientX, e.clientY));
MAX_POINTS.addEventListener('touchstart', e => {
  const t = e.touches[0];
  triggerHaze(t.clientX, t.clientY);
}, { passive: true });