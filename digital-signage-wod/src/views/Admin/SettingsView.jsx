import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';

const SettingsView = () => {
  const [formData, setFormData] = useState({
    running_text_ticker: '',
    duration_media_sec: '60',
    duration_table_sec: '30',
    promo_video_type: 'youtube',
    promo_video_url: 'bzQFeVWCC9Y',
    enable_tts: '1',
    duration_popup_sec: '20',
    tts_speech_rate: '0.9',
    tts_template: 'Panggilan untuk pelanggan Toyota, Bapak atau Ibu {customer}, dengan nomor kendaraan {plate}, servis kendaraan Anda telah selesai dikerjakan. Terima kasih.',
  });

  // Promo Playlist Array State
  const [playlist, setPlaylist] = useState([
    {
      id: 'promo-1',
      title: 'Video Commercial Toyota',
      type: 'youtube',
      url: 'bzQFeVWCC9Y',
      duration_sec: 60,
    },
  ]);

  // New Item Form State
  const [newItem, setNewItem] = useState({
    title: '',
    type: 'image',
    url: '',
    duration_sec: 10,
  });

  const [waLogs, setWaLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'logs'

  const fileInputRef = useRef(null);
  const newItemFileInputRef = useRef(null);
  const activeApiUrlRef = useRef(import.meta.env.VITE_API_URL || 'http://localhost:8000/api');

  // Helper to extract metadata video duration from File
  const detectVideoDuration = async (file) => {
    if (!file || !file.type.startsWith('video/')) {
      return file?.type.startsWith('image/') ? 10 : 60;
    }
    return new Promise((resolve) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          URL.revokeObjectURL(video.src);
          const dur = Math.ceil(video.duration);
          resolve(dur > 0 ? dur : 60);
        };
        video.onerror = () => resolve(60);
      } catch (e) {
        resolve(60);
      }
    });
  };

  // Dynamic helper to resolve working API URL (with fallback to localhost:8000)
  const getWorkingApiUrl = async () => {
    const primary = activeApiUrlRef.current;
    try {
      await axios.get(`${primary}/v1/admin/settings`, { timeout: 3000 });
      return primary;
    } catch (err) {
      if (primary !== 'http://localhost:8000/api') {
        try {
          await axios.get(`http://localhost:8000/api/v1/admin/settings`, { timeout: 3000 });
          activeApiUrlRef.current = 'http://localhost:8000/api';
          return 'http://localhost:8000/api';
        } catch (localErr) { }
      }
      return primary;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const apiUrl = await getWorkingApiUrl();

    try {
      // Fetch Settings
      const settingsRes = await axios.get(`${apiUrl}/v1/admin/settings`);
      if (settingsRes.data && settingsRes.data.status === 'success') {
        const raw = settingsRes.data.data;
        
        let parsedPlaylist = [];
        if (raw.promo_playlist?.value) {
          try {
            parsedPlaylist = typeof raw.promo_playlist.value === 'string'
              ? JSON.parse(raw.promo_playlist.value)
              : raw.promo_playlist.value;
          } catch (e) {}
        }

        if (!Array.isArray(parsedPlaylist) || parsedPlaylist.length === 0) {
          parsedPlaylist = [
            {
              id: 'promo-1',
              title: 'Video Promo Toyota',
              type: raw.promo_video_type?.value || 'youtube',
              url: raw.promo_video_url?.value || 'bzQFeVWCC9Y',
              duration_sec: 60,
            },
          ];
        }

        setPlaylist(parsedPlaylist);

        setFormData({
          running_text_ticker: raw.running_text_ticker?.value || '',
          duration_media_sec: raw.duration_media_sec?.value || '60',
          duration_table_sec: raw.duration_table_sec?.value || '30',
          promo_video_type: raw.promo_video_type?.value || 'youtube',
          promo_video_url: raw.promo_video_url?.value || 'bzQFeVWCC9Y',
          enable_tts: raw.enable_tts?.value !== undefined ? String(raw.enable_tts.value) : '1',
          duration_popup_sec: raw.duration_popup_sec?.value || '12',
          tts_speech_rate: raw.tts_speech_rate?.value || '0.9',
          tts_template: raw.tts_template?.value || 'Panggilan untuk pelanggan Toyota, Bapak atau Ibu {customer}, dengan nomor kendaraan {plate}, servis kendaraan Anda telah selesai dikerjakan. Terima kasih.',
        });
      }

      // Fetch WA Logs
      const logsRes = await axios.get(`${apiUrl}/v1/admin/wa-logs`);
      if (logsRes.data && logsRes.data.status === 'success') {
        setWaLogs(logsRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload file for New Playlist Item (with auto video duration detection)
  const handleNewItemFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    // Auto detect video duration using HTML5 Video Metadata API
    const autoDuration = await detectVideoDuration(file);

    const apiUrl = await getWorkingApiUrl();
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const res = await axios.post(`${apiUrl}/v1/admin/upload-media`, uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data && res.data.status === 'success') {
        const { url, type } = res.data;
        setNewItem((prev) => ({
          ...prev,
          title: prev.title || file.name,
          type,
          url,
          duration_sec: autoDuration,
        }));
        setMessage({ 
          type: 'success', 
          text: `Media "${file.name}" berhasil diunggah! Durasi otomatis terdeteksi: ${autoDuration} Detik.` 
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal mengunggah file media.' });
    } finally {
      setUploading(false);
      if (newItemFileInputRef.current) newItemFileInputRef.current.value = '';
    }
  };

  // Add Item to Playlist
  const handleAddPlaylistItem = (e) => {
    e.preventDefault();
    if (!newItem.url || !newItem.title) {
      setMessage({ type: 'error', text: 'Mohon isi judul dan URL/Path media!' });
      return;
    }

    const item = {
      id: `item-${Date.now()}`,
      title: newItem.title,
      type: newItem.type,
      url: newItem.url,
      duration_sec: parseInt(newItem.duration_sec) || 10,
    };

    setPlaylist((prev) => [...prev, item]);
    setNewItem({ title: '', type: 'image', url: '', duration_sec: 10 });
    setMessage({ type: 'success', text: `Item "${item.title}" ditambahkan ke playlist dengan durasi ${item.duration_sec} detik!` });
  };

  // Remove Item from Playlist
  const handleRemovePlaylistItem = (id) => {
    setPlaylist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const apiUrl = await getWorkingApiUrl();

    // Prepare payload including JSON encoded playlist
    const payload = {
      ...formData,
      promo_playlist: JSON.stringify(playlist),
      promo_video_type: playlist[0]?.type || formData.promo_video_type,
      promo_video_url: playlist[0]?.url || formData.promo_video_url,
    };

    try {
      const res = await axios.put(`${apiUrl}/v1/admin/settings`, payload);
      if (res.data && res.data.status === 'success') {
        setMessage({ type: 'success', text: 'Pengaturan CMS & Playlist Promo berhasil disimpan!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan CMS. Pastikan koneksi ke server backend (API) berjalan dengan baik.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#DBE0EC] pb-4 mb-6 font-radio">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'settings'
                ? 'bg-toyota-red text-white shadow-2xs'
                : 'bg-[#F6F8FB] text-[#6C6C6C] border border-[#DBE0EC] hover:bg-gray-100 hover:text-[#000000]'
            }`}
          >
            ⚙️ Pengaturan Tampilan & Playlist
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-toyota-red text-white shadow-2xs'
                : 'bg-[#F6F8FB] text-[#6C6C6C] border border-[#DBE0EC] hover:bg-gray-100 hover:text-[#000000]'
            }`}
          >
            💬 Log Notifikasi WhatsApp
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-black">{waLogs.length}</span>
          </button>
        </div>

        <button
          onClick={fetchData}
          className="text-xs font-bold text-[#6C6C6C] hover:text-[#000000] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DBE0EC] bg-[#F6F8FB] hover:bg-white transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl mb-6 text-xs font-bold flex items-center justify-between font-radio ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-red-50 text-red-800 border border-red-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-lg font-black leading-none">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[#6C6C6C] font-bold font-radio">Memuat data CMS...</div>
      ) : activeTab === 'settings' ? (
        /* Settings Form */
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl font-radio">
          {/* Running Text */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-[#000000] tracking-wider">
              Running Text (Ticker bawah TV)
            </label>
            <textarea
              name="running_text_ticker"
              value={formData.running_text_ticker}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#DBE0EC] bg-[#F6F8FB] focus:bg-white focus:ring-2 focus:ring-toyota-red focus:border-toyota-red text-xs font-bold text-[#000000] transition-all"
              placeholder="Masukkan pengumuman running text..."
              required
            />
            <p className="text-xs font-semibold text-[#6C6C6C]">
              Gunakan pemisah tanda titik tiga atau karakter <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[#000000]">•</code> jika ingin menyatukan beberapa poin pengumuman sekaligus.
            </p>
          </div>

          {/* Durasi Display Rotasi View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-[#000000] tracking-wider">
                Durasi Rotasi View 1 (Media & Kartu Status)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="duration_media_sec"
                  value={formData.duration_media_sec}
                  onChange={handleChange}
                  min="10"
                  max="600"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DBE0EC] bg-[#F6F8FB] focus:bg-white focus:ring-2 focus:ring-toyota-red focus:border-toyota-red text-sm font-black text-[#000000]"
                  required
                />
                <span className="text-xs font-extrabold text-[#6C6C6C] uppercase">Detik</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black uppercase text-[#000000] tracking-wider">
                Durasi Rotasi View 2 (Tabel Utama Proses)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="duration_table_sec"
                  value={formData.duration_table_sec}
                  onChange={handleChange}
                  min="10"
                  max="600"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DBE0EC] bg-[#F6F8FB] focus:bg-white focus:ring-2 focus:ring-toyota-red focus:border-toyota-red text-sm font-black text-[#000000]"
                  required
                />
                <span className="text-xs font-extrabold text-[#6C6C6C] uppercase">Detik</span>
              </div>
            </div>
          </div>

          {/* SECTION: TTS Voice & Callout Alert Settings */}
          <div className="pt-4 border-t border-[#DBE0EC] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-[#000000] tracking-wider">📢 Pengaturan Suara TTS & Pop-Up Panggilan</h3>
              <span className="text-xs font-extrabold text-[#000000] bg-gradient-accent border border-[#DBE0EC] px-3 py-1 rounded-full shadow-2xs">
                Voice & Modal Callout
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-black text-[#000000] uppercase tracking-wider">Status Suara TTS</label>
                <select
                  name="enable_tts"
                  value={formData.enable_tts}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DBE0EC] bg-[#F6F8FB] focus:bg-white focus:ring-2 focus:ring-toyota-red focus:border-toyota-red text-xs font-extrabold text-[#000000]"
                >
                  <option value="1">🔊 AKTIF (Putar Suara Panggilan)</option>
                  <option value="0">🔇 NONAKTIF (Hanya Pop-up Visual)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-[#000000] uppercase tracking-wider">Durasi Tampil Pop-Up</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    name="duration_popup_sec"
                    value={formData.duration_popup_sec}
                    onChange={handleChange}
                    min="3"
                    max="60"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#DBE0EC] bg-[#F6F8FB] focus:bg-white focus:ring-2 focus:ring-toyota-red focus:border-toyota-red text-sm font-black text-[#000000]"
                    required
                  />
                  <span className="text-xs font-extrabold text-[#6C6C6C] uppercase">Detik</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-[#000000] uppercase tracking-wider">Kecepatan Suara TTS</label>
                <select
                  name="tts_speech_rate"
                  value={formData.tts_speech_rate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DBE0EC] bg-[#F6F8FB] focus:bg-white focus:ring-2 focus:ring-toyota-red focus:border-toyota-red text-xs font-extrabold text-[#000000]"
                >
                  <option value="0.7">0.7x (Agak Lambat / Jelas)</option>
                  <option value="0.8">0.8x (Lambat Standar)</option>
                  <option value="0.9">0.9x (Rekomendasi Toyota)</option>
                  <option value="1.0">1.0x (Kecepatan Normal)</option>
                  <option value="1.1">1.1x (Agak Cepat)</option>
                </select>
              </div>
            </div>

            {/* Template TTS */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-black uppercase text-[#000000] tracking-wider">
                Template Kalimat Panggilan Suara TTS
              </label>
              <textarea
                name="tts_template"
                value={formData.tts_template}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#DBE0EC] bg-[#F6F8FB] focus:bg-white focus:ring-2 focus:ring-toyota-red focus:border-toyota-red text-xs font-bold text-[#000000] transition-all"
                placeholder="Panggilan untuk pelanggan Toyota, Bapak atau Ibu {customer}, dengan nomor kendaraan {plate}..."
                required
              />
              <p className="text-xs font-semibold text-[#6C6C6C]">
                Gunakan variabel <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[#000000]">{'{customer}'}</code> untuk nama pelanggan dan <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-[#000000]">{'{plate}'}</code> untuk plat nomor kendaraan.
              </p>
            </div>
          </div>

          {/* SECTION: PLAYLIST MEDIA PROMO MULTI-ITEM */}
          <div className="pt-4 border-t border-[#DBE0EC] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-[#000000] tracking-wider">🎬 Daftar Playlist Media Promo (Multi-Item)</h3>
                <p className="text-xs font-semibold text-[#6C6C6C] mt-0.5">Kelola daftar foto (.jpg/.png) & video (MP4/YouTube) yang diputar bergantian pada layar TV.</p>
              </div>
              <span className="text-xs font-extrabold text-[#000000] bg-gradient-accent border border-[#DBE0EC] px-3 py-1 rounded-full shadow-2xs">
                {playlist.length} Media Terdaftar
              </span>
            </div>

            {/* Current Playlist Items Datatable */}
            <div className="overflow-x-auto rounded-2xl border border-[#DBE0EC] bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F6F8FB] text-[#000000] text-xs font-black tracking-wider border-b border-[#DBE0EC]">
                    <th className="py-3 px-4 w-[8%] text-center">#</th>
                    <th className="py-3 px-4 w-[25%]">JUDUL MEDIA</th>
                    <th className="py-3 px-4 w-[15%] text-center">TIPE MEDIA</th>
                    <th className="py-3 px-4 w-[32%]">URL / PATH FILE</th>
                    <th className="py-3 px-4 w-[12%] text-center">DURASI TAMPIL</th>
                    <th className="py-3 px-4 w-[8%] text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DBE0EC]">
                  {playlist.length > 0 ? (
                    playlist.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-[#F6F8FB] transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-[#6C6C6C]">{idx + 1}</td>
                        <td className="py-3 px-4 font-black text-[#000000] uppercase tracking-wide">{item.title}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              item.type === 'youtube'
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : item.type === 'image' || item.type === 'foto'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6C6C6C] font-mono font-bold truncate max-w-xs">{item.url}</td>
                        <td className="py-3 px-4 text-center font-black text-[#000000]">{item.duration_sec} Detik</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemovePlaylistItem(item.id)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-600 hover:text-white text-red-700 font-bold rounded-lg border border-red-200 transition-colors text-xs"
                            title="Hapus dari Playlist"
                          >
                            🗑️ Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-[#6C6C6C] font-semibold italic">
                        Belum ada media di playlist. Silakan tambahkan media di bawah.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* FORM TAMBAH ITEM PLAYLIST BARU */}
            <div className="p-4 bg-[#F6F8FB] border border-[#DBE0EC] rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-[#000000] uppercase tracking-wide">➕ Tambah Media Baru ke Playlist</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={newItemFileInputRef}
                    onChange={handleNewItemFileUpload}
                    accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => newItemFileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-2xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {uploading ? 'Mengunggah...' : '📁 Upload File dari Laptop'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[11px] font-black uppercase text-[#000000]">Judul / Nama Media</label>
                  <input
                    type="text"
                    value={newItem.title}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Contoh: Video Commercial Innova"
                    className="w-full px-3 py-2 rounded-xl border border-[#DBE0EC] bg-white text-xs font-bold text-[#000000]"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[11px] font-black uppercase text-[#000000]">Tipe Media</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem((prev) => ({
                      ...prev,
                      type: e.target.value,
                      duration_sec: e.target.value === 'image' ? 10 : 60,
                    }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#DBE0EC] bg-white text-xs font-bold text-[#000000]"
                  >
                    <option value="image">🖼️ Foto / Gambar (.jpg, .png)</option>
                    <option value="mp4">🎬 Direct Video MP4 (.mp4)</option>
                    <option value="youtube">🎥 YouTube Video (ID / Link)</option>
                  </select>
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[11px] font-black uppercase text-[#000000]">URL / Path File</label>
                  <input
                    type="text"
                    value={newItem.url}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, url: e.target.value }))}
                    placeholder="/storage/media/file.mp4"
                    className="w-full px-3 py-2 rounded-xl border border-[#DBE0EC] bg-white text-xs font-medium text-[#000000]"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[11px] font-black uppercase text-[#000000]">
                    Durasi Tampil (Detik) {newItem.type === 'mp4' && <span className="text-emerald-700 font-extrabold">(Auto Detect Video)</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newItem.duration_sec}
                      onChange={(e) => setNewItem((prev) => ({ ...prev, duration_sec: e.target.value }))}
                      min="3"
                      max="600"
                      className="w-full px-3 py-2 rounded-xl border border-[#DBE0EC] bg-white text-xs font-black text-[#000000]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPlaylistItem}
                      className="px-3.5 py-2 bg-toyota-red hover:bg-toyota-red-dark text-white rounded-xl font-black text-xs uppercase tracking-wider shrink-0 transition-all shadow-2xs"
                    >
                      ➕ Tambah
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-[#DBE0EC]">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 bg-toyota-red hover:bg-toyota-red-dark text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-2xs disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Menyimpan...' : '💾 Simpan Konfigurasi CMS & Playlist'}
            </button>
          </div>
        </form>
      ) : (
        /* WA Logs Datatable */
        <div className="space-y-4 font-radio">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#000000] tracking-wider">Log Riwayat Notifikasi WA</h3>
            <span className="text-xs font-bold text-[#6C6C6C]">Menampilkan hingga 100 log terbaru</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#DBE0EC] bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F6F8FB] text-[#000000] text-xs font-black tracking-wider border-b border-[#DBE0EC]">
                  <th className="py-3 px-4 border-b border-[#DBE0EC]">WAKTU</th>
                  <th className="py-3 px-4 border-b border-[#DBE0EC]">NO POLISI</th>
                  <th className="py-3 px-4 border-b border-[#DBE0EC]">NAMA PELANGGAN</th>
                  <th className="py-3 px-4 text-center border-b border-[#DBE0EC]">STATUS WA</th>
                  <th className="py-3 px-4 border-b border-[#DBE0EC]">PAYLOAD / PESAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE0EC]">
                {waLogs.length > 0 ? (
                  waLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F6F8FB] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#6C6C6C] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-black text-[#000000] tracking-wider">{log.plate_number}</td>
                      <td className="py-3 px-4 font-extrabold text-[#000000] uppercase">{log.customer_name}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border ${
                            log.status === 'SENT'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : log.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6C6C6C] font-semibold truncate max-w-md">
                        {log.response_payload?.message || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-[#6C6C6C] font-semibold italic">
                      Belum ada log notifikasi WhatsApp yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SettingsView;
