<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notifikasi Masuk Sebaris.id</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F6F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #262A25;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F6F2; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #E5EADF;" cellspacing="0" cellpadding="0">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #123E2A; padding: 28px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                sebaris<span style="color: #70B325;">.id</span>
              </h1>
              <p style="margin: 6px 0 0; color: #D5E6C4; font-size: 12px; font-weight: 500;">
                Platform E-Voting & Event Online
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; background-color: #F2F9EC; border-radius: 50%; font-size: 24px; color: #70B325;">
                  ✓
                </div>
                <h2 style="margin: 12px 0 6px; font-size: 18px; font-weight: 800; color: #262A25;">
                  Login Berhasil via Google
                </h2>
                <p style="margin: 0; font-size: 13px; color: #666666;">
                  Halo <strong>{{ $name }}</strong>, akun Anda baru saja masuk ke sistem.
                </p>
              </div>

              <div style="background-color: #F8FAF7; border: 1px solid #E2ECD8; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 12px; line-height: 1.8;">
                  <tr>
                    <td style="color: #888888; width: 35%;">Metode Masuk:</td>
                    <td style="font-weight: 700; color: #262A25;">Google Single Sign-On (OAuth2)</td>
                  </tr>
                  <tr>
                    <td style="color: #888888;">Email Akun:</td>
                    <td style="font-weight: 700; color: #262A25;">{{ $email }}</td>
                  </tr>
                  <tr>
                    <td style="color: #888888;">Waktu Masuk:</td>
                    <td style="font-weight: 700; color: #262A25;">{{ $time }}</td>
                  </tr>
                  @if(!empty($ip))
                  <tr>
                    <td style="color: #888888;">Alamat IP:</td>
                    <td style="font-weight: 700; color: #262A25;">{{ $ip }}</td>
                  </tr>
                  @endif
                </table>
              </div>

              <p style="margin: 0 0 20px; font-size: 12px; line-height: 1.6; color: #555555;">
                Jika aktivitas ini dilakukan oleh Anda, Anda tidak perlu melakukan tindakan apapun. Anda dapat langsung melanjutkan voting, memilih finalis favorit, dan mengecek perolehan suara.
              </p>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="{{ $appUrl }}" style="display: inline-block; background-color: #70B325; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 13px; font-weight: 700; box-shadow: 0 2px 8px rgba(112, 179, 37, 0.35);">
                  Kunjungi Website Sebaris.id →
                </a>
              </div>

              <div style="border-top: 1px solid #EEEEEE; padding-top: 16px;">
                <p style="margin: 0; font-size: 11px; color: #999999; line-height: 1.5;">
                  <strong>Peringatan Keamanan:</strong> Jika Anda tidak merasa melakukan aktivitas login ini, silakan segera periksa dan amankan kredensial akun Google Anda.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAF7; padding: 20px 30px; text-align: center; border-top: 1px solid #E5EADF;">
              <p style="margin: 0; font-size: 11px; color: #888888;">
                Email otomatis dikirim oleh sistem keamanan <strong>Sebaris.id</strong>. Mohon tidak membalas email ini.
              </p>
              <p style="margin: 6px 0 0; font-size: 10px; color: #AAAAAA;">
                &copy; {{ date('Y') }} Sebaris.id — Hak Cipta Dilindungi.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
