# BotForge Cyp

Professional WhatsApp bot hosting and deployment frontend.

## Included
- Landing page and bot marketplace
- Registration/login demo
- Dashboard
- Bot deployment flow
- Package selection
- M-Pesa/PayGoods payment screen
- Responsive mobile-first design
- Config file for payment number and deployment API

## Important
The included authentication uses browser localStorage for demonstration only. Before accepting real users/payments, connect a secure backend for:
1. GitHub OAuth
2. User accounts/sessions
3. M-Pesa Daraja/PayGoods payment verification
4. Subscription expiry
5. Bot deployment API
6. Secure storage of session credentials

Edit `js/config.js` to set your PayGoods/Till number and deployment API endpoint.

## GitHub Pages
For a static preview, enable GitHub Pages for the `main` branch and `/ (root)` folder.
