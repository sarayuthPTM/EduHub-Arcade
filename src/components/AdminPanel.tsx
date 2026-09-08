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
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { ArcadeLink, SiteSettings } from '../types';
import { getToolStats, getTotalVisits } from '../lib/arcade-service';

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
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    setTableLinks(links);
  }, [links]);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  // Render Bar Chart on Dashboard
  useEffect(() => {
    if (activeTab === 'dashboard' && chartRef.current) {
      const stats = getToolStats();
      const labels = Object.keys(stats);
      const data = Object.values(stats);

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
              backgroundColor: '#4f46e5',
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#64748b' },
              grid: { color: '#f1f5f9' },
            },
            x: {
              ticks: { color: '#64748b', font: { family: 'Prompt' } },
              grid: { display: false },
            },
          },
        },
      });
    }
  }, [activeTab]);

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

  const handleSaveLinks = () => {
    onUpdateLinks(tableLinks);
    showNotice('บันทึกตารางสื่อการสอนเรียบร้อยแล้ว!');
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
  const topTool = Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'ยังไม่มีข้อมูล';

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
            <h3 className="text-2xl font-bold text-slate-800">สถิติการใช้งานระบบ</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 border-l-4 border-l-indigo-600">
                <div className="text-xs font-semibold text-slate-500 mb-1">การเข้าใช้งานรวมทั้งหมด</div>
                <div className="text-4xl font-extrabold text-slate-800">{totalVisits.toLocaleString()}</div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 border-l-4 border-l-emerald-600">
                <div className="text-xs font-semibold text-slate-500 mb-1">ระบบยอดนิยมอันดับ 1</div>
                <div className="text-2xl font-extrabold text-slate-800 truncate mt-1">{topTool}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h4 className="font-bold text-base text-slate-700 mb-4">กราฟความนิยมการใช้งานสื่อ</h4>
              <div className="h-72 w-full">
                <canvas ref={chartRef} />
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

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="ค้นหาเมนู..."
                    className="pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-44"
                  />
                </div>
                <button
                  onClick={handleAddLink}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> เพิ่มสื่อใหม่
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
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
                  {filteredLinks.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition">
                      <td className="p-2.5">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => handleUpdateRow(item.id, { category: e.target.value })}
                          className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                        />
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
                  ))}
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
