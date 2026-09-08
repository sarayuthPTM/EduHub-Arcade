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
