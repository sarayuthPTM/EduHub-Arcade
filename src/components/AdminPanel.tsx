import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  Layers,
  Settings,
  Plus,
  Trash2,
  Save,
  Search,
  Upload,
  LogOut,
  CheckCircle2,
  RotateCcw,
  Download,
  Eye,
  Trophy,
  PlayCircle,
  Gamepad2,
  PieChart as PieChartIcon,
  Clock,
  TrendingUp,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { ArcadeLink, SiteSettings } from '../types';
import {
  getToolStats,
  getTotalVisits,
  getTotalToolLaunches,
  getRecentLogs,
  resetAllStats,
} from '../lib/arcade-service';

Chart.register(...registerables);

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  links: ArcadeLink[];
  onUpdateLinks: (newLinks: ArcadeLink[]) => void;
  settings: SiteSettings;
  onUpdateSettings: (newSettings: SiteSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  links,
  onUpdateLinks,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'links' | 'settings'>('dashboard');
  const [tableLinks, setTableLinks] = useState<ArcadeLink[]>(links);
  const [formSettings, setFormSettings] = useState<SiteSettings>(settings);
  const [searchFilter, setSearchFilter] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [statsTimestamp, setStatsTimestamp] = useState(Date.now());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const doughnutRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutInstance = useRef<Chart | null>(null);

  useEffect(() => {
    setTableLinks(links);
  }, [links]);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // Render Bar Chart & Doughnut Chart on Dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      const stats = getToolStats();
      const labels = Object.keys(stats);
      const data = Object.values(stats);

      // 1. Tool Popularity Bar Chart
      if (chartRef.current) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new Chart(chartRef.current, {
          type: 'bar',
          data: {
            labels: labels.length > 0 ? labels : ['ยังไม่มีสถิติ'],
            datasets: [
              {
                label: 'จำนวนครั้งที่เข้าใช้งาน',
                data: data.length > 0 ? data : [0],
                backgroundColor: '#6366f1',
                borderRadius: 8,
                hoverBackgroundColor: '#4f46e5',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ใช้งาน: ${ctx.parsed.y} ครั้ง`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { stepSize: 1, color: '#64748b' },
                grid: { color: '#f1f5f9' },
              },
              x: {
                ticks: { color: '#64748b', font: { family: 'Prompt', size: 11 } },
                grid: { display: false },
              },
            },
          },
        });
      }

      // 2. Category Share Doughnut Chart
      if (doughnutRef.current) {
        if (doughnutInstance.current) {
          doughnutInstance.current.destroy();
        }

        const categoryCounts: Record<string, number> = {};
        links.forEach((l) => {
          const cat = l.category || 'ทั่วไป';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + (stats[l.name] || 0);
        });

        const catLabels = Object.keys(categoryCounts);
        const catValues = Object.values(categoryCounts);
        const hasValues = catValues.some((v) => v > 0);

        doughnutInstance.current = new Chart(doughnutRef.current, {
          type: 'doughnut',
          data: {
            labels: hasValues ? catLabels : ['ยังไม่มีข้อมูล'],
            datasets: [
              {
                data: hasValues ? catValues : [1],
                backgroundColor: hasValues ? ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'] : ['#e2e8f0'],
                borderWidth: 2,
                borderColor: '#ffffff',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { font: { family: 'Prompt', size: 11 }, boxWidth: 12 },
              },
            },
            cutout: '65%',
          },
        });
      }
    }
  }, [activeTab, statsTimestamp, links]);

  if (!isOpen) return null;

  const handleAddLink = () => {
    const newRow: ArcadeLink = {
      id: `link_${Date.now()}`,
      category: 'เครื่องมือครู',
      name: '',
      desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์',
      url: '',
      icon: 'gamepad',
      coverImage: '',
      copyUrl: '',
      status: 'เปิด',
      target: '_self',
      access: 'ทั่วไป',
    };
    setTableLinks([newRow, ...tableLinks]);
  };

  const handleUpdateRow = (id: string, updates: Partial<ArcadeLink>) => {
    setTableLinks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('ยืนยันการลบรายการนี้?')) {
      setTableLinks((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const moveLink = (id: string, direction: 'up' | 'down') => {
    setTableLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const newLinks = [...prev];
      const [item] = newLinks.splice(idx, 1);
      newLinks.splice(targetIdx, 0, item);
      return newLinks;
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedId;
    if (!sourceId || sourceId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setTableLinks((prev) => {
      const sourceIdx = prev.findIndex((l) => l.id === sourceId);
      const targetIdx = prev.findIndex((l) => l.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;
      const newLinks = [...prev];
      const [item] = newLinks.splice(sourceIdx, 1);
      newLinks.splice(targetIdx, 0, item);
      return newLinks;
    });
    setDraggedId(null);
    setDragOverId(null);
  };

  const categoriesInUse = (() => {
    const set = new Set<string>();
    (formSettings.categoryOrder || ['เครื่องมือครู', 'เกมเพื่อการเรียนรู้']).forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    tableLinks.forEach((l) => {
      if (l.category && l.category.trim()) set.add(l.category.trim());
    });
    return Array.from(set);
  })();

  const moveCategory = (categoryName: string, direction: 'left' | 'right') => {
    const currentOrder = [...categoriesInUse];
    const idx = currentOrder.indexOf(categoryName);
    if (idx === -1) return;
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;

    const [removed] = currentOrder.splice(idx, 1);
    currentOrder.splice(targetIdx, 0, removed);
    setFormSettings((prev) => ({ ...prev, categoryOrder: currentOrder }));
  };

  const handleAddNewCategory = () => {
    const name = window.prompt('ระบุชื่อหมวดหมู่ใหม่ที่ต้องการเพิ่ม:');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (categoriesInUse.includes(trimmed)) {
      showNotice(`หมวดหมู่ "${trimmed}" มีอยู่ในระบบแล้ว`);
      return;
    }
    const newOrder = [...categoriesInUse, trimmed];
    setFormSettings((prev) => ({ ...prev, categoryOrder: newOrder }));
    showNotice(`เพิ่มหมวดหมู่ใหม่ "${trimmed}" เรียบร้อยแล้ว!`);
  };

  const handleSaveLinks = () => {
    onUpdateLinks(tableLinks);
    onUpdateSettings(formSettings);
    showNotice('บันทึกตารางสื่อการสอนและลำดับหมวดหมู่เรียบร้อยแล้ว!');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formSettings);
    showNotice('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!');
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUploadImage = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        handleUpdateRow(id, { coverImage: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const stats = getToolStats();
  const totalVisits = getTotalVisits();
  const totalToolLaunches = getTotalToolLaunches();
  const recentLogs = getRecentLogs();
  const topToolEntry = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
  const topTool = topToolEntry?.[0] || 'ยังไม่มีข้อมูล';
  const topToolCount = topToolEntry?.[1] || 0;

  const totalLinksCount = links.length;
  const classroomCount = links.filter((l) => l.category === 'เครื่องมือครู').length;
  const gamesCount = links.filter((l) => l.category === 'เกมเพื่อการเรียนรู้').length;

  const rankedTools = Object.entries(stats)
    .map(([name, count]) => {
      const link = links.find((l) => l.name === name);
      const category = link?.category || 'ทั่วไป';
      const percentage = totalToolLaunches > 0 ? Math.round((count / totalToolLaunches) * 100) : 0;
      return { name, category, count, percentage };
    })
    .sort((a, b) => b.count - a.count);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'ลำดับ,ชื่อสื่อและเกม,หมวดหมู่,จำนวนครั้งที่เปิดใช้งาน,สัดส่วน (%)\n';
    rankedTools.forEach((tool, idx) => {
      csvContent += `${idx + 1},"${tool.name}","${tool.category}",${tool.count},${tool.percentage}%\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduHub_Arcade_สถิติการใช้งาน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('ดาวน์โหลดรายงานสถิติเป็นไฟล์ CSV เรียบร้อยแล้ว!');
  };

  const handleResetStats = () => {
    if (confirm('ยืนยันการรีเซ็ตสถิติทั้งหมด? ข้อมูลการเข้าชมและการเปิดสื่อจะถูกเริ่มนับ 1 ใหม่')) {
      resetAllStats();
      setStatsTimestamp(Date.now());
      showNotice('รีเซ็ตข้อมูลสถิติเรียบร้อยแล้ว!');
    }
  };

  const filteredLinks = tableLinks.filter((item) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-[#f8fafc] text-slate-800 overflow-hidden">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Settings className="h-5 w-5" /> Admin Panel
          </h2>
          <button onClick={onClose} className="md:hidden text-rose-500 font-bold">
            ปิด
          </button>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 text-left font-medium transition-all flex items-center gap-3 text-sm ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="h-4 w-4" /> แผงควบคุม
          </button>

          <button
            onClick={() => setActiveTab('links')}
            className={`px-6 py-3 text-left font-medium transition-all flex items-center gap-3 text-sm ${
              activeTab === 'links'
                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-4 w-4" /> จัดการสื่อ/เกม
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-left font-medium transition-all flex items-center gap-3 text-sm ${
              activeTab === 'settings'
                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="h-4 w-4" /> ตั้งค่าเว็บไซต์
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100 hidden md:block">
          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <LogOut className="h-3.5 w-3.5" /> ออกจากระบบแอดมิน
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
        {/* Toast Notification */}
        {notification && (
          <div className="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <section className="space-y-6">
            {/* Header & Controls Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                  สถิติการใช้งานระบบ (System Analytics)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  รายงานภาพรวมการเข้าใช้งานสื่อและเกมการศึกษาในโรงเรียน
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStatsTimestamp(Date.now());
                    showNotice('อัปเดตสถิติล่าสุดแล้ว');
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  title="รีเฟรชข้อมูล"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                  <span>รีเฟรช</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={rankedTools.length === 0}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  title="ส่งออกเป็น Excel / CSV"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-600" />
                  <span>ส่งออก CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetStats}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  title="รีเซ็ตสถิติ"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  <span>รีเซ็ตสถิติ</span>
                </button>
              </div>
            </div>

            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Visits */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-l-4 border-l-sky-500 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1">การเข้าชมเว็บรวม</span>
                  <div className="text-3xl font-black text-slate-800">{totalVisits.toLocaleString()}</div>
                  <span className="text-[11px] text-sky-600 font-medium">ครั้งที่เปิดเข้าใช้งาน</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <Eye className="h-6 w-6" />
                </div>
              </div>

              {/* Card 2: Total Tool Launches */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-l-4 border-l-indigo-600 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1">เปิดใช้งานสื่อทั้งหมด</span>
                  <div className="text-3xl font-black text-slate-800">{totalToolLaunches.toLocaleString()}</div>
                  <span className="text-[11px] text-indigo-600 font-medium">รอบการเล่น/ใช้เครื่องมือ</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <PlayCircle className="h-6 w-6" />
                </div>
              </div>

              {/* Card 3: Top Tool */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-l-4 border-l-amber-500 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">ระบบยอดนิยมอันดับ 1</span>
                  <div className="text-lg font-black text-slate-800 truncate" title={topTool}>
                    {topTool}
                  </div>
                  <span className="text-[11px] text-amber-600 font-bold">
                    {topToolCount > 0 ? `ใช้งานไปแล้ว ${topToolCount} ครั้ง` : 'ยังไม่มีสถิติ'}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                  <Trophy className="h-6 w-6" />
                </div>
              </div>

              {/* Card 4: Total Media Items */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 border-l-4 border-l-emerald-500 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 block mb-1">คลังสื่อและเกมในระบบ</span>
                  <div className="text-3xl font-black text-slate-800">{totalLinksCount}</div>
                  <span className="text-[11px] text-emerald-600 font-medium">
                    เครื่องมือครู {classroomCount} • เกม {gamesCount}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Gamepad2 className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Charts Section: Bar Chart & Doughnut Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar Chart (2 cols) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-bold text-sm text-slate-800">กราฟความนิยมการใช้งานสื่อ</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">แยกตามจำนวนครั้งที่กดใช้งาน</span>
                </div>
                <div className="h-72 w-full">
                  <canvas ref={chartRef} />
                </div>
              </div>

              {/* Doughnut Chart (1 col) */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-indigo-600" />
                    <h4 className="font-bold text-sm text-slate-800">สัดส่วนตามหมวดหมู่</h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">หมวดหมู่สื่อ</span>
                </div>
                <div className="h-64 w-full flex-1 flex items-center justify-center">
                  <canvas ref={doughnutRef} />
                </div>
              </div>
            </div>

            {/* Bottom 2 Columns: Leaderboard & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leaderboard Table */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  ตารางจัดอันดับสื่อที่มีผู้ใช้งานสูงสุด
                </h4>
                
                {rankedTools.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2">
                          <th className="pb-2 w-12 text-center">อันดับ</th>
                          <th className="pb-2">ชื่อสื่อ / เกม</th>
                          <th className="pb-2">หมวดหมู่</th>
                          <th className="pb-2 text-right">จำนวนครั้ง</th>
                          <th className="pb-2 w-28 pl-4">สัดส่วน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rankedTools.slice(0, 8).map((tool, idx) => (
                          <tr key={tool.name} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 text-center font-bold">
                              {idx === 0 && <span className="text-amber-500">🥇 1</span>}
                              {idx === 1 && <span className="text-slate-400">🥈 2</span>}
                              {idx === 2 && <span className="text-amber-700">🥉 3</span>}
                              {idx > 2 && <span className="text-slate-400 font-medium">{idx + 1}</span>}
                            </td>
                            <td className="py-2.5 font-bold text-slate-800 truncate max-w-[150px]">
                              {tool.name}
                            </td>
                            <td className="py-2.5 text-slate-500">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold">
                                {tool.category}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-black text-indigo-600">
                              {tool.count.toLocaleString()}
                            </td>
                            <td className="py-2.5 pl-4">
                              <div className="flex items-center gap-1.5">
                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${tool.percentage}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 w-7 text-right font-medium">
                                  {tool.percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    ยังไม่มีข้อมูลการเข้าใช้งานสื่อ
                  </div>
                )}
              </div>

              {/* Recent Activity Log Feed */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  ประวัติการเข้าใช้งานล่าสุด (Recent Activity)
                </h4>

                {recentLogs.length > 0 ? (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {recentLogs.slice(0, 8).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs hover:bg-indigo-50/50 hover:border-indigo-100 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 font-bold text-sm">
                            🎮
                          </span>
                          <div>
                            <span className="font-bold text-slate-800 block">{log.toolName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              หมวดหมู่: {log.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono text-slate-600 font-bold block">{log.time}</span>
                          <span className="text-[10px] text-slate-400">{log.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    ยังไม่มีบันทึกประวัติการใช้งาน
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Tab 2: Manage Links */}
        {activeTab === 'links' && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">จัดการสื่อการสอนและเกม</h3>
                <p className="text-xs text-slate-500 mt-0.5">เพิ่ม ลบ แก้ไข รายการสื่อที่แสดงบนหน้าเว็บ</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="ค้นหาเมนู..."
                    className="pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36 sm:w-44"
                  />
                </div>
                <button
                  onClick={handleAddLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> เพิ่มสื่อใหม่
                </button>
                <button
                  onClick={handleSaveLinks}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:shadow-md active:scale-95"
                  title="บันทึกข้อมูลตารางสื่อทั้งหมด"
                >
                  <Save className="h-4 w-4" /> 💾 บันทึกตารางสื่อทั้งหมด
                </button>
              </div>
            </div>

            {/* Category Order Control Box */}
            <div className="bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-purple-50/90 border border-indigo-100 p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-sm">
                    🏷️
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      ลำดับการแสดงหมวดหมู่บนหน้าเว็บ (Category Display Order)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      เลือกได้ว่าหมวดหมู่ไหนแสดงก่อน-หลัง (เช่น ให้ “เครื่องมือครู” หรือ “เกมเพื่อการเรียนรู้” ขึ้นก่อน)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1 cursor-pointer"
                    title="เพิ่มหมวดหมู่ใหม่"
                  >
                    <Plus className="h-3.5 w-3.5 text-indigo-600" />
                    <span>เพิ่มหมวดหมู่ใหม่</span>
                  </button>

                  {categoriesInUse.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const reversed = [...categoriesInUse].reverse();
                        setFormSettings((prev) => ({ ...prev, categoryOrder: reversed }));
                        showNotice(`สลับลำดับหมวดหมู่เรียบร้อยแล้ว: ${reversed.join(' → ')}`);
                      }}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="สลับหมวดหมู่อยู่ก่อน-อยู่หลังทันที"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 text-indigo-600" />
                      <span>สลับลำดับหมวดหมู่</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category Badges with Arrow Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100/60">
                <span className="text-[11px] font-bold text-slate-500 mr-1">ลำดับการแสดง:</span>
                {categoriesInUse.map((cat, idx) => (
                  <div
                    key={cat}
                    className="inline-flex items-center gap-2 bg-white border border-indigo-200 px-3 py-1.5 rounded-xl shadow-xs text-xs font-semibold text-slate-800"
                  >
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      ลำดับ {idx + 1}
                    </span>
                    <span>{cat}</span>
                    <div className="flex items-center ml-1 border-l border-slate-200 pl-1 gap-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCategory(cat, 'left')}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded disabled:opacity-25 disabled:cursor-not-allowed transition"
                        title="เลื่อนหมวดหมู่นี้ขึ้นก่อน"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categoriesInUse.length - 1}
                        onClick={() => moveCategory(cat, 'right')}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded disabled:opacity-25 disabled:cursor-not-allowed transition"
                        title="เลื่อนหมวดหมู่นี้ไปข้างหลัง"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                      {cat !== 'เครื่องมือครู' && cat !== 'เกมเพื่อการเรียนรู้' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`ยืนยันการลบหมวดหมู่ "${cat}" หรือไม่? (รายการที่อยู่ในหมวดนี้จะถูกเปลี่ยนเป็น "เครื่องมือครู")`)) {
                              setFormSettings((prev) => ({
                                ...prev,
                                categoryOrder: (prev.categoryOrder || []).filter((c) => c !== cat),
                              }));
                              setTableLinks((prev) =>
                                prev.map((l) => (l.category === cat ? { ...l, category: 'เครื่องมือครู' } : l))
                              );
                              showNotice(`ลบหมวดหมู่ "${cat}" เรียบร้อยแล้ว`);
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="ลบหมวดหมู่นี้"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instruction Tip */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5">
                <span className="text-indigo-600 font-bold">💡 คำแนะนำ:</span>
                คลิกลากไอคอน <GripVertical className="inline h-3.5 w-3.5 text-slate-400" /> เพื่อเรียงลำดับสื่อ หรือกดปุ่มลูกศรขึ้น/ลง เพื่อจัดลำดับก่อนหลัง
              </span>
              <span className="font-semibold text-slate-400">
                ทั้งหมด {tableLinks.length} รายการ
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="p-3 w-24 text-center">ลำดับ / ลาก</th>
                    <th className="p-3 w-32">หมวดหมู่</th>
                    <th className="p-3 w-48">ชื่อสื่อ/เกม</th>
                    <th className="p-3 w-48">URL (ลิงก์)</th>
                    <th className="p-3 w-56">รูปปก / ลิงก์ทำสำเนา</th>
                    <th className="p-3 w-44">การเปิด & สิทธิ์</th>
                    <th className="p-3 text-center w-20">สถานะ</th>
                    <th className="p-3 text-center w-16">ลบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLinks.map((item) => {
                    const rowIndex = tableLinks.findIndex((l) => l.id === item.id);
                    const isDragging = draggedId === item.id;
                    const isDragOver = dragOverId === item.id;

                    return (
                      <tr
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => handleDragOver(e, item.id)}
                        onDrop={(e) => handleDrop(e, item.id)}
                        onDragEnd={() => {
                          setDraggedId(null);
                          setDragOverId(null);
                        }}
                        className={`transition-colors duration-150 ${
                          isDragging ? 'opacity-40 bg-slate-100' : 'hover:bg-indigo-50/40'
                        } ${isDragOver ? 'border-t-2 border-indigo-600 bg-indigo-50/80' : ''}`}
                      >
                        {/* Drag Handle & Up/Down Ordering Buttons */}
                        <td className="p-2 text-center select-none">
                          <div className="flex items-center justify-center gap-1">
                            <span
                              className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                              title="คลิกลากแถวนี้เพื่อย้ายลำดับ"
                            >
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={rowIndex <= 0}
                                onClick={() => moveLink(item.id, 'up')}
                                className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-0.5 rounded transition disabled:opacity-20 disabled:cursor-not-allowed"
                                title="เลื่อนขึ้น"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={rowIndex >= tableLinks.length - 1}
                                onClick={() => moveLink(item.id, 'down')}
                                className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-0.5 rounded transition disabled:opacity-20 disabled:cursor-not-allowed"
                                title="เลื่อนลง"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono font-bold w-5 text-center">
                              {rowIndex + 1}
                            </span>
                          </div>
                        </td>

                        <td className="p-2.5 min-w-[160px]">
                          <select
                            value={item.category || (categoriesInUse[0] || 'เครื่องมือครู')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '__ADD_NEW__') {
                                const newCat = window.prompt('ระบุชื่อหมวดหมู่ใหม่:');
                                if (newCat && newCat.trim()) {
                                  const trimmed = newCat.trim();
                                  if (!categoriesInUse.includes(trimmed)) {
                                    setFormSettings((prev) => ({
                                      ...prev,
                                      categoryOrder: [...categoriesInUse, trimmed],
                                    }));
                                  }
                                  handleUpdateRow(item.id, { category: trimmed });
                                  showNotice(`เพิ่มหมวดหมู่ "${trimmed}" และเลือกให้รายการนี้เรียบร้อยแล้ว!`);
                                }
                              } else {
                                handleUpdateRow(item.id, { category: val });
                              }
                            }}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                          >
                            {item.category && !categoriesInUse.includes(item.category) && (
                              <option value={item.category}>{item.category}</option>
                            )}
                            {categoriesInUse.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                            <option value="__ADD_NEW__" className="text-indigo-600 font-bold bg-indigo-50">
                              ➕ + เพิ่มหมวดหมู่ใหม่...
                            </option>
                          </select>
                        </td>

                      <td className="p-2.5 space-y-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateRow(item.id, { name: e.target.value })}
                          placeholder="ชื่อสื่อ/เกม"
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                        <input
                          type="text"
                          value={item.desc || ''}
                          onChange={(e) => handleUpdateRow(item.id, { desc: e.target.value })}
                          placeholder="คำอธิบาย"
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-500"
                        />
                      </td>

                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.url}
                          onChange={(e) => handleUpdateRow(item.id, { url: e.target.value })}
                          placeholder="https://..."
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </td>

                      <td className="p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={item.coverImage || ''}
                            onChange={(e) => handleUpdateRow(item.id, { coverImage: e.target.value })}
                            placeholder="ลิงก์รูปปก"
                            className="flex-1 p-1.5 border border-slate-200 rounded-lg text-[11px]"
                          />
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 p-1.5 rounded-lg flex items-center justify-center">
                            <Upload className="h-3.5 w-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleUploadImage(item.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          {item.coverImage && (
                            <div className="h-7 w-9 shrink-0 overflow-hidden rounded border border-slate-300">
                              <img src={item.coverImage} alt="cover" className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.copyUrl || ''}
                          onChange={(e) => handleUpdateRow(item.id, { copyUrl: e.target.value })}
                          placeholder="ลิงก์ทำสำเนา (ถ้ามี)"
                          className="w-full p-1.5 border border-slate-200 rounded-lg text-[11px] text-slate-500"
                        />
                      </td>

                      <td className="p-2.5 space-y-1">
                        <select
                          value={item.target}
                          onChange={(e) => handleUpdateRow(item.id, { target: e.target.value as '_self' | '_blank' })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="_self">ฝัง Iframe ในเว็บ</option>
                          <option value="_blank">เปิดใหม่ (_blank)</option>
                        </select>

                        <select
                          value={item.access}
                          onChange={(e) => handleUpdateRow(item.id, { access: e.target.value as 'ทั่วไป' | 'ล็อก PIN' })}
                          className="w-full p-1.5 border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="ทั่วไป">ทั่วไป</option>
                          <option value="ล็อก PIN">ล็อก PIN</option>
                        </select>
                      </td>

                      <td className="p-2.5 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => handleUpdateRow(item.id, { status: e.target.value as 'เปิด' | 'ปิด' })}
                          className={`p-1 rounded-lg border text-xs font-bold ${
                            item.status === 'เปิด'
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : 'border-slate-300 bg-slate-100 text-slate-500'
                          }`}
                        >
                          <option value="เปิด">เปิด</option>
                          <option value="ปิด">ปิด</option>
                        </select>
                      </td>

                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => handleDeleteRow(item.id)}
                          className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition"
                          title="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSaveLinks}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2"
            >
              <Save className="h-4 w-4" /> 💾 บันทึกตารางสื่อทั้งหมด
            </button>
          </section>
        )}

        {/* Tab 3: System Settings */}
        {activeTab === 'settings' && (
          <section className="space-y-6 max-w-3xl">
            <h3 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ (System Settings)</h3>

            <form onSubmit={handleSaveSettings} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อโรงเรียน</label>
                  <input
                    type="text"
                    value={formSettings.schoolName}
                    onChange={(e) => setFormSettings({ ...formSettings, schoolName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อระบบ (หัวเว็บ)</label>
                  <input
                    type="text"
                    value={formSettings.topbarTitle}
                    onChange={(e) => setFormSettings({ ...formSettings, topbarTitle: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ลิงก์รูปภาพ Logo</label>
                <input
                  type="text"
                  value={formSettings.logoUrl || ''}
                  onChange={(e) => setFormSettings({ ...formSettings, logoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ประกาศแถบวิ่ง (Ticker)</label>
                  <input
                    type="text"
                    value={formSettings.announcement}
                    onChange={(e) => setFormSettings({ ...formSettings, announcement: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ความเร็วแถบวิ่ง</label>
                  <select
                    value={formSettings.tickerSpeed}
                    onChange={(e) => setFormSettings({ ...formSettings, tickerSpeed: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  >
                    <option value="35">ช้า (35s)</option>
                    <option value="25">ปกติ (25s)</option>
                    <option value="15">เร็ว (15s)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ข้อความ Footer</label>
                  <input
                    type="text"
                    value={formSettings.footerText}
                    onChange={(e) => setFormSettings({ ...formSettings, footerText: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">สีธีมหลัก</label>
                  <input
                    type="color"
                    value={formSettings.themeColor}
                    onChange={(e) => setFormSettings({ ...formSettings, themeColor: e.target.value })}
                    className="w-full h-10 p-1 border border-slate-300 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    🏷️ ลำดับการแสดงผลหมวดหมู่บนหน้าแรก (Category Display Order)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> เพิ่มหมวดหมู่
                    </button>
                    {categoriesInUse.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const reversed = [...categoriesInUse].reverse();
                          setFormSettings((prev) => ({ ...prev, categoryOrder: reversed }));
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowUpDown className="h-3 w-3" /> สลับลำดับ
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {categoriesInUse.map((cat, idx) => (
                    <div
                      key={cat}
                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700"
                    >
                      <span className="text-[10px] font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-100">
                        {idx + 1}
                      </span>
                      <span>{cat}</span>
                      <div className="flex items-center ml-1 border-l border-slate-200 pl-1 gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveCategory(cat, 'left')}
                          className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-25"
                          title="เลื่อนขึ้นก่อน"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categoriesInUse.length - 1}
                          onClick={() => moveCategory(cat, 'right')}
                          className="p-0.5 text-slate-400 hover:text-indigo-600 disabled:opacity-25"
                          title="เลื่อนไปข้างหลัง"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-indigo-600 mb-1">🔑 รหัสเข้าหน้า Admin (Admin PIN)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formSettings.adminPin}
                    onChange={(e) => setFormSettings({ ...formSettings, adminPin: e.target.value })}
                    className="w-full p-2.5 border border-indigo-200 rounded-xl bg-indigo-50/50 text-center font-bold tracking-widest text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-600 mb-1">🔒 รหัสเข้าเล่นเกม (User PIN)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formSettings.userPin}
                    onChange={(e) => setFormSettings({ ...formSettings, userPin: e.target.value })}
                    className="w-full p-2.5 border border-amber-200 rounded-xl bg-amber-50/50 text-center font-bold tracking-widest text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">Google Sheets Webhook URL (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={formSettings.googleSheetsWebhookUrl || ''}
                  onChange={(e) => setFormSettings({ ...formSettings, googleSheetsWebhookUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition"
              >
                💾 บันทึกการตั้งค่าระบบ
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};
