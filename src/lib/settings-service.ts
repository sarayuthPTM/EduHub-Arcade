import { SiteSettings, BannerItem } from '../types';
import { toolIllustrations } from './arcade-assets';
import { compressBase64String } from './image-compressor';

const SETTINGS_KEY = 'eduhub_arcade_settings';

export const defaultSettings: SiteSettings = {
  schoolName: 'โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่',
  topbarTitle: 'EduHub Arcade 🎮',
  logoUrl: toolIllustrations.schoolLogo,
  announcement: 'ยินดีต้อนรับสู่คลังสื่อการสอนและเกมอิเล็กทรอนิกส์ โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่!',
  tickerSpeed: 25,
  footerText: '© 2026 EduHub Arcade • โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่',
  themeColor: '#4f46e5',
  adminPin: '1234',
  userPin: '9999',
  googleSheetsWebhookUrl: '',
  categoryOrder: ['เครื่องมือครู', 'เกมเพื่อการเรียนรู้'],
  banners: [
    {
      id: 'banner-1',
      title: 'ยินดีต้อนรับสู่ EduHub Arcade',
      subtitle: 'คลังสื่อการสอนและเกมการเรียนรู้ออนไลน์ โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่',
      imageUrl: '/banners/school-banner-1.jpg',
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

export async function compressSettingsImages(settings: SiteSettings): Promise<SiteSettings> {
  const newSettings = { ...settings };

  // Compress logo if it is a large base64 image (> 50KB)
  if (newSettings.logoUrl && newSettings.logoUrl.startsWith('data:image') && newSettings.logoUrl.length > 50 * 1024) {
    try {
      newSettings.logoUrl = await compressBase64String(newSettings.logoUrl, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        mimeType: 'image/png',
      });
    } catch (e) {
      console.warn('Failed to compress logoUrl:', e);
    }
  }

  // Compress banners if they are large base64 images (> 80KB)
  if (newSettings.banners && Array.isArray(newSettings.banners)) {
    newSettings.banners = await Promise.all(
      newSettings.banners.map(async (banner) => {
        if (banner.imageUrl && banner.imageUrl.startsWith('data:image') && banner.imageUrl.length > 80 * 1024) {
          try {
            const compressed = await compressBase64String(banner.imageUrl, {
              maxWidth: 1280,
              maxHeight: 720,
              quality: 0.82,
              mimeType: 'image/jpeg',
            });
            return { ...banner, imageUrl: compressed };
          } catch (e) {
            console.warn('Failed to compress banner image:', e);
            return banner;
          }
        }
        return banner;
      })
    );
  }

  return newSettings;
}

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
    if (!merged.banners || !Array.isArray(merged.banners) || merged.banners.length === 0) {
      merged.banners = defaultSettings.banners;
    } else {
      // Auto-migrate old unsplash placeholder to real school building banner
      merged.banners = merged.banners.map((b: BannerItem) => {
        if (b.imageUrl && b.imageUrl.includes('photo-1516321318423-f06f85e504b3')) {
          return {
            ...b,
            imageUrl: '/banners/school-banner-1.jpg',
            subtitle: b.subtitle || 'คลังสื่อการสอนและเกมการเรียนรู้ออนไลน์ โรงเรียนกาญจนาภิเษกวิทยาลัย กระบี่',
          };
        }
        return b;
      });
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
  } catch (e) {
    console.warn('localStorage.setItem failed for settings, running auto-compress recovery...', e);
    // Automatic recovery: compress images and retry
    compressSettingsImages(settings)
      .then((cleanSettings) => {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(cleanSettings));
          syncSettingsToCloud(cleanSettings);
          console.info('Settings saved successfully after automatic compression recovery.');
        } catch (retryErr) {
          console.error('Failed to save settings even after compression recovery:', retryErr);
        }
      })
      .catch((err) => {
        console.error('Error during settings compression recovery:', err);
      });
  }
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

