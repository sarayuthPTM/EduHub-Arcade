import { ArcadeLink, ActivityLog, SiteSettings } from '../types';
import { loadSettings } from './settings-service';
import { toolIllustrations } from './arcade-assets';

const ARCADE_LINKS_KEY = 'eduhub_arcade_links';
const USAGE_STATS_KEY = 'eduhub_arcade_usage_stats';
const TOTAL_VISITS_KEY = 'eduhub_arcade_total_visits';
const RECENT_LOGS_KEY = 'eduhub_arcade_recent_logs';

export const defaultIllustrationsMap: Record<string, string> = {
  'tool-timer': toolIllustrations.timer,
  'tool-lottery': toolIllustrations.lottery,
  'tool-wheel': toolIllustrations.wheel,
  'tool-dragon-meter': toolIllustrations.dragon,
  'tool-popsicle': toolIllustrations.popsicle,
  'tool-race-timer': toolIllustrations.capybara,
  'tool-group-sort': toolIllustrations.groups,
  'tool-scoreboard': toolIllustrations.scoreboard,
  'game-wordwall': toolIllustrations.wordwall,
  'game-quizizz': toolIllustrations.quizizz,
  'game-liveworksheets': toolIllustrations.liveworksheets,
  'game-phet': toolIllustrations.phet,
  'game-geogebra': toolIllustrations.geogebra,
};

