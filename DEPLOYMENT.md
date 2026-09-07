# Deployment Guide — Trionda Wears

Two services, one database:

| Piece | Where | Folder |
|---|---|---|
| Backend (API + Socket.IO) | **Render** | `backend/` |
| Frontend (Next.js) | **Vercel** | `frontend/` |
| Database | **Neon** (Postgres) | — |

Realtime flow: frontend Socket.IO client connects to the **Render** URL
(`NEXT_PUBLIC_API_URL`). Signed-in users land in the `storefront` room; when an
admin changes catalog data the backend emits `catalog:changed` and open pages
refresh themselves.

---

## 0. Prereqs (one-time, on your machine)

```bash
cd /c/Users/muhad/Desktop/SnSTrionda/backend
npm install
```

Make sure the repo is committed & pushed to GitHub first:
```bash
cd /c/Users/muhad/Desktop/SnSTrionda
git add render.yaml DEPLOYMENT.md backend/.env.example frontend/.env.example
git commit -m "Add deployment configs (Render blueprint, env templates, guide)"
git push origin main
```

## 1. Run the database migration (one-time)

```bash
cd /c/Users/muhad/Desktop/SnSTrionda/backend
npx prisma migrate dev --name add_coupons_discounts_collections_settings
```
Creates the Coupon / Discount / Collection / StoreSetting tables added in the
latest work. On the deployed database use `npx prisma migrate deploy` instead.

## 2. Deploy the backend to Render

Option A — **Blueprint** (recommended, config is in the repo at `render.yaml`):
1. Render dashboard → **New → Blueprint** → select the repo → **Apply**.
2. Fill in the prompted secrets (`sync: false`): `DATABASE_URL`,
   `DATABASE_URL_UNPOOLED`, `CLOUDINARY_*`, `SAFEPAY_*`,
   `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. `JWT_SECRET`/`JWT_REFRESH_SECRET` are
   auto-generated.

Option B — Manual web service:
1. Render → **New → Web Service** → repo → branch `main`.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm start`
5. Add all env vars from `backend/.env.example` (production values).

Notes:
- `PORT` is injected by Render automatically (the app reads `process.env.PORT`).
- Keep the instance **always on** (paid plan) — Render's free tier sleeps after
  ~15 min and realtime events stall until it wakes.
- Health check `GET /api/health` is available.

## 3. Deploy the frontend to Vercel

1. Vercel → **New Project** → import the repo.
2. **Root Directory:** `frontend` (framework auto-detected: Next.js).
3. Environment variables (see `frontend/.env.example`):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-backend>.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_BACKEND_URL` | Same value — **separate variable**, admin panel needs it |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Your Google client id |

4. Deploy.

## 4. Google Cloud Console (one-time)

Add `https://sns-trionda.vercel.app` to **Authorized JavaScript origins** for
the OAuth client (same client id used in step 2/3). Without this the Google
button can render but the login silently fails.

## 5. Verify

- `https://<your-backend>.onrender.com/api/health` → 200.
- `https://sns-trionda.vercel.app/admin` logs in (proves
  `NEXT_PUBLIC_BACKEND_URL` is right).
- Signed in on the storefront + admin in another tab: save a product in admin →
  the storefront page updates **without a reload**.
- `/admin/coupons` create `TEST10` → apply it at checkout → 10% off shows and
  the order total matches.
- `/admin/settings` change the store name → footer updates.
- "Continue with Google" renders and works.

## Troubleshooting

- **Admin falls back to localhost** → `NEXT_PUBLIC_BACKEND_URL` unset/wrong in
  Vercel.
- **Socket never connects / "connection error" in console** → `CORS_ORIGIN` on
  Render doesn't exactly match the Vercel URL (scheme+host, no trailing slash).
- **Google button missing** → `NEXT_PUBLIC_GOOGLE_CLIENT_ID` not set in Vercel.
- **New tables missing / Prisma unknown model errors** → migration (step 1)
  wasn't run against that database.
