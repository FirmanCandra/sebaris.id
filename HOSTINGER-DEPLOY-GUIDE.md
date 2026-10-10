# HOSTINGER DEPLOY GUIDE - Sebaris.id

Dokumen ini adalah SOP resmi untuk update/deploy ke server Hostinger production.

---

## 1. Informasi Server Production (TERKINI)

| Item | Nilai | Keterangan |
|---|---|---|
| **Domain Aktif** | `https://sebarisproject.id` | Domain live di Hostinger |
| **hPanel Path** | `~/domains/sebarisproject.id/public_html/` | Root Git repository |
| **DB Driver / Host** | `mysql` / `127.0.0.1:3306` | MySQL Shared Hosting |
| **DB Name / User** | `u267893077_sebaris` | Database production |
| **DB Password** | *Tersimpan aman di `.env` server & `PRODUCTION-CONFIG.local.md`* | Terproteksi `.gitignore` |
| **PHP Version** | `8.3` | LiteSpeed / Apache |
| **Google Client ID** | `807361118858-j9qvmtf21dn7gkl3je0v6g0njuuhcrg0.apps.googleusercontent.com` | Google OAuth2 |
| **Web Server** | LiteSpeed/Apache (Shared Hosting) |

> **CATATAN KEAMANAN:** File kredensial lengkap produksi disimpan di `backend/.env` (server) serta file lokal `PRODUCTION-CONFIG.local.md` dan `backend/.env.production` yang dilindungi `.gitignore` agar tidak bocor ke repositori publik GitHub.

---

## 2. Memahami Struktur Folder di Hostinger

Repository di-clone langsung ke:
```
~/domains/sebarisproject.id/public_html/
```

Folder `public_html/` adalah **ROOT direktori repository Git**.

Sesuai `.htaccess` di root:
1. **Frontend (React)**: Disajikan langsung dari root
   - `index.html` → `public_html/index.html`
   - `assets/` → `public_html/assets/index-[hash].js` & `.css`
2. **Backend (Laravel)**: Request `/api/...` diteruskan ke `backend/public/index.php`
3. **Storage (Upload)**: Request `/storage/...` diteruskan **langsung** ke `backend/storage/app/public/` (tanpa butuh symlink)

### Kenapa Storage Tidak Butuh Symlink

`.htaccess` sudah dikonfigurasi bypass symlink:
```apache
RewriteRule ^storage(/.*)?$ backend/storage/app/public$1 [L]
```

**JANGAN** mengubah ini menjadi `backend/public/storage` karena itu path symlink yang tidak tersedia di Hostinger Shared Hosting.

---

## 3. Solusi Otomatis (Auto-Sync)

Script `frontend/scripts/sync-dist.js` sudah terpasang.

Setiap `npm run build` otomatis:
1. Compile React ke `frontend/dist/`
2. Bersihkan bundle JS/CSS lama di root `assets/`
3. Salin ke root (`index.html`, `assets/`, favicon, dll)

---

## 4. Alur Kerja Resmi: Laptop ke Hosting

### LANGKAH 1: Di Laptop (Sebelum Push)

```bash
cd frontend
npm run build
cd ..
git add .
git commit -m "feat: deskripsi perubahan"
git push origin local && git push origin local:hosting && git push origin local:main
```

Tunggu konfirmasi: `[Auto-Sync] Berhasil menyinkronkan frontend/dist ke root (public_html) untuk Hostinger!`

### LANGKAH 2: Di Hostinger

**Cara Paling Praktis (1 klik):**
1. Login hPanel → menu **Tingkat Lanjut** → **Git**
2. Klik tombol **Tarik (Pull)**

**Cara SSH (Jika Perlu Migrasi):**
```bash
cd ~/domains/sebarisproject.id/public_html
git pull origin local
cd backend
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

**Cara tanpa SSH (via browser):**
```
https://sebarisproject.id/api/deploy-migrate?key=<DEPLOY_KEY>&seed=1
```
*(Ganti `<DEPLOY_KEY>` dengan secret key yang tercatat di `PRODUCTION-CONFIG.local.md`)*

---

## 5. PANTANGAN KERAS di Hostinger

1. **DILARANG** menjalankan `php artisan serve` di SSH Hostinger
2. **DILARANG** menjalankan `npm run dev` atau `npm run build` di SSH Hostinger
3. **DILARANG** mengaktifkan "Cache Manager" di hPanel (membuat leaderboard tidak real-time)
4. **DILARANG** `git push --force` ke branch `hosting` atau `main`
5. **DILARANG** menjalankan `php artisan storage:link` di Hostinger (tidak diperlukan, sudah dihandle `.htaccess`)

---

## 6. Troubleshooting

### Server Lemot / Refused
1. Login hPanel → **Hosting** → **Penggunaan Resource**
2. Klik **"Hentikan proses berjalan"**

### SSH Tidak Bisa Konek
1. hPanel → **Tingkat Lanjut** → **Akses SSH**
2. Nonaktifkan, tunggu 5 detik, aktifkan kembali
3. Atau ganti jaringan (hotspot) untuk IP baru

### Foto Upload Tidak Tampil
- Pastikan `.htaccess` storage rule mengarah ke `backend/storage/app/public$1` (bukan `backend/public/storage$1`)
- File fisik upload disimpan Laravel di `backend/storage/app/public/[folder]/`

---

*SOP ini diperbarui per 2026-10-01 untuk domain production baru `sebarisproject.id`.*
