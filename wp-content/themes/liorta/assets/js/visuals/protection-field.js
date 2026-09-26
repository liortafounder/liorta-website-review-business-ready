/*
 * Protected Intelligence Field - intelligence working on varied information
 * inside a layered, governed boundary. Relationships stay traceable through
 * the boundary to organized outcomes; a human-oversight presence sits on it.
 * Communicates principles only (protection, control, traceability,
 * governance, oversight) - never a mechanism or a processing order.
 * Mount: <div data-liorta-visual="protection" [data-mode="rich"]>
 */
(function () {
  "use strict";
  var V = window.LiortaVisuals;
  var TAU = Math.PI * 2;

  V.register("protection", function (root, opts) {
    var rich = opts.mode === "rich";
    var LB = V.cfg.labels || {};
    var P = (V.cfg.content && V.cfg.content.protection) || { principles: [] };
    var canvas = V.el("canvas", "lx-canvas", root);
    canvas.setAttribute("aria-hidden", "true");
    var ov = V.el("div", "lx-overlay", root);
    var pointer = V.pointer(root);
    var rand = V.rng(11);
    var time = 0;
    var lay = {};
    var nodes = [];
    var docs = [];
    var arrivals = [];
    var traces = [];
    var arriveT = 0;
    var traceT = 0;
    var hot = -1;
    var dom = {};
    var TYPES = ["doc", "table", "summary", "book", "safety", "chart", "listing", "regulatory"];

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 640;
      lay.C = { x: S.w * (rich && !lay.mob ? 0.5 : 0.5), y: S.h * 0.5 };
      lay.rx = Math.min(S.w * (lay.mob ? 0.4 : rich ? 0.26 : 0.36), S.h * (rich ? 0.58 : 0.66));
      lay.ry = lay.rx * 0.62;
      var n = lay.mob ? 60 : 110;
      nodes = [];
      for (var i = 0; i < n; i++) {
        var a = rand() * TAU;
        var r = Math.sqrt(rand()) * 0.58;
        nodes.push({ a: a, r: r, z: rand(), ph: rand() * TAU, sp: 0.04 + rand() * 0.06 });
      }
      docs = [];
      for (var j = 0; j < (lay.mob ? 5 : 8); j++) docs.push({ a: (j / 8) * TAU + rand() * 0.4, r: 0.3 + rand() * 0.25, type: TYPES[j % TYPES.length], sp: (rand() - 0.5) * 0.12 });
      buildDom();
    }

    function buildDom() {
      ov.innerHTML = "";
      dom = { principles: [] };
      var hum = V.el("div", "pf-human", ov);
      hum.innerHTML = V.reviewSVG;
      V.el("span", null, hum, LB.humanOversight || "");
      dom.human = hum;
      if (rich) {
        (P.principles || []).forEach(function (p, i) {
          var b = V.el("button", "pf-principle", ov);
          b.type = "button";
          V.el("b", null, b, p.title);
          V.el("span", null, b, p.line);
          b.addEventListener("mouseenter", function () {
            hot = i;
          });
          b.addEventListener("mouseleave", function () {
            hot = -1;
          });
          b.addEventListener("focus", function () {
            hot = i;
          });
          b.addEventListener("blur", function () {
            hot = -1;
          });
          dom.principles.push(b);
        });
      } else {
        ov.setAttribute("aria-hidden", "true");
      }
    }

    // Boundary point at angle a on layer k (0 inner … 2 outer).
    function bpt(a, k) {
      var s = 1 + k * 0.13;
      var wob = 1 + 0.012 * Math.sin(a * 3 + time * 0.7 + k);
      return { x: lay.C.x + Math.cos(a) * lay.rx * s * wob + pointer.x * (3 - k) * 3, y: lay.C.y + Math.sin(a) * lay.ry * s * wob + pointer.y * (3 - k) * 2 };
    }

    function step(dt) {
      time += dt;
      arriveT -= dt;
      if (arriveT <= 0) {
        arriveT = lay.mob ? 1.8 : 1.1;
        var a = rand() * TAU;
        arrivals.push({ a: a, t0: time, type: TYPES[Math.floor(rand() * TYPES.length)] });
      }
      arrivals = arrivals.filter(function (o) {
        return time - o.t0 < 3.2;
      });
      traceT -= dt;
      if (traceT <= 0) {
        traceT = 1.6;
        traces.push({ from: Math.floor(rand() * docs.length), side: rand() < 0.5 ? -1 : 1, t0: time, y: (rand() - 0.5) * 0.9 });
      }
      traces = traces.filter(function (t) {
        return time - t.t0 < 3.4;
      });
      docs.forEach(function (d) {
        d.a += d.sp * dt;
      });
    }

    function docPos(d) {
      return { x: lay.C.x + Math.cos(d.a) * lay.rx * d.r, y: lay.C.y + Math.sin(d.a) * lay.ry * d.r };
    }

    function draw() {
      var ctx = S.ctx;
      var C = lay.C;
      pointer.step(0.05);
      ctx.clearRect(0, 0, lay.w, lay.h);
      V.glow(ctx, C.x, C.y, lay.rx * 1.3, 0.16);

      // layered governed boundary: three soft shells + a slow light sweep
      for (var k = 2; k >= 0; k--) {
        ctx.beginPath();
        for (var i = 0; i <= 96; i++) {
          var p = bpt((i / 96) * TAU, k);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        var emph = hot >= 0 ? 0.08 : 0;
        ctx.strokeStyle = V.rgba("teal", [0.55, 0.3, 0.16][k] + emph);
        ctx.lineWidth = k === 0 ? 1.6 : 1;
        ctx.stroke();
        if (k === 0) {
          ctx.fillStyle = V.rgba("teal", 0.035);
          ctx.fill();
        }
      }
      var sw = (time * 0.35) % TAU;
      ctx.strokeStyle = "rgba(120,240,225,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var s2 = 0; s2 <= 24; s2++) {
        var ps = bpt(sw + (s2 / 24) * 0.8, 0);
        if (s2 === 0) ctx.moveTo(ps.x, ps.y);
        else ctx.lineTo(ps.x, ps.y);
      }
      ctx.stroke();

      // arriving information crosses the boundary at controlled points
      arrivals.forEach(function (o) {
        var u = (time - o.t0) / 3.2;
        var gate = bpt(o.a, 0);
        var out = { x: C.x + Math.cos(o.a) * lay.rx * 1.75, y: C.y + Math.sin(o.a) * lay.ry * 1.9 };
        var inn = { x: C.x + Math.cos(o.a) * lay.rx * 0.35, y: C.y + Math.sin(o.a) * lay.ry * 0.35 };
        var e = V.ease(u);
        var x = e < 0.5 ? V.lerp(out.x, gate.x, e * 2) : V.lerp(gate.x, inn.x, (e - 0.5) * 2);
        var y = e < 0.5 ? V.lerp(out.y, gate.y, e * 2) : V.lerp(gate.y, inn.y, (e - 0.5) * 2);
        var a = u < 0.1 ? u / 0.1 : u > 0.85 ? (1 - u) / 0.15 : 1;
        var near = Math.max(0, 1 - Math.abs(e - 0.5) * 6);
        if (near > 0) {
          V.glow(ctx, gate.x, gate.y, 26, 0.5 * near, "teal");
          ctx.strokeStyle = V.rgba("teal", 0.8 * near);
          ctx.lineWidth = 2;
          ctx.beginPath();
          var g0 = bpt(o.a - 0.12, 0);
          var g1 = bpt(o.a + 0.12, 0);
          ctx.moveTo(g0.x, g0.y);
          ctx.quadraticCurveTo(gate.x, gate.y, g1.x, g1.y);
          ctx.stroke();
        }
        V.glyph(ctx, o.type, x, y, V.lerp(26, 16, e), a * 0.95, true);
      });

      // intelligence inside: Liorta nodes + relationships
      var pts = nodes.map(function (n) {
        var a = n.a + time * n.sp;
        var r = n.r * (1 + 0.04 * Math.sin(time + n.ph));
        return { x: C.x + Math.cos(a) * lay.rx * r + pointer.x * 6 * n.z, y: C.y + Math.sin(a) * lay.ry * r + pointer.y * 4 * n.z, z: n.z };
      });
      ctx.lineWidth = 0.7;
      for (var a1 = 0; a1 < pts.length; a1++) {
        for (var b1 = a1 + 1; b1 < pts.length; b1++) {
          var dx = pts[a1].x - pts[b1].x;
          var dy = pts[a1].y - pts[b1].y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 1600) {
            ctx.strokeStyle = V.edge(0.22 * (1 - d2 / 1600));
            ctx.beginPath();
            ctx.moveTo(pts[a1].x, pts[a1].y);
            ctx.lineTo(pts[b1].x, pts[b1].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = "lighter";
      pts.forEach(function (p) {
        V.node(ctx, p.x, p.y, 0.3 + 0.7 * p.z, 0);
      });
      ctx.globalCompositeOperation = "source-over";

      docs.forEach(function (d) {
        var p = docPos(d);
        V.glyph(ctx, d.type, p.x, p.y, lay.mob ? 20 : 26, 0.9, true);
      });

      // traceable relationships continue through the boundary to outcomes
      traces.forEach(function (t) {
        var d = docs[t.from];
        if (!d) return;
        var p0 = docPos(d);
        var edgeA = t.side > 0 ? 0 : Math.PI;
        var ex = bpt(edgeA + t.y * 0.6, 2);
        var end = { x: C.x + t.side * lay.rx * 1.72, y: ex.y + t.y * 10 };
        if (lay.mob) end.x = V.clamp(end.x, 24, lay.w - 24);
        var u = V.clamp((time - t.t0) / 1.6, 0, 1);
        var fade = time - t.t0 > 2.6 ? 1 - (time - t.t0 - 2.6) / 0.8 : 1;
        ctx.strokeStyle = V.rgba("cyan", 0.55 * fade);
        ctx.setLineDash([3, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        var mid = V.bez(p0, { x: ex.x, y: p0.y }, { x: ex.x, y: end.y }, end, u);
        ctx.bezierCurveTo(V.lerp(p0.x, ex.x, u), p0.y, V.lerp(p0.x, ex.x, u), V.lerp(p0.y, end.y, u), mid.x, mid.y);
        ctx.stroke();
        ctx.setLineDash([]);
        V.glow(ctx, p0.x, p0.y, 16, 0.5 * fade);
        if (u >= 1) {
          V.glow(ctx, end.x, end.y, 22, 0.5 * fade);
          V.glyph(ctx, "dsur", end.x, end.y, 22, fade, true);
        }
      });

      // human oversight sits on the boundary, connected to it
      var hp = bpt(-Math.PI / 2 + 0.55, 1);
      dom.human.style.left = hp.x + "px";
      dom.human.style.top = hp.y + "px";
      var pulse = (time % 2.8) / 2.8;
      ctx.strokeStyle = V.rgba("teal", 0.5 * (1 - pulse));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 18 + pulse * 22, 0, TAU);
      ctx.stroke();

      if (rich && dom.principles.length) {
        var n = dom.principles.length;
        dom.principles.forEach(function (el, i) {
          var ang = -Math.PI / 2 + ((i + 0.5) / n) * TAU;
          var p = lay.mob ? null : bpt(ang, 2);
          if (p) {
            var ox = Math.cos(ang) * 30;
            el.style.left = p.x + ox + "px";
            el.style.top = p.y + Math.sin(ang) * 26 + "px";
            el.classList.toggle("is-right", Math.cos(ang) > 0.2);
            el.classList.toggle("is-left", Math.cos(ang) < -0.2);
          }
          el.classList.toggle("is-on", i === hot);
        });
      }
    }

    var runner;
    var S = V.canvas(canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    runner = V.run(root, step, draw, 120);
  });
})();
