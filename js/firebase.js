// js/firebase.js
// ============================================================
// Konfigurasi & inisialisasi Firebase (Authentication + Firestore)
// ------------------------------------------------------------
// Catatan: proyek ini TIDAK memakai Firebase Storage. Upload
// gambar dilakukan langsung ke ImgBB (lihat js/admin.js), jadi
// Anda tidak perlu mengaktifkan Storage atau upgrade ke paket Blaze.
// ============================================================
// PENTING: Ganti seluruh nilai di bawah ini dengan konfigurasi
// project Firebase Anda sendiri. Anda bisa mendapatkan nilai ini
// dari Firebase Console > Project Settings > General > Your apps > SDK setup and configuration.
//
// Lihat README.md bagian "Setup Firebase" untuk panduan lengkap.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ------------------------------------------------------------
// GANTI DENGAN firebaseConfig MILIK ANDA
// ------------------------------------------------------------
  const firebaseConfig = {
  apiKey: "AIzaSyChs-RWRRQHhLOMoEddqp4NxIEThBtwTVY",
  authDomain: "tera-yesa-6d925.firebaseapp.com",
  projectId: "tera-yesa-6d925",
  storageBucket: "tera-yesa-6d925.firebasestorage.app",
  messagingSenderId: "291350135855",
  appId: "1:291350135855:web:757fddff1e01d115af32da",
  measurementId: "G-0QG6QJGQT0"
};

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi layanan yang dipakai
export const auth = getAuth(app);
export const db = getFirestore(app);

// Re-export fungsi Firebase yang dibutuhkan modul lain
// supaya file lain cukup import dari "./firebase.js" saja.
export {
  // Auth
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  // Firestore
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
};
