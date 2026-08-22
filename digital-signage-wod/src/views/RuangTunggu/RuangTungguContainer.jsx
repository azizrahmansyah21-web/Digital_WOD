import React, { useState, useEffect, useRef } from 'react';
import ViewMedia from './ViewMedia';
import ViewProses from './ViewProses';
import CalloutAlert from '../../components/CalloutAlert';
import axios from 'axios';

const RuangTungguContainer = () => {
  // Current active view: 'media' (View 1 - 60s) or 'proses' (View 2 - 30s)
  const [currentView, setCurrentView] = useState('media');
  const [vehicles, setVehicles] = useState([]);
  const [isLiveSource, setIsLiveSource] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('-');
  const [calloutVehicle, setCalloutVehicle] = useState(null);

  // Anti-Spam state for Text-to-Speech voice callouts
  const spokenPlatesRef = useRef(new Set());

  // 1. Auto-Carousel View Switcher (View 1 for 60s -> View 2 for 30s)
  useEffect(() => {
    let timer;
    if (currentView === 'media') {
      timer = setTimeout(() => {
        setCurrentView('proses');
      }, 120000); // 120 Detik
    } else {
      timer = setTimeout(() => {
        setCurrentView('media');
      }, 30000); // 30 Detik
    }

    // CRITICAL: Cleanup function to prevent memory leak
    return () => clearTimeout(timer);
  }, [currentView]);

  // 2. Data Polling Interval (Fetch every 10 seconds)
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

    const fetchData = async () => {
      // Step A: Attempt fetching JSON from Laravel API proxy
      try {
        const response = await axios.get(`${apiUrl}/antrean`, { timeout: 8000 });
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setVehicles(response.data);
          setIsLiveSource(true);
          setLastUpdated(new Date().toLocaleTimeString('id-ID'));
          return;
        }
      } catch (err) {
        // Laravel backend is offline or loading — fall through to WOD proxy
      }

      // Step B: Precise HTML DOM Parsing from 172.16.3.30 via Vite Proxy
      try {
        const proxyRes = await axios.get('/wod-proxy/service/public/display/ruang-tunggu/ubta', { timeout: 15000 });
        if (proxyRes.data && typeof proxyRes.data === 'string') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(proxyRes.data, 'text/html');
          const parsedList = [];

          // ═══════════════════════════════════════════════════════════════
          // SECTION 1: Parse Main Table Rows (PROSES PERBAIKAN & TUNGGU CUCI)
          // Structure: <table> -> <tbody> -> <tr> -> 6x <td>
          //   td[0]: <span>No Polisi</span>
          //   td[1]: Customer name (direct text)
          //   td[2]: Mulai Dikerjakan time
          //   td[3]: Estimasi Selesai time
          //   td[4]: <span><span class="dot"></span> STATUS TEXT</span>
          //   td[5]: Service Advisor
          // ═══════════════════════════════════════════════════════════════
          const tableRows = doc.querySelectorAll('table tbody tr');
          tableRows.forEach((tr, index) => {
            const tds = tr.querySelectorAll('td');
            if (tds.length >= 6) {
              // td[0] has plate inside a <span> with special styling
              const plateSpan = tds[0].querySelector('span');
              const plate = (plateSpan ? plateSpan.textContent : tds[0].textContent).trim();

              const customer = tds[1].textContent.trim();
              const startTime = tds[2].textContent.trim();
              const estTime = tds[3].textContent.trim();

              // td[4] has status inside nested spans — get the full text, strip dot span
              const statusSpan = tds[4].querySelector('span');
              let status = statusSpan ? statusSpan.textContent.trim() : tds[4].textContent.trim();
              // Clean up status text (remove leading/trailing whitespace from nested elements)
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

          // ═══════════════════════════════════════════════════════════════
          // SECTION 2: Parse Bottom Card Sections
          // Structure: grid > div.panel > div.header(H3 + badge) + div.space-y-2(list)
          //   Each list item: <div class="flex items-center justify-between">
          //     <span class="font-outfit">PLATE</span>
          //     <span class="text-xs font-bold">CUSTOMER</span>
          //   </div>
          // ═══════════════════════════════════════════════════════════════
          const h3Elements = doc.querySelectorAll('h3');
          h3Elements.forEach((h3) => {
            const title = h3.textContent.trim().toUpperCase();

            let statusName = '';
            let statusKey = '';
            let estTimeVal = '-';

            if (title.includes('SELESAI DIKERJAKAN')) {
              statusName = 'SELESAI DIKERJAKAN';
              statusKey = 'c';
              estTimeVal = 'SELESAI';
            } else if (title.includes('MENUNGGU DIKERJAKAN')) {
              statusName = 'MENUNGGU DIKERJAKAN';
              statusKey = 'w';
            } else if (title.includes('PERBAIKAN DILANJUT BESOK')) {
              statusName = 'PERBAIKAN DILANJUT BESOK';
              statusKey = 'b';
            } else {
              return; // Skip unknown sections
            }

            // Navigate to the panel container: h3 -> parent div (header) -> parent div (panel)
            const headerDiv = h3.closest('.flex');
            if (!headerDiv) return;

            const panelContainer = headerDiv.parentElement; // the flex header wrapper
            if (!panelContainer) return;

            const panelRoot = panelContainer.parentElement; // the actual panel div
            if (!panelRoot) return;

            // Find the scrollable list container (div.space-y-2)
            const listContainer = panelRoot.querySelector('.space-y-2');
            if (!listContainer) return;

            // Each vehicle item is a direct child div with flex layout containing 2 spans
            const vehicleItems = listContainer.querySelectorAll(':scope > div');
            vehicleItems.forEach((item, idx) => {
              const spans = item.querySelectorAll('span');
              if (spans.length >= 2) {
                const candidatePlate = spans[0].textContent.trim();
                const candidateCustomer = spans[1].textContent.trim();

                // Validate this is actually a vehicle entry, not a "Kosong" message
                if (
                  candidatePlate &&
                  candidateCustomer &&
                  candidatePlate !== 'Kosong' &&
                  !candidatePlate.includes('Vehicle') &&
                  !candidatePlate.includes('DIKERJAKAN') &&
                  !candidatePlate.includes('BESOK') &&
                  candidatePlate.length >= 3 &&
                  candidatePlate.length <= 20
                ) {
                  // Deduplicate — don't add if plate already exists
                  if (!parsedList.some((v) => v.plate === candidatePlate)) {
                    parsedList.push({
                      id: `${statusKey}-${idx}`,
                      plate: candidatePlate,
                      customer: candidateCustomer,
                      model: '',
                      status: statusName,
                      startTime: '-',
                      estTime: estTimeVal,
                      advisor: '-',
                    });
                  }
                }
              }
            });
          });

          if (parsedList.length > 0) {
            setVehicles(parsedList);
            setIsLiveSource(true);
            setLastUpdated(new Date().toLocaleTimeString('id-ID'));
            return;
          }
        }
      } catch (proxyErr) {
        // Network offline or proxy timeout — vehicles stay empty
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10 seconds

    // CRITICAL: Cleanup function to clear interval
    return () => clearInterval(interval);
  }, []);

  // Primary Audio Context & SpeechSynthesis unlocker for Xiaomi Android TV (BrowsHere)
  useEffect(() => {
    const unlockAudioContext = () => {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume();
        } catch (e) {}
      }
    };

    window.addEventListener('keydown', unlockAudioContext, { once: true });
    window.addEventListener('click', unlockAudioContext, { once: true });

    return () => {
      window.removeEventListener('keydown', unlockAudioContext);
      window.removeEventListener('click', unlockAudioContext);
    };
  }, []);

  // Helper function for Android TV compatible TTS voice playback
  const playTtsCallout = (customerName, plateStr) => {
    if (!('speechSynthesis' in window)) return;

    try {
      // 1. Selalu panggil cancel() sebelum mengucapkan kata baru
      window.speechSynthesis.cancel();

      const ttsCustomer = (customerName || '').toLowerCase();
      const ttsPlate = (plateStr || '').replace(/[^a-zA-Z0-9]/g, '').split('').join(' ');
      const textToSpeak = `Panggilan untuk pelanggan Toyota, Bapak atau Ibu ${ttsCustomer}, dengan nomor kendaraan ${ttsPlate}, servis kendaraan Anda telah selesai dikerjakan. Terima kasih.`;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;

      const assignVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find((v) => v.lang && (v.lang.includes('id') || v.lang.includes('ID')));
        if (idVoice) {
          utterance.voice = idVoice;
        }
      };

      assignVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = assignVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS playback deferred or interrupted by browser policy:', err);
    }
  };

  // 3. Text-to-Speech (TTS) Voice Callout for "SELESAI DIKERJAKAN"
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;

    const completed = vehicles.filter(
      (v) => v.status && v.status.includes('SELESAI')
    );

    completed.forEach((v) => {
      if (!spokenPlatesRef.current.has(v.plate)) {
        spokenPlatesRef.current.add(v.plate);

        // Tampilkan Visual Alert Modal
        setCalloutVehicle(v);
        setTimeout(() => {
          setCalloutVehicle(null);
        }, 12000);

        playTtsCallout(v.customer, v.plate);
      }
    });
  }, [vehicles]);

  // Filtered Vehicle Lists for View Components
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
      {/* Debug Banner — shows data source status */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-2 bg-white/95 border border-gray-200 px-3 py-1 rounded-full text-xs shadow-sm">
        <span className="flex items-center gap-1.5 font-bold text-[11px] text-gray-600">
          <span className={`w-2 h-2 rounded-full ${isLiveSource ? 'bg-green-500' : 'bg-amber-500'} animate-pulse-dot`}></span>
          {currentView === 'media' ? 'VIEW 1: MEDIA (60s)' : 'VIEW 2: TABEL (30s)'}
        </span>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${isLiveSource ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
          {isLiveSource ? `📡 LIVE (${lastUpdated})` : '⏳ Menunggu data...'}
        </span>
        <button
          onClick={() => setCurrentView(currentView === 'media' ? 'proses' : 'media')}
          className="text-[10px] font-bold px-2 py-0.5 rounded bg-toyota-red hover:bg-toyota-red-dark text-white transition-colors"
        >
          SWITCH
        </button>
        {/* TEST POPUP BUTTON */}
        <button
          onClick={() => {
            const testVeh = { customer: 'BAPAK BUDI (TEST)', plate: 'BM 9999 TOYOTA' };
            setCalloutVehicle(testVeh);
            playTtsCallout(testVeh.customer, testVeh.plate);
          }}
          className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors border border-emerald-400"
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
          />
        ) : (
          <ViewProses vehicles={vehicles} inProgressVehicles={inProgressVehicles} />
        )}
      </div>

      {/* Full-Screen Visual Alert Callout */}
      <CalloutAlert vehicle={calloutVehicle} onClose={() => setCalloutVehicle(null)} />
    </div>
  );
};

export default RuangTungguContainer;
