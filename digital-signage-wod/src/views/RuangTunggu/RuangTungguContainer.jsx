import React, { useState, useEffect, useRef } from 'react';
import ViewMedia from './ViewMedia';
import ViewProses from './ViewProses';
import CalloutAlert from '../../components/CalloutAlert';
import axios from 'axios';

const RuangTungguContainer = () => {
  // Current active view: 'media' or 'proses'
  const [currentView, setCurrentView] = useState('media');
  const [vehicles, setVehicles] = useState([]);
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('-');
  const [calloutVehicle, setCalloutVehicle] = useState(null);

  // Dynamic CMS Settings State
  const [cmsSettings, setCmsSettings] = useState({
    duration_media_sec: 60,
    duration_table_sec: 30,
    running_text_ticker: '',
    promo_video_type: 'youtube',
    promo_video_url: 'bzQFeVWCC9Y',
    promo_playlist: [],
    enable_tts: '1',
    duration_popup_sec: 12,
    tts_speech_rate: '0.9',
    tts_template: 'Panggilan untuk pelanggan Toyota, Bapak atau Ibu {customer}, dengan nomor kendaraan {plate}, servis kendaraan Anda telah selesai dikerjakan. Terima kasih.',
  });

  // Anti-Spam state for Text-to-Speech voice callouts & fast settings cache
  const spokenPlatesRef = useRef(new Set());
  const activeApiUrlRef = useRef(import.meta.env.VITE_API_URL || 'http://localhost:8000/api');
  const lastSettingsHashRef = useRef('');

  // 1. Fetch Dynamic CMS Settings (Ultra-lightweight polling with zero DB load & zero pre-flight overhead)
  useEffect(() => {
    const fetchSettings = async () => {
      const apiUrl = activeApiUrlRef.current;
      try {
        const res = await axios.get(`${apiUrl}/v1/display/settings`, { timeout: 4000 });
        if (res.data && res.data.status === 'success' && res.data.data) {
          const rawData = res.data.data;
          const currentHash = JSON.stringify(rawData);

          // Skip React re-renders if settings content hasn't changed!
          if (lastSettingsHashRef.current === currentHash) {
            return;
          }
          lastSettingsHashRef.current = currentHash;

          let playlistData = [];
          if (rawData.promo_playlist) {
            try {
              playlistData = typeof rawData.promo_playlist === 'string'
                ? JSON.parse(rawData.promo_playlist)
                : rawData.promo_playlist;
            } catch (e) { }
          }

          setCmsSettings((prev) => ({
            ...prev,
            ...rawData,
            promo_playlist: Array.isArray(playlistData) ? playlistData : [],
            duration_media_sec: parseInt(rawData.duration_media_sec) || 60,
            duration_table_sec: parseInt(rawData.duration_table_sec) || 30,
            duration_popup_sec: parseInt(rawData.duration_popup_sec) || 12,
          }));
        }
      } catch (err) {
        // Fallback: If primary API failed, attempt fallback to localhost:8000
        if (activeApiUrlRef.current !== 'http://localhost:8000/api') {
          activeApiUrlRef.current = 'http://localhost:8000/api';
        }
      }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 5000); // Polling settings every 5s with zero server load
    return () => clearInterval(interval);
  }, []);

  // 2. Auto-Carousel View Switcher (Reactive to CMS Settings)
  useEffect(() => {
    let timer;
    const mediaDuration = (cmsSettings.duration_media_sec || 60) * 1000;
    const tableDuration = (cmsSettings.duration_table_sec || 30) * 1000;

    if (currentView === 'media') {
      timer = setTimeout(() => {
        setCurrentView('proses');
      }, mediaDuration);
    } else {
      timer = setTimeout(() => {
        setCurrentView('media');
      }, tableDuration);
    }

    return () => clearTimeout(timer);
  }, [currentView, cmsSettings]);

  // 3. Data Polling Interval (Fetch queue data every 5s)
  useEffect(() => {
    const fetchData = async () => {
      const apiUrl = activeApiUrlRef.current;

      // Step A: Attempt fetching cached JSON from API v1
      try {
        const response = await axios.get(`${apiUrl}/v1/display/queues`, { timeout: 4000 });
        if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
          setVehicles(response.data.data);
          setIsLiveSource(true);
          setLastUpdated(new Date().toLocaleTimeString('id-ID'));
          return;
        }
      } catch (err) {
        // Fallback to legacy endpoint if v1 fails
      }

      // Step B: Legacy /antrean endpoint
      try {
        const legacyRes = await axios.get(`${apiUrl}/antrean`, { timeout: 4000 });
        if (legacyRes.data && Array.isArray(legacyRes.data)) {
          setVehicles(legacyRes.data);
          setIsLiveSource(true);
          setLastUpdated(new Date().toLocaleTimeString('id-ID'));
          return;
        }
      } catch (err) {
        // Fallthrough to Vite Proxy parsing
      }

      // Step C: HTML DOM Parsing from 172.16.3.30 via Vite Proxy
      try {
        const proxyRes = await axios.get('/wod-proxy/service/public/display/ruang-tunggu/ubta', { timeout: 15000 });
        if (proxyRes.data && typeof proxyRes.data === 'string') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(proxyRes.data, 'text/html');
          const parsedList = [];

          const tableRows = doc.querySelectorAll('table tbody tr');
          tableRows.forEach((tr, index) => {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 6) {
              const plateSpan = tds[0].querySelector('span');
              const plate = (plateSpan ? plateSpan.textContent : tds[0].textContent).trim();
              const customer = tds[1].textContent.trim();
              const startTime = tds[2].textContent.trim();
              const estTime = tds[3].textContent.trim();

              const statusSpan = tds[4].querySelector('span');
              let status = statusSpan ? statusSpan.textContent.trim() : tds[4].textContent.trim();
              status = status.replace(/\s+/g, ' ').trim();

              const advisor = tds[5].textContent.trim();

              if (plate && customer && plate.length >= 3) {
                parsedList.push({
                  id: `tbl-${index + 1}`,
                  plate,
                  customer,
                  model: '',
                  status: status.toUpperCase(),
                  startTime,
                  estTime,
                  advisor,
                });
              }
            }
          });

          setVehicles(parsedList);
          setIsLiveSource(true);
          setLastUpdated(new Date().toLocaleTimeString('id-ID'));
        }
      } catch (proxyErr) {
        // Network offline
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling queue data every 5s

    return () => clearInterval(interval);
  }, []);

  // Audio Context & Media unlocker for browser autoplay policies
  useEffect(() => {
    const unlockAudioContext = () => {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch (e) { }
      }
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          ctx.resume().then(() => ctx.close());
        }
      } catch (e) {}
    };

    window.addEventListener('keydown', unlockAudioContext, { once: true });
    window.addEventListener('click', unlockAudioContext, { once: true });

    return () => {
      window.removeEventListener('keydown', unlockAudioContext);
      window.removeEventListener('click', unlockAudioContext);
    };
  }, []);

  // Text-to-Speech (TTS) Voice Callout for "SELESAI DIKERJAKAN"
  useEffect(() => {
    const completed = vehicles.filter(
      (v) => v.status && v.status.includes('SELESAI')
    );

    const popupTimeoutMs = (cmsSettings.duration_popup_sec || 12) * 1000;

    completed.forEach((v) => {
      if (!spokenPlatesRef.current.has(v.plate)) {
        spokenPlatesRef.current.add(v.plate);

        setCalloutVehicle(v);
        setTimeout(() => {
          setCalloutVehicle(null);
        }, popupTimeoutMs);
      }
    });
  }, [vehicles, cmsSettings.duration_popup_sec]);

  // Filtered Vehicle Lists
  const waitingVehicles = vehicles.filter(
    (v) => v.status && v.status.includes('MENUNGGU')
  );
  const completedVehicles = vehicles.filter(
    (v) => v.status && v.status.includes('SELESAI')
  );
  const inProgressVehicles = vehicles.filter(
    (v) =>
      v.status &&
      (v.status.includes('PROSES') ||
        v.status.includes('CUCI') ||
        v.status.includes('PEMBERSIHAN'))
  );
  const tomorrowVehicles = vehicles.filter(
    (v) => v.status && (v.status.includes('BESOK') || v.status.includes('DILANJUT'))
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-slate-100 flex flex-col">
      {/* Debug Toolbar & Quick Action Buttons */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-white/95 border border-gray-200 px-3 py-1 rounded-full text-xs shadow-sm select-none font-radio">
        <span className="flex items-center gap-1.5 font-bold text-[11px] text-gray-600">
          <span className={`w-2 h-2 rounded-full ${isLiveSource ? 'bg-green-500' : 'bg-amber-500'} animate-pulse-dot`}></span>
          {currentView === 'media' ? 'VIEW 1: MEDIA' : 'VIEW 2: TABEL'}
        </span>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${isLiveSource ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {isLiveSource ? `📡 LIVE (${lastUpdated})` : '⏳ Menunggu data...'}
        </span>
        <button
          onClick={() => setCurrentView(currentView === 'media' ? 'proses' : 'media')}
          className="text-[10px] font-bold px-2.5 py-1 rounded bg-toyota-red hover:bg-toyota-red-dark text-white transition-colors cursor-pointer"
        >
          SWITCH
        </button>
        <button
          onClick={() => {
            const testVeh = { customer: 'BAPAK BUDI (TEST)', plate: 'BM 9999 TOYOTA' };
            setCalloutVehicle(testVeh);
          }}
          className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors border border-emerald-400 cursor-pointer"
        >
          TEST POPUP
        </button>
      </div>

      {/* Auto Carousel View Render */}
      <div key={currentView} className="w-full h-full animate-fade-in flex-1 min-h-0">
        {currentView === 'media' ? (
          <ViewMedia
            waitingVehicles={waitingVehicles}
            completedVehicles={completedVehicles}
            tomorrowVehicles={tomorrowVehicles}
            runningText={cmsSettings.running_text_ticker}
            videoType={cmsSettings.promo_video_type}
            videoUrl={cmsSettings.promo_video_url}
            promoPlaylist={cmsSettings.promo_playlist}
            isCalloutActive={Boolean(calloutVehicle)}
          />
        ) : (
          <ViewProses 
            vehicles={vehicles} 
            inProgressVehicles={inProgressVehicles} 
            runningText={cmsSettings.running_text_ticker}
          />
        )}
      </div>

      {/* Full-Screen Visual Alert Callout */}
      <CalloutAlert 
        vehicle={calloutVehicle} 
        onClose={() => setCalloutVehicle(null)} 
        enableTts={cmsSettings.enable_tts}
        durationPopupSec={cmsSettings.duration_popup_sec}
        ttsSpeechRate={cmsSettings.tts_speech_rate}
        ttsTemplate={cmsSettings.tts_template}
      />
    </div>
  );
};

export default RuangTungguContainer;
