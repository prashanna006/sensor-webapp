// --- Config ---
const MAX_POINTS = 100;
const ALPHA      = 0.05;

// --- State ---
const accel = { x: 0, y: 0, z: 0 };
const vel   = { x: 0, y: 0, z: 0 };
let lastTime    = null;
let dirty       = false;
let initialized = false;

// --- DOM ---
const valAccel   = document.getElementById('val-accel');
const valVel     = document.getElementById('val-vel');
const statusPill = document.getElementById('status-pill');
const statusText = document.getElementById('status-text');
const banner     = document.getElementById('permission-banner');
const requestBtn = document.getElementById('request-btn');

// --- Chart setup ---
const chartDefaults = {
  type: 'line',
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: true,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: {
        grid: { color: '#1e1e2e' },
        ticks: { color: '#555', font: { size: 10 }, maxTicksLimit: 4 },
        border: { color: '#1e1e2e' },
        suggestedMin: 0,
        suggestedMax: 2,
      }
    }
  }
};

const accelChart = new Chart(document.getElementById('accel-chart'), {
  ...chartDefaults,
  data: {
    labels: new Array(MAX_POINTS).fill(''),
    datasets: [{
      data: new Array(MAX_POINTS).fill(0),
      borderColor: '#7c6aff',
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    }]
  }
});

const velChart = new Chart(document.getElementById('vel-chart'), {
  ...chartDefaults,
  data: {
    labels: new Array(MAX_POINTS).fill(''),
    datasets: [{
      data: new Array(MAX_POINTS).fill(0),
      borderColor: '#7c6aff',
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      fill: false,
    }]
  }
});

// --- Push single value into chart ---
function pushData(chart, value) {
  chart.data.datasets[0].data.push(value);
  if (chart.data.datasets[0].data.length > MAX_POINTS) {
    chart.data.datasets[0].data.shift();
  }
}

// --- Render loop ---
function renderLoop() {
  if (dirty) {
    accelChart.update('none');
    velChart.update('none');

    const mag  = Math.sqrt(accel.x**2 + accel.y**2 + accel.z**2);
    const vMag = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2);

    valAccel.textContent = mag.toFixed(3);
    valVel.textContent   = vMag.toFixed(3);

    dirty = false;
  }
  requestAnimationFrame(renderLoop);
}

// --- Motion handler ---
function onMotion(e) {
  const raw = e.acceleration;
  if (!raw || raw.x === null) return;

  const now = performance.now();
  const dt  = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
  lastTime  = now;

  if (!initialized) {
    accel.x = raw.x;
    accel.y = raw.y;
    accel.z = raw.z;
    initialized = true;
  } else {
    accel.x += ALPHA * (raw.x - accel.x);
    accel.y += ALPHA * (raw.y - accel.y);
    accel.z += ALPHA * (raw.z - accel.z);
  }

  const mag = Math.sqrt(accel.x**2 + accel.y**2 + accel.z**2);

  if (dt > 0) {
    vel.x += accel.x * dt;
    vel.y += accel.y * dt;
    vel.z += accel.z * dt;
  }

  if (mag < 0.1) {
    vel.x = 0;
    vel.y = 0;
    vel.z = 0;
  }

  const vMag = Math.sqrt(vel.x**2 + vel.y**2 + vel.z**2);

  pushData(accelChart, mag);
  pushData(velChart, vMag);

  dirty = true;
}

// --- Start listening ---
function startListening() {
  if (!window.DeviceMotionEvent) {
    statusText.textContent = 'Not supported';
    banner.classList.add('hidden');
    return;
  }

  window.addEventListener('devicemotion', onMotion);
  statusPill.classList.add('live');
  statusText.textContent = 'Live';
  banner.classList.add('hidden');
}

// --- iOS permission ---
function init() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
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

window.addEventListener('click', e => triggerHaze(e.clientX, e.clientY));
window.addEventListener('touchstart', e => {
  const t = e.touches[0];
  triggerHaze(t.clientX, t.clientY);
}, { passive: true });