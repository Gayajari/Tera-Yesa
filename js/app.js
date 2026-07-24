// js/app.js
// ============================================================
// Logika halaman publik (index.html)
// ------------------------------------------------------------
// 1. Baca parameter ?id= dari URL.
// 2. Ambil document "links/utama" sebagai template dasar.
// 3. Jika ada ?id=, ambil document "links/{id}" dan gabungkan:
//    field yang ADA di document id akan menimpa field utama,
//    field yang TIDAK ADA tetap memakai nilai dari utama.
// 4. Render seluruh field (play1-3, foto1-2, galeri1-3) ke DOM.
// ============================================================
import { db, doc, getDoc } from "./firebase.js";

const COLLECTION_NAME = "links";
const MAIN_DOC_ID = "utama";

/** Field default kalau document utama sama sekali belum diisi */
const FALLBACK_DATA = {
  play1: "#",
  play2: "#",
  play3: "#",
  foto1: "",
  foto1Link: "#",
  foto2: "",
  foto2Link: "#",
  galeri1: "",
  galeri1Link: "#",
  galeri2: "",
  galeri2Link: "#",
  galeri3: "",
  galeri3Link: "#",
};

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function fetchDoc(docId) {
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, docId));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error(`Gagal mengambil document "${docId}":`, err);
    return null;
  }
}

/**
 * Gabungkan data utama dengan data override.
 * Hanya field yang benar-benar ada (bukan undefined) di override
 * yang akan menimpa nilai dari data utama.
 */
function mergeData(mainData, overrideData) {
  const merged = { ...FALLBACK_DATA, ...(mainData || {}) };
  if (overrideData) {
    for (const key of Object.keys(overrideData)) {
      if (overrideData[key] !== undefined && overrideData[key] !== "") {
        merged[key] = overrideData[key];
      }
    }
  }
  return merged;
}

function setImageField(imgId, linkWrapperId, url, link) {
  const img = document.getElementById(imgId);
  const wrapper = document.getElementById(linkWrapperId);
  if (img) {
    img.src = url && url.trim() !== "" ? url : "assets/placeholder.png";
    img.loading = "lazy";
  }
  if (wrapper) {
    wrapper.href = link && link.trim() !== "" ? link : "#";
  }
}

function setPlayButton(btnId, link) {
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.href = link && link.trim() !== "" ? link : "#";
  }
}

function renderData(data) {
  setPlayButton("play1Btn", data.play1);
  setPlayButton("play2Btn", data.play2);
  setPlayButton("play3Btn", data.play3);

  setImageField("foto1Img", "foto1Link", data.foto1, data.foto1Link);
  setImageField("foto2Img", "foto2Link", data.foto2, data.foto2Link);

  setImageField("galeri1Img", "galeri1Link", data.galeri1, data.galeri1Link);
  setImageField("galeri2Img", "galeri2Link", data.galeri2, data.galeri2Link);
  setImageField("galeri3Img", "galeri3Link", data.galeri3, data.galeri3Link);
}

function hideLoader() {
  const loader = document.getElementById("pageLoader");
  if (loader) loader.classList.add("hidden");
}

function showErrorState() {
  const container = document.getElementById("mainContent");
  if (container) {
    container.innerHTML = `
      <div class="error-state">
        <p>Konten belum tersedia. Silakan cek kembali nanti.</p>
      </div>`;
  }
}

async function init() {
  const id = getIdFromUrl();
  const mainData = await fetchDoc(MAIN_DOC_ID);

  if (!mainData) {
    hideLoader();
    showErrorState();
    return;
  }

  let finalData = mainData;

  if (id) {
    const overrideData = await fetchDoc(id);
    finalData = mergeData(mainData, overrideData);
  } else {
    finalData = mergeData(mainData, null);
  }

  renderData(finalData);
  hideLoader();
}

document.addEventListener("DOMContentLoaded", init);
