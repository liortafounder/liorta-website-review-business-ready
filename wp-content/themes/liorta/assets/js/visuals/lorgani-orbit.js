/*
 * LorganiOrbit - the "Orbit View": a layered intelligence sphere with the
 * Liorta mark at its heart. Information travels the outer orbit and is drawn
 * inward; capabilities circle the middle orbit together (never a sequence);
 * the applications orbit closest, tethered to the core, releasing outputs.
 * Mount: <div data-liorta-visual="orbit">. All labels from LIORTA_BRAND.
 */
(function () {
  "use strict";
  var V = window.LiortaVisuals;
  var TAU = Math.PI * 2;

  V.register("orbit", function (root, opts) {
    var teaser = opts.mode === "teaser";
    var cfg = V.cfg;
    var LB = cfg.labels || {};
    var APPS = cfg.applications || [];
    var CAPS = cfg.capabilities || [];
    var SOURCES = (cfg.content && cfg.content.inputs) || [["doc"]];
    var canvas = V.el("canvas", "lx-canvas", root);
    canvas.setAttribute("aria-hidden", "true");
    var ov = V.el("div", "lx-overlay", root);
    var pointer = V.pointer(root);
    var rand = V.rng(33);
    var time = 0;
    var lay = {};
    var dom = {};
    var inputs = [];
    var emits = [];
    var emitT = 0;
    var phase3 = 0;
    var selected = -1;
    var hoverCap = -1;

    var RINGS = [
      { r: 1.0, roll: -0.22, speed: 0.07, phase: 0 },
      { r: 0.76, roll: -0.08, speed: -0.1, phase: 0 },
      { r: 0.5, roll: 0.3, speed: 0.14, phase: 0 },
    ];

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 768;
      lay.C = { x: S.w / 2, y: S.h * (lay.mob ? 0.42 : 0.53) };
      lay.Rb = Math.min(S.w * (lay.mob ? 0.44 : 0.38), S.h * (lay.mob ? 0.4 : 0.6));
      var n = teaser ? (lay.mob ? 8 : 12) : lay.mob ? 10 : 18;
      if (teaser) lay.Rb *= 0.9;
      inputs = [];
      for (var i = 0; i < n; i++) inputs.push({ a: (i / n) * TAU, type: SOURCES[i % SOURCES.length][0], mig: -1, delay: rand() * 8 });
      buildDom();
    }

    function buildDom() {
      ov.innerHTML = "";
      dom = { caps: [], apps: [] };
      CAPS.forEach(function (c, i) {
        var b = V.el(teaser ? "div" : "button", "lx-orbit-cap", ov, c.label);
        if (teaser) {
          b.setAttribute("aria-hidden", "true");
          dom.caps.push(b);
          return;
        }
        b.type = "button";
        V.el("em", null, b, c.brand);
        b.setAttribute("aria-label", c.label + " - " + c.brand + ". " + c.line);
        b.addEventListener("mouseenter", function () {
          hoverCap = i;
        });
        b.addEventListener("mouseleave", function () {
          hoverCap = -1;
        });
        b.addEventListener("focus", function () {
          hoverCap = i;
          showCap(i);
        });
        b.addEventListener("blur", function () {
          hoverCap = -1;
        });
        b.addEventListener("click", function () {
          hoverCap = i;
          showCap(i);
        });
        dom.caps.push(b);
      });
      APPS.forEach(function (a, i) {
        var b = V.el(teaser ? "a" : "button", "lx-orbit-app", ov);
        if (teaser) {
          b.href = a.url;
          V.el("b", null, b, a.name);
          V.el("small", null, b, a.fullName);
          dom.apps.push(b);
          return;
        }
        b.type = "button";
        V.el("b", null, b, a.name);
        V.el("small", null, b, a.fullName);
        b.addEventListener("click", function () {
          select(selected === i ? -1 : i);
        });
        dom.apps.push(b);
      });
      if (!teaser) {
        dom.focus = V.el("div", "lx-focus", ov);
        dom.focus.setAttribute("aria-live", "polite");
        if (!lay.mob && LB.notSequence) V.el("p", "lx-legend", ov, LB.notSequence);
      }
      select(selected);
    }

    // External controls (the platform page's capability explorer) drive the orbit.
    root.addEventListener("liorta:orbit-cap", function (e) {
      hoverCap = e.detail;
      showCap(e.detail);
    });
    root.addEventListener("liorta:orbit-app", function (e) {
      select(e.detail);
    });

    function showCap(i) {
      var c = CAPS[i];
      if (!c || !dom.focus) return;
      dom.focus.innerHTML = "";
      V.el("b", null, dom.focus, c.brand);
      V.el("span", null, dom.focus, c.line);
    }

    function select(i) {
      selected = i;
      dom.apps.forEach(function (b, k) {
        if (!teaser) b.setAttribute("aria-pressed", k === i ? "true" : "false");
      });
      var f = dom.focus;
      if (!f) return;
      f.innerHTML = "";
      if (i < 0) {
        V.el("b", null, f, cfg.platform.name || "");
        V.el("span", null, f, cfg.platform.proposition || "");
      } else {
        var a = APPS[i];
        V.el("b", null, f, a.name + " · " + a.fullName);
        V.el("span", null, f, a.tagline || "");
        var ul = V.el("ul", null, f);
        (a.outputs || []).forEach(function (o) {
          V.el("li", null, ul, o);
        });
      }
    }

    function ringPoint(k, theta, rScale) {
      var ring = RINGS[k];
      var r = ring.r * (rScale == null ? 1 : rScale);
      var x = Math.cos(theta) * r;
      var z = Math.sin(theta) * r;
      var cr = Math.cos(ring.roll);
      var sr = Math.sin(ring.roll);
      var x1 = x * cr;
      var y1 = x * sr;
      var pitch = (lay.mob ? 0.9 : 1.02) + pointer.y * 0.16;
      var y2 = y1 * Math.cos(pitch) - z * Math.sin(pitch);
      var z2 = y1 * Math.sin(pitch) + z * Math.cos(pitch);
      var yaw = pointer.x * 0.35;
      var x3 = x1 * Math.cos(yaw) + z2 * Math.sin(yaw);
      var z3 = -x1 * Math.sin(yaw) + z2 * Math.cos(yaw);
      var depth = y2;
      var persp = 4 / (4 - depth);
      return { x: lay.C.x + x3 * lay.Rb * persp, y: lay.C.y - z3 * lay.Rb * persp, d: depth, s: persp };
    }

    function step(dt) {
      time += dt;
      RINGS[0].phase += RINGS[0].speed * dt;
      RINGS[1].phase += RINGS[1].speed * dt;
      if (selected >= 0 && APPS.length) {
        var target = -Math.PI / 2 - (selected / APPS.length) * TAU;
        var diff = ((target - phase3 + Math.PI * 3) % TAU) - Math.PI;
        phase3 += diff * Math.min(1, dt * 3);
      } else phase3 += RINGS[2].speed * dt;
      inputs.forEach(function (inp) {
        inp.delay -= dt;
        if (inp.mig < 0 && inp.delay <= 0) inp.mig = 0;
        if (inp.mig >= 0) {
          inp.mig += dt / 4.5;
          if (inp.mig >= 1) {
            inp.mig = -1;
            inp.delay = 4 + rand() * 7;
          }
        }
      });
      emitT -= dt;
      if (emitT <= 0 && APPS.length) {
        emitT = 0.9;
        emits.push({ k: selected >= 0 ? selected : Math.floor(rand() * APPS.length), t0: time, spin: (rand() - 0.5) * 0.6 });
      }
      emits = emits.filter(function (e) {
        return time - e.t0 < 2.4;
      });
    }

    function draw() {
      var ctx = S.ctx;
      var C = lay.C;
      var Rb = lay.Rb;
      pointer.step(0.05);
      ctx.clearRect(0, 0, lay.w, lay.h);
      var bodies = [];
      var segs = [];
      RINGS.forEach(function (ring, k) {
        var prev = ringPoint(k, 0);
        for (var i = 1; i <= 120; i++) {
          var cur = ringPoint(k, (i / 120) * TAU);
          segs.push({ a: prev, b: cur, d: (prev.d + cur.d) / 2, k: k });
          prev = cur;
        }
      });

      inputs.forEach(function (inp) {
        var theta = inp.a + RINGS[0].phase;
        var rs = 1;
        var alpha = 1;
        var size = lay.mob ? 24 : 34;
        if (inp.mig >= 0) {
          var m = V.ease(inp.mig);
          theta += m * 2.4;
          rs = V.lerp(1, 0.08, m);
          alpha = inp.mig > 0.8 ? (1 - inp.mig) / 0.2 : 1;
          size *= V.lerp(1, 0.4, m);
        }
        var p = ringPoint(0, theta, rs);
        bodies.push({
          d: p.d,
          draw: function () {
            V.glyph(ctx, inp.type, p.x, p.y, size * (0.7 + 0.3 * p.s), alpha * (0.45 + 0.55 * ((p.d + 1) / 2)), true);
          },
        });
      });

      var capPos = CAPS.map(function (c, i) {
        var p = ringPoint(1, (i / CAPS.length) * TAU + RINGS[1].phase);
        bodies.push({
          d: p.d,
          draw: function () {
            var on = i === hoverCap;
            V.glow(ctx, p.x, p.y, on ? 26 : 16, on ? 0.7 : 0.45);
            ctx.fillStyle = "#c9f6ff";
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 * p.s, 0, TAU);
            ctx.fill();
          },
        });
        return p;
      });

      var appPos = APPS.map(function (a, i) {
        var p = ringPoint(2, (i / APPS.length) * TAU + phase3);
        bodies.push({
          d: p.d,
          draw: function () {
            var on = i === selected;
            var tg = ctx.createLinearGradient(C.x, C.y, p.x, p.y);
            tg.addColorStop(0, V.rgba("ice", 0.05));
            tg.addColorStop(1, V.rgba("ice", on ? 0.8 : 0.45));
            ctx.strokeStyle = tg;
            ctx.lineWidth = on ? 2 : 1.2;
            ctx.beginPath();
            ctx.moveTo(C.x, C.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            var r = (on ? 11 : 8) * p.s;
            V.glow(ctx, p.x, p.y, r * 3.2, 0.55);
            var gg = ctx.createLinearGradient(0, p.y - r, 0, p.y + r);
            gg.addColorStop(0, V.C.cyan);
            gg.addColorStop(1, V.C.deep);
            ctx.fillStyle = gg;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, TAU);
            ctx.fill();
          },
        });
        return p;
      });

      emits.forEach(function (e) {
        var p = appPos[e.k];
        if (!p) return;
        var age = (time - e.t0) / 2.4;
        var ang = Math.atan2(p.y - C.y, p.x - C.x) + e.spin * age;
        var dist = V.ease(age) * Rb * 0.75;
        var x = p.x + Math.cos(ang) * dist;
        var y = p.y + Math.sin(ang) * dist;
        bodies.push({
          d: p.d + 0.01,
          draw: function () {
            V.glyph(ctx, APPS[e.k].glyph || "doc", x, y, 18, Math.sin(Math.PI * age) * 0.9, true);
          },
        });
      });

      segs.sort(function (a, b) {
        return a.d - b.d;
      });
      bodies.sort(function (a, b) {
        return a.d - b.d;
      });
      function drawSegs(front) {
        segs.forEach(function (s) {
          if (front ? s.d < 0 : s.d >= 0) return;
          ctx.strokeStyle = V.edge([0.28, 0.4, 0.55][s.k] * (0.35 + 0.65 * ((s.d + 1) / 2)));
          ctx.lineWidth = s.k === 2 ? 1.4 : 1;
          ctx.beginPath();
          ctx.moveTo(s.a.x, s.a.y);
          ctx.lineTo(s.b.x, s.b.y);
          ctx.stroke();
        });
      }
      drawSegs(false);
      bodies.forEach(function (b) {
        if (b.d < 0) b.draw();
      });

      var cg = ctx.createRadialGradient(C.x, C.y, 0, C.x, C.y, Rb * 0.42);
      cg.addColorStop(0, "rgba(40,190,230,0.42)");
      cg.addColorStop(0.6, "rgba(8,120,176,0.16)");
      cg.addColorStop(1, "rgba(8,120,176,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(C.x, C.y, Rb * 0.42, 0, TAU);
      ctx.fill();
      var pulse = (time % 3.2) / 3.2;
      ctx.strokeStyle = V.rgba("teal", (0.4 * (1 - pulse)).toFixed(3));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(C.x, C.y, Rb * (0.22 + 0.14 * pulse), 0, TAU);
      ctx.stroke();
      V.drawMark(ctx, C.x, C.y, Rb * 0.26, time, 1);

      drawSegs(true);
      bodies.forEach(function (b) {
        if (b.d >= 0) b.draw();
      });

      var frontCap = -1;
      var frontD = -9;
      capPos.forEach(function (p, i) {
        if (p.d > frontD) {
          frontD = p.d;
          frontCap = i;
        }
      });
      capPos.forEach(function (p, i) {
        var el = dom.caps[i];
        var ox = p.x - C.x;
        var oy = p.y - C.y;
        var ol = Math.sqrt(ox * ox + oy * oy) || 1;
        el.style.left = V.clamp(p.x + (ox / ol) * 34, 44, lay.w - 44) + "px";
        el.style.top = p.y + (oy / ol) * 22 - 4 + "px";
        var behind = p.d < 0 && Math.hypot(ox, oy) < Rb * 0.4;
        var op = (behind ? 0.2 : 0.5 + 0.5 * ((p.d + 1) / 2)) * (hoverCap >= 0 && hoverCap !== i ? 0.5 : 1);
        // Phones: capability labels are listed as text beside the visual; keep the orbit uncluttered.
        if (lay.mob) op = i === hoverCap ? 1 : 0;
        el.style.opacity = op.toFixed(3);
        el.style.zIndex = p.d > 0 ? 3 : 1;
        el.classList.toggle("is-on", i === hoverCap || (lay.mob && hoverCap < 0 && i === frontCap));
      });
      appPos.forEach(function (p, i) {
        var el = dom.apps[i];
        var px = p.x - C.x;
        var py = p.y - C.y;
        var pl = Math.sqrt(px * px + py * py) || 1;
        el.style.left = V.clamp(p.x + (px / pl) * 46, 56, lay.w - 56) + "px";
        el.style.top = p.y + (py / pl) * 30 + 6 + "px";
        el.style.opacity = (0.55 + 0.45 * ((p.d + 1) / 2)).toFixed(3);
        el.style.zIndex = p.d > 0 ? 4 : 2;
      });
    }

    var runner;
    var S = V.canvas(canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    runner = V.run(root, step, draw, 90);
  });
})();
