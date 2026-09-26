/*
 * Liorta visual system — shared grammar for the Living Mark and the three
 * Lorgani views (Core, Fabric, Orbit). Components register with
 * LiortaVisuals.register(name, init) and mount on [data-liorta-visual="name"].
 * All names/labels come from window.LIORTA_BRAND (Brand Configuration); this
 * file and the components contain no brand, platform or application names.
 */
(function () {
  "use strict";

  var V = (window.LiortaVisuals = window.LiortaVisuals || {});
  V.cfg = window.LIORTA_BRAND || { company: {}, platform: {}, applications: [], capabilities: [], identity: { columns: [], items: [] }, labels: {}, content: {} };

  /* ---------- palette (Liorta logo blue, Liorta.com dot gradient, protection teal) ---------- */
  V.C = { blue: "#0898D0", cyan: "#00BACE", deep: "#005E84", teal: "#12B3A8", navy: "#051A2B" };
  V.RGB = { blue: "8,152,208", cyan: "0,186,206", deep: "0,94,132", teal: "18,179,168", ice: "95,210,240", light: "200,250,255" };
  V.rgba = function (name, a) {
    return "rgba(" + (V.RGB[name] || name) + "," + a + ")";
  };

  /* ---------- the Liorta mark: geometry measured from the primary logo lockup ---------- */
  // Dots ⌀47 on an 88 × 81 (non-square) pitch; 10-unit connectors on the mark's own path.
  // Dot index i = col * 3 + row (columns = the identity's three columns).
  var CX = [23.5, 110.5, 199];
  var CY = [25, 107, 187];
  V.MARK = {
    w: 222.5,
    h: 212,
    cx: 111.25,
    cy: 106,
    r: 23.5,
    bar: 10,
    links: [
      [0, 1],
      [1, 5],
      [5, 8],
      [4, 6],
    ],
    dot: function (i) {
      return { x: CX[Math.floor(i / 3)], y: CY[i % 3] };
    },
  };

  /* ---------- environment ---------- */
  V.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  V.fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  V.speed = 1; // shared time-scale: all three Lorgani views move at the same velocity

  /* ---------- math / easing (one curve for the whole system) ---------- */
  V.clamp = function (v, a, b) {
    return v < a ? a : v > b ? b : v;
  };
  V.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };
  V.ease = function (t) {
    t = V.clamp(t, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  V.smooth = function (a, b, v) {
    var t = V.clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  V.rng = function (seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 100000) / 100000;
    };
  };
  V.bez = function (p0, p1, p2, p3, t) {
    var u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  };
  V.tokens = function (s, extra) {
    if (typeof s !== "string") return s;
    var map = { "{company}": V.cfg.company.name || "", "{platform}": V.cfg.platform.name || "" };
    for (var k in extra || {}) map[k] = extra[k];
    return s.replace(/\{company\}|\{platform\}|\{application\}/g, function (m) {
      return map[m] != null ? map[m] : m;
    });
  };

  /* ---------- DOM helpers ---------- */
  V.svg = function (tag, attrs, parent) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs || {}) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };
  V.el = function (tag, cls, parent, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    if (parent) parent.appendChild(el);
    return el;
  };
  V.markSVG = function (color) {
    var M = V.MARK;
    var s = '<svg viewBox="-2 -2 226.5 216" aria-hidden="true" focusable="false">';
    M.links.forEach(function (p) {
      var a = M.dot(p[0]);
      var b = M.dot(p[1]);
      s += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + color + '" stroke-width="' + M.bar + '"/>';
    });
    for (var i = 0; i < 9; i++) {
      var d = M.dot(i);
      s += '<circle cx="' + d.x + '" cy="' + d.y + '" r="' + M.r + '" fill="' + color + '"/>';
    }
    return s + "</svg>";
  };

  /* ---------- lifecycle: lazy init + render only while visible ---------- */
  V.lazy = function (el, init) {
    if (!("IntersectionObserver" in window)) {
      init();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          io.disconnect();
          init();
        }
      },
      { rootMargin: "300px 0px" }
    );
    el.__liortaLazyIO = io;
    io.observe(el);
  };

  V.loop = function (el, frame) {
    var visible = false;
    var raf = null;
    var last = 0;
    var t = 0;
    function tick(now) {
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      t += dt * V.speed;
      frame(t, dt * V.speed);
      raf = window.requestAnimationFrame(tick);
    }
    function start() {
      if (raf === null && visible && !document.hidden) {
        last = 0;
        raf = window.requestAnimationFrame(tick);
      }
    }
    function stop() {
      if (raf !== null) window.cancelAnimationFrame(raf);
      raf = null;
    }
    // Held on the element: an unreferenced observer can be garbage-collected,
    // which silently stops the visual from ever starting.
    el.__liortaLoopIO = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    });
    el.__liortaLoopIO.observe(el);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
    // Start at once if already on screen; don't wait for the first observer callback.
    var r0 = el.getBoundingClientRect();
    if (r0.bottom > 0 && r0.top < window.innerHeight) {
      visible = true;
      start();
    }
    return {
      once: function () {
        frame(t, 0);
      },
    };
  };

  // Components with a simulation run it through `step`; under reduced motion
  // they are warmed up and drawn once as a composed still frame.
  V.run = function (el, step, draw, warm) {
    if (V.reduced) {
      for (var i = 0; i < (warm || 150); i++) step(1 / 30);
      draw();
      return { redraw: draw, reduced: true };
    }
    V.loop(el, function (t, dt) {
      step(dt);
      draw();
    });
    return { redraw: function () {}, reduced: false };
  };

  V.canvas = function (canvas, box, onResize) {
    var ctx = canvas.getContext("2d");
    var state = { ctx: ctx, w: 0, h: 0, dpr: 1 };
    function resize() {
      var r = box.getBoundingClientRect();
      var cap = r.width < 700 ? 1.5 : 2;
      state.dpr = Math.min(window.devicePixelRatio || 1, cap);
      state.w = Math.max(1, Math.round(r.width));
      state.h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(state.w * state.dpr);
      canvas.height = Math.round(state.h * state.dpr);
      canvas.style.width = state.w + "px";
      canvas.style.height = state.h + "px";
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      if (onResize) onResize(state);
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(box);
    else window.addEventListener("resize", resize);
    resize();
    return state;
  };

  V.pointer = function (el) {
    var p = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
    p.step = function (k) {
      p.x += (p.tx - p.x) * (k || 0.06);
      p.y += (p.ty - p.y) * (k || 0.06);
    };
    if (!V.fine || V.reduced) return p;
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      p.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      p.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      p.inside = true;
    });
    el.addEventListener("pointerleave", function () {
      p.tx = 0;
      p.ty = 0;
      p.inside = false;
    });
    return p;
  };

  /* ---------- shared drawing grammar ---------- */
  V.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Soft radial glow — the only glow style in the system.
  V.glow = function (ctx, x, y, r, a, color) {
    if (a <= 0.005) return;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, V.rgba(color || "cyan", a));
    g.addColorStop(1, V.rgba(color || "cyan", 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  // Intelligence node. depth 0..1 (far..near), heat 0..1 (resting..active). light = light stage.
  V.node = function (ctx, x, y, depth, heat, light, scale) {
    var r = (0.8 + 1.6 * depth) * (1 + heat * 0.9) * (scale || 1);
    var a = 0.25 + 0.75 * depth;
    if (light) ctx.fillStyle = heat > 0.25 ? V.rgba("blue", 0.55 + 0.45 * heat) : V.rgba("deep", 0.22 + 0.5 * depth);
    else ctx.fillStyle = heat > 0.2 ? V.rgba("light", a) : "rgba(80,205,240," + a.toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };

  // Connection line colour (alpha scaled by the caller for depth/emphasis).
  V.edge = function (a, light) {
    return light ? V.rgba("blue", a * 0.8) : V.rgba("ice", a);
  };

  // Flow particle.
  V.particle = function (ctx, x, y, a, light) {
    ctx.fillStyle = light ? V.rgba("blue", a) : "rgba(90,220,245," + a.toFixed(3) + ")";
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  };

  // The Liorta mark on canvas (gradient dots, logo connectors).
  V.drawMark = function (ctx, cx, cy, width, t, glowAlpha) {
    var M = V.MARK;
    var k = width / M.w;
    ctx.save();
    ctx.translate(cx - M.cx * k, cy - M.cy * k);
    ctx.strokeStyle = V.C.blue;
    ctx.lineWidth = M.bar * k;
    ctx.beginPath();
    M.links.forEach(function (p) {
      var a = M.dot(p[0]);
      var b = M.dot(p[1]);
      ctx.moveTo(a.x * k, a.y * k);
      ctx.lineTo(b.x * k, b.y * k);
    });
    ctx.stroke();
    for (var i = 0; i < 9; i++) {
      var d = M.dot(i);
      var r = M.r * k * (1 + 0.04 * Math.sin(t * 1.2 + i));
      if (glowAlpha > 0) V.glow(ctx, d.x * k, d.y * k, r * 2.6, 0.45 * glowAlpha);
      var g = ctx.createLinearGradient(0, d.y * k - r, 0, d.y * k + r);
      g.addColorStop(0, V.C.cyan);
      g.addColorStop(1, V.C.deep);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(d.x * k, d.y * k, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Information objects: generic, brand-neutral forms (no third-party app marks).
  V.glyph = function (ctx, type, x, y, s, alpha, dark) {
    if (alpha <= 0.01) return;
    var w = s * 0.78;
    var h = s;
    var x0 = x - w / 2;
    var y0 = y - h / 2;
    var ink = dark ? "rgba(175,235,250," : "rgba(8,120,176,";
    ctx.save();
    ctx.globalAlpha = alpha;
    V.roundRect(ctx, x0, y0, w, h, s * 0.12);
    ctx.fillStyle = dark ? "rgba(16,66,98,0.95)" : "rgba(255,255,255,0.97)";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = dark ? "rgba(130,220,245,0.7)" : "rgba(8,152,208,0.32)";
    ctx.stroke();
    var px = x0 + w * 0.16;
    var pw = w * 0.68;
    var py = y0 + h * 0.16;
    var ph = h * 0.68;
    var hair = Math.max(1, s * 0.03);
    ctx.fillStyle = ink + "0.85)";
    ctx.strokeStyle = ink + "0.85)";
    ctx.lineWidth = Math.max(1, s * 0.035);
    var i, lh;
    function accent() {
      ctx.fillStyle = V.rgba("cyan", 1);
    }
    switch (type) {
      case "table":
      case "listing":
        for (i = 0; i <= 4; i++) {
          ctx.globalAlpha = alpha * (i === 0 ? 0.9 : 0.45);
          ctx.fillRect(px, py + (ph / 5) * i, pw, Math.max(1, s * 0.04));
        }
        ctx.globalAlpha = alpha * 0.45;
        ctx.fillRect(px + pw * 0.38, py, hair, ph * 0.82);
        if (type === "listing") {
          ctx.globalAlpha = alpha;
          accent();
          ctx.fillRect(px, py + (ph / 5) * 2 - 1, pw, Math.max(2, s * 0.07));
        }
        break;
      case "chart":
      case "exposure":
        var bars = type === "exposure" ? [0.35, 0.5, 0.62, 0.78, 0.9] : [0.4, 0.7, 0.5, 0.9, 0.62];
        var bw = pw / (bars.length * 1.6);
        for (i = 0; i < bars.length; i++) {
          ctx.globalAlpha = alpha * (0.5 + 0.1 * i);
          ctx.fillRect(px + i * bw * 1.6, py + ph * (1 - bars[i]), bw, ph * bars[i]);
        }
        break;
      case "book":
      case "journal":
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillRect(px, py, pw, Math.max(1.5, s * 0.06));
        ctx.globalAlpha = alpha * 0.45;
        lh = ph / 7;
        for (i = 1; i < 7; i++) {
          ctx.fillRect(px, py + lh * i + lh * 0.3, pw * 0.44, hair);
          ctx.fillRect(px + pw * 0.56, py + lh * i + lh * 0.3, pw * 0.44, hair);
        }
        break;
      case "feed":
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        for (i = 0; i < 3; i++) {
          var yy = py + ph * (0.22 + i * 0.28);
          ctx.moveTo(px, yy);
          ctx.bezierCurveTo(px + pw * 0.3, yy - ph * 0.12, px + pw * 0.6, yy + ph * 0.12, px + pw, yy);
        }
        ctx.stroke();
        break;
      case "note":
        ctx.globalAlpha = alpha * 0.55;
        ctx.beginPath();
        for (i = 0; i < 5; i++) {
          var ny = py + (ph / 5) * i + ph * 0.1;
          ctx.moveTo(px, ny);
          ctx.quadraticCurveTo(px + pw * 0.5, ny + (i % 2 ? 2 : -2), px + pw * (0.6 + 0.08 * (i % 3)), ny);
        }
        ctx.stroke();
        break;
      case "form":
      case "safety":
        for (i = 0; i < 4; i++) {
          ctx.globalAlpha = alpha * 0.8;
          ctx.strokeRect(px, py + (ph / 4) * i + 1, s * 0.09, s * 0.09);
          ctx.globalAlpha = alpha * 0.4;
          ctx.fillRect(px + s * 0.16, py + (ph / 4) * i + s * 0.03, pw - s * 0.16, hair);
        }
        if (type === "safety") {
          ctx.globalAlpha = alpha;
          accent();
          ctx.beginPath();
          ctx.arc(x0 + w * 0.8, y0 + h * 0.16, s * 0.08, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "seal":
      case "regulatory":
        lh = ph / 6;
        ctx.globalAlpha = alpha * 0.45;
        for (i = 0; i < 4; i++) ctx.fillRect(px, py + lh * i, pw * (i % 2 ? 0.7 : 1), hair);
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(px + pw * 0.72, py + ph * 0.8, s * 0.1, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "booklet":
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillRect(x0 + w * 0.08, y0 + h * 0.1, Math.max(2, s * 0.06), h * 0.8);
        ctx.globalAlpha = alpha * 0.45;
        lh = ph / 6;
        for (i = 0; i < 6; i++) ctx.fillRect(px + s * 0.06, py + lh * i, pw * (i === 0 ? 0.6 : 0.85), hair);
        break;
      case "dsur":
        ctx.globalAlpha = alpha;
        accent();
        ctx.fillRect(px, py, pw * 0.5, Math.max(2, s * 0.07));
        ctx.fillStyle = ink + "0.85)";
        ctx.globalAlpha = alpha * 0.45;
        lh = ph / 6;
        for (i = 1; i < 6; i++) ctx.fillRect(px, py + lh * i, pw * (0.6 + 0.08 * (i % 3)), hair);
        break;
      case "summary":
        lh = ph / 6;
        for (i = 0; i < 6; i++) {
          ctx.globalAlpha = alpha * (i % 3 === 0 ? 0.9 : 0.4);
          ctx.fillRect(px, py + lh * i, pw * (i % 3 === 0 ? 0.55 : 0.95), Math.max(1, s * (i % 3 === 0 ? 0.05 : 0.03)));
        }
        break;
      default:
        lh = ph / 6;
        for (i = 0; i < 6; i++) {
          ctx.globalAlpha = alpha * (i === 0 ? 0.9 : 0.42);
          ctx.fillRect(px, py + lh * i, pw * (i === 0 ? 0.6 : i === 5 ? 0.55 : 1), Math.max(1, s * (i === 0 ? 0.05 : 0.03)));
        }
    }
    ctx.restore();
  };

  // Label chip (DOM) — one chip style for capabilities across all views.
  V.chip = function (text, parent, extraClass) {
    return V.el("div", "lx-chip" + (extraClass ? " " + extraClass : ""), parent, text);
  };

  V.shieldSVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>';
  V.reviewSVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5"/><path d="M15 11.5l2 2 4-4.2"/></svg>';

  // Synthetic, sanitized dossier UI (DSUR / PBRER / PADER standard structures from config).
  V.dossierPanel = function (parent) {
    var docs = V.cfg.content.dossiers || {};
    var L = V.cfg.labels || {};
    var el = V.el("div", "lx-dsur", parent);
    el.innerHTML =
      '<div class="lx-dsur__bar"><i></i><i></i><i></i><span></span></div><div class="lx-dsur__tabs" role="tablist"></div>' +
      '<div class="lx-dsur__body"><ol></ol><div class="lx-dsur__page" aria-hidden="true"><i></i><i style="width:92%"></i><i style="width:84%"></i><i style="width:70%"></i><i style="width:88%"></i>' +
      '<div class="lx-dsur__status"></div></div></div><div class="lx-dsur__note"></div>';
    el.querySelector(".lx-dsur__status").textContent = "✓ " + (L.approved || "");
    el.querySelector(".lx-dsur__note").textContent = L.illustration || "";
    var tabs = el.querySelector(".lx-dsur__tabs");
    var ol = el.querySelector("ol");
    var head = el.querySelector(".lx-dsur__bar span");
    var state = { doc: null, on: 0 };
    function mark() {
      for (var i = 0; i < ol.children.length; i++) ol.children[i].classList.toggle("is-on", i === state.on);
    }
    function show(doc) {
      state.doc = doc;
      state.on = 0;
      head.textContent = docs[doc].head;
      ol.innerHTML = "";
      docs[doc].rows.forEach(function (r) {
        var li = V.el("li", null, ol);
        V.el("b", null, li, r[0]);
        V.el("span", null, li, r[1]);
      });
      Array.prototype.forEach.call(tabs.children, function (b) {
        b.setAttribute("aria-selected", b.textContent === doc ? "true" : "false");
      });
      mark();
    }
    Object.keys(docs).forEach(function (d) {
      var b = V.el("button", null, tabs, d);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () {
        show(d);
      });
    });
    if (Object.keys(docs).length) show(Object.keys(docs)[0]);
    el.advance = function () {
      if (!state.doc) return;
      state.on = (state.on + 1) % docs[state.doc].rows.length;
      mark();
    };
    return el;
  };

  /* ---------- registry ---------- */
  var registry = {};
  V.register = function (name, init) {
    registry[name] = init;
  };
  V.mountAll = function (root) {
    (root || document).querySelectorAll("[data-liorta-visual]").forEach(function (el) {
      if (el.__liortaMounted) return;
      var init = registry[el.getAttribute("data-liorta-visual")];
      if (!init) return;
      el.__liortaMounted = true;
      V.lazy(el, function () {
        init(el, el.dataset);
      });
    });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () {
    V.mountAll();
  });
  else setTimeout(V.mountAll, 0);
})();
