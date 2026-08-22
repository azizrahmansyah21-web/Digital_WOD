# IMPLEMENTATION PLAN: Android TV Optimization & Backend TTS Audio Stream

## 🎯 Objektif Utama
1. **Audio Fix**: Mengganti Web Speech API (TTS bawaan browser) yang diblokir oleh Android TV dengan sistem Audio Stream dari Backend Laravel.
2. **Layout Fix**: Memperbaiki masalah overflow, teks menabrak, dan tabel sempit pada resolusi 1080p Android TV menggunakan Tailwind CSS.
3. **Video Fix**: Menghapus tombol overlay bawaan player (Fullscreen/Close) pada komponen Media Promo.

---

## 🛠️ PHASE 1: BACKEND LARAVEL (Audio TTS Proxy)

### 1. Update Controller (`laravel-api-backend/app/Http/Controllers/API/QueueController.php`)
Tambahkan fungsi `generateTTS` ke dalam controller ini untuk mem-proxy audio dari Google Translate API menjadi file MP3.

```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    // ... (Fungsi lain yang sudah ada biarkan saja) ...

    /**
     * Generate Audio TTS stream via Google Translate
     */
    public function generateTTS(Request $request)
    {
        $text = $request->query('text', 'Panggilan antrean');
        $cleanText = urlencode(strip_tags($text));
        
        // URL Google Translate TTS (Bahasa Indonesia)
        $url = "[https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=](https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=)" . $cleanText;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // User agent wajib diisi agar tidak di-block oleh Google
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $audioContent = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$audioContent) {
            return response()->json(['error' => 'Gagal membuat audio TTS'], 500);
        }

        // Return binary audio file
        return response($audioContent, 200, [
            'Content-Type' => 'audio/mpeg',
            'Content-Disposition' => 'inline; filename="tts.mp3"',
            'Cache-Control' => 'no-cache, must-revalidate',
        ]);
    }
}
```

### 2. Update Route API (`laravel-api-backend/routes/api.php`)
Daftarkan endpoint baru agar bisa diakses oleh frontend.

```php
use App\Http\Controllers\API\QueueController;

// Tambahkan baris ini di dalam grup route API Anda
Route::get('/tts', [QueueController::class, 'generateTTS']);
```

---

## 🛠️ PHASE 2: FRONTEND REACT (Layout & Audio Fix)

### 1. Viewport Lock (`digital-signage-wod/index.html`)
Ganti tag meta viewport agar Android TV tidak melakukan zooming paksa.

```html
<!-- Ubah tag meta viewport menjadi ini: -->
<meta name="viewport" content="width=1920, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### 2. Update Callout Alert & Audio Player (`digital-signage-wod/src/components/CalloutAlert.jsx`)
Ganti seluruh kodingan TTS (`window.speechSynthesis`) menjadi HTML5 Audio dan batasi ukuran modal agar tidak *overflow*.

```jsx
import React, { useEffect } from 'react';

