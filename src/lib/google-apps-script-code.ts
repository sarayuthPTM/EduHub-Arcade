/**
 * =========================================================================
 * EduHub Arcade - Google Apps Script Backend (Database & Webhook)
 * =========================================================================
 * วิธีติดตั้งใน Google Sheets:
 * 1. เปิด Google Sheets ของท่าน
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดออก แล้ววางโค้ดชุดนี้ลงไป
 * 4. กดปุ่ม "บันทึก" (รูปแผ่นดิสก์)
 * 5. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 6. เลือกประเภท: "เว็บแอปพลิเคชัน" (Web app)
 *    - คำอธิบาย: EduHub Arcade Backend
 *    - ดำเนินการในฐานะ: ตัวฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone) **สำคัญมาก**
 * 7. กด "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL ของเว็บแอป" นำไปใส่ในช่อง
 *    "Google Sheets Webhook URL" ในหน้า Admin Panel ของ EduHub Arcade
 * =========================================================================
 */

export const GOOGLE_APPS_SCRIPT_BACKEND_CODE = `function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action || 'tool_use';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. สำรองข้อมูลทั้งหมด (Backup Data)
    if (action === 'backup_data') {
      var backupSheet = ss.getSheetByName('Backups_History');
      if (!backupSheet) {
        backupSheet = ss.insertSheet('Backups_History');
        backupSheet.appendRow(['Timestamp', 'วันที่สำรอง', 'จำนวนสื่อ', 'ข้อมูลสำรอง (JSON)']);
        backupSheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
      }
      backupSheet.insertRowAfter(1);
      backupSheet.getRange(2, 1, 1, 4).setValues([[
        data.timestamp || Date.now(),
        data.backupDate || new Date().toLocaleString('th-TH'),
        data.linksCount || (data.links ? data.links.length : 0),
        JSON.stringify(data)
      ]]);

      if (data.links && Array.isArray(data.links)) {
        saveLinksToSheet(ss, data.links);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Backup saved successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ซิงก์รายชื่อสื่อขึ้นชีต (Sync Links)
    if (action === 'sync_links') {
      if (data.links && Array.isArray(data.links)) {
        saveLinksToSheet(ss, data.links);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Links synced' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. บันทึกการตั้งค่าระบบ (Save Settings)
    if (action === 'save_settings') {
      var settingsSheet = ss.getSheetByName('System_Settings');
      if (!settingsSheet) {
        settingsSheet = ss.insertSheet('System_Settings');
        settingsSheet.appendRow(['Key', 'Value']);
        settingsSheet.getRange('A1:B1').setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');
      }
      settingsSheet.clearContents();
      settingsSheet.appendRow(['Key', 'Value']);
      settingsSheet.getRange('A1:B1').setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');
      
      var settings = data.settings || {};
      for (var k in settings) {
        settingsSheet.appendRow([k, typeof settings[k] === 'object' ? JSON.stringify(settings[k]) : settings[k]]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. บันทึกสถิติการใช้งาน (Tool Click Log)
    var logSheet = ss.getSheetByName('Usage_Logs');
    if (!logSheet) {
      logSheet = ss.insertSheet('Usage_Logs');
      logSheet.appendRow(['Timestamp', 'วันที่-เวลา', 'ชื่อสื่อ/เกม', 'รหัสสื่อ', 'รายละเอียด']);
      logSheet.getRange('A1:E1').setFontWeight('bold').setBackground('#6366f1').setFontColor('#ffffff');
    }
    logSheet.appendRow([
      new Date().getTime(),
      new Date().toLocaleString('th-TH'),
      data.toolTitle || data.toolName || '',
      data.toolId || '',
      data.details || 'เข้าใช้งาน'
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'restore_data';

    // 1. กู้คืนข้อมูลสำรองล่าสุด (Restore Data)
    if (action === 'restore_data') {
      var backupSheet = ss.getSheetByName('Backups_History');
      if (backupSheet && backupSheet.getLastRow() >= 2) {
        var jsonText = backupSheet.getRange(2, 4).getValue();
        if (jsonText) {
          var backupObj = JSON.parse(jsonText);
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            links: backupObj.links || [],
            settings: backupObj.settings || undefined,
            timestamp: backupObj.timestamp
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      var links = getLinksFromSheet(ss);
      if (links.length > 0) {
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          links: links
        })).setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'ยังไม่มีข้อมูลสำรองใน Google Sheets'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ดึงเฉพาะรายชื่อสื่อ (Get Links)
    if (action === 'get_links') {
      var linksList = getLinksFromSheet(ss);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        links: linksList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'EduHub Arcade Backend Ready' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveLinksToSheet(ss, links) {
  var sheet = ss.getSheetByName('Links_Data');
  if (!sheet) {
    sheet = ss.insertSheet('Links_Data');
  }
  sheet.clearContents();
  var headers = ['ID', 'หมวดหมู่', 'ชื่อสื่อ/เกม', 'คำอธิบาย', 'URL', 'รูปปก', 'ทำสำเนา', 'เปิดใน', 'การเข้าถึง', 'สถานะ', 'ป้ายกำกับ (Badge)'];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#3b82f6').setFontColor('#ffffff');

  if (links && links.length > 0) {
    var rows = links.map(function(l) {
      return [
        l.id || '',
        l.category || 'ทั่วไป',
        l.name || '',
        l.desc || '',
        l.url || '',
        l.coverImage || '',
        l.copyUrl || '',
        l.target || '_self',
        l.access || 'ทั่วไป',
        l.status || 'เปิด',
        l.badge || ''
      ];
    });
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

function getLinksFromSheet(ss) {
  var sheet = ss.getSheetByName('Links_Data');
  if (!sheet || sheet.getLastRow() < 2) return [];

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
  return data.map(function(r) {
    return {
      id: String(r[0] || 'link_' + Date.now()),
      category: String(r[1] || 'ทั่วไป'),
      name: String(r[2] || ''),
      desc: String(r[3] || ''),
      url: String(r[4] || ''),
      coverImage: String(r[5] || ''),
      copyUrl: String(r[6] || ''),
      target: r[7] === '_blank' ? '_blank' : '_self',
      access: r[8] === 'ล็อก PIN' ? 'ล็อก PIN' : 'ทั่วไป',
      status: r[9] === 'ปิด' ? 'ปิด' : 'เปิด',
      badge: String(r[10] || '')
    };
  });
}
`;
