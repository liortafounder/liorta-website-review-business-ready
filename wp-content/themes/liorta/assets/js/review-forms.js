(function () {
  "use strict";
  var form = document.querySelector("[data-liorta-contact-form]");
  if (!form) return;
  var statusEl = document.querySelector("[data-form-status]");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.className = "form-status form-status--success";
      statusEl.textContent = "This is a static UI/UX review copy - form submissions are disabled here. The live local build has a fully working version of this form.";
      statusEl.setAttribute("tabindex", "-1");
      statusEl.focus();
    }
  });
})();
