# Sensor Visualizer

**Live demo → [prashanna006.github.io/sensor-webapp](https://prashanna006.github.io/sensor-webapp)**

A mobile-first web app that reads real-time sensor data from your phone and visualizes it as live charts and 3D graphics. No frameworks, no build step — just open it in your browser.

---

## Sensors

### ⚡ Motion
Reads raw acceleration from your device's accelerometer and integrates it into velocity over time. Uses a low-pass filter to reduce noise and a dead zone to prevent velocity drift when the phone is still.

### 🌀 Gyroscope
Reads raw rotation rate across the X, Y, and Z axes in rad/s. Shows live per-axis charts and a combined magnitude over time. Tracks peak rotation since the page was opened.

### 🧭 Absolute Orientation
Fuses gyroscope, accelerometer, and magnetometer data into a full 3D orientation quaternion. Renders a live 3D model of your phone using Three.js that rotates in real time to match how you're holding it.

---

## Usage

Open the live demo on your **mobile phone** for the best experience. A desktop browser will work for some sensors but motion and orientation data requires a physical device.

### Permissions

**Motion (iOS only)**
Safari on iOS requires explicit permission to access motion data. When you open the Motion page, tap **Enable Motion** when prompted. If you dismiss it accidentally, reload the page.

**Absolute Orientation (Android)**
Works automatically on Android Chrome over HTTPS — no prompt needed. Not supported on iOS.

**Gyroscope (Android)**
Works automatically on Android Chrome over HTTPS — no prompt needed.

### Absolute Orientation tips
- On first load, hold your phone **upright facing you** and tap **Reset**
- The 3D model will snap to match your phone's real-world orientation
- Tap Reset any time the model drifts or looks wrong

---

## Tech Stack

- Plain HTML, CSS, JavaScript — no framework, no build step
- [Chart.js](https://www.chartjs.org/) `4.4.0` — live scrolling charts
- [Three.js](https://threejs.org/) `r160` — 3D phone model on the orientation page
- [GitHub Pages](https://pages.github.com/) — hosting