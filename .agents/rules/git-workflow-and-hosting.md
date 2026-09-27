# Aturan Git Workflow & Hosting Deployment (Sebaris.id)

Peraturan wajib bagi setiap AI Agent yang bekerja di repositori ini:

## 1. Selalu Push Setiap Selesai Update
- Setiap kali selesai memperbaiki bug, memodifikasi tampilan, menambahkan komponen, atau memperbarui fitur:
  1. Jalankan `npm run build` di folder `frontend/` untuk meng-compile kode dan menyinkronkan aset ke root (`index.html` dan `assets/`).
  2. Buat commit Git dengan format semantik yang jelas: `git commit -m "<type>(<scope>): <deskripsi>"`.
  3. Lakukan push ke remote GitHub:
     - Push branch `local`
     - Fast-forward merge ke branch `hosting` dan push
     - Fast-forward merge ke branch `main` dan push
     - Kembalikan HEAD ke branch `local`
- Dilarang membiarkan commit atau modifikasi menggantung di lokal tanpa di-push ke remote GitHub.

## 2. Kepatuhan SOP Hostinger (Berdasarkan HOSTINGER-DEPLOY-GUIDE.md)
- Root repository adalah folder `public_html/` di Hostinger.
- Build frontend (`frontend/dist`) otomatis disalin ke root `public_html/index.html` dan `public_html/assets/` melalui script `frontend/scripts/sync-dist.js`.
- Jangan pernah menyarankan atau menjalankan `php artisan serve` atau `npm run build` di SSH Hostinger.
- Ingatkan pengguna agar tidak mengaktifkan "Cache Manager / Cache Otomatis" di hPanel Hostinger demi menjaga sifat real-time data E-Voting.
- Arahkan pengguna untuk melakukan update di Hostinger via menu **hPanel Git (Tarik / Pull)** atau endpoint migrasi otomatis.
