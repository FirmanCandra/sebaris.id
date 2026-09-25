# Design Guideline — sebaris.id

Dokumen ini merangkum identitas visual **sebaris.id** berdasarkan aset logo yang tersedia, sebagai acuan saat membangun UI (web/app), materi promosi, maupun dokumen internal.

---

## 1. Logo

Logo terdiri dari dua elemen:

1. **Logomark** — ikon geometris isometrik berbentuk susunan bidang paralelogram yang saling terhubung (kesan "tersusun/sejajar", selaras dengan makna kata *sebaris*). Salah satu bidang selalu tampil **solid**, sisanya berupa **outline/garis tipis**.
2. **Logotype** — tulisan `sebaris.id`, huruf kecil semua (lowercase), sans-serif tebal (bold/extrabold), tanpa spasi antar kata.

### Varian warna logo

Logo punya 3 varian resmi tergantung warna latar:

| Latar belakang | Logomark (bidang solid) | Logomark (outline) | Logotype |
|---|---|---|---|
| Hijau sage (`#819C65`) | Lime `#D0FE15` | Lime `#D0FE15` | Putih `#FFFFFF` |
| Putih (`#FFFFFF`) | Dark ink `#262A25` | Dark ink `#262A25` | Dark ink `#262A25` |
| Dark `#252A24` | Lime `#D0FE15` | Lime `#D0FE15` | Putih `#FFFFFF` |

**Aturan pemakaian:**
- Di atas latar terang/berwarna (sage atau dark), logomark & sebagian outline pakai **lime**, logotype pakai **putih**.
- Di atas latar **putih**, seluruh logo (mark + type) berubah jadi warna **dark ink**, bukan lime — supaya kontras tetap tinggi dan lime tidak "hilang" di atas putih.
- Jangan pernah pakai kombinasi lime‑on‑white atau dark‑ink‑on‑dark untuk logo (kontras terlalu rendah).

### Clear space & ukuran minimum
- Sisakan area kosong di sekeliling logo minimal setinggi huruf "s" pada logotype.
- Ukuran minimum logotype yang disarankan: 20px tinggi huruf kecil (untuk layar) — di bawah itu logomark sebaiknya dipakai sendiri tanpa logotype (favicon, app icon, avatar).

### Larangan (don'ts)
- Jangan mengubah proporsi logomark ke logotype.
- Jangan memutar, memberi outline tambahan, drop shadow, atau gradient pada logo.
- Jangan mengganti warna logo di luar 3 varian resmi di atas.

---

## 2. Palet warna

### Warna utama

| Nama token | Hex | RGB | Peran |
|---|---|---|---|
| `brand-lime` | `#D0FE15` | 208, 254, 21 | Warna aksen utama brand — dipakai di logomark, CTA, highlight, indikator aktif |
| `brand-sage` | `#819C65` | 129, 156, 101 | Warna latar sekunder / "hero" brand, kesan hangat dan natural |
| `neutral-dark` | `#262A25` | 38, 42, 37 | Warna teks utama di atas latar terang, sekaligus warna latar untuk dark mode |
| `neutral-white` | `#FFFFFF` | 255, 255, 255 | Warna latar utama (light mode) & teks di atas latar gelap/sage |

### Turunan warna (disarankan, untuk kebutuhan UI)

| Token | Hex | Peran |
|---|---|---|
| `lime-100` | `#F2FFC2` | Latar lembut untuk badge/highlight ringan |
| `lime-600` | `#A8CC10` | Hover/pressed state untuk elemen ber-`brand-lime` |
| `sage-100` | `#E4EADB` | Latar section sekunder di light mode |
| `sage-700` | `#5E7048` | Teks/ikon di atas `brand-sage` bila butuh kontras lebih |
| `neutral-100` | `#F4F5F2` | Latar page default (light mode) |
| `neutral-600` | `#5C6058` | Teks sekunder / secondary text |
| `neutral-900` | `#15170F` | Latar terdalam untuk dark mode (opsional, lebih pekat dari `neutral-dark`) |

### Prinsip pemakaian warna
- **Lime** hanya untuk aksen (tombol utama, ikon aktif, indikator, highlight) — jangan dipakai sebagai warna latar besar karena terlalu terang untuk dibaca dalam jumlah banyak.
- **Sage** cocok untuk section hero, banner, atau elemen dekoratif skala besar.
- **Neutral dark & white** adalah pasangan warna teks/latar utama — pastikan rasio kontras teks tetap memenuhi standar aksesibilitas (minimal WCAG AA).

---

## 3. Tipografi

- **Logotype**: sans-serif bold/extrabold, huruf kecil semua, geometris (bowl huruf bulat, spacing rapat). Contoh typeface dengan karakter serupa: **Inter (700–800)**, **Manrope (ExtraBold)**, atau **Plus Jakarta Sans (Bold)**.
- **UI/body text**: disarankan memakai typeface yang sama dengan logotype (mis. Inter atau Plus Jakarta Sans) agar konsisten, dengan variasi berat:
  - Heading: 600–700 (Semibold/Bold)
  - Body: 400 (Regular)
  - Caption/label: 500 (Medium), ukuran lebih kecil
- Gunakan **sentence case** untuk heading/label UI (huruf kapital hanya di awal kalimat), selaras dengan gaya logotype yang lowercase.

---

## 4. Penerapan di UI

| Elemen | Light mode | Dark mode |
|---|---|---|
| Latar halaman | `neutral-white` / `neutral-100` | `neutral-dark` / `neutral-900` |
| Teks utama | `neutral-dark` | `neutral-white` |
| Teks sekunder | `neutral-600` | `sage-100` / abu muda |
| Tombol utama (primary) | `brand-lime` bg, teks `neutral-dark` | `brand-lime` bg, teks `neutral-dark` |
| Tombol sekunder | outline `neutral-dark`, teks `neutral-dark` | outline `neutral-white`, teks `neutral-white` |
| Section hero/banner | `brand-sage` | `neutral-dark` dengan aksen `brand-lime` |
| Badge/status aktif | `lime-100` bg, teks `neutral-dark` | `brand-lime` bg 20%, teks `brand-lime` |

**Catatan:** karena lime sangat terang, teks di atas tombol `brand-lime` harus tetap **dark**, bukan putih — supaya kontras terjaga.

---

## 5. Ringkasan token warna (siap pakai)

```css
:root {
  --brand-lime: #D0FE15;
  --brand-lime-hover: #A8CC10;
  --brand-sage: #819C65;
  --neutral-dark: #262A25;
  --neutral-white: #FFFFFF;
  --neutral-100: #F4F5F2;
  --neutral-600: #5C6058;
  --neutral-900: #15170F;
}
```

---

*Dokumen ini dibuat berdasarkan aset logo sebaris.id (3 varian: latar sage, putih, dark). Sesuaikan kembali jika ada panduan brand resmi tambahan dari tim desain.*
