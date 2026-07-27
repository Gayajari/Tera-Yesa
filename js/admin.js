// js/admin.js
// ============================================================
// Logika dashboard admin (admin.html)
// ------------------------------------------------------------
// Menangani:
// - Proteksi halaman (hanya user login yang bisa akses)
// - CRUD document Firestore collection "links"
// - Upload gambar langsung ke ImgBB (imgbb.com), bukan Firebase Storage
// - Copy Link & Web Share API
// - Toast notification, dark mode, loading indicator
// ============================================================
import {
  db,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
} from "./firebase.js";
import { requireAuth, logout } from "./auth.js";

// ------------------------------------------------------------
// Upload gambar ke ImgBB (imgbb.com)
// ------------------------------------------------------------
// GANTI dengan API key gratis Anda dari https://api.imgbb.com/
// (login pakai akun Google, lalu salin "API Key" dari halaman itu).
const IMGBB_API_KEY = "GANTI_DENGAN_IMGBB_API_KEY";

/**
 * Upload satu file gambar ke ImgBB dan kembalikan URL direct-nya.
 * @param {File} file
 * @returns {Promise<string>} URL gambar hasil upload
 */
async function uploadToImgbb(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: "POST", body: formData }
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result?.error?.message || "Upload ke ImgBB gagal");
  }

  // ImgBB mengembalikan beberapa varian URL; "url" adalah direct image link
  return result.data.url;
}

const COLLECTION_NAME = "links";
const MAIN_DOC_ID = "utama";

const IMAGE_FIELDS = [
  { key: "foto1", label: "Foto 1" },
  { key: "foto2", label: "Foto 2" },
  { key: "galeri1", label: "Galeri 1" },
  { key: "galeri2", label: "Galeri 2" },
  { key: "galeri3", label: "Galeri 3" },
];
const PLAY_FIELDS = ["play1", "play2", "play3"];
const CONTACT_FIELDS = ["telegram", "whatsapp", "kontak", "discord"];
// Field simpel (bukan gambar) yang diproses dengan cara sama:
// ambil/isi value dari satu <input> berdasarkan id `${prefix}-${key}`.
const TEXT_LINK_FIELDS = [...PLAY_FIELDS, ...CONTACT_FIELDS];

let allPosts = []; // cache seluruh posting (selain "utama")
let editingId = null; // id yang sedang diedit di form Tambah/Edit

// ------------------------------------------------------------
// Util: Toast Notification
// ------------------------------------------------------------
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ------------------------------------------------------------
// Util: Loading indicator
// ------------------------------------------------------------
function setLoading(isLoading) {
  const loader = document.getElementById("globalLoader");
  if (!loader) return;
  loader.classList.toggle("hidden", !isLoading);
}

// ------------------------------------------------------------
// Navigasi sidebar (single page dengan beberapa section)
// ------------------------------------------------------------
function initNavigation() {
  const navButtons = document.querySelectorAll("[data-section]");
  const sections = document.querySelectorAll(".admin-section");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;

      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      sections.forEach((s) => {
        s.classList.toggle("active", s.id === `section-${target}`);
      });

      // Tutup sidebar di mobile setelah klik menu
      document.getElementById("sidebar")?.classList.remove("open");

      if (target === "posting") renderPostingList();
      if (target === "dashboard") renderDashboardStats();
    });
  });

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("open");
  });
}

// ------------------------------------------------------------
// Dark Mode
// ------------------------------------------------------------
function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  const saved = localStorage.getItem("cms-dark-mode");
  if (saved === "true") document.body.classList.add("dark");
  toggle.checked = document.body.classList.contains("dark");

  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", toggle.checked);
    localStorage.setItem("cms-dark-mode", toggle.checked);
  });
}

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------
function initLogout() {
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await logout();
    });
  });
}

// ------------------------------------------------------------
// Firestore: ambil semua data
// ------------------------------------------------------------
async function fetchMainDoc() {
  const snap = await getDoc(doc(db, COLLECTION_NAME, MAIN_DOC_ID));
  return snap.exists() ? snap.data() : {};
}

