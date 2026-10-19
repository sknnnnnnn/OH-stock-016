# OH STOCK OJ016 — Sheets confirmation R2 candidate

**Release BLOCKED — ยังไม่ Merge หรือ Deploy.** ดูผลจริงที่ `RELEASE_QA_TH.md`.

- `index.html`: UI เดิมและ Firebase SDK เดิม เพิ่ม guard, backup และ confirmation flow.
- `count-submit.js`: snapshot, submissionId, SHA-256, timeout และการตรวจสถานะก่อนพิจารณาส่งใหม่.
- `count-state.js`: catalog merge ที่รักษาผลนับ/child keys และการเริ่มรอบใหม่แบบเก็บศูนย์ได้ถูกต้อง.
- `backend/count-submission-r2.gs`: replacement functions เฉพาะ counting ไม่ใช่ shared backend ทั้งไฟล์ และยังไม่ Deploy.
- `backend/count-submission-current-reference.gs`: ส่วน counting จากไฟล์อ้างอิงที่ผู้ใช้มีให้ ใช้พิสูจน์ช่องว่างของ receipt; ไม่ใช่ backend สำหรับนำขึ้นระบบ.
- `staging/`: synthetic fixtures, test backend bootstrap และตัวสร้าง HTTPS staging assets. ยังไม่ได้ provision Firebase/Google Sheets/hosting.
- `tests/`, `evidence/unit-tests.tap`: ชุดทดสอบ Node/VM ข้อมูลสังเคราะห์ ไม่ใช้แทน Browser หรือ Firebase/Sheets จริง.

รันทดสอบ: `node --test --test-reporter=tap tests/*.test.cjs` (Node 20+).

คู่มือพนักงาน: `STAFF_GUIDE_TH.md`; ขั้นตอนกู้: `RECOVERY_TH.md`; สิ่งที่เจ้าของต้องเตรียม: `OWNER_ACTIONS_TH.md`.
