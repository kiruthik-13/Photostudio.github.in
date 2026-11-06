(function () {
  "use strict";

  var STORAGE_KEY = "srieethula-images";

  var slots = [
    { id: "hero-1", label: "Hero slide 1", group: "Hero slides", maxWidth: 1600, maxHeight: 1000 },
    { id: "hero-2", label: "Hero slide 2", group: "Hero slides", maxWidth: 1600, maxHeight: 1000 },
    { id: "hero-3", label: "Hero slide 3", group: "Hero slides", maxWidth: 1600, maxHeight: 1000 },
    { id: "service-wedding", label: "Wedding photography", group: "Services", maxWidth: 900, maxHeight: 675 },
    { id: "service-candid", label: "Candid photography", group: "Services", maxWidth: 900, maxHeight: 675 },
    { id: "service-portrait", label: "Portraits", group: "Services", maxWidth: 900, maxHeight: 675 },
    { id: "service-events", label: "Events and occasions", group: "Services", maxWidth: 900, maxHeight: 675 },
    { id: "service-commercial", label: "Commercial photography", group: "Services", maxWidth: 900, maxHeight: 675 },
    { id: "service-editing", label: "Editing and design", group: "Services", maxWidth: 900, maxHeight: 675 },
    { id: "portfolio-weddings", label: "Weddings", group: "Portfolio", maxWidth: 900, maxHeight: 675 },
    { id: "portfolio-prewedding", label: "Pre-wedding", group: "Portfolio", maxWidth: 900, maxHeight: 675 },
    { id: "portfolio-portraits", label: "Portraits", group: "Portfolio", maxWidth: 900, maxHeight: 675 },
    { id: "portfolio-events", label: "Birthdays and events", group: "Portfolio", maxWidth: 900, maxHeight: 675 },
    { id: "portfolio-commercial", label: "Commercial", group: "Portfolio", maxWidth: 900, maxHeight: 675 },
    { id: "portfolio-nature", label: "Nature", group: "Portfolio", maxWidth: 900, maxHeight: 675 }
  ];

  function isImageSource(value) {
    if (typeof value !== "string") return false;
    return /^https?:\/\/\S+$/i.test(value) ||
      /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(value);
  }

  function getDefaults() {
    var source = window.STUDIO_IMAGES && typeof window.STUDIO_IMAGES === "object"
      ? window.STUDIO_IMAGES
      : {};
    var result = {};

    slots.forEach(function (slot) {
      if (isImageSource(source[slot.id])) result[slot.id] = source[slot.id];
    });

    return result;
  }

  function loadState() {
    var raw;

    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return getDefaults();
    }

    if (!raw) return getDefaults();

    try {
      var saved = JSON.parse(raw);
      var state = {};

      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return getDefaults();

      slots.forEach(function (slot) {
        if (isImageSource(saved[slot.id])) state[slot.id] = saved[slot.id];
      });

      return state;
    } catch (e) {
      return getDefaults();
    }
  }

  var state = loadState();

  function applyImages() {
    slots.forEach(function (slot) {
      var element = document.querySelector('[data-image="' + slot.id + '"]');
      if (!element) return;

      var holder = element.closest("[data-image-holder]") || element.closest(".ph");
      var slide = element.closest(".slide");
      var source = state[slot.id];

      if (source) {
        element.src = source;
        element.hidden = false;
        if (holder) holder.classList.add("has-img");
        if (slide) slide.classList.add("has-img");
      } else {
        element.removeAttribute("src");
        element.hidden = true;
        if (holder) holder.classList.remove("has-img");
        if (slide) slide.classList.remove("has-img");
      }
    });
  }

  var dialog = document.getElementById("image-editor");
  var opener = document.getElementById("open-image-editor");
  var container = document.getElementById("image-slots");
  var status = document.getElementById("image-status");
  var saveButton = document.getElementById("image-save");
  var downloadButton = document.getElementById("image-download");
  var resetButton = document.getElementById("image-reset");
  var slotNodes = {};

  function setStatus(message, type) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-success", type === "success");
    status.classList.toggle("is-warn", type === "warn");
  }

  function renderSlot(slot) {
    var node = slotNodes[slot.id];
    if (!node) return;

    var source = state[slot.id];

    if (source) {
      node.img.src = source;
      node.img.hidden = false;
      node.empty.hidden = true;
      node.remove.disabled = false;
    } else {
      node.img.removeAttribute("src");
      node.img.hidden = true;
      node.empty.hidden = false;
      node.remove.disabled = true;
    }
  }

  function renderAllSlots() {
    slots.forEach(renderSlot);
  }

  function buildEditor() {
    if (!container || container.childElementCount) return;

    var groups = {};

    slots.forEach(function (slot) {
      var group = groups[slot.group];

      if (!group) {
        group = document.createElement("section");
        group.className = "image-group";

        var heading = document.createElement("h3");
        heading.textContent = slot.group;

        var grid = document.createElement("div");
        grid.className = "image-grid";

        group.appendChild(heading);
        group.appendChild(grid);
        container.appendChild(group);
        groups[slot.group] = group;
        group.grid = grid;
      }

      var node = document.createElement("div");
      node.className = "image-slot";

      var preview = document.createElement("div");
      preview.className = "image-slot__preview";

      var image = document.createElement("img");
      image.alt = "";
      image.hidden = true;

      var empty = document.createElement("span");
      empty.textContent = "No image";

      preview.appendChild(image);
      preview.appendChild(empty);

      var label = document.createElement("div");
      label.className = "image-slot__label";
      label.textContent = slot.label;
      label.title = slot.label;

      var actions = document.createElement("div");
      actions.className = "image-slot__actions";

      var input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.className = "image-slot__input";

      var upload = document.createElement("button");
      upload.type = "button";
      upload.textContent = "Upload";
      upload.setAttribute("aria-label", "Upload image for " + slot.label);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.className = "image-slot__remove";
      remove.setAttribute("aria-label", "Remove image for " + slot.label);

      upload.addEventListener("click", function () {
        input.click();
      });

      input.addEventListener("change", function () {
        handleFile(slot, input);
      });

      remove.addEventListener("click", function () {
        delete state[slot.id];
        applyImages();
        renderSlot(slot);
        setStatus("Removed " + slot.label + ". Save changes or download the config to publish.", "success");
      });

      actions.appendChild(upload);
      actions.appendChild(remove);
      actions.appendChild(input);
      node.appendChild(preview);
      node.appendChild(label);
      node.appendChild(actions);
      group.grid.appendChild(node);

      slotNodes[slot.id] = {
        img: image,
        empty: empty,
        remove: remove,
        input: input
      };
    });
  }

  function processFile(file, slot) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//i.test(file.type)) {
        reject(new Error("Please choose an image file."));
        return;
      }

      if (file.size > 25 * 1024 * 1024) {
        reject(new Error("That image is larger than 25 MB. Please choose a smaller file."));
        return;
      }

      var reader = new FileReader();

      reader.onerror = function () {
        reject(new Error("Could not read that file."));
      };

      reader.onload = function () {
        var image = new Image();

        image.onerror = function () {
          reject(new Error("Could not load that image."));
        };

        image.onload = function () {
          var width = image.naturalWidth;
          var height = image.naturalHeight;

          if (!width || !height) {
            reject(new Error("That image has no usable dimensions."));
            return;
          }

          var scale = Math.min(1, slot.maxWidth / width, slot.maxHeight / height);
          var targetWidth = Math.max(1, Math.round(width * scale));
          var targetHeight = Math.max(1, Math.round(height * scale));
          var canvas = document.createElement("canvas");
          var context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Image processing is not available in this browser."));
            return;
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;
          context.fillStyle = "#F7F8F7";
          context.fillRect(0, 0, targetWidth, targetHeight);
          context.drawImage(image, 0, 0, targetWidth, targetHeight);

          var data = canvas.toDataURL("image/webp", 0.8);

          if (data.indexOf("data:image/webp") !== 0) {
            data = canvas.toDataURL("image/jpeg", 0.84);
          }

          resolve(data);
        };

        image.src = String(reader.result || "");
      };

      reader.readAsDataURL(file);
    });
  }

  function handleFile(slot, input) {
    var file = input.files && input.files[0];
    if (!file) return;

    setStatus("Processing " + file.name + "...");

    processFile(file, slot).then(function (data) {
      state[slot.id] = data;
      applyImages();
      renderSlot(slot);
      setStatus("Image added. Save changes or download the config to publish.", "success");
    }).catch(function (error) {
      setStatus(error.message || "Could not use that image.", "warn");
    }).then(function () {
      input.value = "";
    });
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  function downloadConfig() {
    var content = "window.STUDIO_IMAGES = " + JSON.stringify(state, null, 2) + ";\n";
    var blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");

    link.href = url;
    link.download = "images-config.js";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);

    setStatus("Downloaded images-config.js — replace js/images-config.js on your host to publish.", "success");
  }

  function openEditor() {
    buildEditor();
    renderAllSlots();
    setStatus("");
    document.body.classList.add("modal-open");

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeEditor() {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      document.body.classList.remove("modal-open");
    }
  }

  applyImages();

  if (!dialog || !opener || !container) return;

  opener.addEventListener("click", openEditor);

  dialog.addEventListener("close", function () {
    document.body.classList.remove("modal-open");
  });

  dialog.querySelectorAll("[data-close-image]").forEach(function (button) {
    button.addEventListener("click", closeEditor);
  });

  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) closeEditor();
  });

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      var stored = persist();

      setStatus(
        stored
          ? "Images saved in this browser."
          : "Images updated for this visit, but browser storage is full. Remove an image and try again.",
        stored ? "success" : "warn"
      );
    });
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", downloadConfig);
  }

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      if (!window.confirm("Remove all custom images from this browser and restore js/images-config.js?")) return;

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      state = getDefaults();
      applyImages();
      renderAllSlots();
      setStatus("Restored the images in js/images-config.js.", "success");
    });
  }
})();
