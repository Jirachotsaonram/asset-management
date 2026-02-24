# Asset Management System - Launch Guide

This guide describes how to run the three main components of the asset management system.

## 1. Backend (PHP API)
1.  **Start XAMPP**: Open XAMPP Control Panel and start **Apache** and **MySQL**.
2.  **Verify Database**: Ensure you have imported the SQL database from `data/asset_management_db.sql` into phpMyAdmin.
3.  **URL**: The API runs at `http://localhost/asset-management/asset_management_api/`.

## 2. Web Frontend (React)
1.  Navigate to `asset-frontend` folder.
2.  Run `npm install` (first time only).
3.  Run `npm run dev`.
4.  Open the browser at the provided URL (usually `http://localhost:5173`).

## 3. Mobile App (Expo)
1.  Navigate to `asset-mobile` folder.
2.  Run `npm install` (first time only).
3.  **Network Configuration**:
    - Open `src/utils/constants.js`.
    - Change `YOUR_IP_ADDRESS` to your computer's IP (find it with `ipconfig`).
    - Currently set to: `10.88.226.98`.
4.  **Run**:
    - Standard: `npx expo start`
    - **Recommended (if not loading)**: `npx expo start --tunnel`
5.  **Scan**: Use the **Expo Go** app on your phone to scan the QR code in the terminal.

### Windows Troubleshooting
If you get "scripts is disabled" error:
1. Open PowerShell as Administrator.
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---
*Note: Technical fixes for "Duplicate Key" and "Unresponsive App" have been applied. If you still encounter issues, try running with `--tunnel` mode.*
