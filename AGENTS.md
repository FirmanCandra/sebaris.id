# Agent Guidelines - Sebaris.id

Pedoman perilaku dan alur kerja untuk AI Coding Agent di repositori Sebaris.id:

## 1. Aturan Wajib Git & Deployment
- **Sebelum mulai mengedit kode**:
  - WAJIB pastikan berada di branch `local` dengan commit paling mutakhir.
  - DILARANG KERAS checkout ke commit atau branch lama yang menyebabkan hilangnya fitur yang sudah dibuat sebelumnya (anti-regresi).
- **Setiap selesai update fitur atau bugfix, WAJIB langsung di-build dan di-push ke GitHub.**
  - Jalankan `npm run build` di folder `frontend/` (otomatis menyinkronkan bundle ke root `index.html` dan `assets/` untuk Hostinger).
  - Jalankan `git add .` dan buat commit dengan pesan deskriptif.
  - **Push serentak ke 3 branch** (satu command, jangan checkout):
    ```bash
    git push origin local && git push origin local:hosting && git push origin local:main
    ```
  - **PENTING**: Branch `main` adalah default branch di GitHub tempat dihitungnya **kontribusi profil (kotak hijau)**. Jangan pernah menunda push ke `main`, dan jangan biarkan `main` tertinggal atau ditimpa commit lama.
  - Jangan pernah menunda atau membiarkan commit tertinggal di lokal.

## 2. Informasi Production Server (TERKINI - 2026-10-01)

| Item | Nilai |
|---|---|
| **Domain aktif** | `https://sebarisproject.id` |
| **Folder server** | `~/domains/sebarisproject.id/public_html/` |
| **DB Name** | `u267893077_sebaris` |
| **DB User** | `u267893077_sebaris` |
| **PHP** | 8.3 (Shared Hosting Hostinger) |

> **Domain lama `sebaris.pojoktungu59.com` sudah NON-AKTIF.** Jika ada kode, konfigurasi, atau docs yang masih mereferensikan domain lama, itu harus diganti ke `sebarisproject.id`.

## 3. Aturan Hosting Hostinger
- Sumber acuan lengkap: `HOSTINGER-DEPLOY-GUIDE.md` dan `.agents/skills/hostinger-deployment/SKILL.md`.
- Dilarang menjalankan `php artisan serve` atau `npm run build` di SSH Hostinger.
- Dilarang menyalakan "Cache Manager" di hPanel Hostinger (menjaga tabulasi E-Voting tetap real-time).
- Update di Hostinger cukup dengan mengklik **Tarik (Pull)** di menu hPanel Git.
- Dilarang keras melakukan `git push --force` yang menimpa commit terbaru di branch `hosting` atau `main`.

## 4. Aturan Storage & File Upload

Storage file (foto finalis, banner, kategori) disimpan di:
```
backend/storage/app/public/[folder]/
```

Root `.htaccess` sudah dikonfigurasi agar `/storage/...` langsung ke folder fisik tanpa symlink:
```apache
RewriteRule ^storage(/.*)?$ backend/storage/app/public$1 [L]
```

- **DILARANG** mengubah rule ini ke `backend/public/storage` (itu path symlink yang tidak tersedia).
- **DILARANG** menjalankan `php artisan storage:link` di server (tidak diperlukan).
- Jika foto tidak tampil, periksa apakah file fisik ada di `backend/storage/app/public/`.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `.agents/skills/antislop/SKILL.md` (core) and then the skill for the task:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Mobile / responsive: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Hostinger deployment: `.agents/skills/hostinger-deployment/SKILL.md`
<!-- antislop:end -->
