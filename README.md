# BFBotForge Cyp

A cleaned-up, responsive bot-hosting SaaS frontend based on the supplied project requirements.

## What was fixed
- Clean white default theme with a subtle developer/code background.
- Persistent Light/Dark Mode with a sun/moon control.
- Professional sticky header and responsive mobile navigation drawer.
- Complete client dashboard with wallet, active bots, notifications and deployment state.
- Real navigation targets for Recovery, Notifications, Redeem & Earn, Profile and 404.
- Bot marketplace empty-state and database-ready bot configuration structure.
- Multi-step deployment UI foundation that never collects third-party passwords, session tokens or browser cookies.
- Wallet/deposit UI for KSh 50–3,000 with server-verification warnings.
- Profile and referral UI.
- Admin dashboard foundation with user search, error feed, bulk activate/block/suspend/delete, fix-all-errors and audit log.
- Accessibility improvements: focus-visible states, labels, semantic controls and responsive touch targets.
- Content-Security-Policy meta policy on pages.
- Frontend API boundary (`js/api.js`) for a future secure backend.
- Demo authentication no longer stores the user's password in localStorage.

## Production security boundary
This ZIP is still a static frontend. A browser-only application cannot safely provide production authentication, authorization, wallet accounting, payment verification or bot deployment.

Before real use, connect a backend for:
- Password hashing and sessions
- Google OAuth
- Database-backed users, bots and deployments
- Server-side wallet ledger
- M-Pesa Daraja and/or Paystack integration
- Verified payment webhooks and idempotency
- Server-side deployment controls
- CSRF/rate limiting/input validation where applicable
- Secure secrets and API credentials
- Admin role authorization and audit persistence

Never trust frontend values for wallet balance, payment success, transaction state, deployment price or permissions.
