// --- Sensor Count ---
function getSensorCount() {
  let count = 0;
  if (window.DeviceMotionEvent) count++;
  if (window.DeviceOrientationEvent) count++;
  if ('Magnetometer' in window) count++;
  if ('AmbientLightSensor' in window) count++;
  if ('AbsoluteOrientationSensor' in window) count++;
  return count;
}

const count = getSensorCount();
document.getElementById('sensor-count').textContent =
  count > 0 ? `${count} sensor${count > 1 ? 's' : ''} detected` : 'No sensors detected';

// --- Glass Distortion Ripple ---
const turbulence = document.getElementById('turbulence');
const app = document.getElementById('app');

let animating = false;
let startTime = null;
const DURATION = 900;

function animateRipple(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;
  const progress = Math.min(elapsed / DURATION, 1);

  // Ease out curve
  const eased = 1 - Math.pow(1 - progress, 3);

  // Frequency rises then falls — creates the wave expanding outward
  const freq = Math.sin(eased * Math.PI) * 0.008;
  const scale = Math.sin(eased * Math.PI) * 18;

  turbulence.setAttribute('baseFrequency', freq);
  turbulence.parentElement.nextElementSibling
    ?.setAttribute('scale', scale);

  // Update displacement scale
  const filter = document.querySelector('#glass-distort feDisplacementMap');
  if (filter) filter.setAttribute('scale', scale);

  if (progress < 1) {
    requestAnimationFrame(animateRipple);
  } else {
    // Clean up
    turbulence.setAttribute('baseFrequency', 0);
    if (filter) filter.setAttribute('scale', 0);
    app.classList.remove('distorting');
    animating = false;
    startTime = null;
  }
}

function triggerRipple() {
  if (animating) {
    startTime = null;
  }
  animating = true;
  app.classList.add('distorting');
  requestAnimationFrame(animateRipple);
}

window.addEventListener('click', triggerRipple);
window.addEventListener('touchstart', triggerRipple, { passive: true });