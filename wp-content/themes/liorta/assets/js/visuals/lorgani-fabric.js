/*
 * LorganiFabric — the "Fabric View": the platform as one flowing intelligence
 * surface; information lands on it and becomes related where it lands; each
 * application rises from its own region of the same fabric.
 * Mount: <div data-liorta-visual="fabric" [data-focus="<application key>"] [data-plate="0"]>
 * Applications, capability words and labels come from LIORTA_BRAND.
 * Emits "liorta:application" (detail: {key}) when the visitor selects an application.
 */
(function () {
  "use strict";
  var V = window.LiortaVisuals;
  var TAU = Math.PI * 2;

  V.register("fabric", function (root, opts) {
    var cfg = V.cfg;
    var LB = cfg.labels || {};
    var APPS = cfg.applications || [];
    var CAPS = (cfg.capabilities || []).map(function (c) {
      return c.label;
    });
    var SOURCES = (cfg.content && cfg.content.inputs) || [["doc"]];
    var canvas = V.el("canvas", "lx-canvas", root);
    canvas.setAttribute("aria-hidden", "true");
    var ov = V.el("div", "lx-overlay", root);
    var pointer = V.pointer(root);
    var rand = V.rng(21);
    var time = 0;
    var lay = {};
    var drops = [];
    var ripples = [];
    var knits = [];
    var dropT = 0;
    var focusKey = opts.focus || "";
    var active = Math.max(
      0,
      APPS.findIndex(function (a) {
        return a.key === focusKey;
      })
    );
    var userPicked = !!focusKey;
    var regionT = 0;
    var dom = {};

    // Regions spread across the fabric for however many applications are configured.
    var REG = APPS.map(function (a, i) {
      var n = APPS.length;
      var u = n === 1 ? 0 : -0.56 + (1.12 * i) / (n - 1);
      return { u: u, v: n > 2 && i % 2 === 1 ? 0.5 : 0.34 };
    });
    var WORDS = CAPS.map(function (c, i) {
      return { text: c, u: -0.9 + (i / Math.max(1, CAPS.length - 1)) * 1.8, v: [0.18, 0.82, 0.3, 0.9, 0.12, 0.7, 0.25][i % 7], sp: 0.018 + 0.01 * (i % 3) };
    });

    // External controls (the Applications page tabs) select a region.
    root.addEventListener("liorta:fabric-select", function (e) {
      var i = APPS.findIndex(function (x) {
        return x.key === e.detail;
      });
      if (i >= 0) {
        userPicked = true;
        select(i, false);
      }
    });

    function layout(S) {
      lay.w = S.w;
      lay.h = S.h;
      lay.mob = S.w < 768;
      lay.NX = lay.mob ? 26 : 44;
      lay.NZ = lay.mob ? 12 : 18;
      lay.horizon = S.h * (lay.mob ? 0.3 : 0.36);
      lay.f = lay.mob ? S.h * 0.55 : S.w * 0.33;
      lay.X = lay.mob ? 1.3 : 2.3;
      buildDom();
    }

    function height(u, v) {
      var y = 0.07 * Math.sin(u * 3 + time * 0.55) * Math.cos(v * 4 - time * 0.4) + 0.035 * Math.sin((u + v) * 6 + time * 0.8);
      REG.forEach(function (r, i) {
        var du = u - r.u;
        var dv = v - r.v;
        y += (i === active ? 0.1 : 0.05) * Math.exp(-(du * du + dv * dv) / 0.02);
      });
      ripples.forEach(function (rp) {
        var du = (u - rp.u) * 2.2;
        var dv = (v - rp.v) * 3;
        var d = Math.sqrt(du * du + dv * dv);
        var age = time - rp.t;
        y += 0.09 * Math.exp(-((d - age * 0.9) * (d - age * 0.9)) / 0.01) * Math.max(0, 1 - age / 2.2);
      });
      return y;
    }

    function project(u, v, y) {
      var z = 1.25 + v * 3;
      return {
        x: lay.w / 2 + ((u * lay.X - pointer.x * 0.18) * lay.f) / z,
        y: lay.horizon + ((1 + pointer.y * 0.12 - y) * lay.f) / z,
        s: 1.25 / z,
      };
    }

    function select(i, fromUser) {
      if (i < 0 || i >= APPS.length) return;
      active = i;
      if (fromUser) {
        userPicked = true;
        root.dispatchEvent(new CustomEvent("liorta:application", { bubbles: true, detail: { key: APPS[i].key } }));
      }
      ripples.push({ u: REG[i].u, v: REG[i].v, t: time });
      dom.regions.forEach(function (b, k) {
        b.setAttribute("aria-pressed", k === i ? "true" : "false");
      });
      if (dom.focus) {
        var a = APPS[i];
        dom.focus.innerHTML = "";
        V.el("b", null, dom.focus, a.name + " · " + a.fullName);
        V.el("span", null, dom.focus, V.tokens(LB.regionOf || ""));
        var ul = V.el("ul", null, dom.focus);
        (a.outputs || []).forEach(function (o) {
          V.el("li", null, ul, o);
        });
      }
    }

    function buildDom() {
      ov.innerHTML = "";
      dom = { regions: [], words: [] };
      if (opts.plate !== "0") {
        var co = V.el("div", "lx-company lx-company--light", ov);
        co.innerHTML = V.markSVG(V.C.blue);
        V.el("span", null, co, cfg.company.name || "");
        co.style.left = lay.w / 2 + "px";
        co.style.top = (lay.mob ? 20 : 30) + "px";
        co.setAttribute("aria-hidden", "true");
        var plate = V.el("div", "lx-plate lx-plate--light", ov);
        plate.setAttribute("aria-hidden", "true");
        V.el("b", null, plate, cfg.platform.name || "");
        V.el("span", null, plate, LB.fabric || "");
        plate.style.left = lay.w / 2 + "px";
        plate.style.top = (lay.mob ? 44 : 56) + "px";
      }
      APPS.forEach(function (a, i) {
        var b = V.el("button", "lx-region", ov);
        b.type = "button";
        V.el("b", null, b, a.name);
        V.el("small", null, b, a.fullName);
        var ul = V.el("ul", null, b);
        (a.outputs || []).forEach(function (o) {
          V.el("li", null, ul, o);
        });
        b.addEventListener("click", function () {
          select(i, true);
        });
        b.addEventListener("focus", function () {
          select(i, true);
        });
        if (V.fine) {
          b.addEventListener("mouseenter", function () {
            select(i, true);
          });
        }
        dom.regions.push(b);
      });
      WORDS.forEach(function (wd) {
        var el = V.el("div", "lx-word", ov, wd.text);
        el.setAttribute("aria-hidden", "true");
        dom.words.push(el);
      });
      if (LB.protection) {
        var sh = V.el("div", "lx-shield lx-shield--light", ov);
        sh.innerHTML = V.shieldSVG;
        sh.appendChild(document.createTextNode(LB.protection + (LB.humanGovernance ? " · " + LB.humanGovernance : "")));
        sh.setAttribute("aria-hidden", "true");
        dom.shield = sh;
      }
      if (lay.mob) dom.focus = V.el("div", "lx-focus lx-focus--light", ov);
      select(active, false);
    }

    function step(dt) {
      time += dt;
      dropT -= dt;
      if (dropT <= 0) {
        dropT = (lay.mob ? 1.6 : 1.0) * (0.7 + rand() * 0.6);
        drops.push({ u: -0.85 + rand() * 1.7, v: 0.1 + rand() * 0.75, t0: time, dur: 1.9 + rand() * 0.6, type: SOURCES[Math.floor(rand() * SOURCES.length)][0] });
      }
      drops = drops.filter(function (d) {
        if (time - d.t0 >= d.dur) {
          ripples.push({ u: d.u, v: d.v, t: time });
          knits.push({ u: d.u, v: d.v, t: time });
          return false;
        }
        return true;
      });
      ripples = ripples.filter(function (r) {
        return time - r.t < 2.2;
      });
      knits = knits.filter(function (k) {
        return time - k.t < 3.2;
      });
      regionT -= dt;
      if (!userPicked && regionT <= 0 && APPS.length) {
        regionT = 4.5;
        select((active + 1) % APPS.length, false);
      }
      WORDS.forEach(function (wd) {
        wd.u += wd.sp * dt;
        if (wd.u > 1.05) wd.u = -1.05;
      });
    }

    function draw() {
      var ctx = S.ctx;
      var w = lay.w;
      var h = lay.h;
      pointer.step(0.05);
      ctx.clearRect(0, 0, w, h);
      var NX = lay.NX;
      var NZ = lay.NZ;
      var pts = [];
      var i, j, u, v, p;
      for (j = 0; j < NZ; j++) {
        v = 1 - j / (NZ - 1);
        var row = [];
        for (i = 0; i < NX; i++) {
          u = -1 + (i / (NX - 1)) * 2;
          p = project(u, v, height(u, v));
          var em = 0;
          REG.forEach(function (r, ri) {
            var du = u - r.u;
            var dv = v - r.v;
            em = Math.max(em, (ri === active ? 1 : 0.35) * Math.exp(-(du * du + dv * dv) / 0.03));
          });
          knits.forEach(function (k) {
            var du = u - k.u;
            var dv = v - k.v;
            em = Math.max(em, Math.exp(-(du * du + dv * dv) / 0.008) * (1 - (time - k.t) / 3.2));
          });
          p.em = em;
          row.push(p);
        }
        pts.push(row);
      }
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, V.C.blue);
      grad.addColorStop(0.5, V.C.cyan);
      grad.addColorStop(1, V.C.teal);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      for (j = 0; j < NZ; j++) {
        ctx.globalAlpha = 0.1 + 0.38 * (j / (NZ - 1));
        ctx.beginPath();
        for (i = 0; i < NX; i++) {
          p = pts[j][i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.16;
      ctx.beginPath();
      for (i = 0; i < NX; i++) {
        for (j = 0; j < NZ; j++) {
          p = pts[j][i];
          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // protected perimeter in the shared protection teal
      ctx.strokeStyle = V.rgba("teal", 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pts[0][0].x, pts[0][0].y);
      for (j = 1; j < NZ; j++) ctx.lineTo(pts[j][0].x, pts[j][0].y);
      for (i = 1; i < NX; i++) ctx.lineTo(pts[NZ - 1][i].x, pts[NZ - 1][i].y);
      for (j = NZ - 2; j >= 0; j--) ctx.lineTo(pts[j][NX - 1].x, pts[j][NX - 1].y);
      ctx.stroke();
      if (dom.shield) {
        var fr = pts[NZ - 1][Math.floor(NX * (lay.mob ? 0.5 : 0.18))];
        var half = dom.shield.offsetWidth / 2 + 8;
        dom.shield.style.left = V.clamp(fr.x, half, lay.w - half) + "px";
        dom.shield.style.top = fr.y + 18 + "px";
      }

      knits.forEach(function (k) {
        var age = (time - k.t) / 3.2;
        var c = project(k.u, k.v, height(k.u, k.v));
        ctx.strokeStyle = V.edge(0.55 * (1 - age), true);
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (var n = 0; n < 6; n++) {
          var a = (n / 6) * TAU + k.t;
          var uu = k.u + Math.cos(a) * 0.09;
          var vv = k.v + Math.sin(a) * 0.12;
          var q = project(uu, vv, height(uu, vv));
          ctx.moveTo(c.x, c.y);
          ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
      });

      for (j = 0; j < NZ; j++) {
        for (i = 0; i < NX; i++) {
          p = pts[j][i];
          V.node(ctx, p.x, p.y, j / (NZ - 1), p.em, true, 1);
        }
      }

      REG.forEach(function (r, ri) {
        var base = project(r.u, r.v, height(r.u, r.v));
        var on = ri === active;
        var hgt = (lay.mob ? 54 : 84) * (on ? 1.15 : 1);
        var g = ctx.createLinearGradient(0, base.y, 0, base.y - hgt);
        g.addColorStop(0, V.rgba("cyan", 0.7));
        g.addColorStop(1, V.rgba("cyan", 0));
        ctx.strokeStyle = g;
        ctx.lineWidth = on ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(base.x, base.y - hgt);
        ctx.stroke();
        ctx.save();
        ctx.translate(base.x, base.y);
        ctx.scale(1, 0.32);
        V.glow(ctx, 0, 0, on ? 70 : 40, on ? 0.35 : 0.15);
        ctx.restore();
        var el = dom.regions[ri];
        el.style.left = base.x + "px";
        el.style.top = base.y - hgt + "px";
        el.classList.toggle("is-on", on);
      });

      drops.forEach(function (d) {
        var uT = (time - d.t0) / d.dur;
        var land = project(d.u, d.v, height(d.u, d.v));
        var y = V.lerp(Math.min(land.y - 150, lay.mob ? 110 : 230), land.y - 8, Math.pow(uT, 1.6));
        var size = V.lerp(26, 34 * land.s + 10, uT);
        var a = uT < 0.15 ? uT / 0.15 : uT > 0.85 ? (1 - uT) / 0.15 : 1;
        ctx.strokeStyle = V.edge(0.2 * a, true);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(land.x, y + size / 2);
        ctx.lineTo(land.x, land.y);
        ctx.stroke();
        V.glyph(ctx, d.type, land.x, y, size, a, false);
      });

      WORDS.forEach(function (wd, i) {
        var q = project(wd.u, wd.v, height(wd.u, wd.v));
        var el = dom.words[i];
        var edge = Math.min(1, (1.05 - Math.abs(wd.u)) * 5);
        el.style.left = q.x + "px";
        el.style.top = q.y - 14 + "px";
        el.style.opacity = (Math.max(0, edge) * (0.45 + 0.55 * (1 - wd.v))).toFixed(3);
        el.style.fontSize = (lay.mob ? 10 : 11) + 3 * (1 - wd.v) + "px";
      });
    }

    var runner;
    var S = V.canvas(canvas, root, function (st) {
      layout(st);
      if (runner && runner.reduced) runner.redraw();
    });
    runner = V.run(root, step, draw, 120);
  });
})();
