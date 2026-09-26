/*
 * Domain visuals — one metaphor per subject, shared grammar (core.js).
 * Mount: <div data-liorta-visual="domain" data-mode="periodic|clinical|evidence|data|quality|ecosystem">
 * Labels come from LIORTA_BRAND.content.domains; no brand names are held here.
 * These illustrate the subject (regulatory convention, generic evidence and
 * quality concepts); none depicts a Liorta processing mechanism or sequence.
 */
(function () {
  "use strict";
  var V = window.LiortaVisuals;
  var TAU = Math.PI * 2;

  function base(root) {
    var canvas = V.el("canvas", "lx-canvas", root);
    canvas.setAttribute("aria-hidden", "true");
    var ov = V.el("div", "lx-overlay", root);
    return { canvas: canvas, ov: ov };
  }

  function label(ov, text, cls) {
    var el = V.el("div", "dv-label" + (cls ? " " + cls : ""), ov, text);
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  function place(el, x, y) {
    el.style.left = x.toFixed(1) + "px";
    el.style.top = y.toFixed(1) + "px";
  }

  var modes = {};

  /* ---------- Regulatory & Safety: the periodic reporting lineage ---------- */
  modes.periodic = function (root, D, light) {
    var b = base(root);
    var rand = V.rng(5);
    var time = 0;
    var lay = {};
    var parts = [];
    var partT = 0;
    var dom = {};
    var docs = D.docs && D.docs.length ? D.docs : [""];
    var srcs = D.sources || [];
    var P = 7; // seconds per reporting period
    var SLOTS = 4; // three prior reports + the current period

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 640;
      lay.axisY = S.h * 0.8;
      lay.x0 = S.w * (lay.mob ? 0.06 : 0.1);
      lay.x1 = S.w * (lay.mob ? 0.94 : 0.9);
      lay.slotW = (lay.x1 - lay.x0) / SLOTS;
      lay.srcY = S.h * 0.12;
      lay.winTop = S.h * 0.34;
      b.ov.innerHTML = "";
      dom.src = srcs.map(function (s) {
        return label(b.ov, s[1], "dv-label--src");
      });
      dom.rep = [];
      for (var k = 0; k < SLOTS; k++) dom.rep.push(label(b.ov, "", "dv-label--rep"));
      dom.cycle = label(b.ov, D.cycle || "", "dv-label--axis");
      dom.locks = [];
      for (var j = 0; j < SLOTS; j++) dom.locks.push(label(b.ov, D.lock || "", "dv-label--axis dv-label--faint"));
      dom.reuse = label(b.ov, D.reuse || "", "dv-label--note");
    }

    function slotX(k) {
      return lay.x0 + lay.slotW * (k + 0.5);
    }

    function step(dt) {
      time += dt;
      partT -= dt;
      if (partT <= 0 && srcs.length) {
        partT = lay.mob ? 0.32 : 0.16;
        parts.push({ s: Math.floor(rand() * srcs.length), t0: time, dur: 1.5 + rand() * 0.8, jx: rand(), jy: rand() });
      }
      parts = parts.filter(function (p) {
        return time - p.t0 < p.dur;
      });
    }

    function draw() {
      var ctx = S.ctx;
      ctx.clearRect(0, 0, lay.w, lay.h);
      var phase = (time % P) / P;
      var cycle = Math.floor(time / P);
      var shift = V.ease(V.clamp(phase / 0.14, 0, 1));
      var type = docs[Math.floor(cycle / SLOTS) % docs.length];
      var cur = slotX(SLOTS - 1);
      var wl = cur - lay.slotW * 0.42;
      var wr = cur + lay.slotW * 0.42;
      var repY = lay.axisY - 70;

      ctx.strokeStyle = V.edge(0.35, light);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lay.x0, lay.axisY);
      ctx.lineTo(lay.x1, lay.axisY);
      ctx.stroke();
      for (var k = 0; k < SLOTS; k++) {
        var lx = lay.x0 + lay.slotW * (k + 1);
        ctx.fillStyle = V.rgba("blue", 0.9);
        ctx.beginPath();
        ctx.arc(lx, lay.axisY, 4, 0, TAU);
        ctx.fill();
        place(dom.locks[k], lx, lay.axisY + 14);
        dom.locks[k].style.opacity = lay.mob && k !== SLOTS - 1 ? "0" : "1";
      }

      var wg = ctx.createLinearGradient(0, lay.winTop, 0, lay.axisY);
      wg.addColorStop(0, V.rgba("cyan", 0));
      wg.addColorStop(1, V.rgba("cyan", light ? 0.1 : 0.14));
      ctx.fillStyle = wg;
      V.roundRect(ctx, wl, lay.winTop, wr - wl, lay.axisY - lay.winTop - 6, 14);
      ctx.fill();
      ctx.strokeStyle = V.rgba("cyan", 0.35);
      ctx.setLineDash([4, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      place(dom.cycle, cur, lay.axisY + 32);

      var n = srcs.length;
      var sx0 = lay.mob ? lay.x0 + 20 : lay.x0 + lay.slotW * 0.4;
      var sx1 = lay.mob ? lay.x1 - 20 : cur + lay.slotW * 0.2;
      srcs.forEach(function (s, i) {
        var x = V.lerp(sx0, sx1, n > 1 ? i / (n - 1) : 0.5);
        s.x = x;
        ctx.strokeStyle = V.edge(0.14, light);
        ctx.beginPath();
        ctx.moveTo(x, lay.srcY + 22);
        ctx.bezierCurveTo(x, lay.winTop, cur, lay.srcY + 60, cur, lay.winTop + 20);
        ctx.stroke();
        V.glyph(ctx, s[0], x, lay.srcY, lay.mob ? 24 : 30, 1, !light);
        place(dom.src[i], x, lay.srcY + (lay.mob ? 18 : 22));
      });
      parts.forEach(function (p) {
        var s = srcs[p.s];
        var u = V.ease((time - p.t0) / p.dur);
        var pt = V.bez({ x: s.x, y: lay.srcY + 22 }, { x: s.x, y: lay.winTop }, { x: cur, y: lay.srcY + 60 }, { x: V.lerp(wl + 20, wr - 20, p.jx), y: V.lerp(lay.winTop + 30, lay.axisY - 30, p.jy) }, u);
        V.glow(ctx, pt.x, pt.y, 8, 0.5 * Math.sin(Math.PI * u));
        V.particle(ctx, pt.x, pt.y, Math.sin(Math.PI * u), light);
      });

      var lockU = V.smooth(0.8, 0.97, phase);
      var grow = V.smooth(0.12, 0.8, phase);
      var cols = 6;
      var rows = 4;
      var count = Math.floor(grow * cols * rows);
      var cw = (wr - wl - 40) / cols;
      var ch = (lay.axisY - lay.winTop - 60) / rows;
      for (var q = 0; q < count; q++) {
        var gx = wl + 20 + (q % cols) * cw + cw / 2;
        var gy = lay.axisY - 30 - Math.floor(q / cols) * ch - ch / 2;
        var cx = V.lerp(gx, cur, lockU);
        var cy = V.lerp(gy, repY, lockU);
        V.glyph(ctx, srcs.length ? srcs[q % srcs.length][0] : "doc", cx, cy, Math.min(cw, ch) * 0.75, 0.85 * (1 - lockU * 0.9), !light);
      }
      if (lockU > 0) {
        V.glow(ctx, cur, repY, 70, 0.4 * lockU);
        V.glyph(ctx, "dsur", cur, repY, V.lerp(20, 58, lockU), lockU, !light);
      }

      for (var r = 0; r < SLOTS; r++) {
        var slot = SLOTS - 2 - r + (1 - shift);
        if (slot < -0.6) continue;
        var x = slotX(slot);
        var a = V.clamp(slot + 0.6, 0, 1);
        V.glow(ctx, x, repY, 44, 0.18 * a);
        V.glyph(ctx, "dsur", x, repY, 58, a, !light);
        var nx = slotX(slot + 1);
        if (slot + 1 <= SLOTS - 1) {
          ctx.strokeStyle = V.rgba("teal", 0.5 * a);
          ctx.lineWidth = 1.3;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(x + 22, repY - 26);
          ctx.quadraticCurveTo((x + nx) / 2, repY - 80, nx - 22, repY - 26);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        var el = dom.rep[r];
        if (el) {
          el.textContent = type;
          place(el, x, repY + 36);
          el.style.opacity = a.toFixed(2);
        }
      }
      var lastX = slotX(SLOTS - 2);
      place(dom.reuse, (lastX + cur) / 2, repY - 106);
      dom.reuse.style.opacity = lay.mob ? "0" : "1";
    }

    var S = V.canvas(b.canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) {
        time = P * 0.6;
        runner.redraw();
      }
    });
    var runner = V.run(root, step, draw, 200);
  };

  /* ---------- Clinical: many kinds of clinical evidence converging into one document ---------- */
  modes.clinical = function (root, D, light) {
    var b = base(root);
    var rand = V.rng(9);
    var time = 0;
    var lay = {};
    var flows = [];
    var flowT = 0;
    var dom = {};
    var sections = 7;

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 640;
      lay.docW = lay.mob ? S.w * 0.46 : Math.min(260, S.w * 0.24);
      lay.docH = lay.docW * 1.3;
      lay.doc = { x: lay.mob ? S.w * 0.5 : S.w * 0.7, y: lay.mob ? S.h * 0.66 : S.h * 0.5 };
      b.ov.innerHTML = "";
      dom.src = (D.sources || []).map(function (s) {
        return label(b.ov, s[1], lay.mob ? "dv-label--src" : "dv-label--src dv-label--beside");
      });
      dom.doc = label(b.ov, D.doc || "", "dv-label--doc");
      dom.review = V.el("div", "pf-human", b.ov);
      dom.review.innerHTML = V.reviewSVG;
      V.el("span", null, dom.review, D.review || "");
      dom.review.setAttribute("aria-hidden", "true");
    }

    function srcPos(i) {
      var n = (D.sources || []).length;
      if (lay.mob) return { x: V.lerp(40, lay.w - 40, (i % 3) / 2), y: 34 + Math.floor(i / 3) * 74 };
      return { x: lay.w * 0.1, y: lay.h * (0.12 + (0.76 * i) / Math.max(1, n - 1)) };
    }

    function step(dt) {
      time += dt;
      flowT -= dt;
      if (flowT <= 0) {
        flowT = lay.mob ? 0.7 : 0.45;
        flows.push({ s: Math.floor(rand() * (D.sources || [1]).length), t0: time, sec: Math.floor(rand() * sections) });
      }
      flows = flows.filter(function (f) {
        return time - f.t0 < 2.4;
      });
    }

    function draw() {
      var ctx = S.ctx;
      ctx.clearRect(0, 0, lay.w, lay.h);
      var d = lay.doc;
      var x0 = d.x - lay.docW / 2;
      var y0 = d.y - lay.docH / 2;
      var fill = (time % 10) / 10; // the document assembles, then refreshes
      V.glow(ctx, d.x, d.y, lay.docW * 1.1, 0.14);
      // source evidence
      (D.sources || []).forEach(function (s, i) {
        var p = srcPos(i);
        V.glyph(ctx, s[0], p.x, p.y, lay.mob ? 30 : 38, 1, !light);
        if (lay.mob) place(dom.src[i], p.x, p.y + 26);
        else place(dom.src[i], p.x + 28, p.y);
        var sy = y0 + lay.docH * (0.18 + 0.72 * (i / Math.max(1, (D.sources || []).length - 1)));
        ctx.strokeStyle = V.edge(0.16, light);
        ctx.lineWidth = 1;
        ctx.beginPath();
        var sx0 = lay.mob ? p.x : p.x + 190;
        ctx.moveTo(sx0, p.y);
        ctx.bezierCurveTo(V.lerp(sx0, x0, 0.5), p.y, V.lerp(sx0, x0, 0.5), sy, x0, sy);
        ctx.stroke();
      });
      // the document page and its sections
      ctx.save();
      V.roundRect(ctx, x0, y0, lay.docW, lay.docH, 10);
      ctx.fillStyle = light ? "#ffffff" : "rgba(16,66,98,0.92)";
      ctx.shadowColor = "rgba(0,60,90,0.25)";
      ctx.shadowBlur = 30;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = V.rgba("cyan", 0.5);
      ctx.lineWidth = 1;
      V.roundRect(ctx, x0, y0, lay.docW, lay.docH, 10);
      ctx.stroke();
      var pad = lay.docW * 0.1;
      ctx.fillStyle = V.C.blue;
      ctx.fillRect(x0 + pad, y0 + pad, lay.docW * 0.45, 6);
      var rowH = (lay.docH - pad * 3) / sections;
      for (var sec = 0; sec < sections; sec++) {
        var ry = y0 + pad * 2 + sec * rowH;
        var done = V.smooth(sec / sections, (sec + 1) / sections, fill * 1.15);
        ctx.fillStyle = light ? "rgba(8,152,208,0.12)" : "rgba(160,230,245,0.14)";
        ctx.fillRect(x0 + pad, ry, lay.docW - pad * 2, rowH * 0.28);
        ctx.fillStyle = V.rgba("cyan", 0.85);
        ctx.fillRect(x0 + pad, ry, (lay.docW - pad * 2) * done, rowH * 0.28);
        ctx.fillStyle = light ? "rgba(74,90,102,0.18)" : "rgba(190,230,245,0.18)";
        for (var ln = 0; ln < 2; ln++) ctx.fillRect(x0 + pad, ry + rowH * (0.45 + ln * 0.2), (lay.docW - pad * 2) * (0.9 - ln * 0.25) * done, 3);
      }
      // evidence flowing to its section
      flows.forEach(function (f) {
        var p = srcPos(f.s);
        var u = (time - f.t0) / 2.4;
        var ty = y0 + pad * 2 + f.sec * rowH + rowH * 0.14;
        var fx0 = lay.mob ? p.x : p.x + 190;
        var pt = V.bez({ x: fx0, y: p.y }, { x: V.lerp(fx0, x0, 0.5), y: p.y }, { x: V.lerp(fx0, x0, 0.5), y: ty }, { x: x0 + pad, y: ty }, V.ease(u));
        V.particle(ctx, pt.x, pt.y, Math.sin(Math.PI * u), light);
        if (u > 0.9) V.glow(ctx, x0 + pad, ty, 14, 0.6 * (1 - u) * 10);
      });
      place(dom.doc, d.x, y0 - 22);
      var rv = { x: d.x, y: y0 + lay.docH + 28 };
      place(dom.review, rv.x, rv.y);
      dom.review.classList.toggle("is-lit", fill > 0.85);
    }

    var S = V.canvas(b.canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    var runner = V.run(root, step, draw, 260);
  };

  /* ---------- Medical & scientific evidence: a literature field becomes connected knowledge ---------- */
  modes.evidence = function (root, D, light) {
    var b = base(root);
    var rand = V.rng(17);
    var time = 0;
    var lay = {};
    var pubs = [];
    var dom = {};
    var themes = D.themes || [];

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 640;
      var n = lay.mob ? 70 : 140;
      pubs = [];
      for (var i = 0; i < n; i++) pubs.push({ x: rand(), y: rand(), th: i % Math.max(1, themes.length), jx: rand(), jy: rand(), ph: rand() * TAU });
      lay.centers = themes.map(function (t, i) {
        var a = -Math.PI / 2 + (i / themes.length) * TAU;
        return { x: S.w / 2 + Math.cos(a) * S.w * (lay.mob ? 0.3 : 0.28), y: S.h / 2 + Math.sin(a) * S.h * 0.32 };
      });
      b.ov.innerHTML = "";
      dom.themes = themes.map(function (t) {
        return label(b.ov, t, "dv-label--theme");
      });
      dom.q = label(b.ov, D.question || "", "dv-label--q");
    }

    function step(dt) {
      time += dt;
    }

    function draw() {
      var ctx = S.ctx;
      ctx.clearRect(0, 0, lay.w, lay.h);
      var cyc = (time % 14) / 14;
      var org = V.smooth(0.08, 0.4, cyc) * (1 - V.smooth(0.85, 1, cyc)); // scattered → organized → release
      var cx = lay.w / 2;
      var cy = lay.h / 2;
      var pos = pubs.map(function (p) {
        var c = lay.centers[p.th] || { x: cx, y: cy };
        var sx = p.x * lay.w;
        var sy = p.y * lay.h;
        var ox = c.x + (p.jx - 0.5) * lay.w * 0.12;
        var oy = c.y + (p.jy - 0.5) * lay.h * 0.16;
        return {
          x: V.lerp(sx, ox, org) + Math.sin(time * 0.4 + p.ph) * 4,
          y: V.lerp(sy, oy, org) + Math.cos(time * 0.35 + p.ph) * 4,
          th: p.th,
        };
      });
      // relationships within themes appear as the field organizes
      ctx.lineWidth = 0.7;
      for (var i = 0; i < pos.length; i++) {
        for (var j = i + 1; j < pos.length; j += 3) {
          if (pos[i].th !== pos[j].th) continue;
          var dx = pos[i].x - pos[j].x;
          var dy = pos[i].y - pos[j].y;
          var d2 = dx * dx + dy * dy;
          if (d2 > 5200) continue;
          ctx.strokeStyle = V.edge(0.3 * org * (1 - d2 / 5200), light);
          ctx.beginPath();
          ctx.moveTo(pos[i].x, pos[i].y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
        }
      }
      // a question connects to the most relevant themes
      var qa = V.smooth(0.45, 0.6, cyc) * (1 - V.smooth(0.8, 0.9, cyc));
      if (qa > 0) {
        [0, 1].forEach(function (k) {
          var c = lay.centers[(Math.floor(time / 14) + k) % lay.centers.length];
          if (!c) return;
          ctx.strokeStyle = V.rgba("teal", 0.6 * qa);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
          V.glow(ctx, c.x, c.y, 60, 0.3 * qa);
        });
        V.glow(ctx, cx, cy, 36, 0.6 * qa, "teal");
      }
      pos.forEach(function (p) {
        V.glyph(ctx, "journal", p.x, p.y, lay.mob ? 9 : 11, 0.55 + 0.4 * org, !light);
      });
      lay.centers.forEach(function (c, k) {
        V.node(ctx, c.x, c.y, 1, org, light, 1.6);
        place(dom.themes[k], c.x, c.y - (lay.mob ? 44 : 60));
        dom.themes[k].style.opacity = org.toFixed(2);
      });
      place(dom.q, cx, cy);
      dom.q.style.opacity = qa.toFixed(2);
    }

    var S = V.canvas(b.canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) {
        time = 14 * 0.55;
        runner.redraw();
      }
    });
    var runner = V.run(root, step, draw, 1);
    if (runner.reduced) {
      time = 14 * 0.55;
      draw();
    }
  };

  /* ---------- Content → structured data → analytics → decision-ready reporting ---------- */
  modes.data = function (root, D, light) {
    var b = base(root);
    var rand = V.rng(23);
    var time = 0;
    var lay = {};
    var movers = [];
    var mT = 0;
    var dom = {};
    var stages = D.stages || [];
    var cells = [];

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 640;
      var n = stages.length || 4;
      lay.cols = [];
      for (var i = 0; i < n; i++) {
        lay.cols.push(lay.mob ? { x: S.w / 2, y: S.h * (0.14 + (0.76 * i) / (n - 1)) } : { x: S.w * (0.12 + (0.76 * i) / (n - 1)), y: S.h * 0.5 });
      }
      cells = [];
      for (var c = 0; c < 24; c++) cells.push(rand());
      b.ov.innerHTML = "";
      dom.st = stages.map(function (t) {
        return label(b.ov, t, "dv-label--stage");
      });
    }

    function step(dt) {
      time += dt;
      mT -= dt;
      if (mT <= 0) {
        mT = 0.35;
        movers.push({ seg: Math.floor(rand() * Math.max(1, stages.length - 1)), t0: time, off: rand() - 0.5 });
      }
      movers = movers.filter(function (m) {
        return time - m.t0 < 1.8;
      });
    }

    function draw() {
      var ctx = S.ctx;
      ctx.clearRect(0, 0, lay.w, lay.h);
      var C = lay.cols;
      var sz = lay.mob ? 64 : Math.min(170, lay.w * 0.14);
      // connecting spine
      ctx.strokeStyle = V.edge(0.25, light);
      ctx.lineWidth = 1;
      ctx.beginPath();
      C.forEach(function (p, i) {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      movers.forEach(function (m) {
        var a = C[m.seg];
        var bb = C[m.seg + 1];
        if (!a || !bb) return;
        var u = (time - m.t0) / 1.8;
        var x = V.lerp(a.x, bb.x, V.ease(u)) + (lay.mob ? m.off * 30 : 0);
        var y = V.lerp(a.y, bb.y, V.ease(u)) + (lay.mob ? 0 : m.off * 40);
        V.particle(ctx, x, y, Math.sin(Math.PI * u), light);
      });
      // 1 content: overlapping documents
      var p0 = C[0];
      for (var k = 0; k < 4; k++) V.glyph(ctx, ["doc", "summary", "note", "book"][k], p0.x - 14 + k * 9, p0.y - 10 + k * 7, sz * 0.6, 0.95, !light);
      // 2 structured data: a grid whose cells populate
      var p1 = C[1];
      var gw = sz;
      var gh = sz * 0.75;
      var cyc = (time % 4) / 4;
      for (var r = 0; r < 6; r++) {
        for (var c = 0; c < 4; c++) {
          var idx = r * 4 + c;
          var on = cells[idx] < cyc * 1.2;
          ctx.fillStyle = on ? V.rgba("cyan", 0.75) : light ? "rgba(8,152,208,0.1)" : "rgba(160,230,245,0.12)";
          ctx.fillRect(p1.x - gw / 2 + c * (gw / 4) + 1, p1.y - gh / 2 + r * (gh / 6) + 1, gw / 4 - 2, gh / 6 - 2);
        }
      }
      // 3 analytics: bars and a trend line that breathe
      var p2 = C[2];
      var bw = sz / 7;
      ctx.fillStyle = V.rgba("blue", 0.85);
      var trend = [];
      for (var q = 0; q < 6; q++) {
        var hh = sz * 0.6 * (0.35 + 0.55 * (0.5 + 0.5 * Math.sin(time * 0.8 + q * 0.9)));
        var bx = p2.x - sz / 2 + q * bw * 1.2;
        ctx.fillRect(bx, p2.y + sz * 0.3 - hh, bw, hh);
        trend.push({ x: bx + bw / 2, y: p2.y + sz * 0.3 - hh - 8 });
      }
      ctx.strokeStyle = V.C.teal;
      ctx.lineWidth = 2;
      ctx.beginPath();
      trend.forEach(function (t, i) {
        if (i === 0) ctx.moveTo(t.x, t.y);
        else ctx.lineTo(t.x, t.y);
      });
      ctx.stroke();
      // 4 decision-ready reporting
      var p3 = C[3];
      if (p3) {
        V.glow(ctx, p3.x, p3.y, sz, 0.18);
        V.glyph(ctx, "regulatory", p3.x, p3.y, sz * 0.9, 1, !light);
      }
      C.forEach(function (p, i) {
        if (dom.st[i]) place(dom.st[i], p.x, p.y + (lay.mob ? sz * 0.55 : sz * 0.72));
      });
    }

    var S = V.canvas(b.canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    var runner = V.run(root, step, draw, 90);
  };

  /* ---------- Quality & compliance: a continuous-improvement loop ---------- */
  modes.quality = function (root, D, light) {
    var b = base(root);
    var time = 0;
    var lay = {};
    var dom = {};
    var loop = D.loop || [];

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 640;
      lay.C = { x: S.w / 2, y: S.h / 2 };
      lay.R = Math.min(S.w * (lay.mob ? 0.34 : 0.26), S.h * 0.36);
      b.ov.innerHTML = "";
      dom.loop = loop.map(function (t) {
        return label(b.ov, t, "dv-label--stage");
      });
      dom.center = label(b.ov, D.center || "", "dv-label--center");
    }

    function step(dt) {
      time += dt;
    }

    function draw() {
      var ctx = S.ctx;
      ctx.clearRect(0, 0, lay.w, lay.h);
      var C = lay.C;
      var R = lay.R;
      var n = loop.length || 5;
      V.glow(ctx, C.x, C.y, R * 0.8, 0.18);
      ctx.strokeStyle = V.edge(0.35, light);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(C.x, C.y, R, R * 0.82, 0, 0, TAU);
      ctx.stroke();
      var head = (time * 0.22) % 1;
      var ha = -Math.PI / 2 + head * TAU;
      ctx.strokeStyle = V.rgba("cyan", 0.9);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(C.x, C.y, R, R * 0.82, 0, ha - 0.9, ha);
      ctx.stroke();
      loop.forEach(function (t, i) {
        var a = -Math.PI / 2 + (i / n) * TAU;
        var x = C.x + Math.cos(a) * R;
        var y = C.y + Math.sin(a) * R * 0.82;
        var dist = Math.abs(((head * n - i + n) % n));
        var lit = Math.max(0, 1 - Math.min(dist, n - dist) * 1.2);
        V.glow(ctx, x, y, 30, 0.2 + 0.5 * lit);
        V.node(ctx, x, y, 1, lit, light, 2.2);
        // spokes: each step informs shared quality knowledge
        ctx.strokeStyle = V.rgba("teal", 0.12 + 0.35 * lit);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(C.x, C.y);
        ctx.stroke();
        var lx = C.x + Math.cos(a) * (R + (lay.mob ? 34 : 56));
        var ly = C.y + Math.sin(a) * (R * 0.82 + 30);
        var side = Math.cos(a);
        place(dom.loop[i], side > 0.3 ? x + 18 : side < -0.3 ? x - 18 : lx, side > 0.3 || side < -0.3 ? y - 9 : ly);
        dom.loop[i].style.transform = side > 0.3 ? "translate(0,0)" : side < -0.3 ? "translate(-100%,0)" : "";
        dom.loop[i].style.textAlign = side > 0.3 ? "left" : side < -0.3 ? "right" : "";
        dom.loop[i].classList.toggle("is-lit", lit > 0.4);
      });
      for (var k = 0; k < 3; k++) V.glyph(ctx, ["form", "doc", "regulatory"][k], C.x - 22 + k * 22, C.y - 6 + (k % 2) * 8, 26, 0.9, !light);
      place(dom.center, C.x, C.y + 34);
    }

    var S = V.canvas(b.canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    var runner = V.run(root, step, draw, 30);
  };

  /* ---------- Partner ecosystem around the platform ---------- */
  modes.ecosystem = function (root, D, light) {
    var b = base(root);
    var cfg = V.cfg;
    var eco = D || [];
    var brings = (cfg.content && cfg.content.domains && cfg.content.domains.liortaBrings) || "";
    var time = 0;
    var lay = {};
    var dom = {};
    var active = -1;
    var pulses = [];
    var pT = 0;
    var rand = V.rng(31);

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 640;
      lay.C = { x: S.w / 2, y: S.h * (lay.mob ? 0.4 : 0.5) };
      lay.R = Math.min(S.w * (lay.mob ? 0.36 : 0.3), S.h * 0.36);
      b.ov.innerHTML = "";
      var core = V.el("div", "eco-core", b.ov);
      core.innerHTML = V.markSVG(V.C.blue);
      V.el("b", null, core, cfg.platform.name || "");
      V.el("span", null, core, cfg.company.name || "");
      dom.core = core;
      dom.nodes = eco.map(function (e, i) {
        var btn = V.el("button", "eco-node", b.ov);
        btn.type = "button";
        V.el("b", null, btn, e.title);
        V.el("span", null, btn, e.bring);
        btn.addEventListener("mouseenter", function () {
          active = i;
        });
        btn.addEventListener("focus", function () {
          active = i;
        });
        btn.addEventListener("click", function () {
          active = i;
        });
        btn.addEventListener("mouseleave", function () {
          active = -1;
        });
        return btn;
      });
      dom.brings = V.el("p", "eco-brings", b.ov, brings);
    }

    function nodePos(i) {
      var n = eco.length || 4;
      var a = -Math.PI / 2 + Math.PI / n + (i / n) * TAU;
      return { x: lay.C.x + Math.cos(a) * lay.R * 1.35, y: lay.C.y + Math.sin(a) * lay.R };
    }

    function step(dt) {
      time += dt;
      pT -= dt;
      if (pT <= 0) {
        pT = 0.4;
        pulses.push({ i: Math.floor(rand() * Math.max(1, eco.length)), t0: time, dir: rand() < 0.5 ? 1 : -1 });
      }
      pulses = pulses.filter(function (p) {
        return time - p.t0 < 1.6;
      });
    }

    function draw() {
      var ctx = S.ctx;
      ctx.clearRect(0, 0, lay.w, lay.h);
      var C = lay.C;
      V.glow(ctx, C.x, C.y, lay.R * 0.9, 0.2);
      ctx.strokeStyle = V.edge(0.18, light);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(C.x, C.y, lay.R * 1.35, lay.R, 0, 0, TAU);
      ctx.stroke();
      eco.forEach(function (e, i) {
        var p = nodePos(i);
        var on = active === i;
        ctx.strokeStyle = V.rgba(on ? "cyan" : "ice", on ? 0.8 : 0.3);
        ctx.lineWidth = on ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(C.x, C.y);
        ctx.quadraticCurveTo((C.x + p.x) / 2, (C.y + p.y) / 2 - 30, p.x, p.y);
        ctx.stroke();
        V.glow(ctx, p.x, p.y, on ? 46 : 30, on ? 0.5 : 0.25);
        V.node(ctx, p.x, p.y, 1, on ? 1 : 0.3, light, 2.4);
        var el = dom.nodes[i];
        place(el, p.x, p.y);
        el.classList.toggle("is-on", on);
        el.classList.toggle("is-left", p.x < C.x - 5);
      });
      // value moves both ways along each relationship
      pulses.forEach(function (pu) {
        var p = nodePos(pu.i);
        var u = (time - pu.t0) / 1.6;
        var t = pu.dir > 0 ? u : 1 - u;
        var pt = { x: V.lerp(C.x, p.x, t), y: V.lerp(C.y, p.y, t) - Math.sin(Math.PI * t) * 30 * 0.5 };
        V.particle(ctx, pt.x, pt.y, Math.sin(Math.PI * u), light);
      });
      place(dom.core, C.x, C.y);
      place(dom.brings, C.x, C.y + lay.R * 1.08 + (lay.mob ? 24 : 0));
    }

    var S = V.canvas(b.canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    var runner = V.run(root, step, draw, 60);
  };

  V.register("domain", function (root, opts) {
    var mode = opts.mode || "periodic";
    var fn = modes[mode];
    if (!fn) return;
    var doms = (V.cfg.content && V.cfg.content.domains) || {};
    fn(root, doms[mode] || {}, opts.theme === "light");
  });
})();
