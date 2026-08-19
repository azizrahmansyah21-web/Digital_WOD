import React from 'react';
import MainTable from '../../components/MainTable';
import Ticker from '../../components/Ticker';

const ViewProses = ({ vehicles = [], inProgressVehicles = [] }) => {
  return (
    <div className="grid grid-cols-1 grid-rows-[calc(100vh-72px)_72px] w-screen h-screen overflow-hidden bg-white">
      {/* Main Table Full Screen */}
      <main className="relative w-full h-full overflow-hidden">
        <MainTable vehicles={vehicles} inProgressVehicles={inProgressVehicles} />
      </main>

      {/* Footer Ticker */}
      <footer className="relative w-full h-full overflow-hidden z-10">
        <Ticker />
      </footer>
    </div>
  );
};

export default ViewProses;
