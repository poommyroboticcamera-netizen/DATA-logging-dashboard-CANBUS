# ESP32 Passive CAN Data Logger Dashboard

โปรเจกต์ PlatformIO สำหรับสำรวจและบันทึก Classical CAN ด้วย ESP32 และ CAN transceiver ภายนอก โดยออกแบบหน้าตาและ workflow จาก `DATA-Logging-Dashboard-esp32` แต่เป็น CAN-only และไม่มีโมดูลเซนเซอร์เสริม

## Safety contract

- CAN driver ไม่ทำงานตอน boot
- เปิดจากหน้า CAN Analyzer หรือคำสั่ง Serial `CAN ON`
- TWAI ถูกติดตั้งด้วย `TWAI_MODE_LISTEN_ONLY` เท่านั้น
- transmit queue เป็นศูนย์ และ firmware ไม่มี `twai_transmit()`
- ไม่มีคำสั่งส่ง frame, diagnostic request หรือเปลี่ยนเป็น active mode
- รองรับ Classical CAN เท่านั้น ไม่รองรับ CAN FD

Firmware passivity ไม่ทดแทน hardware safety: ตรวจรุ่น transceiver, logic voltage, standby/silent pin, TX/RX, ground, bitrate และพฤติกรรมช่วง boot/reset ก่อนต่อรถจริง

## ค่าเริ่มต้น

- CAN TX: GPIO25
- CAN RX: GPIO26
- Bitrate: 500 kbit/s (เลือก 50/100/125/250/500/1000 จากหน้าเว็บได้ขณะ CAN ปิด)
- SD: CS5, SCK18, MISO19, MOSI23
- Wi-Fi AP: `ESP32-CAN-Logger`
- Password: `passive-can` — เปลี่ยนก่อนใช้งานจริง

แก้ Wi-Fi ที่ `include/wifi_config.h` หากต้องการให้ ESP32 ต่อเครือข่าย 2.4 GHz เดิมด้วย หากปล่อย SSID ว่าง ให้เปิดหน้า `http://192.168.4.1/` ผ่าน AP ของ ESP32

## Build

ก่อน build ครั้งแรก คัดลอก `include/wifi_config.example.h` เป็น `include/wifi_config.h` แล้วตั้งค่า Wi-Fi ของคุณ ไฟล์ค่าจริงถูกยกเว้นจาก Git

```text
pio run -e esp32dev
pio run -e esp32dev -t upload
pio device monitor -b 115200
```

Build script จะรวม `dashboard/index.html`, CSS และ JavaScript เป็น gzip ใน firmware โดยอัตโนมัติ ไม่ต้อง upload filesystem เพิ่ม

## ความสามารถหลัก

- ค้นหา Standard/Extended ID, DLC, count, timing และความถี่โดยประมาณ
- วิเคราะห์ byte/bit, variance, toggle, signal boundary candidates และ endianness
- ตรวจ rolling counter candidates และ checksum/CRC field candidates แบบ bounded
- Guided learning: baseline เทียบกับ experiment และรายงานเป็น candidate เท่านั้น
- บันทึก raw CAN ลง SD แบบ asynchronous CSV
- แสดง driver/queue/database/SD drops อย่างชัดเจน
- ใช้ฐานข้อมูลและ history แบบ bounded เพื่อควบคุม RAM

CSV:

```csv
timestamp_us,id,extended,dlc,d0,d1,d2,d3,d4,d5,d6,d7
```

## โครงสร้าง

- `src/main.cpp` — Wi-Fi AP, HTTP API และหน้า dashboard
- `src/can/` — passive TWAI service และ analysis algorithms
- `dashboard/` — หน้าเว็บ responsive และ CAN controls
- `scripts/embed_dashboard.py` — ฝังหน้าเว็บลง firmware
- `scripts/analyze_can_csv.py` — วิเคราะห์ checksum hypothesis แบบ offline
- `tests/can/` — analysis, offline analyzer และ passive-contract tests
- `examples/can_bench_generator/` — transmitter สำหรับ isolated bench เท่านั้น ห้ามต่อรถ

Repository: https://github.com/poommyroboticcamera-netizen/DATA-logging-dashboard-CANBUS

## Passive analyzer: ทุก ID

การรับใช้ accept-all ไม่มี ID ของ encoder หรือผู้ผลิตรถฝังอยู่ในตัวกรองหรือ decoder
ตารางแสดง raw bytes ของ Standard 11-bit / Extended 29-bit และ DATA / RTR แยกกัน
ID เลขเดียวกันต่างชนิดจะเป็นคนละ record; RTR ไม่มี payload และ DLC 0 เป็นเฟรมที่ใช้ได้
ยังไม่ตีความข้อมูลใดเป็น encoder, throttle หรือหน่วยทางกายภาพโดยอัตโนมัติ

