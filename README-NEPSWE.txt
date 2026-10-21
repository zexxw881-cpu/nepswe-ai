NEPSWE AI — IMAGE STUDIO
========================

APA YANG SUDAH DIPERBAIKI
- Tampilan responsif untuk HP dan desktop.
- Tiga mode: Outfit Editor, Image-to-Image, AI Character.
- Upload dan preview gambar, termasuk drag-and-drop.
- Generate mengirim gambar + prompt ke backend AI.
- Hasil AI tampil di NEPSWE dan tombol Unduh menyimpan hasil AI yang benar.
- Tombol bandingkan hasil dengan foto sumber.
- Status server, validasi file, batas ukuran 10 MB, rate limit, dan error yang lebih jelas.
- Token API hanya dibaca oleh server, tidak ditaruh di HTML.

PENTING
File index.html saja belum cukup untuk menjalankan AI. Folder ini perlu dijalankan sebagai aplikasi Node.js dengan internet dan token Hugging Face. Penggunaan model bisa memakai kredit atau menimbulkan biaya; tidak ada jaminan gratis tanpa batas.

SETUP (di komputer/laptop dengan Node.js 20 atau lebih baru)
1. Install Node.js 20+ dari https://nodejs.org
2. Ekstrak semua file dari ZIP ini ke satu folder.
3. Buka terminal/Command Prompt di folder tersebut.
4. Jalankan: npm install
5. Salin .env.example menjadi .env
6. Buat token Hugging Face dengan izin Inference Providers dari https://huggingface.co/settings/tokens
7. Buka file .env dan ganti nilai HF_TOKEN dengan token pribadi. Jangan kirim token ke orang lain.
8. Jalankan: npm start
9. Buka http://localhost:3000 di browser. Jangan membuka index.html langsung dari file manager.

CATATAN MODEL
Model/provider yang tersedia dapat berubah, dan beberapa model mungkin perlu akses atau kredit. Jika model default tidak tersedia untuk akun/provider, ubah HF_IMAGE_MODEL atau HF_TEXT_MODEL dalam .env ke model image-to-image atau text-to-image yang tersedia pada akun Hugging Face lo, lalu restart server.
Dokumentasi: https://huggingface.co/docs/inference-providers/en/tasks/image-to-image

KALAU LO CUMA PAKAI HP ANDROID
ZIP ini adalah paket aplikasi yang siap disiapkan, tetapi server Node.js biasanya paling mudah dijalankan di komputer atau di layanan hosting yang mendukung Node.js. Untuk membuat NEPSWE bisa diakses publik dari HP/website, deploy backend dan frontend ke hosting Node.js; simpan HF_TOKEN sebagai environment variable rahasia di pengaturan hosting, bukan di file publik. Jangan mengunggah .env ke GitHub.

PRIVASI DAN KEAMANAN
- Gambar dikirim ke provider AI saat tombol Generate ditekan.
- Server tidak menyimpan gambar ke disk secara sengaja; file diterima di memori untuk diproses.
- Ada batas upload 10 MB dan rate limit dasar, tetapi ini belum menggantikan autentikasi, kuota per pengguna, pemantauan biaya, atau pengamanan produksi.
- Jangan unggah foto sensitif atau foto orang lain tanpa izin. Backend memblokir beberapa prompt seksual eksplisit/permintaan menelanjangi orang, namun filter kata sederhana bukan sistem moderasi sempurna.
