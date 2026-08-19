import React from 'react';

const formatPlateNumber = (plateStr) => {
  if (!plateStr) return { p1: '', p2: '', p3: '' };
  // Hapus semua karakter non-alfanumerik (seperti spasi dan strip)
  const cleaned = plateStr.replace(/[^A-Z0-9]/ig, '').toUpperCase();
  
  // Regex untuk menangkap pola Plat Indonesia: 1-2 Huruf, 1-4 Angka, 0-3 Huruf
  const match = cleaned.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/);
  
  if (match) {
    return {
      p1: match[1],
      p2: match[2],
      p3: match[3]
    };
  }
  
  // Fallback jika tidak sesuai format standar
  return { p1: cleaned, p2: '', p3: '' };
};

const PlateNumber = ({ plate, className = '' }) => {
  const { p1, p2, p3 } = formatPlateNumber(plate);
  
  if (p2 === '') {
    return (
      <span className={`inline-flex justify-center bg-white text-black font-semibold font-plate rounded border-2 border-black shadow-sm ${className}`}>
        {p1}
      </span>
    );
  }

  return (
    <span className={`inline-flex justify-between items-center bg-white text-black font-semibold font-plate rounded border-2 border-black shadow-sm ${className}`}>
      <span>{p1}</span>
      <span>{p2}</span>
      <span>{p3}</span>
    </span>
  );
};

export default PlateNumber;
