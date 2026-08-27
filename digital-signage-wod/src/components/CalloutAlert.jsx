import React, { useEffect, useRef } from 'react';

// Preloaded persistent module-level audio instances for zero-latency intro & closing chimes
let chimeIntroAudio = null;
let chimeClosingAudio = null;

if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
  try {
    chimeIntroAudio = new Audio('/chime-airport.mp3');
    chimeIntroAudio.preload = 'auto';
    chimeIntroAudio.volume = 1.0;

    chimeClosingAudio = new Audio('/chime-closing.mp3');
    chimeClosingAudio.preload = 'auto';
    chimeClosingAudio.volume = 1.0;
  } catch (e) {}
}

// Module-level audio reference to ensure ONLY ONE audio plays at any given time across all renders
let globalAudioInstance = null;

const stopGlobalAudio = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  if (chimeIntroAudio) {
    try {
      chimeIntroAudio.pause();
      chimeIntroAudio.currentTime = 0;
    } catch (e) {}
  }
  if (chimeClosingAudio) {
    try {
      chimeClosingAudio.pause();
      chimeClosingAudio.currentTime = 0;
    } catch (e) {}
  }
  if (globalAudioInstance && globalAudioInstance !== chimeIntroAudio && globalAudioInstance !== chimeClosingAudio) {
    try {
      globalAudioInstance.pause();
      globalAudioInstance.currentTime = 0;
    } catch (e) {}
    globalAudioInstance = null;
  }
};

