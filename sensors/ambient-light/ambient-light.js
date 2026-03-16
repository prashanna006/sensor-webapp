const MAX_POINTS = 100;

const valCurrent = document.getElementById('val-current');
const valMin = document.getElementById('val-min');
const valMax = document.getElementById('val-max');
const luxBig = document.getElementById('lux-big');
const luxLabel = document.getElementById('lux-label');
const luxRing = document.getElementById('lux-ring');
const unsupportedBanner = document.getElementById('unsupported-banner');

let minLux = Infinity;
let maxLux = -Infinity;

// --- Lux label thresholds ---
function getLuxLabel(lux) {
  if (lux < 10)   return 'Night';
  if (lux < 50)   return 'Dim';
  if (lux < 500)  return 'Indoors';
  if (lux < 5000) return 'Overcast';
  return 'Sunlight';
}

// --- Lux glow: log10 scaled 0–1 ---
function getLuxIntensity(lux) {
  if (lux <= 0) return 0;
  // log10(1) = 0, log10(100000) = 5 — clamp to 0–1
  return Math.min(Math.log10(lux) / 5, 1);
}

function updateLuxVisual(lux) {
  const t = getLuxIntensity(lux);
  const alpha = 0.1 + t * 0.5;
  const blur = 8 + t * 40;
  const spread = t * 20;
  const borderAlpha = 0.2 + t * 0.6;

  luxRing.style.boxShadow = `
    0 0 ${blur}px ${spread}px rgba(124, 106, 255, ${alpha}),
    inset 0 0 ${blur / 2}px rgba(124, 106, 255, ${alpha * 0.4})
  `;
  luxRing.style.borderColor = `rgba(124, 106, 255, ${borderAlpha})`;
}

// --- Chart ---
const ctx = document.getElementById('chart-lux').getContext('2d');
const luxChart = new Chart(ctx, {
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
    responsive: true,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: {
        grid: { color: '#1e1e2e' },
        ticks: { color: '#555', font: { size: 11 } },
        suggestedMin: 0,
        suggestedMax: 500,
      }
    }
  }
});

function pushData(lux) {
  luxChart.data.datasets[0].data.push(lux);
  if (luxChart.data.datasets[0].data.length > MAX_POINTS) {
    luxChart.data.datasets[0].data.shift();
  }
  luxChart.update('none');
}

// --- Sensor ---
if (!('AmbientLightSensor' in window)) {
  unsupportedBanner.classList.remove('hidden');
} else {
  try {
    const sensor = new AmbientLightSensor({ frequency: 5 });

    sensor.addEventListener('error', (e) => {
      unsupportedBanner.textContent = `⚠️ Sensor error: ${e.error.message}`;
      unsupportedBanner.classList.remove('hidden');
    });

    sensor.addEventListener('reading', () => {
      const lux = sensor.illuminance ?? 0;

      if (lux < minLux) minLux = lux;
      if (lux > maxLux) maxLux = lux;

      valCurrent.textContent = lux.toFixed(1);
      valMin.textContent = minLux === Infinity ? '—' : minLux.toFixed(1);
      valMax.textContent = maxLux === -Infinity ? '—' : maxLux.toFixed(1);
      luxBig.textContent = lux.toFixed(1);
      luxLabel.textContent = getLuxLabel(lux);

      updateLuxVisual(lux);
      pushData(lux);
    });

    sensor.start();
  } catch (e) {
    unsupportedBanner.textContent = `⚠️ Could not start Ambient Light Sensor: ${e.message}`;
    unsupportedBanner.classList.remove('hidden');
  }
}