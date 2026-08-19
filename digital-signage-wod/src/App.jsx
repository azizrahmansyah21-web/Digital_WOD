import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RuangTungguContainer from './views/RuangTunggu/RuangTungguContainer';
import MeetingRoom from './views/MeetingRoom';
import GRRoom from './views/GRRoom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/ruang-tunggu" replace />} />
        <Route path="/ruang-tunggu" element={<RuangTungguContainer />} />
        <Route path="/ruang-meeting" element={<MeetingRoom />} />
        <Route path="/ruang-gr" element={<GRRoom />} />
        <Route path="*" element={<Navigate to="/ruang-tunggu" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
