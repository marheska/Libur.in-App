# Libur.in App

## Pengantar

Starter project ini dikembangkan untuk membangun aplikasi Libur.in, sebuah platform berbasis web yang memungkinkan pengguna untuk membagikan cerita pengalaman liburan mereka secara interaktif. Aplikasi ini dirancang dengan antarmuka sederhana namun informatif untuk mendukung pengguna berbagi momen liburan lengkap dengan deskripsi, foto, dan lokasi di peta.

## Deskripsi
Libur.in App adalah aplikasi berbasis SPA (Single Page Application) yang memanfaatkan Dicoding Story API sebagai sumber data utama. Pengguna dapat mendaftar, masuk, dan mengunggah cerita liburan berupa teks dan gambar, yang kemudian ditampilkan dalam daftar dan di peta interaktif.

Cerita-cerita ini dapat berisi lokasi spesifik yang ditandai di peta, sehingga pengguna lain dapat menjelajahi berbagai cerita liburan dari berbagai daerah. Libur.in mendukung pengalaman yang inklusif dengan fitur aksesibilitas, serta navigasi mulus berkat penerapan View Transition API.

## Prasyarat

- Node.js (disarankan versi terbaru)
- npm atau yarn

## Instalasi

- Unduh starter project liburinapp-starter-project.zip 

- Unzip berkas ZIP yang telah diunduh. Bisa pakai perintah berikut untuk Linux:
  ```bash
  unzip ./liburinapp-starter-project.zip
  ```

- Masuk ke direktori proyek:
  ```bash
  cd liburinapp-starter-project
  ```

- Pasang seluruh dependensi:
  ```bash
 npm install
  ```

## Scripts

- `npm run build`: Membuat build production menggunakan Webpack.
- `npm run start-dev`: Menjalankan server development menggunakan Webpack Dev Server.
- `npm run serve`: Menjalankan server HTTP untuk build yang sudah dibuat.
- `npm run prettier`: Memeriksa format kode menggunakan Prettier.
- `npm run prettier:write`: Memformat ulang kode menggunakan Prettier.

## Struktur Proyek

```plaintext

├── package.json            # Informasi dependensi proyek
├── package-lock.json       # File lock untuk dependensi
├── README.md               # Dokumentasi proyek
├── webpack.common.js       # Konfigurasi Webpack (umum)
├── webpack.dev.js          # Konfigurasi Webpack (development)
├── webpack.prod.js         # Konfigurasi Webpack (production)
└── src                     # Direktori utama untuk kode sumber
    ├── index.html          # Berkas HTML utama
    ├── public              # Direktori aset publik
    │   ├── favicon.png     # Ikon situs
    │   └── images          # Gambar yang digunakan dalam proyek
    ├── scripts             # Direktori untuk kode JavaScript
    │   ├── data            # Folder untuk API atau sumber data
    │   ├── pages           # Halaman-halaman utama
    │   ├── routes          # Pengaturan routing
    │   ├── utils           # Helper dan utilitas
    │   ├── templates.js    # Template HTML dinamis
    │   ├── config.js       # Konfigurasi proyek
    │   └── index.js        # Entry point aplikasi
    └── styles              # File CSS
        ├── responsives.css # Gaya untuk responsivitas
        └── styles.css      # Gaya umum
```
