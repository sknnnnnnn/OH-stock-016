# OH STOCK OJ016 — Emergency Release / Browser QA

**RELEASE: BLOCKED — ยังไม่ตรวจรับการส่งจริง ยังไม่ Merge/Deploy**

อัปเดต 19 ตุลาคม 2026: เจ้าของร้านรายงานว่าส่งข้อมูลจริงเข้า Google Sheets สำเร็จและวันที่บันทึกตรงกัน รับเป็น OWNER_REPORTED หลักฐานเบื้องต้นเท่านั้น ยังไม่ใช่ Browser QA ของ Candidate R2 และไม่มีการนำผลนับจริงไปส่งซ้ำโดยผู้ช่วย.

ตรวจวันที่ 19 ตุลาคม 2026 (Asia/Bangkok). Repository `sknnnnnnn/OH-stock-016`.
ฐาน main: `6c1d62bb1b992724e38b5115dc58cf2985aee80f`.
ฐาน PR #1 / branch `fix/sheets-submit-confirmation-r1`: `3959a0d3dcd1de485ed3812ba5c6054b0bf259f5`.
Candidate build marker: `sheets-confirmation-r2`.

## ผลตามหลักฐานจริง

| รายการ | ผล | ขอบเขต |
|---|---|---|
| GitHub main และ PR #1 | PASS | อ่าน source และ diff; สิทธิ์ pull/push/admin ยืนยันแล้ว |
| Firebase Production read | PASS เฉพาะการอ่าน | HTTP 200: Daily 124 รายการ / Weekly 80 รายการ; ไม่ส่งข้อมูลจริงไปทดสอบเขียน |
| Browser เปิด main / Daily | PASS เฉพาะ main เดิม | Chrome จริงเห็น Daily 124/124; ไม่กรอกช่องผลนับหรือกดส่ง |
| สลับ Weekly และค้นหา | PASS เฉพาะ main เดิม | เห็น Weekly 79/80; ค้นหาชื่อทำงาน |
| Reload main | PASS เฉพาะการอ่าน | หลังโหลดเสร็จยังเห็น Daily 124/124. ไม่ใช่หลักฐานทดสอบเขียนแล้วรีโหลด |
| Apps Script status GET | PASS เฉพาะ endpoint อ่าน | HTTP 200, CORS `*`, ได้ `not_found` สำหรับ `oj016-deploymenttest00001` ตรงที่ผู้ใช้ยืนยัน |
| การส่งจริง POST เข้า Sheets | BLOCKED | ไม่มี test Sheets / Apps Script deployment แยก; ไม่ POST ชุดสังเคราะห์หรือชุดจริง 124 รายการไป Production |
| Firebase test save / listener / reload จริง | BLOCKED | ยังไม่มี test database/config/rules ที่เข้าถึงได้. ผู้ใช้ไม่ติดตั้ง Firebase plugin; ไม่แนะนำซ้ำ |
| HTTPS staging ของ candidate | BLOCKED | เตรียม builder และ synthetic fixtures แล้ว แต่ยังไม่มี test endpoints และ hosting ที่ตรวจได้จริง |
| Offline / timeout / response หาย | PASS เฉพาะชุดทดสอบจำลอง | ทดสอบ client transport, handler จริงใน VM และ backend functions ด้วย test doubles; ไม่เรียกว่า Browser network QA |
| Candidate browser regression / มือถือ | BLOCKED | ยังไม่ได้รัน candidate ผ่าน HTTPS staging หรืออุปกรณ์มือถือ |
| Browser Console main | PASS แบบจำกัด | ไม่มี application exception ใน log ที่ตรวจ; มี Tailwind CDN production warning และ error จาก chrome-extension แยกจากแอป |
| Browser Network/HAR และรุ่น Chrome แบบละเอียด | BLOCKED | ชุด API browser ที่ใช้ไม่เปิด network interception/HAR หรือ version info; HTTP read evidence มาจาก read-only HTTP tool ไม่ใช่ HAR |
| Shared backend / OH Store Hub regression จริง | BLOCKED | ตรวจ source/ขอบเขตแพตช์แล้ว แต่ยังไม่ได้ทดสอบครบวงจรกับ test services |
| Merge / Pages release / post-deploy QA | BLOCKED | ไม่ผ่านเกณฑ์ทดสอบเขียน จึงหยุดก่อน Merge ตามคำสั่ง |

## สาเหตุและข้อบกพร่องที่พบ

