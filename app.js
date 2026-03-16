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