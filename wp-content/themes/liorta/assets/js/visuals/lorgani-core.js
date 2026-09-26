/*
 * LorganiCore - the "Core View": heterogeneous information streams into a
 * living, node-built intelligence centre and resolves into organized outcomes.
 * Mount: <div data-liorta-visual="core" data-mode="hero|intro|evidence">
 *   hero     - no platform/application names; generic inputs → outcomes
 *   intro    - platform name + capabilities (the same core, more explanation)
 *   evidence - the application demonstration: eight evidence types → branded
 *              capabilities → human review & approval → dossier UI
 * Labels come from LIORTA_BRAND; capabilities are shown together, never as a sequence.
 */
(function () {
  "use strict";
  var V = window.LiortaVisuals;
  var TAU = Math.PI * 2;

  V.register("core", function (root, opts) {
    var mode = opts.mode || "hero";
    var cfg = V.cfg;
    var C = cfg.content || {};
    var LB = cfg.labels || {};
    var canvas = V.el("canvas", "lx-canvas", root);
    canvas.setAttribute("aria-hidden", "true");
    var ov = V.el("div", "lx-overlay", root);
    ov.setAttribute("aria-hidden", "true");
    var pointer = V.pointer(root);
    var rand = V.rng(7);
    var time = 0;
    var lay = {};
    var nodes = [];
    var edges = [];
    var streams = [];
    var outs = [];
    var objects = [];
    var packets = [];
    var absorbs = [];
    var spawnT = 0;
    var packetT = 0;
    var litCap = 0;
    var litCapT = 0;
    var dom = { caps: [], outs: [], lit: [] };

    var inputs = mode === "evidence" ? C.evidence || [] : C.inputs || [];
    var outcomes = C.outcomes || [];
    var capLabels =
      mode === "evidence"
        ? C.evidenceCapabilities || []
        : mode === "intro"
        ? (cfg.capabilities || []).map(function (c) {
            return c.label;
          })
        : [];

    function buildCore(n) {
      nodes = [];
      edges = [];
      var ga = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < n; i++) {
        var y = 1 - (i / (n - 1)) * 2;
        var r = Math.sqrt(1 - y * y);
        nodes.push({ x: Math.cos(ga * i) * r, y: y, z: Math.sin(ga * i) * r, ph: rand() * TAU });
      }
      var seen = {};
      for (var a = 0; a < n; a++) {
        var best = [];
        for (var b = 0; b < n; b++) {
          if (a === b) continue;
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var dz = nodes[a].z - nodes[b].z;
          best.push([dx * dx + dy * dy + dz * dz, b]);
        }
        best.sort(function (p, q) {
          return p[0] - q[0];
        });
        for (var k = 0; k < 3; k++) {
          var key = Math.min(a, best[k][1]) + "-" + Math.max(a, best[k][1]);
          if (!seen[key]) {
            seen[key] = 1;
            edges.push([a, best[k][1]]);
          }
        }
      }
    }

    function layout(S) {
      var w = S.w;
      var h = S.h;
      var mob = w < (mode === "hero" ? 900 : 768);
      lay = { w: w, h: h, mob: mob };
      if (mode === "hero" && !mob) {
        lay.C = { x: w * 0.665, y: h * 0.5 };
        lay.R = Math.min(h * 0.19, w * 0.1);
        lay.inX = w * 0.44;
        lay.outX = lay.C.x + lay.R * 1.95;
      } else if (!mob) {
        lay.C = { x: w * (mode === "evidence" ? 0.42 : 0.47), y: h * 0.47 };
        lay.R = Math.min(h * 0.19, w * 0.12);
        lay.inX = -30;
        lay.outX = w * 0.74;
      } else {
        lay.C = { x: w * 0.5, y: h * (mode === "evidence" ? 0.37 : mode === "hero" ? 0.46 : 0.43) };
        lay.R = Math.min(w * 0.16, h * 0.14);
      }
      var n = mob ? 150 : 260;
      if (nodes.length !== n) buildCore(n);
      buildStreams();
      buildDom();
    }

    function buildStreams() {
      var Cc = lay.C;
      var R = lay.R;
      var w = lay.w;
      var h = lay.h;
      streams = [];
      outs = [];
      var K = mode === "evidence" ? inputs.length : lay.mob ? 7 : 9;
      for (var i = 0; i < K; i++) {
        var f = K > 1 ? i / (K - 1) : 0.5;
        var a = (f - 0.5) * 1.5;
        var p0, p1, p2, p3, g = null;
        if (!lay.mob) {
          if (mode === "evidence") {
            g = { x: w * 0.03 + 4, y: h * (0.13 + f * 0.74) };
            p0 = { x: w * 0.03 + 176, y: g.y };
            p1 = { x: w * 0.22, y: p0.y };
          } else {
            p0 = { x: lay.inX, y: h * (0.08 + 0.84 * f) };
            p1 = { x: V.lerp(lay.inX, Cc.x, 0.45), y: p0.y };
          }
          p2 = { x: V.lerp(p1.x, Cc.x, 0.55), y: V.lerp(p0.y, Cc.y, 0.75) };
          p3 = { x: Cc.x - Math.cos(a) * R * 0.95, y: Cc.y + Math.sin(a) * R * 0.95 };
        } else {
          if (mode === "evidence") {
            g = { x: w * (0.125 + 0.25 * (i % 4)), y: i < 4 ? 44 : 112 };
            p0 = { x: g.x, y: 158 };
          } else {
            p0 = { x: w * (0.04 + 0.92 * f), y: 20 };
          }
          p1 = { x: p0.x, y: p0.y + 40 };
          p2 = { x: V.lerp(p0.x, Cc.x, 0.7), y: V.lerp(p0.y, Cc.y - R, 0.7) };
          p3 = { x: Cc.x + Math.sin(a) * R * 0.95, y: Cc.y - Math.cos(a) * R * 0.95 };
        }
        streams.push({ p: [p0, p1, p2, p3], ph: rand(), type: inputs.length ? inputs[i % inputs.length][0] : "doc", g: g });
      }
      if (mode === "evidence") {
        if (!lay.mob) {
          lay.dsur = { x: w * 0.7, y: Cc.y + 40 };
          lay.gate = { x: w * 0.7 + 168, y: Cc.y - 178 };
        } else {
          lay.gate = { x: w * 0.5, y: h * 0.61 };
          lay.dsur = { x: w * 0.5, y: h * 0.655 };
        }
        var G = lay.gate;
        var s1 = lay.mob ? { x: Cc.x, y: Cc.y + R } : { x: Cc.x + R * 0.8, y: Cc.y - R * 0.6 };
        var c1 = lay.mob ? { x: Cc.x, y: Cc.y + R * 1.6 } : { x: Cc.x + R * 1.9, y: G.y };
        outs.push({ p: [s1, c1, { x: G.x - (lay.mob ? 0 : 160), y: G.y - (lay.mob ? 40 : 0) }, G] });
        var dEnd = lay.mob ? { x: lay.dsur.x, y: lay.dsur.y + 4 } : { x: G.x, y: lay.dsur.y - 150 };
        outs.push({ p: [G, { x: G.x, y: (G.y + dEnd.y) / 2 }, { x: dEnd.x, y: (G.y + dEnd.y) / 2 }, dEnd] });
      } else {
        var n = outcomes.length;
        lay.outPos = [];
        for (var k = 0; k < n; k++) {
          var pos;
          if (!lay.mob) pos = { x: lay.outX, y: h * (0.2 + (0.6 * k) / Math.max(1, n - 1)) };
          else pos = { x: w * ((k + 0.5) / n), y: h * 0.86 };
          lay.outPos.push(pos);
          var st = lay.mob ? { x: Cc.x + (k - (n - 1) / 2) * R * 0.3, y: Cc.y + R * 0.9 } : { x: Cc.x + R * 0.92, y: Cc.y + (k - (n - 1) / 2) * R * 0.28 };
          var end = lay.mob ? { x: pos.x, y: pos.y - 14 } : { x: pos.x - 8, y: pos.y };
          outs.push({ p: [st, lay.mob ? { x: st.x, y: st.y + 50 } : { x: st.x + R * 0.8, y: st.y }, lay.mob ? { x: end.x, y: end.y - 40 } : { x: end.x - 60, y: end.y }, end] });
        }
      }
    }

    function buildDom() {
      ov.innerHTML = "";
      dom = { caps: [], outs: [], lit: dom.lit || [] };
      if (mode === "intro") {
        var plate = V.el("div", "lx-plate", ov);
        V.el("b", null, plate, cfg.platform.name || "");
        V.el("span", null, plate, V.tokens(cfg.platform.endorsement || ""));
        plate.style.left = lay.C.x + "px";
        plate.style.top = lay.C.y + lay.R * (lay.mob ? 1.62 : 1.72) + "px";
      }
      if (mode === "intro" && LB.protection) {
        var sh = V.el("div", "lx-shield", ov);
        sh.innerHTML = V.shieldSVG;
        sh.appendChild(document.createTextNode(LB.protection));
        var a = -2.25;
        sh.style.left = lay.C.x + Math.cos(a) * lay.R * 1.34 + "px";
        sh.style.top = lay.C.y + Math.sin(a) * lay.R * 1.34 + "px";
      }
      capLabels.forEach(function (c) {
        dom.caps.push(V.chip(c, ov, mode === "evidence" ? "lx-chip--brand" : ""));
      });
      if (mode === "evidence") {
        inputs.forEach(function (src, j) {
          var s = streams[j];
          var lab = V.el("div", "lx-src", ov, src[1]);
          var gp = s.g;
          if (!lay.mob) {
            lab.style.left = lay.w * 0.03 + 26 + "px";
            lab.style.top = gp.y + "px";
          } else {
            lab.classList.add("lx-src--stack");
            lab.style.left = gp.x + "px";
            lab.style.top = gp.y + 24 + "px";
          }
        });
        var gate = V.el("div", "lx-gate", ov);
        gate.innerHTML = V.reviewSVG;
        var gt = V.el("div", null, gate, LB.humanReview || "");
        V.el("small", null, gt, LB.humanGovernance || "");
        gate.style.left = lay.gate.x + "px";
        gate.style.top = lay.gate.y + "px";
        dom.gate = gate;
        var panel = V.dossierPanel(ov);
        panel.style.left = lay.dsur.x + "px";
        panel.style.top = lay.dsur.y + "px";
        dom.dsur = panel;
      } else {
        outcomes.forEach(function (o, k) {
          var el = V.el("div", "lx-out" + (lay.mob ? " lx-out--stack" : ""), ov);
          V.el("i", null, el);
          V.el("span", null, el, o[1]);
          el.style.left = lay.outPos[k].x + "px";
          el.style.top = lay.outPos[k].y + "px";
          dom.outs.push(el);
        });
      }
      if (mode === "intro" && !lay.mob && LB.notSequence) V.el("p", "lx-legend", ov, LB.notSequence);
    }

    function step(dt) {
      time += dt;
      spawnT -= dt;
      if (spawnT <= 0 && streams.length) {
        spawnT = (lay.mob ? 1.3 : 0.75) * (0.7 + rand() * 0.6);
        var si = Math.floor(rand() * streams.length);
        objects.push({ s: si, t0: time, dur: 4.6 + rand() * 1.6, type: streams[si].type });
      }
      objects = objects.filter(function (o) {
        if ((time - o.t0) / o.dur >= 1) {
          var e = streams[o.s].p[3];
          absorbs.push({ x: e.x, y: e.y, t: time });
          return false;
        }
        return true;
      });
      absorbs = absorbs.filter(function (a) {
        return time - a.t < 1.8;
      });
      packetT -= dt;
      if (packetT <= 0 && outs.length) {
        packetT = mode === "evidence" ? 2.2 : 1.25;
        var k = mode === "evidence" ? 0 : Math.floor(rand() * outs.length);
        packets.push({ k: k, t0: time, dur: mode === "evidence" ? 2.8 : 1.6 });
      }
      packets = packets.filter(function (p) {
        if ((time - p.t0) / p.dur >= 1) {
          if (mode === "evidence") {
            if (dom.dsur) dom.dsur.advance();
          } else dom.lit[p.k] = time + 2.4;
          return false;
        }
        return true;
      });
      litCapT -= dt;
      if (litCapT <= 0 && dom.caps.length) {
        litCapT = 1.5;
        var nxt = Math.floor(rand() * dom.caps.length);
        litCap = nxt === litCap ? (nxt + 1) % dom.caps.length : nxt;
      }
    }

    function curve(ctx, s) {
      ctx.moveTo(s.p[0].x, s.p[0].y);
      ctx.bezierCurveTo(s.p[1].x, s.p[1].y, s.p[2].x, s.p[2].y, s.p[3].x, s.p[3].y);
    }
    function bp(s, u) {
      return V.bez(s.p[0], s.p[1], s.p[2], s.p[3], u);
    }

    function draw() {
      var ctx = S.ctx;
      var w = lay.w;
      var h = lay.h;
      var Cc = lay.C;
      var R = lay.R;
      pointer.step(0.05);
      ctx.clearRect(0, 0, w, h);

      V.glow(ctx, Cc.x, Cc.y, R * 3.2, 0.2);

      // foundation
      var py = Cc.y + R * 1.2;
      var pg = ctx.createRadialGradient(Cc.x, py, 0, Cc.x, py, R * 1.6);
      pg.addColorStop(0, V.rgba("cyan", 0.28));
      pg.addColorStop(1, V.rgba("cyan", 0));
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(Cc.x, py, R * 1.6, R * 0.34, 0, 0, TAU);
      ctx.fill();
      [1.0, 1.32, 1.66].forEach(function (m, i) {
        ctx.strokeStyle = V.rgba("ice", [0.55, 0.3, 0.14][i]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(Cc.x, py, R * m, R * 0.22 * m, 0, 0, TAU);
        ctx.stroke();
      });
      var sweep = (time * 0.6) % TAU;
      ctx.strokeStyle = "rgba(190,245,255,0.7)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(Cc.x, py, R * 1.32, R * 0.29, 0, sweep, sweep + 0.7);
      ctx.stroke();

      // input streams + particles
      ctx.lineWidth = 1;
      ctx.strokeStyle = V.edge(0.13);
      ctx.beginPath();
      streams.forEach(function (s) {
        curve(ctx, s);
      });
      ctx.stroke();
      ctx.globalCompositeOperation = "lighter";
      streams.forEach(function (s) {
        for (var k = 0; k < (lay.mob ? 2 : 4); k++) {
          var u = (time * 0.16 + s.ph + k * 0.25) % 1;
          var p = bp(s, u);
          V.particle(ctx, p.x, p.y, Math.sin(Math.PI * u) * 0.8);
        }
      });
      ctx.globalCompositeOperation = "source-over";

      if (mode === "evidence") {
        streams.forEach(function (s) {
          if (!lay.mob) {
            ctx.strokeStyle = V.edge(0.18);
            ctx.setLineDash([2, 4]);
            ctx.beginPath();
            ctx.moveTo(s.g.x + 150, s.p[0].y);
            ctx.lineTo(s.p[0].x, s.p[0].y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          V.glyph(ctx, s.type, s.g.x, s.g.y, lay.mob ? 28 : 36, 1, true);
        });
      }

      objects.forEach(function (o) {
        var s = streams[o.s];
        var u = (time - o.t0) / o.dur;
        var e = Math.pow(u, 1.25);
        var p = bp(s, e);
        var size = V.lerp(mode === "evidence" ? 34 : lay.mob ? 32 : 40, 10, e * e);
        var a = u < 0.08 ? u / 0.08 : u > 0.8 ? (1 - u) / 0.2 : 1;
        if (mode === "hero" && !lay.mob) a *= V.smooth(0, 0.25, u); // fade in behind the headline
        V.glyph(ctx, o.type, p.x, p.y, size, a, true);
      });

      // protection halo - the same teal signature in every view
      ctx.strokeStyle = V.rgba("teal", 0.3);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(Cc.x, Cc.y, R * 1.34, 0, TAU);
      ctx.stroke();
      var ha = time * 0.4;
      ctx.strokeStyle = "rgba(95,230,215,0.75)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(Cc.x, Cc.y, R * 1.34, ha, ha + 0.9);
      ctx.stroke();
      var pp = (time % 3) / 3;
      ctx.strokeStyle = V.rgba("teal", (0.35 * (1 - pp)).toFixed(3));
      ctx.beginPath();
      ctx.arc(Cc.x, Cc.y, R * (1.34 + 0.25 * pp), 0, TAU);
      ctx.stroke();

      // the core lattice
      var cg = ctx.createRadialGradient(Cc.x, Cc.y, 0, Cc.x, Cc.y, R * 1.15);
      cg.addColorStop(0, "rgba(40,190,230,0.35)");
      cg.addColorStop(0.7, "rgba(8,120,176,0.12)");
      cg.addColorStop(1, "rgba(8,120,176,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(Cc.x, Cc.y, R * 1.15, 0, TAU);
      ctx.fill();
      var ay = time * 0.16 + pointer.x * 0.7;
      var ax = 0.32 + pointer.y * 0.35 + Math.sin(time * 0.2) * 0.06;
      var cy = Math.cos(ay);
      var sy = Math.sin(ay);
      var cx = Math.cos(ax);
      var sx = Math.sin(ax);
      nodes.forEach(function (n) {
        var br = 1 + 0.035 * Math.sin(time * 0.8 + n.ph);
        var x = n.x * cy + n.z * sy;
        var z = -n.x * sy + n.z * cy;
        var y = n.y * cx - z * sx;
        z = n.y * sx + z * cx;
        var sc = (3 / (3 - z)) * br;
        n.sx = Cc.x + x * R * sc;
        n.sy = Cc.y + y * R * sc;
        n.d = (z + 1) / 2;
        var boost = 0;
        for (var i = 0; i < absorbs.length; i++) {
          var ab = absorbs[i];
          var dx = n.sx - ab.x;
          var dy = n.sy - ab.y;
          boost += Math.exp(-(dx * dx + dy * dy) / (2 * R * R * 0.2)) * (1 - (time - ab.t) / 1.8);
        }
        n.b = Math.min(1, boost);
      });
      ctx.lineWidth = 0.7;
      edges.forEach(function (e) {
        var a = nodes[e[0]];
        var b = nodes[e[1]];
        var d = (a.d + b.d) / 2;
        ctx.strokeStyle = V.edge(0.05 + 0.3 * d * d + 0.4 * Math.max(a.b, b.b));
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      });
      ctx.globalCompositeOperation = "lighter";
      nodes.forEach(function (n) {
        V.node(ctx, n.sx, n.sy, n.d, n.b);
      });
      ctx.globalCompositeOperation = "source-over";

      // outputs
      ctx.strokeStyle = V.edge(0.18);
      ctx.lineWidth = 1;
      ctx.beginPath();
      outs.forEach(function (s) {
        curve(ctx, s);
      });
      ctx.stroke();
      packets.forEach(function (p) {
        var u = (time - p.t0) / p.dur;
        var s = mode === "evidence" ? (u < 0.5 ? outs[0] : outs[1]) : outs[p.k];
        var uu = mode === "evidence" ? V.ease(u < 0.5 ? u * 2 : (u - 0.5) * 2) : V.ease(u);
        var pt = bp(s, uu);
        var type = mode === "evidence" ? "dsur" : outcomes[p.k] ? outcomes[p.k][0] : "doc";
        var a = u < 0.1 ? u / 0.1 : u > 0.9 ? (1 - u) / 0.1 : 1;
        V.glow(ctx, pt.x, pt.y, 22, 0.4 * a);
        V.glyph(ctx, type, pt.x, pt.y, 26, a, true);
        if (mode === "evidence" && dom.gate) dom.gate.classList.toggle("is-lit", Math.abs(u - 0.5) < 0.08);
      });

      // DOM: capability chips orbit together (front brighter, hidden behind the core)
      var n = dom.caps.length;
      var rx = R * (lay.mob ? 1.72 : mode === "evidence" ? 1.72 : 1.95);
      var ry = R * (lay.mob ? 0.8 : 0.6);
      dom.caps.forEach(function (el, i) {
        var a = (i / n) * TAU + (V.reduced ? 0.4 : time * 0.09);
        var z = Math.sin(a);
        var x = Cc.x + Math.cos(a) * rx;
        var y = Cc.y + R * 0.1 + z * ry;
        var op = 0.4 + 0.6 * ((z + 1) / 2);
        if (z < 0 && Math.abs(x - Cc.x) < R * 1.25) op *= Math.max(0, (Math.abs(x - Cc.x) - R * 0.8) / (R * 0.45));
        if (lay.mob) op *= V.smooth(-0.05, 0.35, z);
        el.style.transform = "translate(-50%,-50%) translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + (0.86 + 0.18 * ((z + 1) / 2)).toFixed(3) + ")";
        el.style.opacity = op.toFixed(3);
        el.style.zIndex = z > 0 ? 3 : 1;
        el.classList.toggle("is-lit", i === litCap);
      });
      dom.outs.forEach(function (el, i) {
        el.classList.toggle("is-lit", (dom.lit[i] || 0) > time);
      });
    }

    var S = V.canvas(canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    var runner = V.run(root, step, draw, 180);
  });
})();