1. **main ชี้ Apps Script เก่า:** main ใช้ deployment คนละตัวกับที่มี countSubmissionStatus. PR #1 เปลี่ยนเป็น deployment ที่ผู้ใช้ยืนยันแล้ว ทั้ง GET และ POST ใช้ URL เดียวกัน.
2. **main ยืนยันสำเร็จไม่เข้มพอ:** HTTP 200 ที่เป็น HTML, body ว่าง หรือ error schema อาจถูกถือเป็นสำเร็จ. PR เดิมตรวจ ID/count แล้ว แต่ยังไม่เทียบ hash ของผลนับจริง.
3. **PR เดิม replay ก่อนตรวจ:** กดส่งอีกครั้งเมื่อมี journal เดิมอาจ POST ซ้ำก่อนเช็กสถานะ แม้คำตอบเดิมหายหรือข้อมูลปัจจุบันเปลี่ยน. แก้ให้ journal ที่อาจเคยส่งแล้วใช้ GET ตรวจ ID เดิมเท่านั้น. ชุดที่ยืนยันและไม่เปลี่ยน hash ก็ไม่สร้าง POST ใหม่.
4. **timeout ไม่ครอบคลุมทั้งหมด:** PR เดิมยกเลิก timer ก่อนอ่าน JSON และ status GET ไม่มี timer. แก้ให้ timeout ครอบคลุม fetch + อ่าน JSON ของทั้ง POST/GET.
5. **receipt หลังเซลล์:** ไฟล์อ้างอิง `OH016_Apps_Script_fixed.gs` เก็บใบยืนยันใน Script Properties หลัง setValues/flush. ทดสอบจำลองทำให้ receipt write ล้มเหลวแล้วพบว่าชีตถูกเขียนแต่ status เป็น not_found. จึงห้ามใช้ not_found เป็นเหตุให้ส่งซ้ำ.
6. **catalog sync ทับทั้งชุด:** source เดิมอ่านสำเนาเก่าแล้ว set ทับ stock_daily/weekly; เสี่ยงทับการแก้ที่เข้าระหว่างนั้นและตัดสินค้าที่หายจากชีต. แก้ด้วย runTransaction ที่ merge metadata กับผลนับกลางล่าสุดและรักษารายการเดิม.
7. **numeric child key:** Object.values อาจทำให้แถวที่ key เป็น 4 กลายเป็น index 1 แล้วเขียนผิดแถวเมื่อข้อมูลมีช่องว่าง. เก็บ child key จาก Firebase แบบไม่ส่ง metadata นี้ไป Sheets.
8. **เริ่มรอบใหม่:** เก็บสำเนาที่แยกจาก rolling listener backup, ตรวจว่าข้อมูลยังตรงกับที่สำรองก่อน reset, เก็บ explicit zero และหยุดถ้ามี submission รอตรวจ. ไม่ auto-reset ตอนเปิดเว็บ.
9. **สำเนาหลัง listener:** สำเนาก่อนเปลี่ยนรอบ/ซิงก์รายการถูกเก็บแยกพร้อม archive key ไม่ให้ snapshot จาก listener ทับ; JSON export รวมสำเนาเหล่านี้และ pending IDs.

## Candidate ที่แก้แล้ว

- `count-submit.js`: snapshot ก่อนส่ง, submissionId, hash SHA-256 แบบเดียวกับ Apps Script, guard ส่งพร้อมกัน, receipt archive และ status-first recovery.
- `index.html`: คง layout, theme, calculator, filter, field undo และโครงสร้างข้อมูลนับเดิม; เพิ่ม JSON backup button ใน backup modal. ยังใช้ Firebase SDK 10.8.0 เดิม.
- `count-state.js`: merge catalog และ new-round transformation โดยไม่เปลี่ยน input snapshots.
- ถ้ายังมี Firebase save ค้าง จะไม่ส่งหรือเปลี่ยนโหมดทับ. สำรองก่อน submit และ field write; ห้ามส่งเมื่อตัวเลขผิดหรือสำรองก่อนส่งไม่ได้.
- blank counts ยังส่งเป็น 0 ตาม behavior เดิม พร้อมข้อความเตือนก่อนส่ง. ไม่แปลงหน่วยใหม่หรือหัก tare ซ้ำ. เช่น frac1 10.5, gross 208, tare 75 => net 133, รวมเศษ 143.5.
- เก็บ client receipt หลังยืนยัน เพื่อให้การกดซ้ำด้วย snapshot เดิมตรวจ ID เดิม. หลังเริ่มรอบใหม่สำเร็จจึงปลด pointer ของ receipt ล่าสุดสำหรับรอบใหม่ โดยคง archive.

## แพตช์ Apps Script ที่ยังไม่ Deploy

`backend/count-submission-r2.gs` มีเฉพาะ replacement functions ของ counting. คง doGet/doPost routing จาก shared backend เดิม: doPost ต้องส่ง submissionId เข้า saveCount_ ภายใต้ script lock และ doGet route countSubmissionStatus ไปฟังก์ชันใหม่.