const CalloutAlert = ({ 
  vehicle, 
  customerName, 
  plateNumber, 
  isOpen, 
  onClose,
  enableTts = true,
  durationPopupSec = 20,
  ttsSpeechRate = 0.9,
  ttsTemplate = 'Panggilan untuk pelanggan Toyota, Bapak atau Ibu {customer}, dengan nomor kendaraan {plate}, servis kendaraan Anda telah selesai dikerjakan. Terima kasih.'
}) => {
  const custName = customerName || vehicle?.customer;
  const plateNo = plateNumber || vehicle?.plate;
  const active = isOpen !== undefined ? (isOpen && Boolean(custName)) : Boolean(vehicle);

  const lastPlayedKeyRef = useRef('');

  useEffect(() => {
    if (!active || !custName || !plateNo) {
      stopGlobalAudio();
      lastPlayedKeyRef.current = '';
      return;
    }

    const currentKey = `${custName}-${plateNo}`;
    if (lastPlayedKeyRef.current === currentKey) {
      return; // Audio already initiated for this active callout
    }
    lastPlayedKeyRef.current = currentKey;

    stopGlobalAudio();

    // Check if TTS is enabled
    const ttsEnabled = enableTts === true || enableTts === '1' || enableTts === 1 || enableTts === 'true';
    if (!ttsEnabled) {
      // Audio disabled via CMS - only show visual popup modal
      const timerNoAudio = setTimeout(() => {
        if (onClose) onClose();
      }, (parseInt(durationPopupSec) || 20) * 1000);
      return () => clearTimeout(timerNoAudio);
    }

    let hasPlayedAnyAudio = false;
    let fallbackTimer = null;
    let autoCloseBufferTimer = null;

    const rateVal = parseFloat(ttsSpeechRate) || 0.9;
    const formattedPlate = plateNo.replace(/[^a-zA-Z0-9]/g, '').split('').join(' ');
    
    // Construct custom spoken message from template
    const templateStr = ttsTemplate || 'Panggilan untuk pelanggan Toyota, Bapak atau Ibu {customer}, dengan nomor kendaraan {plate}, servis kendaraan Anda telah selesai dikerjakan. Terima kasih.';
    const textToSpeak = templateStr
      .replace(/{customer}/g, custName)
      .replace(/{plate}/g, formattedPlate);

    // Phase 3: Play Closing Chime (Outro) and smoothly close modal
    const playClosingChime = () => {
      if (chimeClosingAudio) {
        try {
          chimeClosingAudio.currentTime = 0;
          chimeClosingAudio.volume = 1.0;
          globalAudioInstance = chimeClosingAudio;

          chimeClosingAudio.onended = () => {
            // Buffer 1.5s after closing chime before dismissing modal
            autoCloseBufferTimer = setTimeout(() => {
              if (onClose) onClose();
            }, 1500);
          };

          const playPromise = chimeClosingAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // If audio fails, close after 1.5s
              autoCloseBufferTimer = setTimeout(() => {
                if (onClose) onClose();
              }, 1500);
            });
          }
        } catch (err) {
          if (onClose) onClose();
        }
      } else {
        if (onClose) onClose();
      }
    };

    // Phase 2 (Fallback): Play Backend Audio TTS if Web Speech API unavailable
    const playBackendAudio = () => {
      if (hasPlayedAnyAudio) return;
      hasPlayedAnyAudio = true;

      stopGlobalAudio();

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '/api';
        const audioUrl = `${apiUrl}/tts?text=${encodeURIComponent(textToSpeak)}`;

        const audioObj = new Audio(audioUrl);
        audioObj.volume = 1.0;
        globalAudioInstance = audioObj;

        audioObj.onended = () => {
          playClosingChime();
        };

        audioObj.play().catch((err) => {
          console.warn("Autoplay terblokir oleh browser TV:", err);
          playClosingChime();
        });
      } catch (err) {
        console.warn("Gagal memutar audio backend TTS:", err);
        playClosingChime();
      }
    };

    // Phase 2: Play Spoken TTS Voice Announcement
    const startSpeech = () => {
      if ('speechSynthesis' in window) {
        try {
          const speechUtterance = new SpeechSynthesisUtterance(textToSpeak);
          speechUtterance.lang = 'id-ID';
          speechUtterance.rate = rateVal;

          const voices = window.speechSynthesis.getVoices();
          const idV = voices.find((v) => v.lang && (v.lang.includes('id') || v.lang.includes('ID')));
          if (idV) speechUtterance.voice = idV;

          let isSpeakingStarted = false;

          speechUtterance.onstart = () => {
            isSpeakingStarted = true;
            hasPlayedAnyAudio = true;
            if (fallbackTimer) clearTimeout(fallbackTimer);
          };

          speechUtterance.onerror = (e) => {
            if (e.error === 'canceled' || e.error === 'interrupted') return;
            console.warn("SpeechSynthesis error, switch fallback backend TTS:", e);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            playBackendAudio();
          };

          speechUtterance.onend = () => {
            hasPlayedAnyAudio = true;
            playClosingChime();
          };

          window.speechSynthesis.speak(speechUtterance);

          fallbackTimer = setTimeout(() => {
            if (!isSpeakingStarted && !hasPlayedAnyAudio) {
              console.warn("Web Speech API tidak merespons, switch ke backend TTS");
              playBackendAudio();
            }
          }, 1200);

        } catch (err) {
          console.warn("SpeechSynthesis gagal, gunakan fallback backend TTS:", err);
          playBackendAudio();
        }
      } else {
        playBackendAudio();
      }
    };

    // Phase 1: Play Intro Airport Bell (Bel Airport.mp3), then trigger Spoken Speech
    let introFinished = false;
    const finishIntroAndStartSpeech = () => {
      if (!introFinished) {
        introFinished = true;
        if (chimeIntroAudio) {
          try {
            chimeIntroAudio.pause();
            chimeIntroAudio.currentTime = 0;
          } catch (e) {}
        }
        startSpeech();
      }
    };

    if (chimeIntroAudio) {
      try {
        chimeIntroAudio.currentTime = 0;
        chimeIntroAudio.volume = 1.0;
        globalAudioInstance = chimeIntroAudio;

        chimeIntroAudio.onended = finishIntroAndStartSpeech;

        const playPromise = chimeIntroAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Safety fallback: Proceed to speech after 3.5s if onended delayed
              setTimeout(finishIntroAndStartSpeech, 3500);
            })
            .catch((err) => {
              console.warn("Intro chime blocked, starting speech:", err);
              finishIntroAndStartSpeech();
            });
        }
      } catch (err) {
        finishIntroAndStartSpeech();
      }
    } else {
      finishIntroAndStartSpeech();
    }

    // Remote D-Pad / OK / Back key handling
    const handleRemoteKey = (e) => {
      if (
        ['Enter', 'Escape', 'Backspace', ' ', 'GoBack'].includes(e.key) ||
        e.keyCode === 13 ||
        e.keyCode === 27 ||
        e.keyCode === 8
      ) {
        if (onClose) onClose();
      }
    };

    window.addEventListener('keydown', handleRemoteKey);

    // Maximum safety auto-close timeout based on durationPopupSec from CMS (Default 20s)
    const popupDurationMs = (parseInt(durationPopupSec) || 20) * 1000;
    const maxTimer = setTimeout(() => {
      if (onClose) onClose();
    }, popupDurationMs);

    return () => {
      window.removeEventListener('keydown', handleRemoteKey);
      clearTimeout(maxTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (autoCloseBufferTimer) clearTimeout(autoCloseBufferTimer);
      stopGlobalAudio();
    };
  }, [active, custName, plateNo, enableTts, durationPopupSec, ttsSpeechRate, ttsTemplate]);

  if (!active || !custName || !plateNo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in font-radio">
      {/* Modal Box: Terkunci max height 80vh agar tidak kepotong di TV */}
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col items-center justify-between rounded-2xl bg-[#1b6b50] p-8 shadow-2xl text-white overflow-hidden border-4 border-emerald-400/30">

        {/* Tombol Close / Silang (X) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-xl transition-colors shadow-sm"
          aria-label="Tutup Notifikasi"
        >
          ✕
        </button>

        {/* Icon Megaphone */}
        <div className="w-20 h-20 bg-white text-emerald-700 rounded-full flex items-center justify-center mb-3 shadow-lg animate-pulse shrink-0">
          <span className="text-4xl">📢</span>
        </div>

        {/* Teks Panggilan */}
        <h2 className="text-xl font-bold uppercase tracking-widest opacity-90 shrink-0 mb-1">
          Panggilan Pelanggan
        </h2>

        <h1 className="text-3xl md:text-4xl font-extrabold text-center mt-1 mb-4 uppercase truncate w-full shrink-0">
          {custName}
        </h1>

        {/* Box Plat Nomor */}
        <div className="bg-white text-gray-900 px-6 py-3 rounded-xl border-4 border-gray-300 w-full text-center shadow-inner shrink-0 mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Nomor Polisi</p>
          <p className="text-4xl md:text-5xl font-black uppercase tracking-widest font-plate">{plateNo}</p>
        </div>

        {/* Footer Status */}
        <div className="mt-2 px-6 py-2 bg-green-800/50 rounded-full border border-green-400/30 shrink-0">
          <p className="text-lg font-bold uppercase tracking-wide text-green-100">
            Telah Selesai Dikerjakan
          </p>
        </div>

      </div>
    </div>
  );
};

export default CalloutAlert;
