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
  Copy,
  CloudUpload,
  CloudDownload,
  Database,
  Code,
  AlertTriangle,
  Check,
  ExternalLink,
  X,
  Image as ImageIcon,
  FileSpreadsheet,
  Activity,
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { ArcadeLink, SiteSettings, BannerItem, ActivityLog } from '../types';
import {
  resetAllStats,
  getFilteredStats,
  exportBackupJson,
  importBackupJson,
  backupToGoogleSheets,
  restoreFromGoogleSheets,
  syncLinksToGoogleSheets,
  fetchLinksFromGoogleSheets,
  checkLinkHealth,
} from '../lib/arcade-service';
import { GOOGLE_APPS_SCRIPT_BACKEND_CODE } from '../lib/google-apps-script-code';
import { compressImageFile } from '../lib/image-compressor';
import { compressSettingsImages } from '../lib/settings-service';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'links' | 'banners' | 'settings'>('dashboard');
  const [tableLinks, setTableLinks] = useState<ArcadeLink[]>(links);
  const [formSettings, setFormSettings] = useState<SiteSettings>(settings);
  const [searchFilter, setSearchFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);
  const [statsTimestamp, setStatsTimestamp] = useState(Date.now());
  const [timeRange, setTimeRange] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Modals & Async States
  const [previewLink, setPreviewLink] = useState<ArcadeLink | null>(null);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isCheckingLinks, setIsCheckingLinks] = useState(false);
  const [linkHealthMap, setLinkHealthMap] = useState<Record<string, { status: 'healthy' | 'warning' | 'error'; label: string }>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

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
      const filtered = getFilteredStats(timeRange);
      const stats = filtered.stats;
      const labels = Object.keys(stats);
      const data: number[] = Object.values(stats);

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
                data: (data.length > 0 ? data : [0]) as number[],
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
        const catValues: number[] = Object.values(categoryCounts);
        const hasValues = catValues.some((v) => v > 0);

        doughnutInstance.current = new Chart(doughnutRef.current, {
          type: 'doughnut',
          data: {
            labels: hasValues ? catLabels : ['ยังไม่มีข้อมูล'],
            datasets: [
              {
                data: (hasValues ? catValues : [1]) as number[],
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
  }, [activeTab, statsTimestamp, timeRange, links]);

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

  const handleDuplicateRow = (item: ArcadeLink) => {
    const duplicated: ArcadeLink = {
      ...item,
      id: `link_${Date.now()}`,
      name: `${item.name} (สำเนา)`,
    };
    const idx = tableLinks.findIndex((l) => l.id === item.id);
    const updated = [...tableLinks];
    updated.splice(idx + 1, 0, duplicated);
    setTableLinks(updated);
    showNotice(`ทำสำเนา "${item.name}" เรียบร้อยแล้ว!`);
  };

  const handleCheckAllLinks = () => {
    setIsCheckingLinks(true);
    const newHealthMap: Record<string, { status: 'healthy' | 'warning' | 'error'; label: string }> = {};
    tableLinks.forEach((item) => {
      newHealthMap[item.id] = checkLinkHealth(item.url, item.target);
    });
    setLinkHealthMap(newHealthMap);
    setIsCheckingLinks(false);
    showNotice(`ตรวจสอบความถูกต้องของลิงก์ทั้ง ${tableLinks.length} รายการเรียบร้อยแล้ว!`);
  };

  // Google Sheets Sync & Backup Handlers
  const handleBackupToSheets = async () => {
    if (!formSettings.googleSheetsWebhookUrl) {
      alert('กรุณาระบุ Google Sheets Webhook URL ในแท็บตั้งค่าระบบก่อนสำรองข้อมูล');
      return;
    }
    setIsBackingUp(true);
    const res = await backupToGoogleSheets(formSettings.googleSheetsWebhookUrl, tableLinks, formSettings);
    setIsBackingUp(false);
    showNotice(res.message);
  };

  const handleRestoreFromSheets = async () => {
    if (!formSettings.googleSheetsWebhookUrl) {
      alert('กรุณาระบุ Google Sheets Webhook URL ในแท็บตั้งค่าระบบก่อนกู้คืนข้อมูล');
      return;
    }
    if (!confirm('ยืนยันการกู้คืนข้อมูลจาก Google Sheets? ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลล่าสุดจากคลาวด์')) {
      return;
    }
    setIsRestoring(true);
    const res = await restoreFromGoogleSheets(formSettings.googleSheetsWebhookUrl);
    setIsRestoring(false);
    if (res.success && res.links) {
      setTableLinks(res.links);
      onUpdateLinks(res.links);
      if (res.settings) {
        setFormSettings(res.settings);
        onUpdateSettings(res.settings);
      }
      showNotice(res.message);
    } else {
      alert(res.message);
    }
  };

  const handleSyncLinksToSheets = async () => {
    if (!formSettings.googleSheetsWebhookUrl) {
      alert('กรุณาระบุ Google Sheets Webhook URL ในแท็บตั้งค่าระบบ');
      return;
    }
    setIsSyncing(true);
    const res = await syncLinksToGoogleSheets(formSettings.googleSheetsWebhookUrl, tableLinks);
    setIsSyncing(false);
    showNotice(res.message);
  };

  const handleFetchLinksFromSheets = async () => {
    if (!formSettings.googleSheetsWebhookUrl) {
      alert('กรุณาระบุ Google Sheets Webhook URL ในแท็บตั้งค่าระบบ');
      return;
    }
    if (!confirm('ต้องการดึงรายชื่อสื่อจาก Google Sheets มาอัปเดตลงในระบบหรือไม่?')) return;
    setIsSyncing(true);
    const res = await fetchLinksFromGoogleSheets(formSettings.googleSheetsWebhookUrl);
    setIsSyncing(false);
    if (res.success && res.links) {
      setTableLinks(res.links);
      onUpdateLinks(res.links);
      showNotice(res.message);
    } else {
      alert(res.message);
    }
  };

  // Offline JSON Backup Handlers
  const handleExportJson = () => {
    exportBackupJson(tableLinks, formSettings);
    showNotice('ดาวน์โหลดไฟล์สำรองข้อมูล JSON ไปยังเครื่องเรียบร้อยแล้ว!');
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const res = importBackupJson(text);
      if (res.success && res.links) {
        setTableLinks(res.links);
        onUpdateLinks(res.links);
        if (res.settings) {
          setFormSettings(res.settings);
          onUpdateSettings(res.settings);
        }
        showNotice(`นำเข้าข้อมูลจากไฟล์ JSON สำเร็จ (${res.links.length} รายการ)!`);
      } else {
        alert(res.error || 'ไฟล์ JSON รูปแบบไม่ถูกต้อง');
      }
    };
    reader.readAsText(file);
  };

  // Banner Management Handlers
  const handleAddBanner = () => {
    const newBanner: BannerItem = {
      id: `banner_${Date.now()}`,
      title: 'สื่อการเรียนรู้แนะนำประจำสัปดาห์',
      subtitle: 'คลิกเพื่อเข้าเรียนรู้และทำกิจกรรมเสริมทักษะในห้องเรียน',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80',
      linkUrl: '',
      active: true,
    };
    const updated = [...(formSettings.banners || []), newBanner];
    setFormSettings((prev) => ({ ...prev, banners: updated }));
    onUpdateSettings({ ...formSettings, banners: updated });
    showNotice('เพิ่มสไลด์แบนเนอร์ใหม่เรียบร้อยแล้ว!');
  };

  const handleUpdateBanner = (bannerId: string, updates: Partial<BannerItem>) => {
    const updated = (formSettings.banners || []).map((b) =>
      b.id === bannerId ? { ...b, ...updates } : b
    );
    setFormSettings((prev) => ({ ...prev, banners: updated }));
  };

  const handleDeleteBanner = (bannerId: string) => {
    if (confirm('ยืนยันการลบแบนเนอร์นี้?')) {
      const updated = (formSettings.banners || []).filter((b) => b.id !== bannerId);
      setFormSettings((prev) => ({ ...prev, banners: updated }));
      onUpdateSettings({ ...formSettings, banners: updated });
      showNotice('ลบแบนเนอร์เรียบร้อยแล้ว');
    }
  };

  const moveBanner = (bannerId: string, direction: 'up' | 'down') => {
    const list = [...(formSettings.banners || [])];
    const idx = list.findIndex((b) => b.id === bannerId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const [item] = list.splice(idx, 1);
    list.splice(targetIdx, 0, item);
    setFormSettings((prev) => ({ ...prev, banners: list }));
    onUpdateSettings({ ...formSettings, banners: list });
  };

  const handleBannerImageUpload = async (bannerId: string, file: File) => {
    try {
      setIsProcessingImage(true);
      showNotice('กำลังประมวลผลและปรับขนาดภาพแบนเนอร์...');
      const optimizedBase64 = await compressImageFile(file, {
        maxWidth: 1280,
        maxHeight: 480,
        quality: 0.82,
        mimeType: 'image/jpeg',
      });
      if (optimizedBase64) {
        handleUpdateBanner(bannerId, { imageUrl: optimizedBase64 });
        showNotice('อัปโหลดและปรับขนาดภาพแบนเนอร์เรียบร้อยแล้ว! อย่าลืมกด "บันทึกแบนเนอร์"');
      }
    } catch (err) {
      console.error('Error processing banner image:', err);
      showNotice('เกิดข้อผิดพลาดในการประมวลผลภาพ');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSaveBanners = async () => {
    try {
      setIsProcessingImage(true);
      showNotice('กำลังบันทึกข้อมูลแบนเนอร์...');
      const cleanSettings = await compressSettingsImages(formSettings);
      setFormSettings(cleanSettings);
      onUpdateSettings(cleanSettings);
      showNotice('บันทึกข้อมูลแบนเนอร์เรียบร้อยแล้ว! (บันทึกถาวรลงเครื่อง)');
    } catch (e) {
      console.error('Error saving banners:', e);
      onUpdateSettings(formSettings);
      showNotice('บันทึกข้อมูลแบนเนอร์เรียบร้อยแล้ว!');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSaveLinks = () => {
    onUpdateLinks(tableLinks);
    onUpdateSettings(formSettings);
    showNotice('บันทึกตารางสื่อการสอนและลำดับหมวดหมู่เรียบร้อยแล้ว!');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessingImage(true);
      showNotice('กำลังบันทึกการตั้งค่าระบบ...');
      const cleanSettings = await compressSettingsImages(formSettings);
      setFormSettings(cleanSettings);
      onUpdateSettings(cleanSettings);
      showNotice('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!');
    } catch (err) {
      console.error('Error saving settings:', err);
      onUpdateSettings(formSettings);
      showNotice('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleUploadImage = async (id: string, file: File) => {
    try {
      setIsProcessingImage(true);
      showNotice('กำลังบีบอัดรูปภาพหน้าปก...');
      const optimizedBase64 = await compressImageFile(file, {
        maxWidth: 640,
        maxHeight: 360,
        quality: 0.80,
        mimeType: 'image/jpeg',
      });
      if (optimizedBase64) {
        handleUpdateRow(id, { coverImage: optimizedBase64 });
        showNotice('อัปโหลดและปรับขนาดภาพหน้าปกเรียบร้อยแล้ว!');
      }
    } catch (err) {
      console.error('Error processing cover image:', err);
      showNotice('เกิดข้อผิดพลาดในการประมวลผลภาพหน้าปก');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleUploadLogo = async (file: File) => {
    try {
      setIsProcessingImage(true);
      showNotice('กำลังประมวลผลรูป Logo...');
      const optimizedBase64 = await compressImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        mimeType: file.type === 'image/png' ? 'image/png' : 'image/webp',
      });
      if (optimizedBase64) {
        setFormSettings((prev) => ({ ...prev, logoUrl: optimizedBase64 }));
        showNotice('อัปโหลดรูป Logo เรียบร้อยแล้ว! กดบันทึกการตั้งค่าเพื่อบันทึกถาวร');
      }
    } catch (err) {
      console.error('Error processing logo:', err);
      showNotice('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ Logo');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Filtered stats based on active timeRange
  const filteredStatsData = getFilteredStats(timeRange);
  const stats = filteredStatsData.stats;
  const totalVisits = filteredStatsData.totalVisits;
  const totalToolLaunches = filteredStatsData.totalToolLaunches;
  const recentLogs = filteredStatsData.logs;
  const topTool = filteredStatsData.topTool;
  const topToolCount = filteredStatsData.topToolCount;

  const totalLinksCount = links.length;
  const classroomCount = links.filter((l) => l.category === 'เครื่องมือครู').length;
  const gamesCount = links.filter((l) => l.category === 'เกมเพื่อการเรียนรู้').length;

  const rankedTools = (Object.entries(stats) as [string, number][])
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
    link.setAttribute('download', `EduHub_Arcade_สถิติการใช้งาน_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const availableBadges = [
    { value: '', label: '— ไม่มีป้าย —' },
    { value: '🔥 ยอดนิยม', label: '🔥 ยอดนิยม' },
    { value: '✨ มาใหม่', label: '✨ มาใหม่' },
    { value: '⭐ แนะนำ', label: '⭐ แนะนำ' },
    { value: '🎯 ประถม', label: '🎯 ประถม' },
    { value: '🚀 ม.ต้น', label: '🚀 ม.ต้น' },
    { value: '🎓 ม.ปลาย', label: '🎓 ม.ปลาย' },
  ];

  const filteredLinks = tableLinks.filter((item) => {
    if (badgeFilter !== 'all') {
      if (badgeFilter === 'none' && item.badge) return false;
      if (badgeFilter !== 'none' && item.badge !== badgeFilter) return false;
    }
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.url.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q))
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
            onClick={() => setActiveTab('banners')}
            className={`px-6 py-3 text-left font-medium transition-all flex items-center gap-3 text-sm ${
              activeTab === 'banners'
                ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ImageIcon className="h-4 w-4" /> แบนเนอร์หน้าแรก
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

            {/* Time-based Analytics Filter Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-600" /> กรองสถิติตามเวลา:
                </span>
                <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1">
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'today', label: 'วันนี้' },
                    { id: '7d', label: '7 วันล่าสุด' },
                    { id: '30d', label: '30 วันล่าสุด' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTimeRange(tab.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        timeRange === tab.id
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                {timeRange === 'all' && '📌 สถิติสะสมทั้งหมดตั้งแต่เริ่มระบบ'}
                {timeRange === 'today' && '📌 สถิติเฉพาะวันนี้ (ตั้งแต่ 00:00 เป็นต้นมา)'}
                {timeRange === '7d' && '📌 สถิติย้อนหลัง 7 วัน'}
                {timeRange === '30d' && '📌 สถิติย้อนหลัง 30 วัน'}
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
                    {recentLogs.slice(0, 8).map((log: ActivityLog) => (
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
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="h-6 w-6 text-indigo-600" /> จัดการสื่อการสอนและเกม
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">เพิ่ม ลบ แก้ไข ป้ายกำกับ และซิงก์ข้อมูลคลังสื่อการศึกษาของโรงเรียน</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="ค้นหาชื่อ/URL..."
                    className="pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none w-36 sm:w-44 bg-white"
                  />
                </div>

                {/* Badge Filter Dropdown */}
                <select
                  value={badgeFilter}
                  onChange={(e) => setBadgeFilter(e.target.value)}
                  className="p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  title="กรองตามป้ายกำกับ"
                >
                  <option value="all">🏷️ ป้ายทั้งหมด</option>
                  <option value="none">⚪ ไม่มีป้าย</option>
                  <option value="🔥 ยอดนิยม">🔥 ยอดนิยม</option>
                  <option value="✨ มาใหม่">✨ มาใหม่</option>
                  <option value="⭐ แนะนำ">⭐ แนะนำ</option>
                  <option value="🎯 ประถม">🎯 ประถม</option>
                  <option value="🚀 ม.ต้น">🚀 ม.ต้น</option>
                  <option value="🎓 ม.ปลาย">🎓 ม.ปลาย</option>
                </select>

                {/* Broken Link Checker */}
                <button
                  type="button"
                  onClick={handleCheckAllLinks}
                  disabled={isCheckingLinks}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="ตรวจสอบความถูกต้องของ URL และข้อควรระวัง Iframe"
                >
                  <Activity className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{isCheckingLinks ? 'กำลังตรวจ...' : '🔍 ตรวจสอบลิงก์'}</span>
                </button>

                {/* Google Sheets Two-way Sync buttons */}
                <button
                  type="button"
                  onClick={handleFetchLinksFromSheets}
                  disabled={isSyncing}
                  className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="ดึงข้อมูลสื่อการสอนล่าสุดจาก Google Sheets"
                >
                  <CloudDownload className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{isSyncing ? 'กำลังดึง...' : '📥 ดึงจาก Sheets'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncLinksToSheets}
                  disabled={isSyncing}
                  className="bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="ส่งรายการสื่อขึ้น Google Sheets"
                >
                  <CloudUpload className="h-3.5 w-3.5 text-indigo-600" />
                  <span>{isSyncing ? 'กำลังส่ง...' : '📤 ส่งขึ้น Sheets'}</span>
                </button>

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
                  <Save className="h-4 w-4" /> 💾 บันทึกตารางสื่อ
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
                คลิกลากไอคอน <GripVertical className="inline h-3.5 w-3.5 text-slate-400" /> เพื่อเรียงลำดับ หรือกด <Eye className="inline h-3.5 w-3.5 text-indigo-600" /> เพื่อทดสอบเปิดดูทันที
              </span>
              <span className="font-semibold text-slate-400">
                ทั้งหมด {filteredLinks.length} จาก {tableLinks.length} รายการ
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                    <th className="p-3 w-20 text-center">ลำดับ/ลาก</th>
                    <th className="p-3 w-32">หมวดหมู่</th>
                    <th className="p-3 w-28">ป้ายกำกับ</th>
                    <th className="p-3 w-44">ชื่อสื่อ/เกม</th>
                    <th className="p-3 w-48">URL (ลิงก์)</th>
                    <th className="p-3 w-48">รูปปก / ลิงก์ทำสำเนา</th>
                    <th className="p-3 w-36">การเปิด & สิทธิ์</th>
                    <th className="p-3 text-center w-20">สถานะ</th>
                    <th className="p-3 text-center w-28">จัดการ</th>
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

                        {/* Category Dropdown */}
                        <td className="p-2.5 min-w-[140px]">
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

                        {/* Badge / Tag Selector */}
                        <td className="p-2 min-w-[110px]">
                          <select
                            value={item.badge || ''}
                            onChange={(e) => handleUpdateRow(item.id, { badge: e.target.value })}
                            className="w-full p-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {availableBadges.map((b) => (
                              <option key={b.value} value={b.value}>
                                {b.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Name & Desc */}
                        <td className="p-2.5 space-y-1 min-w-[160px]">
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

                        {/* URL with Health Status Badge */}
                        <td className="p-2.5 space-y-1 min-w-[170px]">
                          <input
                            type="text"
                            value={item.url}
                            onChange={(e) => {
                              handleUpdateRow(item.id, { url: e.target.value });
                              if (linkHealthMap[item.id]) {
                                setLinkHealthMap((prev) => {
                                  const copy = { ...prev };
                                  delete copy[item.id];
                                  return copy;
                                });
                              }
                            }}
                            placeholder="https://..."
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                          />
                          {linkHealthMap[item.id] && (
                            <div
                              className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                                linkHealthMap[item.id].status === 'healthy'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : linkHealthMap[item.id].status === 'warning'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {linkHealthMap[item.id].status === 'healthy' && <Check className="h-3 w-3 text-emerald-600" />}
                              {linkHealthMap[item.id].status === 'warning' && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                              {linkHealthMap[item.id].status === 'error' && <X className="h-3 w-3 text-rose-600" />}
                              <span className="truncate">{linkHealthMap[item.id].label}</span>
                            </div>
                          )}
                        </td>

                        {/* Cover Image & Copy URL */}
                        <td className="p-2.5 space-y-1 min-w-[170px]">
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

                        {/* Target & Access */}
                        <td className="p-2.5 space-y-1 min-w-[130px]">
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

                        {/* Status */}
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

                        {/* Actions (Preview, Duplicate, Delete) */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewLink(item)}
                              className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                              title="👁️ ทดสอบเปิดดูลิงก์ทันที (Quick Preview)"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(item)}
                              className="text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition"
                              title="📑 ทำสำเนาแถวนี้ (Duplicate Row)"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(item.id)}
                              className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition"
                              title="🗑️ ลบรายการนี้"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSaveLinks}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="h-4 w-4" /> 💾 บันทึกตารางสื่อทั้งหมด
            </button>
          </section>
        )}

        {/* Tab 3: Banners Management */}
        {activeTab === 'banners' && (
          <section className="space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="h-6 w-6 text-indigo-600" /> แบนเนอร์ประชาสัมพันธ์หน้าแรก (Hero Banner Slider)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  จัดการภาพสไลด์ประชาสัมพันธ์กิจกรรม ข่าวสาร และสื่อแนะนำสำหรับหน้าแรก
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddBanner}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> เพิ่มแบนเนอร์ใหม่
                </button>
                <button
                  type="button"
                  onClick={handleSaveBanners}
                  disabled={isProcessingImage}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer hover:shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {isProcessingImage ? 'กำลังบันทึก...' : '💾 บันทึกแบนเนอร์'}
                </button>
              </div>
            </div>

            {/* Banner List */}
            <div className="space-y-4">
              {(formSettings.banners || []).length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  ยังไม่มีสไลด์แบนเนอร์ กดปุ่ม "เพิ่มแบนเนอร์ใหม่" เพื่อเริ่มต้น
                </div>
              ) : (
                (formSettings.banners || []).map((banner, index) => (
                  <div
                    key={banner.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-indigo-200 transition"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 font-bold text-xs px-2.5 py-1 rounded-lg">
                          สไลด์ที่ {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {banner.title || 'ไม่มีหัวข้อ'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={banner.active !== false}
                            onChange={(e) => handleUpdateBanner(banner.id, { active: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span>แสดงสไลด์นี้</span>
                        </label>

                        <div className="flex items-center ml-2 border-l border-slate-200 pl-2 gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => moveBanner(banner.id, 'up')}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded disabled:opacity-20 transition"
                            title="เลื่อนขึ้น"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={index === (formSettings.banners || []).length - 1}
                            onClick={() => moveBanner(banner.id, 'down')}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded disabled:opacity-20 transition"
                            title="เลื่อนลง"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition ml-1"
                            title="ลบสไลด์นี้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Image Preview & Upload */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600">รูปภาพแบนเนอร์</label>
                        <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt="banner"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                              ไม่มีรูปภาพ
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={banner.imageUrl || ''}
                            onChange={(e) => handleUpdateBanner(banner.id, { imageUrl: e.target.value })}
                            placeholder="https://... หรืออัปโหลด"
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                          />
                          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 p-2 rounded-lg flex items-center justify-center shrink-0">
                            <Upload className="h-3.5 w-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleBannerImageUpload(banner.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Title & Details */}
                      <div className="md:col-span-2 space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">หัวข้อหลัก (Title)</label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) => handleUpdateBanner(banner.id, { title: e.target.value })}
                            placeholder="เช่น คลังเกมพัฒนาทักษะคณิตศาสตร์สำหรับเด็ก"
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">คำบรรยายย่อย (Subtitle)</label>
                          <input
                            type="text"
                            value={banner.subtitle || ''}
                            onChange={(e) => handleUpdateBanner(banner.id, { subtitle: e.target.value })}
                            placeholder="เช่น ฝึกคิดเลขเร็ว สนุก ปลอดภัย ไม่มีโฆษณารบกวน"
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs text-slate-600"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">ลิงก์ปลายทางเมื่อคลิก (Link URL - ถ้ามี)</label>
                          <input
                            type="text"
                            value={banner.linkUrl || ''}
                            onChange={(e) => handleUpdateBanner(banner.id, { linkUrl: e.target.value })}
                            placeholder="https://... (เว้นว่างไว้หากไม่ต้องการให้คลิก)"
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono text-slate-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveBanners}
              disabled={isProcessingImage}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {isProcessingImage ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกแบนเนอร์ทั้งหมด'}
            </button>
          </section>
        )}

        {/* Tab 4: System Settings */}
        {activeTab === 'settings' && (
          <section className="space-y-6 max-w-4xl">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="h-6 w-6 text-indigo-600" /> ตั้งค่าระบบ & ฐานข้อมูลสำรอง (System Settings & Cloud DB)
            </h3>

            {/* Cloud Database (Google Sheets + Apps Script) Card */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 p-6 md:p-7 rounded-2xl shadow-sm border border-indigo-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      ฐานข้อมูลบนคลาวด์ Google Sheets + Google Apps Script
                    </h4>
                    <p className="text-xs text-slate-500">
                      สำรองและกู้คืนข้อมูลทั้งหมดไปยัง Google Sheets ของโรงเรียนแบบเรียลไทม์
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAppsScriptModalOpen(true)}
                  className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>ดูโค้ด Apps Script & คู่มือ</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Sheets Webhook URL (URL เว็บแอป)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formSettings.googleSheetsWebhookUrl || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, googleSheetsWebhookUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs font-mono bg-white"
                  />
                  {formSettings.googleSheetsWebhookUrl?.startsWith('https://script.google.com/') ? (
                    <span className="shrink-0 text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> พร้อมใช้งาน
                    </span>
                  ) : (
                    <span className="shrink-0 text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                      ยังไม่ได้เชื่อมต่อ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  นำ URL ที่ได้จากการ Deploy Google Apps Script (เข้าถึงได้ทุกคน) มาวางที่นี่
                </p>
              </div>

              {/* Cloud Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBackupToSheets}
                  disabled={isBackingUp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                  title="ส่งข้อมูลสื่อและการตั้งค่าทั้งหมดไปเก็บไว้ใน Google Sheets"
                >
                  <CloudUpload className="h-4 w-4" />
                  <span>{isBackingUp ? 'กำลังสำรองข้อมูล...' : '☁️ สำรองข้อมูลขึ้น Google Sheets ทันที'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreFromSheets}
                  disabled={isRestoring}
                  className="bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-300 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="ดึงข้อมูลสำรองล่าสุดจาก Google Sheets มาใช้งาน"
                >
                  <CloudDownload className="h-4 w-4 text-indigo-600" />
                  <span>{isRestoring ? 'กำลังกู้คืนข้อมูล...' : '🔄 กู้คืนข้อมูลจาก Google Sheets'}</span>
                </button>
              </div>
            </div>

            {/* Offline File Backup / Restore (JSON) Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-600" /> ระบบสำรองและกู้คืนข้อมูลแบบออฟไลน์ (Offline JSON File)
              </h4>
              <p className="text-xs text-slate-500">
                ดาวน์โหลดไฟล์สำรองข้อมูล (.json) เก็บไว้ในเครื่องคอมพิวเตอร์ หรือนำเข้าไฟล์สำรองเพื่อกู้คืนข้อมูลในกรณีฉุกเฉิน
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-600" />
                  <span>💾 ดาวน์โหลดไฟล์สำรอง (.json)</span>
                </button>

                <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer">
                  <Upload className="h-4 w-4 text-slate-600" />
                  <span>📂 นำเข้าไฟล์สำรอง (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImportJson(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* System Config Form */}
            <form onSubmit={handleSaveSettings} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-5">
              <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                ข้อมูลทั่วไปของโรงเรียน & รหัสผ่าน
              </h4>

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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  รูปภาพ Logo โรงเรียน / ระบบ
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Logo Preview Thumbnail */}
                  <div className="h-12 w-12 rounded-2xl border-2 border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {formSettings.logoUrl ? (
                      <img
                        src={formSettings.logoUrl}
                        alt="logo preview"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-xl">🏫</span>
                    )}
                  </div>

                  {/* URL Input & Upload Button */}
                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      type="text"
                      value={formSettings.logoUrl || ''}
                      onChange={(e) => setFormSettings({ ...formSettings, logoUrl: e.target.value })}
                      placeholder="https://... หรือกดปุ่มอัปโหลดรูปจากเครื่อง"
                      className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-mono text-slate-600"
                    />

                    {/* Upload from Computer Button */}
                    <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95">
                      <Upload className="h-3.5 w-3.5 text-indigo-600" />
                      <span>อัปโหลดรูป</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleUploadLogo(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {formSettings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormSettings((prev) => ({ ...prev, logoUrl: '' }));
                          showNotice('ลบรูป Logo เรียบร้อยแล้ว (จะใช้ไอคอนค่าเริ่มต้น)');
                        }}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition shrink-0"
                        title="ลบรูป Logo (ใช้ไอคอนค่าเริ่มต้น)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 สามารถกดปุ่ม "อัปโหลดรูป" เพื่อเลือกไฟล์ภาพจากคอมพิวเตอร์ (PNG, JPG, SVG, WebP) หรือวางลิงก์รูปภาพโดยตรงก็ได้
                </p>
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

              <button
                type="submit"
                disabled={isProcessingImage}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm shadow-md transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isProcessingImage ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกการตั้งค่าระบบ'}
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Quick Preview Modal (Feature 2) */}
      {previewLink && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">👁️</span>
                <div className="truncate">
                  <h4 className="font-bold text-sm text-white truncate flex items-center gap-2">
                    <span>{previewLink.name}</span>
                    {previewLink.badge && (
                      <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-normal">
                        {previewLink.badge}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate font-mono">{previewLink.url}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>เปิดแท็บใหม่</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewLink(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Preview Body */}
            <div className="flex-1 bg-slate-100 relative">
              {previewLink.url ? (
                <iframe
                  src={previewLink.url}
                  title={previewLink.name}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                  <p className="text-sm font-bold">ไม่พบ URL สำหรับแสดงผลตัวอย่าง</p>
                </div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="p-3 px-6 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
              <span>
                โหมดการแสดงผลที่เลือก: <strong className="text-slate-800">{previewLink.target === '_self' ? 'ฝัง Iframe ในเว็บ' : 'เปิดแท็บใหม่ (_blank)'}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                หมายเหตุ: บางเว็บไซต์อาจบล็อกการแสดงผลผ่าน Iframe เพื่อความปลอดภัย
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Google Apps Script Code Modal */}
      {isAppsScriptModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="p-5 px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <Code className="h-5 w-5 text-indigo-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">โค้ด Google Apps Script Backend</h4>
                  <p className="text-[11px] text-slate-400">สำหรับเชื่อมต่อฐานข้อมูล Google Sheets</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAppsScriptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-indigo-900 space-y-2">
                <h5 className="font-bold text-sm flex items-center gap-1.5">
                  📌 ขั้นตอนการติดตั้งง่ายๆ ใน 2 นาที:
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-xs text-indigo-800">
                  <li>เปิด Google Sheets แผ่นใหม่ของโรงเรียน</li>
                  <li>ไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong></li>
                  <li>ลบโค้ดเดิมทั้งหมดออก แล้ววางโค้ดด้านล่างนี้ลงไป</li>
                  <li>กดปุ่ม <strong>ทำให้ใช้งานได้ (Deploy)</strong> &gt; <strong>การทำให้ใช้งานได้รายการใหม่ (New deployment)</strong></li>
                  <li>เลือกประเภท <strong>เว็บแอปพลิเคชัน (Web app)</strong> และตั้งค่าผู้มีสิทธิ์เข้าถึงเป็น <strong>"ทุกคน" (Anyone)</strong></li>
                  <li>คัดลอก URL ของเว็บแอป นำมาวางในช่อง <strong>Google Sheets Webhook URL</strong> ในระบบนี้</li>
                </ol>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between bg-slate-800 text-slate-300 px-4 py-2 rounded-t-xl text-xs font-mono">
                  <span>Code.gs</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_BACKEND_CODE);
                      setIsCopiedCode(true);
                      setTimeout(() => setIsCopiedCode(false), 2500);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    {isCopiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{isCopiedCode ? 'คัดลอกสำเร็จแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                  <code>{GOOGLE_APPS_SCRIPT_BACKEND_CODE}</code>
                </pre>
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsAppsScriptModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
