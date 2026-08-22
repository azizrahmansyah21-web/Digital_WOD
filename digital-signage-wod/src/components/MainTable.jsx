import React, { useEffect, useRef } from 'react';
import PlateNumber from './PlateNumber';

const MainTable = ({ vehicles = [], inProgressVehicles = [] }) => {
  // Display inProgressVehicles primarily, but show all if available
  const displayData = inProgressVehicles.length > 0 ? inProgressVehicles : vehicles;
  
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const step = 1; // Kecepatan scroll (pixel)
    const intervalTime = 50; // Interval waktu (ms)
    let pause = false;

    const interval = setInterval(() => {
      if (pause) return;

      if (el.scrollHeight > el.clientHeight) {
        el.scrollTop += step;
        
        // Jika sudah mencapai paling bawah
        if (Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight) {
          pause = true;
          setTimeout(() => {
            if (el) el.scrollTop = 0;
            pause = false;
          }, 3000); // Berhenti 3 detik sebelum kembali ke atas
        }
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [displayData]);

  const getStatusBadge = (status) => {
    const upperStatus = status.toUpperCase();

    if (upperStatus.includes('SELESAI')) {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
          SELESAI
        </span>
      );
    }
    if (upperStatus.includes('CUCI') || upperStatus.includes('PEMBERSIHAN')) {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm"></span>
          TUNGGU CUCI
        </span>
      );
    }
    if (upperStatus.includes('PROSES') || upperStatus.includes('PENGERJAAN')) {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse-dot shadow-sm"></span>
          PROSES PERBAIKAN
        </span>
      );
    }
    if (upperStatus.includes('MENUNGGU') && upperStatus.includes('SPAREPART')) {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold bg-red-100 text-red-800 border border-red-300">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
          TUNGGU PART
        </span>
      );
    }
    if (upperStatus.includes('MENUNGGU')) {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></span>
          MENUNGGU
        </span>
      );
    }
    if (upperStatus.includes('BESOK') || upperStatus.includes('DILANJUT')) {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-300">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span>
          LANJUT BESOK
        </span>
      );
    }
    // Default
    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold bg-gray-100 text-gray-700 border border-gray-300">
        <span className="w-2.5 h-2.5 rounded-full bg-gray-500 shadow-sm"></span>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-white text-gray-900 p-5 overflow-hidden">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-4 border-b-4 border-cyan-600 mb-4 shrink-0">
        <div className="flex items-center gap-6">
          <div className="bg-white rounded-xl py-1 px-3 flex items-center justify-center shrink-0">
            <img src="/logo-lgb.png" alt="Logo LGB" className="h-20 w-auto object-contain drop-shadow-sm" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-black tracking-wide text-gray-900 uppercase">Maintenance Information Board</h1>
            <p className="text-base text-gray-500 font-bold uppercase tracking-widest mt-1">Work Operational Display - Agung Toyota</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg shadow-sm">
            <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse-dot"></span>
            AKTIF: {displayData.length} KENDARAAN
          </span>
        </div>
      </div>

      {/* Full Table */}
      <div 
        ref={scrollRef} 
        className="flex-1 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Sembunyikan scrollbar di Firefox/IE
      >
        <style>{`.flex-1::-webkit-scrollbar { display: none; }`}</style>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-cyan-600 text-white text-xs md:text-sm font-black tracking-wider sticky top-0 z-10 shadow-md">
              <th className="py-3.5 px-4 w-[4%] text-center border-b border-cyan-700">#</th>
              <th className="py-3.5 px-4 w-[16%] border-b border-cyan-700">NO POLISI</th>
              <th className="py-3.5 px-4 w-[26%] border-b border-cyan-700">NAMA PELANGGAN</th>
              <th className="py-3.5 px-4 w-[10%] text-center border-b border-cyan-700">MULAI</th>
              <th className="py-3.5 px-4 w-[10%] text-center border-b border-cyan-700">EST. SELESAI</th>
              <th className="py-3.5 px-4 w-[20%] text-center border-b border-cyan-700">STATUS PROGRESS</th>
              <th className="py-3.5 px-4 w-[14%] text-center border-b border-cyan-700">SERVICE ADVISOR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayData.length > 0 ? (
              displayData.map((row, idx) => (
                <tr key={row.id || idx} className="hover:bg-blue-50/80 transition-colors even:bg-gray-50/60 bg-white">
                  <td className="py-3 px-4 text-center text-sm font-bold text-gray-400">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <PlateNumber plate={row.plate} className="text-lg px-3 py-1 w-[150px] justify-between" />
                  </td>
                  <td className="py-3 px-4 font-black text-gray-900 text-base md:text-lg uppercase tracking-wide truncate">{row.customer}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-600 text-sm md:text-base">{row.startTime || '-'}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-700 text-sm md:text-base">{row.estTime || '-'}</td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(row.status)}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-700 text-sm md:text-base">{row.advisor || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-16 text-center text-base md:text-lg text-gray-400 font-bold">
                  Belum ada kendaraan dalam proses perbaikan saat ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MainTable;