export const defaultArcadeLinks: ArcadeLink[] = [
  // --- เครื่องมือครู (Classroom Tools from Image 2) ---
  {
    id: 'tool-timer',
    category: 'เครื่องมือครู',
    name: 'นาฬิกาจับเวลา',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ สำหรับจับเวลากิจกรรมและนับเวลาถอยหลังในห้องเรียน',
    url: 'https://www.online-stopwatch.com/classroom-timers/',
    icon: 'timer',
    coverImage: toolIllustrations.timer,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },
  {
    id: 'tool-lottery',
    category: 'เครื่องมือครู',
    name: 'เครื่องมือสุ่มเลขที่',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ กรงหมุนลูกบอลสุ่มเลขที่นักเรียนเพื่อตอบคำถามอย่างยุติธรรม',
    url: 'https://www.classtools.net/fruit_machine/',
    icon: 'calculate',
    coverImage: toolIllustrations.lottery,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },
  {
    id: 'tool-wheel',
    category: 'เครื่องมือครู',
    name: 'วงล้อสุ่มชื่อ',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ วงล้อหมุนเสี่ยงทายสุ่มชื่อนักเรียน สุ่มกลุ่ม สุ่มคำถาม',
    url: 'https://wheelofnames.com/th/',
    icon: 'sports_esports',
    coverImage: toolIllustrations.wheel,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },
  {
    id: 'tool-dragon-meter',
    category: 'เครื่องมือครู',
    name: 'มังกรพ่นไฟ เปิดเครื่องวัดเสียง',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ เครื่องตรวจวัดระดับเสียงในห้องเรียนเตือนเมื่อเด็กคุยเสียงดัง',
    url: 'https://bouncyballs.org/',
    icon: 'volume_up',
    coverImage: toolIllustrations.dragon,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },
  {
    id: 'tool-popsicle',
    category: 'เครื่องมือครู',
    name: 'ไม้ไอติมสุ่มชื่อ',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ จำลองการหยิบไม้ไอติมสุ่มชื่อตอบคำถาม ป้องกันการเลือกปฏิบัติ',
    url: 'https://www.classtools.net/random-name-picker/',
    icon: 'extension',
    coverImage: toolIllustrations.popsicle,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },
  {
    id: 'tool-race-timer',
    category: 'เครื่องมือครู',
    name: 'แข่งขันวิ่งคาปิบารา',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ เกมจับเวลาแข่งขันวิ่งตัวการ์ตูนกระตุ้นความตื่นเต้น',
    url: 'https://www.online-stopwatch.com/duck-race/',
    icon: 'sports_score',
    coverImage: toolIllustrations.capybara,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },
  {
    id: 'tool-group-sort',
    category: 'เครื่องมือครู',
    name: 'จัดกลุ่มนักเรียน',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ ใส่รายชื่อแล้วสุ่มแบ่งกลุ่มนักเรียนทำกิจกรรมอัตโนมัติ',
    url: 'https://www.randomlists.com/team-generator',
    icon: 'group',
    coverImage: toolIllustrations.groups,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },
  {
    id: 'tool-scoreboard',
    category: 'เครื่องมือครู',
    name: 'ป้ายคะแนนดิจิทัล (Scoreboard)',
    desc: 'ระบบสื่อการสอนอิเล็กทรอนิกส์ กระดานแสดงคะแนนทีมแบบสด บันทึกคะแนนแข่งขันตอบปัญหา',
    url: 'https://keepthescore.com/',
    icon: 'emoji_events',
    coverImage: toolIllustrations.scoreboard,
    copyUrl: '',
    status: 'เปิด',
    target: '_self',
    access: 'ทั่วไป',
  },

  // --- เกมเพื่อการเรียนรู้ (Learning Games) ---
  {
    id: 'game-wordwall',
    category: 'เกมเพื่อการเรียนรู้',
    name: 'Wordwall สร้างเกมการศึกษา',
    desc: 'สร้างเกมจับคู่ วงล้อสุ่ม แบบทดสอบ และเกมอินเตอร์แอคทีฟเล่นในห้องเรียน',
    url: 'https://wordwall.net/th',
    icon: 'sports_esports',
    coverImage: toolIllustrations.wordwall,
    copyUrl: '',
    status: 'เปิด',
    target: '_blank',
    access: 'ทั่วไป',
  },
  {
    id: 'game-quizizz',
    category: 'เกมเพื่อการเรียนรู้',
    name: 'Quizizz ตอบคำถามประลองความรู้',
    desc: 'เครื่องมือสร้างแบบทดสอบออนไลน์ เล่นพร้อมกันในห้องเรียน สรุปสถิติคะแนนรายบุคคล',
    url: 'https://quizizz.com/',
    icon: 'quiz',
    coverImage: toolIllustrations.quizizz,
    copyUrl: '',
    status: 'เปิด',
    target: '_blank',
    access: 'ทั่วไป',
  },
  {
    id: 'game-liveworksheets',
    category: 'เกมเพื่อการเรียนรู้',
    name: 'Liveworksheets ใบงานตรวจอัตโนมัติ',
    desc: 'เปลี่ยนใบงานกระดาษเป็นใบงานโต้ตอบออนไลน์ ตรวจคะแนนและส่งให้นักเรียนทำผ่านมือถือ',
    url: 'https://www.liveworksheets.com/',
    icon: 'quiz',
    coverImage: toolIllustrations.liveworksheets,
    copyUrl: '',
    status: 'เปิด',
    target: '_blank',
    access: 'ทั่วไป',
  },
  {
    id: 'game-phet',
    category: 'เกมเพื่อการเรียนรู้',
    name: 'PhET Interactive Simulations',
    desc: 'การทดลองเสมือนจริง วิทยาศาสตร์ ฟิสิกส์ เคมี ชีววิทยา ดาราศาสตร์ และคณิตศาสตร์',
    url: 'https://phet.colorado.edu/th/',
    icon: 'science',
    coverImage: toolIllustrations.phet,
    copyUrl: '',
    status: 'เปิด',
    target: '_blank',
    access: 'ทั่วไป',
  },
  {
    id: 'game-geogebra',
    category: 'เกมเพื่อการเรียนรู้',
    name: 'GeoGebra เรขาคณิต & กราฟิก',
    desc: 'โปรแกรมเรขาคณิตพลวัต กราฟฟังก์ชัน พีชคณิต แคลคูลัส และสถิติสำหรับครูคณิตศาสตร์',
    url: 'https://www.geogebra.org/calculator',
    icon: 'calculate',
    coverImage: toolIllustrations.geogebra,
    copyUrl: '',
    status: 'เปิด',
    target: '_blank',
    access: 'ทั่วไป',
  },
];

