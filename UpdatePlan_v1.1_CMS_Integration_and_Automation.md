# UpdatePlan_v1.1_CMS_Integration_and_Automation

## Document Control
- **Project:** Digital Signage System (WOD - Agung Toyota)
- **Version:** 1.1 (Major Architecture Overhaul)
- **Focus:** Decoupled Headless CMS, CRM Proxy Layer, Asynchronous Notifications.
- **Author:** Principal Engineering Team

---

## I. SYSTEM ARCHITECTURE & DATA FLOW DESIGN

### 1. The Proxy-Cache Pattern (Backend)
Mengambil data langsung dari CRM (`http://172.16.3.30/service/public/display/ruang-tunggu/ubta`) oleh setiap Smart TV akan menciptakan *Bottleneck* dan *DDoS self-inflicted* pada server CRM.
- **Solusi:** Laravel akan bertindak sebagai **Middleware Proxy**. 
- Laravel *Task Scheduler* berjalan setiap 5 detik, menarik data dari CRM, lalu menyimpannya di Redis/File Cache (`Cache::put('wod_live_queues', $data)`).
- React WOD (TV) menembak API Laravel, dan Laravel mereturn data langsung dari *Cache* dengan latensi < 10ms.

### 2. Idempotent Notification System
Untuk memastikan pesan WhatsApp "Selesai Dikerjakan" tidak terkirim berkali-kali untuk pelanggan yang sama akibat HTTP Polling:
- Sistem menggunakan pola **Idempotency Key** berbasis `plate_number` dan `date`.
- Sebelum *Job Queue* mengirim WA, sistem akan memvalidasi *database lock* di tabel `wa_notification_logs`.

---

## II. DATABASE SCHEMA SPECIFICATION (DDL)

Tolong jalankan migrasi untuk 2 entitas baru ini pada `laravel-api-backend`.

### 1. Tabel `signage_settings` (Key-Value Store)
Tabel ini digunakan untuk konfigurasi dinamis yang diatur oleh Admin CMS tanpa perlu melakukan re-deploy.
- `key` (String, Primary Key/Unique Index)
- `value` (Text, Nullable)
- `type` (String: 'string', 'integer', 'json', 'boolean')

**Default Seeder Keys:**
- `promo_video_type` (value: 'local' / 'youtube')
- `promo_video_url` (value: '/videos/promo_agung_toyota.mp4')
- `running_text_ticker` (value: 'Dapatkan diskon service 20%...')
- `duration_media_sec` (value: 60)
- `duration_table_sec` (value: 30)

### 2. Tabel `wa_notification_logs`
Tabel *monitoring* untuk fitur CMS dan validasi idempotensi.
- `id` (UUID, Primary Key)
- `plate_number` (String, Index)
- `customer_name` (String)
- `status` (Enum: 'PENDING', 'SENT', 'FAILED')
- `response_payload` (JSON, Nullable)
- `created_at`, `updated_at`

---

## III. BACKEND ENGINEERING SPECIFICATION (LARAVEL API)

### 1. CRM Synchronization Command
Buat console command `app/Console/Commands/SyncCrmData.php`.
- **Fungsi:** Mengambil data HTTP GET ke `172.16.3.30`.
- **Logic:** Bandingkan *state* lama dan baru. Jika ada objek dengan `status === 'SELESAI'` yang belum ada di `wa_notification_logs` pada hari itu, lakukan `dispatch(new SendWhatsappNotification($customer))`.
- **Scheduler:** Daftarkan di `routes/console.php` (Laravel 11) atau `Kernel.php` untuk berjalan setiap menit, dipadukan dengan `sleep()` *looping* agar seolah berjalan setiap 5 detik.

### 2. API Contracts (Endpoints)
Semua *endpoint* CMS harus diamankan dengan middleware `auth:sanctum`.

- `GET /api/v1/display/queues` (Public) -> Return cached CRM data.
- `GET /api/v1/display/settings` (Public) -> Return `signage_settings` yang sudah di-cache.
- `GET /api/v1/admin/settings` (Protected) -> List konfigurasi untuk CMS.
- `PUT /api/v1/admin/settings` (Protected) -> Batch update konfigurasi CMS.
- `GET /api/v1/admin/wa-logs` (Protected) -> Datatable log pengiriman WA.

