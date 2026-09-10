(() => {
  'use strict';

  const overview = document.getElementById('overview');
  if (!overview) return;

  const cards = [
    { key: 'fps', title: 'FRAME RATE', subtitle: 'CAN frames received', unit: 'frames/s', min: 0, max: 100, color: '#5798f6' },
    { key: 'load', title: 'BUS LOAD', subtitle: 'Estimated Classical CAN utilization', unit: '%', min: 0, max: 100, color: '#72c66d' },
    { key: 'ids', title: 'ACTIVE IDs', subtitle: 'Standard + Extended streams', unit: 'streams', min: 0, max: 16, color: '#ae83e9' },
    { key: 'raw', title: 'RAW CANDIDATE', subtitle: 'ID 0x201 · byte 1 · unscaled', unit: 'raw', min: 0, max: 255, color: '#4ac6d6' }
  ];

  const readings = document.createElement('div');
  readings.className = 'can-readings';
  readings.innerHTML = cards.map(card => `
    <article class="card can-gauge-card" style="--gauge-accent:${card.color}">
      <div class="can-gauge-title">${card.title}</div>
      <div class="can-gauge-subtitle">${card.subtitle}</div>
      <div class="can-gauge" id="gauge-${card.key}" style="--gauge-value:0">
        <div class="can-gauge-reading"><strong id="reading-${card.key}">0</strong><small>${card.unit}</small></div>
      </div>
      <div class="can-gauge-scale"><span>${card.min}</span><span>${card.max}</span></div>
    </article>`).join('');

  const live = document.createElement('div');
  live.className = 'can-wide-status';
  live.innerHTML = `
    <article class="card can-trend-card">
      <div class="card-head" style="padding:0 0 8px">
        <div><h2>REAL-TIME CAN TREND</h2><small>60 samples ล่าสุด · ค่าดิบที่ยังไม่ทราบหน่วย</small></div>
        <div class="can-legend"><span><i style="background:#5798f6"></i>Frame rate</span><span><i style="background:#ae83e9"></i>Raw candidate</span></div>
      </div>
      <canvas id="can-trend" height="190" aria-label="กราฟ frame rate และ candidate raw value"></canvas>
    </article>
    <article class="card can-session-card" id="can-session-card">
      <div class="can-gauge-title">RECORDING STATUS</div>
      <div class="can-session-value"><span id="session-rows">0</span> <small>แถว</small></div>
      <div class="rx-list">
        <div class="rx-row"><span>นโยบายบันทึก</span><b class="green">EVERY VALID FRAME</b></div>
        <div class="rx-row"><span>CAN IDs</span><b>ALL STD + EXT</b></div>
        <div class="rx-row"><span>ระยะเวลา</span><b id="session-time">00:00:00</b></div>
      </div>
    </article>`;

  const summary = overview.querySelector('.cards');
  overview.insertBefore(readings, summary);
  overview.appendChild(live);

  const intervalCard = document.getElementById('interval')?.closest('.control');
  if (intervalCard) {
    intervalCard.querySelector('h3').textContent = 'นโยบายบันทึก CSV';
    intervalCard.querySelector('.unit').textContent = 'ALL IDs';
    intervalCard.querySelector('p').textContent = 'เก็บทุก valid DATA/RTR frame ตามลำดับที่รับ';
    intervalCard.querySelector('.form-row').innerHTML = '<div class="all-frame-policy">EVERY FRAME · NO SAMPLING</div>';
    intervalCard.querySelector('.hint').textContent = 'ไม่จำกัดเฉพาะ ID ที่มีช่องวิเคราะห์ · database เต็มก็ยังส่งเข้า logger';
  }

  const history = { fps: [], raw: [] };
  let previousFrames = 0;
  let sessionStarted = 0;

  function number(id) {
    return Number((document.getElementById(id)?.textContent || '0').replace(/[^0-9.]/g, '')) || 0;
  }

  function rawCandidate() {
    const firstPayload = document.querySelector('#traffic-rows tr:first-child .payload')?.textContent || '';
    const bytes = firstPayload.trim().split(/\s+/);
    return /^[0-9A-F]{2}$/i.test(bytes[1] || '') ? parseInt(bytes[1], 16) : 0;
  }

  function setGauge(key, value, max, digits = 0) {
    document.getElementById(`gauge-${key}`)?.style.setProperty('--gauge-value', String(Math.max(0, Math.min(100, value / max * 100))));
    const output = document.getElementById(`reading-${key}`);
    if (output) output.textContent = value.toFixed(digits);
  }

  function drawTrend() {
    const canvas = document.getElementById('can-trend');
    if (!canvas) return;
    const ratio = devicePixelRatio || 1;
    const width = Math.max(320, canvas.clientWidth);
    const height = 190;
    if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
      canvas.width = width * ratio;
      canvas.height = height * ratio;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const plot = (values, max, color) => {
      if (values.length < 2) return;
      ctx.beginPath();
      values.forEach((value, index) => {
        const x = index / 59 * width;
        const y = height - 12 - Math.min(1, value / max) * (height - 24);
        if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    plot(history.fps, 100, '#5798f6');
    plot(history.raw, 255, '#ae83e9');
  }

  setInterval(() => {
    const totalFrames = number('frame-count');
    const fps = Math.max(0, totalFrames - previousFrames);
    previousFrames = totalFrames;
    const load = number('bus-load');
    const ids = Number((document.getElementById('stream-count')?.textContent || '0').split('/')[0]) || 0;
    const raw = rawCandidate();
    setGauge('fps', fps, 100);
    setGauge('load', load, 100, 1);
    setGauge('ids', ids, 16);
    setGauge('raw', raw, 255);
    history.fps.push(fps);
    history.raw.push(raw);
    if (history.fps.length > 60) history.fps.shift();
    if (history.raw.length > 60) history.raw.shift();
    drawTrend();
    const rows = number('record-rows');
    document.getElementById('session-rows').textContent = rows.toLocaleString();
    const active = document.getElementById('record-state')?.textContent === 'กำลังเก็บ';
    const sessionCard = document.getElementById('can-session-card');
    sessionCard?.classList.toggle('recording', active);
    if (active && !sessionStarted) sessionStarted = Date.now();
    if (!active) sessionStarted = 0;
    const elapsed = sessionStarted ? Math.floor((Date.now() - sessionStarted) / 1000) : 0;
    const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const m = String(Math.floor(elapsed % 3600 / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    document.getElementById('session-time').textContent = `${h}:${m}:${s}`;
  }, 1000);
})();
