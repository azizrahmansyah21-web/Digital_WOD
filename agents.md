# Implementasi Otomatisasi WA & Integrasi Dekripsi API Agung (v1.3)

Implementasi ini bertujuan untuk membangun *pipeline* otomatisasi pengiriman notifikasi WhatsApp secara aman (mematuhi UU PDP) bagi pelanggan yang kendaraannya telah selesai diservis, sesuai dengan spesifikasi arsitektur yang telah ditentukan.

## Arsitektur End-to-End: WhatsApp Automation Pipeline

### Arsitektur Makro (3 Komponen Utama)

```text
=======================================================================
 🖥️ 1. REACT FRONTEND (Pekerja Visual & Suara TV)
=======================================================================
 File: src/components/CalloutAlert.jsx
 Fungsi: Murni mengurus tampilan tanpa mempedulikan pengiriman WA.
 - Method: playQueueAudio() ➔ Memutar suara "Ding-Dong" MP3.
 - Action: Menampilkan modal Pop-up nama pelanggan di layar TV.

      ↑ (Menarik data JSON bersih dari Backend setiap 5 detik)
      |
=======================================================================
 ⚙️ 2. LARAVEL BACKEND (Si Mandor Orkestrator)
=======================================================================
 File Utama: app/Console/Commands/ProcessAutomatedWA.php
 Trigger: Berjalan otomatis setiap menit via Scheduler.

 ├── A. Tarik Data Antrean
 |   Logic: Ambil dari Cache 'wod_live_queues' atau CRM Lokal HTML
 |
 ├── B. Filter & Anti-Spam
 |   Logic: array_filter() ➔ Cari mobil berstatus "SELESAI".
 |   Class: WaNotificationLog 
 |   Method: where('plat_no')->exists() ➔ Mencegah spam WA dobel.
 |
 ├── C. Get Encrypted Phone & Dekripsi Nomor HP
 |   Class: AgungApiService
 |   Method 1: getEncryptedPhoneByPlate($platNo) ➔ POST /api/service/progress_status
 |   Method 2: decryptPhoneNumber($encryptedValue) ➔ POST /api/decrypt
 |
 └── D. Lempar Tugas ke Node.js
     Logic: Http::post('http://localhost:3000/send-wa', payload)

      | (Mengirim Nomor Asli & Teks Pesan)
      ↓
=======================================================================
 🚀 3. NODE.JS MICROSERVICE (Kurir WhatsApp Mandiri)
=======================================================================
 File: wa-gateway/server.js
 Trigger: Menerima request HTTP POST dari Laravel.
 
 - Route: app.post('/send-wa')
 - Library: whatsapp-web.js
 - Method: client.sendMessage(chatId, message) ➔ Mengirim WA ke pelanggan.
 - Return: Status 200 OK ke Laravel jika sukses.
=======================================================================
```

### Alur Kerja Detil (Sequence Diagram)

```text
[Cron Scheduler] 
       │
       ▼ (Setiap 1 Menit)
[ProcessAutomatedWA] ─── (1. Tarik Data HTML / Cache) ─────────▶ [Local CRM / Cache]
       │
       ▼ (2. Filter by "SELESAI" = Sisa 5 Kendaraan)
       │
[Looping 5 Kendaraan]
       │
       ├──▶ [Cek Tabel wa_notification_logs via plat_no]
       │      ├─ JIKA ADA: Skip (Lanjut ke mobil berikutnya)
       │      └─ JIKA KOSONG: Lanjut ambil no HP ↓
       │
       ├─── (3. POST /api/service/progress_status bawa nomor_polisi) ──▶ [Agung API Server]
       │                                                                  │
       ◀─── (4. Return JSON: Encrypted Phone) ────────────────────────────┘
       │
       ├─── (5. POST /api/decrypt) ──────────────────────────────▶ [Agung API Server]
       │                                                                  │
       ◀─── (6. Return JSON: "081234567890") ─────────────────────────────┘
       │
       ├─── (7. POST /send-wa payload: {number, message}) ───────▶ [Node.js Gateway]
       │                                                                  │ (Execute Baileys)
       ◀─── (8. Return JSON: {success: true}) ────────────────────────────┘
       │
       └──▶ [Insert ke wa_notification_logs: SENT] (Selesai 1 Loop)
```

