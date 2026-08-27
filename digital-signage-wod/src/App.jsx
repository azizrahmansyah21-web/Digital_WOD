import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RuangTungguContainer from './views/RuangTunggu/RuangTungguContainer';
import MeetingRoom from './views/MeetingRoom';
import GRRoom from './views/GRRoom';
import SettingsView from './views/Admin/SettingsView';

function App() {
  return (
    <div className="w-full min-h-screen bg-slate-100 flex flex-col">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/ruang-tunggu" replace />} />
          <Route path="/ruang-tunggu" element={<RuangTungguContainer />} />
          <Route path="/ruang-meeting" element={<MeetingRoom />} />
          <Route path="/ruang-gr" element={<GRRoom />} />
          <Route path="/admin" element={<Navigate to="/admin/settings" replace />} />
          <Route path="/admin/settings" element={<SettingsView />} />
          <Route path="/admin/wa-logs" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/ruang-tunggu" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