async function fetchAllPosts() {
  const snap = await getDocs(collection(db, COLLECTION_NAME));
  const posts = [];
  snap.forEach((docSnap) => {
    if (docSnap.id !== MAIN_DOC_ID) {
      posts.push({ id: docSnap.id, ...docSnap.data() });
    }
  });
  // Urutkan berdasarkan ID numerik jika memungkinkan
  posts.sort((a, b) => {
    const numA = parseInt(a.id, 10);
    const numB = parseInt(b.id, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.id.localeCompare(b.id);
  });
  return posts;
}

async function getNextPostId() {
  if (allPosts.length === 0) return "201";
  const numericIds = allPosts
    .map((p) => parseInt(p.id, 10))
    .filter((n) => !isNaN(n));
  if (numericIds.length === 0) return "201";
  const max = Math.max(...numericIds);
  return String(max + 1);
}

// ------------------------------------------------------------
// Dashboard: statistik ringkas
// ------------------------------------------------------------
function renderDashboardStats() {
  document.getElementById("statTotalPosting").textContent = allPosts.length;
  document.getElementById("statLastId").textContent =
    allPosts.length > 0 ? allPosts[allPosts.length - 1].id : "-";

  const listEl = document.getElementById("dashboardRecentList");
  listEl.innerHTML = "";
  const recent = [...allPosts].slice(-5).reverse();
  if (recent.length === 0) {
    listEl.innerHTML = `<li class="empty-state">Belum ada posting.</li>`;
    return;
  }
  recent.forEach((post) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>ID ${post.id}</span>`;
    listEl.appendChild(li);
  });
}

// ------------------------------------------------------------
// Form builder: field gambar (Direct Image URL + Target Link + Upload)
// ------------------------------------------------------------
function buildImageFieldHtml(key, label, prefixId) {
  return `
    <div class="image-field" data-key="${key}">
      <h4>${label}</h4>
      <div class="image-field-row">
        <div class="image-preview-box">
          <img id="${prefixId}-${key}-preview" src="assets/placeholder.png" alt="Preview ${label}" />
        </div>
        <div class="image-field-inputs">
          <label>Direct Image URL</label>
          <input type="url" id="${prefixId}-${key}-url" placeholder="https://..." />

          <label>Target Link</label>
          <input type="url" id="${prefixId}-${key}-link" placeholder="https://..." />

          <div class="image-field-actions">
            <label class="btn btn-secondary btn-sm upload-label">
              Upload ke ImgBB
              <input type="file" id="${prefixId}-${key}-file" accept="image/*" hidden />
            </label>
            <button type="button" class="btn btn-ghost btn-sm" data-preview-btn="${prefixId}-${key}">Preview</button>
          </div>
          <div class="upload-progress hidden" id="${prefixId}-${key}-progress">Mengunggah...</div>
        </div>
      </div>
    </div>`;
}

function bindImageFieldEvents(prefixId, key) {
  const urlInput = document.getElementById(`${prefixId}-${key}-url`);
  const preview = document.getElementById(`${prefixId}-${key}-preview`);
  const fileInput = document.getElementById(`${prefixId}-${key}-file`);
  const progress = document.getElementById(`${prefixId}-${key}-progress`);
  const previewBtn = document.querySelector(`[data-preview-btn="${prefixId}-${key}"]`);

  urlInput.addEventListener("input", () => {
    if (urlInput.value.trim() !== "") preview.src = urlInput.value.trim();
  });

  previewBtn.addEventListener("click", () => {
    if (urlInput.value.trim() !== "") {
      preview.src = urlInput.value.trim();
      showToast("Preview diperbarui", "info");
    }
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    progress.classList.remove("hidden");
    try {
      const downloadUrl = await uploadToImgbb(file);

      urlInput.value = downloadUrl;
      preview.src = downloadUrl;
      showToast("Gambar berhasil diunggah ke ImgBB", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal mengunggah gambar ke ImgBB", "error");
    } finally {
      progress.classList.add("hidden");
      fileInput.value = "";
    }
  });
}

function fillImageField(prefixId, key, data) {
  const urlInput = document.getElementById(`${prefixId}-${key}-url`);
  const linkInput = document.getElementById(`${prefixId}-${key}-link`);
  const preview = document.getElementById(`${prefixId}-${key}-preview`);

  const urlVal = data?.[key] || "";
  const linkVal = data?.[`${key}Link`] || "";

  urlInput.value = urlVal;
  linkInput.value = linkVal;
  preview.src = urlVal !== "" ? urlVal : "assets/placeholder.png";
}

function readImageField(prefixId, key) {
  const urlVal = document.getElementById(`${prefixId}-${key}-url`).value.trim();
  const linkVal = document.getElementById(`${prefixId}-${key}-link`).value.trim();
  return { [key]: urlVal, [`${key}Link`]: linkVal };
}

// ------------------------------------------------------------
// Section: Data Utama
// ------------------------------------------------------------
function buildDataUtamaForm() {
  const container = document.getElementById("dataUtamaImages");
  container.innerHTML = IMAGE_FIELDS.map((f) =>
    buildImageFieldHtml(f.key, f.label, "utama")
  ).join("");
  IMAGE_FIELDS.forEach((f) => bindImageFieldEvents("utama", f.key));
}

async function loadDataUtama() {
  setLoading(true);
  try {
    const data = await fetchMainDoc();
    TEXT_LINK_FIELDS.forEach((key) => {
      document.getElementById(`utama-${key}`).value = data[key] || "";
    });
    IMAGE_FIELDS.forEach((f) => fillImageField("utama", f.key, data));
  } catch (err) {
    console.error(err);
    showToast("Gagal memuat data utama", "error");
  } finally {
    setLoading(false);
  }
}

function collectDataUtamaForm() {
  const result = {};
  TEXT_LINK_FIELDS.forEach((key) => {
    result[key] = document.getElementById(`utama-${key}`).value.trim();
  });
  IMAGE_FIELDS.forEach((f) => {
    Object.assign(result, readImageField("utama", f.key));
  });
  return result;
}

async function saveDataUtama(e) {
  e.preventDefault();
  setLoading(true);
  try {
    const data = collectDataUtamaForm();
    await setDoc(doc(db, COLLECTION_NAME, MAIN_DOC_ID), data, { merge: true });
    showToast("Data utama berhasil disimpan", "success");
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan data utama", "error");
  } finally {
    setLoading(false);
  }
}

// ------------------------------------------------------------
// Section: Tambah / Edit Posting
// ------------------------------------------------------------
function buildPostingForm() {
  const container = document.getElementById("postingImages");
  container.innerHTML = IMAGE_FIELDS.map((f) =>
    buildImageFieldHtml(f.key, f.label, "posting")
  ).join("");
  IMAGE_FIELDS.forEach((f) => bindImageFieldEvents("posting", f.key));
}

function resetPostingForm() {
  editingId = null;
  document.getElementById("postingFormTitle").textContent = "Tambah Posting Baru";
  document.getElementById("postingIdInput").value = "";
  document.getElementById("postingIdInput").disabled = false;
  TEXT_LINK_FIELDS.forEach((key) => {
    document.getElementById(`posting-${key}`).value = "";
  });
  IMAGE_FIELDS.forEach((f) => fillImageField("posting", f.key, {}));
}

async function prefillNextId() {
  const nextId = await getNextPostId();
  document.getElementById("postingIdInput").value = nextId;
}

function loadPostForEdit(post) {
  editingId = post.id;
  document.getElementById("postingFormTitle").textContent = `Edit Posting #${post.id}`;
  document.getElementById("postingIdInput").value = post.id;
  document.getElementById("postingIdInput").disabled = true;

  TEXT_LINK_FIELDS.forEach((key) => {
    document.getElementById(`posting-${key}`).value = post[key] || "";
  });
  IMAGE_FIELDS.forEach((f) => fillImageField("posting", f.key, post));

  // Pindah ke section Tambah/Edit
  document.querySelector('[data-section="tambah"]').click();
}

function collectPostingForm() {
  const result = {};
  TEXT_LINK_FIELDS.forEach((key) => {
    const val = document.getElementById(`posting-${key}`).value.trim();
    if (val !== "") result[key] = val;
  });
  IMAGE_FIELDS.forEach((f) => {
    const fieldData = readImageField("posting", f.key);
    if (fieldData[f.key] !== "") result[f.key] = fieldData[f.key];
    if (fieldData[`${f.key}Link`] !== "") result[`${f.key}Link`] = fieldData[`${f.key}Link`];
  });
  return result;
}

async function savePosting(e) {
  e.preventDefault();
  const idInput = document.getElementById("postingIdInput").value.trim();

  if (!idInput) {
    showToast("ID posting wajib diisi", "error");
    return;
  }

  setLoading(true);
  try {
    const data = collectPostingForm();
    await setDoc(doc(db, COLLECTION_NAME, idInput), data, { merge: true });
    showToast(
      editingId ? `Posting #${idInput} berhasil diupdate` : `Posting #${idInput} berhasil disimpan`,
      "success"
    );
    resetPostingForm();
    allPosts = await fetchAllPosts();
    renderPostingList();
    renderDashboardStats();
  } catch (err) {
    console.error(err);
    showToast("Gagal menyimpan posting", "error");
  } finally {
    setLoading(false);
  }
}

// ------------------------------------------------------------
// Section: Posting (daftar + aksi)
// ------------------------------------------------------------
function buildPostingUrl(id) {
  return `${window.location.origin}/?id=${id}`;
}

async function copyLink(id) {
  const url = buildPostingUrl(id);
  try {
    await navigator.clipboard.writeText(url);
    showToast("Link disalin ke clipboard", "success");
  } catch (err) {
    console.error(err);
    showToast("Gagal menyalin link", "error");
  }
}

async function sharePost(id) {
  const url = buildPostingUrl(id);
  if (navigator.share) {
    try {
      await navigator.share({ title: `Posting #${id}`, url });
    } catch (err) {
      // User membatalkan share, tidak perlu toast error
    }
  } else {
    await copyLink(id);
    showToast("Web Share tidak didukung, link disalin ke clipboard", "info");
  }
}

function previewPost(id) {
  window.open(buildPostingUrl(id), "_blank", "noopener");
}

let pendingDeleteId = null;

function openDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById("deleteModalText").textContent =
    `Yakin ingin menghapus posting #${id}? Tindakan ini tidak dapat dibatalkan.`;
  document.getElementById("deleteModal").classList.remove("hidden");
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById("deleteModal").classList.add("hidden");
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  setLoading(true);
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, pendingDeleteId));
    showToast(`Posting #${pendingDeleteId} berhasil dihapus`, "success");
    allPosts = await fetchAllPosts();
    renderPostingList();
    renderDashboardStats();
  } catch (err) {
    console.error(err);
    showToast("Gagal menghapus posting", "error");
  } finally {
    setLoading(false);
    closeDeleteModal();
  }
}

