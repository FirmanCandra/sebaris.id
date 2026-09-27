# Agent Guidelines - Sebaris.id

Pedoman perilaku dan alur kerja untuk AI Coding Agent di repositori Sebaris.id:

## 1. Aturan Wajib Git & Deployment
- **Setiap selesai update fitur atau bugfix, WAJIB langsung di-build dan di-push ke GitHub.**
  - Jalankan `npm run build` di folder `frontend/` (otomatis menyinkronkan bundle ke root `index.html` dan `assets/` untuk Hostinger).
  - Jalankan `git add .` dan buat commit dengan pesan deskriptif.
  - Push ke branch `local`, `hosting`, dan `main`.
  - Jangan pernah menunda atau membiarkan commit tertinggal di lokal.

## 2. Aturan Hosting Hostinger
- Sumber acuan: `HOSTINGER-DEPLOY-GUIDE.md`.
- Dilarang menjalankan `php artisan serve` atau `npm run build` di SSH Hostinger.
- Dilarang menyalakan "Cache Manager" di hPanel Hostinger (menjaga tabulasi E-Voting tetap real-time).
- Update di Hostinger cukup dengan mengklik **Tarik (Pull)** di menu hPanel Git.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `.agents/skills/antislop/SKILL.md` (core) and then the skill for the task:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Mobile / responsive: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Hostinger deployment: `.agents/skills/hostinger-deployment/SKILL.md`
<!-- antislop:end -->
