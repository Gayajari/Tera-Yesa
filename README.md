# CMS Firebase (HTML5 + CSS3 + Vanilla JS)

CMS ringan tanpa framework (tanpa React/Vue) menggunakan **Firebase Authentication** dan **Firestore Database** untuk data, serta **ImgBB** untuk hosting gambar (bukan Firebase Storage — jadi tidak perlu upgrade ke paket Blaze). Setelah proyek ini di-deploy satu kali ke Vercel, seluruh pengelolaan konten (tombol Play, foto besar, galeri) dilakukan lewat panel admin — **tidak perlu edit kode, upload ulang GitHub, atau deploy ulang Vercel**.

## Struktur Proyek

```
├── index.html          # Halaman publik (baca data dari Firestore)
├── login.html          # Halaman login admin
├── admin.html          # Dashboard admin (proteksi login)
├── css/
│   ├── style.css       # Style halaman publik
│   └── admin.css       # Style login & dashboard admin
├── js/
│   ├── firebase.js     # Konfigurasi & inisialisasi Firebase
│   ├── app.js          # Logika halaman publik (index.html)
│   ├── auth.js         # Helper login/logout/proteksi halaman
│   └── admin.js        # Logika dashboard admin (CRUD)
├── assets/              # Gambar/placeholder
├── firestore.rules      # Security rules Firestore
├── vercel.json
└── README.md
```

## 1. Membuat Project Firebase

