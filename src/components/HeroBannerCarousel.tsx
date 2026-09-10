import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';
import { BannerItem } from '../types';

interface HeroBannerCarouselProps {
  banners?: BannerItem[];
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({ banners }) => {
  const activeBanners = (banners || []).filter((b) => b.active !== false && b.imageUrl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeBanners.length <= 1 || isHovered) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeBanners.length, isHovered]);

  if (activeBanners.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  const handleBannerClick = () => {
    if (currentBanner.linkUrl && currentBanner.linkUrl.trim()) {
      const url = currentBanner.linkUrl.trim();
      const targetUrl = /^(https?:\/\/|\/|#)/i.test(url) ? url : `https://${url}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="relative mb-8 overflow-hidden rounded-3xl border border-slate-700/60 shadow-2xl group bg-slate-900 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleBannerClick}
      style={{ cursor: currentBanner.linkUrl ? 'pointer' : 'default' }}
    >
      {/* Banner Slide Container */}
      <div className="relative h-44 sm:h-60 md:h-72 lg:h-80 w-full overflow-hidden">
        {activeBanners.map((banner, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image */}
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="h-full w-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
              />

              {/* Gradient Overlays for Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent" />

              {/* Text & Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 flex flex-col justify-end">
                <div className="max-w-2xl space-y-1.5 sm:space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-600/80 backdrop-blur-md text-[11px] font-bold text-white border border-indigo-400/40 shadow-sm w-fit">
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>ประชาสัมพันธ์พิเศษ</span>
                  </div>

                  <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                    {banner.title}
                  </h3>

                  {banner.subtitle && (
                    <p className="text-xs sm:text-sm md:text-base text-slate-200 line-clamp-2 drop-shadow">
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.linkUrl && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-indigo-300 hover:text-white transition">
                        <span>คลิกเพื่อดูรายละเอียดเพิ่มเติม</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows (if > 1 banners) */}
      {activeBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
            title="ก่อนหน้า"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
            title="ถัดไป"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 z-20 flex items-center gap-1.5">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-6 sm:w-8 h-2 bg-indigo-500 shadow-sm'
                    : 'w-2 h-2 bg-white/50 hover:bg-white'
                }`}
                title={`สไลด์ ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
