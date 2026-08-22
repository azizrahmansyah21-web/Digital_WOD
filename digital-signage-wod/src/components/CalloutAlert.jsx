import React, { useEffect, useState } from 'react';
import PlateNumber from './PlateNumber';

const CalloutAlert = ({ vehicle, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setIsVisible(true);

      // Remote D-Pad / OK / Back key handling for Xiaomi Android TV (BrowsHere)
      const handleRemoteKey = (e) => {
        if (
          ['Enter', 'Escape', 'Backspace', ' ', 'GoBack'].includes(e.key) ||
          e.keyCode === 13 ||
          e.keyCode === 27 ||
          e.keyCode === 8
        ) {
          handleClose();
        }
      };

      window.addEventListener('keydown', handleRemoteKey);
      return () => window.removeEventListener('keydown', handleRemoteKey);
    } else {
      setIsVisible(false);
    }
  }, [vehicle]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!vehicle || !isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-white p-6 shadow-2xl flex flex-col items-center justify-center text-center border-4 border-emerald-500 animate-fade-in">
        
        {/* Tombol Close / Silang (X) di Pojok Kanan Atas */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-xl transition-colors shadow-sm"
          aria-label="Tutup Notifikasi"
        >
          ✕
        </button>

        {/* Animated Icon */}
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-3 shadow-inner shrink-0">
          📢
        </div>
        
        <h2 className="text-lg font-bold text-emerald-800 uppercase tracking-widest mb-1 shrink-0">
          Panggilan Pelanggan
        </h2>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 uppercase tracking-wide mb-4 line-clamp-2 shrink-0">
          {vehicle.customer}
        </h1>
        
        {/* Plate Container */}
        <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-200 shadow-inner flex flex-col items-center mb-4 w-full max-w-md shrink-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nomor Polisi</p>
          <PlateNumber plate={vehicle.plate} className="text-4xl md:text-5xl px-6 py-2 min-w-[280px] justify-between" />
        </div>
        
        {/* Status Badge */}
        <div className="bg-emerald-600 text-white px-6 py-2 rounded-full text-lg md:text-xl font-extrabold tracking-wide uppercase shadow-md mb-3 shrink-0">
          Telah Selesai Dikerjakan
        </div>
        
        <p className="text-sm font-semibold text-slate-600 shrink-0">
          Silakan menuju area penyerahan kendaraan
        </p>

      </div>
    </div>
  );
};

export default CalloutAlert;
