// --- Sensor Count + Badges ---
function setBadge(id, supported) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = supported ? 'Available' : 'Not supported';
  el.classList.add(supported ? 'badge-available' : 'badge-unsupported');
}

const motionSupported      = !!window.DeviceMotionEvent;
const gyroSupported        = 'Gyroscope' in window;
const orientationSupported = 'AbsoluteOrientationSensor' in window;

setBadge('badge-motion',      motionSupported);
setBadge('badge-gyroscope',   gyroSupported);
setBadge('badge-orientation', orientationSupported);

const count = [motionSupported, gyroSupported, orientationSupported].filter(Boolean).length;
document.getElementById('sensor-count').textContent =
  count > 0 ? `${count} sensor${count > 1 ? 's' : ''} detected` : 'No sensors detected';

const count = getSensorCount();
document.getElementById('sensor-count').textContent =
  count > 0 ? `${count} sensor${count > 1 ? 's' : ''} detected` : 'No sensors detected';

// --- Purple Haze Bloom ---
function triggerHaze(x, y) {
  const blob = document.createElement('div');
  blob.className = 'haze-blob';
  blob.style.left = x + 'px';
  blob.style.top  = y + 'px';
  document.body.appendChild(blob);
  // Force reflow so animation triggers fresh
  blob.getBoundingClientRect();
  blob.classList.add('active');
  blob.addEventListener('animationend', () => blob.remove());
}

window.addEventListener('click', e => triggerHaze(e.clientX, e.clientY));
window.addEventListener('touchstart', e => {
  const t = e.touches[0];
  triggerHaze(t.clientX, t.clientY);
}, { passive: true });