const MAX_POINTS = 100;

const valX = document.getElementById('val-x');
const valY = document.getElementById('val-y');
const valZ = document.getElementById('val-z');
const valPeak = document.getElementById('val-peak');
const unsupportedBanner = document.getElementById('unsupported-banner');

let peak = 0;

// --- Charts ---

const chartDefaults = {
  responsive: true,
  animation: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { display: false },
    y: {
      grid: { color: '#1e1e2e' },
      ticks: { color: '#555', font: { size: 11 } },
    }
  }
};

const xyzCtx = document.getElementById('chart-xyz').getContext('2d');
const xyzChart = new Chart(xyzCtx, {
  type: 'line',
  data: {
    labels: Array(MAX_POINTS).fill(''),
    datasets: [
      {
        label: 'X',
        data: Array(MAX_POINTS).fill(null),
        borderColor: '#ff6b6b',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'Y',
        data: Array(MAX_POINTS).fill(null),
        borderColor: '#6bffb8',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: 'Z',
        data: Array(MAX_POINTS).fill(null),
        borderColor: '#6bb5ff',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
      },
    ]
  },
  options: {
    ...chartDefaults,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#aaa', boxWidth: 12, font: { size: 11 } }
      }
    },
    scales: {
      ...chartDefaults.scales,
      y: {
        ...chartDefaults.scales.y,
        suggestedMin: -5,
        suggestedMax: 5,
      }
    }
  }
});

const magCtx = document.getElementById('chart-mag').getContext('2d');
const magChart = new Chart(magCtx, {
  type: 'line',
  data: {
    labels: Array(MAX_POINTS).fill(''),
    datasets: [{
      data: Array(MAX_POINTS).fill(null),
      borderColor: '#7c6aff',
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.3,
      fill: true,
      backgroundColor: '#7c6aff18',
    }]
  },
  options: {
    ...chartDefaults,
    scales: {
      ...chartDefaults.scales,
      y: {
        ...chartDefaults.scales.y,
        suggestedMin: 0,
        suggestedMax: 5,
      }
    }
  }
});

// --- Push to rolling chart ---

function pushData(chart, ...datasets) {
  datasets.forEach((val, i) => {
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
} else {
  try {
    const sensor = new Gyroscope({ frequency: 60 });

    sensor.addEventListener('error', (e) => {
      unsupportedBanner.textContent = `⚠️ Sensor error: ${e.error.message}`;
      unsupportedBanner.classList.remove('hidden');
    });

    sensor.addEventListener('reading', () => {
      const x = sensor.x ?? 0;
      const y = sensor.y ?? 0;
      const z = sensor.z ?? 0;
      const mag = Math.sqrt(x * x + y * y + z * z);

      if (mag > peak) peak = mag;

      valX.textContent = x.toFixed(3);
      valY.textContent = y.toFixed(3);
      valZ.textContent = z.toFixed(3);
      valPeak.textContent = peak.toFixed(3);

      pushData(xyzChart, x, y, z);
      pushData(magChart, mag);
    });

    sensor.start();
  } catch (e) {
    unsupportedBanner.textContent = `⚠️ Could not start Gyroscope: ${e.message}`;
    unsupportedBanner.classList.remove('hidden');
  }
}