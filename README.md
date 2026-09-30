# Cafeteria Ordering System

A complete cafeteria ordering platform featuring customer ordering, staff order management, admin analytics, QR validation, and secure API infrastructure.

## Architecture overview

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express REST API
- Persistence: SQLite, with schema patterns ready for PostgreSQL migration
- Realtime: Socket.IO
- Auth: JWT with role-based access
- Payments: payment gateway abstraction with mock/sandbox mode
- QR: QRs generated via qrcode and scanned via html5-qrcode

## File structure

```text
.
├── .env.example
├── package.json
├── README.md
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── components/
│       ├── context/
│       ├── lib/
│       ├── pages/
│       ├── index.css
│       └── main.jsx
├── server/
│   ├── data/
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── __tests__/
└── .gitignore
```

## Setup

1. Copy `.env.example` to `.env` and adjust values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the full app:
   ```bash
   npm run dev
   ```
4. Frontend runs at `http://localhost:5173`
5. Backend runs at `http://localhost:5000`

## Demo logins

- Customer: `customer@example.com` / `Password123!`
- Staff: `staff@example.com` / `Password123!`
- Admin: `admin@example.com` / `Password123!`

## Development notes

- The database initializes automatically on app startup.
- QR tokens are signed as UUID values and validated on the server.
- Orders recalc totals on the server to prevent client tampering.

## Assumptions

- Email delivery is simulated via SMTP configuration and falls back to mock behavior if SMTP is unavailable.
- Payment gateway integration is intentionally abstraction-based and can be completed with Stripe/Flutterwave credentials.
- This project is designed for local development and demo deployment without a full production infrastructure setup.

## Future improvements

- Add full PDF generation and CSV export for staff operations.
- Add more robust audit actions and notifications.
- Expand localization coverage and accessibility tuning.
- Migrate to PostgreSQL and deploy with container orchestration.
