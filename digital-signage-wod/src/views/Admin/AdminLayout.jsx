import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Pengaturan CMS', path: '/admin/settings', icon: '⚙️' },
    { label: 'Log WhatsApp', path: '/admin/wa-logs', icon: '💬' },
    { label: 'Layar WOD TV', path: '/ruang-tunggu', icon: '📺', external: false },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#000000] flex flex-col select-text font-radio">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#DBE0EC] px-6 py-3.5 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <img src="/logo-lgb.png" alt="Agung Toyota Logo" className="h-10 w-auto object-contain drop-shadow-2xs" />
          <div className="h-7 w-px bg-[#DBE0EC]"></div>
          <div>
            <h1 className="text-lg font-black text-[#000000] tracking-wide uppercase leading-tight">CMS Admin Dashboard</h1>
            <p className="text-xs font-semibold text-[#6C6C6C] uppercase tracking-wider">Digital Signage System & Operational Display (WOD)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-[#000000] bg-gradient-accent border border-[#DBE0EC] px-3.5 py-1.5 rounded-full shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse-dot"></span>
            SERVER LOKAL AKTIF
          </span>
          <Link
            to="/ruang-tunggu"
            target="_blank"
            className="px-4 py-1.5 bg-toyota-red hover:bg-toyota-red-dark text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <span>📺</span> Buka Display TV
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white border border-[#DBE0EC] rounded-2xl p-4 shadow-2xs shrink-0 self-start">
          <h2 className="text-xs font-black uppercase text-[#6C6C6C] tracking-widest px-3 mb-3">Navigasi Utama</h2>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-toyota-red text-white font-extrabold shadow-2xs'
                      : 'text-[#6C6C6C] hover:bg-[#F6F8FB] hover:text-[#000000]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-white border border-[#DBE0EC] rounded-2xl p-6 shadow-2xs">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
