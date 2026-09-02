const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3000;

// Middleware untuk mem-parsing JSON dari request body
app.use(express.json());

// Inisialisasi WhatsApp Client
// Menggunakan LocalAuth agar sesi tersimpan dan tidak perlu scan QR tiap kali restart
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Berguna jika dijalankan di server tanpa GUI (Headless mode)
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

/**
 * EVENT: QR Code
 * Dipicu ketika klien membutuhkan otentikasi.
 * Akan menampilkan QR Code di terminal untuk di-scan melalui aplikasi WhatsApp.
 */
client.on('qr', (qr) => {
    console.log('\n[!] PERHATIAN: Silakan scan QR code di bawah ini menggunakan WhatsApp Anda:');
    qrcode.generate(qr, { small: true });
});

/**
 * EVENT: Ready
 * Dipicu ketika klien sukses melakukan otentikasi dan siap digunakan.
 */
client.on('ready', () => {
    console.log('\n[✅] SUCCESS: WhatsApp Gateway sudah berhasil terhubung dan SIAP digunakan!');
});

/**
 * EVENT: Authenticated
 * Dipicu ketika otentikasi berhasil.
 */
client.on('authenticated', () => {
    console.log('[ℹ️] Sesi terautentikasi.');
});

/**
 * EVENT: Auth Failure
 * Dipicu ketika gagal terautentikasi (mungkin karena sesi expired atau ditolak).
 */
client.on('auth_failure', msg => {
    console.error('[❌] AUTH ERROR:', msg);
});

// Jalankan client WhatsApp
client.initialize();

/**
 * API ROUTE: POST /send-wa (Atau /send-message)
 * Endpoint ini dipanggil oleh Laravel Orchestrator (ProcessAutomatedWA)
 * untuk mengirimkan notifikasi.
 * 
 * Payload yang diharapkan:
 * {
 *   "number": "62812xxxxxx",
 *   "message": "Halo, mobil anda sudah selesai..."
 * }
 */
app.post(['/send-wa', '/send-message'], async (req, res) => {
    console.log('\n[📥] INCOMING REQUEST: Menerima permintaan kirim pesan...');
    
    const { number, message } = req.body;

    // Validasi payload
    if (!number || !message) {
        console.warn('[⚠️] BAD REQUEST: Nomor atau pesan tidak lengkap!');
        return res.status(400).json({ 
            success: false, 
            error: 'Mohon sertakan "number" dan "message" dalam body request.' 
        });
    }

    try {
        // Format nomor untuk whatsapp-web.js (harus berakhiran @c.us)
        // Kita asumsikan nomor sudah bersih tanpa + awalan dari Laravel
        const formattedNumber = `${number}@c.us`;
        
        console.log(`[🚀] MEMPROSES PENGIRIMAN: Mengirim pesan ke ${number}...`);
        
        // Eksekusi pengiriman pesan
        const response = await client.sendMessage(formattedNumber, message);
        
        // Cek apakah ada response dan ID
        const messageId = response && response.id ? response.id._serialized : 'unknown_id';
        console.log(`[✅] TERKIRIM: Pesan berhasil dikirim ke ${number}! ID: ${messageId}`);
        
        // Kembalikan response sukses ke Laravel
        res.status(200).json({ 
            success: true, 
            message: 'Pesan berhasil dikirim!',
            response: response || {}
        });
    } catch (error) {
        console.error(`[❌] GAGAL MENGIRIM: Pesan ke ${number} gagal dikirim. Error:`, error);
        
        // Kembalikan response error ke Laravel
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Jalankan server Express
app.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 WA Gateway API berjalan di http://127.0.0.1:${port}`);
    console.log(`======================================================`);
    console.log(`[⏳] Menunggu inisialisasi WhatsApp Client...`);
});
