import React, { useState, useEffect, useCallback, useRef } from 'react';

const MediaPromo = ({ 
  videoType = 'youtube', 
  videoUrl = 'bzQFeVWCC9Y',
  playlist = [],
  isCalloutActive = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);

  // Parse playlist array if passed as string JSON
  let mediaItems = [];
  if (Array.isArray(playlist) && playlist.length > 0) {
    mediaItems = playlist;
  } else if (typeof playlist === 'string') {
    try {
      const parsed = JSON.parse(playlist);
      if (Array.isArray(parsed) && parsed.length > 0) {
        mediaItems = parsed;
      }
    } catch (e) {}
  }

  // Fallback single item if no playlist configured
  if (mediaItems.length === 0) {
    mediaItems = [
      {
        id: 'single-default',
        type: videoType,
        url: videoUrl,
        title: 'Toyota Service Promo',
        duration_sec: 60,
      },
    ];
  }

  // Ensure currentIndex stays within bounds if playlist size changes
  const activeIndex = currentIndex >= mediaItems.length ? 0 : currentIndex;
  const currentItem = mediaItems[activeIndex] || mediaItems[0];

  const handleNextSlide = useCallback(() => {
    if (mediaItems.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
    }
  }, [mediaItems.length]);

  // Determine media category for active item
  const itemType = (currentItem.type || 'youtube').toLowerCase();
  const itemUrl = currentItem.url || 'bzQFeVWCC9Y';

  const isImage = itemType === 'image' || itemType === 'foto' || /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(itemUrl);
  const isVideoMp4 = itemType === 'mp4' || itemType === 'video' || itemType === 'local' || /\.(mp4|webm|ogg)(\?.*)?$/i.test(itemUrl);
  const isYouTube = itemType === 'youtube' || itemUrl.includes('youtube.com') || itemUrl.includes('youtu.be') || (!isImage && !isVideoMp4);

  // Unmute MP4 Video Playback with browser Autoplay unlocker
  useEffect(() => {
    if (isVideoMp4 && videoRef.current && !isCalloutActive) {
      const videoEl = videoRef.current;
      videoEl.muted = false;
      videoEl.volume = 1.0;

      videoEl.play().catch((err) => {
        console.warn("Autoplay dengan suara diblokir browser TV, mencoba autoplay muted:", err);
        videoEl.muted = true;
        setIsAudioMuted(true);
        videoEl.play().catch(() => {});
      });
    }
  }, [activeIndex, isVideoMp4, isCalloutActive]);

  // Pause / Resume Video & Audio when TTS Callout Popup is active
  useEffect(() => {
    if (isCalloutActive) {
      // Pause MP4 Video
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch (e) {}
      }
      // Pause YouTube Video via IFrame postMessage API
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } catch (e) {}
      }
    } else {
      // Resume MP4 Video
      if (isVideoMp4 && videoRef.current) {
        try { videoRef.current.play().catch(() => {}); } catch (e) {}
      }
      // Resume YouTube Video via IFrame postMessage API
      if (isYouTube && iframeRef.current && iframeRef.current.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } catch (e) {}
      }
    }
  }, [isCalloutActive, isVideoMp4, isYouTube]);

  // Auto Slide Switcher per item duration (for Images & YouTube fallback)
  useEffect(() => {
    if (mediaItems.length <= 1 || isCalloutActive) return;

    // For HTML5 MP4 videos, slide transitions on onEnded event.
    // For Images or YouTube, use configured duration timer.
    if (isImage || isYouTube) {
      const durationMs = (parseInt(currentItem.duration_sec) || (isImage ? 10 : 60)) * 1000;

      const timer = setTimeout(() => {
        handleNextSlide();
      }, durationMs);

      return () => clearTimeout(timer);
    }
  }, [activeIndex, mediaItems, currentItem, isImage, isYouTube, isCalloutActive, handleNextSlide]);

  let youtubeId = itemUrl;
  if (itemUrl.includes('v=')) {
    youtubeId = itemUrl.split('v=')[1]?.split('&')[0];
  } else if (itemUrl.includes('youtu.be/')) {
    youtubeId = itemUrl.split('youtu.be/')[1]?.split('?')[0];
  }

  const playlistIds = `${youtubeId},1C7jI1Ul3EI,ptB1j00C38g,nSusFwssBZg`;
  const iframeSrc = `https://www.youtube.com/embed/${youtubeId}?playlist=${playlistIds}&autoplay=1&mute=0&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&disablekb=1&enablejsapi=1`;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative select-none font-radio">
      {/* Header with Active Slide Information */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold tracking-widest text-gray-500 uppercase">
            {currentItem.title || 'INFORMASI & PROMO'}
          </span>
          {mediaItems.length > 1 && (
            <span className="text-[10px] font-black bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full border border-gray-300">
              {activeIndex + 1}/{mediaItems.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-black bg-toyota-red text-white px-2.5 py-0.5 rounded tracking-wider">
          TOYOTA SERVICE
        </span>
      </div>

      {/* Media Display Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
        {isImage ? (
          <img
            key={currentItem.id || activeIndex}
            src={itemUrl}
            alt={currentItem.title || 'Toyota Promo'}
            className="w-full h-full object-cover pointer-events-none animate-fade-in"
          />
        ) : isVideoMp4 ? (
          <video
            ref={videoRef}
            key={currentItem.id || activeIndex}
            src={itemUrl}
            autoPlay
            playsInline
            controls={false}
            onEnded={handleNextSlide}
            className="w-full h-full object-cover pointer-events-none animate-fade-in"
          />
        ) : (
          <iframe
            ref={iframeRef}
            key={currentItem.id || activeIndex}
            className="w-full h-full object-cover pointer-events-none"
            src={iframeSrc}
            title={currentItem.title || 'Toyota Promo Playlist'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
          ></iframe>
        )}
      </div>

      {/* Live Promotion Footer with Playlist Indicators */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-toyota-red tracking-wider">
          <span className="w-2 h-2 bg-toyota-red rounded-full animate-pulse-dot"></span>
          INFORMASI PROMOSI AGUNG TOYOTA
        </div>

        {/* Dots indicator for multi-item playlist */}
        {mediaItems.length > 1 && (
          <div className="flex items-center gap-1.5">
            {mediaItems.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeIndex ? 'bg-toyota-red scale-125' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPromo;
