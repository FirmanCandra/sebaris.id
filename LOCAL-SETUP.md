
## Menjalankan aplikasi

### Terminal 1: backend

```powershell
cd backend
php artisan serve
```

Backend berjalan di:

```text
http://127.0.0.1:8000
```

### Terminal 2: frontend

```powershell
cd frontend
npm run dev
```

Frontend biasanya berjalan di:

```text
http://localhost:5173
```

Buka URL frontend tersebut di browser. Halaman admin tersedia di `/login`.

## Perintah yang sering dipakai

Backend:

```powershell
cd backend
php artisan migrate
php artisan migrate:fresh --seed
php artisan route:list
```

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```