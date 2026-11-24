/* Lewis Machiu — portfolio. No dependencies. */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C1 = css('--c1'), C2 = css('--c2'), C3 = css('--c3');

  /* ---------- footer year ---------- */
  $('#yr').textContent = new Date().getFullYear();

  /* ---------- typed role line ---------- */
  const phrases = [
    'f(x) = ForwardDeployedEngineer(x)',
    'founder @ Dukamath',
    'cloud-native retail systems',
    'NLP · computer vision · time-series',
    'trains small models from scratch'
  ];
  const typed = $('#typed');
  if (reduceMotion) {
    typed.textContent = phrases[0];
  } else {
    let p = 0, i = 0, del = false;
    (function tick() {
      const s = phrases[p];
      typed.textContent = s.slice(0, i);
      let wait = del ? 28 : 55;
      if (!del && i === s.length) { del = true; wait = 1600; }
      else if (del && i === 0) { del = false; p = (p + 1) % phrases.length; wait = 350; }
      else i += del ? -1 : 1;
      setTimeout(tick, wait);
    })();
  }

  /* ---------- scroll: reveal, counters, training bar ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(e.target);
  }), { threshold: .15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = to + suf; return; }
    const t0 = performance.now(), dur = 1300;
    (function f(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e) + suf;
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }

  const fill = $('#trainFill'), txt = $('#trainTxt');
  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    const p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
    const loss = 2.35 * Math.exp(-3.4 * p) + 0.04;
    fill.style.width = (p * 100).toFixed(1) + '%';
    txt.textContent = 'epoch ' + String(Math.round(p * 100)).padStart(3, '0') + '/100 · loss ' + loss.toFixed(4);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- copy email ---------- */
  const cm = $('#copyMail');
  cm.addEventListener('click', () => {
    const mail = 'machiulewis@gmail.com';
    const done = () => { cm.textContent = 'copied ✓'; setTimeout(() => cm.textContent = 'copy email', 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(mail).then(done, done); else done();
  });

  /* ---------- canvas helper ---------- */
  function fit(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  /* =========================================================
     1. Background neural network with travelling pulses
     ========================================================= */
  (function network() {
    const canvas = $('#net');
    let ctx, W, H, nodes = [], edges = [], pulses = [];
    const sizes = [5, 8, 9, 8, 4];
    const mouse = { x: -999, y: -999 };

    function build() {
      const f = fit(canvas); ctx = f.ctx; W = f.w; H = f.h;
      nodes = []; edges = [];
      const L = sizes.length, padX = W * .06;
      sizes.forEach((n, li) => {
        const x = padX + (W - 2 * padX) * li / (L - 1);
        for (let j = 0; j < n; j++) {
          const y = H * .12 + (H * .76) * (n === 1 ? .5 : j / (n - 1));
          nodes.push({ x, y, l: li, a: 0, ph: Math.random() * 6.28 });
        }
      });
      const byL = sizes.map((_, li) => nodes.filter(n => n.l === li));
      for (let li = 0; li < L - 1; li++)
        byL[li].forEach(a => byL[li + 1].forEach(b => edges.push({ a, b, w: Math.random() * 2 - 1 })));
    }

    function spawn() {
      if (pulses.length > 40) return;
      const first = edges.filter(e => e.a.l === 0);
      pulses.push({ e: first[(Math.random() * first.length) | 0], t: 0, v: .006 + Math.random() * .006 });
    }

    function frame(ts) {
      ctx.clearRect(0, 0, W, H);
      // edges
      edges.forEach(e => {
        ctx.strokeStyle = e.w > 0 ? 'rgba(94,242,200,' + (.04 + .08 * e.w) + ')' : 'rgba(255,93,143,' + (.04 + .08 * -e.w) + ')';
        ctx.lineWidth = .6 + Math.abs(e.w) * .6;
        ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
      });
      // pulses
      if (!reduceMotion && Math.random() < .12) spawn();
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += p.v;
        const x = p.e.a.x + (p.e.b.x - p.e.a.x) * p.t, y = p.e.a.y + (p.e.b.y - p.e.a.y) * p.t;
        const col = p.e.w > 0 ? C1 : C2;
        ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
        if (p.t >= 1) {
          p.e.b.a = 1;
          pulses.splice(i, 1);
          const next = edges.filter(e => e.a === p.e.b);
          if (next.length) {
            const n = next[(Math.random() * next.length) | 0];
            pulses.push({ e: n, t: 0, v: p.v });
          }
        }
      }
      // nodes
      nodes.forEach(n => {
        n.a *= .95;
        const dx = n.x - mouse.x, dy = n.y - mouse.y, near = Math.max(0, 1 - Math.hypot(dx, dy) / 160);
        const glow = Math.max(n.a, near);
        ctx.fillStyle = 'rgba(10,14,24,1)';
        ctx.strokeStyle = glow > .05 ? C1 : 'rgba(140,170,220,.45)';
        ctx.lineWidth = 1.3;
        ctx.shadowColor = C1; ctx.shadowBlur = glow * 18;
        ctx.beginPath(); ctx.arc(n.x, n.y, 5 + glow * 3, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
      });
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    build();
    addEventListener('resize', build);
    addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    requestAnimationFrame(frame);
  })();

  /* =========================================================
     2. Activation function playground
     ========================================================= */
  const sig = x => 1 / (1 + Math.exp(-x));
  const ACTS = {
    sigmoid: {
      label: 'Sigmoid', f: sig,
      tex: 'σ(x) = 1 / (1 + e⁻ˣ)',
      note: 'Squashes any input into (0, 1), so the output reads as a probability. Gradients vanish at the tails, which is why it has mostly retreated to output layers.'
    },
    tanh: {
      label: 'tanh', f: Math.tanh,
      tex: 'tanh(x) = (eˣ − e⁻ˣ) / (eˣ + e⁻ˣ)',
      note: 'Zero-centred cousin of sigmoid, bounded in (−1, 1). Still saturates, but the centred output makes optimisation friendlier. Common inside recurrent cells.'
    },
    relu: {
      label: 'ReLU', f: x => Math.max(0, x),
      tex: 'ReLU(x) = max(0, x)',
      note: 'Cheap, sparse and non-saturating for x > 0. The default workhorse of deep nets. The catch: a neuron stuck below zero gets zero gradient ("dying ReLU").'
    },
    leaky: {
      label: 'Leaky ReLU', f: x => x > 0 ? x : 0.1 * x,
      tex: 'LeakyReLU(x) = x if x > 0 else 0.1·x',
      note: 'Keeps a small slope for negative inputs so the gradient never fully dies. A tiny change that fixes ReLU\'s biggest weakness. (Slope exaggerated to 0.1 here so you can see it.)'
    },
    gelu: {
      label: 'GELU', f: x => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3))),
      tex: 'GELU(x) ≈ ½x(1 + tanh[√(2/π)(x + 0.044715x³)])',
      note: 'A smooth, probabilistic gate: scale x by the chance a Gaussian is below it. The standard choice in transformer language models. Shown with the tanh approximation.'
    },
    swish: {
      label: 'Swish', f: x => x * sig(x),
      tex: 'swish(x) = x · σ(x)',
      note: 'Smooth and slightly non-monotonic: it dips below zero before climbing. Self-gated, like GELU, and often a drop-in replacement for ReLU.'
    },
    softplus: {
      label: 'Softplus', f: x => Math.log(1 + Math.exp(x)),
      tex: 'softplus(x) = ln(1 + eˣ)',
      note: 'A smooth approximation of ReLU whose derivative is exactly the sigmoid. Useful whenever you need a strictly positive output, like a variance.'
    }
  };
  const deriv = (f, x) => { const h = 1e-4; return (f(x + h) - f(x - h)) / (2 * h); };

  (function playground() {
    const tabs = $('#actTabs'), canvas = $('#actCanvas');
    const slider = $('#xSlider'), xVal = $('#xVal'), fOut = $('#fOut'), dOut = $('#dOut');
    let cur = 'sigmoid', ctx, W, H;

    Object.keys(ACTS).forEach(k => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = ACTS[k].label; b.dataset.k = k;
      b.setAttribute('role', 'tab');
      b.addEventListener('click', () => { cur = k; draw(); });
      tabs.appendChild(b);
    });

    const XR = [-4, 4], YR = [-1.5, 3.5];

    function draw() {
      const f = fit(canvas); ctx = f.ctx; W = f.w; H = f.h;
      const a = ACTS[cur], x = +slider.value;
      tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === cur));
      $('#actFormula').textContent = a.tex;
      $('#actNote').textContent = a.note;
      const fx = a.f(x), dx = deriv(a.f, x);
      xVal.textContent = x.toFixed(2);
      fOut.textContent = fx.toFixed(4);
      dOut.textContent = dx.toFixed(4);

      const px = v => (v - XR[0]) / (XR[1] - XR[0]) * W;
      const py = v => H - (v - YR[0]) / (YR[1] - YR[0]) * H;

      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.lineWidth = 1; ctx.font = '10px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(139,151,176,.7)';
      for (let v = Math.ceil(XR[0]); v <= XR[1]; v++) {
        ctx.strokeStyle = v === 0 ? 'rgba(200,215,240,.5)' : 'rgba(140,170,220,.1)';
        ctx.beginPath(); ctx.moveTo(px(v), 0); ctx.lineTo(px(v), H); ctx.stroke();
        if (v) ctx.fillText(v, px(v) + 3, py(0) - 4);
      }
      for (let v = Math.ceil(YR[0]); v <= YR[1]; v++) {
        ctx.strokeStyle = v === 0 ? 'rgba(200,215,240,.5)' : 'rgba(140,170,220,.1)';
        ctx.beginPath(); ctx.moveTo(0, py(v)); ctx.lineTo(W, py(v)); ctx.stroke();
        if (v) ctx.fillText(v, px(0) + 4, py(v) - 3);
      }
      // curves
      const curve = (fn, col, dash, lw) => {
        ctx.beginPath(); ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = lw;
        for (let i = 0; i <= 400; i++) {
          const xv = XR[0] + (XR[1] - XR[0]) * i / 400, yv = fn(xv);
          i ? ctx.lineTo(px(xv), py(yv)) : ctx.moveTo(px(xv), py(yv));
        }
        ctx.stroke(); ctx.setLineDash([]);
      };
      ctx.shadowColor = C2; ctx.shadowBlur = 6;
      curve(v => deriv(a.f, v), C2, [6, 5], 2);
      ctx.shadowColor = C1; ctx.shadowBlur = 12;
      curve(a.f, C1, [], 3);
      ctx.shadowBlur = 0;

      // marker: tangent line + guides
      ctx.strokeStyle = 'rgba(255,200,87,.4)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px(x), 0); ctx.lineTo(px(x), H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, py(fx)); ctx.lineTo(W, py(fx)); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C3; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px(x - .9), py(fx - .9 * dx)); ctx.lineTo(px(x + .9), py(fx + .9 * dx)); ctx.stroke();
      ctx.fillStyle = C1; ctx.strokeStyle = '#06080f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px(x), py(fx), 6.5, 0, 6.283); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C2;
      ctx.beginPath(); ctx.arc(px(x), py(dx), 5, 0, 6.283); ctx.fill(); ctx.stroke();
    }
    slider.addEventListener('input', draw);
    addEventListener('resize', draw);
    draw();
  })();

  /* =========================================================
     3. Gradient descent on a non-convex loss
     ========================================================= */
  (function gradientDescent() {
    const canvas = $('#gdCanvas');
    const lr = $('#lr'), lrVal = $('#lrVal'), mom = $('#mom');
    const L = w => 0.05 * w ** 4 - 0.5 * w * w + 0.3 * w + 2;
    const dL = w => 0.2 * w ** 3 - w + 0.3;
    const XR = [-4.6, 4.6], YR = [-1.2, 12];
    let ctx, W, H, w = 3.5, v = 0, step = 0, trail = [], settled = false, last = 0;

    function reset(at) {
      w = at === undefined ? 3.5 : at; v = 0; step = 0; trail = [w]; settled = false;
    }
    const px = x => (x - XR[0]) / (XR[1] - XR[0]) * W;
    const py = y => H - 24 - (y - YR[0]) / (YR[1] - YR[0]) * (H - 40);

    function size() { const f = fit(canvas); ctx = f.ctx; W = f.w; H = f.h; }

    function update() {
      const eta = +lr.value, g = dL(w);
      if (mom.checked) { v = 0.9 * v - eta * g; w += v; } else { w -= eta * g; }
      if (!isFinite(w) || Math.abs(w) > 6) { w = Math.max(-6, Math.min(6, w || 0)); v = 0; }
      step++; trail.push(w); if (trail.length > 90) trail.shift();
      settled = Math.abs(g) < 1e-3 && Math.abs(v) < 1e-3;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // filled area under curve
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(255,93,143,.22)'); grad.addColorStop(1, 'rgba(94,242,200,.02)');
      ctx.beginPath(); ctx.moveTo(px(XR[0]), H);
      for (let i = 0; i <= 300; i++) { const x = XR[0] + (XR[1] - XR[0]) * i / 300; ctx.lineTo(px(x), py(L(x))); }
      ctx.lineTo(px(XR[1]), H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
      // curve
      ctx.beginPath(); ctx.strokeStyle = C1; ctx.lineWidth = 2.6; ctx.shadowColor = C1; ctx.shadowBlur = 10;
      for (let i = 0; i <= 300; i++) { const x = XR[0] + (XR[1] - XR[0]) * i / 300; i ? ctx.lineTo(px(x), py(L(x))) : ctx.moveTo(px(x), py(L(x))); }
      ctx.stroke(); ctx.shadowBlur = 0;
      // axis labels
      ctx.fillStyle = 'rgba(139,151,176,.8)'; ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillText('L(w)', 12, 18); ctx.fillText('w →', W - 40, H - 8);
      // minima hints
      [[-2.3, 'global min'], [2.2, 'local min']].forEach(([x, t]) => {
        ctx.fillStyle = 'rgba(255,200,87,.7)'; ctx.fillText(t, px(x) - 26, py(L(x)) + 22);
      });
      // trail
      trail.forEach((t, i) => {
        ctx.fillStyle = 'rgba(255,200,87,' + (i / trail.length * .6) + ')';
        ctx.beginPath(); ctx.arc(px(t), py(L(t)), 2 + i / trail.length * 2, 0, 6.283); ctx.fill();
      });
      // tangent + ball
      const g = dL(w), x0 = px(w), y0 = py(L(w)), dx = 50;
      const sx = px(1) - px(0), sy = (py(1) - py(0)) / ((YR[1] - YR[0]) ? 1 : 1);
      const slopePx = -g * ((H - 40) / (YR[1] - YR[0])) / ((W) / (XR[1] - XR[0]));
      ctx.strokeStyle = C2; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x0 - dx, y0 - dx * slopePx); ctx.lineTo(x0 + dx, y0 + dx * slopePx); ctx.stroke();
      ctx.fillStyle = C3; ctx.shadowColor = C3; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(x0, y0, 8, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;

      lrVal.textContent = (+lr.value).toFixed(3);
      $('#gdStep').textContent = step;
      $('#gdW').textContent = w.toFixed(3);
      $('#gdL').textContent = L(w).toFixed(3);
    }

    function loop(ts) {
      if (!reduceMotion && ts - last > 55 && !settled) { last = ts; update(); }
      draw(); requestAnimationFrame(loop);
    }

    canvas.addEventListener('click', e => {
      const r = canvas.getBoundingClientRect();
      const x = XR[0] + (e.clientX - r.left) / r.width * (XR[1] - XR[0]);
      reset(x);
    });
    $('#gdReset').addEventListener('click', () => reset());
    lr.addEventListener('input', () => { settled = false; });
    mom.addEventListener('change', () => { v = 0; settled = false; });
    addEventListener('resize', size);
    size(); reset();
    if (reduceMotion) { for (let i = 0; i < 120; i++) update(); }
    requestAnimationFrame(loop);
  })();
})();
