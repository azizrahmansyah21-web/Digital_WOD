import React, { useState, useEffect } from 'react';

const Ticker = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const announcements = [
    'Selamat datang di Bengkel Resmi Toyota. Mengutamakan Keselamatan, Kualitas, dan Kepuasan Pelanggan.',
    'Gunakan Fasilitas Express Maintenance untuk Servis Cepat Bergaransi hanya 60 Menit.',
    'Harap perhatikan nomor antrean dan status pengerjaan kendaraan Anda pada monitor WOD.',
    'Dapatkan diskon paket perawatan berkala dan voucher spare part asli Toyota selama bulan ini.',
  ];

  return (
    <div className="w-full h-full flex items-center bg-white text-cyan-600 overflow-hidden relative border-t border-gray-200 shadow-md">
      {/* Toyota Brand Badge using Logo */}
      <div className="flex flex-col justify-center items-center px-6 bg-white h-full min-w-[200px] z-10 shadow-[4px_0_12px_rgba(0,0,0,0.1)] shrink-0 border-r">
        <img src="/logo-lgb.png" alt="Logo LGB" className="h-14 object-contain" />
      </div>

      {/* Marquee Running Text */}
      <div className="flex-1 h-full overflow-hidden relative flex items-center">
        <div className="animate-marquee">
          {announcements.concat(announcements).map((text, idx) => (
            <div key={idx} className="inline-flex items-center gap-2.5 px-4">
              <span className="text-lg">📢</span>
              <span className="text-lg font-bold tracking-wide text-cyan-600">{text}</span>
              <span className="text-cyan-600/50 font-extrabold text-lg ml-5">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Clock */}
      <div className="flex flex-col justify-center items-end px-6 bg-white h-full min-w-[160px] z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.1)] shrink-0 border-l border-gray-100">
        <div className="text-xl font-black text-cyan-700 tracking-widest leading-none font-mono">{time}</div>
        <div className="text-[11px] font-bold text-cyan-600/70 capitalize mt-1">{date}</div>
      </div>
    </div>
  );
};

export default Ticker;
