/* Counting-only replacement functions for the shared Apps Script.
 * Keep existing doGet/doPost routing, Store, usage, incoming and promotion code unchanged.
 * Install only in an isolated test deployment first. Requires the script lock in doPost.
 */
function countPayloadHash_(mode, items) {
  return countDigest_(JSON.stringify({mode:mode,items:items}));
}
function countDigest_(text) {
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8)).replace(/=+$/,'');
}
function countRowsHash_(rows) {
  return countDigest_(JSON.stringify(rows.map(function(r){return [r[0] instanceof Date?r[0].toISOString():String(r[0]||''),String(r[1]),String(r[2]),String(r[3]),Number(r[4]),Number(r[5]),Number(r[6])]})));
}
function countValidId_(id) {return /^oj016-[A-Za-z0-9_-]{12,90}$/.test(id)}
function countRecordedRowsMatch_(record) {
  var sheet=getSpreadsheet_().getSheetByName(record.sheetName);
  if(!sheet||sheet.getLastRow()<record.count+1)return false;
  var rows=sheet.getRange(2,1,record.count,7).getValues();
  if(countRowsHash_(rows)!==record.rowsHash)return false;
  if(record.oldRows>record.count){var tail=sheet.getRange(record.count+2,1,record.oldRows-record.count,7).getValues();if(tail.some(function(row){return row.some(function(v){return v!==''&&v!==null})}))return false}
  return true;
}
function countFinishReceipt_(id,record) {
  var props=PropertiesService.getScriptProperties();
  if(record.phase==='prepared'){
    if(!countRecordedRowsMatch_(record))return null;
    record.phase='confirmed';props.setProperty('COUNT_SUBMISSION_'+id,JSON.stringify(record));
  }
  // Repair metadata after a crash without rewriting the count cells.
  if(record.mode==='daily'){
    var old=props.getProperty('LAST_DAILY_SUBMISSION_AT');
    if(!old||old<record.timestamp)props.setProperty('LAST_DAILY_SUBMISSION_AT',record.timestamp);
  }
  if(props.getProperty('COUNT_PENDING_'+record.mode)===id)props.deleteProperty('COUNT_PENDING_'+record.mode);
  return record;
}
function countSubmissionStatus_(submissionId) {
  if(!countValidId_(submissionId))return {status:'error',mode:'countSubmissionStatus',message:'Invalid submissionId'};
  var lock=LockService.getScriptLock();
  if(!lock.tryLock(20000))return {status:'pending',mode:'countSubmissionStatus',submissionId:submissionId};
  try{
    var raw=PropertiesService.getScriptProperties().getProperty('COUNT_SUBMISSION_'+submissionId);
    if(!raw)return {status:'not_found',mode:'countSubmissionStatus',submissionId:submissionId};
    var record=JSON.parse(raw);
    // Earlier backend receipts had no phase and already represented completed writes.
    if(record.phase==='prepared'&&!countFinishReceipt_(submissionId,record))return {status:'uncertain',mode:'countSubmissionStatus',submissionId:submissionId};
    return {status:'success',mode:'countSubmissionStatus',submissionId:submissionId,confirmed:true,count:record.count,submittedMode:record.mode,timestamp:record.timestamp,hash:record.hash};
  }finally{lock.releaseLock()}
}
function countFinite_(v){if(v===''||v==null)return 0;var n=Number(v);if(typeof v==='boolean'||!isFinite(n)||n<0)throw Error('Invalid count number');return n}
function saveCount_(mode,items,submissionId) {
  if(mode!=='daily'&&mode!=='weekly')throw Error('Invalid count mode');
  if(!Array.isArray(items)||!items.length||items.length>5000)throw Error('Empty or oversized count');
  var identified=!!submissionId;
  if(identified&&!countValidId_(submissionId))throw Error('Invalid submissionId');
  var props=PropertiesService.getScriptProperties(),hash=countPayloadHash_(mode,items),receiptKey='COUNT_SUBMISSION_'+submissionId;
  if(identified){var raw=props.getProperty(receiptKey);if(raw){var old=JSON.parse(raw);if(old.hash!==hash||old.mode!==mode)throw Error('submissionId reused with different data');if(!countFinishReceipt_(submissionId,old))throw Error('Previous write requires reconciliation; no replay');return {status:'success',apiVersion:API_VERSION,mode:mode,count:old.count,timestamp:old.timestamp,submissionId:submissionId,hash:hash,duplicate:true}}}
  var pendingId=props.getProperty('COUNT_PENDING_'+mode);
  if(pendingId){var pending=JSON.parse(props.getProperty('COUNT_SUBMISSION_'+pendingId)||'null');if(!pending||!countFinishReceipt_(pendingId,pending))throw Error('Previous count write unresolved; no overwrite')}
  var seen={},timestamp=new Date();
  var values=items.map(function(item){var id=String(item.id||'').trim();if(!id||seen[id])throw Error('Empty or duplicate product ID');seen[id]=true;var today=item.today||{};return [timestamp,id,String(item.name||''),String(item.category||'ทั่วไป'),countFinite_(today.full),countFinite_(today.frac_normal),countFinite_(today.frac_tare_net)]});
  var ss=getSpreadsheet_(),sheetName=mode==='daily'?'Stock_Daily':'Stock_Weekly',sheet=ss.getSheetByName(sheetName)||ss.insertSheet(sheetName),oldRows=Math.max(0,sheet.getLastRow()-1);
  var receipt={mode:mode,count:values.length,timestamp:timestamp.toISOString(),hash:hash,phase:'prepared',sheetName:sheetName,oldRows:oldRows,rowsHash:countRowsHash_(values)};
  // Persist intent before the first count-cell write; a second POST may not replay it.
  if(identified){props.setProperty(receiptKey,JSON.stringify(receipt));props.setProperty('COUNT_PENDING_'+mode,submissionId)}
  sheet.getRange(2,1,values.length,7).setValues(values);
  if(oldRows>values.length)sheet.getRange(values.length+2,1,oldRows-values.length,7).clearContent();
  SpreadsheetApp.flush();
  if(!countRecordedRowsMatch_(receipt))throw Error('Count read-back verification failed');
  receipt.phase='confirmed';
  if(identified)props.setProperty(receiptKey,JSON.stringify(receipt));
  if(mode==='daily')props.setProperty('LAST_DAILY_SUBMISSION_AT',receipt.timestamp);
  if(identified&&props.getProperty('COUNT_PENDING_'+mode)===submissionId)props.deleteProperty('COUNT_PENDING_'+mode);
  return {status:'success',apiVersion:API_VERSION,mode:mode,count:values.length,timestamp:receipt.timestamp,submissionId:identified?submissionId:null,hash:hash};
}