ฐานข้อมูลเริ่มต้นเก็บ 16 traffic records และตัวอย่างย้อนหลัง 32 เฟรมต่อ record
เมื่อเต็ม สถิติของ record เดิมยังอัปเดต และแสดงจำนวนเฟรมที่ไม่มีช่องเก็บสถิติ
SD logger รับเฟรมแยกจากฐานข้อมูล จึงยังบันทึก ID ที่เกินความจุได้ แต่คิว/SD อาจมี drops
หน้าเว็บแสดง snapshot ล่าสุด ไม่ใช่ทุกเฟรมแบบสด; เก็บ raw CSV เพื่อดูเหตุการณ์สั้น ๆ

## เริ่มรับโดยไม่ใช้เว็บ

Serial 115200 baud รองรับ LF, CRLF และ prefix `:` เช่น:

```text
CAN ON
STATUS
IDS
ID 100 STD
BASELINE 10
EXPERIMENT ENCODER_MOVE 10
SUMMARY
LOG START
LOG STOP
CAN OFF
```

รอ baseline จบก่อนเริ่ม experiment และรอไฟล์ปิดก่อนถอด SD
`CAN ON` เข้า workspace และร้องขอเปิด listen-only driver; รอ `LISTENING` ก่อนทดลอง
`STOP` พักการวิเคราะห์และการส่งเฟรมใหม่เข้า log แต่ยัง drain ตัวรับ; `START` เริ่มต่อ
`CAN OFF` ปิด driver และขอปิด log; `RESET` ล้างสถิติและ capture แต่ไม่ล้าง loss counters

หน้าเว็บแยก driver พร้อมรับออกจากการพบ traffic จริง และรายงาน:

- จำนวนเฟรมตั้งแต่เปิด CAN ครั้งล่าสุด พร้อม STD/EXT/RTR (RTR รวมใน STD/EXT อยู่แล้ว)
- อายุเฟรมล่าสุด; -1 หมายถึงยังไม่เคยรับในรอบเปิดนี้
- REC/TEC, driver start error, bus errors และเฟรมที่ DLC ไม่ตรง Classical CAN
- การพักวิเคราะห์ และฐานข้อมูลเต็ม

จำนวนรับจริงมาจากการ dequeue ของ TWAI รวมถึงขณะพักวิเคราะห์ จึงอาจต่างจากจำนวนวิเคราะห์
errors ของ driver poll ทุก 100 ms; ช่วงก่อนปิด driver อาจมี error ที่ยังไม่ได้ poll
การไม่มี traffic ไม่พิสูจน์ว่าสายเสียหรือ bitrate ผิด เพราะตัวส่งอาจยังไม่ส่งหรือ bus หลับ

## ทดสอบสองบอร์ดของคุณ

1. ตัวรับใช้ firmware จาก PlatformIO โปรเจกต์นี้: TX25, RX26, SN65HVD230, 500 kbit/s
2. ตัวส่งใช้ `examples/can_bench_generator/can_bench_generator.ino`: TX25, RX26, 500 kbit/s
3. ในวงจร bench ที่แยกจากรถ ต่อ GPIO27 ของตัวส่งลง GND และส่ง `ENABLE BENCH`
4. เปิด CAN บนตัวรับ ควรพบ synthetic IDs 0x321 (ทั้ง STD และ EXT), 0x322, 0x345 และ RTR 0x456
5. ตัวส่ง `ACTION ON` เพิ่มการเปลี่ยนค่าและ ID 0x700; ใช้ baseline/action เปรียบเทียบ

ตัวส่ง bench ใช้ No-ACK เพราะตัวรับ passive ไม่ส่ง ACK
ไฟล์ encoder `Documents/Arduino/can/can.ino` ของคุณใช้ Normal mode และคาดหวัง ACK
จึงไม่ใช่ตัวส่งคู่ทดสอบที่เทียบเท่ากันเมื่อมีเพียงสองโหนดและตัวรับเป็น passive
เราไม่ได้เปลี่ยนไฟล์ encoder หรือไฟล์ receiver แบบ Normal mode ใน Arduino

ขา RS ผ่าน 10 kΩ ลง GND ของ SN65HVD230 เป็น slope control; ตัวรับยังทำงาน
Software listen-only ไม่ป้องกันช่วงก่อน driver เริ่มทำงานหรือความผิดปกติทางไฟฟ้า
ทดสอบ hardware บน bench ก่อนนำไปต่อรถจริง

## ตรวจสอบซอฟต์แวร์

```text
node dashboard/can.test.cjs
node dashboard/can.dom.test.cjs
python tests/can/test_passive_contract.py
python tests/can/test_offline_analyzer.py
pio run -e esp32dev
```

Host C++ tests: compile `src/can/Analysis.cpp` คู่กับ `tests/can/test_analysis.cpp`
และ compile `tests/can/test_console.cpp` แยกอีก executable ด้วย C++17
การ build และ host tests ไม่ยืนยันการรับจาก transceiver จริงหรือ sustained-load throughput
