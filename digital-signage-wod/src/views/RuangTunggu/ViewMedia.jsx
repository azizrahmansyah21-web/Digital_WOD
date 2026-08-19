import React from 'react';
import CardStatus from '../../components/CardStatus';
import MediaPromo from '../../components/MediaPromo';
import Ticker from '../../components/Ticker';

const ViewMedia = ({ waitingVehicles = [], completedVehicles = [], tomorrowVehicles = [] }) => {
  return (
    <div className="grid grid-cols-[30%_70%] grid-rows-[calc(100vh-72px)_72px] w-screen h-screen overflow-hidden bg-white">
      {/* Area Kiri (30%): Card Status Antrean Ringkas */}
      <aside className="col-start-1 col-end-2 row-start-1 row-end-2 relative w-full h-full overflow-hidden border-r border-gray-200">
        <CardStatus 
          waitingVehicles={waitingVehicles} 
          completedVehicles={completedVehicles}
          tomorrowVehicles={tomorrowVehicles}
        />
      </aside>

      {/* Area Kanan (70%): Pemutar Video Promo */}
      <main className="col-start-2 col-end-3 row-start-1 row-end-2 relative w-full h-full overflow-hidden bg-gray-50">
        <MediaPromo />
      </main>

      {/* Area Bawah: Running Text Footer Ticker */}
      <footer className="col-start-1 col-end-3 row-start-2 row-end-3 relative w-full h-full overflow-hidden z-10">
        <Ticker />
      </footer>
    </div>
  );
};

export default ViewMedia;
