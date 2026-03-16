const MAX_POINTS = 100;

// --- DOM ---
const valX       = document.getElementById('val-x');
const valY       = document.getElementById('val-y');
const valZ       = document.getElementById('val-z');
const valPeak    = document.getElementById('val-peak');
const statusPill = document.getElementById('status-pill');
const statusText = document.getElementById('status-text');
const unsupportedBanner = document.getElementById('unsupported-banner');

let peak = 0;

// --- Charts ---
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
        suggestedMin: -5,
        suggestedMax: 5,
      }
    }
  }
};

const xyzChart = new Chart(document.getElementById('chart-xyz'), {
  type: 'line',
  data: {
    labels: new Array(MAX_POINTS).fill(''),
    datasets: [
      {
        label: 'X',
        data: new Array(MAX_POINTS).fill(null),
        borderColor: '#ff6b6b',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Y',
        data: new Array(MAX_POINTS).fill(null),
        borderColor: '#6bffb8',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Z',
        data: new Array(MAX_POINTS).fill(null),
        borderColor: '#6bb5ff',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
    ]
  },
  options: {
    ...chartDefaults.options,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#aaa', boxWidth: 12, font: { size: 11 } }
      },
      tooltip: { enabled: false }
    },
  }
});

const magChart = new Chart(document.getElementById('chart-mag'), {
  type: 'line',
  data: {
    labels: new Array(MAX_POINTS).fill(''),
    datasets: [{
      data: new Array(MAX_POINTS).fill(null),
      borderColor: '#7c6aff',
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      fill: true,
      backgroundColor: '#7c6aff18',
    }]
  },
  options: {
    ...chartDefaults.options,
    scales: {
      ...chartDefaults.options.scales,
      y: {
        ...chartDefaults.options.scales.y,
        suggestedMin: 0,
        suggestedMax: 5,
      }
    }
  }
});

// --- Push to rolling chart ---
function pushData(chart, ...values) {
  values.forEach((val, i) => {
    chart.data.datasets[i].data.push(val);
    if (chart.data.datasets[i].data.length > MAX_POINTS) {
      chart.data.datasets[i].data.shift();
    }
  });
  chart.update('none');
}

// --- Sensor ---
if (!('Gyroscope' in window)) {
  unsupportedBanner.classList.remove('hidden');
  statusText.textContent = 'Not supported';
} else {
  try {
    const sensor = new Gyroscope({ frequency: 60 });

    sensor.addEventListener('error', (e) => {
      unsupportedBanner.textContent = `⚠️ Sensor error: ${e.error.message}`;
      unsupportedBanner.classList.remove('hidden');
      statusText.textContent = 'Error';
    });

    sensor.addEventListener('reading', () => {
      statusPill.classList.add('live');
      statusText.textContent = 'Live';

      const x = sensor.x ?? 0;
      const y = sensor.y ?? 0;
      const z = sensor.z ?? 0;
      const mag = Math.sqrt(x * x + y * y + z * z);

      if (mag > peak) peak = mag;

      valX.textContent    = x.toFixed(3);
      valY.textContent    = y.toFixed(3);
      valZ.textContent    = z.toFixed(3);
      valPeak.textContent = peak.toFixed(3);

      pushData(xyzChart, x, y, z);
      pushData(magChart, mag);
    });

    sensor.start();
  } catch (e) {
    unsupportedBanner.textContent = `⚠️ Could not start Gyroscope: ${e.message}`;
    unsupportedBanner.classList.remove('hidden');
    statusText.textContent = 'Error';
  }
}

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