---

## 📋 MASTER EXECUTION PLAN: WA AUTOMATION & SECURE API DECRYPTION (v1.3)

### 📌 Document & Workflow Control
*   **Target Project**: Digital Signage System (WOD - Agung Toyota)
*   **Target Repository**: `laravel-api-backend` & `wa-gateway` (Node.js)
*   **Operating Model**: Tech Lead (User) $\rightarrow$ Architect Assistant $\rightarrow$ Executor (Agent)
*   **Execution Rule**: Agent WAJIB mengeksekusi secara sekuensial (Phase 0 $\rightarrow$ Phase 5) dan menghentikan proses di setiap Review Checkpoint untuk meminta persetujuan Tech Lead.

---

### 🧪 PHASE 0: PRE-FLIGHT API VALIDATION (SANDBOX TESTING)
**Tujuan**: Memastikan kredensial aktif, endpoint dapat dijangkau dari server, dan format data sesuai sebelum menyentuh database atau kode aplikasi.

#### Step 0.1 — Konfigurasi Environment (.env)
Agent wajib menambahkan variabel berikut ke file `.env` dan `.env.example` di dalam direktori `laravel-api-backend`:
```env
# Kredensial Resmi API Agung Concern
AGIS_BASE_URL="https://apiv2.agis.link"
AGIS_BEARER_TOKEN="ac437d1e227ae78604cfcf1bf2b764dbe6491ddb3654d7adcc74766e087387cc"
AGIS_AUTH_KEY="ZWE4YzlhM2U5YjI4N2MxMmViZTRiMjk2ZTVjOTZhMzc6OkhNVlJPUjJOQTdjMFRCU3VJTTY3dG5xbk5mNE9tQmVJUlJyWngxbmNEVXZjSG5lMWpld3FWdDhHUkRLSGc0VHZGaXZJSEUvRWNXNTg0em9GbktoQUtwdS9CYVgybGR4SU5rK01aZmZPR1Q0dEpxWEhVOHpxNDRKTEFBR0xadTNqdGoydUFnYmlPSWJKMHVkY2ZkOTlrTURVVG8wQ2o3VDNudFB6dmRHMm8yOD0="

# Microservice Local Gateway
WA_GATEWAY_URL="http://127.0.0.1:3000/send-wa"
```

#### Step 0.2 — Pembuatan Command Pengujian Mandiri
*   **File Target**: `app/Console/Commands/TestAgungApiConnection.php`
*   **Signature**: `php artisan test:agung-api`
*   **Spesifikasi Logika**:
    *   **Uji Penarikan Data HP Terenkripsi (POST)**:
        *   Target: `${AGIS_BASE_URL}/api/service/progress_status` (Method: POST).
        *   Headers: `Authorization: Bearer ${AGIS_BEARER_TOKEN}`, `auth_key: ${AGIS_AUTH_KEY}`, `Accept: application/json`.
        *   Body JSON: `{"nomor_polisi": "BM 1234 AB"}` (Gunakan plat dummy untuk test).
        *   Timeout: 10 detik.
        *   Output CLI: Cetak HTTP status code dan field penampung nomor HP dari hasil response.
    *   **Uji Dekripsi (POST)**:
        *   Ambil nilai string terenkripsi dari hasil uji pertama (jika gagal, gunakan teks enkripsi dummy).
        *   Target: `${AGIS_BASE_URL}/api/decrypt`.
        *   Headers: Sama dengan uji pertama.
        *   Body JSON: `{"encrypted_value": "<SAMPLE_ENCRYPTED_STRING>"}`.
        *   Output CLI: Cetak hasil respons dekripsi (harus menampilkan nomor HP asli).

#### Step 0.3 — Eksekusi & Validasi Terminal
Jalankan di terminal server:
```bash
php artisan test:agung-api
```

> [!WARNING]
> **🛑 CHECKPOINT REVIEW PHASE 0:**
> *   Status GET mengembalikan 200 OK dengan payload array kendaraan.
> *   Status POST mengembalikan 200 OK dengan nomor HP terbaca (contoh: 0812... atau 628...).
> *   Lapor ke Tech Lead sebelum masuk ke Phase 1.

