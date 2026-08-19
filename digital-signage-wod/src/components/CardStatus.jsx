import React from 'react';
import PlateNumber from './PlateNumber';

const CardStatus = ({ waitingVehicles = [], completedVehicles = [], tomorrowVehicles = [] }) => {
  return (
    <div className="w-full h-full flex flex-col gap-4 p-5 bg-white text-gray-900 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-cyan-600 shrink-0">
        <div>
          <h2 className="text-xl tracking-wide text-gray-900 uppercase font-black">STATUS ANTREAN</h2>
          <p className="text-sm text-gray-500">Ruang Tunggu Pelanggan Toyota</p>
        </div>
        <span className="text-xs px-3 py-1.5 bg-cyan-600 text-white rounded-full tracking-wider animate-pulse">
          LIVE
        </span>
      </div>

      {/* Section 1 (PRIORITY): Selesai Dikerjakan */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        <div className="flex items-center justify-between bg-emerald-600 text-white p-3 rounded-lg shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <h3 className="text-base tracking-wider uppercase font-black">SELESAI DIKERJAKAN</h3>
          </div>
          <span className="text-base px-3 py-0.5 bg-white text-emerald-700 rounded-full font-black">
            {completedVehicles.length}
          </span>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pt-1">
          {completedVehicles.length > 0 ? (
            completedVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlateNumber plate={item.plate} className="text-lg px-3 py-1 w-[140px]" />
                  <span className="text-lg text-gray-800 truncate uppercase font-bold">{item.customer}</span>
                </div>
                <span className="text-xs text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full shrink-0 border border-emerald-200">
                  SIAP
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-400 bg-gray-50 rounded-lg border border-gray-100 italic">
              Belum ada kendaraan selesai
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Menunggu Dikerjakan */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></span>
            <h3 className="text-sm text-gray-800 tracking-wider">MENUNGGU DIKERJAKAN</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full">
            {waitingVehicles.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {waitingVehicles.length > 0 ? (
            waitingVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-100 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlateNumber plate={item.plate} className="text-sm px-2.5 py-0.5 w-[110px]" />
                  <span className="text-sm text-gray-800 truncate uppercase">{item.customer}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-gray-100 italic">
              Belum ada antrean menunggu
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Perbaikan Dilanjut Besok */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm"></span>
            <h3 className="text-sm text-gray-800 tracking-wider">DILANJUT BESOK</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
            {tomorrowVehicles.length}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {tomorrowVehicles.length > 0 ? (
            tomorrowVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PlateNumber plate={item.plate} className="text-sm px-2.5 py-0.5 w-[110px]" />
                  <span className="text-sm text-gray-800 truncate uppercase">{item.customer}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-gray-100 italic">
              Tidak ada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardStatus;
