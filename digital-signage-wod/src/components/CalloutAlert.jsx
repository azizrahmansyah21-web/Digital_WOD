import React, { useEffect, useState } from 'react';
import PlateNumber from './PlateNumber';

const CalloutAlert = ({ vehicle, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [vehicle]);

  if (!vehicle || !isVisible) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-emerald-600 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl border-4 border-emerald-400 w-3/4 max-w-4xl transform scale-100 animate-pulse">
        
        {/* Animated Bell / Check */}
        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-inner animate-bounce">
          <span className="text-7xl">📢</span>
        </div>
        
        <h2 className="text-3xl font-black text-emerald-100 uppercase tracking-widest mb-2">
          Panggilan Pelanggan
        </h2>
        
        <h1 className="text-6xl font-black text-white uppercase tracking-wider mb-8 drop-shadow-md">
          {vehicle.customer}
        </h1>
        
        <div className="bg-white px-10 py-5 rounded-2xl shadow-xl mb-8 border-4 border-emerald-700 flex flex-col items-center">
          <p className="text-xl font-extrabold text-gray-500 uppercase tracking-widest mb-3">Nomor Polisi</p>
          <PlateNumber plate={vehicle.plate} className="text-5xl md:text-6xl px-6 py-3 min-w-[340px] max-w-[460px] justify-between" />
        </div>
        
        <div className="bg-emerald-800 text-emerald-100 px-8 py-3 rounded-full text-3xl font-black tracking-wide border-2 border-emerald-500 uppercase shadow-lg">
          Telah Selesai Dikerjakan
        </div>
        
        <p className="text-xl font-bold text-emerald-200 mt-8">
          Silakan menuju area penyerahan kendaraan
        </p>

      </div>
    </div>
  );
};

export default CalloutAlert;
