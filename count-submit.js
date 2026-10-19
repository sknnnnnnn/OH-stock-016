/* Confirm counting writes by ID and exact payload hash. No automatic POST retry. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.OJCountSubmit=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function number(value){if(value==null||value==='')return 0;if(typeof value==='boolean'||!Number.isFinite(Number(value))||Number(value)<0)throw Error('จำนวนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป');return Number(value)}
  function process(items){if(!Array.isArray(items)||!items.length||items.length>5000)throw Error('ไม่มีผลนับที่จะส่ง');const ids=new Set();return items.map(item=>{const id=String(item.id||'').trim();if(!id||ids.has(id))throw Error('รหัสสินค้าว่างหรือซ้ำ');ids.add(id);const today=copy(item.today||{}),f1=number(today.frac1),f2=number(today.frac2),tare=number(item.tare);number(today.full);return {...copy(item),today:{...today,frac_normal:f1,frac_tare_net:Math.max(0,f2-tare),frac:f1+Math.max(0,f2-tare)}}})}
  async function hash(mode,items,crypto){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({mode,items})));const binary=String.fromCharCode(...new Uint8Array(bytes));return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function create({url,storage,fetch,crypto,onLine=()=>true,timeout=30000}){
    let busy=false;
    const key=mode=>'oh_stock_pending_sheet_submit_'+mode;
    function pending(mode){if(!['daily','weekly'].includes(mode))throw Error('โหมดไม่ถูกต้อง');const raw=storage.getItem(key(mode));return raw?JSON.parse(raw):null}
    async function request(endpoint,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);try{const r=await fetch(endpoint,{redirect:'follow',cache:'no-store',...options,signal:controller.signal});if(!r.ok)throw Error('Apps Script HTTP '+r.status);const data=await r.json();return data}finally{clearTimeout(timer)}}
    function matches(result,j,status=false){return result?.status==='success'&&result.submissionId===j.submissionId&&(status?result.mode==='countSubmissionStatus'&&result.confirmed===true&&result.submittedMode===j.mode:result.mode===j.mode)&&Number(result.count)===j.items.length&&result.hash===j.hash&&Number.isFinite(Date.parse(result.timestamp))}
    async function validate(j){if(!j||!/^oj016-[A-Za-z0-9_-]{12,90}$/.test(String(j.submissionId))||!['daily','weekly'].includes(j.mode)||!Array.isArray(j.items)||!j.items.length)throw Error('สำเนาการส่งเดิมไม่ถูกต้อง ห้ามส่งซ้ำ');const computed=await hash(j.mode,j.items,crypto);if(j.hash&&j.hash!==computed)throw Error('สำเนาการส่งเดิมไม่ตรง hash');return {...j,hash:computed}}
    function archive(j,result){storage.setItem('oh_stock_sheet_receipt_'+j.submissionId,JSON.stringify({...j,confirmation:result,confirmedAt:new Date().toISOString()}));storage.setItem('oh_stock_last_sheet_receipt_'+j.mode,j.submissionId);storage.removeItem(key(j.mode));return {status:'confirmed',journal:j,result}}
    async function check(j){const result=await request(url+'?mode=countSubmissionStatus&submissionId='+encodeURIComponent(j.submissionId)+'&t='+Date.now());if(matches(result,j,true))return archive(j,result);return {status:'uncertain',journal:j,result}}
    async function verify(mode){if(busy)throw Error('กำลังตรวจรายการส่ง');busy=true;try{const j=pending(mode);return j?await check(await validate(j)):{status:'none'}}finally{busy=false}}
    async function submit(mode,items){if(busy)throw Error('กำลังส่งหรือเช็กสถานะ กรุณารอ');busy=true;try{
      let old=pending(mode);
      // Any journal written by an older client may already have been sent. Check ONLY.
      if(old&&old.phase!=='prepared')return await check(await validate(old));
      const prepared=process(items),digest=await hash(mode,prepared,crypto);
      if(!old){const lastId=storage.getItem('oh_stock_last_sheet_receipt_'+mode);const last=lastId?JSON.parse(storage.getItem('oh_stock_sheet_receipt_'+lastId)||'null'):null;if(last&&last.hash===digest)return await check(await validate(last))}
      if(old){old=await validate(old);if(old.hash!==digest){storage.setItem('oh_stock_unsent_backup_'+old.submissionId,JSON.stringify(old));old=null}}
      let j=old||{submissionId:'oj016-'+crypto.randomUUID().replace(/-/g,''),mode,savedAt:new Date().toISOString(),items:prepared,hash:digest,phase:'prepared'};
      storage.setItem(key(mode),JSON.stringify(j)); // Failure here sends no network request.
      if(!onLine())return {status:'offline',journal:j};
      j={...j,phase:'sending'};storage.setItem(key(mode),JSON.stringify(j));
      try{const result=await request(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({mode,items:j.items,submissionId:j.submissionId})});if(matches(result,j))return archive(j,result);throw Error('ไม่พบคำยืนยันที่ตรงกับผลนับ')}
      catch(error){try{return await check(j)}catch(checkError){return {status:'uncertain',journal:j,error:String(error.message||error),checkError:String(checkError.message||checkError)}}}
    }finally{busy=false}}
    return {submit,verify,pending,isBusy:()=>busy};
  }
  return {process,hash,create};
});
