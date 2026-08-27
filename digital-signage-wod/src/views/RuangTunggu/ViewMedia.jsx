import React from 'react';
import CardStatus from '../../components/CardStatus';
import MediaPromo from '../../components/MediaPromo';
import Ticker from '../../components/Ticker';

const ViewMedia = ({ 
  waitingVehicles = [], 
  completedVehicles = [], 
  tomorrowVehicles = [],
  runningText = '',
  videoType = 'youtube',
  videoUrl = 'bzQFeVWCC9Y',
  promoPlaylist = []
}) => {
  return (
    <div className="grid grid-cols-[28%_72%] grid-rows-[calc(100vh-64px)_64px] w-screen h-screen overflow-hidden bg-white">
      {/* Area Kiri (28%): Card Status Antrean Ringkas */}
      <aside className="col-start-1 col-end-2 row-start-1 row-end-2 relative w-full h-full overflow-hidden border-r border-[#DBE0EC]">
        <CardStatus 
          waitingVehicles={waitingVehicles} 
          completedVehicles={completedVehicles}
          tomorrowVehicles={tomorrowVehicles}
        />
      </aside>

      {/* Area Kanan (72%): Pemutar Video Promo */}
      <main className="col-start-2 col-end-3 row-start-1 row-end-2 relative w-full h-full overflow-hidden bg-[#F6F8FB]">
        <MediaPromo videoType={videoType} videoUrl={videoUrl} playlist={promoPlaylist} />
      </main>

      {/* Area Bawah: Running Text Footer Ticker */}
      <footer className="col-start-1 col-end-3 row-start-2 row-end-3 relative w-full h-full overflow-hidden z-10 border-t border-[#DBE0EC]">
        <Ticker text={runningText} />
      </footer>
    </div>
  );
};

export default ViewMedia;
