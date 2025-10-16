MyFinanceClub — Deployment & Setup

1. Files
   - index.html
   - styles.css
   - app.js
   - apps_script_code.txt

2. Google Sheet
   - Create a Google Sheet to receive applications.
   - Copy Sheet ID (from URL /d/<SHEET_ID>/edit).

3. Google Apps Script
   - Go to https://script.google.com/ -> New project.
   - Paste content of apps_script_code.txt into Code.gs.
   - Replace placeholders:
       SHEET_ID, SECRET_KEY, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_RECIPIENT
   - Save.
   - Deploy -> New deployment -> Web app:
        Execute as: Me
        Who has access: Anyone (or Anyone with Google account)
   - Copy the Web App URL (the /exec endpoint).

4. Client config
   - In app.js replace:
       const SCRIPT_URL = '<<YOUR_GOOGLE_APPS_SCRIPT_EXEC_URL>>';
       const SECRET_KEY = '<<YOUR_SECRET_KEY>>';
   - Optionally replace lender phone in index.html (#lenderPhone).

5. Test
   - Host static files (GitHub Pages / Netlify / local).
   - Open site -> Apply -> complete 4 steps -> Submit.
   - Check Google Sheet for new row.
   - Check email and WhatsApp (if configured) for notifications.
   - Check Google Drive folder "MyFinanceClub_Application_Files" for uploaded documents.

Security Advice:
 - Use a long random SECRET_KEY and never publish it.
 - Limit Apps Script access and monitor the Drive folder.
 - Consider enabling "Anyone with Google account" to restrict anonymous abuse.




