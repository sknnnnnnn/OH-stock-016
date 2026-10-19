# เตรียมปลด BLOCKED — OJ016 R2

อัปเดต 19 ตุลาคม 2026. ไม่ Merge ไม่เปลี่ยน Production และไม่แตะยอด Store Manual.

เจ้าของร้านยืนยันด้วยตนเองว่าส่งผลนับเข้า Google Sheets สำเร็จและวันที่ตรงกัน ถือเป็นหลักฐานเบื้องต้น OWNER_REPORTED ไม่ใช่ผล QA ครบวงจรของ Candidate R2.

## เตรียมให้แล้ว

- Google Sheets ใหม่ ส่วนตัว: **OJ016 TEST R2 - Synthetic Only**
  `https://docs.google.com/spreadsheets/d/1YW7786t_3BCDbMkU6-mWX5eMGXPnclhnxyolkC604lU/edit?pli=1&gid=0#gid=0`
- Apps Script ใหม่: **OJ016 TEST R2 - Synthetic Only**
  `https://script.google.com/home/projects/1XDLQ7qWPTsl_VtEfsMyZWiLq-JOG2OqYcJDTEUtVp3m7hFfbubGk2_JL/edit`
  บันทึก R2 counting test backend และ setupSyntheticTest แล้ว ผูกเฉพาะชีตใหม่ข้างต้น พร้อม guard ห้ามใช้ sheet ร้าน. การรัน setup หยุดที่ Google identity verification ก่อนได้รับสิทธิ์ จึงยังไม่ยืนยันว่ารันสำเร็จหรือ Deploy test endpoint แล้ว.
- HTTPS staging ส่วนตัวเผยแพร่สำเร็จ:
  `https://oj016-r2-staging.newpike2.chatgpt.site`
  Sites project `appgprj_6ad60b5db41881919849c485f0cb8e20`, source `a2ab37cbfa4d2603907407b68772b037c6ab66b8`.
  มี Candidate R2 source และ config guard. ยังไม่ initialize Firebase หรือเรียก Sheets จนมี test config; ไม่มี production endpoints ใน served HTML. ไม่ใช่หลักฐานว่า Candidate Browser QA ผ่านแล้ว.
- Firebase Console เปิดได้ เตรียมชื่อ **OJ016 Test R2** และปิดการสมัคร Google Developer Program เพิ่มเติม. ยังไม่สร้าง project เพราะหน้าสร้างบังคับยอมรับ Firebase terms ครั้งแรก ซึ่งต้องรออนุมัติจากเจ้าของ.

## งานเจ้าของที่จำเป็น ณ ตอนนี้

1. ยืนยัน Google Prompt บนอุปกรณ์ของเจ้าของตามเลขที่หน้า Google แสดงในขณะนั้น. ห้ามส่ง password หรือ OTP ในแชต. เลขอาจเปลี่ยนเมื่อคำขอหมดอายุ.
2. อนุมัติการยอมรับ Firebase terms สำหรับโปรเจกต์ **OJ016 Test R2**. ไม่ใช่การติดตั้งปลั๊กอิน และไม่ใช่การอนุมัติแก้ Production.
3. หลังยืนยันตัวตน ผู้ช่วยจะตรวจสิทธิ์ที่ Google ขอจริงก่อนอนุญาต Apps Script Test. ณ ตอนบันทึก ยังไม่เห็นหน้าขอบเขตสิทธิ์สุดท้าย จึงยังไม่อ้างว่าได้รับอนุญาตหรือขออนุมัติสิทธิ์ที่ยังไม่ทราบ.

หลังผ่านจุดเหล่านี้ ผู้ช่วยจะจัด Firebase Realtime Database Test, web app config, test deployment, synthetic seeds และใส่ config ใน staging ให้เองตามสิทธิ์ที่มี โดยไม่ให้เจ้าของคัดลอกโค้ดหรือสร้าง hosting เอง.

ยังไม่เพิ่มบัญชี billing, ไม่ยอมรับเงื่อนไขแทนโดยไม่มีอนุมัติ, ไม่เปิดสิทธิ์ Production และไม่ Merge จนกว่าการทดสอบสำคัญผ่าน.
