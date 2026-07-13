# 🛒 MiniPOS - Sistem Kasir Ritel Modern (POS)

[![Next.js](https://img.shields.io/badge/Next.js-14-blueviolet?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-Green?style=for-the-badge&logo=drizzle&logoColor=white)](https://orm.drizzle.team/)

**MiniPOS** adalah aplikasi Point of Sales (POS) premium berbasis web yang dirancang khusus untuk minimarket ritel lokal. Dibangun menggunakan teknologi **Next.js** modern dengan database **SQLite** lokal yang ringan namun andal, MiniPOS menyajikan antarmuka gelap (*Dark Mode*) berestetika tinggi, interaksi responsif instan, dan integrasi audit keuangan kasir yang ketat.

---

## ✨ Fitur Unggulan

### 📊 1. Dashboard Analitik Real-Time
* **Grafik Tren Mingguan**: Visualisasi interaktif (Area Chart) perbandingan omzet kotor dan laba bersih dalam 7 hari terakhir.
* **Distribusi Kategori**: Grafik lingkaran (Pie Chart) untuk memantau kategori produk yang paling banyak menghasilkan omzet.
* **Notifikasi Stok Menipis**: Peringatan instan untuk melakukan *restock* produk yang kuantitasnya berada di bawah ambang batas minimum.

### 💻 2. Mesin Kasir POS Cerdas & Cepat
* **Scan Barcode & Pencarian Instan**: Mendukung input barcode scanner fisik serta pencarian berbasis nama produk secara cepat.
* **Promo Diskon Otomatis**:
  * **Diskon Grosir (Volume Promo)**: Potongan harga otomatis per unit jika kuantitas barang mencapai batas minimum grosir (misal: $\ge$ 5 pcs).
  * **Diskon Member (Loyalitas)**: Diskon persentase otomatis bagi pelanggan terdaftar.
  * **Diskon Khusus Produk**: Kebijakan harga coret promo per produk spesifik yang dikonfigurasi melalui inventaris.
  * **Diskon Manual**: Input nominal pemotongan fleksibel saat checkout lunas.
* **Tukar Poin Member**: Konversi poin belanja member menjadi potongan langsung pada invoice kasir.

### 🕒 3. Audit Shift Kasir & Cetak Struk
* **Kontrol Shift Ketat**: Kasir wajib menginput modal awal shift saat masuk, dan laci kas secara otomatis mencatat target nominal akhir shift berdasarkan riwayat transaksi yang terjadi.
* **Deteksi Selisih Uang**: Secara otomatis menghitung dan merekam jika ada selisih (*discrepancy*) antara uang fisik kasir dengan catatan sistem saat tutup laci kas (*Close Shift*).
* **Cetak Struk Ulang**: Fitur cetak salinan nota struk belanja termal untuk transaksi lama langsung di portal Laporan.
* **Penghapusan Laporan Shift**: Supervisor Admin dapat menghapus data laporan shift secara individual langsung dari tabel laporan shift.

### ⚙️ 4. Pengaturan Sistem Dinamis (Settings)
* **Profil Toko**: Atur nama toko, alamat fisik, dan nomor telepon yang otomatis tercetak di header struk belanja.
* **Custom Struk**: Kustomisasi footer teks di bagian bawah struk kasir.
* **Kebijakan PPN**: Aktifkan/non-aktifkan pengenaan pajak PPN beserta penentuan persentase tarifnya (misal: 11%).
* **Kelipatan Poin**: Konfigurasi nominal kelipatan belanja untuk memperoleh poin member serta nilai nominal per 1 poin tebus.
* **Default Sistem**: Konfigurasi batas minimum stok barang baru dan modal kas awal shift secara default.

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

* **Framework Frontend & Backend**: [Next.js 16](https://nextjs.org/) (App Router & React Server Actions)
* **Database**: [SQLite](https://sqlite.org/) (Menggunakan driver super cepat [better-sqlite3](https://github.com/WiseLibs/better-sqlite3))
* **Object Relational Mapper (ORM)**: [Drizzle ORM](https://orm.drizzle.team/) & [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan Google Fonts **Inter** global.
* **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (untuk Keranjang Kasir & Auth lokal)
* **Visualisasi Data**: [Recharts](https://recharts.org/) (Grafik Dashboard)
* **Ikonografi**: [Lucide React](https://lucide.dev/)

---

## 🚀 Panduan Instalasi & Penggunaan Lokal

### 1. Prasyarat Sistem
Pastikan komputer Anda sudah terinstal:
* [Node.js](https://nodejs.org/) versi **20.9+** (LTS terbaru sangat direkomendasikan)
* [Git](https://git-scm.com/)

### 2. Kloning Repositori
```bash
git clone https://github.com/zufarrizal/MiniPOS.git
cd MiniPOS
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Push Skema Database
Push skema Drizzle ORM ke SQLite database lokal (`local.db`):
```bash
npx drizzle-kit push
```

### 5. Seed Awal Data Demo (200 Produk Ritel)
Untuk mengisi database dengan 200 contoh barang nyata ritel, 4 akun member awal, dan kredensial login staf kasir, jalankan perintah:
```bash
npx tsx src/db/seed.ts
```

### 6. Jalankan dalam Mode Pengembangan
```bash
npm run dev
```
Buka peramban browser Anda di alamat [http://localhost:3000](http://localhost:3000).

### 7. Konfigurasi Session untuk Production

Untuk menjalankan aplikasi di production, buat environment variable `SESSION_SECRET` dengan nilai acak yang panjang:

```env
SESSION_SECRET=ganti-dengan-rahasia-acak-yang-panjang
```

Variable ini digunakan untuk menandatangani session login. Pada mode development, aplikasi menyediakan nilai default lokal.

---

## 🔐 Akun Login Bawaan untuk Uji Coba

Gunakan kredensial berikut untuk masuk ke aplikasi:

* **Akun Administrator (Akses Penuh)**:
  * **Username**: `admin`
  * **Password**: `admin123`
* **Akun Staf Kasir (Hanya Akses POS Kasir & Laporan Struk)**:
  * **Username**: `siti`
  * **Password**: `siti123`

---

## 📦 Menjalankan Mode Produksi & Menggunakan Peluncur `MiniPOS.exe`

Aplikasi ini dilengkapi dengan biner peluncur Windows yang tersedia di [GitHub Releases](https://github.com/zufarrizal/MiniPOS/releases). Unduh `MiniPOS.exe` dan `MiniPOS-Stop.exe` dari release terbaru untuk menjalankan atau menghentikan server production tanpa perlu membuka terminal CMD manual.

### Cara Menggunakan Peluncur:
1. Pastikan aplikasi Next.js telah dikompilasi ke versi produksi:
   ```bash
   npm run build
   ```
2. Unduh dan ekstrak **`MiniPOS.exe`** dari [release terbaru](https://github.com/zufarrizal/MiniPOS/releases/latest), lalu klik ganda (double-click) file tersebut.
3. Peluncur akan:
   * Memeriksa dan mematikan port 3000 jika masih ada sisa proses yang berjalan.
   * Menjalankan server Next.js mode produksi (`next start`) secara background.
   * Server otomatis siap diakses kembali secara stabil di port **3000**!

Untuk menghentikan server, jalankan **`MiniPOS-Stop.exe`**.

---

## 📝 Lisensi
Proyek ini dibangun untuk tujuan operasional ritel lokal dan pembelajaran internal. Silakan dikembangkan lebih lanjut sesuai kebutuhan bisnis Anda.
