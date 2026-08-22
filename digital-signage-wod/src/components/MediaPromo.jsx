import React from 'react';

const MediaPromo = () => {
  // Playlist YouTube Video IDs
  const videoId = 'bzQFeVWCC9Y';
  const playlistIds = '1C7jI1Ul3EI,ptB1j00C38g,nSusFwssBZg,bzQFeVWCC9Y';

  // Construct iframe URL with autoplay, mute, and loop parameters without controls
  const iframeSrc = `https://www.youtube.com/embed/${videoId}?playlist=${playlistIds}&autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&disablekb=1`;

  return (
    <div className="w-full h-full flex flex-col bg-white overflow-hidden relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 z-10 shrink-0">
        <span className="text-[11px] font-extrabold tracking-widest text-gray-500">INFORMASI & PROMO</span>
        <span className="text-[10px] font-black bg-toyota-red text-white px-2.5 py-0.5 rounded tracking-wider">TOYOTA SERVICE</span>
      </div>

      {/* Video Media Container */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
        {/* Clean Video Player Frame */}
        <iframe
          className="w-full h-full object-cover pointer-events-none"
          src={iframeSrc}
          title="Toyota Promo Playlist"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        ></iframe>
      </div>

      {/* Live Promotion Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] shrink-0">
        <div className="flex items-center gap-2 font-bold text-toyota-red tracking-wider">
          <span className="w-2 h-2 bg-toyota-red rounded-full animate-pulse-dot"></span>
          INFORMASI PROMOSI AGUNG TOYOTA
        </div>
      </div>
    </div>
  );
};

export default MediaPromo;
