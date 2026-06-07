const categories = [
  {
    key: "Images",
    label: "Images",
    icon: "image",
    color: "#2563eb",
    extensions: ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tif", "tiff", "heic", "avif"],
    mimePrefixes: ["image/"]
  },
  {
    key: "Documents",
    label: "Documents",
    icon: "file-text",
    color: "#00a6a6",
    extensions: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv", "rtf", "odt", "ods", "odp", "pages", "numbers", "key"],
    mimePrefixes: ["application/pdf", "text/"]
  },
  {
    key: "Videos",
    label: "Videos",
    icon: "film",
    color: "#ff6b4a",
    extensions: ["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv", "flv", "mpeg", "mpg"],
    mimePrefixes: ["video/"]
  },
  {
    key: "Audio",
    label: "Audio",
    icon: "music",
    color: "#17a36b",
    extensions: ["mp3", "wav", "flac", "m4a", "aac", "ogg", "opus", "wma", "aiff"],
    mimePrefixes: ["audio/"]
  },
  {
    key: "Code",
    label: "Code",
    icon: "code-2",
    color: "#8b5cf6",
    extensions: ["html", "css", "js", "jsx", "ts", "tsx", "json", "xml", "yml", "yaml", "py", "java", "c", "cpp", "cs", "go", "rs", "rb", "php", "swift", "kt", "sql", "sh", "ps1", "vue", "svelte", "scss", "less"],
    mimePrefixes: ["application/json", "application/xml"]
  },
  {
    key: "Archives",
    label: "Archives",
    icon: "archive",
    color: "#f5a524",
    extensions: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "dmg"],
    mimePrefixes: ["application/zip", "application/x-zip", "application/x-rar", "application/x-7z"]
  },
  {
    key: "Others",
    label: "Others",
    icon: "file-question",
    color: "#64748b",
    extensions: [],
    mimePrefixes: []
  }
];

const state = {
  files: [],
  zipBlob: null,
  zipName: "fileflow-organized.zip",
  mode: "type",
  search: "",
  isOrganizing: false
};

const elements = {
  body: document.body,
  dropZone: document.querySelector("#dropZone"),
  fileInput: document.querySelector("#fileInput"),
  chooseButton: document.querySelector(".choose-button"),
  demoButton: document.querySelector("#demoButton"),
  themeToggle: document.querySelector("#themeToggle"),
  fileCount: document.querySelector("#fileCount"),
  fileCountNote: document.querySelector("#fileCountNote"),
  totalSize: document.querySelector("#totalSize"),
  categoryCount: document.querySelector("#categoryCount"),
  largestFile: document.querySelector("#largestFile"),
  largestFileNote: document.querySelector("#largestFileNote"),
  categoryGrid: document.querySelector("#categoryGrid"),
  distributionList: document.querySelector("#distributionList"),
  distributionSummary: document.querySelector("#distributionSummary"),
  previewList: document.querySelector("#previewList"),
  previewSummary: document.querySelector("#previewSummary"),
  searchInput: document.querySelector("#searchInput"),
  organizeButton: document.querySelector("#organizeButton"),
  downloadButton: document.querySelector("#downloadButton"),
  clearButton: document.querySelector("#clearButton"),
  statusCard: document.querySelector("#statusCard"),
  zipModePill: document.querySelector("#zipModePill"),
  successOverlay: document.querySelector("#successOverlay"),
  modeOptions: document.querySelectorAll(".mode-option"),
  modeInputs: document.querySelectorAll("input[name='organizeMode']")
};

function init() {
  restoreTheme();
  render();
  bindEvents();
  refreshIcons();
}

function bindEvents() {
  elements.dropZone.addEventListener("click", () => elements.fileInput.click());
  elements.dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      elements.fileInput.click();
    }
  });

  elements.chooseButton.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  elements.fileInput.addEventListener("change", (event) => {
    addFiles(event.target.files);
    elements.fileInput.value = "";
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (eventName === "drop") {
        addFiles(event.dataTransfer.files);
      }
      elements.dropZone.classList.remove("drag-over");
    });
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderPreview();
  });

  elements.modeInputs.forEach((input) => {
    input.addEventListener("change", () => {
      state.mode = input.value;
      resetZip();
      renderMode();
      renderStatus(`${getModeLabel()} mode selected. Ready to build a fresh ZIP.`);
    });
  });

  elements.organizeButton.addEventListener("click", organizeFiles);
  elements.downloadButton.addEventListener("click", downloadZip);
  elements.clearButton.addEventListener("click", clearFiles);
  elements.demoButton.addEventListener("click", addDemoFiles);
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.successOverlay.addEventListener("click", hideSuccess);
}

