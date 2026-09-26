# 🚀 PANDUAN DEPLOY & ATURAN UPDATE HOSTINGER (SEBARIS.ID)

Dokumen ini adalah SOP (Standar Operasional Prosedur) resmi untuk melakukan update/deploy ke server Hostinger (`sebaris.pojoktungu59.com`) agar **tidak terjadi error 404, layar putih (blank), web tidak ter-update, atau server lemot/refused**.

---

## 📌 1. Memahami Struktur Folder di Hostinger

Di server Hostinger, repository ini di-clone langsung ke dalam folder:
```
~/domains/sebaris.pojoktungu59.com/public_html/
```
Artinya, **folder `public_html/` adalah ROOT direktori dari repository Git kita**.

Sesuai aturan di file `.htaccess`:
1. **Frontend (React)**: Web server Hostinger langsung menyajikan file dari:
   - `index.html` &rarr; harus berada di **ROOT** (`public_html/index.html`)
   - `assets/` &rarr; harus berada di **ROOT** (`public_html/assets/index-[hash].js` & `.css`)
2. **Backend (Laravel)**: Semua panggilan `/api/...` otomatis diteruskan oleh `.htaccess` ke folder `public_html/backend/public/index.php`.

> ⚠️ **MASALAH YANG TERJADI SEBELUMNYA:**  
> Jika Anda hanya menjalankan `vite build`, hasilnya hanya tersimpan di dalam folder `frontend/dist/`. Web server Hostinger **TIDAK membaca** folder `frontend/dist/`, melainkan membaca root `index.html` dan `assets/`. Akibatnya web di hosting tidak berubah atau muncul error 404 aset JavaScript.

---

## ✨ 2. Solusi Otomatis (Auto-Sync)

Kabar baiknya, sistem sudah dipasangi script otomatis di `frontend/scripts/sync-dist.js`.  
Setiap kali Anda menjalankan:
```bash
npm run build
```
Sistem akan **otomatis**:
1. Meng-compile React ke `frontend/dist/`
2. Membersihkan file bundle JS/CSS lama di root `assets/`
3. Menyalin (`sync`) seluruh file terbaru langsung ke root (`index.html`, `assets/`, favicon, dll)

**Anda tidak perlu lagi menyalin file secara manual!**

---

## 🛠️ 3. Alur Kerja Resmi: Dari Laptop ke Hosting (Step-by-Step)

### LANGKAH 1: Di Laptop / Komputer Lokal (Sebelum Push)

Setiap kali selesai menambah fitur atau mengubah kode:

1. Masuk ke folder frontend dan jalankan build:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
   *(Tunggu sampai muncul notifikasi: `✅ [Auto-Sync] Berhasil menyinkronkan frontend/dist ke root (public_html) untuk Hostinger!`)*

2. Commit dan push ke branch **`local`** (selalu gunakan branch `local`):
   ```bash
   git add .
   git commit -m "feat: deskripsi perubahan"
   git push origin local
   ```

---

### LANGKAH 2: Di Server Hostinger (Saat Pull Update)

Buka terminal SSH Hostinger Anda, lalu jalankan satu blok perintah ini sekaligus:

```bash
cd ~/domains/sebaris.pojoktungu59.com/public_html
git pull origin local
cd backend
php artisan migrate --force
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

Setelah selesai, buka website **https://sebaris.pojoktungu59.com/** dan tekan `Ctrl + F5` (Hard Refresh). Semua fitur terbaru langsung tampil aktif!

---

## 🚫 4. PANTANGAN KERAS DI HOSTINGER (Biar Server Tidak Jebol/Refused)

Server Hostinger yang digunakan adalah tipe **Shared Hosting** dengan batas RAM dan CPU yang ketat (CloudLinux LVE).

Ikuti aturan ketat ini:
1. ❌ **JANGAN PERNAH menjalankan `php artisan serve` di SSH Hostinger!**  
   *Alasan:* Hostinger sudah memiliki web server bawaan (LiteSpeed/Apache). Menjalankan `serve` akan memakan proses background yang tidak pernah berhenti dan membuat CPU melonjak hingga server refused.
2. ❌ **JANGAN PERNAH menjalankan `npm run dev` atau `npm run build` di SSH Hostinger!**  
   *Alasan:* Node.js build sangat berat dan langsung menghabiskan 100% CPU/RAM shared hosting. Build **WAJIB** dilakukan di laptop lokal.
3. ❌ **JANGAN tinggalkan terminal SSH tanpa menghentikan proses (`Ctrl + C`)**.

---

## 🆘 5. Troubleshooting (Jika Server Mengalami Masalah)

### A. Server Lemot / Refused / Load Server Tinggi (Diatas 2.0)
Jika server terasa patah-patah atau menolak koneksi:
1. Login ke **https://hpanel.hostinger.com/**
2. Masuk ke menu **Hosting** &rarr; **Penggunaan Resource** (*Order / Resource Usage*).
3. Scroll ke bawah, klik tombol ungu: **"Hentikan proses berjalan"** (*Stop running processes*).
4. Klik **Konfirmasi**. Dalam 5 detik server akan langsung dingin dan normal kembali.

### B. SSH Tidak Bisa Konek / Port 65002 Refused
Jika SSH gagal konek karena firewall Hostinger membatasi IP Anda:
1. Buka hPanel &rarr; menu **Tingkat Lanjut** (*Advanced*) &rarr; **Akses SSH** (*SSH Access*).
2. Klik **Nonaktifkan**, tunggu 5 detik, lalu klik **Aktifkan** kembali.
3. Atau sambungkan laptop ke Hotspot HP sementara untuk mendapatkan IP baru yang bersih dari blokir firewall.

### C. Deploy Tanpa Perlu Buka SSH Sama Sekali (Paling Praktis)
Jika sedang malas membuka terminal SSH:
1. Buka hPanel &rarr; menu **Tingkat Lanjut** &rarr; **Git**.
2. Di baris repository `sebaris.id`, klik tombol **"Deploy"** atau **"Tarik" (Pull)**.
3. Hostinger akan otomatis menarik commit terbaru dari GitHub ke dalam `public_html/`.

---

*Panduan ini dibuat dan distandarisasi untuk kelancaran deployment Sebaris.id.*
