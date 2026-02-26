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

## 4. GitHub Pages and CSP

**GitHub Pages enforces a Content Security Policy (CSP)** that can block requests from your site to `script.google.com`. If tracking works locally but not on `*.github.io`, CSP is likely the cause.

**What’s in place:**

- A **CSP meta tag** is added in `_includes/head.html` when `visitor_tracking.script_url` is set. It allows `img-src` and `connect-src` to `script.google.com`, `script.googleusercontent.com`, and the geo APIs. This may help if GitHub doesn’t send a stricter CSP header; if GitHub’s header wins, the meta tag won’t be enough.

**If it still doesn’t work: use a proxy**

GitHub Pages doesn’t let you change the response headers, so you can’t relax the server CSP. A reliable fix is to send logs via a **proxy** that forwards to your Apps Script:

1. **Deploy a small proxy** that:
   - Accepts GET (and optionally POST) with the same query params as the Apps Script (`action`, `ip`, `country`, `region`, `city`, `page`, `ua`).
   - Forwards the request to your real Apps Script URL:  
     `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=...&ip=...&...`
   - Returns the script’s response (e.g. `{"ok":true}`).

2. **Host the proxy** on a service that isn’t subject to GitHub’s CSP, for example:
   - **Cloudflare Workers** (free tier): create a Worker that does `fetch(SCRIPT_URL + '?' + request.url.search)` and returns the result.
   - **Netlify / Vercel serverless function**: same idea — receive the request, proxy to the Apps Script URL, return the response.
   - **Google Cloud Functions / AWS Lambda**: HTTP endpoint that proxies to your Apps Script.

3. **Point the site at the proxy:**  
   In `_config.yml`, set `visitor_tracking.script_url` to your **proxy URL** instead of the `script.google.com` URL. The browser then talks only to the proxy; the proxy talks to Google, so GitHub’s CSP doesn’t block the outbound request to script.google.com.

**Minimal Cloudflare Worker example** (proxy):

```js
// Cloudflare Worker: forward GET to your Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = SCRIPT_URL + url.search;
    return fetch(target, { method: 'GET' });
  },
};
```

Deploy the Worker, then set `script_url` to the Worker URL (e.g. `https://your-worker.your-subdomain.workers.dev`).
