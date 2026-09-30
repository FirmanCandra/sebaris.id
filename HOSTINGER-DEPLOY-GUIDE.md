# HOSTINGER DEPLOY GUIDE - Sebaris.id

Dokumen ini adalah SOP resmi untuk update/deploy ke server Hostinger production.

---

## 1. Informasi Server Production (TERKINI)

| Item | Nilai |
|---|---|
| **Domain** | `https://sebarisproject.id` |
| **hPanel Path** | `~/domains/sebarisproject.id/public_html/` |
| **DB Name** | `u267893077_sebaris` |
| **DB User** | `u267893077_sebaris` |
| **DB Host** | `127.0.0.1` |
| **PHP Version** | 8.3 |
| **Web Server** | LiteSpeed/Apache (Shared Hosting) |

> **PENTING:** Domain lama `sebaris.pojoktungu59.com` sudah TIDAK digunakan. Semua referensi harus ke `sebarisproject.id`.

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
https://sebarisproject.id/api/deploy-migrate?key=sebaris-deploy-2026&seed=1
```

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
