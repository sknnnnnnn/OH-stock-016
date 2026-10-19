// Counting-only extract from user-provided OH016_Apps_Script_fixed.gs. Not a complete deployable backend.
/**
 * Confirmable counting submissions. Unique submissionId comes from the counting web app.
 * The ID is checked under the existing script lock in doPost(). No automatic retry is needed.
 * Older clients without an ID retain the former behavior.
 */
function countSubmissionStatus_(submissionId) {
  if (!/^oj016-[A-Za-z0-9_-]{12,90}$/.test(submissionId)) {
    return {status:'error', mode:'countSubmissionStatus', message:'Invalid submissionId'};
  }
  var raw = PropertiesService.getScriptProperties().getProperty('COUNT_SUBMISSION_' + submissionId);
  if (!raw) return {status:'not_found', mode:'countSubmissionStatus', submissionId:submissionId};
  var record = JSON.parse(raw);
  return {status:'success', mode:'countSubmissionStatus', submissionId:submissionId,
    confirmed:true, count:record.count, submittedMode:record.mode,
    timestamp:record.timestamp, hash:record.hash};
}

function countPayloadHash_(mode, items) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify({mode:mode,items:items}));
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/,'');
}

function saveCount_(mode, items, submissionId) {
  if (!Array.isArray(items) || !items.length || items.length > 5000) {
    throw new Error('รายการนับว่างหรือจำนวนผิดปกติ: ไม่เขียนชีต');
  }
  var identified = Boolean(submissionId);
  if (identified && !/^oj016-[A-Za-z0-9_-]{12,90}$/.test(submissionId)) {
    throw new Error('Invalid submissionId');
  }
  var hash = countPayloadHash_(mode, items);
  var properties = PropertiesService.getScriptProperties();
  var receiptKey = identified ? 'COUNT_SUBMISSION_' + submissionId : '';
  if (identified) {
    var old = properties.getProperty(receiptKey);
    if (old) {
      var earlier = JSON.parse(old);
      if (earlier.hash !== hash || earlier.mode !== mode) throw new Error('submissionId reused with different data');
      return {status:'success', apiVersion:API_VERSION, mode:mode, count:earlier.count,
        timestamp:earlier.timestamp, submissionId:submissionId, hash:hash, duplicate:true};
    }
  }
  var ss = getSpreadsheet_();
  var sheetName = mode === 'daily' ? 'Stock_Daily' : 'Stock_Weekly';
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  var timestamp = new Date();
  var values = items.map(function(item) {
    var today = item.today || {};
    return [timestamp, item.id || '', item.name || '', item.category || 'ทั่วไป',
      presentNumber_(today.full), presentNumber_(today.frac_normal), presentNumber_(today.frac_tare_net)];
  });
  var oldRows = Math.max(0, sheet.getLastRow() - 1);
  sheet.getRange(2, 1, values.length, 7).setValues(values);
  if (oldRows > values.length) sheet.getRange(values.length + 2, 1, oldRows - values.length, 7).clearContent();
  SpreadsheetApp.flush();
  var receipt = {mode:mode, count:values.length, timestamp:timestamp.toISOString(), hash:hash};
  if (identified) properties.setProperty(receiptKey, JSON.stringify(receipt));
  if (mode === 'daily') properties.setProperty('LAST_DAILY_SUBMISSION_AT', timestamp.toISOString());
  return {status:'success', apiVersion:API_VERSION, mode:mode, count:values.length,
    timestamp:timestamp.toISOString(), submissionId:identified?submissionId:null, hash:hash};
}
