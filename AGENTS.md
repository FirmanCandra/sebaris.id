# Agent Guidelines - Sebaris.id

Pedoman perilaku dan alur kerja untuk AI Coding Agent di repositori Sebaris.id:

## 1. Aturan Wajib Git & Deployment
- **Sebelum mulai mengedit kode**:
  - WAJIB pastikan berada di branch `local` dengan commit paling mutakhir.
  - DILARANG KERAS checkout ke commit atau branch lama yang menyebabkan hilangnya fitur yang sudah dibuat sebelumnya (anti-regresi).
- **Setiap selesai update fitur atau bugfix, WAJIB langsung di-build dan di-push ke GitHub.**
  - Jalankan `npm run build` di folder `frontend/` (otomatis menyinkronkan bundle ke root `index.html` dan `assets/` untuk Hostinger).
  - Jalankan `git add .` dan buat commit dengan pesan deskriptif.
  - **Push serentak ke 3 branch**:
    ```bash
    git push origin local && git push origin local:hosting && git push origin local:main
    ```
  - **PENTING**: Branch `main` adalah default branch di GitHub tempat dihitungnya **kontribusi profil (kotak hijau)**. Jangan pernah menunda push ke `main`, dan jangan biarkan `main` tertinggal atau ditimpa commit lama.
  - Jangan pernah menunda atau membiarkan commit tertinggal di lokal.

## 2. Aturan Hosting Hostinger
- Sumber acuan: `HOSTINGER-DEPLOY-GUIDE.md`.
- Dilarang menjalankan `php artisan serve` atau `npm run build` di SSH Hostinger.
- Dilarang menyalakan "Cache Manager" di hPanel Hostinger (menjaga tabulasi E-Voting tetap real-time).
- Update di Hostinger cukup dengan mengklik **Tarik (Pull)** di menu hPanel Git.
- Dilarang keras melakukan `git push --force` yang menimpa commit terbaru di branch `hosting` atau `main`.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `.agents/skills/antislop/SKILL.md` (core) and then the skill for the task:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Mobile / responsive: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Hostinger deployment: `.agents/skills/hostinger-deployment/SKILL.md`
<!-- antislop:end -->

