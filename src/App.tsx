import React, { useState, useEffect, useMemo } from 'react';
import { Search, Gamepad2, Shield, Sparkles } from 'lucide-react';
import { ArcadeLink, SiteSettings } from './types';
import {
  loadArcadeLinks,
  saveArcadeLinks,
  trackToolClick,
  incrementTotalVisits,
} from './lib/arcade-service';
import { loadSettings, saveSettings } from './lib/settings-service';
import { ArcadeCard } from './components/ArcadeCard';
import { IframeViewer } from './components/IframeViewer';
import { InteractiveToolModal } from './components/InteractiveToolModal';
import { PinLockModal } from './components/PinLockModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './components/AdminPanel';
import { HeroBannerCarousel } from './components/HeroBannerCarousel';

export const App: React.FC = () => {
  const [links, setLinks] = useState<ArcadeLink[]>(() => loadArcadeLinks());
  const [settings, setSettings] = useState<SiteSettings>(() => loadSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');

  // Interactive Modals
  const [activeInteractiveTool, setActiveInteractiveTool] = useState<ArcadeLink | null>(null);
  const [activeIframeLink, setActiveIframeLink] = useState<ArcadeLink | null>(null);
  const [lockedTargetLink, setLockedTargetLink] = useState<ArcadeLink | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  useEffect(() => {
    incrementTotalVisits();
  }, []);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    links.forEach((link) => {
      if (link.status !== 'ปิด') {
        const cat = link.category || 'ทั่วไป';
        map.set(cat, (map.get(cat) || 0) + 1);
      }
    });

    const order = settings.categoryOrder || ['เครื่องมือครู', 'เกมเพื่อการเรียนรู้'];
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const idxA = order.indexOf(a.name);
        const idxB = order.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [links, settings.categoryOrder]);

  const groupedLinks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = links.filter((link) => {
      if (link.status === 'ปิด') return false;
      if (selectedCategory !== 'ทั้งหมด' && (link.category || 'ทั่วไป') !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        link.name.toLowerCase().includes(q) ||
        (link.desc && link.desc.toLowerCase().includes(q)) ||
        (link.category && link.category.toLowerCase().includes(q))
      );
    });

    const groups: Record<string, ArcadeLink[]> = {};
    filtered.forEach((item) => {
      const cat = item.category || 'ทั่วไป';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    const order = settings.categoryOrder || ['เครื่องมือครู', 'เกมเพื่อการเรียนรู้'];
    const sortedGroups: Record<string, ArcadeLink[]> = {};
    order.forEach((cat) => {
      if (groups[cat]) {
        sortedGroups[cat] = groups[cat];
      }
    });
    Object.keys(groups).forEach((cat) => {
      if (!sortedGroups[cat]) {
        sortedGroups[cat] = groups[cat];
      }
    });

    return sortedGroups;
  }, [links, selectedCategory, searchQuery, settings.categoryOrder]);

  const totalCount = useMemo(() => {
    return Object.values(groupedLinks).reduce((sum, list) => sum + list.length, 0);
  }, [groupedLinks]);

  const handleOpenLink = (link: ArcadeLink) => {
    if (link.access === 'ล็อก PIN') {
      setLockedTargetLink(link);
    } else {
      launchItem(link);
    }
  };

  const formatUrl = (url?: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const launchItem = (link: ArcadeLink) => {
    trackToolClick(link);

    const targetUrl = formatUrl(link.url);
    const linkWithFormattedUrl = { ...link, url: targetUrl };

    // 1. If target is _blank: ALWAYS open in a new tab with the link's URL!
    if (link.target === '_blank') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. If target is _self:
    // Only open the built-in interactive tool modal if it is one of the built-in IDs
    // AND the URL has NOT been customized by the user!
    const defaultToolUrls = [
      'https://www.online-stopwatch.com/classroom-timers/',
      'https://www.classtools.net/fruit_machine/',
      'https://wheelofnames.com/th/',
      'https://bouncyballs.org/',
      'https://www.classtools.net/random-name-picker/',
      'https://www.online-stopwatch.com/duck-race/',
      'https://www.randomlists.com/team-generator',
      'https://keepthescore.com/',
    ];

    const isUnchangedDefaultTool =
      link.id &&
      link.id.startsWith('tool-') &&
      (!link.url || defaultToolUrls.includes(link.url.trim()));

    if (isUnchangedDefaultTool) {
      setActiveInteractiveTool(link);
    } else {
      setActiveIframeLink(linkWithFormattedUrl);
    }
  };

  const handleUpdateLinks = (newLinks: ArcadeLink[]) => {
    setLinks(newLinks);
    saveArcadeLinks(newLinks);
  };

  const handleUpdateSettings = (newSettings: SiteSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="relative min-h-screen flex flex-col antialiased">
      {/* Background Cyber Grid */}
      <div className="bg-grid" />

      {/* Top Ticker Marquee */}
      {settings.announcement && (
        <div className="ticker-wrap">
          <div
            className="ticker-content text-xs font-semibold"
            style={{ animationDuration: `${settings.tickerSpeed || 25}s` }}
          >
            {settings.announcement}
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-16 flex-1 flex flex-col">
        {/* Header Glass Card */}
        <header className="glass-card rounded-3xl p-5 sm:p-6 mb-8 flex items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-4">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="logo"
                className="w-12 h-12 rounded-2xl object-cover border border-white/20 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg border border-amber-300/30">
                <Sparkles className="h-6 w-6" />
              </div>
            )}
            <div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-200 bg-clip-text text-transparent flex items-center gap-2">
                <span>{settings.topbarTitle || 'EduHub Arcade 🎮'}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {settings.schoolName || 'โรงเรียนของฉัน'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdminLoginOpen(true)}
            className="glass-card px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 border border-slate-700/80 shadow-lg hover:border-indigo-500 transition-all hover:scale-105 active:scale-95"
          >
            <Shield className="h-4 w-4 text-indigo-400" />
            <span className="hidden sm:inline">ผู้ดูแลระบบ</span>
          </button>
        </header>

        {/* Hero Banner Carousel */}
        <HeroBannerCarousel banners={settings.banners} />

        {/* Search & Category Filter Section */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาสื่อ, เกม หรือเครื่องมือ..."
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 py-3 pl-11 pr-10 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 rounded-lg px-2 py-0.5 text-xs text-slate-400 hover:text-white"
              >
                ล้าง
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ทั้งหมด')}
              className={`shrink-0 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-md ${
                selectedCategory === 'ทั้งหมด'
                  ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                  : 'glass-card text-slate-300 hover:text-white border-slate-700/80'
              }`}
            >
              ทั้งหมด
            </button>

            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`shrink-0 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-md ${
                  selectedCategory === cat.name
                    ? 'bg-indigo-600 text-white shadow-indigo-500/30'
                    : 'glass-card text-slate-300 hover:text-white border-slate-700/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section Grouped by Category */}
        {totalCount > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedLinks).map(([categoryName, items]) => (
              <section key={categoryName} className="space-y-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                    <Gamepad2 className="h-4 w-4" />
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-indigo-400 tracking-tight">
                    {categoryName}
                  </h2>
                  <span className="text-xs font-bold text-slate-500">({items.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item) => (
                    <ArcadeCard key={item.id} link={item} onOpen={handleOpenLink} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center my-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">ไม่พบสื่อหรือเกมที่ค้นหา</h3>
            <p className="text-xs text-slate-400 mb-5">ลองค้นหาด้วยคำอื่น หรือเลือกหมวดหมู่อื่นดูครับ</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ทั้งหมด');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
            >
              แสดงสื่อทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-500 text-xs border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <p>{settings.footerText || '© 2026 EduHub Arcade • คลังสื่อการสอนและเกมอิเล็กทรอนิกส์สำหรับครู'}</p>
      </footer>

      {/* Modals & Fullscreen Iframe */}
      <InteractiveToolModal
        tool={activeInteractiveTool}
        onClose={() => setActiveInteractiveTool(null)}
      />

      {activeIframeLink && (
        <IframeViewer link={activeIframeLink} onClose={() => setActiveIframeLink(null)} />
      )}

      {lockedTargetLink && (
        <PinLockModal
          isOpen={!!lockedTargetLink}
          onClose={() => setLockedTargetLink(null)}
          correctPin={settings.userPin || '9999'}
          itemTitle={lockedTargetLink.name}
          onSuccess={() => {
            const target = lockedTargetLink;
            setLockedTargetLink(null);
            launchItem(target);
          }}
        />
      )}

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        correctPin={settings.adminPin || '1234'}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminPanelOpen(true);
        }}
      />

      {isAdminPanelOpen && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
          links={links}
          onUpdateLinks={handleUpdateLinks}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      )}
    </div>
  );
};
