---
name: hostinger-deployment
description: "SOP dan panduan lengkap deploy ke Hostinger untuk Sebaris.id, auto-sync frontend/dist ke root public_html, workflow Git commit-and-push ke GitHub, dan pantangan server shared hosting."
---

# SOP Deployment & Git Workflow Hostinger (Sebaris.id)

File acuan utama: `HOSTINGER-DEPLOY-GUIDE.md` di root project.

Gunakan skill ini setiap kali melakukan perubahan kode, penambahan fitur, perbaikan bug, atau instruksi yang berhubungan dengan deployment ke server Hostinger (`sebaris.pojoktungu59.com`).

---

## 1. Aturan Wajib: Push Setiap Update ke GitHub

> **PERINGATAN KERAS:** Jangan pernah membiarkan commit atau perubahan kode menggantung di lokal (*"dianggurin"*). Setiap kali fitur/bugfix selesai diuji:

1. **Build Frontend & Auto-Sync**:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
   *Catatan:* Script `frontend/scripts/sync-dist.js` otomatis menyalin hasil build ke root (`index.html` dan `assets/`) agar web server Hostinger dapat langsung membacanya.

2. **Commit dengan Pesan Jelas**:
   ```bash
   git add .
   git commit -m "<type>(<scope>): <deskripsi jelas perubahan>"
   ```

3. **Sinkronisasi & Push ke Semua Branch Utama**:
   ```bash
   git push origin local
   git checkout hosting && git merge local --ff-only && git push origin hosting
   git checkout main && git merge local --ff-only && git push origin main
   git checkout local
   ```

---

## 2. Struktur Direktori Hostinger

Di server Hostinger, repository di-clone ke:
`~/domains/sebaris.pojoktungu59.com/public_html/`

- **Root `public_html/` adalah root repository Git.**
- **Frontend (React)**: Disajikan langsung dari root `index.html` dan `assets/`.
- **Backend (Laravel)**: Berada di `backend/`. Request `/api/...` dialihkan oleh root `.htaccess` ke `backend/public/index.php`.

---

## 3. Pantangan Keras di Server Hostinger (Shared Hosting)

Hostinger yang digunakan adalah tipe **Shared Hosting** dengan batas RAM & CPU CloudLinux LVE yang ketat.

1. ❌ **DILARANG menjalankan `php artisan serve` di SSH Hostinger.**  
   *Alasan:* Server Hostinger sudah memiliki web server bawaan (LiteSpeed/Apache). `serve` memakan proses tak berujung dan menyebabkan server *refused/connection timed out*.
2. ❌ **DILARANG menjalankan `npm run dev` atau `npm run build` di SSH Hostinger.**  
   *Alasan:* Node.js build menghabiskan 100% CPU/RAM shared hosting. Seluruh build **WAJIB** dikerjakan di lokal.
3. ❌ **DILARANG mengaktifkan "Cache Manager / Cache Otomatis" di hPanel Hostinger.**  
   *Alasan:* Cache otomatis akan membypass PHP dan menyimpan respon halaman selama 30 menit. Ini membuat tabulasi suara (*leaderboard*) tidak real-time dan update kodingan tertahan.

---

## 4. Cara Update di Hostinger (Untuk User)

Beri panduan ke user untuk memilih salah satu dari 2 cara update:

### Cara A: Paling Praktis (Lewat hPanel Git - Cukup 1 Klik)
1. Buka browser ➔ login ke **hPanel Hostinger**.
2. Masuk ke menu **Tingkat Lanjut (Advanced)** ➔ klik **Git**.
3. Klik tombol **Tarik (Pull)**.

### Cara B: Lewat Terminal SSH (Jika Perlu Migrasi Manual)
```bash
cd ~/domains/sebaris.pojoktungu59.com/public_html
git pull origin local
cd backend
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

*(Alternatif migrasi tanpa SSH: Buka browser ke endpoint `https://sebaris.id/api/deploy-migrate?key=sebaris-deploy-2026&seed=1`)*.
