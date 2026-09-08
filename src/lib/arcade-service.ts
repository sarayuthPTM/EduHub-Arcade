import { ArcadeLink } from '../types';
import { loadSettings } from './settings-service';
import { toolIllustrations } from './arcade-assets';

const ARCADE_LINKS_KEY = 'eduhub_arcade_links';
const USAGE_STATS_KEY = 'eduhub_arcade_usage_stats';
const TOTAL_VISITS_KEY = 'eduhub_arcade_total_visits';

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
