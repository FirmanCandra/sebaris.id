# Product Requirements Document (PRD)
## sebaris.id — Platform E-Voting

**Versi:** 0.1 (Draft)
**Stack:** Laravel (Backend/API) + React (Frontend SPA)
**Status:** Untuk pengembangan MVP

---

## 1. Ringkasan Produk

**sebaris.id** adalah platform e-voting online yang memungkinkan penyelenggara event (kompetisi, pemilihan duta/talent, lomba, dsb.) membuka voting publik untuk finalis mereka. Pengguna dapat memberi suara secara gratis (1x) maupun membeli suara tambahan (vote berbayar) melalui berbagai metode pembayaran digital. Penyelenggara mengelola seluruh proses lewat dashboard admin.

Referensi alur bisnis (kategori vote, vote gratis vs berbayar, leaderboard, cek status vote) mengacu pada model KREEN Vote yang sudah dianalisis sebelumnya. Identitas visual mengikuti `design.md` (warna lime `#D0FE15`, sage `#819C65`, dark `#262A25`).

---

## 2. Latar Belakang & Tujuan

- Banyak event lomba/kompetisi di Indonesia masih memakai voting manual (Google Form, DM Instagram) yang rawan curang dan sulit dipantau real-time.
- **Tujuan MVP:** menyediakan sistem voting yang transparan (leaderboard real-time), aman dari vote ganda/spam, dan punya jalur monetisasi (vote berbayar) untuk penyelenggara.

---

## 3. Target Pengguna & Peran

| Role | Deskripsi |
|---|---|
| **Voter (publik)** | Pengguna umum yang membuka website, melihat finalis, dan memberi suara. Tidak wajib punya akun — cukup input nama/no. HP saat vote. |
| **Admin/Penyelenggara** | Mengelola event, kategori, finalis, memantau perolehan suara & transaksi, mengatur harga vote. Login pakai akun. |
| **Superadmin** *(opsional, jika multi-tenant)* | Mengelola banyak penyelenggara/event sekaligus dalam satu platform. |

> Untuk MVP, asumsikan single-tenant dulu (satu platform, satu penyelenggara utama, bisa banyak event). Multi-tenant bisa jadi fase lanjutan.

---

## 4. Ruang Lingkup MVP

**In-scope:**
- Voting publik (gratis & berbayar) per kategori/event
- Integrasi payment gateway (VA, e-wallet, QRIS)
- Leaderboard real-time per kategori
- Cek status/riwayat vote (by nomor HP/email)
- Dashboard admin: manajemen event, kategori, finalis, monitoring vote & transaksi
- Autentikasi admin (login, role dasar)

**Out-of-scope (fase berikutnya):**
- Multi-tenant penuh (banyak penyelenggara mendaftar mandiri)
- Notifikasi WhatsApp/email otomatis
- Export laporan ke Excel/PDF otomatis
- Sistem afiliasi/referral vote

---

## 5. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React (Vite), React Router, TailwindCSS (disarankan agar selaras token warna di `design.md`) |
| Backend | Laravel 12 (REST API) |
| Database | MySQL / PostgreSQL |
| Auth Admin | Laravel Sanctum (token-based, cocok untuk SPA) |
| Payment Gateway | Midtrans (VA, e-wallet, QRIS) |
| Realtime leaderboard | Laravel Broadcasting + Pusher/Soketi, atau polling interval sebagai alternatif sederhana |
| Queue/Job | Laravel Queue (untuk proses webhook pembayaran & update skor agar tidak blocking request) |
| Deployment | Hostinger


---

## 6. Functional Requirements

### 6.1 Modul Publik (Voter)

| ID | Fitur | Deskripsi |
|---|---|---|
| F-01 | Landing page | Menampilkan daftar event/kategori voting yang aktif |
| F-02 | Daftar finalis | List finalis per kategori, lengkap foto, nama, dan jumlah suara saat ini |
| F-03 | Form vote | Input data diri (nama, no. HP/email) + pilih jumlah suara (1 gratis, atau beli tambahan) |
| F-04 | Pembayaran | Redirect/embed ke payment gateway untuk vote berbayar (VA/e-wallet/QRIS) |
| F-05 | Konfirmasi vote | Halaman sukses setelah vote gratis, atau setelah pembayaran terverifikasi |
| F-06 | Cek vote | Input no. HP/email untuk melihat riwayat vote yang pernah dilakukan |
| F-07 | Leaderboard | Ranking finalis per kategori, update near real-time |

### 6.2 Modul Admin

