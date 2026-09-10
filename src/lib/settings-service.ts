import { SiteSettings } from '../types';
import { toolIllustrations } from './arcade-assets';

const SETTINGS_KEY = 'eduhub_arcade_settings';

export const defaultSettings: SiteSettings = {
  schoolName: 'โรงเรียนของฉัน',
  topbarTitle: 'EduHub Arcade 🎮',
  logoUrl: toolIllustrations.schoolLogo,
  announcement: 'ยินดีต้อนรับสู่คลังสื่อการสอนและเกมอิเล็กทรอนิกส์!',
  tickerSpeed: 25,
  footerText: '© 2026 EduHub Arcade • คลังสื่อการสอนและเกมอิเล็กทรอนิกส์สำหรับครู',
  themeColor: '#4f46e5',
  adminPin: '1234',
  userPin: '9999',
  googleSheetsWebhookUrl: '',
  categoryOrder: ['เครื่องมือครู', 'เกมเพื่อการเรียนรู้'],
  banners: [
    {
      id: 'banner-1',
      title: 'ยินดีต้อนรับสู่ EduHub Arcade',
      subtitle: 'คลังสื่อการสอนและเกมการเรียนรู้ออนไลน์สำหรับครูและนักเรียน',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80',
      linkUrl: '',
      active: true,
    },
    {
      id: 'banner-2',
      title: 'เครื่องมือห้องเรียนดิจิทัล',
      subtitle: 'สุ่มชื่อ จับเวลา วงล้อ และเกมตอบคำถามสร้างสรรค์',
      imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&auto=format&fit=crop&q=80',
      linkUrl: '',
      active: true,
    },
  ],
};

export function loadSettings(): SiteSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return defaultSettings;
    const parsed = JSON.parse(saved);
    const merged = { ...defaultSettings, ...parsed };
    if (!merged.logoUrl) {
      merged.logoUrl = toolIllustrations.schoolLogo;
    }
    if (!merged.categoryOrder || !Array.isArray(merged.categoryOrder) || merged.categoryOrder.length === 0) {
      merged.categoryOrder = ['เครื่องมือครู', 'เกมเพื่อการเรียนรู้'];
    }
    if (!merged.banners || !Array.isArray(merged.banners)) {
      merged.banners = defaultSettings.banners;
    }
    return merged;
  } catch (e) {
    return defaultSettings;
  }
}

export function saveSettings(settings: SiteSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    syncSettingsToCloud(settings);
  } catch (e) {}
}

export async function syncSettingsToCloud(settings: SiteSettings): Promise<boolean> {
  const url = settings.googleSheetsWebhookUrl;
  if (!url || !url.trim().startsWith('https://script.google.com/')) return false;

  try {
    await fetch(url.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_settings', settings }),
    });
    return true;
  } catch (e) {
    return false;
  }
}