แพตช์เก็บ prepared intent ก่อนแตะเซลล์ พร้อม digest แถวที่คาดหวัง แล้ว read-back แถวและส่วนท้ายหลัง flush. ถ้าตอบกลับหายหรือ receipt write ขัดข้อง GET สามารถตรวจแถวจริงแล้ว finalize โดยไม่เขียนผลนับซ้ำ. ถ้า partial write จะคงสถานะ uncertain และกั้น count submission ถัดไปจนตรวจสอบได้. ยังไม่ใช่ transaction ระหว่าง Sheets กับ Properties และยังต้องมีแผนกู้โดยผู้ดูแล.

ไม่ได้เปลี่ยน Store save, Store inventory, incoming receipt, usage หรือ promotion Production. ไฟล์ counting-only ไม่มี credential ระบบ Inventory. ไม่อ้างว่าไฟล์ที่ผู้ใช้ให้เป็น byte-for-byte source ของ deployment จริงจากหลักฐาน GET เพียงอย่างเดียว.

## การทดสอบที่ทำแล้ว

คำสั่ง `node --test --test-reporter=tap tests/*.test.cjs`: **38 PASS / 0 FAIL**. หลักฐาน `evidence/unit-tests.tap`.

- ทดสอบการแปลงตัวเลข หน่วยเดิม tare floor และ hash Unicode.
- Daily/Weekly, ID เดิม payload เดิม/เปลี่ยน, double-click และกดซ้ำหลัง confirmed.
- offline ก่อน POST, คำตอบหายหลัง commit, timeout ตอน fetch/อ่าน body และ status GET, backend rejection, hash ไม่ตรง, localStorage เต็ม.
- เรียก submit/field/catalog/new-round handlers จริงผ่าน VM พร้อม fake Firebase และ fake DOM; ตรวจการเก็บ backup, pending save guard, sparse keys, concurrent edits และ mode isolation.
- เรียกฟังก์ชัน Apps Script ใน VM ด้วย Sheets/Properties doubles; ตรวจ read-back, duplicate ID, write denial, receipt storage failure, corrupted cells และ legacy receipts.
- พิสูจน์ช่องว่างของ backend อ้างอิงเดิมด้วย fault injection. เคสนี้ PASS หมายถึงพิสูจน์ข้อบกพร่องได้ ไม่ได้หมายความว่า backend Production แก้แล้ว.
- Builder ปฏิเสธ production config และตรวจว่า output staging ไม่มี production endpoints. ไม่ได้ provision หรือ deploy test services.
- Syntax checks ของ JS/module/Apps Script candidate และ `git diff --check` ผ่าน.

ชุดทดสอบนี้ไม่ใช่ Firebase Emulator, Google Apps Script จริง, Google Sheets จริง หรือ Browser QA ของ candidate. ไม่มีการอ้างแทนหลักฐานดังกล่าว.

## ข้อจำกัดที่เหลือ

- ไม่มีกลไกอัตโนมัติล้าง journal ที่ผลไม่แน่นอน. ต้องตรวจ ID/ชีต/backup ก่อนปลด ไม่มีปุ่มให้ข้ามการตรวจ.
- localStorage และ Script Properties มี quota; การเก็บ snapshot/receipt เพิ่มขึ้นเรื่อย ๆ ต้อง export และจัดการโดยผู้ดูแล. เมื่อเก็บ journal ไม่ได้ client หยุดก่อน POST.
- listener/read/transaction บน Firebase จริงและการ reconnect ของ SDK ยังต้องทดสอบบน staging; timeout ของ Sheets ไม่ใช่ timeout ของ Firebase SDK.
- ฟีเจอร์เดิมที่มีใน source ยังไม่เท่ากับ regression PASS จนรัน candidate browser/mobile จริง.
- ไม่ทดสอบ POST กับ production แม้ GET status ตอบได้ และไม่เปลี่ยน deployment ร่วมโดยไม่มีสำรอง/อนุมัติ.

## ขั้นตอนปลด BLOCKED

อ่าน `OWNER_ACTIONS_TH.md`: ต้องมี Firebase test config/rules, Sheets/Apps Script test URL และ HTTPS staging. ทดสอบตาม matrix ในคำขอด้วย synthetic data เท่านั้น แล้วตรวจ shared-backend regression. เมื่อทุกข้อสำคัญ PASS จึง Merge PR #1 และตรวจ Pages deploy/build marker กับการอ่านข้อมูลจริงโดยไม่แก้ Production.

คู่มือพนักงานอยู่ใน `STAFF_GUIDE_TH.md`; ขั้นตอนกู้และการตีความ not_found อยู่ใน `RECOVERY_TH.md`. ภาพ browser และ console ที่มีข้อมูลร้านเก็บแยกจาก public repository เป็น `evidence/private-*`.
