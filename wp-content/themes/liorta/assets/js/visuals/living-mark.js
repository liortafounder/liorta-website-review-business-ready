/*
 * LivingMark — the Liorta nine-dot identity, alive but never out of formation.
 * Mount: <div data-liorta-visual="living-mark"> (content from LIORTA_BRAND.identity).
 * A server-rendered .lm-list inside the mount is the no-JS / semantic fallback.
 */
(function () {
  "use strict";
  var V = window.LiortaVisuals;
  var M = V.MARK;

  function pad(i) {
    return (i + 1 < 10 ? "0" : "") + (i + 1);
  }

  function defs(svg, id) {
    var d = V.svg("defs", null, svg);
    var g = V.svg("linearGradient", { id: id, x1: "0", y1: "0", x2: "0", y2: "1" }, d);
    V.svg("stop", { offset: "0", "stop-color": V.C.cyan }, g);
    V.svg("stop", { offset: "1", "stop-color": V.C.deep }, g);
    var h = V.svg("radialGradient", { id: id + "-hi", cx: "0.35", cy: "0.3", r: "0.5" }, d);
    V.svg("stop", { offset: "0", "stop-color": "#fff", "stop-opacity": "0.55" }, h);
    V.svg("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }, h);
    var gl = V.svg("radialGradient", { id: id + "-glow" }, d);
    V.svg("stop", { offset: "0", "stop-color": V.C.cyan, "stop-opacity": "0.55" }, gl);
    V.svg("stop", { offset: "1", "stop-color": V.C.cyan, "stop-opacity": "0" }, gl);
  }

  var uid = 0;

  V.register("living-mark", function (root) {
    var ident = V.cfg.identity || { columns: [], items: [] };
    var ITEMS = ident.items || [];
    var COLS = ident.columns || [];
    var LB = V.cfg.labels || {};
    if (ITEMS.length !== 9) return;
    var id = "lm" + ++uid;

    var list = root.querySelector(".lm-list");
    if (list) {
      list.setAttribute("aria-hidden", "true");
      list.hidden = true;
    }
    root.classList.add("lm--live");

    var markWrap = V.el("div", "lm__markwrap", root);
    var mark = V.el("div", "lm__mark", markWrap);
    var svg = V.svg("svg", { class: "lm__svg", viewBox: "-40 -40 307 292", role: "group", "aria-label": LB.chooseDot || "" }, mark);
    var panel = V.el("div", "lm__panel", root);
    panel.setAttribute("aria-live", "polite");
    var elCol = V.el("p", "lm__col", panel);
    var elNum = V.el("p", "lm__num", panel);
    elNum.setAttribute("aria-hidden", "true");
    var elTitle = V.el("h3", "lm__title", panel);
    var elBody = V.el("p", "lm__body", panel);
    var colsBox = V.el("div", "lm__cols", panel);
    colsBox.setAttribute("role", "group");
    var nav = V.el("div", "lm__nav", panel);
    var prev = V.el("button", "lm__prev", nav, "←");
    prev.type = "button";
    prev.setAttribute("aria-label", LB.prev || "");
    var count = V.el("span", "lm__count", nav);
    var next = V.el("button", "lm__next", nav, "→");
    next.type = "button";
    next.setAttribute("aria-label", LB.next || "");

    defs(svg, id);
    var gLinks = V.svg("g", null, svg);
    var gPulse = V.svg("g", null, svg);
    var spine = V.svg("line", { class: "lm__spine" }, svg);
    var gDots = V.svg("g", null, svg);
    var links = M.links.map(function () {
      return V.svg("line", { stroke: V.C.blue, "stroke-width": M.bar }, gLinks);
    });
    // The pulse travels the mark's own connector path.
    var routes = [
      [0, 1, 5, 8],
      [4, 6],
    ];
    var pulses = routes.map(function () {
      return V.svg("path", { fill: "none", stroke: "#bff4fb", "stroke-width": "4", "stroke-linecap": "round", opacity: V.reduced ? "0" : "0.95" }, gPulse);
    });

    var dots = [];
    var active = -1;
    var idleUntil = 0;

    function userSet(i) {
      idleUntil = performance.now() + 9000;
      if (i !== active) render(i);
    }

    for (var i = 0; i < 9; i++) {
      (function (i) {
        var p = M.dot(i);
        var g = V.svg("g", { class: "lm__dot", tabindex: "0", role: "button", "aria-label": pad(i) + " " + ITEMS[i].title }, gDots);
        var glow = V.svg("circle", { cx: p.x, cy: p.y, r: 44, fill: "url(#" + id + "-glow)", opacity: "0" }, g);
        V.svg("circle", { class: "lm__ring", cx: p.x, cy: p.y, r: M.r + 7 }, g);
        var core = V.svg("g", { class: "lm__core" }, g);
        V.svg("circle", { cx: p.x, cy: p.y, r: M.r, fill: V.C.blue }, core);
        V.svg("circle", { class: "lm__grad", cx: p.x, cy: p.y, r: M.r, fill: "url(#" + id + ")" }, core);
        V.svg("circle", { class: "lm__grad", cx: p.x, cy: p.y, r: M.r, fill: "url(#" + id + "-hi)" }, core);
        dots.push({ g: g, glow: glow, base: p });
        g.addEventListener("click", function () {
          userSet(i);
        });
        g.addEventListener("mouseenter", function () {
          if (V.fine) userSet(i);
        });
        g.addEventListener("keydown", function (e) {
          var c = Math.floor(i / 3);
          var r = i % 3;
          var n = -1;
          if (e.key === "Enter" || e.key === " ") n = i;
          if (e.key === "ArrowRight") n = Math.min(2, c + 1) * 3 + r;
          if (e.key === "ArrowLeft") n = Math.max(0, c - 1) * 3 + r;
          if (e.key === "ArrowDown") n = c * 3 + Math.min(2, r + 1);
          if (e.key === "ArrowUp") n = c * 3 + Math.max(0, r - 1);
          if (n >= 0) {
            e.preventDefault();
            userSet(n);
            dots[n].g.focus();
          }
        });
      })(i);
    }

    var colBtns = COLS.map(function (c, ci) {
      var b = V.el("button", null, colsBox, c);
      b.type = "button";
      b.addEventListener("click", function () {
        userSet(ci * 3);
      });
      return b;
    });

    function render(i, instant) {
      active = i;
      var c = Math.floor(i / 3);
      dots.forEach(function (d, k) {
        d.g.classList.toggle("is-active", k === i);
        d.g.classList.toggle("is-colmate", k !== i && Math.floor(k / 3) === c);
        d.g.setAttribute("aria-pressed", k === i ? "true" : "false");
      });
      colBtns.forEach(function (b, k) {
        b.setAttribute("aria-pressed", k === c ? "true" : "false");
      });
      spine.classList.add("is-on");
      function swap() {
        elCol.textContent = COLS[c] || "";
        elNum.textContent = pad(i);
        elTitle.textContent = ITEMS[i].title;
        elBody.textContent = ITEMS[i].body;
        count.textContent = pad(i) + " / 09";
        panel.classList.remove("is-swapping");
      }
      if (instant || V.reduced) swap();
      else {
        panel.classList.add("is-swapping");
        setTimeout(swap, 200);
      }
    }

    prev.addEventListener("click", function () {
      userSet((active + 8) % 9);
    });
    next.addEventListener("click", function () {
      userSet((active + 1) % 9);
    });
    var tx = null;
    panel.addEventListener(
      "touchstart",
      function (e) {
        tx = e.touches[0].clientX;
      },
      { passive: true }
    );
    panel.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) userSet(dx < 0 ? (active + 1) % 9 : (active + 8) % 9);
      tx = null;
    });

    render(0, true);

    var pointer = V.pointer(root);
    var lastCycle = performance.now();

    function frame(t) {
      pointer.step(0.07);
      mark.style.setProperty("--rx", (-pointer.y * 7).toFixed(2) + "deg");
      mark.style.setProperty("--ry", (pointer.x * 9).toFixed(2) + "deg");

      var px = ((pointer.x + 1) / 2) * 307 - 40;
      var py = ((pointer.y + 1) / 2) * 292 - 40;
      var cur = [];
      for (var i = 0; i < 9; i++) {
        var d = dots[i];
        var dx = px - d.base.x;
        var dy = py - d.base.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var lean = pointer.inside ? Math.max(0, 1 - dist / 170) * 6 : 0;
        var breathe = V.reduced ? 0 : Math.sin(t * 1.3 + i * 0.7) * 0.6;
        var x = d.base.x + (dx / dist) * lean;
        var y = d.base.y + (dy / dist) * lean + breathe;
        d.g.setAttribute("transform", "translate(" + (x - d.base.x).toFixed(2) + " " + (y - d.base.y).toFixed(2) + ")");
        cur.push({ x: x, y: y });
      }
      M.links.forEach(function (pair, k) {
        links[k].setAttribute("x1", cur[pair[0]].x.toFixed(2));
        links[k].setAttribute("y1", cur[pair[0]].y.toFixed(2));
        links[k].setAttribute("x2", cur[pair[1]].x.toFixed(2));
        links[k].setAttribute("y2", cur[pair[1]].y.toFixed(2));
      });
      if (active >= 0) {
        var c = Math.floor(active / 3);
        spine.setAttribute("x1", cur[c * 3].x.toFixed(2));
        spine.setAttribute("y1", (cur[c * 3].y - 34).toFixed(2));
        spine.setAttribute("x2", cur[c * 3 + 2].x.toFixed(2));
        spine.setAttribute("y2", (cur[c * 3 + 2].y + 34).toFixed(2));
      }

      var glow = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (!V.reduced) {
        routes.forEach(function (route, ri) {
          var segs = [];
          var total = 0;
          for (var s = 0; s < route.length - 1; s++) {
            var A = cur[route[s]];
            var B = cur[route[s + 1]];
            var len = Math.hypot(B.x - A.x, B.y - A.y);
            segs.push({ A: A, B: B, len: len, at: total });
            total += len;
          }
          var phase = ((t + ri * 2.1) % 4.2) / 4.2;
          var head = V.ease(phase) * (total + 60) - 30;
          var tail = head - 26;
          var dd = "";
          segs.forEach(function (sg) {
            var a = Math.max(tail, sg.at);
            var b = Math.min(head, sg.at + sg.len);
            if (b > a) {
              var ta = (a - sg.at) / sg.len;
              var tb = (b - sg.at) / sg.len;
              dd +=
                "M" + (sg.A.x + (sg.B.x - sg.A.x) * ta).toFixed(1) + " " + (sg.A.y + (sg.B.y - sg.A.y) * ta).toFixed(1) +
                "L" + (sg.A.x + (sg.B.x - sg.A.x) * tb).toFixed(1) + " " + (sg.A.y + (sg.B.y - sg.A.y) * tb).toFixed(1);
            }
          });
          pulses[ri].setAttribute("d", dd || "M0 0");
          route.forEach(function (di, k) {
            var at = k === 0 ? 0 : segs[k - 1].at + segs[k - 1].len;
            glow[di] = Math.max(glow[di], Math.max(0, 1 - Math.abs(head - at) / 34));
          });
        });
      }
      dots.forEach(function (d, i) {
        d.glow.setAttribute("opacity", (i === active ? 0.9 : glow[i] * 0.9).toFixed(3));
      });

      var now = performance.now();
      if (!V.reduced && now > idleUntil && now - lastCycle > 4200 && !root.matches(":hover") && !root.contains(document.activeElement)) {
        lastCycle = now;
        render((active + 1) % 9);
      }
      if (now <= idleUntil) lastCycle = now;
    }

    V.loop(root, frame).once();
  });
})();
