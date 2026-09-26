<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Konfirmasi Vote Berhasil — Sebaris.id</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F8FAF7; font-family: 'Segoe UI', Arial, sans-serif; color: #262A25; }
    .wrapper { max-width: 560px; margin: 40px auto; padding: 0 16px; }
    .card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(38,42,37,0.08); }
    .header { background: linear-gradient(135deg, #123E2A 0%, #1E5A3D 100%); padding: 36px 40px 28px; text-align: center; }
    .header .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 100px; padding: 4px 14px; font-size: 11px; font-weight: 700; color: #D0FE15; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.3px; }
    .header p { margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.7); }
    .body { padding: 32px 40px; }
    .greeting { font-size: 15px; font-weight: 700; color: #262A25; margin-bottom: 4px; }
    .subtext { font-size: 13px; color: #60665D; margin-bottom: 24px; }
    .finalist-box { background: #F4F9EE; border: 1px solid #CADDB8; border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; }
    .finalist-box .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #819C65; margin-bottom: 4px; }
    .finalist-box .finalist-name { font-size: 20px; font-weight: 900; color: #262A25; }
    .finalist-box .category { font-size: 12px; color: #60665D; margin-top: 2px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .detail-item { background: #F8FAF7; border: 1px solid #E5EADF; border-radius: 10px; padding: 14px 16px; }
    .detail-item .dl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #8B9288; margin-bottom: 4px; }
    .detail-item .dv { font-size: 14px; font-weight: 800; color: #262A25; }
    .detail-item.accent .dv { color: #70B325; }
    .ref-box { background: #1E231C; border-radius: 10px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .ref-box .ref-label { font-size: 11px; font-weight: 700; color: #A3ACA0; }
    .ref-box .ref-id { font-size: 13px; font-weight: 900; color: #D0FE15; font-family: monospace; letter-spacing: 0.05em; }
    .cta { text-align: center; margin-bottom: 24px; }
    .cta a { display: inline-block; background: #70B325; color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 32px; border-radius: 10px; }
    .divider { border: none; border-top: 1px solid #E5EADF; margin: 0 0 20px; }
    .footer { padding: 0 40px 32px; text-align: center; }
    .footer p { font-size: 11px; color: #8B9288; margin: 0 0 4px; }
    .footer .brand { font-size: 12px; font-weight: 800; color: #70B325; }
    @media (max-width: 480px) {
      .body, .footer { padding-left: 24px; padding-right: 24px; }
      .header { padding: 28px 24px 22px; }
      .details-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="badge">Sebaris.id E-Voting</div>
        <h1>Vote Kamu Berhasil Dicatat!</h1>
        <p>Terima kasih sudah berpartisipasi dalam voting resmi ini.</p>
      </div>

      <div class="body">
        <p class="greeting">Halo, {{ $voterName }}!</p>
        <p class="subtext">Berikut adalah konfirmasi resmi suara kamu yang telah berhasil kami terima dan catat dalam sistem kami.</p>

        <div class="finalist-box">
          <div class="label">Kandidat yang kamu dukung</div>
          <div class="finalist-name">{{ $finalistName }}</div>
          <div class="category">pada ajang: <strong>{{ $categoryName }}</strong></div>
        </div>

        <div class="details-grid">
          <div class="detail-item accent">
            <div class="dl">Jumlah Suara</div>
            <div class="dv">{{ $voteAmount }} Suara</div>
          </div>
          <div class="detail-item">
            <div class="dl">Tipe Vote</div>
            <div class="dv">{{ $voteType }}</div>
          </div>
          @if ($totalPrice > 0)
          <div class="detail-item">
            <div class="dl">Total Dibayarkan</div>
            <div class="dv">Rp {{ number_format($totalPrice, 0, ',', '.') }}</div>
          </div>
          @endif
          <div class="detail-item">
            <div class="dl">Waktu Vote</div>
            <div class="dv">{{ $votedAt }}</div>
          </div>
        </div>

        <div class="ref-box">
          <span class="ref-label">ID Referensi Vote</span>
          <span class="ref-id">{{ $referenceId }}</span>
        </div>

        <div class="cta">
          <a href="{{ $appUrl }}">Lihat Perolehan Suara Live</a>
        </div>

        <hr class="divider" />
        <p style="font-size:12px; color:#60665D; text-align:center; margin:0;">
          Simpan email ini sebagai bukti partisipasi kamu. Kamu juga bisa mengecek status vote dengan memasukkan ID Referensi di website Sebaris.id.
        </p>
      </div>

      <div class="footer">
        <p>Email ini dikirim otomatis oleh sistem.</p>
        <p>Jangan membalas email ini.</p>
        <br/>
        <span class="brand">Sebaris.id</span>
        <p>Platform E-Voting Terpercaya Indonesia</p>
      </div>
    </div>
  </div>
</body>
</html>