---

### 🔌 PHASE 1: SERVICE LAYER ARCHITECTURE
**Tujuan**: Mengisolasi seluruh pemanggilan HTTP API eksternal ke dalam satu Service Class yang aman dan toleran terhadap gangguan jaringan (Fault Tolerant).

#### Step 1.1 — Pembuatan Service File
*   **File Target**: `app/Services/AgungApiService.php`
*   **Namespace**: `App\Services`

#### Step 1.2 — Spesifikasi Method Service
*   `getEncryptedPhoneByPlate(string $nomorPolisi): ?string`
    *   Panggil POST ke `${baseUrl}/api/service/progress_status`.
    *   Pasang `Http::withToken()->withHeaders(['auth_key' => ..., 'Accept' => 'application/json'])`.
    *   Body: `['nomor_polisi' => $nomorPolisi]`.
    *   Terapkan `.timeout(10)->retry(2, 100)` untuk mencegah hang saat koneksi lambat.
    *   Return: String terenkripsi (misal dari key `no_hp` / `phone`). Jika response gagal/exception, log error via `Log::error()` dan return null.
*   `decryptPhoneNumber(?string $encryptedValue): ?string`
    *   Validasi awal: Jika `$encryptedValue` kosong/null, langsung return null.
    *   Panggil POST ke `${baseUrl}/api/decrypt` dengan JSON payload `['encrypted_value' => $encryptedValue]`.
    *   Header sama seperti di atas.
    *   Terapkan `.timeout(10)->retry(2, 100)`.
    *   Return: String nomor HP hasil dekripsi (key `decrypted_value` / `result`). Jika gagal, log error dan return null.

#### Step 1.3 — Verifikasi Service via Tinker
Jalankan:
```bash
php artisan tinker --execute="dump(app(\App\Services\AgungApiService::class)->getEncryptedPhoneByPlate('BM 1234 AB'));"
```

> [!WARNING]
> **🛑 CHECKPOINT REVIEW PHASE 1:**
> *   Service mengembalikan array data tanpa error/fatal exception.

---

### 🗄️ PHASE 2: DATABASE SCHEMA & IDEMPOTENCY LOCK
**Tujuan**: Menyiapkan tabel audit log sekaligus pengunci mutlak di level SQL agar pelanggan tidak menerima pesan WhatsApp lebih dari satu kali per hari.

#### Step 2.1 — Pembuatan File Migrasi
Jalankan:
```bash
php artisan make:migration create_wa_notification_logs_table
```
**Spesifikasi Skema Tabel (`wa_notification_logs`)**:
| Kolom | Tipe Data | Modifiers | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | bigIncrements | Primary Key | ID Unik log |
| `plat_no` | string | Index | Nomor polisi kendaraan |
| `customer_name` | string | Nullable | Nama pemilik kendaraan |
| `decrypted_phone` | string | Nullable | Nomor HP hasil dekripsi |
| `status` | enum | Default 'SENT' | Values: SENT, FAILED, DECRYPT_FAILED |
| `error_details` | text | Nullable | Catatan/pesan error jika gagal |
| `notified_date` | date | Index | Tanggal pengiriman (YYYY-MM-DD) |
| `timestamps` | timestamp | Nullable | created_at & updated_at |

**Constraint Indeks Unik (Anti-Spam Idempotency)**:
Wajib menambahkan composite unique index:
```php
$table->unique(['plat_no', 'notified_date'], 'unique_daily_plate_notification');
```

#### Step 2.2 — Eksekusi Migrasi & Konfigurasi Model
Jalankan:
```bash
php artisan migrate
```
Buat / Perbarui Model `app/Models/WaNotificationLog.php`:
```php
protected $fillable = [
    'plat_no',
    'customer_name',
    'decrypted_phone',
    'status',
    'error_details',
    'notified_date',
];
```

> [!WARNING]
> **🛑 CHECKPOINT REVIEW PHASE 2:**
> *   Tabel `wa_notification_logs` terbuat di database.
> *   Verifikasi indeks unik aktif di database engine (MySQL/SQLite).

