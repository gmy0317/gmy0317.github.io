// ===== Utility: Clock =====
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,'0');
  const d = String(now.getDate()).padStart(2,'0');
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  el.textContent = `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
setInterval(updateClock, 1000);
updateClock();

// ===== LiveChart: realistic time-series on Canvas (no external libs) =====
class LiveChart {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({
      seconds: 90,         // time window (s)
      fps: 20,             // animation frame rate
      min: 0,
      max: 100,
      color: 'rgba(160,200,255,0.9)',
      fill: 'rgba(160,200,255,0.12)',
      labelEl: null,
      gen: () => 0,        // data generator -> value
      units: '',
    }, opts || {});
    this.data = [];        // {t, v}
    this.t0 = Date.now()/1000;
    this.lastFrame = 0;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loop(ts) {
    if (ts - this.lastFrame >= 1000/this.opts.fps) {
      this.lastFrame = ts;
      // Push new sample each frame
      const t = Date.now()/1000;
      let v = this.opts.gen(t);
      // clamp
      v = Math.max(this.opts.min, Math.min(this.opts.max, v));
      this.data.push({t, v});
      // Keep window
      const cutoff = t - this.opts.seconds;
      while (this.data.length && this.data[0].t < cutoff) this.data.shift();

      // Draw
      this.draw();
      if (this.opts.labelEl) {
        this.opts.labelEl.textContent = `${this.data[this.data.length-1].v.toFixed(2)} ${this.opts.units}`;
      }
    }
    requestAnimationFrame(this.loop);
  }

  draw() {
    const {canvas, ctx, opts} = this;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
    }
    ctx.clearRect(0,0,w,h);

    // Padding for axes
    const padL = 40;
    const padR = 10;
    const padT = 10;
    const padB = 20;

    // Plot area
    const x0 = padL, y0 = padT;
    const x1 = w - padR, y1 = h - padB;
    const pw = x1 - x0, ph = y1 - y0;

    // Background and border
    ctx.fillStyle = 'rgba(8,14,24,0.9)';
    ctx.fillRect(x0, y0, pw, ph);
    ctx.strokeStyle = 'rgba(120,150,190,0.25)';
    ctx.strokeRect(x0+0.5, y0+0.5, pw-1, ph-1);

    // Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(120,150,190,0.2)';
    const ySteps = 4;
    for (let i=0;i<=ySteps;i++) {
      const y = y0 + (ph*i/ySteps);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      // y labels
      const v = opts.max - (opts.max-opts.min)*i/ySteps;
      ctx.fillStyle = 'rgba(200,220,255,0.6)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(v.toFixed(0), x0-6, y+4);
    }

    // Time axis (last N seconds to now)
    const now = Date.now()/1000;
    const tMin = now - opts.seconds;
    const xTicks = 5;
    for (let i=0;i<=xTicks;i++) {
      const tx = tMin + (opts.seconds*i/xTicks);
      const x = x0 + (tx - tMin) / opts.seconds * pw;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y1+4); ctx.stroke();
      const dt = new Date(tx*1000);
      const hh = String(dt.getHours()).padStart(2,'0');
      const mm = String(dt.getMinutes()).padStart(2,'0');
      const ss = String(dt.getSeconds()).padStart(2,'0');
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(200,220,255,0.6)';
      ctx.fillText(`${hh}:${mm}:${ss}`, x, h-4);
    }

    // Line path
    if (this.data.length >= 2) {
      ctx.beginPath();
      for (let i=0;i<this.data.length;i++) {
        const {t, v} = this.data[i];
        const x = x0 + (t - tMin) / opts.seconds * pw;
        const y = y1 - (v - opts.min) / (opts.max - opts.min) * ph;
        if (i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      // Stroke
      ctx.lineWidth = 2;
      ctx.strokeStyle = opts.color;
      ctx.stroke();
      // Fill under curve
      const last = this.data[this.data.length-1];
      ctx.lineTo(x0 + (last.t - tMin)/opts.seconds*pw, y1);
      ctx.lineTo(x0 + (this.data[0].t - tMin)/opts.seconds*pw, y1);
      ctx.closePath();
      ctx.fillStyle = opts.fill;
      ctx.fill();
    }
  }
}

// ===== realistic signal generators =====
function makeSineGen({base=0, amp=1, freq=0.05, noise=0.02, trend=0}) {
  const phase = Math.random()*Math.PI*2;
  return (t) => {
    const s = base + amp * Math.sin(2*Math.PI*freq*t + phase) + trend*(t%1000)/1000;
    const n = (Math.random()*2-1) * noise * amp;
    return s + n;
  };
}

function makeClampedGen({min, max, drift=0.0, jitter=0.2}) {
  // bounded random walk within [min, max]
  let v = (min+max)/2;
  return (t) => {
    v += (Math.random()*2-1)*jitter + drift;
    if (v < min) v = min + (min - v)*0.2;
    if (v > max) v = max - (v - max)*0.2;
    return v;
  };
}

// ===== init charts =====
window.addEventListener('DOMContentLoaded', () => {
  const mk = (id) => document.getElementById(id);

  // Vibration (mm/s)
  new LiveChart(mk('chart-vib'), {
    seconds: 120, min: 0, max: 10,
    color: 'rgba(150, 200, 255, 0.95)',
    fill:  'rgba(120, 170, 255, 0.15)',
    units: 'mm/s',
    labelEl: mk('val-vib'),
    gen: makeSineGen({base: 4.2, amp: 1.8, freq: 0.01, noise: 0.08})
  });

  // Temperature (°C)
  new LiveChart(mk('chart-temp'), {
    seconds: 120, min: 20, max: 90,
    color: 'rgba(255, 210, 140, 0.95)',
    fill:  'rgba(255, 210, 140, 0.14)',
    units: '°C',
    labelEl: mk('val-temp'),
    gen: makeSineGen({base: 55, amp: 7, freq: 0.006, noise: 0.06, trend: 0.002})
  });

  // Current (A)
  new LiveChart(mk('chart-cur'), {
    seconds: 120, min: 0, max: 80,
    color: 'rgba(160, 255, 200, 0.95)',
    fill:  'rgba(100, 240, 180, 0.12)',
    units: 'A',
    labelEl: mk('val-cur'),
    gen: makeSineGen({base: 38, amp: 16, freq: 0.012, noise: 0.1})
  });

  // Voltage (V)
  new LiveChart(mk('chart-volt'), {
    seconds: 120, min: 350, max: 420,
    color: 'rgba(180, 200, 255, 0.95)',
    fill:  'rgba(130, 160, 255, 0.12)',
    units: 'V',
    labelEl: mk('val-volt'),
    gen: makeClampedGen({min: 370, max: 410, drift: 0, jitter: 1.2})
  });

  // Humidity (%RH)
  new LiveChart(mk('chart-hum'), {
    seconds: 120, min: 20, max: 90,
    color: 'rgba(130, 220, 255, 0.95)',
    fill:  'rgba(120, 200, 255, 0.12)',
    units: '%RH',
    labelEl: mk('val-hum'),
    gen: makeClampedGen({min: 35, max: 65, drift: 0.01, jitter: 0.4})
  });

  // Spindle Speed (RPM)
  new LiveChart(mk('chart-rpm'), {
    seconds: 120, min: 0, max: 12000,
    color: 'rgba(255, 170, 200, 0.95)',
    fill:  'rgba(255, 130, 180, 0.12)',
    units: 'RPM',
    labelEl: mk('val-rpm'),
    gen: makeSineGen({base: 7600, amp: 1200, freq: 0.008, noise: 0.03})
  });

  // Toggle darken mode for iframe
  const wrapper = document.getElementById('difyWrapper');
  const toggle = document.getElementById('toggleMode');
  if (wrapper && toggle) {
    toggle.addEventListener('click', () => {
      if (wrapper.classList.contains('filter-darken')) {
        wrapper.classList.remove('filter-darken');
        wrapper.classList.add('overlay-darken');
        toggle.textContent = '切换为颜色反转';
      } else {
        wrapper.classList.remove('overlay-darken');
        wrapper.classList.add('filter-darken');
        toggle.textContent = '切换为遮罩模式';
      }
    });
  }

  // Shortcut buttons: load iframe URLs
  const iframe = document.getElementById('assistant-iframe');
  const title  = document.getElementById('assistant-title');
  const btnAsk = document.getElementById('btn-ask');
  const btnLog = document.getElementById('btn-log');

  if (btnAsk) btnAsk.addEventListener('click', (e) => {
    e.preventDefault();
    iframe.src = 'https://udify.app/chat/LnwnQ3e2yGRQdc1Z';
    title.textContent = 'Agent Assistant（Dify）— Ask maintenance';
    document.getElementById('assistant').scrollIntoView({behavior:'smooth'});
  });

  if (btnLog) btnLog.addEventListener('click', (e) => {
    e.preventDefault();
    iframe.src = 'https://udify.app/chatbot/CqHQ4RmaDJ8o1s5D';
    title.textContent = 'Agent Assistant（Dify）— Log repair';
    document.getElementById('assistant').scrollIntoView({behavior:'smooth'});
  });
});
