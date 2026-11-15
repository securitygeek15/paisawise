# PaisaWise Chrome Extension

Smart Buy & Price History Oracle extension for Google Chrome (Manifest V3).

---

## Features
- **Auto-Detection**: Automatically detects when you are viewing a product on **Amazon** (`amazon.in`, `amazon.com`) or **Flipkart** (`flipkart.com`).
- **Floating Check Badge**: Injects a clean, non-intrusive floating button directly on product pages.
- **Side Drawer**: Slide-out drawer displaying verified pricing, 6-month historical line chart (All-time low, average, peak), market timing advice, and working hours reality check.
- **Toolbar Popup**: Click the extension icon in Chrome to view your personal net balance, monthly spending, or instantly check any pasted e-commerce link.
- **100% Local & Private**: Direct communication with your local PaisaWise instance (`http://localhost:8000`). No third-party data tracking.

---

## How to Test Locally in Chrome (Developer Mode)

1. Ensure the PaisaWise backend is running:
   ```bash
   python run.py
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `extension` folder located in this repository:
   ```text
   c:\Users\amaan\Desktop\paisawise\extension
   ```
6. The extension is now installed! Visit any Amazon or Flipkart product page (e.g. Hero Passion bike or Sony XM5 headphones) to test.

---

## How to Publish to the Chrome Web Store

1. **Package the Extension**:
   A zip file named `paisawise-extension.zip` is automatically generated in the root directory. To rebuild it anytime:
   ```bash
   python -c "import os, zipfile; zipf = zipfile.ZipFile('paisawise-extension.zip', 'w', zipfile.ZIP_DEFLATED); [zipf.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), 'extension')) for r, d, files in os.walk('extension') for f in files if not f.endswith('.zip')]; print('Built paisawise-extension.zip')"
   ```

2. **Open Chrome Developer Dashboard**:
   - Go to [https://chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole).
   - Sign in with your Google account (a one-time $5 developer registration fee applies for new accounts).

3. **Upload Item**:
   - Click **New Item** and upload `paisawise-extension.zip`.

4. **Store Listing Details**:
   - **Name**: PaisaWise: Smart Buy & Price History Oracle
   - **Summary**: Check 6-month historical price drops, timing verdicts, and personal financial readiness on Amazon & Flipkart.
   - **Category**: Shopping / Productivity
   - **Icons & Screenshots**:
     - Upload 128x128 icon from `extension/icons/icon-128.png`.
     - Upload at least one 1280x800 or 640x400 screenshot of the extension in action.

5. **Privacy Practices Tab**:
   - Single purpose: "Analyze Amazon and Flipkart product prices and provide personal affordability insights."
   - Host permissions: Amazon and Flipkart for DOM price reading; localhost for communicating with the local PaisaWise engine.
   - Check the declaration that user data is not sold or transferred.

6. **Submit for Review**:
   - Click **Submit for Review**. Review typically takes 24 to 48 hours.
