import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { ArcadeLink } from '../types';

interface IframeViewerProps {
  link: ArcadeLink;
  onClose: () => void;
}

export const IframeViewer: React.FC<IframeViewerProps> = ({ link, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  const raw = (link.url || '').trim();
  const formattedUrl = !raw
    ? ''
    : /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(raw)
    ? raw
    : `https://${raw}`;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950">
      {/* Floating Close Button */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <button
          onClick={onClose}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 border border-rose-400/40"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>กลับหน้าหลัก</span>
        </button>

        <span className="hidden sm:inline-flex rounded-full bg-slate-900/90 text-slate-200 border border-slate-700 px-3 py-1.5 text-xs font-semibold backdrop-blur-md">
          {link.name}
        </span>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => window.open(formattedUrl, '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3.5 py-2 rounded-full text-xs font-semibold border border-slate-700 backdrop-blur-md transition shadow-xl cursor-pointer"
          title="เปิดในหน้าต่างใหม่"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden md:inline">เปิดแท็บใหม่</span>
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
          <p className="text-sm font-bold text-slate-300">กำลังโหลดระบบ...</p>
          <p className="text-xs text-slate-500 mt-1">{link.name}</p>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={formattedUrl}
        title={link.name}
        onLoad={() => setIsLoading(false)}
        className="w-full h-full border-none bg-white"
        allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; camera; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};
