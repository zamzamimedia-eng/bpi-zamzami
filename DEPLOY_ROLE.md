# 🚀 Deploy Role — BPI Zamzami App

> Panduan lengkap untuk deploy & update aplikasi BPI ke aaPanel server dan GitHub.
> Setiap kali ada update, ikuti langkah-langkah di bawah ini.

---

## 📋 Prerequisites

| Item | Detail |
|------|--------|
| **Server IP** | `100.85.43.53` |
| **SSH User** | `root` |
| **SSH Password** | `Jonggol100.` |
| **Remote Path** | `/www/wwwroot/bpi-app` |
| **PM2 Process** | `bpi_app_v03` |
| **GitHub Repo** | `https://github.com/zamzamimedia-eng/bpi-zamzami` |
| **Node.js** | v18+ (di server) |
| **Tools Lokal** | `pscp`, `plink` (PuTTY tools) |

---

## 🔄 Langkah Deploy (Setiap Update)

### Step 1: Commit & Push ke GitHub

```bash
cd f:\HOLDING\BPI\bpi-app
git add .
git commit -m "feat: deskripsi perubahan"
git push origin main
```

### Step 2: Deploy ke aaPanel Server

Jalankan dari terminal Windows (PowerShell):

```bash
cd f:\HOLDING\BPI\bpi-app
node deploy_aapanel.js
```

Script ini akan:
1. ✅ Membuat arsip ZIP dari source code (tanpa `node_modules`, `.next`, `.git`)
2. ✅ Upload ZIP ke server via `pscp`
3. ✅ Upload `remote_deploy.sh` ke server
4. ✅ Eksekusi `remote_deploy.sh` di server via `plink`

### Step 3: Verifikasi

Akses aplikasi di browser:
```
http://100.85.43.53:3000
```

---

## 📜 Yang Terjadi di Server (remote_deploy.sh)

Script `remote_deploy.sh` melakukan:

1. **Extract ZIP** ke `/www/wwwroot/bpi-app`
2. **`npm install`** — Install dependencies
3. **`node migrate.js`** — Jalankan migrasi database
4. **`npm run build`** — Build Next.js production
5. **PM2 Restart** — Stop & start ulang `bpi_app_v03`
6. **Cleanup** — Hapus file ZIP

---

## ⚠️ Troubleshooting

### SSH Host Key Error
Jika hostkey berubah (misalnya server re-install):
```bash
# Hapus cached key lama
# Jalankan manual untuk accept hostkey baru:
plink -pw Jonggol100. root@100.85.43.53 "echo test"
# Ketik 'y' saat diminta accept key
```

### PM2 Process Tidak Ditemukan
```bash
# SSH ke server, lalu:
pm2 list
pm2 start /www/wwwroot/bpi-app/server.js --name "bpi_app_v03" --env production
pm2 save
```

### Build Error di Server
```bash
# SSH ke server, lalu:
cd /www/wwwroot/bpi-app
rm -rf .next node_modules
npm install
npm run build
pm2 restart bpi_app_v03
```

### Database Migration Error
```bash
# SSH ke server, lalu:
cd /www/wwwroot/bpi-app
node migrate.js
# Jika error spesifik, jalankan SQL file langsung:
mysql -u ponp9455_bpi -p ponp9455_bpi < fix_projects_category.sql
```

---

## 🔧 Konfigurasi File

### `deploy_aapanel.js`
File utama deploy. Konfigurasi:
- `host` — IP server aaPanel
- `password` — Password SSH
- `exclude` — File/folder yang tidak dikirim ke server

### `remote_deploy.sh`
Script yang berjalan di server setelah upload.

### `server.js`
Custom server Node.js untuk Next.js (port 3000).

---

## 📌 Catatan Penting

1. **Selalu commit ke GitHub SEBELUM deploy** ke server.
2. **Jangan edit langsung di server** — semua perubahan harus dari lokal.
3. **Database migration otomatis** saat deploy — tidak perlu manual.
4. **Backup database** secara berkala via aaPanel.
5. File `.env.local` di server **tidak ditimpa** saat deploy (masuk exclude list).

---

## 🗓️ Riwayat Deploy

| Tanggal | Perubahan | Status |
|---------|-----------|--------|
| 2026-04-24 | Kategori BPM/SBPM, Search & Filter, Kanvas BPM/SBPM, Norm Waktu, Deploy Role | ⏳ Pending |
