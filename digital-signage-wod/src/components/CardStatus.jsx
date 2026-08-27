import React, { useEffect, useRef } from 'react';
import PlateNumber from './PlateNumber';

const AutoScrollList = ({ children, className = '' }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isPaused = false;

    const interval = setInterval(() => {
      if (!isPaused && el.scrollHeight > el.clientHeight) {
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          el.scrollTop = 0;
        } else {
          el.scrollTop += 1;
        }
      }
    }, 60);

    const onMouseEnter = () => { isPaused = true; };
    const onMouseLeave = () => { isPaused = false; };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      clearInterval(interval);
      el.removeEventListener('mouseenter', onMouseEnter);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <div ref={scrollRef} className={className}>
      {children}
    </div>
  );
};

const CardStatus = ({ waitingVehicles = [], completedVehicles = [], tomorrowVehicles = [] }) => {
  return (
    <div className="w-full h-full flex flex-col justify-between gap-2 p-2.5 bg-white text-[#000000] overflow-hidden font-radio">
      {/* Compact Header Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#DBE0EC] shrink-0">
        <div>
          <h2 className="text-sm font-black tracking-wide text-[#000000] uppercase leading-tight">STATUS ANTREAN</h2>
          <p className="text-[10px] font-bold text-[#6C6C6C] mt-0.5">Ruang Tunggu Pelanggan Toyota</p>
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 bg-gradient-accent text-[#000000] rounded-full border border-[#DBE0EC] tracking-wider animate-pulse shrink-0">
          LIVE
        </span>
      </div>

      {/* Section 1: Selesai Dikerjakan */}
      <div className="flex flex-col gap-1 flex-1 min-h-0 bg-[#F6F8FB] p-2 rounded-xl border border-[#DBE0EC]">
        <div className="flex items-center justify-between bg-emerald-600 text-white px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">✅</span>
            <h3 className="text-[11px] font-black tracking-wider uppercase">SELESAI DIKERJAKAN</h3>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.2 bg-white text-emerald-800 rounded-full">
            {completedVehicles.length}
          </span>
        </div>

        <AutoScrollList className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-0.5 scrollbar-thin">
          {completedVehicles.length > 0 ? (
            completedVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 bg-white border border-[#DBE0EC] rounded-lg shadow-2xs shrink-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <PlateNumber plate={item.plate} className="text-[10px] px-1.5 py-0.5 w-[95px] shrink-0" />
                  <span className="text-[11px] font-black text-[#000000] truncate uppercase">{item.customer}</span>
                </div>
                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0 border border-emerald-200">
                  SIAP
                </span>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-[11px] text-[#6C6C6C] italic py-2">
              Belum ada kendaraan selesai
            </div>
          )}
        </AutoScrollList>
      </div>

      {/* Section 2: Menunggu Dikerjakan */}
      <div className="flex flex-col gap-1 flex-1 min-h-0 bg-[#F6F8FB] p-2 rounded-xl border border-[#DBE0EC]">
        <div className="flex items-center justify-between bg-amber-500 text-white px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white shadow-2xs"></span>
            <h3 className="text-[11px] font-black tracking-wider uppercase">MENUNGGU DIKERJAKAN</h3>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.2 bg-white text-amber-800 rounded-full">
            {waitingVehicles.length}
          </span>
        </div>

        <AutoScrollList className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-0.5 scrollbar-thin">
          {waitingVehicles.length > 0 ? (
            waitingVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 bg-white border border-[#DBE0EC] rounded-lg shadow-2xs shrink-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <PlateNumber plate={item.plate} className="text-[10px] px-1.5 py-0.5 w-[95px] shrink-0" />
                  <span className="text-[11px] font-black text-[#000000] truncate uppercase">{item.customer}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-[11px] text-[#6C6C6C] italic py-2">
              Belum ada antrean menunggu
            </div>
          )}
        </AutoScrollList>
      </div>

      {/* Section 3: Perbaikan Dilanjut Besok */}
      <div className="flex flex-col gap-1 flex-1 min-h-0 bg-[#F6F8FB] p-2 rounded-xl border border-[#DBE0EC]">
        <div className="flex items-center justify-between bg-indigo-600 text-white px-2.5 py-1 rounded-lg shrink-0 shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white shadow-2xs"></span>
            <h3 className="text-[11px] font-black tracking-wider uppercase">DILANJUT BESOK</h3>
          </div>
          <span className="text-[10px] font-black px-1.5 py-0.2 bg-white text-indigo-800 rounded-full">
            {tomorrowVehicles.length}
          </span>
        </div>

        <AutoScrollList className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-0.5 scrollbar-thin">
          {tomorrowVehicles.length > 0 ? (
            tomorrowVehicles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 bg-white border border-[#DBE0EC] rounded-lg shadow-2xs shrink-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <PlateNumber plate={item.plate} className="text-[10px] px-1.5 py-0.5 w-[95px] shrink-0" />
                  <span className="text-[11px] font-black text-[#000000] truncate uppercase">{item.customer}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-[11px] text-[#6C6C6C] italic py-2">
              Tidak ada
            </div>
          )}
        </AutoScrollList>
      </div>
    </div>
  );
};

export default CardStatus;
