
/* ─── Deep Space Background ─────────────────────────── */
(function () {
  const c = document.getElementById('bgCanvas');
  const ctx = c.getContext('2d');
  let W, H, stars, nodes;

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    buildScene();
  }

  function buildScene() {
    // Stars
    stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.9 + 0.2,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.005,
    }));
    // Neural nodes
    const n = Math.floor((W * H) / 22000);
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.5 + 0.6,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Stars
    stars.forEach(s => {
      s.a += s.da;
      if (s.a > 1 || s.a < 0) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 210, 255, ${s.a * 0.5})`;
      ctx.fill();
    });

    // Neural net
    const maxD = 130;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;

      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,180,220,0.5)';
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxD) {
          const al = (1 - d / maxD) * 0.14;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,212,255,${al})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize(); draw();
})();


/* ─── 3-D Card Tilt on Mouse Move ───────────────────── */
(function () {
  const card = document.getElementById('scannerCard');
  const scene = card.closest('.card-scene');
  if (!scene) return;

  scene.addEventListener('mousemove', e => {
    const rect = scene.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rotY = dx * 6;
    const rotX = -dy * 4;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
    card.style.boxShadow = `
      ${-dx * 18}px ${dy * 12}px 60px rgba(0,0,0,0.7),
      0 0 60px rgba(0,212,255,${0.04 + Math.abs(dx) * 0.04}),
      inset 0 1px 0 rgba(255,255,255,0.05)`;
  });

  scene.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });
})();


/* ─── DOM refs ──────────────────────────────────────── */
const imageInput = document.getElementById('imageInput');
const dropzone = document.getElementById('dropzone');
const dzIdle = document.getElementById('dzIdle');
const dzPreview = document.getElementById('dzPreview');
const previewImg = document.getElementById('previewImg');
const browseBtn = document.getElementById('browseBtn');
const removeImg = document.getElementById('removeImg');
const analyzeBtn = document.getElementById('analyzeBtn');
const scanStatus = document.getElementById('scanStatus');
const scanLine = document.getElementById('scanLine');
const resultCard = document.getElementById('resultCard');
const errorCard = document.getElementById('errorCard');
const errorMsg = document.getElementById('errorMsg');
const resultLabel = document.getElementById('resultLabel');
const resultSub = document.getElementById('resultSub');
const resultIconWrap = document.getElementById('resultIconWrap');
const confBar = document.getElementById('confBar');
const confPct = document.getElementById('confPct');


/* ─── Preview helpers ───────────────────────────────── */
function showPreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    dzIdle.style.display = 'none';
    dzPreview.style.display = 'block';
    analyzeBtn.disabled = false;
  };
  reader.readAsDataURL(file);
  hideCards();
}

function clearPreview() {
  imageInput.value = '';
  previewImg.src = '';
  dzIdle.style.display = 'flex';
  dzPreview.style.display = 'none';
  analyzeBtn.disabled = true;
  setScanStatus('READY', '');
  hideCards();
}

function hideCards() {
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';
  confBar.style.width = '0%';
  scanLine.style.display = 'none';
}

function setScanStatus(text, cls) {
  scanStatus.textContent = text;
  scanStatus.className = 'scan-status' + (cls ? ' ' + cls : '');
}


/* ─── File pick / drag-drop ─────────────────────────── */
dropzone.addEventListener('click', e => {
  if (removeImg.contains(e.target)) return;
  imageInput.click();
});
browseBtn.addEventListener('click', e => { e.stopPropagation(); imageInput.click(); });
removeImg.addEventListener('click', e => { e.stopPropagation(); clearPreview(); });
imageInput.addEventListener('change', () => { if (imageInput.files[0]) showPreview(imageInput.files[0]); });

['dragenter', 'dragover'].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('drag-over'); }));
['dragleave', 'drop'].forEach(ev =>
  dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('drag-over'); }));
dropzone.addEventListener('drop', e => {
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer(); dt.items.add(file);
    imageInput.files = dt.files;
    showPreview(file);
  }
});


/* ─── API Call ──────────────────────────────────────── */
const BACKEND_URL = 'https://hamzameer-brain-tumor-api.hf.space';

document.getElementById('uploadForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!imageInput.files.length) { showError('Please select an MRI image.'); return; }

  // Loading state
  analyzeBtn.querySelector('.btn-text').style.display = 'none';
  analyzeBtn.querySelector('.btn-loader').style.display = 'flex';
  analyzeBtn.disabled = true;
  scanLine.style.display = 'block';
  setScanStatus('SCANNING', 'scanning');
  hideResultCards();

  const formData = new FormData();
  formData.append('file', imageInput.files[0]);

  try {
    const response = await fetch(`${BACKEND_URL}/predict`, { method: 'POST', body: formData });
    let data;
    try { data = await response.json(); } catch { showError('Invalid response from server.'); return; }

    if (response.ok && data && data.prediction) {
      showResult(data.prediction, data.confidence);
    } else if (data && data.detail) {
      showError(data.detail);
    } else {
      showError('Could not classify the image.');
    }
  } catch {
    showError('Unable to reach the backend. Check your connection.');
  } finally {
    analyzeBtn.querySelector('.btn-text').style.display = 'flex';
    analyzeBtn.querySelector('.btn-loader').style.display = 'none';
    analyzeBtn.disabled = false;
    scanLine.style.display = 'none';
  }
});

function hideResultCards() {
  resultCard.style.display = 'none';
  errorCard.style.display = 'none';
}

function showResult(prediction, confidence) {
  // Backend returns exactly 'tumorous' or 'non-tumorous'
  // Do NOT use includes('tumor') — 'non-tumorous' also contains 'tumor'
  const p = prediction.toLowerCase().trim();
  const isTumor = p === 'tumorous' || p === 'yes' || p === 'tumor detected';
  const label = isTumor ? 'Tumor Detected' : 'No Tumor Detected';
  const sublabel = isTumor
    ? 'A brain tumor was identified in this MRI scan.'
    : 'No signs of a brain tumor were found in this MRI scan.';
  const icon = isTumor ? '⚠️' : '✅';
  const cls = isTumor ? 'tumor' : 'no-tumor';

  resultLabel.textContent = label;
  resultLabel.className = 'result-title ' + cls;
  resultSub.textContent = sublabel;
  resultIconWrap.innerHTML = icon;
  resultIconWrap.className = 'result-icon-wrap ' + cls;

  const pct = Math.round((confidence ?? 0) * 100);
  confPct.textContent = pct + '%';
  requestAnimationFrame(() => requestAnimationFrame(() => { confBar.style.width = pct + '%'; }));

  setScanStatus('DONE', isTumor ? 'done-bad' : 'done-ok');
  resultCard.style.display = 'block';
  errorCard.style.display = 'none';
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(msg) {
  setScanStatus('ERROR', 'done-bad');
  errorMsg.textContent = msg;
  errorCard.style.display = 'flex';
  resultCard.style.display = 'none';
}


