import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const rootDir = path.resolve(__dirname, '../../');
const rootAssetsDir = path.resolve(rootDir, 'assets');

if (!fs.existsSync(distDir)) {
  console.error('❌ Folder dist tidak ditemukan! Jalankan vite build terlebih dahulu.');
  process.exit(1);
}

// 1. Hapus bundle JS dan CSS lama di root assets/ agar tidak menumpuk
if (fs.existsSync(rootAssetsDir)) {
  const files = fs.readdirSync(rootAssetsDir);
  for (const file of files) {
    if (file.startsWith('index-') && (file.endsWith('.js') || file.endsWith('.css'))) {
      fs.unlinkSync(path.join(rootAssetsDir, file));
    }
  }
}

// 2. Salin seluruh isi frontend/dist langsung ke root proyek (tempat Hostinger public_html menyajikan web)
fs.cpSync(distDir, rootDir, { recursive: true, force: true });

console.log('✅ [Auto-Sync] Berhasil menyinkronkan frontend/dist ke root (public_html) untuk Hostinger!');
