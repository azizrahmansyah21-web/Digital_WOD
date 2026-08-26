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
    <div className="w-full h-full flex items-center bg-[#FFFFFF] text-[#000000] overflow-hidden relative font-radio border-t border-[#DBE0EC]">
      {/* Toyota Brand Badge using Logo (Natural aspect ratio, non-stretched) */}
      <div className="flex items-center justify-center px-4 bg-white h-full z-10 shrink-0 border-r border-[#DBE0EC]">
        <img src="/logo-lgb.png" alt="Toyota Let's Go Beyond" className="h-10 w-auto object-contain max-w-full block drop-shadow-2xs" />
      </div>

      {/* Info Badge */}
      <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-gradient-accent text-[#000000] rounded-lg border border-[#DBE0EC] font-extrabold text-xs shrink-0 ml-3 z-10 shadow-2xs">
        <span>📢</span>
        <span className="uppercase tracking-wider">INFORMASI</span>
      </div>

      {/* Marquee Running Text */}
      <div className="flex-1 h-full overflow-hidden relative flex items-center">
        <div className="animate-marquee">
          {announcements.concat(announcements).map((text, idx) => (
            <div key={idx} className="inline-flex items-center gap-3 px-4">
              <span className="text-base font-bold tracking-wide text-[#000000]">{text}</span>
              <span className="text-[#6C6C6C] font-black text-base ml-4">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Clock */}
      <div className="flex flex-col justify-center items-end px-5 bg-[#F6F8FB] h-full min-w-[150px] z-10 shrink-0 border-l border-[#DBE0EC]">
        <div className="text-lg font-black text-[#000000] tracking-widest leading-none font-mono">{time}</div>
        <div className="text-[11px] font-semibold text-[#6C6C6C] capitalize mt-1 leading-none">{date}</div>
      </div>
    </div>
  );
};

export default Ticker;
