# KSM POS v12

## Repair timestamp fix
- Converts Myanmar digits in old timestamps to English digits.
- Displays and saves all timestamps as `MM/DD/YYYY hh:mm:ss AM/PM`.
- Start Time is saved when the repair is created.
- Finish Time is saved for Done, Delivered, or Reject.
- Reopening as Pending or Repairing clears Finish Time.
- Run `setupDatabase()` after replacing Code.gs to migrate existing timestamps.

# KSM POS v7

## GitHub Pages deployment

1. Upload every file and folder in this project to the repository root. The `.github` folder is required.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Open **Actions → Deploy KSM POS → Run workflow**.
4. Wait for both `build` and `deploy` to become green.

This version uses relative build paths, so it works in repositories such as:

`https://ksm-mobile.github.io/m/`

## Google Sheets

Open KSM POS → Settings and paste the deployed Google Apps Script Web App `/exec` URL. Deploy Apps Script with access set to **Anyone**.

Default local login PINs when no Apps Script is connected:

- Admin: `1234`
- Staff: `1111`


## KSM Branding

This edition includes the official KSM logo, branded loading screen, browser favicon, Apple touch icon, installable PWA manifest, sidebar/login/receipt branding, and mobile header logo.


## v10 updates
- Repair Start Time is saved automatically in English format.
- Repair Finish Time is saved when status becomes Done or Delivered.
- Inventory supports Brand New and Used / Second Hand conditions.
- Accessories include charging cable, charging head, cable+head, earphones, screen protector, case, PowerBank, other, and ငွေဖြည့်ကဒ်.
- Re-run `setupDatabase()` after updating Apps Script so headers are upgraded.


## Google Apps Script files
The full backend is included in `Google-Apps-Script/Code.gs` and `Google-Apps-Script/Index.html`.
All saved/displayed timestamps use US English format: `MM/DD/YYYY hh:mm:ss AM/PM`.
Run `setupDatabase()` once after replacing Code.gs to add/upgrade `Accessory Type`, `Start Time`, and `Finish Time` columns.

## v14 JSON database
This build uses a fast two-column Google Sheet named `separate JSON sheets (Inventory, Sale, Repair, Purchase, Expense, Staff, Settings)` (`ID`, `Record`). Each voucher is stored as one complete JSON record instead of one row per sold item. Run `setupDatabase()` after replacing Apps Script `Code.gs`; legacy sheets are migrated automatically and retained as backup.