1. Buka [https://console.firebase.google.com](https://console.firebase.google.com).
2. Klik **Add project**, beri nama bebas, lanjutkan sampai selesai (Google Analytics opsional, boleh dimatikan).
3. Setelah project dibuat, klik ikon **Web (</>)** untuk mendaftarkan aplikasi web baru.
4. Beri nama app, **jangan** centang Firebase Hosting (kita pakai Vercel).
5. Firebase akan menampilkan objek `firebaseConfig` — salin nilainya, akan dipakai di langkah 5.

## 2. Mengaktifkan Authentication

1. Di Firebase Console, buka menu **Build > Authentication**.
2. Klik **Get started**.
3. Pada tab **Sign-in method**, aktifkan provider **Email/Password**.
4. Buka tab **Users**, klik **Add user**, isi email & password untuk akun admin Anda.
   (Akun inilah yang akan dipakai login di `login.html`.)

## 3. Membuat Firestore Database

1. Buka menu **Build > Firestore Database**.
2. Klik **Create database**, pilih mode **Production**, pilih lokasi server terdekat.
3. Setelah database aktif, buka tab **Rules**, hapus isinya, lalu tempel isi file `firestore.rules` dari proyek ini. Klik **Publish**.
4. Buat collection baru bernama **`links`**.
5. Tambahkan document pertama dengan **ID = `utama`**, isi dengan field berikut (semua bertipe *string*):
   - `play1`, `play2`, `play3`
   - `foto1`, `foto1Link`, `foto2`, `foto2Link`
   - `galeri1`, `galeri1Link`, `galeri2`, `galeri2Link`, `galeri3`, `galeri3Link`

   Document `utama` ini adalah **template dasar**. Document lain (`201`, `202`, dst.) cukup nanti dibuat lewat panel admin dan hanya perlu menyimpan field yang berbeda saja.

## 4. Membuat API Key ImgBB (untuk upload gambar)

Proyek ini memakai **ImgBB** untuk hosting gambar, bukan Firebase Storage — jadi tidak perlu upgrade paket Firebase.

1. Buka [https://api.imgbb.com](https://api.imgbb.com), login pakai akun Google.
2. Salin **API Key** yang tampil di halaman tersebut.
3. Buka file `js/admin.js`, cari baris:
   ```js
   const IMGBB_API_KEY = "GANTI_DENGAN_IMGBB_API_KEY";
   ```
   Ganti dengan API key Anda.

Kalau Anda tidak mau pakai fitur "Upload ke ImgBB" sama sekali, tidak masalah — kolom **Direct Image URL** di admin tetap bisa diisi manual dengan link gambar dari ibb.co atau sumber lain.

## 5. Mengisi firebaseConfig

1. Buka file `js/firebase.js`.
2. Ganti seluruh nilai `"GANTI_DENGAN_..."` dengan nilai dari `firebaseConfig` yang Anda salin di Langkah 1.

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "nama-project.firebaseapp.com",
  projectId: "nama-project",
  storageBucket: "nama-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxxx",
};
```

## 6. Upload Proyek ke GitHub

```bash
git init
git add .
git commit -m "Initial commit - CMS Firebase"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

## 7. Deploy ke Vercel

1. Buka [https://vercel.com](https://vercel.com), login dengan akun GitHub.
2. Klik **Add New > Project**, pilih repository yang baru saja di-push.
3. Karena ini proyek statis (tanpa build step), biarkan pengaturan **Framework Preset: Other**, **Build Command** kosong, **Output Directory** kosong (root).
4. Klik **Deploy**. Setelah selesai Anda akan mendapat URL seperti `https://nama-proyek.vercel.app`.
5. **Tambahkan domain Vercel Anda ke Firebase**: buka Firebase Console > Authentication > Settings > **Authorized domains** > tambahkan `nama-proyek.vercel.app`.

Selesai — deploy ini **hanya dilakukan satu kali**. Setelah ini semua update konten cukup lewat panel admin.

## 8. Login Pertama Kali

1. Buka `https://nama-proyek.vercel.app/login.html`.
2. Masuk dengan email & password akun admin yang dibuat di Langkah 2.
3. Anda akan diarahkan otomatis ke dashboard admin.

## 9. Mengelola Konten Lewat Admin

### Data Utama
Menu **Data Utama** mengubah document `links/utama` — ini adalah data default yang tampil jika halaman dibuka tanpa parameter `?id=`, dan juga jadi dasar untuk semua posting lain.

### Membuat Posting Baru
Menu **Tambah** membuat document baru (misalnya `201`, `202`, `205`). Klik tombol **Auto ID** untuk otomatis mengisi ID berikutnya berdasarkan angka terbesar yang ada. Anda hanya perlu mengisi field yang **berbeda** dari data utama — field yang dikosongkan otomatis memakai nilai dari `links/utama`.

Untuk gambar, Anda bisa:
- Mengisi manual kolom **Direct Image URL** (misalnya link dari ibb.co), atau
- Klik **Upload ke ImgBB** untuk mengunggah gambar langsung ke ImgBB — URL hasil upload otomatis mengisi kolom Direct Image URL, dan preview langsung tampil tanpa reload.

### Mengedit Posting
Buka menu **Posting**, cari ID lewat kolom pencarian, lalu klik **Edit** pada baris yang diinginkan. Form Tambah akan terisi otomatis dengan data posting tersebut.

### Menghapus Posting
Klik **Delete** pada baris posting — akan muncul dialog konfirmasi sebelum data benar-benar dihapus.

### Membagikan Link
- **Preview**: membuka halaman publik dengan data posting tersebut di tab baru.
- **Copy Link**: menyalin URL seperti `https://nama-proyek.vercel.app/?id=205` ke clipboard.
- **Share**: membuka menu share bawaan perangkat (Web Share API) untuk dibagikan ke WhatsApp, Telegram, dll. Di desktop yang tidak mendukung Web Share API, tombol ini otomatis menyalin link ke clipboard sebagai alternatif.

## Cara Kerja Penggabungan Data (?id=)

- `https://domain.vercel.app` → menampilkan document `links/utama` apa adanya.
- `https://domain.vercel.app/?id=205` → mengambil `links/utama` sebagai dasar, lalu mengambil `links/205` dan menimpa field yang memang diisi di document `205`. Field yang kosong/tidak ada di `205` tetap memakai nilai dari `utama`.

## Catatan Keamanan

- Siapa saja bisa **membaca** data (`links/*`) — dibutuhkan agar halaman publik bisa tampil.
- Hanya user yang **sudah login** yang bisa menulis, mengubah, atau menghapus data (lihat `firestore.rules`).
- Jangan bagikan email/password akun admin, maupun API key ImgBB, ke orang lain.

## Pengembangan Lanjutan

Proyek ini modular sehingga mudah dikembangkan, misalnya menambah field baru pada document, menambah jenis media lain, atau mengganti tampilan lewat `css/style.css` dan `css/admin.css` tanpa mengubah logika di folder `js/`.
