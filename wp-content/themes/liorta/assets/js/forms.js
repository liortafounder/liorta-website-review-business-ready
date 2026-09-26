(function () {
  "use strict";

  var form = document.querySelector("[data-liorta-contact-form]");
  if (!form || typeof window.liortaForms === "undefined") {
    return;
  }

  var loadedAtField = form.querySelector('[name="loaded_at"]');
  if (loadedAtField) {
    loadedAtField.value = String(Math.floor(Date.now() / 1000));
  }

  var statusEl = document.querySelector("[data-form-status]");
  var submitBtn = form.querySelector('[type="submit"]');
  var GENERIC = "Something went wrong and your enquiry was not sent. Please try again in a moment.";

  function clearErrors() {
    form.querySelectorAll(".form-field--error").forEach(function (f) {
      f.classList.remove("form-field--error");
    });
    form.querySelectorAll("[data-field-error]").forEach(function (e) {
      e.remove();
    });
    form.querySelectorAll("[aria-invalid]").forEach(function (el) {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    });
  }

  function markError(el, msg) {
    var field = el.closest(".form-field");
    if (!field) return;
    field.classList.add("form-field--error");
    var id = (el.id || el.name) + "-error";
    var p = document.createElement("p");
    p.className = "form-field__error";
    p.id = id;
    p.setAttribute("data-field-error", "");
    p.textContent = msg;
    field.appendChild(p);
    el.setAttribute("aria-invalid", "true");
    el.setAttribute("aria-describedby", id);
  }

  function showStatus(ok, msg) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.className = "form-status " + (ok ? "form-status--success" : "form-status--error");
    statusEl.textContent = msg;
    statusEl.focus();
  }

  function clientValidate() {
    var first = null;
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.disabled || el.type === "hidden" || el.name === "website") return;
      if (!el.checkValidity()) {
        var label = form.querySelector('label[for="' + el.id + '"]');
        var name = label ? label.textContent.replace(/\*|\(optional\)/g, "").trim() : "This field";
        markError(el, el.validity.typeMismatch ? "Please enter a valid email address." : name + " is required.");
        if (!first) first = el;
      }
    });
    if (first) first.focus();
    return !first;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();
    if (!clientValidate()) {
      showStatus(false, "Please check the highlighted fields.");
      form.querySelector("[aria-invalid]").focus();
      return;
    }

    var data = new FormData(form);
    data.append("action", "liorta_contact_submit");
    data.append("nonce", window.liortaForms.nonce);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = submitBtn.getAttribute("data-loading-text") || "Sending…";
    }

    fetch(window.liortaForms.ajaxUrl, { method: "POST", credentials: "same-origin", body: data })
      .then(function (res) {
        return res.json().catch(function () {
          return { success: false };
        });
      })
      .then(function (json) {
        if (json.success) {
          form.reset();
          form.hidden = true;
          showStatus(true, json.data.message);
          return;
        }
        var d = json.data || {};
        if (d.fields) {
          Object.keys(d.fields).forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (el) markError(el, d.fields[name]);
          });
        }
        showStatus(false, d.message || GENERIC);
      })
      .catch(function () {
        showStatus(false, GENERIC);
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.getAttribute("data-default-text") || "Send";
        }
      });
  });
})();
