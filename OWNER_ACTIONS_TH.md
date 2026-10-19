# สิ่งที่ต้องมีเพื่อปลด Release BLOCKED

ไม่จำเป็นต้องติดตั้งปลั๊กอิน Firebase. ใช้ URL/config ของระบบทดสอบที่เจ้าของจัดเตรียมไว้และสิทธิ์ที่เข้าถึงได้แทนได้. อย่าส่ง password, service-account key หรือ token ในแชต.

1. Firebase test project/database แยกจาก `oj-stock-a6af4` พร้อม web config และ rules ที่เหมาะกับสภาพแวดล้อมทดสอบ. ใช้เฉพาะข้อมูลจาก `staging/synthetic-data.json`. ห้ามลดสิทธิ์ป้องกันของ Production เพื่อให้ทดสอบผ่าน.
2. Google Sheets เปล่าสำหรับทดสอบ และ Apps Script web app แยก URL จาก Production. แบบเริ่มต้นอยู่ใน `staging/Code.gs` โดยตั้ง Script Property `TEST_SPREADSHEET_ID` เป็นชีตทดสอบ และเพิ่ม `backend/count-submission-r2.gs`. แบบเริ่มต้นนี้ทดสอบสัญญา API นับของเท่านั้น ไม่ใช่หลักฐานว่า shared backend ทุกโมดูลผ่าน.
3. สำหรับ regression ร่วม Store Hub ให้ใช้สำเนา shared Apps Script ฉบับปัจจุบันใน test project และ test Sheets/Drive แยกทั้งหมด. แทนเฉพาะฟังก์ชัน counting ตามแพตช์ R2 โดยคง route Store, usage, incoming และ promotion เดิม. ไม่คัดลอก credential ของระบบ Inventory เข้า repository หรือ browser.
4. กรอก config ทดสอบลง `staging/config.local.json` ตามตัวอย่าง แล้วรัน `python staging/build_staging.py --config staging/config.local.json --out staging/dist`. นำไฟล์ dist ขึ้น HTTPS staging ที่เจ้าของควบคุม. Builder ปฏิเสธ database และ deployment Production ที่ทราบ.
5. ทดสอบจริงผ่าน browser: นับ/บันทึก/รีโหลด/Daily/Weekly/POST/ID เดิม/offline ก่อนส่งและหลัง commit/timeout/permission denial/status/backup/new round/มือถือ. เทียบเซลล์ใน test sheet, Firebase test data, journal และ receipt พร้อม Console, Network และ screenshot.
6. ก่อนเปลี่ยน shared Apps Script Production ต้องสำรอง project/deployment version, ชีต และข้อมูลที่เกี่ยวข้อง แล้วตรวจแพตช์และอนุมัติแยกต่างหาก. รอบงานนี้ยังไม่แก้ Deployment Production.
7. เมื่อข้อสำคัญ PASS จึงตรวจ Final Diff และ Merge PR #1 จาก candidate ที่ทดสอบจริง. รอ Pages deploy แล้วตรวจ build marker `sheets-confirmation-r2`, หน้าตา, GET และผลนับเดิมแบบไม่แก้ Production. อย่านำข้อมูลจริง 124 รายการไปทดลอง POST.

ยังไม่ได้รับ test endpoint, สิทธิ์จัดการ Apps Script หรือ HTTPS staging จึงยังไม่เริ่มทดสอบเขียนจริง. ไม่มีข้อกำหนดให้เจ้าของต้องย้าย Production หรือแชร์หน้าจอ.