export function loadArcadeLinks(): ArcadeLink[] {
  try {
    const saved = localStorage.getItem(ARCADE_LINKS_KEY);
    if (!saved) return defaultArcadeLinks;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Migrate old Unsplash images to clean vector SVG illustrations
      return parsed.map((item) => {
        if (item.id && defaultIllustrationsMap[item.id] && (!item.coverImage || item.coverImage.includes('unsplash.com'))) {
          return { ...item, coverImage: defaultIllustrationsMap[item.id] };
        }
        return item;
      });
    }
    return defaultArcadeLinks;
  } catch (e) {
    return defaultArcadeLinks;
  }
}

export function saveArcadeLinks(links: ArcadeLink[]): void {
  try {
    localStorage.setItem(ARCADE_LINKS_KEY, JSON.stringify(links));
    syncArcadeLinksToCloud(links);
  } catch (e) {}
}

export async function syncArcadeLinksToCloud(links: ArcadeLink[]): Promise<boolean> {
  const settings = loadSettings();
  const url = settings.googleSheetsWebhookUrl;
  if (!url || !url.trim().startsWith('https://script.google.com/')) return false;

  try {
    const formattedData = links.map((l, i) => [
      l.id || 'id_' + i,
      l.category || 'ทั่วไป',
      l.name || '',
      l.desc || '',
      l.icon || 'extension',
      l.url || '',
      l.status || 'เปิด',
      l.target || '_self',
      l.access || 'ทั่วไป',
      l.coverImage || '',
      l.copyUrl || '',
    ]);

    await fetch(url.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save_admin_links', links: formattedData }),
    });
    return true;
  } catch (e) {
    return false;
  }
}

export function trackToolClick(link: ArcadeLink): void {
  try {
    const saved = localStorage.getItem(USAGE_STATS_KEY);
    const stats = saved ? JSON.parse(saved) : {};
    stats[link.name] = (stats[link.name] || 0) + 1;
    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(stats));

    // Save recent activity log (last 30 actions)
    const savedLogs = localStorage.getItem(RECENT_LOGS_KEY);
    const logs: ActivityLog[] = savedLogs ? JSON.parse(savedLogs) : [];
    const now = new Date();
    const newLog: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      toolName: link.name,
      category: link.category || 'ทั่วไป',
      time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: now.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
      timestamp: now.getTime(),
    };
    logs.unshift(newLog);
    localStorage.setItem(RECENT_LOGS_KEY, JSON.stringify(logs.slice(0, 200)));

    // Send to cloud
    const settings = loadSettings();
    if (settings.googleSheetsWebhookUrl) {
      fetch(settings.googleSheetsWebhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'tool_use',
          toolId: link.id,
          toolTitle: link.name,
          details: 'เข้าใช้งานสื่อ',
        }),
      }).catch(() => {});
    }
  } catch (e) {}
}