const CalloutAlert = ({ isOpen, customerName, plateNumber, onClose }) => {
  useEffect(() => {
    if (isOpen && customerName && plateNumber) {
      // 1. Play Audio via Backend Endpoint
      const message = `Panggilan kepada Bapak ${customerName}, nomor polisi${plateNumber}, kendaraan Anda telah selesai dikerjakan.`;
      const audioUrl = `/api/tts?text=${encodeURIComponent(message)}`;
      
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.play().catch((err) => {
        console.warn("Autoplay terblokir oleh browser TV:", err);
      });

      // 2. Auto-close modal setelah 8 detik
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, customerName, plateNumber, onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop overlay full screen
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      
      // Modal Box: Terkunci max height 80vh agar tidak kepotong di TV
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col items-center justify-between rounded-2xl bg-[#1b6b50] p-8 shadow-2xl text-white overflow-hidden">
        
        {/* Icon Megaphone */}
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
          <span className="text-5xl">📢</span>
        </div>

        {/* Teks Panggilan */}
        <h2 className="text-2xl font-bold uppercase tracking-widest opacity-90">Panggilan Pelanggan</h2>
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mt-2 mb-6 uppercase truncate w-full">
          {customerName}
        </h1>

        {/* Box Plat Nomor */}
        <div className="bg-white text-gray-900 px-8 py-4 rounded-xl border-4 border-gray-300 w-full text-center shadow-inner">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Nomor Polisi</p>
          <p className="text-5xl font-black uppercase tracking-widest">{plateNumber}</p>
        </div>

        {/* Footer Status */}
        <div className="mt-8 px-8 py-3 bg-green-800/50 rounded-full border border-green-400/30">
          <p className="text-xl font-bold uppercase tracking-wide text-green-100">
            Telah Selesai Dikerjakan
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default CalloutAlert;
```

### 3. Update Layout Tabel & Header (`digital-signage-wod/src/components/MainTable.jsx`)
Perbaiki posisi judul yang bertumpuk dan kecilkan padding tabel agar muat banyak baris.

```jsx
// Di dalam render return MainTable.jsx:

// 1. HEADER SECTION (Flex-between agar tidak numpuk)
<div className="flex flex-row justify-between items-start w-full mb-4">
    <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-gray-800">MAINTENANCE INFORMATION BOARD</h1>
        <p className="text-lg text-gray-500 uppercase">Work Operational Display - Agung Toyota</p>
    </div>
    
    <div className="flex flex-row items-center gap-4">
        {/* Badge Status View */}
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm">
            <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
            AKTIF: {queueData.length} KENDARAAN
        </div>
        
        {/* HAPUS/SEMBUNYIKAN TOMBOL "SWITCH" & "TEST POPUP" DI SINI AGAR RAPI DI TV */}
    </div>
</div>

// 2. TABLE SECTION (Kunci Tinggi & Kurangi Padding)
<div className="w-full h-full flex flex-col justify-start overflow-hidden rounded-xl border border-gray-200 bg-white">
    <table className="w-full text-left border-collapse">
        <thead className="bg-[#107ca4] text-white">
            <tr>
                <th className="py-3 px-4 font-semibold text-center w-16">#</th>
                <th className="py-3 px-4 font-semibold">NO POLISI</th>
                <th className="py-3 px-4 font-semibold">NAMA PELANGGAN</th>
                <th className="py-3 px-4 font-semibold text-center">MULAI</th>
                <th className="py-3 px-4 font-semibold text-center">EST. SELESAI</th>
                <th className="py-3 px-4 font-semibold text-center">STATUS PROGRESS</th>
                <th className="py-3 px-4 font-semibold text-center">SERVICE ADVISOR</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
            {/* Pada looping data (tr): Ubah padding row dari py-4 menjadi py-2.5 */}
            {queueData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4 text-center text-gray-500">{index + 1}</td>
                    
                    <td className="py-2.5 px-4">
                        <div className="border-2 border-gray-800 rounded px-3 py-1 font-bold text-xl inline-block bg-white tracking-wider">
                            {item.plate}
                        </div>
                    </td>
                    
                    <td className="py-2.5 px-4 font-semibold text-gray-700">{item.customer}</td>
                    <td className="py-2.5 px-4 text-center">{item.startTime}</td>
                    <td className="py-2.5 px-4 text-center text-green-600 font-bold">{item.estTime}</td>
                    <td className="py-2.5 px-4 text-center">
                        <span className="bg-cyan-100 text-cyan-800 px-4 py-1.5 rounded-full text-sm font-bold border border-cyan-200">
                            {item.status}
                        </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-gray-600">{item.advisor}</td>
                </tr>
            ))}
        </tbody>
    </table>
</div>
```

### 4. Hapus Overlay Video (`digital-signage-wod/src/components/MediaPromo.jsx`)
Pastikan tag video benar-benar bersih dari kontrol bawaan browser TV.

```jsx
// Cari tag <video> dan pastikan prop attributes-nya seperti ini:
<video 
    src="/path-to-video.mp4" 
    autoPlay 
    loop 
    muted 
    playsInline 
    controls={false} /* Ini menghilangkan tombol Fullscreen & X */
    className="w-full h-full object-cover rounded-xl pointer-events-none" /* pointer-events-none mematikan event klik pada video */
/>
```

---

## 🚀 Eksekusi (Untuk AI Agent & Developer)
1. Terapkan perubahan pada semua file di atas.
2. Buka terminal di server/lokal, masuk ke folder frontend: `cd digital-signage-wod`
3. Jalankan `npm run build`
4. Buka Android TV (Gunakan aplikasi **TV Bro** untuk hasil maksimal tanpa watermark), lakukan *refresh* `http://172.16.27.5/ruang-tunggu`.