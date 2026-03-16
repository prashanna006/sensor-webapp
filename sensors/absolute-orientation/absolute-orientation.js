import * as THREE from 'three';
// --- State ---
const offsetQuat      = new THREE.Quaternion();
const _raw            = new THREE.Quaternion();
const _prevRaw        = new THREE.Quaternion();
const currentQuat     = new THREE.Quaternion();
const frameCorrection = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(Math.PI / 2, 0, 0)
);
const _gravity = new THREE.Vector3();
let lastReadingTime = null;

// --- DOM ---
const valFace    = document.getElementById('val-face');
const valTilt    = document.getElementById('val-tilt');
const valSpin    = document.getElementById('val-spin');
const statusPill = document.getElementById('status-pill');
const statusText = document.getElementById('status-text');
const banner     = document.getElementById('permission-banner');
const requestBtn = document.getElementById('request-btn');

// --- Three.js setup ---
const canvas   = document.getElementById('cube-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.6, 3.2);
camera.lookAt(0, 0, 0);

function resizeRenderer() {
  const size = canvas.parentElement.clientWidth;
  renderer.setSize(size, size);
  camera.updateProjectionMatrix();
}
resizeRenderer();
window.addEventListener('resize', resizeRenderer);

// Phone proportions from screen size
const mmPerPx = 25.4 / 440;
const wMm = (screen.width  * devicePixelRatio) * mmPerPx;
const hMm = (screen.height * devicePixelRatio) * mmPerPx;
const s   = 1.2 / Math.max(wMm, hMm);
const w   = wMm * s;
const h   = hMm * s;
const d   = 8 * s;

// Phone body
const geometry = new THREE.BoxGeometry(w, h, d);
const phoneMesh = new THREE.Mesh(geometry, [
  new THREE.MeshLambertMaterial({ color: 0x1a1a2e }),  // right
  new THREE.MeshLambertMaterial({ color: 0x0e0e16 }),  // left
  new THREE.MeshLambertMaterial({ color: 0x1a1a2e }),  // top
  new THREE.MeshLambertMaterial({ color: 0x0e0e16 }),  // bottom
  new THREE.MeshLambertMaterial({ color: 0x7c6aff }),  // front (screen)
  new THREE.MeshLambertMaterial({ color: 0x0a0a0f }),  // back
]);

const pivot = new THREE.Object3D();
scene.add(pivot);
pivot.add(phoneMesh);

// Edges
phoneMesh.add(new THREE.LineSegments(
  new THREE.EdgesGeometry(geometry),
  new THREE.LineBasicMaterial({ color: 0x7c6aff, transparent: true, opacity: 0.5 })
));

// Screen highlight
const screen3d = new THREE.Mesh(
  new THREE.PlaneGeometry(w * 0.85, h * 0.88),
  new THREE.MeshBasicMaterial({ color: 0x7c6aff, transparent: true, opacity: 0.12 })
);
screen3d.position.z = d / 2 + 0.001;
phoneMesh.add(screen3d);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const keyLight = new THREE.DirectionalLight(0x88ccff, 0.9);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x4488aa, 0.3);
fillLight.position.set(-3, -2, -3);
scene.add(fillLight);

// --- Render loop ---
function renderLoop() {
  pivot.quaternion.slerp(currentQuat, 0.18);
  renderer.render(scene, camera);
  requestAnimationFrame(renderLoop);
}

// --- Face detection ---
function getFace() {
  _gravity.set(0, 0, -1);
  _gravity.applyQuaternion(_raw.clone().invert());

  const ax = Math.abs(_gravity.x);
  const ay = Math.abs(_gravity.y);
  const az = Math.abs(_gravity.z);

  if (az > ax && az > ay) {
    return _gravity.z < 0 ? 'Screen Up' : 'Screen Down';
  } else if (ay > ax) {
    return _gravity.y < 0 ? 'Portrait' : 'Portrait ↓';
  } else {
    return _gravity.x > 0 ? 'Landscape R' : 'Landscape L';
  }
}

// --- Tilt detection ---
// Angle between gravity vector and phone's upright axis (Y in phone frame)
// 0 = upright, 90 = flat
function getTilt() {
  _gravity.set(0, 0, 1);
  _gravity.applyQuaternion(_raw.clone().invert());
  const dot = _gravity.z;
  return Math.round(90 - THREE.MathUtils.radToDeg(Math.acos(Math.max(-1, Math.min(1, dot)))));
}
// --- Spin detection ---
// Angular velocity around vertical axis in °/s
function getSpin(dt) {
  if (dt <= 0) return 0;
  // Relative rotation between frames
  const delta = _prevRaw.clone().invert().multiply(_raw);
  // Extract angle of rotation
  const angle = 2 * Math.acos(Math.max(-1, Math.min(1, Math.abs(delta.w))));
  return Math.round(THREE.MathUtils.radToDeg(angle) / dt);
}

// --- Orientation sensor ---
let sensor;

function startSensor() {
  try {
    sensor = new AbsoluteOrientationSensor({ frequency: 30 });

    sensor.addEventListener('reading', () => {
      const q = sensor.quaternion;
      _prevRaw.copy(_raw);
      _raw.set(q[0], q[1], q[2], q[3]);

      const now = performance.now();
      const dt  = lastReadingTime ? (now - lastReadingTime) / 1000 : 0;
      lastReadingTime = now;

      // Frame correction + offset for 3D model
      const corrected = new THREE.Quaternion().copy(frameCorrection).multiply(_raw);
      currentQuat.copy(offsetQuat).multiply(corrected);

      valFace.textContent = getFace();
      valTilt.textContent = getTilt();
      valSpin.textContent = getSpin(dt);
    });

    sensor.addEventListener('error', e => {
      statusText.textContent = 'Error';
      console.error(e);
    });

    sensor.start();

    // Auto-reset on first reading
    sensor.addEventListener('reading', function autoReset() {
      const corrected = new THREE.Quaternion().copy(frameCorrection).multiply(_raw);
      offsetQuat.copy(corrected).invert();
    }, { once: true });

    statusPill.classList.add('live');
    statusText.textContent = 'Live';
    banner.classList.add('hidden');

  } catch (e) {
    statusText.textContent = 'Not supported';
    banner.classList.add('hidden');
  }
}

// --- iOS permission ---
function init() {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    banner.classList.remove('hidden');
    requestBtn.addEventListener('click', () => {
      DeviceOrientationEvent.requestPermission()
        .then(state => {
          if (state === 'granted') startSensor();
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
    startSensor();
  }
}

// --- Boot ---
init();

document.getElementById('reset-btn').addEventListener('click', () => {
  const corrected = new THREE.Quaternion().copy(frameCorrection).multiply(_raw);
  offsetQuat.copy(corrected).invert();
});

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