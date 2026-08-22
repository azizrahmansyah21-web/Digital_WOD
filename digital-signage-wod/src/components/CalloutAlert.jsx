import React, { useEffect } from 'react';

const CalloutAlert = ({ vehicle, customerName, plateNumber, isOpen, onClose }) => {
  const custName = customerName || vehicle?.customer;
  const plateNo = plateNumber || vehicle?.plate;
  const active = isOpen !== undefined ? (isOpen && Boolean(custName)) : Boolean(vehicle);

  useEffect(() => {
    if (active && custName && plateNo) {
      // Remote D-Pad / OK / Back key handling for Xiaomi Android TV (BrowsHere)
      const handleRemoteKey = (e) => {
        if (
          ['Enter', 'Escape', 'Backspace', ' ', 'GoBack'].includes(e.key) ||
          e.keyCode === 13 ||
          e.keyCode === 27 ||
          e.keyCode === 8
        ) {
          if (onClose) onClose();
        }
      };

      window.addEventListener('keydown', handleRemoteKey);

      // 1. Play Audio Stream via Backend Laravel Endpoint (/api/tts)
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const message = `Panggilan kepada Bapak ${custName}, nomor polisi ${plateNo}, kendaraan Anda telah selesai dikerjakan.`;
      const audioUrl = `${apiUrl}/tts?text=${encodeURIComponent(message)}`;
      
      const audio = new Audio(audioUrl);
      audio.volume = 1.0;
      audio.play().catch((err) => {
        console.warn("Autoplay terblokir oleh browser TV:", err);
      });

      // 2. Auto-close modal setelah 10 detik
      const timer = setTimeout(() => {
        if (onClose) onClose();
      }, 10000);

      return () => {
        window.removeEventListener('keydown', handleRemoteKey);
        clearTimeout(timer);
        audio.pause();
      };
    }
  }, [active, custName, plateNo, onClose]);

  if (!active || !custName || !plateNo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in">
      
      {/* Modal Box: Terkunci max height 80vh agar tidak kepotong di TV */}
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col items-center justify-between rounded-2xl bg-[#1b6b50] p-8 shadow-2xl text-white overflow-hidden border-4 border-emerald-400/30">
        
        {/* Tombol Close / Silang (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-xl transition-colors shadow-sm"
          aria-label="Tutup Notifikasi"
        >
          ✕
        </button>

        {/* Icon Megaphone */}
        <div className="w-20 h-20 bg-white text-emerald-700 rounded-full flex items-center justify-center mb-3 shadow-lg animate-pulse shrink-0">
          <span className="text-4xl">📢</span>
        </div>

        {/* Teks Panggilan */}
        <h2 className="text-xl font-bold uppercase tracking-widest opacity-90 shrink-0 mb-1">
          Panggilan Pelanggan
        </h2>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-center mt-1 mb-4 uppercase truncate w-full shrink-0">
          {custName}
        </h1>

        {/* Box Plat Nomor */}
        <div className="bg-white text-gray-900 px-6 py-3 rounded-xl border-4 border-gray-300 w-full text-center shadow-inner shrink-0 mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nomor Polisi</p>
          <p className="text-4xl md:text-5xl font-black uppercase tracking-widest font-plate">{plateNo}</p>
        </div>

        {/* Footer Status */}
        <div className="mt-2 px-6 py-2 bg-green-800/50 rounded-full border border-green-400/30 shrink-0">
          <p className="text-lg font-bold uppercase tracking-wide text-green-100">
            Telah Selesai Dikerjakan
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default CalloutAlert;
