// js/auth.js
// ============================================================
// Modul autentikasi: login, logout, dan proteksi halaman admin
// ============================================================
import {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "./firebase.js";

/**
 * Login menggunakan email & password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Logout user yang sedang aktif, lalu redirect ke halaman login.
 */
export async function logout() {
  await signOut(auth);
  window.location.href = "login.html";
}

/**
 * Proteksi halaman: jalankan callback hanya jika user sudah login.
 * Jika belum login, otomatis redirect ke login.html.
 * Dipakai di admin.html supaya tidak bisa diakses tanpa login.
 * @param {(user: import("firebase/auth").User) => void} onLoggedIn
 */
export function requireAuth(onLoggedIn) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      onLoggedIn(user);
    } else {
      window.location.href = "login.html";
    }
  });
}

/**
 * Dipakai di login.html: jika user sudah login, langsung
 * lempar ke dashboard admin supaya tidak perlu login ulang.
 * @param {() => void} onLoggedIn
 */
export function redirectIfLoggedIn(onLoggedIn) {
  onAuthStateChanged(auth, (user) => {
    if (user) onLoggedIn();
  });
}
