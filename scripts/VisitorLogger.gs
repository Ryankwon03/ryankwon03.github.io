/**
 * Website Visitor Logger - Google Apps Script
 * Saves visitor IP, location, and page to a Google Sheet (free).
 *
 * SETUP:
 * 1. Create a new Google Sheet (e.g. "Website Visitors").
 * 2. In the sheet: Extensions → Apps Script. Paste this entire file and save.
 * 3. Add a menu or run once: run ensureHeaders() to create the header row.
 * 4. Deploy: Deploy → New deployment → Type: Web app
 *    - Execute as: Me | Who has access: Anyone
 *    - Copy the Web app URL.
 * 5. In your Jekyll _config.yml set: visitor_tracking: script_url: "YOUR_WEB_APP_URL"
 *
 * URL parameters (GET):
 * - action=log & ip= & country= & region= & city= & page= & ua=  → append one row
 * - action=stats & callback=fn  → return JSONP with count and recent rows (for your Visitors page)
 */

var SHEET_NAME = 'Website Visitors';

function ensureHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 7).setValues([['Timestamp', 'IP', 'Country', 'Region', 'City', 'Page', 'User Agent']]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }
}

function doPost(e) {
  return doGet(e);
}

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {};
  var action = (params.action || '').toLowerCase();
  var out;

  if (action === 'log') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
      if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, 7).setValues([['Timestamp', 'IP', 'Country', 'Region', 'City', 'Page', 'User Agent']]);
        sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
      }
      sheet.appendRow([
        new Date(),
        params.ip || '',
        params.country || '',
        params.region || '',
        params.city || '',
        params.page || '',
        params.ua || ''
      ]);
      out = { ok: true };
    } catch (err) {
      out = { ok: false, error: String(err) };
    }
    return ContentService.createTextOutput(JSON.stringify(out))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'stats') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(SHEET_NAME);
      var count = 0;
      var recent = [];
      if (sheet && sheet.getLastRow() > 1) {
        var data = sheet.getDataRange().getValues();
        count = data.length - 1; // minus header
        var start = Math.max(1, data.length - 50); // last 50
        for (var i = data.length - 1; i >= start && i >= 1; i--) {
          recent.push({
            timestamp: data[i][0] ? String(data[i][0]) : '',
            ip: data[i][1] || '',
            country: data[i][2] || '',
            region: data[i][3] || '',
            city: data[i][4] || '',
            page: data[i][5] || '',
            ua: data[i][6] || ''
          });
        }
      }
      var payload = { count: count, recent: recent };
      var callback = params.callback || '';
      var body = callback ? callback + '(' + JSON.stringify(payload) + ')' : JSON.stringify(payload);
      var mime = callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
      return ContentService.createTextOutput(body).setMimeType(mime);
    } catch (err) {
      out = { count: 0, recent: [], error: String(err) };
      var cb = params.callback || '';
      var body = cb ? cb + '(' + JSON.stringify(out) + ')' : JSON.stringify(out);
      var mime = cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON;
      return ContentService.createTextOutput(body).setMimeType(mime);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}
