// --- Sensor Count Detection ---
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