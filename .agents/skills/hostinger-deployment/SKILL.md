---
name: hostinger-deployment
description: "SOP dan panduan lengkap deploy ke Hostinger untuk Sebaris.id, auto-sync frontend/dist ke root public_html, workflow Git commit-and-push ke GitHub, dan pantangan server shared hosting."
---

# SOP Deployment & Git Workflow Hostinger (Sebaris.id)

File acuan utama: `HOSTINGER-DEPLOY-GUIDE.md` di root project.

Gunakan skill ini setiap kali melakukan perubahan kode, penambahan fitur, perbaikan bug, atau instruksi yang berhubungan dengan deployment ke server Hostinger.

---

## 0. Info Server Production (WAJIB BACA DULU)

| Item | Nilai |
|---|---|
| **Domain aktif** | `https://sebarisproject.id` |
| **Folder server** | `~/domains/sebarisproject.id/public_html/` |
| **Domain lama (NON-AKTIF)** | `sebaris.pojoktungu59.com` — JANGAN digunakan |

> **PERHATIAN AGENT:** Jika ada referensi lama ke `sebaris.pojoktungu59.com` atau `sebaris.id` di kode atau dokumentasi, itu adalah domain lama yang sudah tidak dipakai. Domain aktif adalah `sebarisproject.id`.

---

## 1. Aturan Wajib: Push Setiap Update ke GitHub

> **PERINGATAN KERAS:** Jangan pernah membiarkan commit menggantung di lokal.

1. **Build Frontend & Auto-Sync**:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
   Script `frontend/scripts/sync-dist.js` otomatis menyalin hasil build ke root (`index.html` dan `assets/`).

2. **Commit dengan Pesan Jelas**:
   ```bash
   git add .
   git commit -m "<type>(<scope>): <deskripsi jelas>"
   ```

3. **Push serentak ke 3 branch** (satu command):
   ```bash
   git push origin local && git push origin local:hosting && git push origin local:main
   ```
   Jangan checkout ke branch lain. Gunakan format `local:hosting` dan `local:main` agar tetap di branch `local`.

---

## 2. Struktur Direktori Hostinger

```
~/domains/sebarisproject.id/public_html/   ← ROOT repository Git
├── index.html                              ← Frontend React (hasil build)
├── assets/                                 ← JS/CSS bundle
├── .htaccess                               ← Router utama
└── backend/
    ├── public/index.php                    ← Entry Laravel (untuk /api/...)
    └── storage/app/public/                 ← File upload (foto, dll)
        ├── finalists/
        ├── categories/
        └── banners/
```

### Penting: Storage Tanpa Symlink

`.htaccess` dikonfigurasi agar `/storage/...` langsung ke folder fisik:
```apache
RewriteRule ^storage(/.*)?$ backend/storage/app/public$1 [L]
```

- **JANGAN** ubah ke `backend/public/storage` (itu path symlink, tidak ada di Hostinger)
- **JANGAN** jalankan `php artisan storage:link` (tidak diperlukan)
- Laravel menyimpan upload ke `backend/storage/app/public/[folder]/` — path ini yang benar

---

## 3. Pantangan Keras di Server Hostinger (Shared Hosting)

1. **DILARANG** `php artisan serve` di SSH Hostinger
2. **DILARANG** `npm run dev` atau `npm run build` di SSH Hostinger
3. **DILARANG** mengaktifkan "Cache Manager / Cache Otomatis" di hPanel
4. **DILARANG** `git push --force` ke branch `hosting` atau `main`
5. **DILARANG** `php artisan storage:link` — sudah dihandle `.htaccess`

---

## 4. Cara Update di Hostinger

### Cara A: Paling Praktis (1 Klik)
1. Login hPanel → **Tingkat Lanjut (Advanced)** → **Git**
2. Klik tombol **Tarik (Pull)**

### Cara B: SSH (Jika Perlu Migrasi Manual)
```bash
cd ~/domains/sebarisproject.id/public_html
git pull origin local
cd backend
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

### Cara C: Tanpa SSH (Via Browser)
```
https://sebarisproject.id/api/deploy-migrate?key=sebaris-deploy-2026&seed=1
```