function renderPostingList(filter = "") {
  const listEl = document.getElementById("postingListBody");
  listEl.innerHTML = "";

  const filtered = filter
    ? allPosts.filter((p) => p.id.toLowerCase().includes(filter.toLowerCase()))
    : allPosts;

  if (filtered.length === 0) {
    listEl.innerHTML = `<tr><td colspan="3" class="empty-state">Tidak ada posting ditemukan.</td></tr>`;
    return;
  }

  filtered.forEach((post) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="ID">#${post.id}</td>
      <td data-label="Link"><code>?id=${post.id}</code></td>
      <td data-label="Aksi" class="row-actions">
        <button class="btn btn-sm btn-ghost" data-action="preview">Preview</button>
        <button class="btn btn-sm btn-ghost" data-action="edit">Edit</button>
        <button class="btn btn-sm btn-ghost" data-action="copy">Copy Link</button>
        <button class="btn btn-sm btn-ghost" data-action="share">Share</button>
        <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
      </td>`;

    tr.querySelector('[data-action="preview"]').addEventListener("click", () => previewPost(post.id));
    tr.querySelector('[data-action="edit"]').addEventListener("click", () => loadPostForEdit(post));
    tr.querySelector('[data-action="copy"]').addEventListener("click", () => copyLink(post.id));
    tr.querySelector('[data-action="share"]').addEventListener("click", () => sharePost(post.id));
    tr.querySelector('[data-action="delete"]').addEventListener("click", () => openDeleteModal(post.id));

    listEl.appendChild(tr);
  });
}

function initPostingSearch() {
  document.getElementById("postingSearchInput").addEventListener("input", (e) => {
    renderPostingList(e.target.value.trim());
  });
}

function initDeleteModal() {
  document.getElementById("deleteCancelBtn").addEventListener("click", closeDeleteModal);
  document.getElementById("deleteConfirmBtn").addEventListener("click", confirmDelete);
}

// ------------------------------------------------------------
// Inisialisasi utama
// ------------------------------------------------------------
function initForms() {
  buildDataUtamaForm();
  buildPostingForm();

  document.getElementById("dataUtamaForm").addEventListener("submit", saveDataUtama);
  document.getElementById("postingForm").addEventListener("submit", savePosting);
  document.getElementById("postingResetBtn").addEventListener("click", resetPostingForm);
  document.getElementById("postingAutoIdBtn").addEventListener("click", prefillNextId);
}

async function bootstrap(user) {
  document.getElementById("adminEmailLabel").textContent = user.email || "";

  initNavigation();
  initDarkMode();
  initLogout();
  initForms();
  initPostingSearch();
  initDeleteModal();

  setLoading(true);
  try {
    await loadDataUtama();
    allPosts = await fetchAllPosts();
    renderDashboardStats();
    renderPostingList();
  } catch (err) {
    console.error(err);
    showToast("Gagal memuat data dashboard", "error");
  } finally {
    setLoading(false);
  }
}

requireAuth(bootstrap);
