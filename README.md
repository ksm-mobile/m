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
