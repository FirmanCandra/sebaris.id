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

// 1. Hapus bundle JS, CSS, dan asset lama di root assets/ yang sudah tidak ada di dist/assets
if (fs.existsSync(rootAssetsDir) && fs.existsSync(path.join(distDir, 'assets'))) {
  const distAssetFiles = new Set(fs.readdirSync(path.join(distDir, 'assets')));
  const rootAssetFiles = fs.readdirSync(rootAssetsDir);
  for (const file of rootAssetFiles) {
    if (!distAssetFiles.has(file)) {
      try {
        fs.unlinkSync(path.join(rootAssetsDir, file));
      } catch (e) {}
    }
  }
}

// 2. Salin seluruh isi frontend/dist langsung ke root proyek (tempat Hostinger public_html menyajikan web)
fs.cpSync(distDir, rootDir, { recursive: true, force: true });

console.log('✅ [Auto-Sync] Berhasil menyinkronkan frontend/dist ke root (public_html) untuk Hostinger!');
