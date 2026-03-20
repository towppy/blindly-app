# Backend – Setup Guide

Express.js REST API for the PeakPlay e-commerce app.

## Quick Start

```bash
npm install
cp .env.example .env   # then fill in values (see below)
npm start
```

## Required Environment Variables

Create a `.env` file in this folder (never commit it). Use `.env.example` as a template.

| Key | Required | Description |
|---|---|---|
| `CONNECTION_STRING` | YES | MongoDB Atlas connection URI |
| `JWT_SECRET` | YES | Any long random secret string for signing JWTs |
| `FCM_SERVICE_ACCOUNT_PATH` | For push notifications | Filename of Firebase Admin SDK service account JSON (place the file in this folder) |
| `MAIL_HOST` | For email verification | Mailtrap SMTP host (e.g. `sandbox.smtp.mailtrap.io`) |
| `MAIL_PORT` | For email verification | Mailtrap SMTP port (e.g. `2525`) |
| `MAIL_USERNAME` | For email verification | Mailtrap SMTP username |
| `MAIL_PASSWORD` | For email verification | Mailtrap SMTP password |
| `MAIL_FROM` | No (default: `noreply@blindly.com`) | Sender address for verification emails |
| `PUBLIC_API_BASE_URL` | Recommended | Public backend URL used in verification links (e.g. ngrok URL + `/api/v1`) |
| `PORT` | No (default: 4000) | Port the server listens on |
| `DB_NAME` | No (default: ITCP_database) | MongoDB database name |
| `JWT_EXPIRES_IN` | No (default: 7d) | Token expiry |
| `CORS_ORIGIN` | No (default: *) | Allowed CORS origins |

## API Endpoints

Base path: `/api/v1`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| POST | `/users/register` | No | Register new user |
| POST | `/users/login` | No | Login, returns JWT |
| POST | `/users/resend-verification` | No | Resend email verification link |
| POST | `/users/verify-email` | No | Verify email with token payload |
| GET | `/users/verify-email?token=...` | No | Verify email by clicking link in email |
| GET | `/users/:id` | JWT | Get user profile |
| PUT | `/users/profile` | JWT | Update delivery address + profile |
| POST | `/users/push-token` | JWT | Register push token |
| GET | `/products` | No | List all products |
| GET | `/products/:id` | No | Single product |
| POST | `/products` | Admin JWT | Create product |
| PUT | `/products/:id` | Admin JWT | Update product |
| DELETE | `/products/:id` | Admin JWT | Delete product |
| GET | `/categories` | No | List all categories |
| POST | `/categories` | Admin JWT | Create category |
| GET | `/orders` | JWT | List orders (user sees own; admin sees all) |
| POST | `/orders` | JWT | Place order (requires complete delivery profile) |
| PUT | `/orders/:id` | Admin JWT | Update order status |
| GET | `/stock-alerts` | Admin JWT | List low-stock alerts |
| GET | `/promos/active` | No | List active limited-time product promos |
| GET | `/promos/admin` | Admin JWT | List all promos for management |
| POST | `/promos` | Admin JWT | Create promo (auto push notify users) |
| PUT | `/promos/:id` | Admin JWT | Update promo |
| DELETE | `/promos/:id` | Admin JWT | Deactivate promo |

## Voucher and Promo Collections

- `vouchers` collection stores claimable coupons.
- `promos` collection stores limited-time product discounts.
- Product responses include promo pricing fields when a promo is active:
	- `originalPrice`
	- `effectivePrice`
	- `hasActivePromo`
	- `promo` (name, discountPercent, startsAt, endsAt)

## Files NOT in Git (exclude these)

- `.env` — your secrets
- `*firebase-adminsdk*.json` / `firebase-service-account*.json` — Firebase private key
- `uploads/` — runtime image uploads
- `node_modules/`
