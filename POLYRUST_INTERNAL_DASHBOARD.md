# POLYRUST Internal Dashboard — Technical Specification

## Purpose

The internal application is a responsive, front-end-only prototype for reviewing the POLYRUST account dashboard before wallet, backend, and smart-contract integration. It lives in the existing Vite/React project and shares the public site's project name, icon, typography, and burgundy visual identity.

## Application architecture

- Framework: React 19, TypeScript, and Vite 6; no additional runtime dependency is required.
- Entry point: `src/main.tsx` selects the internal interface when the browser path is `/app` or starts with `/app/`; all other paths continue to render the existing public `App`.
- Internal UI: `src/app/InternalApp.tsx` contains the application shell, navigation, section views, demo inputs, and simple projection calculation.
- Internal styling: `src/app/internal-app.css` scopes dashboard styles under `.internal-app` to keep the public landing page presentation unchanged.
- Existing public bot artwork is reused from `public/` for the Trading Bots selector.
- Vite's SPA fallback serves the application entry for direct navigation to `/app` during development.

## Route structure

| Route | Experience |
| --- | --- |
| `/` | Existing public POLYRUST landing page, unchanged by the dashboard feature |
| `/app` | Internal dashboard prototype; no wallet authentication required |

The five internal sections are switched within the `/app` route. Section selection is client-side state and does not imply separate backend routes.

## Design requirements

- Use near-black and deep burgundy surfaces, subtle red/pink borders and glows, white primary text, and muted gray secondary text.
- Reuse the public site's `projectName`, project icon, and existing font declarations.
- Keep the interface restrained, responsive, readable, keyboard accessible, and usable on touch screens.
- Use the TurboLoop screenshots for information architecture only. Do not use TurboLoop's brand, logo, cyan palette, commission values, or investment products.
- Clearly label the prototype and its displayed account values as demo data.
- Start balances, active positions, partner counts, and transaction history at zero/empty.

## Navigation sections

1. **Dashboard** — total invested, total withdrawn, active investments, available profit, referral rewards, and an empty active-bots summary.
2. **Trading Bots** — select one of four bots, review its parameters, enter an amount, and view a simple non-compounding projection.
3. **Withdraw** — display profit and referral balances, total availability, requested amount, BNB Smart Chain (BEP-20) indication, and an empty recent-withdrawals state.
4. **Partner Ecosystem** — demo referral link and copy control, zeroed partner/team metrics, ten pending commission levels, partner filters, and an empty partner list.
5. **Transactions** — search and type-filter controls with an empty transaction history; no sample records are generated.

There is no separate Deposit section. Deposits are intended to begin from bot activation in a future connected version.

## Investment parameters

| Bot | Investment | Duration | Daily profit | Total ROI |
| --- | ---: | ---: | ---: | ---: |
| Sports Bot | 25–1,000 USDT | 30 days | 1% | 30% |
| Crypto Bot | 1,000–5,000 USDT | 60 days | 1.5% | 90% |
| Politics Bot | 5,000–25,000 USDT | 90 days | 2% | 180% |
| World Events Bot | 25,000–100,000 USDT | 120 days | 3% | 360% |

Token: USDT. Network: BNB Smart Chain (BEP-20).

Projection math is simple daily interest without compounding:

- `daily profit = entered amount × daily rate`
- `term profit = entered amount × total ROI`
- `principal + profit = entered amount + term profit`

Calculations are a UI demonstration only and do not represent a transaction or account balance.

## Wallet integration assumptions

- The header shows a fixed demo address (`0x0000…0000`) and a disabled Disconnect button for layout review.
- No wallet provider, authentication, signing, token approval, transaction, or smart-contract code is used by the internal application.
- Activate Bot and withdrawal buttons are disabled visual placeholders.
- The referral URL is explicitly a demo link (`?ref=DEMO`); copying it does not register or track referrals.

## Functional requirements

- The `/app` path must open directly in development without authentication.
- All five navigation items must switch the visible section; the mobile navigation must open and close accessibly.
- Bot selection must update the visible terms and calculator. Values outside the selected bot's investment bounds must be identified.
- The return estimate must use simple daily calculations only.
- The demo referral link may be copied using the browser clipboard API.
- Partner and transaction filters/search fields must be present without fabricating records.
- No UI control may initiate a real financial or blockchain operation.

## Features currently implemented

- Responsive application shell with desktop sidebar, mobile drawer, project branding, placeholder wallet, and five-section navigation.
- Zeroed account summary and empty-state panels.
- Four bot options with the specified limits, duration, rate, and ROI; amount validation and simple-return calculations.
- Disabled bot-activation and withdrawal placeholders.
- Demo referral link with clipboard copy, ten levels with pending rates, partner filters, and an empty partner table.
- Transaction search/type filters and empty history table.
- Scoping of dashboard-specific styles so public landing-page styling and content remain intact.

## Planned for later

- Connect an approved wallet provider and define authentication/session behavior.
- Confirm contract addresses, supported networks, and smart-contract interfaces.
- Implement deposits/activation, balance reads, profit accounting, and withdrawals only after contract and product review.
- Connect referral attribution and partner data to an approved backend/on-chain source.
- Populate dashboard, partner, and transaction data from trusted services.
- Add transaction states, error handling, and operational safeguards with the production integration.

## Open questions and pending decisions

- Final referral commission percentages are not approved and are intentionally not displayed as numeric rates.
- Confirm whether rates should be identical across all ten levels or configured independently.
- Confirm production wallet provider, supported wallet types, and allowed chain IDs.
- Confirm authoritative sources for account balances, transaction status, and referral/team metrics.
- Confirm whether the demo referral URL path and query format should match the eventual production referral system.
- Confirm how bot availability and permitted investment bounds should be supplied to the production UI.

Update this document whenever dashboard requirements or implementation behavior changes.
