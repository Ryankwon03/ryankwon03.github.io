# Visitor tracking (Google Sheets, free)

This logs each visitor (once per browser session) to a Google Sheet: **IP**, **country**, **region**, **city**, **page**, and **user agent**. All free (Google Apps Script + ip-api.com).

## 1. Create the Google Sheet and script

1. Create a new Google Sheet (e.g. name it **Website Visitors**).
2. In the sheet: **Extensions → Apps Script**. Delete any sample code and paste in the contents of **VisitorLogger.gs** in this folder. Save (Ctrl/Cmd+S).
3. In the Apps Script editor, run **once** the function **ensureHeaders** (dropdown at top: select `ensureHeaders` → Run). Authorize the app when asked. This creates the header row in the sheet.
4. **Deploy as web app:** **Deploy → New deployment →** choose type **Web app**:
   - **Execute as:** Me  
   - **Who has access:** Anyone  
   - Click **Deploy**, copy the **Web app URL** (looks like `https://script.google.com/macros/s/.../exec`).

## 2. Connect your site

In your Jekyll **\_config.yml**, set the URL you copied:

```yaml
visitor_tracking:
  script_url: "https://script.google.com/macros/s/YOUR_ID/exec"
```

Redeploy your site (e.g. push to GitHub if you use GitHub Pages).  
**Local:** If you use `jekyll serve`, **restart the server** after changing `_config.yml` (Jekyll does not reload the config automatically).

## 3. What you get

- **Logging:** Each visitor is logged once per session (when they first load any page). Their IP and approximate location (from [ip-api.com](https://ip-api.com), no API key) are sent to your script and appended to the sheet.
- **Visitors page:** The **/visitors/** page on your site shows total recorded visits and a table of recent visits (time, IP, country, region, city, page).
- **Sheet columns:** Timestamp, IP, Country, Region, City, Page, User Agent.

All of this is free: Google Apps Script and Google Sheets are free within normal usage; ip-api.com allows 45 requests per minute per IP for non-commercial use.
