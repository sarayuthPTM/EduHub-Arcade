import React from 'react';
import { ExternalLink, Lock, Copy, Gamepad2 } from 'lucide-react';
import { ArcadeLink } from '../types';

interface ArcadeCardProps {
  link: ArcadeLink;
  onOpen: (link: ArcadeLink) => void;
}

export const ArcadeCard: React.FC<ArcadeCardProps> = ({ link, onOpen }) => {
  const isLocked = link.access === 'ล็อก PIN';

  return (
    <div
      onClick={() => onOpen(link)}
      className="glass-card rounded-3xl flex flex-col group cursor-pointer relative overflow-hidden h-full text-left border border-slate-800 hover:border-indigo-500/50 bg-[#161f36]"
    >
      {/* Cover Image Area */}
      {link.coverImage ? (
        <div className="h-44 w-full overflow-hidden relative shrink-0 bg-white flex items-center justify-center p-2 rounded-t-3xl">
          <img
            src={link.coverImage}
            alt={link.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Subtle bottom gradient blending into dark card body */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161f36] via-transparent to-transparent opacity-90 pointer-events-none" />

          {/* Top Left Indicator (Open in new icon like in original sample) */}
          <div className="absolute top-3.5 left-3.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/20 backdrop-blur-md text-slate-500 group-hover:text-indigo-600 transition-colors">
              <ExternalLink className="h-4 w-4" />
            </span>
          </div>

          {/* Top Right Locked Indicator */}
          {isLocked && (
            <div className="absolute top-3.5 right-3.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/90 text-white shadow-lg backdrop-blur-md">
                <Lock className="h-3.5 w-3.5" />
              </span>
            </div>
          )}
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
      <div className="p-5 pt-2 flex flex-col flex-grow relative z-10">
        <div className="text-indigo-400 text-xs font-semibold tracking-wider mb-1">
          {link.category}
        </div>
        <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-indigo-300 transition-colors line-clamp-1">
          {link.name}
        </h3>
        <p className="text-slate-400 text-xs mb-4 line-clamp-1 leading-relaxed flex-grow">
          {link.desc || 'ระบบสื่อการสอนอิเล็กทรอนิกส์'}
        </p>

        {/* Action Button: Rounded Full Pill matching original */}
        <div className="mt-auto pt-2 border-t border-slate-700/40 flex gap-2 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(link);
            }}
            className={`flex-1 border font-bold py-2 px-4 rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 text-xs shadow-sm ${
              isLocked
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-white border-amber-500/30'
                : 'bg-slate-900/80 text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 border-slate-700/80'
            }`}
          >
            <span>{isLocked ? 'ล็อกรหัสผ่าน' : 'เข้าใช้งาน'}</span>
          </button>

          {link.copyUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(link.copyUrl, '_blank');
              }}
              className="border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white font-bold py-2 px-3 rounded-full transition-all text-xs flex items-center gap-1"
              title="ทำสำเนา"
            >
              <Copy className="h-3 w-3" />
              <span>สำเนา</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