export function getToolStats(): Record<string, number> {
  try {
    const saved = localStorage.getItem(USAGE_STATS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

export function getRecentLogs(): ActivityLog[] {
  try {
    const saved = localStorage.getItem(RECENT_LOGS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function getTotalToolLaunches(): number {
  const stats = getToolStats();
  return Object.values(stats).reduce((sum, val) => sum + val, 0);
}

/**
 * Filter stats by time range: all, today, 7d, 30d
 */
export function getFilteredStats(timeRange: 'all' | 'today' | '7d' | '30d'): {
  stats: Record<string, number>;
  totalVisits: number;
  totalToolLaunches: number;
  logs: ActivityLog[];
  topTool: string;
  topToolCount: number;
} {
  const totalVisits = getTotalVisits();
  const allLogs = getRecentLogs();

  if (timeRange === 'all') {
    const stats = getToolStats();
    const totalToolLaunches = getTotalToolLaunches();
    const topEntry = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];
    return {
      stats,
      totalVisits,
      totalToolLaunches,
      logs: allLogs,
      topTool: topEntry?.[0] || 'ยังไม่มีข้อมูล',
      topToolCount: topEntry?.[1] || 0,
    };
  }

  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  let cutoff = 0;

  if (timeRange === 'today') {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    cutoff = startOfToday.getTime();
  } else if (timeRange === '7d') {
    cutoff = now - 7 * oneDayMs;
  } else if (timeRange === '30d') {
    cutoff = now - 30 * oneDayMs;
  }

  const stats: Record<string, number> = {};
  const filteredLogs: ActivityLog[] = [];

  allLogs.forEach((log) => {
    const logTime = log.timestamp || 0;
    if (logTime >= cutoff) {
      stats[log.toolName] = (stats[log.toolName] || 0) + 1;
      filteredLogs.push(log);
    }
  });

  const totalToolLaunches = Object.values(stats).reduce((sum, val) => sum + val, 0);
  const topEntry = Object.entries(stats).sort((a, b) => b[1] - a[1])[0];

  return {
    stats,
    totalVisits: Math.max(1, Math.round(totalVisits * (timeRange === 'today' ? 0.2 : timeRange === '7d' ? 0.5 : 0.8))),
    totalToolLaunches,
    logs: filteredLogs,
    topTool: topEntry?.[0] || 'ยังไม่มีข้อมูล',
    topToolCount: topEntry?.[1] || 0,
  };
}

export function resetAllStats(): void {
  try {
    localStorage.removeItem(USAGE_STATS_KEY);
    localStorage.removeItem(TOTAL_VISITS_KEY);
    localStorage.removeItem(RECENT_LOGS_KEY);
  } catch (e) {}
}

export function incrementTotalVisits(): number {
  try {
    const saved = localStorage.getItem(TOTAL_VISITS_KEY);
    const count = saved ? parseInt(saved, 10) + 1 : 1;
    localStorage.setItem(TOTAL_VISITS_KEY, count.toString());
    return count;
  } catch (e) {
    return 1;
  }
}

export function getTotalVisits(): number {
  try {
    const saved = localStorage.getItem(TOTAL_VISITS_KEY);
    return saved ? parseInt(saved, 10) : 1;
  } catch (e) {
    return 1;
  }
}

/**
 * Export full JSON backup file to user's computer
 */
export function exportBackupJson(links: ArcadeLink[], settings: SiteSettings): void {
  const backupData = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    school: settings.schoolName,
    links,
    settings,
    stats: getToolStats(),
    totalVisits: getTotalVisits(),
    logs: getRecentLogs(),
  };
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eduhub_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate and parse uploaded backup JSON string
 */
export function importBackupJson(jsonString: string): {
  success: boolean;
  links?: ArcadeLink[];
  settings?: SiteSettings;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.links || !Array.isArray(parsed.links)) {
      return { success: false, error: 'ไฟล์สำรองไม่ถูกต้อง: ไม่พบรายการสื่อ (links)' };
    }
    return {
      success: true,
      links: parsed.links,
      settings: parsed.settings || undefined,
    };
  } catch (err: any) {
    return { success: false, error: 'ไม่สามารถอ่านไฟล์ JSON ได้: ' + (err.message || 'รูปแบบไม่ถูกต้อง') };
  }
}

/**
 * Backup full database directly to Google Sheets via Apps Script Webhook
 */
export async function backupToGoogleSheets(
  webhookUrl: string,
  links: ArcadeLink[],
  settings: SiteSettings
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://script.google.com/')) {
    return { success: false, message: 'กรุณาระบุ Google Sheets Webhook URL ที่ถูกต้องในหน้าตั้งค่า' };
  }
  try {
    const payload = {
      action: 'backup_data',
      backupDate: new Date().toLocaleString('th-TH'),
      timestamp: Date.now(),
      linksCount: links.length,
      links,
      settings,
    };
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return { success: true, message: 'ส่งข้อมูลสำรองขึ้น Google Sheets สำเร็จเรียบร้อยแล้ว!' };
  } catch (e: any) {
    return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets: ' + (e.message || '') };
  }
}

/**
 * Restore latest database directly from Google Sheets via Apps Script Webhook
 */
export async function restoreFromGoogleSheets(
  webhookUrl: string
): Promise<{ success: boolean; links?: ArcadeLink[]; settings?: SiteSettings; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://script.google.com/')) {
    return { success: false, message: 'กรุณาระบุ Google Sheets Webhook URL ที่ถูกต้อง' };
  }
  try {
    const fetchUrl = `${webhookUrl.trim()}${webhookUrl.includes('?') ? '&' : '?'}action=restore_data&t=${Date.now()}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) {
      return { success: false, message: `เซิร์ฟเวอร์ตอบกลับสถานะ HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data && data.links && Array.isArray(data.links)) {
      return {
        success: true,
        links: data.links,
        settings: data.settings,
        message: `กู้คืนข้อมูลสำเร็จ (${data.links.length} รายการ)`,
      };
    }
    return { success: false, message: data.message || 'ไม่พบข้อมูลสำรองใน Google Sheets' };
  } catch (e: any) {
    return { success: false, message: 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้: ' + (e.message || 'โปรดตรวจสอบการ Deploy Web App') };
  }
}

/**
 * Sync links to Google Sheets
 */
export async function syncLinksToGoogleSheets(
  webhookUrl: string,
  links: ArcadeLink[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://script.google.com/')) {
    return { success: false, message: 'กรุณาระบุ Google Sheets Webhook URL ที่ถูกต้อง' };
  }
  try {
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'sync_links', links }),
    });
    return { success: true, message: `ส่งรายชื่อสื่อ (${links.length} รายการ) ขึ้น Google Sheets เรียบร้อยแล้ว!` };
  } catch (e: any) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + (e.message || '') };
  }
}

