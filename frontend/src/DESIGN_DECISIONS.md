# Keputusan Desain & Antislop Rationale — sebaris.id

Dokumen ini mencatat alasan satu baris (one-line reason) dari setiap keputusan desain sesuai aturan **R-31** dan **C-1** dalam Anti Slop UI.

## 1. Rationale Keputusan Desain (R-31)

- **Warna (#70B325 & #D0FE15):** Diambil langsung dari identitas resmi `design.md` dan referensi `dfd4efe7-7c31-436b-a2a0-93dd6d2dc712.png` untuk menciptakan kesan segar, terpercaya, dan ramah lingkungan tanpa memakai gradien biru-ungu default AI.
- **Warna Latar (#F8FAF7 & #FFFFFF):** Memakai nuansa netral dengan sedikit sentuhan hangat (sage tint) agar permukaan konten memiliki kontras tinggi (WCAG AA > 4.5:1) terhadap teks ink `#262A25`.
- **Layout Halaman Publik:** Mengikuti alur narasi referensi pengguna (Hero -> Filter Kategori -> Voting Terpopuler + Widget Cek Vote -> Voting Terbaru -> Event Rekomendasi) agar komposisi mencerminkan kebutuhan interaksi pengguna, bukan template landing page bento generik.
- **Tipografi (Inter & Plus Jakarta Sans):** Dipilih karena memiliki struktur geometris dan bowl huruf yang selaras dengan logotype `sebaris.id`, serta keterbacaan yang sangat tinggi pada angka persentase, tabel, dan label formulir.
- **Kartu & Spacing (16px border-radius & 20px gap):** Menggunakan radius melengkung alami dan elevasi bayangan halus untuk memisahkan tingkatan informasi tanpa membuat elemen terlihat mengambang berlebihan.
- **Ilustrasi Hero (Pilih Kandidat & Kotak Suara 3D):** Menggambarkan alur kerja inti voting secara visual dan kontekstual (surat suara terverifikasi dan kotak suara aman), menggantikan ornamen abstrak atau ilustrasi generik yang tidak relevan.
- **Ikon UI (SVG Semantik):** Menggunakan ikon berbasis aksi riil (pencarian, api untuk trending, jam untuk terbaru, kalender untuk event, centang untuk verifikasi) tanpa memakai ikon bintang/magic/sparkle default AI.
- **Dashboard Admin:** Menampilkan 4 kartu ringkasan metrik berbasis data riil (Total Event, Kategori, Finalis, Total Suara) serta memisahkan formulir ke dalam drawer slide-over agar tabel data memiliki ruang horizontal yang lega dan mudah dipindai.

## 2. Antislop Dials
- **ENERGY:** 2 (Balanced — bersih, segar, dan percaya diri seperti Stripe/Vercel dengan aksen warna brand yang hidup).
- **RHYTHM:** 2 (Beragam terstruktur — transisi dari hero ilustrasi ke grid kartu voting dan daftar horizontal terbaru).
- **MOTION:** 1 (Fokus pada interaksi hover, focus ring, transisi drawer, dan modal tanpa loop animasi berulang yang mengganggu).

## 3. Verifikasi Gate
- [x] Kontras warna memenuhi standar WCAG AA (teks gelap di atas latar terang, rasio > 4.5:1).
- [x] Tanpa karakter em dash (`—`) pada copy UI.
- [x] Tombol dan kontrol interaktif memiliki fungsi nyata (pencarian, filter kategori, pengecekan resi suara, formulir suara gratis, CRUD admin).
- [x] Desain responsif di semua ukuran layar (desktop, tablet, mobile).
- [x] Mode gelap dan terang diuji dan berfungsi penuh.
