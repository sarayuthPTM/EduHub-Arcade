/**
 * EduHub Arcade - Backend Google Apps Script (Code.gs)
 * Spreadsheet ID: 17LKHdGWQpYgYxiiA9DIFj5bdU8liV67snn4m8MHfjCA
 * Drive Folder ID: 1Xzm05W8rJgh6f5Z7GLPFcaaCpkwcA99l
 */

const SPREADSHEET_ID = '17LKHdGWQpYgYxiiA9DIFj5bdU8liV67snn4m8MHfjCA';
const DRIVE_FOLDER_ID = '1Xzm05W8rJgh6f5Z7GLPFcaaCpkwcA99l';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 1. ตั้งค่าชีตเริ่มต้น (กด Run setupDatabase ครั้งแรกครั้งเดียว)
function setupDatabase() {
  const ss = getSpreadsheet();
  
  // 1.1 ตาราง Links
  let sheetLinks = ss.getSheetByName('Links');
  if (!sheetLinks) {
    sheetLinks = ss.insertSheet('Links');
    sheetLinks.getRange(1, 1, 1, 11).setValues([[
      'ID', 'หมวดหมู่', 'ชื่อสื่อ/เกม', 'รายละเอียด', 'ไอคอน', 'URL', 'สถานะ', 'เปิดแบบ', 'สิทธิ์', 'รูปภาพปก', 'ลิงก์ทำสำเนา'
    ]]).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    sheetLinks.setFrozenRows(1);
  }

  // 1.2 ตาราง Settings
  let sheetSettings = ss.getSheetByName('Settings');
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet('Settings');
    sheetSettings.getRange(1, 1, 1, 2).setValues([['Key', 'Value']])
      .setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    
    const defaultSettings = [
      ['SchoolName', 'โรงเรียนของฉัน'],
      ['TopbarTitle', 'EduHub Arcade 🎮'],
      ['LogoURL', ''],
      ['Announcement', 'ยินดีต้อนรับสู่คลังสื่อการสอนและเกมอิเล็กทรอนิกส์!'],
      ['TickerSpeed', '25'],
      ['AdminPIN', '1234'],
      ['UserPIN', '9999'],
      ['FooterText', '© 2026 EduHub Arcade • คลังสื่อการสอนและเกมอิเล็กทรอนิกส์สำหรับครู'],
      ['ThemeColor', '#4f46e5']
    ];
    sheetSettings.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
    sheetSettings.setFrozenRows(1);
  }

  // 1.3 ตาราง Logs
  let sheetLogs = ss.getSheetByName('Logs');
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet('Logs');
    sheetLogs.getRange(1, 1, 1, 4).setValues([['วันเวลา', 'กิจกรรม', 'ชื่อสื่อ/เครื่องมือ', 'รายละเอียด']])
      .setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
    sheetLogs.setFrozenRows(1);
  }

  return 'Setup Completed successfully!';
}

// 2. ดึงข้อมูลระบบ
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    
    // ดึง Settings
    const sheetSettings = ss.getSheetByName('Settings');
    const settings = {};
    if (sheetSettings) {
      const data = sheetSettings.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) settings[data[i][0]] = data[i][1];
      }
    }

    // ดึง Links
    const sheetLinks = ss.getSheetByName('Links');
    const links = [];
    if (sheetLinks) {
      const data = sheetLinks.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[2]) {
          links.push({
            id: row[0] || 'link_' + i,
            category: row[1] || 'ทั่วไป',
            name: row[2],
            desc: row[3] || '',
            icon: row[4] || 'extension',
            url: row[5] || '',
            status: row[6] || 'เปิด',
            target: row[7] || '_self',
            access: row[8] || 'ทั่วไป',
            coverImage: row[9] || '',
            copyUrl: row[10] || ''
          });
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', settings, links }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. บันทึกข้อมูลและสถิติ
function doPost(e) {
  try {
    const content = e.postData ? e.postData.contents : '';
    let payload = {};
    try {
      payload = JSON.parse(content);
    } catch (parseErr) {
      payload = e.parameter || {};
    }

    const action = payload.action;
    const ss = getSpreadsheet();

    if (action === 'tool_use' || action === 'log_activity') {
      let sheetLogs = ss.getSheetByName('Logs');
      if (!sheetLogs) setupDatabase();
      sheetLogs = ss.getSheetByName('Logs');
      sheetLogs.appendRow([new Date(), action, payload.toolTitle || payload.title || '', payload.details || '']);
      return createJsonResponse({ status: 'success', message: 'Logged' });
    }

    if (action === 'save_admin_links') {
      const links = payload.links;
      let sheetLinks = ss.getSheetByName('Links');
      if (!sheetLinks) setupDatabase();
      sheetLinks = ss.getSheetByName('Links');

      const lastRow = sheetLinks.getLastRow();
      if (lastRow > 1) {
        sheetLinks.getRange(2, 1, lastRow - 1, 11).clearContent();
      }

      if (Array.isArray(links) && links.length > 0) {
        sheetLinks.getRange(2, 1, links.length, 11).setValues(links);
      }
      return createJsonResponse({ status: 'success', message: 'Links saved' });
    }

    if (action === 'save_settings') {
      const s = payload.settings || {};
      let sheetSettings = ss.getSheetByName('Settings');
      if (!sheetSettings) setupDatabase();
      sheetSettings = ss.getSheetByName('Settings');

      const settingsMap = [
        ['SchoolName', s.schoolName || ''],
        ['TopbarTitle', s.topbarTitle || ''],
        ['LogoURL', s.logoUrl || ''],
        ['Announcement', s.announcement || ''],
        ['TickerSpeed', String(s.tickerSpeed || 25)],
        ['AdminPIN', String(s.adminPin || '1234')],
        ['UserPIN', String(s.userPin || '9999')],
        ['FooterText', s.footerText || ''],
        ['ThemeColor', s.themeColor || '#4f46e5']
      ];

      sheetSettings.getRange(2, 1, settingsMap.length, 2).setValues(settingsMap);
      return createJsonResponse({ status: 'success', message: 'Settings saved' });
    }

    if (action === 'upload_file') {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const decoded = Utilities.base64Decode(payload.base64);
      const blob = Utilities.newBlob(decoded, payload.contentType || 'image/png', payload.fileName || ('upload_' + Date.now() + '.png'));
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return createJsonResponse({ status: 'success', fileUrl: 'https://drive.google.com/uc?export=view&id=' + file.getId() });
    }

    return createJsonResponse({ status: 'unknown_action' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