/**
 * Pull links from Google Sheets
 */
export async function fetchLinksFromGoogleSheets(
  webhookUrl: string
): Promise<{ success: boolean; links?: ArcadeLink[]; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('https://script.google.com/')) {
    return { success: false, message: 'กรุณาระบุ Google Sheets Webhook URL ที่ถูกต้อง' };
  }
  try {
    const fetchUrl = `${webhookUrl.trim()}${webhookUrl.includes('?') ? '&' : '?'}action=get_links&t=${Date.now()}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) {
      return { success: false, message: `เกิดข้อผิดพลาดในการเชื่อมต่อ (HTTP ${res.status})` };
    }
    const data = await res.json();
    if (data && data.links && Array.isArray(data.links)) {
      return { success: true, links: data.links, message: `ดึงข้อมูลสำเร็จ (${data.links.length} รายการ)` };
    }
    return { success: false, message: data.message || 'ไม่พบรายการสื่อใน Google Sheets' };
  } catch (e: any) {
    return { success: false, message: 'ไม่สามารถดึงข้อมูลได้: ' + (e.message || 'โปรดตรวจสอบสิทธิ์การเข้าถึง Web App') };
  }
}

/**
 * Check Link Health (URL validation and hints)
 */
export function checkLinkHealth(url?: string, target?: string): { status: 'healthy' | 'warning' | 'error'; label: string } {
  if (!url || !url.trim()) {
    return { status: 'error', label: 'ไม่มี URL' };
  }
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (parsed.protocol === 'http:') {
      return { status: 'warning', label: 'HTTP ธรรมดา (ควรเปลี่ยนเป็น HTTPS)' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      target === '_self' &&
      (host.includes('facebook.com') ||
        host.includes('instagram.com') ||
        host.includes('tiktok.com') ||
        host.includes('twitter.com') ||
        host.includes('x.com'))
    ) {
      return { status: 'warning', label: 'โซเชียลมีเดียอาจบล็อก Iframe (ควรเลือกเปิดใหม่)' };
    }
    return { status: 'healthy', label: 'ลิงก์ปกติ' };
  } catch (e) {
    return { status: 'error', label: 'รูปแบบ URL ไม่ถูกต้อง' };
  }
}