function addFiles(fileList) {
  const incomingFiles = Array.from(fileList || []);
  if (!incomingFiles.length) {
    return;
  }

  const prepared = incomingFiles.map((file) => {
    const extension = getExtension(file.name);
    const category = detectCategory(file, extension);

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type || "Unknown",
      extension,
      category,
      modified: file.lastModified || Date.now()
    };
  });

  state.files = [...state.files, ...prepared];
  resetZip();
  render();
  renderStatus(`${prepared.length} file${prepared.length === 1 ? "" : "s"} added to FileFlow.`);
}

function addDemoFiles() {
  const now = Date.now();
  const demoFiles = [
    new File(["hero-image"], "brand-hero.webp", { type: "image/webp", lastModified: now - 86400000 }),
    new File(["quarterly plan"], "Q4-roadmap.pdf", { type: "application/pdf", lastModified: now - 172800000 }),
    new File(["const app = true;"], "dashboard.js", { type: "text/javascript", lastModified: now - 259200000 }),
    new File(["audio"], "podcast-intro.mp3", { type: "audio/mpeg", lastModified: now - 345600000 }),
    new File(["video"], "launch-demo.mp4", { type: "video/mp4", lastModified: now - 432000000 }),
    new File(["archive"], "client-assets.zip", { type: "application/zip", lastModified: now - 518400000 }),
    new File(["misc"], "untitled.asset", { type: "", lastModified: now - 604800000 })
  ];

  addFiles(demoFiles);
}

function detectCategory(file, extension) {
  const mime = (file.type || "").toLowerCase();

  const extensionMatch = categories.find((category) => {
    return category.key !== "Others" && category.extensions.includes(extension);
  });

  if (extensionMatch) {
    return extensionMatch.key;
  }

  const mimeMatch = categories.find((category) => {
    return category.key !== "Others" && category.mimePrefixes.some((prefix) => mime.startsWith(prefix));
  });

  return mimeMatch ? mimeMatch.key : "Others";
}

function render() {
  renderStats();
  renderCategories();
  renderDistribution();
  renderPreview();
  renderButtons();
  renderMode();
  refreshIcons();
}

function renderStats() {
  const totalBytes = state.files.reduce((sum, item) => sum + item.size, 0);
  const usedCategories = getCategoryCounts().filter((item) => item.count > 0).length;
  const largest = state.files.reduce((current, item) => item.size > (current?.size || 0) ? item : current, null);

  elements.fileCount.textContent = String(state.files.length);
  elements.fileCountNote.textContent = state.files.length === 1 ? "1 file ready to organize" : `${state.files.length} files ready to organize`;
  elements.totalSize.textContent = formatBytes(totalBytes);
  elements.categoryCount.textContent = String(usedCategories);
  elements.largestFile.textContent = largest ? truncateText(largest.name, 18) : "None";
  elements.largestFileNote.textContent = largest ? formatBytes(largest.size) : "No files selected";
}

function renderCategories() {
  elements.categoryGrid.innerHTML = getCategoryCounts().map((category) => `
    <article class="category-card" style="--category-color: ${category.color}">
      <span class="category-icon"><i data-lucide="${category.icon}"></i></span>
      <strong>${category.count}</strong>
      <span>${category.label} ${category.count === 1 ? "file" : "files"}</span>
    </article>
  `).join("");
}

