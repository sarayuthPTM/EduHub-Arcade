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
}

export interface ActivityStat {
  totalVisits: number;
  toolUsage: Record<string, number>;
}
