# KSM POS v5.7 — Inventory Overlay Cart

Click products directly in Inventory to select quantities. The page stays in Inventory until the floating cart button is pressed.

# KSM POS

KSM POS is a phone-shop point-of-sale, inventory, repair, expense, staff, and receipt system. This version is prepared for **GitHub Pages** and uses **Google Sheets + Google Apps Script** as its online database.

## Default login

- Admin name: `Admin`
- Admin PIN: `1234`
- Staff name: `Staff`
- Staff PIN: `1111`

Change the staff accounts after connecting Google Sheets.

## 1. Create the Google Sheets database

1. Create a new Google Sheet.
2. Open **Extensions → Apps Script**.
3. Delete the existing code in `Code.gs`.
4. Copy all code from `google-apps-script/Code.gs` in this project and paste it into Apps Script.
5. Select the `setupDatabase` function and press **Run** once.
6. Approve the requested Google permissions.

## 2. Deploy Apps Script as a Web App

1. In Apps Script, click **Deploy → New deployment**.
2. Select **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone**.
5. Click **Deploy** and copy the Web App URL ending in `/exec`.

## 3. Test locally

```bash
npm install
npm run dev
```

Open the displayed local URL. Log in with Admin / 1234, open **Settings**, paste the Apps Script Web App URL, click **Test**, then click **Initialize All Sheets**.

## 4. Upload to GitHub

1. Create a new GitHub repository, for example `ksm-pos`.
2. Upload every file and folder from this project.
3. Commit to the `main` branch.
4. Open the repository's **Settings → Pages**.
5. Under **Build and deployment**, choose **GitHub Actions**.
6. Open the **Actions** tab and wait for “Deploy KSM POS to GitHub Pages” to finish.
7. Open the Pages URL shown by GitHub.

The included `.github/workflows/deploy-pages.yml` automatically builds and publishes the app after every push to `main`.

## Important security note

Google Sheets is convenient for a small shop, but an Apps Script Web App deployed to **Anyone** is not a high-security backend. Do not store banking passwords, identity documents, or other highly sensitive data. Change the default PINs immediately.


## KSM POS v2 Update

This version adds:
- Automatic inventory stock deduction after a completed sale
- Stock validation to stop overselling
- Camera/USB barcode and IMEI scanning in Inventory and POS
- Barcode/SKU and Product Image URL fields
- Product images on Inventory/POS cards
- Google Apps Script setup and guide visible only to Admin users

### Required after uploading this update
1. Replace the old Apps Script code with `google-apps-script/Code.gs`.
2. In Apps Script, create a **new deployment** (or edit deployment and choose New version).
3. Keep the same `/exec` URL if updating the existing deployment.
4. Open KSM POS as Admin and click **Initialize All Sheets** once. This adds the `Barcode` and `Image URL` columns to an existing Inventory sheet.
5. For camera scanning, use HTTPS (GitHub Pages is HTTPS) and allow camera permission. Chrome/Android has the best native scanner support. USB barcode scanners work through the manual scan field.
