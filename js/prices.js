(function () {
  "use strict";

  var STORAGE_KEY = "srieethula-prices";

  var fallback = {
    photography: { amount: "₹2,500", note: "per session" },
    editing: { amount: "₹300", note: "per image" },
    design: { amount: "₹500", note: "per design" }
  };

  var order = ["photography", "editing", "design"];

  function getDefaults() {
    var source = window.STUDIO_PRICES && typeof window.STUDIO_PRICES === "object"
      ? window.STUDIO_PRICES
      : {};

    var result = {};

    order.forEach(function (key) {
      var item = source[key] || fallback[key];
      result[key] = {
        amount: String(item.amount || fallback[key].amount),
        note: String(item.note || "")
      };
    });

    return result;
  }

  function loadState() {
    var state = getDefaults();

    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return state;

      var saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object") return state;

      order.forEach(function (key) {
        if (!saved[key] || typeof saved[key] !== "object") return;

        if (typeof saved[key].amount === "string" && saved[key].amount.trim()) {
          state[key].amount = saved[key].amount.trim();
        }

        if (typeof saved[key].note === "string") {
          state[key].note = saved[key].note.trim();
        }
      });
    } catch (e) {}

    return state;
  }

  var state = loadState();

  function applyPrices() {
    document.querySelectorAll("[data-price]").forEach(function (element) {
      var key = element.getAttribute("data-price");
      var price = state[key];
      if (!price) return;

      var amount = element.querySelector("[data-price-amount]");
      var note = element.querySelector("[data-price-note]");

      if (amount) amount.textContent = price.amount;
      if (note) note.textContent = price.note;
    });
  }

  var form = document.getElementById("price-form");
  var dialog = document.getElementById("price-editor");
  var opener = document.getElementById("open-price-editor");
  var status = document.getElementById("price-status");

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-success", type === "success");
    status.classList.toggle("is-warn", type === "warn");
  }

  function fillForm() {
    if (!form) return;

    order.forEach(function (key) {
      var priceInput = form.querySelector('[data-price-field="' + key + '"]');
      var noteInput = form.querySelector('[data-note-field="' + key + '"]');

      if (priceInput) priceInput.value = state[key].amount;
      if (noteInput) noteInput.value = state[key].note;
    });
  }

  function closeEditor() {
    if (!dialog) return;
    document.body.classList.remove("modal-open");
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function readForm() {
    var next = {};

    for (var i = 0; i < order.length; i++) {
      var key = order[i];
      var priceInput = form.querySelector('[data-price-field="' + key + '"]');
      var noteInput = form.querySelector('[data-note-field="' + key + '"]');

      if (!priceInput) continue;

      var amount = priceInput.value.trim();
      if (!amount) {
        priceInput.focus();
        setStatus("Please enter a starting price for every service.", "warn");
        return null;
      }

      next[key] = {
        amount: amount,
        note: noteInput ? noteInput.value.trim() : state[key].note
      };
    }

    return next;
  }

  function downloadConfig() {
    var next = readForm();
    if (!next) return;

    state = next;
    applyPrices();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}

    var content = "window.STUDIO_PRICES = " + JSON.stringify(state, null, 2) + ";\n";
    var blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = "config.js";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);

    setStatus("Downloaded config.js — replace js/config.js on your host to publish.", "success");
  }

  applyPrices();

  if (!form || !dialog || !opener) return;

  opener.addEventListener("click", function () {
    fillForm();
    setStatus("");
    document.body.classList.add("modal-open");

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  });

  dialog.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
  });

  dialog.querySelectorAll("[data-close-editor]").forEach(function (button) {
    button.addEventListener("click", closeEditor);
  });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeEditor();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var next = readForm();
    if (!next) return;

    state = next;

    var stored = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      stored = true;
    } catch (e) {}

    applyPrices();
    setStatus(
      stored
        ? "Prices updated in this browser."
        : "Prices updated for this visit. Storage is blocked in this browser.",
      stored ? "success" : "warn"
    );
  });

  var resetButton = document.getElementById("price-reset");
  if (resetButton) {
    resetButton.addEventListener("click", function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      state = getDefaults();
      applyPrices();
      fillForm();
      setStatus("Reset to the prices in js/config.js.", "success");
    });
  }

  var downloadButton = document.getElementById("price-download");
  if (downloadButton) {
    downloadButton.addEventListener("click", downloadConfig);
  }
})();