---

### ⚙️ PHASE 3: AUTOMATION ORCHESTRATOR & SCHEDULING
**Tujuan**: Membangun alur 7-langkah pemrosesan antrean mobil selesai dan menjadwalkannya setiap menit di background.

#### Step 3.1 — Pembuatan Command Orkestrator
*   **File Target**: `app/Console/Commands/ProcessAutomatedWA.php`
*   **Signature**: `protected $signature = 'wa:process-automation';`

#### Step 3.2 — Logika Eksekusi 7 Langkah (`handle()` method)
1.  **Ambil Tanggal Hari Ini**: Simpan `$today = Carbon::today()->toDateString();`.
2.  **Fetch Data CRM Lokal**: Ambil data dari cache `wod_live_queues`. Jika kosong, akhiri proses dengan sukses.
3.  **Filter Selesai**: Saring hanya data yang memiliki status string mengandung "SELESAI" (case-insensitive).
4.  **Looping & Idempotency Check**:
    *   Ambil `$platNo = trim($item['plate'] ?? '');`.
    *   Cek: `WaNotificationLog::where('plat_no', $platNo)->where('notified_date', $today)->exists()`.
    *   Jika **SUDAH ADA**: Lewati ke antrean berikutnya (`continue`).
5.  **Fetch & Decrypt Nomor HP (Agung API)**:
    *   Panggil `$rawPhone = $apiService->getEncryptedPhoneByPlate($platNo);`.
    *   Jika Gagal/Null: Simpan log status `'DECRYPT_FAILED'`, isi `error_details`, lalu `continue`.
    *   Panggil `$realPhone = $apiService->decryptPhoneNumber($rawPhone);`.
    *   Jika Dekripsi Gagal/Null: Simpan log status `'DECRYPT_FAILED'`, lalu `continue`.
6.  **Compose & Dispatch WhatsApp**:
    *   **Template Pesan**:
        ```plaintext
        Halo Bapak/Ibu {customer_name},
        
        Kendaraan Anda dengan nomor polisi *{plat_no}* telah selesai dikerjakan dan siap untuk diambil.
        
        Terima kasih telah mempercayakan perawatan kendaraan Anda kepada *Agung Toyota*.
        ```
    *   Kirim HTTP POST ke `${WA_GATEWAY_URL}` (Timeout 5 detik) dengan payload: `{"number": $realPhone, "message": $message}`.
7.  **Audit Logging**:
    *   Jika respon gateway 200 OK $\rightarrow$ Catat record dengan status = `'SENT'`.
    *   Jika respon gateway error/timeout $\rightarrow$ Catat record dengan status = `'FAILED'` dan catat detail error.

#### Step 3.3 — Registrasi Scheduler
Buka `routes/console.php` (Laravel 11) dan tambahkan:
```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('wa:process-automation')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->runInBackground();
```

> [!WARNING]
> **🛑 CHECKPOINT REVIEW PHASE 3:**
> *   Uji eksekusi manual via terminal: `php artisan wa:process-automation`.
> *   Pastikan command berjalan bersih tanpa error sintaks.

---

### 🚀 PHASE 4: LOCAL NODE.JS MESSAGING GATEWAY SETUP
**Tujuan**: Memastikan microservice kurir WhatsApp lokal aktif, tertaut dengan nomor CS Bengkel (+62 823-8464-1238), dan berjalan 24/7 via PM2.

#### Step 4.1 — Struktur Direktori & Dependensi Microservice
*   **Lokasi Folder**: `wa-gateway/`
*   **Dependensi (`package.json`)**: `express`, `whatsapp-web.js`, `qrcode-terminal`.
*   **File Utama**: `wa-gateway/server.js`

#### Step 4.2 — Spesifikasi Endpoint Gateway (`POST /send-wa`)
*   **Menerima payload JSON**: `{ "number": "08xxx", "message": "text" }`.
*   **Sanitasi Nomor Telepon**:
    *   Bersihkan karakter non-numerik.
    *   Ganti awalan `0` atau `+62` menjadi prefix internasional murni `62`.
    *   Tambahkan suffix `@c.us` (contoh: `6282384641238@c.us`).
