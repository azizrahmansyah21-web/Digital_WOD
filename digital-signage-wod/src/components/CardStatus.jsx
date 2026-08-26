import React from 'react';
import PlateNumber from './PlateNumber';

const CardStatus = ({ waitingVehicles = [], completedVehicles = [], tomorrowVehicles = [] }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between gap-3 p-3.5 bg-white text-[#000000] overflow-hidden font-radio">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#DBE0EC] shrink-0">
        <div>
          <h2 className="text-base font-extrabold tracking-wide text-[#000000] uppercase leading-tight">STATUS ANTREAN</h2>
          <p className="text-xs font-semibold text-[#6C6C6C] mt-0.5">Ruang Tunggu Pelanggan Toyota</p>
        </div>
        <span className="text-[11px] font-extrabold px-3 py-1 bg-gradient-accent text-[#000000] rounded-full border border-[#DBE0EC] tracking-wider animate-pulse shrink-0">
          LIVE
        </span>
      </div>

      {/* Section 1: Selesai Dikerjakan (1/3 height) */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0 bg-[#F6F8FB] p-2.5 rounded-xl border border-[#DBE0EC]">
        <div className="flex items-center justify-between bg-emerald-600 text-white px-3 py-1.5 rounded-lg shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">✅</span>
            <h3 className="text-xs font-extrabold tracking-wider uppercase">SELESAI DIKERJAKAN</h3>
          </div>
          <span className="text-xs font-black px-2 py-0.5 bg-white text-emerald-800 rounded-full">
            {completedVehicles.length}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
          {completedVehicles.length > 0 ? (
            completedVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-white border border-[#DBE0EC] rounded-lg shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PlateNumber plate={item.plate} className="text-xs px-2 py-0.5 w-[115px] shrink-0" />
                  <span className="text-xs font-bold text-[#000000] truncate uppercase">{item.customer}</span>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                  SIAP
                </span>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#6C6C6C] italic">
              Belum ada kendaraan selesai
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Menunggu Dikerjakan (1/3 height) */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0 bg-[#F6F8FB] p-2.5 rounded-xl border border-[#DBE0EC]">
        <div className="flex items-center justify-between bg-amber-500 text-white px-3 py-1.5 rounded-lg shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></span>
            <h3 className="text-xs font-extrabold tracking-wider uppercase">MENUNGGU DIKERJAKAN</h3>
          </div>
          <span className="text-xs font-black px-2 py-0.5 bg-white text-amber-800 rounded-full">
            {waitingVehicles.length}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
          {waitingVehicles.length > 0 ? (
            waitingVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-white border border-[#DBE0EC] rounded-lg shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PlateNumber plate={item.plate} className="text-xs px-2 py-0.5 w-[115px] shrink-0" />
                  <span className="text-xs font-bold text-[#000000] truncate uppercase">{item.customer}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#6C6C6C] italic">
              Belum ada antrean menunggu
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Perbaikan Dilanjut Besok (1/3 height) */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0 bg-[#F6F8FB] p-2.5 rounded-xl border border-[#DBE0EC]">
        <div className="flex items-center justify-between bg-indigo-600 text-white px-3 py-1.5 rounded-lg shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs"></span>
            <h3 className="text-xs font-extrabold tracking-wider uppercase">DILANJUT BESOK</h3>
          </div>
          <span className="text-xs font-black px-2 py-0.5 bg-white text-indigo-800 rounded-full">
            {tomorrowVehicles.length}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
          {tomorrowVehicles.length > 0 ? (
            tomorrowVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-white border border-[#DBE0EC] rounded-lg shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PlateNumber plate={item.plate} className="text-xs px-2 py-0.5 w-[115px] shrink-0" />
                  <span className="text-xs font-bold text-[#000000] truncate uppercase">{item.customer}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#6C6C6C] italic">
              Tidak ada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardStatus;
