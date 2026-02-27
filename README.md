# SUVIDHA Kiosk Demo

This workspace contains the kiosk application for three departments: Electricity, Gas, and Municipal Services. All code now lives together at the top level (no separate folders) so you can open a single directory and run the demo.

## Frontend files
- `index.html` – landing page with buttons to each department
- `electricity.html`, `gas.html`, `municipal.html` – service screens
- `style.css` – shared styles

## Backend (municipal demo)
- `server.js` – Express server using MySQL
- `package.json` – dependencies (`express`, `mysql2`)
- `db/schema.sql` – database schema
- `db/seed.sql` – sample data for certificates/complaints

## Getting started
1. Install MySQL and create the `suvidha` database:
   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"<your-password>" -e "CREATE DATABASE suvidha;"
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"<your-password>" suvidha < db/schema.sql
   & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p"<your-password>" suvidha < db/seed.sql
   ```
2. Install dependencies and start server:
   ```powershell
   cd "d:\SUVIDHA 2026"
   npm install
   $env:DB_PASS="<your-password>"  # modify if needed
   npm start
   ```

> **Note:** The municipal lookup and complaint API are rate‑limited to 10 requests per minute per IP address to prevent abuse. A `429` status will be returned if you exceed this limit.

3. Open kiosk in browser: http://localhost:3000/municipal.html (or click the Municipal card on landing page)
## Operator & Admin

- Operator portal: http://localhost:3000/operator/index.html
  (uses retrieval‐code verification)
- Admin dashboard: http://localhost:3000/admin/index.html
  Default admin credentials: **admin / admin123**
## Notes
- SMS messages (OTP, retrieval code, complaint ID) are printed to server console.
- The municipal page presents all available services in grouped cards; select the one you need and follow on-screen prompts.
- This repo now lives in one folder per your request – no separate `municipal_demo` directory.