function renderDistribution() {
  const counts = getCategoryCounts();
  const total = state.files.length;

  elements.distributionSummary.textContent = `${total} ${total === 1 ? "file" : "files"}`;

  if (!total) {
    elements.distributionList.innerHTML = `<div class="empty-state">Distribution appears after files are added.</div>`;
    return;
  }

  elements.distributionList.innerHTML = counts.map((category) => {
    const percentage = total ? Math.round((category.count / total) * 100) : 0;
    return `
      <div class="bar-row" style="--category-color: ${category.color}">
        <div class="bar-meta">
          <span>${category.label}</span>
          <span>${category.count} / ${percentage}%</span>
        </div>
        <div class="bar-track" aria-hidden="true">
          <div class="bar-fill" style="--bar-width: ${percentage}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderPreview() {
  const visibleFiles = getVisibleFiles();
  elements.previewSummary.textContent = `${visibleFiles.length} visible`;

  if (!state.files.length) {
    elements.previewList.innerHTML = `<div class="empty-state">Your categorized file preview will appear here.</div>`;
    return;
  }

  if (!visibleFiles.length) {
    elements.previewList.innerHTML = `<div class="empty-state">No files match this search.</div>`;
    return;
  }

  elements.previewList.innerHTML = visibleFiles.map((item) => {
    const category = getCategory(item.category);
    return `
      <article class="file-row" style="--category-color: ${category.color}">
        <span class="file-icon"><i data-lucide="${category.icon}"></i></span>
        <div class="file-meta">
          <div class="file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
          <div class="file-detail">${item.category} / ${item.extension || "no extension"} / ${formatBytes(item.size)}</div>
        </div>
        <button class="remove-file" type="button" data-remove="${item.id}" aria-label="Remove ${escapeHtml(item.name)}" title="Remove file">
          <i data-lucide="x"></i>
        </button>
      </article>
    `;
  }).join("");

  elements.previewList.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeFile(button.dataset.remove));
  });

  refreshIcons();
}

function renderButtons() {
  const hasFiles = state.files.length > 0;
  elements.organizeButton.disabled = !hasFiles || state.isOrganizing;
  elements.clearButton.disabled = !hasFiles || state.isOrganizing;
  elements.downloadButton.disabled = !state.zipBlob || state.isOrganizing;

  elements.organizeButton.innerHTML = state.isOrganizing
    ? `<i data-lucide="loader-2"></i> Organizing...`
    : `<i data-lucide="package-check"></i> Organize Files`;
  refreshIcons();
}

function renderMode() {
  const label = getModeLabel();
  elements.zipModePill.textContent = `ZIP mode: ${label}`;
  elements.modeOptions.forEach((option) => {
    const input = option.querySelector("input");
    option.classList.toggle("active", input.checked);
  });
}

function removeFile(id) {
  const removed = state.files.find((item) => item.id === id);
  state.files = state.files.filter((item) => item.id !== id);
  resetZip();
  render();
  renderStatus(removed ? `${removed.name} removed from the batch.` : "File removed from the batch.");
}

function clearFiles() {
  state.files = [];
  resetZip();
  elements.searchInput.value = "";
  state.search = "";
  render();
  renderStatus("FileFlow is ready for a new batch.");
}

async function organizeFiles() {
  if (!state.files.length || state.isOrganizing) {
    return;
  }

  if (!window.JSZip) {
    renderStatus("JSZip could not load. Check your connection or host the JSZip file locally.", "error");
    return;
  }

  state.isOrganizing = true;
  resetZip(false);
  renderButtons();
  renderStatus("Building organized ZIP structure...", "loading");

  try {
    const zip = new JSZip();
    const usedPaths = new Set();

    const orderedFiles = [...state.files].sort((first, second) => {
      const firstFolder = getFolderForMode(first);
      const secondFolder = getFolderForMode(second);
      return firstFolder.localeCompare(secondFolder) || first.name.localeCompare(second.name);
    });

    for (const item of orderedFiles) {
      const folder = getFolderForMode(item);
      const fileName = sanitizeFileName(item.name);
      const zipPath = uniqueZipPath(`${folder}/${fileName}`, usedPaths);
      zip.file(zipPath, item.file);
    }

    state.zipBlob = await zip.generateAsync({ type: "blob" });
    state.zipName = getZipName();
    renderStatus(`ZIP ready with ${state.files.length} file${state.files.length === 1 ? "" : "s"} organized by ${getModeLabel().toLowerCase()}.`, "success");
    showSuccess();
  } catch (error) {
    console.error(error);
    renderStatus("Something went wrong while generating the ZIP. Try a smaller batch.", "error");
  } finally {
    state.isOrganizing = false;
    renderButtons();
    refreshIcons();
  }
}

function downloadZip() {
  if (!state.zipBlob) {
    return;
  }

  const url = URL.createObjectURL(state.zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = state.zipName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  renderStatus("Download started. Your organized ZIP is leaving the browser now.", "success");
}

function getFolderForMode(item) {
  if (state.mode === "extension") {
    return `Extensions/${item.extension ? item.extension.toUpperCase() : "No Extension"}`;
  }

  if (state.mode === "date") {
    const date = new Date(item.modified);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `Dates/${year}-${month}`;
  }

  if (state.mode === "size") {
    return `Sizes/${getSizeBucket(item.size)}`;
  }

  return `${item.category}/${getTypeFolder(item)}`;
}

function getTypeFolder(item) {
  if (!item.extension) {
    return "No Extension";
  }

  const extensionLabels = {
    csv: "CSV",
    doc: "Word",
    docx: "Word",
    pdf: "PDF",
    ppt: "PowerPoint",
    pptx: "PowerPoint",
    xls: "Excel",
    xlsx: "Excel"
  };

  return extensionLabels[item.extension] || item.extension.toUpperCase();
}

function getSizeBucket(size) {
  if (size < 1024 * 1024) {
    return "Small";
  }
  if (size < 25 * 1024 * 1024) {
    return "Medium";
  }
  if (size < 250 * 1024 * 1024) {
    return "Large";
  }
  return "Huge";
}

function getZipName() {
  const stamp = new Date().toISOString().slice(0, 10);
  return `fileflow-${state.mode}-${stamp}.zip`;
}

function resetZip(updateButtons = true) {
  state.zipBlob = null;
  if (updateButtons) {
    renderButtons();
  }
}

function renderStatus(message, tone = "default") {
  elements.statusCard.className = `status-card ${tone === "success" ? "success" : ""} ${tone === "loading" ? "loading" : ""} ${tone === "error" ? "error" : ""}`.trim();
  elements.statusCard.querySelector("p").textContent = message;
}

function showSuccess() {
  elements.successOverlay.classList.add("show");
  elements.successOverlay.setAttribute("aria-hidden", "false");
  refreshIcons();
  window.setTimeout(hideSuccess, 1700);
}

function hideSuccess() {
  elements.successOverlay.classList.remove("show");
  elements.successOverlay.setAttribute("aria-hidden", "true");
}

function getCategoryCounts() {
  return categories.map((category) => ({
    ...category,
    count: state.files.filter((item) => item.category === category.key).length
  }));
}

function getCategory(key) {
  return categories.find((category) => category.key === key) || categories[categories.length - 1];
}

function getVisibleFiles() {
  if (!state.search) {
    return state.files;
  }

  return state.files.filter((item) => {
    const haystack = `${item.name} ${item.category} ${item.extension} ${item.type}`.toLowerCase();
    return haystack.includes(state.search);
  });
}

function getModeLabel() {
  const labels = {
    type: "Type",
    extension: "Extension",
    date: "Date",
    size: "Size"
  };
  return labels[state.mode] || "Type";
}

function getExtension(fileName) {
  const cleanName = fileName.toLowerCase();
  const lastDot = cleanName.lastIndexOf(".");
  if (lastDot < 0 || lastDot === cleanName.length - 1) {
    return "";
  }
  return cleanName.slice(lastDot + 1);
}

function sanitizeFileName(name) {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim() || "untitled";
}

function uniqueZipPath(path, usedPaths) {
  let candidate = path;
  let index = 2;
  const slashIndex = path.lastIndexOf("/");
  const folder = slashIndex >= 0 ? path.slice(0, slashIndex + 1) : "";
  const fileName = slashIndex >= 0 ? path.slice(slashIndex + 1) : path;
  const dotIndex = fileName.lastIndexOf(".");
  const base = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";

  while (usedPaths.has(candidate)) {
    candidate = `${folder}${base} (${index})${extension}`;
    index += 1;
  }

  usedPaths.add(candidate);
  return candidate;
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const digits = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}...`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[character]));
}

function toggleTheme() {
  const isDark = elements.body.classList.toggle("dark-theme");
  localStorage.setItem("fileflow-theme", isDark ? "dark" : "light");
  elements.themeToggle.innerHTML = isDark ? `<i data-lucide="sun"></i>` : `<i data-lucide="moon"></i>`;
  refreshIcons();
}

function restoreTheme() {
  const savedTheme = localStorage.getItem("fileflow-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const useDark = savedTheme ? savedTheme === "dark" : prefersDark;

  elements.body.classList.toggle("dark-theme", useDark);
  elements.themeToggle.innerHTML = useDark ? `<i data-lucide="sun"></i>` : `<i data-lucide="moon"></i>`;
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.addEventListener("DOMContentLoaded", init);
