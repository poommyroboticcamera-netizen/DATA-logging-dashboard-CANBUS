(() => {
  'use strict';
  const translations = {"(RTR รวมอยู่ใน STD/EXT)": "(RTR included in STD/EXT)", "CAN IDs ที่พบ": "CAN IDs found", "CAN ปิดอยู่": "CAN is off.", "CAN ยังไม่เปิดรับ · เลือก bitrate แล้วกดเปิด CAN": "CAN is not open yet. · Select bitrate and press open CAN.", "CSV: timestamp_us,id,extended,dlc,d0,d1,d2,d3,d4,d5,d6,d7 · ไม่ลด sample และไม่จำกัดเฉพาะ ID ที่อยู่ในฐานวิเคราะห์": "CSV: timestamp_us,id,extended,dlc,d0,d1,d2,d3,d4,d5,d6,d7 · Does not reduce sample and is not limited to IDs in the analysis base.", "GitHub Pages ใช้ CAN traffic จำลอง หน้า firmware จริงเริ่มต้นโดยปิด CAN และไม่มีคำสั่งส่ง frame": "GitHub Pages uses simulated CAN traffic. The actual firmware page starts with CAN turned off and no frame sending commands.", "Remote request · ไม่มี payload": "Remote request · No payload", "Standard และ Extended แยกกัน": "Standard and Extended are separate.", "traffic records (แยก STD/EXT และ DATA/RTR) · เฟรมที่ไม่มีช่องเก็บสถิติ": "traffic records (separate STD/EXT and DATA/RTR) · Frames without statistics fields", "· SD ยังรับเฟรมเหล่านี้ได้": "· SD can still accept these frames.", "· bus errors สะสม": "· bus errors accumulate", "กำลังบันทึกลง SD": "Saving to SD", "กำลังปิด CAN": "Turning off CAN", "กำลังปิด CAN และไฟล์ CSV": "Closing CAN and CSV files", "กำลังปิด CAN และไฟล์ CSV ก่อนกลับ Overview": "Closing CAN and CSV files before returning to Overview.", "กำลังสร้างไฟล์": "Creating file", "กำลังเขียนข้อมูลค้างและปิดไฟล์": "Stuck writing data and closing file.", "กำลังเปิด CAN": "Opening CAN", "กำลังเปิด CAN แบบ Listen-only": "Opening CAN as listen-only", "ก่อนต่อเข้ารถ": "before connecting to the car", "ขาดการเชื่อมต่อ · สถานะล่าสุดอาจเก่า": "Lost connection · The latest status may be old.", "ดาวน์โหลด CSV": "Download CSV", "ตรวจแรงดัน transceiver, ขา TX/RX, bitrate และ hardware silent behavior ให้ตรงกับวงจรจริง รองรับ Classical CAN เท่านั้น ไม่รองรับ CAN FD": "Check transceiver voltage, TX/RX pin, bitrate and hardware silent behavior to match the actual circuit. Supports Classical CAN only. CAN FD is not supported.", "ตัวอย่างหน้าเว็บเท่านั้น · ไม่มีเฟรม CAN หรือไฟล์ SD จริง": "Web page preview only · No CAN frames or actual SD files included.", "ติดตามได้": "Can follow", "ติดต่อบอร์ดไม่ได้ · ค่าที่แสดงเป็นข้อมูลเก่า": "Unable to contact the board. · Values ​​displayed are old data.", "ทุก valid STD/EXT DATA/RTR frame": "Every valid STD/EXT DATA/RTR frame", "นโยบาย:": "policy:", "บันทึก Bitrate แล้ว · กดเปิด CAN เพื่อเริ่มรับข้อมูล": "Bitrate has been recorded. · Press CAN on to start receiving data.", "บันทึก Raw CAN ทุก ID ลง SD": "Record Raw CAN every ID to SD", "ปิด CAN": "Turn off CAN", "ปิดอยู่": "It's off.", "ปิดไฟล์แล้ว": "File closed", "ปิดไฟล์แล้ว แต่พบข้อผิดพลาดการเขียน": "The file was closed, but a write error was encountered.", "พบ CAN traffic · รับทุก Standard/Extended ID และ DATA/RTR": "Found CAN traffic · Accepts all Standard/Extended ID and DATA/RTR", "มีข้อผิดพลาด SD · ตรวจข้อมูลตกหล่นก่อนใช้ผล": "There is an SD error · Check for missing data before using the results.", "ยังยืนยันสถานะ CAN ไม่ได้:": "Still unable to confirm CAN status:", "ยังไม่พบ CAN frame": "Haven't found CAN frame yet.", "ยังไม่มีเฟรม": "No frame yet", "ยังไม่มีเฟรมเข้าตั้งแต่เปิด CAN · ตรวจตัวส่ง, bitrate, RX26 และสายบัส": "No frames entered since turning on CAN · Check transmitter, bitrate, RX26 and bus cable.", "ยังไม่มีไฟล์": "There is no file yet.", "รอสถานะจากบอร์ด": "Waiting for status from the board", "รับทุก ID และบันทึก CSV ลง SD card": "Get every ID and save CSV to SD card.", "รีเฟรชสถานะ": "Refresh status", "รูปแบบข้อมูล CAN ไม่ตรงกับเฟิร์มแวร์": "The CAN data format does not match the firmware.", "ล้างสถิติ": "Clear statistics", "วินาทีที่แล้ว": "seconds ago", "สถานะการบันทึก": "Recording status", "สถานะการรับจริง": "Actual receipt status", "สร้างไฟล์ CSV ไม่สำเร็จ": "Failed to create CSV file.", "ส่งคำสั่งแล้ว · รอผลจากบอร์ด": "Order sent · Waiting for results from the board", "หยุดบันทึก": "Stop recording", "หยุดอยู่": "ceased to exist", "เขียน SD ไม่สำเร็จ · ข้อมูลบางส่วนอาจสูญหาย": "SD write failed · Some data may be lost.", "เข้า CAN Analyzer แล้ว · เลือก bitrate และกดเปิด CAN": "Enter CAN Analyzer and select bitrate and press CAN on.", "เคยรับเฟรมแล้ว แต่ไม่มีเฟรมใหม่เกิน 2 วินาที · อาจเป็น traffic ที่ส่งไม่ต่อเนื่อง": "Have you ever received a frame? But there are no new frames for more than 2 seconds. · It may be traffic that is sent intermittently.", "เปลี่ยนโหมดไม่สำเร็จ:": "Failed to change mode:", "เปิด CAN": "Open CAN", "เปิด CAN ไม่สำเร็จ": "Failed to open CAN", "เปิด SD ไม่สำเร็จ · ตรวจการ์ดและสาย": "Failed to open SD · Check card and cable.", "เปิดตัวรับแล้ว · Listen-only": "Receiver opened · Listen-only", "เปิดตัวรับไม่สำเร็จ · error": "Failed to open receiver · error", "เฟรมตั้งแต่เปิด CAN:": "Frames since CAN turned on:", "เฟรมล่าสุด": "Latest frame", "เริ่มบันทึก CSV": "Start saving CSV", "ใช้ bitrate": "Use bitrate", "ไฟล์:": "file:", "ไม่มีการส่ง arbitrary frame, ACK หรือ diagnostic request": "No arbitrary frame, ACK, or diagnostic request is sent.", "ไม่มีไฟล์": "No files", "ไม่วัด RAM ในหน้า demo": "RAM is not measured on the demo page."};
  const entries = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);
  const originals = new Map();
  const thai = /[\u0e00-\u0e7f]/;
  const storageKey = 'dashboard-language';
  let language;
  try { language = localStorage.getItem(storageKey) === 'th' ? 'th' : 'en'; }
  catch { language = 'en'; }

  function english(value) {
    const trimmed = value.trim();
    if (Object.hasOwn(translations, trimmed)) return value.replace(trimmed, translations[trimmed]);
    let result = value;
    for (const [source, target] of entries) {
      if (result.includes(source)) result = result.split(source).join(target);
    }
    return result;
  }

  function visit(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (thai.test(root.nodeValue)) {
        originals.set(root, root.nodeValue);
        if (language === 'en') root.nodeValue = english(root.nodeValue);
      }
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.tagName)) return;
    for (const name of ['aria-label', 'placeholder', 'title']) {
      const value = root.getAttribute(name);
      if (value && thai.test(value)) {
        originals.set(root, {...(originals.get(root) || {}), [name]: value});
        if (language === 'en') root.setAttribute(name, english(value));
      }
    }
    for (const child of root.childNodes) visit(child);
  }

  function apply() {
    document.documentElement.lang = language;
    document.getElementById('language-switch').textContent = language === 'en' ? 'ไทย' : 'English';
    for (const [node, original] of originals) {
      if (!node.isConnected) { originals.delete(node); continue; }
      if (node.nodeType === Node.TEXT_NODE) node.nodeValue = language === 'th' ? original : english(original);
      else for (const [name, value] of Object.entries(original)) node.setAttribute(name, language === 'th' ? value : english(value));
    }
    window.dispatchEvent(new CustomEvent('dashboard-language-change', {detail: {language}}));
  }

  visit(document.body);
  apply();
  document.getElementById('language-switch').addEventListener('click', () => {
    language = language === 'en' ? 'th' : 'en';
    try { localStorage.setItem(storageKey, language); } catch {}
    apply();
  });
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') visit(record.target);
      for (const node of record.addedNodes) visit(node);
    }
  });
  observer.observe(document.body, {subtree: true, childList: true, characterData: true});
  window.DashboardLanguage = {get current() { return language; }, translate: english};
})();
