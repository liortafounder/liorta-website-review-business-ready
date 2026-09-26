(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  // ---- Sticky header scroll state ----
  var header = document.querySelector(".site-header");
  if (header) {
    var setScrolled = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  // ---- Mobile nav drawer ----
  var toggle = document.querySelector(".nav-toggle");
  if (header && toggle) {
    toggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    document.querySelectorAll(".mobile-drawer a").forEach(function (link) {
      link.addEventListener("click", function () {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("is-open")) {
        header.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        toggle.focus();
      }
    });
  }

  // ---- Scroll reveal ----
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ---- Nav dropdowns: tap/keyboard toggle (hover + focus-within handled in CSS) ----
  document.querySelectorAll(".nav-sub-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".nav-item");
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".nav-item.is-open").forEach(function (item) {
      if (!item.contains(e.target)) {
        item.classList.remove("is-open");
        item.querySelector(".nav-sub-toggle").setAttribute("aria-expanded", "false");
      }
    });
  });
  // ---- Platform page: capability explorer drives the Orbit ----
  var orbit = document.getElementById("pl-orbit");
  document.querySelectorAll(".cap-explorer__item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".cap-explorer__item").forEach(function (o) {
        o.setAttribute("aria-expanded", o === btn ? "true" : "false");
      });
      if (orbit) orbit.dispatchEvent(new CustomEvent("liorta:orbit-cap", { detail: parseInt(btn.getAttribute("data-cap"), 10) }));
    });
  });

  // ---- Applications page: tabs and the Fabric stay in sync ----
  var fabric = document.getElementById("apps-fabric");
  var appTabs = document.querySelectorAll("[data-app-tab]");
  function showApp(key, fromFabric) {
    appTabs.forEach(function (t) {
      var on = t.getAttribute("data-app-tab") === key;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll("[data-app-panel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-app-panel") !== key;
    });
    if (fabric && !fromFabric) fabric.dispatchEvent(new CustomEvent("liorta:fabric-select", { detail: key }));
  }
  appTabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      showApp(t.getAttribute("data-app-tab"));
    });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!n) return;
      e.preventDefault();
      var next = appTabs[(i + n + appTabs.length) % appTabs.length];
      next.focus();
      showApp(next.getAttribute("data-app-tab"));
    });
  });
  if (fabric) {
    fabric.addEventListener("liorta:application", function (e) {
      showApp(e.detail.key, true);
    });
  }

  // ---- Contact: reason pills switch between the general and partnership
  // field sets; CTA links pre-select the reason and record their source.
  // Presentation only — routing is decided server-side. ----
  var cform = document.querySelector("[data-liorta-contact-form]");
  if (cform) {
    var CONTEXT = ["platform", "demo", "solutions"];
    var setGroup = function (name, on) {
      cform.querySelectorAll('[data-form-group="' + name + '"]').forEach(function (g) {
        g.hidden = !on;
        g.querySelectorAll("input, select, textarea").forEach(function (el) {
          el.disabled = !on;
        });
      });
    };
    var applyIntent = function (intent) {
      var partner = intent === "partnership";
      cform.querySelector("input[name=intent]").value = intent;
      cform.setAttribute("data-form-mode", partner ? "partnership" : "general");
      setGroup("general", !partner);
      setGroup("partnership", partner);
      setGroup("context", CONTEXT.indexOf(intent) !== -1);
      var lbl = cform.querySelector("[data-label-partnership]");
      if (lbl) lbl.querySelector("[data-label-text]").textContent = lbl.getAttribute(partner ? "data-label-partnership" : "data-label-general");
    };
    var params = new URLSearchParams(window.location.search);
    var pre = params.get("intent");
    var prePill = pre && cform.querySelector('[data-intent-pill][value="' + pre.replace(/[^a-z_-]/g, "") + '"]');
    if (prePill) prePill.checked = true;
    ["cta", "section", "from"].forEach(function (k) {
      var v = params.get(k);
      var f = cform.querySelector('input[name="' + k + '"]');
      if (v && f && !f.value) f.value = v.slice(0, 200);
    });
    ["application", "domain"].forEach(function (k) {
      var v = params.get(k);
      var s = cform.querySelector('select[name="' + k + '"]');
      if (v && s && s.querySelector('option[value="' + v.replace(/[^a-z0-9_-]/g, "") + '"]')) s.value = v;
    });
    var checked = cform.querySelector("[data-intent-pill]:checked");
    if (checked) applyIntent(checked.value);
    cform.querySelectorAll("[data-intent-pill]").forEach(function (pill) {
      pill.addEventListener("change", function () {
        applyIntent(pill.value);
      });
    });
  }
  // ---- Generic vertical/horizontal tab sets (Solutions explorer) ----
  var solTabs = document.querySelectorAll("[data-solx-tab]");
  function showSol(key) {
    solTabs.forEach(function (t) {
      var on = t.getAttribute("data-solx-tab") === key;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll("[data-solx-panel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-solx-panel") !== key;
    });
  }
  solTabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      showSol(t.getAttribute("data-solx-tab"));
    });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!n) return;
      e.preventDefault();
      var next = solTabs[(i + n + solTabs.length) % solTabs.length];
      next.focus();
      showSol(next.getAttribute("data-solx-tab"));
    });
  });
})();