| ID | Fitur | Deskripsi |
|---|---|---|
| A-01 | Login admin | Autentikasi via Laravel Sanctum |
| A-02 | Manajemen event | CRUD event (nama, periode voting, status aktif/nonaktif) |
| A-03 | Manajemen kategori | CRUD kategori per event |
| A-04 | Manajemen finalis | CRUD finalis (foto, nama, deskripsi, kategori) |
| A-05 | Pengaturan vote | Atur batas vote gratis, harga per suara berbayar, metode pembayaran aktif |
| A-06 | Monitoring vote | Tabel & grafik perolehan suara per finalis, filter per kategori/tanggal |
| A-07 | Laporan transaksi | Daftar transaksi pembayaran (status: pending/success/failed) |
| A-08 | Manajemen role | (opsional MVP) admin biasa vs superadmin |

---

## 7. Non-Functional Requirements

- **Keamanan:** rate limiting di endpoint vote (cegah spam/bot), validasi signature webhook payment gateway, sanitasi input publik.
- **Konsistensi data:** penghitungan suara dan transaksi harus atomic (gunakan DB transaction) supaya tidak terjadi race condition saat trafik tinggi (mis. saat grandfinal).
- **Skalabilitas:** proses vote berbayar & update skor dijalankan lewat queue job, bukan langsung di request-response cycle.
- **Auditability:** setiap vote & transaksi tercatat dengan timestamp dan tidak bisa dihapus/diedit langsung dari UI (soft-delete/log saja).
- **Ketersediaan:** target uptime tinggi terutama menjelang deadline voting (biasanya trafik memuncak di jam-jam terakhir).

---

## 8. Data Model (Ringkasan Entitas)

```
events            (id, name, start_date, end_date, status)
categories        (id, event_id, name)
finalists         (id, category_id, name, photo, description, vote_count)
votes             (id, finalist_id, voter_name, voter_contact, vote_amount, type[free/paid], status, created_at)
transactions      (id, vote_id, payment_method, amount, gateway_ref, status, paid_at)
vote_settings     (id, category_id, free_vote_limit, price_per_vote)
admins            (id, name, email, password, role)
```

> `votes.status` membedakan vote gratis (langsung `confirmed`) vs vote berbayar (`pending` → `confirmed` setelah webhook payment gateway sukses).

---

## 9. Gambaran API (Laravel REST)

```
# Publik
GET    /api/events
GET    /api/events/{id}/categories
GET    /api/categories/{id}/finalists
POST   /api/votes                # buat vote (gratis / inisiasi berbayar)
POST   /api/payments/webhook     # callback dari payment gateway
GET    /api/votes/check?contact= # cek histori vote
GET    /api/categories/{id}/leaderboard

# Admin (perlu auth Sanctum)
POST   /api/admin/login
CRUD   /api/admin/events
CRUD   /api/admin/categories
CRUD   /api/admin/finalists
GET    /api/admin/votes
GET    /api/admin/transactions
PUT    /api/admin/settings/{category_id}
```

---

## 10. Alur Teknis Kunci

1. **Vote gratis:** `POST /votes` → cek `voter_contact` belum pernah vote gratis di kategori itu → simpan langsung dengan status `confirmed` → update `finalists.vote_count`.
2. **Vote berbayar:** `POST /votes` (status `pending`) → generate transaksi ke payment gateway → user bayar → gateway kirim `webhook` → Laravel job verifikasi signature → update `votes.status = confirmed` & `transactions.status = success` → update `vote_count` lewat queue job → broadcast event ke frontend (untuk leaderboard real-time).
3. **Leaderboard real-time:** frontend subscribe channel (Pusher/Soketi) per kategori, atau fallback polling tiap beberapa detik jika belum implementasi websocket.

---

## 11. Roadmap MVP (Saran Fase)

| Fase | Fokus |
|---|---|
| Fase 1 | Setup Laravel API + React SPA, CRUD event/kategori/finalis (admin), auth admin |
| Fase 2 | Voting gratis publik + leaderboard (polling dulu, belum realtime) |
| Fase 3 | Integrasi payment gateway untuk vote berbayar + webhook |
| Fase 4 | Realtime leaderboard (websocket), cek vote, polish UI sesuai `design.md` |
| Fase 5 | Testing beban (load test) & hardening keamanan sebelum dipakai event nyata |

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Race condition saat vote_count diupdate bersamaan | Gunakan DB transaction / atomic increment, atau proses lewat queue satu-per-satu |
| Webhook payment gateway gagal/duplikat | Simpan `gateway_ref` unik, idempotency check sebelum update status |
| Spam vote gratis (ganti-ganti no. HP) | Rate limiting per IP + validasi format kontak, opsional OTP di fase lanjutan |
| Trafik lonjakan di hari terakhir voting | Load testing awal + caching leaderboard (mis. Redis) |

---

*Dokumen ini adalah draft awal PRD untuk keperluan pengembangan. Detail requirement bisa disesuaikan lagi seiring progres coding.*