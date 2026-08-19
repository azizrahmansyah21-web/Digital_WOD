import React from 'react';
import Ticker from '../components/Ticker';

const GRRoom = () => {
  return (
    <div className="grid grid-cols-1 grid-rows-[calc(100vh-76px)_76px] w-screen h-screen overflow-hidden bg-neutral-950 text-white">
      <main className="p-8 flex flex-col justify-center items-center text-center">
        <div className="bg-red-600/20 text-red-500 border border-red-600/40 px-4 py-1.5 rounded-full text-xs font-bold mb-4 tracking-widest">
          PHASE 2 ROADMAP
        </div>
        <h1 className="text-4xl font-black mb-3">GENERAL REPAIR (GR) PRODUCTION BOARD</h1>
        <p className="text-slate-400 max-w-xl text-sm leading-relaxed mb-6">
          Halaman High-Contrast Visibilitas Tinggi untuk Monitoring Lead Time Production Pengerjaan Mobil General Repair Bengkel Toyota.
        </p>
        <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-blue-400 mb-1">8 STALL</div>
            <div className="text-xs font-bold text-neutral-400">STALL GR AKTIF</div>
          </div>
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-amber-400 mb-1">45 MNT</div>
            <div className="text-xs font-bold text-neutral-400">RATA-RATA LEAD TIME</div>
          </div>
          <div className="bg-neutral-900 border border-white/10 rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-emerald-400 mb-1">100% OTD</div>
            <div className="text-xs font-bold text-neutral-400">ON TIME DELIVERY</div>
          </div>
        </div>
      </main>
      <footer className="relative w-full h-full overflow-hidden bg-gradient-to-r from-red-600 to-red-800 shadow-[0_-4px_15px_rgba(0,0,0,0.4)] z-10">
        <Ticker />
      </footer>
    </div>
  );
};

export default GRRoom;
