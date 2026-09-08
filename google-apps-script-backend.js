/**
 * ==============================================================================
 * Google Apps Script Backend: ระบบเครื่องมือสำหรับครู & EduHub Arcade
 * ==============================================================================
 * วิธีใช้งาน:
 * 1. ใน Google Sheets กดเมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 2. ลบโค้ดเดิมทั้งหมด แล้วคัดลอกโค้ดนี้ไปวาง
 * 3. กดปุ่ม "บันทึก" (รูปแผ่นดิสก์)
 * 4. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้ใหม่" (New deployment)
 * 5. เลือกประเภท: "เว็บแอป" (Web app)
 *    - คำอธิบาย: เวอร์ชัน 1.0
 *    - ดำเนินการในฐานะ: ฉัน (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง: ทุกคน (Anyone)
 * 6. กด "ทำให้ใช้งานได้" แล้วคัดลอก Web App URL (ที่ลงท้ายด้วย /exec)
 * ==============================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ดึงการตั้งค่าเว็บ (Settings)
  if (action === 'get_settings') {
    var sheet = getOrCreateSheet(ss, 'Settings', ['Key', 'Value']);
    var data = sheet.getDataRange().getValues();
    var settings = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        try {
          settings[data[i][0]] = JSON.parse(data[i][1]);
        } catch (err) {
          settings[data[i][0]] = data[i][1];
        }
      }
    }
    return jsonResponse({ status: 'success', settings: settings });
  }

  // 2. ดึงข้อมูลสื่อ/เกม Arcade (get_raw_links)
  if (action === 'get_raw_links' || action === 'get_arcade_links') {
    var sheet = getOrCreateSheet(ss, 'Links', [
      'ID', 'หมวดหมู่', 'ชื่อสื่อ/เกม', 'คำอธิบาย', 'ไอคอน', 'URL', 'สถานะ', 'การเปิด', 'สิทธิ์', 'รูปปก', 'ลิงก์ทำสำเนา'
    ]);
    var data = sheet.getDataRange().getValues();
    var links = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][2]) { // มีชื่อสื่อ
        links.push({
          id: String(data[i][0] || 'link_' + i),
          category: String(data[i][1] || 'ทั่วไป'),
          name: String(data[i][2]),
          desc: String(data[i][3] || ''),
          icon: String(data[i][4] || 'extension'),
          url: String(data[i][5] || ''),
          status: String(data[i][6] || 'เปิด'),
          target: String(data[i][7] || '_self'),
          access: String(data[i][8] || 'ทั่วไป'),
          coverImage: String(data[i][9] || ''),
          copyUrl: String(data[i][10] || '')
        });
      }
    }
    return jsonResponse(links);
  }

  // 3. ดึงสถิติการใช้งาน (get_stats)
  if (action === 'get_stats') {
    var statSheet = getOrCreateSheet(ss, 'Stats', ['ToolId', 'ToolTitle', 'Count', 'LastUsed']);
    var statData = statSheet.getDataRange().getValues();
    var toolStats = {};
    for (var i = 1; i < statData.length; i++) {
      if (statData[i][0]) {
        toolStats[statData[i][0]] = Number(statData[i][2]) || 0;
      }
    }

    var logSheet = getOrCreateSheet(ss, 'Logs', ['Timestamp', 'Type', 'Title', 'Details', 'Device']);
    var totalVisits = Math.max(1, logSheet.getLastRow() - 1);

    return jsonResponse({
      status: 'success',
      toolStats: toolStats,
      totalVisits: totalVisits
    });
  }

  return jsonResponse({ status: 'ready', message: 'Teacher Tools & EduHub Arcade API is Active' });
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var action = data.action || data.type;

    // 1. บันทึกสถิติการใช้งาน หรือ การเข้าชม (visit / tool_use)
    if (action === 'visit' || action === 'tool_use') {
      var logSheet = getOrCreateSheet(ss, 'Logs', ['Timestamp', 'Type', 'Title', 'Details', 'Device']);
      logSheet.appendRow([
        new Date().toLocaleString('th-TH'),
        action,
        data.toolTitle || 'เปิดหน้าแรก',
        data.details || '',
        data.device || 'Web'
      ]);

      if (action === 'tool_use' && data.toolId) {
        updateToolStat(ss, data.toolId, data.toolTitle || data.toolId);
      }
      return jsonResponse({ status: 'logged' });
    }

    // 2. บันทึกข้อความติดต่อจากกล่องแชท (feedback / message)
    if (action === 'send_message' || data.name) {
      var msgSheet = getOrCreateSheet(ss, 'Messages', ['Timestamp', 'Name', 'Department', 'Category', 'Message', 'Read']);
      msgSheet.appendRow([
        new Date().toLocaleString('th-TH'),
        data.name || 'ไม่ระบุ',
        data.department || '-',
        data.category || 'ทั่วไป',
        data.message || '',
        'ยังไม่อ่าน'
      ]);
      return jsonResponse({ status: 'sent' });
    }

    // 3. บันทึกรายการสื่อ/เกม Arcade (save_admin_links)
    if (action === 'save_admin_links' && data.links) {
      var sheet = getOrCreateSheet(ss, 'Links', [
        'ID', 'หมวดหมู่', 'ชื่อสื่อ/เกม', 'คำอธิบาย', 'ไอคอน', 'URL', 'สถานะ', 'การเปิด', 'สิทธิ์', 'รูปปก', 'ลิงก์ทำสำเนา'
      ]);
      sheet.clearContents();
      sheet.appendRow([
        'ID', 'หมวดหมู่', 'ชื่อสื่อ/เกม', 'คำอธิบาย', 'ไอคอน', 'URL', 'สถานะ', 'การเปิด', 'สิทธิ์', 'รูปปก', 'ลิงก์ทำสำเนา'
      ]);

      var rows = data.links;
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return jsonResponse({ status: 'links_saved', count: rows.length });
    }

    // 4. บันทึกการตั้งค่าเว็บ (save_settings)
    if (action === 'save_settings' && data.settings) {
      var sSheet = getOrCreateSheet(ss, 'Settings', ['Key', 'Value']);
      sSheet.clearContents();
      sSheet.appendRow(['Key', 'Value']);
      for (var key in data.settings) {
        sSheet.appendRow([key, JSON.stringify(data.settings[key])]);
      }
      return jsonResponse({ status: 'settings_saved' });
    }

    return jsonResponse({ status: 'ignored' });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function updateToolStat(ss, toolId, title) {
  var sheet = getOrCreateSheet(ss, 'Stats', ['ToolId', 'ToolTitle', 'Count', 'LastUsed']);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === toolId) {
      var currentCount = Number(data[i][2]) || 0;
      sheet.getRange(i + 1, 3).setValue(currentCount + 1);
      sheet.getRange(i + 1, 4).setValue(new Date().toLocaleString('th-TH'));
      return;
    }
  }
  sheet.appendRow([toolId, title, 1, new Date().toLocaleString('th-TH')]);
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f1f5f9');
    }
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
