export interface ArcadeLink {
  id: string;
  category: string;
  name: string;
  desc?: string;
  url: string;
  icon?: string;
  coverImage?: string;
  copyUrl?: string;
  status: 'เปิด' | 'ปิด';
  target: '_self' | '_blank';
  access: 'ทั่วไป' | 'ล็อก PIN';
  badge?: string; // e.g. 'มาใหม่', 'ยอดนิยม', 'แนะนำ', 'ประถม', 'ม.ต้น', 'ม.ปลาย'
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  active: boolean;
}

export interface SiteSettings {
  schoolName: string;
  topbarTitle: string;
  logoUrl?: string;
  announcement: string;
  tickerSpeed: number; // in seconds
  footerText: string;
  themeColor: string;
  adminPin: string;
  userPin: string;
  googleSheetsWebhookUrl?: string;
  categoryOrder?: string[];
  banners?: BannerItem[];
}

export interface ActivityLog {
  id: string;
  toolName: string;
  category: string;
  time: string;
  date: string;
  timestamp: number;
}

export interface ActivityStat {
  totalVisits: number;
  toolUsage: Record<string, number>;
}
