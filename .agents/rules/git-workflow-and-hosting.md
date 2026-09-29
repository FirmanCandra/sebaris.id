# Aturan Git Workflow & Hosting Deployment (Sebaris.id)

Peraturan WAJIB bagi setiap AI Coding Agent (Antigravity, Claude, Cursor, dsb.) yang bekerja di repositori ini:

## 1. Selalu Gunakan Kode Terbaru (Anti-Regresi)
- Sebelum mulai bekerja atau mengedit file, WAJIB pastikan branch aktif adalah `local` dan berisi commit paling mutakhir.
- Jalankan pengecekan cepat: `git status` dan `git log -n 1 origin/main`.
- **DILARANG KERAS** melakukan `git checkout` ke commit lama atau branch lawas yang menyebabkan status detached HEAD atau menimpa fitur yang telah dikembangkan sebelumnya.
- Selalu bangun fitur di atas commit TERAKHIR.

## 2. Push Wajib ke 3 Branch: `local`, `hosting`, dan `main`
- Setiap kali selesai memperbaiki bug, memodifikasi tampilan, atau menambahkan fitur:
  1. Jalankan `npm run build` di folder `frontend/` (otomatis meng-compile bundle dan menyinkronkan file ke root `index.html` dan `assets/` via `scripts/sync-dist.js`).
  2. Stage semua perubahan: `git add .` atau `git add -A`.
  3. Buat commit Git dengan pesan jelas: `git commit -m "<type>(<scope>): <deskripsi>"`.
  4. Lakukan push SERENTAK ke 3 target branch:
     ```bash
     git push origin local && git push origin local:hosting && git push origin local:main
     ```
- **PENTING TENTANG KONTRIBUSI GITHUB**:
  - GitHub Contribution Graph (kotak hijau profil) **HANYA** menghitung commit yang masuk ke default branch (`main`).
  - Jika agent hanya push ke `local` atau `hosting`, atau jika agent mem-push commit lama ke `main`, maka kotak kontribusi user di GitHub akan berkurang/hilang.
  - Oleh karena itu, branch `main` HARUS selalu di-update bersamaan dengan `hosting` dan `local` pada SETIAP kali commit!

## 3. Pantangan Keras (Zero Tolerance)
- **DILARANG FORCE PUSH MENIMPA COMMIT TERBARU**: Jangan pernah menjalankan `git push --force` ke branch `hosting` atau `main` menggunakan commit lama.
- **Dilarang membiarkan commit tertinggal di lokal**: Setiap pekerjaan selesai WAJIB langsung di-build dan di-push.
- **Dilarang build di server Hostinger**: Dilarang menjalankan `php artisan serve` atau `npm run build` via SSH Hostinger. Semua build dilakukan di lokal lalu di-push ke GitHub.
- **Dilarang mengaktifkan Cache Manager di hPanel**: Menjaga data voting dan perolehan suara tetap real-time.
- Update di Hostinger dilakukan dengan mengklik **Tarik (Pull)** di menu hPanel Git.

