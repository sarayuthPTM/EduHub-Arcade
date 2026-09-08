import React from 'react';
import { ExternalLink, Lock, Copy, ArrowRight, Gamepad2 } from 'lucide-react';
import { ArcadeLink } from '../types';

interface ArcadeCardProps {
  link: ArcadeLink;
  onOpen: (link: ArcadeLink) => void;
}

export const ArcadeCard: React.FC<ArcadeCardProps> = ({ link, onOpen }) => {
  const isLocked = link.access === 'ล็อก PIN';
  const isExternal = link.target === '_blank';

  return (
    <div
      onClick={() => onOpen(link)}
      className="glass-card rounded-3xl flex flex-col group cursor-pointer relative overflow-hidden h-full text-left"
    >
      {/* Cover Image Area */}
      {link.coverImage ? (
        <div className="h-44 w-full overflow-hidden relative shrink-0 bg-slate-900">
          <img
            src={link.coverImage}
            alt={link.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-95" />

          {/* Top Indicators */}
          <div className="absolute top-3.5 left-3.5">
            {isExternal && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-slate-300">
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            )}
          </div>

          <div className="absolute top-3.5 right-3.5">
            {isLocked && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/90 text-white shadow-lg backdrop-blur-md">
                <Lock className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <Gamepad2 className="h-7 w-7" />
          </div>
          {isLocked && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/90 text-white shadow-lg">
              <Lock className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="p-6 pt-3 flex flex-col flex-grow relative z-10">
        <div className="text-indigo-400 text-xs font-bold tracking-wider uppercase mb-1">
          {link.category}
        </div>
        <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-indigo-300 transition-colors line-clamp-1">
          {link.name}
        </h3>
        <p className="text-slate-400 text-xs mb-5 line-clamp-2 leading-relaxed flex-grow">
          {link.desc || 'ระบบสื่อการสอนอิเล็กทรอนิกส์'}
        </p>

        {/* Buttons */}
        <div className="mt-auto pt-3 border-t border-slate-700/50 flex gap-2 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(link);
            }}
            className={`flex-1 border font-bold py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs shadow-sm ${
              isLocked
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border-amber-500/30'
                : 'bg-indigo-600/20 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white border-indigo-500/40'
            }`}
          >
            <span>{isLocked ? 'ล็อกรหัสผ่าน' : 'เข้าใช้งาน'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {link.copyUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(link.copyUrl, '_blank');
              }}
              className="border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white font-bold py-2.5 px-3 rounded-xl transition-all text-xs flex items-center gap-1"
              title="ทำสำเนา"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>ทำสำเนา</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