*   **Kirim Pesan**: Jalankan `client.sendMessage(chatId, message)`.
*   **Response**:
    *   **Berhasil**: Return JSON `{ "success": true, "message": "Pesan terkirim" }` (HTTP 200).
    *   **Gagal / Client belum siap**: Return JSON `{ "success": false, "error": "Detail pesan error" }` (HTTP 500).

#### Step 4.3 — Autentikasi Nomor CS & Daemonize PM2
1.  Jalankan service via terminal: `node server.js`.
2.  Buka aplikasi WhatsApp di HP CS Bengkel (+62 823-8464-1238) $\rightarrow$ Perangkat Tertaut $\rightarrow$ Tautkan Perangkat $\rightarrow$ Scan QR Code di terminal.
3.  Pastikan log menampilkan `WhatsApp Client is Ready!`.
4.  Kunci proses dengan PM2 agar berjalan di latar belakang:
    ```bash
    pm2 start server.js --name "wa-gateway"
    pm2 save
    ```

> [!WARNING]
> **🛑 CHECKPOINT REVIEW PHASE 4:**
> *   Lakukan uji tembak kirim pesan manual via cURL:
>     ```bash
>     curl -X POST http://127.0.0.1:3000/send-wa \
>       -H "Content-Type: application/json" \
>       -d '{"number":"081234567890","message":"Test Notifikasi Gateway WOD"}'
>     ```
> *   Pesan uji coba berhasil masuk ke nomor tujuan.

---

### 🧪 PHASE 5: END-TO-END INTEGRATION & TEST SCENARIOS
**Tujuan**: Menguji seluruh skenario operasional nyata bengkel dan ketahanan sistem.

**Matriks Skenario Uji**:
| No | Skenario Pengujian | Aksi Uji | Ekspektasi Hasil |
| :--- | :--- | :--- | :--- |
| 1 | **Happy Path** (Mobil Selesai) | Jalankan `php artisan wa:process-automation` saat ada mobil berstatus "SELESAI". | - Nomor HP didekripsi sukses.<br>- WA masuk ke HP pelanggan.<br>- DB mencatat status = `'SENT'`. |
| 2 | **Anti-Spam / Idempotency** | Jalankan command untuk kedua kalinya di hari yang sama. | - Plat nomor yang sama langsung di-skip.<br>- Tidak ada WA ganda yang terkirim. |
| 3 | **Gateway Offline Resilience** | Matikan sementara gateway (`pm2 stop wa-gateway`), lalu jalankan command. | - Laravel tidak crash / fatal error.<br>- DB mencatat status = `'FAILED'`. |
| 4 | **Decryption Error Resilience** | Simulasikan field no_hp kosong atau string rusak. | - DB mencatat status = `'DECRYPT_FAILED'`.<br>- Proses looping mobil lain tetap lanjut. |

---

### 📂 DAFTAR FILE OUTPUT & DELIVERABLES
```plaintext
📦 Digital_WOD
 ┣ 📂 laravel-api-backend
 ┃ ┣ 📜 .env (Updated with AGIS credentials)
 ┃ ┣ 📂 app/Console/Commands
 ┃ ┃ ┣ 📜 TestAgungApiConnection.php (NEW - Phase 0)
 ┃ ┃ ┗ 📜 ProcessAutomatedWA.php     (NEW - Phase 3)
 ┃ ┣ 📂 app/Services
 ┃ ┃ ┗ 📜 AgungApiService.php        (NEW - Phase 1)
 ┃ ┣ 📂 app/Models
 ┃ ┃ ┗ 📜 WaNotificationLog.php      (NEW/MODIFY - Phase 2)
 ┃ ┣ 📂 database/migrations
 ┃ ┃ ┗ 📜 *_create_wa_notification_logs_table.php (NEW - Phase 2)
 ┃ ┗ 📜 routes/console.php           (MODIFY - Phase 3)
 ┗ 📂 wa-gateway
   ┣ 📜 package.json                 (Phase 4)
   ┗ 📜 server.js                    (Phase 4)
```
