# Cylendra-Wala (LPG Cylinder Delivery Logistics Platform)

Hinglish + simple demo full‑stack project for: **Customers, Dealers, Riders, Admin**.

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), JWT Auth, bcrypt
- Frontend: React (Vite), Axios, React Router, Leaflet (react-leaflet)
- Integrations:
  - Razorpay (auto **demo payment** when keys missing)
  - Email OTP via Nodemailer (auto **demo OTP** when SMTP missing)
- Hosting target: Backend Render, Frontend Vercel, DB MongoDB Atlas

## Monorepo Structure

- `apps/backend` – Express API + MongoDB
- `apps/frontend` – React UI (Vite)

## Environment Variables

### Backend (`apps/backend/.env`)

Copy from `apps/backend/.env.example`:

- `PORT=5000`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `CLIENT_URL=http://localhost:5173`

Optional:

- `RAZORPAY_KEY_ID=...`
- `RAZORPAY_KEY_SECRET=...`
- `SMTP_HOST=...`
- `SMTP_PORT=587`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM=no-reply@cylendra-wala.local`

### Frontend (`apps/frontend/.env`)

Copy from `apps/frontend/.env.example`:

- `VITE_API_URL=http://localhost:5000`

## Run Locally

### 1) Backend

- `cd apps/backend`
- `npm install`
- `npm run dev`

Backend runs on `http://localhost:5000`.

### 2) Frontend

- `cd apps/frontend`
- `npm install`
- `npm run dev`

Frontend runs on `http://localhost:5173`.

## Demo Flow (as per slides)

1. Register/Login (Customer)
2. Create Order (select dealer + location)
3. Payment: choose Online (Razorpay OR demo if keys missing) or Cash on Delivery (COD)
4. Rider: see available orders → Accept

- Online orders become available after PAID
- COD orders become available after selecting Cash

5. Rider: generate delivery OTP → Customer receives email (or demo OTP)

- COD: Rider collects cash (marks PAID) before delivery

6. Rider: verify OTP → Delivered
7. Admin: dashboard revenue summary

## Core APIs (short list)

### User/Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Public

- `GET /api/public/dealers` (for dealer selection)

### Orders (Customer)

- `POST /api/orders` (create)
- `GET /api/orders/my` (history)
- `POST /api/orders/:id/payment-mode` (ONLINE or CASH)
- `POST /api/orders/:id/pay` (Razorpay or demo)
- `POST /api/orders/:id/pay/confirm` (verify Razorpay signature)

### Rider

- `GET /api/rider/available`
- `POST /api/rider/orders/:id/accept`
- `POST /api/rider/orders/:id/pick`
- `POST /api/rider/orders/:id/collect-cash` (COD)
- `POST /api/rider/orders/:id/send-delivery-otp`
- `POST /api/rider/orders/:id/verify-delivery-otp`

### Admin/Dealer

- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/dealer/dashboard`
- `GET /api/dealer/orders`

## Deployment Notes (Render + Vercel)

- Backend (Render): set env vars `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (Vercel URL)
- Frontend (Vercel): set `VITE_API_URL` to Render backend URL
- DB: MongoDB Atlas connection string goes into `MONGODB_URI`

## Host for Free (Atlas + Render + Vercel)

> Note: Free tiers change over time and may sleep on inactivity.

### 1) MongoDB Atlas (Free)

1. Create a free cluster.
2. Create a DB user + password.
3. Add Network Access (for demo you can allow all; production should be restricted).
4. Copy the connection string into `MONGODB_URI`.

### 2) Backend on Render (Free)

1. Create a new **Web Service** from this GitHub repo.
2. Set **Root Directory** to `apps/backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add Environment Variables:

- `MONGODB_URI` (Atlas)
- `JWT_SECRET` (long random string)
- `CLIENT_URL` (your Vercel frontend URL)

After deploy, note your backend URL (example: `https://xxx.onrender.com`).

### 3) Frontend on Vercel (Free)

1. Import the repo in Vercel.
2. Set **Root Directory** to `apps/frontend`.
3. Add Environment Variable:

- `VITE_API_URL` = your Render backend URL

4. Deploy.

#### SPA Route Refresh Fix

React Router routes like `/forgot-password` need a rewrite so refresh doesn’t 404.
This repo includes Vercel rewrite config at `apps/frontend/vercel.json`.