---

## IV. FRONTEND ENGINEERING SPECIFICATION (REACT SPA)

### 1. CMS Admin Panel (React Router & Layout)
- **Routing:** Isolasi `src/views/Admin/*` dari `src/views/RuangTunggu/*`.
- **State Management CMS:** Gunakan form dengan validasi untuk mengedit pengaturan. Saat admin klik "Simpan", kirim `PUT` request ke `/api/v1/admin/settings` dan pastikan Backend menghapus (Invalidate) Cache `settings` agar TV langsung merespon perubahan.
- **Monitoring View:** Buat tabel dengan *pagination* menampilkan data dari `/wa-logs` beserta *badge* indikator (Hijau = Sent, Merah = Failed).

### 2. WOD TV Display (Zero-Layout-Shift Logic)
- **Background Polling:** Wajib menggunakan *React Query* (`@tanstack/react-query`) atau *SWR* dengan konfigurasi `refetchInterval: 5000`. Ini menjamin data *refresh* di *background* tanpa memunculkan layar putih/spinner di TV.
- **Dynamic Orchestration (`RuangTungguContainer.jsx`):** 
  Ganti `setInterval` yang di-*hardcode* menjadi reaktif terhadap data dari API:
  ```javascript
  const { data: settings } = useSettingsAPI();
  useEffect(() => {
     if(!settings) return;
     const duration = currentView === 'MEDIA' 
       ? settings.duration_media_sec * 1000 
       : settings.duration_table_sec * 1000;
     const timer = setTimeout(switchView, duration);
     return () => clearTimeout(timer);
  }, [currentView, settings]);
  ```

### 3. Audio Chime Event Listener (Without TTS)
Implementasi pendeteksi status "SELESAI" untuk memutar lonceng MP3 dan men-trigger pop-up:
- Gunakan `usePrevious` *custom hook* untuk membandingkan array `queues` sebelumnya dengan yang baru ditarik.
- **Logic Rule:** 
  ```javascript
  const newlyFinished = currentQueues.filter(q => 
    q.status === 'SELESAI' && !previousQueues.find(prev => prev.id === q.id && prev.status === 'SELESAI')
  );
  
  if (newlyFinished.length > 0) {
      const audio = new Audio('/audio/chime-airport.mp3');
      audio.play().catch(e => console.warn('Autoplay blocked:', e));
      triggerPopupModal(newlyFinished[0]); // Tampilkan Nama & Plat Nomor di layar
  }
  ```

### 4. Component Modularity & Reusability
Pastikan pemisahan komponen (Separation of Concerns) dilakukan secara ketat:
- Ekstrak `MainTable`, `MediaPromo`, dan `Ticker` menjadi komponen murni (*Pure Components*) yang hanya menerima `props`. 
- Komponen ini harus independen agar nantinya bisa dipanggil ulang saat membangun antarmuka digital signage untuk **GR Room** dan **Meeting Room**.

### 5. Error Handling & Fallback UI
- Jika API Endpoint WOD TV mengalami *timeout* atau *server offline* (kode HTTP 5xx), aplikasi tidak boleh *crash* atau menampilkan layar putih.
- **Tindakan:** Tampilkan data *cache* terakhir yang berhasil ditarik dari *state*, dan munculkan notifikasi non-intrusif (kecil) di pojok bawah layar: *"Mencoba menghubungkan kembali ke server..."*.

---

## V. DEPLOYMENT & INFRASTRUCTURE CONFIGURATION

Untuk memastikan fungsionalitas otomasi berjalan di *server production* (Ubuntu/Nginx):
1. **Queue Worker Daemon:** Wajib menyalakan `supervisor` (Supervisord) untuk menjaga `php artisan queue:work --tries=3 --timeout=90` tetap hidup.
2. **Cron Job System:** Tambahkan baris berikut ke `crontab -e` pada *server* untuk memicu *scheduler* sinkronisasi CRM:
   `* * * * * cd /path-to-your-laravel-project && php artisan schedule:run >> /dev/null 2>&1`