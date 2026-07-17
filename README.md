# SplitNest

SplitNest is a mobile-first expense-splitting app for households, couples, trips, roommates, families, and shared groups. It supports multiple households, invite-code joining, flexible expense splits, recurring bills, monthly installments, settlements, Hebrew/English UI, system dark mode, PWA install metadata, and locked exchange-rate conversion for foreign-currency expenses.

The app is built with Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore, React Hook Form, Zod, date-fns, lucide-react, and Vitest.

## Current Features

- Google sign-in through Firebase Authentication.
- Multi-household membership with a switcher for households and trips.
- Group households with active/former member tracking.
- Invite-code onboarding and join flows.
- Leave household, remove members, transfer owner role, and delete solo households.
- Dashboard with balance, monthly spending, recent expenses, recurring bills, and recent settlements.
- Expense list with search, category, month, and payer filters.
- Add, edit, detail, and soft-delete expense flows.
- Participant selection for group expenses, defaulting to active household members.
- Split modes: equal, one person owes all, custom amounts, and custom percentages.
- Recurring bills with monthly and every-two-month schedules.
- Monthly installment plans for large expenses, from 2 to 12 payments.
- Due recurring bills and due installments materialize as normal expense documents.
- Settlements with soft-delete.
- Multiple currencies: quick choices for ILS, USD, EUR, plus an Other picker backed by Frankfurter.
- Locked exchange-rate metadata saved at write time; balances use the household currency.
- English and Hebrew UI with RTL support.
- Indigo/amber theme with System, Light, and Dark modes.
- iPhone/Android PWA metadata and app icons.
- Mobile quick-add menu, responsive cards, safe-area spacing, toasts, dialogs, empty states, and form validation.
- Firestore Security Rules in `firestore.rules`.
- Unit tests for money parsing/formatting, split math, balances, settlements, and settled-up state.

## Tech Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Cloud Firestore
- React Hook Form
- Zod
- date-fns
- lucide-react
- Vitest

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with the Firebase web app values:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in all `NEXT_PUBLIC_FIREBASE_*` values in `.env.local`.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

On Windows, use `npm.cmd` if your terminal needs it:

```bash
npm.cmd run dev
```

## Firebase Setup Checklist

1. Create a Firebase project.
2. Add a Web app in Firebase project settings.
3. Copy the web app config into `.env.local` and Vercel environment variables.
4. Enable Authentication.
5. Enable the Google sign-in provider.
6. Create a Cloud Firestore database.
7. Publish the rules from `firestore.rules`.
8. Add local and production domains to Firebase Authentication authorized domains.
9. Confirm Firestore rules are deployed before testing real user flows.

## Firestore Rules

Security rules live in `firestore.rules`.

The rules are designed around active household membership:

- Users can read and update only their own profile document.
- Household documents and subcollections are readable only by active members.
- Invite codes allow signed-in users to join through a validated join proof.
- Expenses require valid member payers, selected participants, supported split types, and shares that add up exactly.
- Multi-currency expenses store original money plus converted household-currency money and exchange-rate metadata.
- Recurring bill and installment templates must stay scoped to their household.
- Settlements can be created and soft-deleted by household members.
- Hard deletes are denied except for controlled solo-household cleanup.

## Vercel Deployment Checklist

1. Push this repository to your Git provider.
2. Import the project in Vercel.
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables.
4. Deploy.
5. Add the Vercel domain to Firebase Authentication authorized domains.
6. Publish `firestore.rules` in Firebase.
7. Confirm the deployed app can reach Frankfurter for currency lists and exchange rates.
8. Install the PWA on iPhone/Android and confirm the app icon/title are correct.
9. Smoke-test with two real Google accounts in separate browsers.

Recommended production smoke test:

- Create a household, join by invite, and switch between two households.
- Add, edit, and delete ILS, USD/EUR, and Other-currency expenses.
- Confirm balances use household currency and cards show original currency.
- Create recurring bills and installment plans; confirm due items become normal expenses.
- Record and delete a settlement.
- Test Hebrew RTL, system dark mode, mobile layout, member removal, leave household, and solo household deletion.

## Core Concepts

### Households

Users can belong to multiple households or trips. `users/{uid}.householdIds` stores joined households and `defaultHouseholdId` stores the active household.

Households store active member IDs on `households/{householdId}.memberIds`. Member documents remain in `households/{householdId}/members/{uid}` for history display even after a user leaves or is removed.

### Expenses And Splits

Expenses are stored under `households/{householdId}/expenses`.

Each expense stores the payer, selected participants, split type, original amount/currency, and shares in integer minor units. Group expenses default participants to active household members, but users can choose a subset.

Supported split modes:

- `equal`: splits the total between selected participants.
- `one_person`: assigns the full owed share to one participant.
- `amounts`: uses exact per-participant amounts.
- `percentage`: uses percentages that add up to 100.

### Multi-Currency

Households currently default to ILS as their base currency.

Expense, settlement, recurring bill, and installment forms support ILS, USD, EUR, and an Other currency picker. Other currencies are fetched from Frankfurter.

When a saved item uses a different currency from the household currency, the app fetches the exchange rate for the item date and stores:

- Original amount and currency.
- Household-currency amount.
- Converted household shares when shares are relevant.
- Provider, rate, source currency, target currency, and rate date.

Rates are locked when saved. Balances and dashboard totals use household-currency values, while cards/details still show the original amount.

### Recurring Bills

Recurring bill templates are stored under `households/{householdId}/recurringBills`.

Templates support monthly and every-two-month schedules. When the app loads household data, due recurring bills are materialized as normal expenses with deterministic occurrence IDs, so both users opening the app cannot create duplicate expenses.

Generated recurring expenses remain in the ledger even if the template is paused or deleted.

### Installments

Installment plans are stored under `households/{householdId}/installmentPlans`.

Plans split a large expense into monthly generated expense records. V1 supports 2 to 12 payments. Remainders from uneven division land on the final installment. Stopping a plan prevents future generated expenses but keeps already generated expenses.

### Settlements

Settlements are stored under `households/{householdId}/settlements`.

A settlement records one member paying another member back. Settlements adjust balances without modifying old expenses. Deleting a settlement is a soft-delete through `deletedAt`.

### Balances

Balances are calculated in `src/lib/balances.ts`.

For every expense:

- Add the household-currency amount to the payer.
- Subtract each participant's household-currency share.

For every settlement:

- Add the household-currency amount to the person who paid.
- Subtract it from the person who received.

Positive balance means that person should receive money. Negative balance means that person owes money.

### Theme, Language, And PWA

The app uses semantic Tailwind color tokens backed by CSS variables and an ink/indigo/amber visual theme.

Theme behavior:

- First visit follows the browser/device system setting.
- Settings includes System, Light, and Dark.
- Manual choices are stored in `localStorage`.

Language behavior:

- First visit follows the browser language.
- Hebrew uses `lang="he"` and RTL direction.
- Settings includes System, English, and עברית.

PWA behavior:

- `public/manifest.webmanifest` is the canonical manifest.
- iPhone uses `apple-touch-icon.png`.
- Android/Chrome uses the Android Chrome icon files.

## Available Scripts

```bash
npm run dev
```

Starts the local development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts the production server after a build.

```bash
npm run lint
```

Runs ESLint.

```bash
npm test
```

Runs the Vitest test suite once.

```bash
npm run test:watch
```

Runs Vitest in watch mode.

```bash
npm run seed:demo
```

Runs the optional demo seed helper.

## Demo Seed

The optional seed helper creates one demo household, two fake members, several expenses, and one settlement.

```bash
npm run seed:demo
```

Run it only against a development Firebase project. It is not run automatically in production.

## Production Readiness Notes

Before calling a deployment production-ready:

- `npm.cmd run lint`, `npm.cmd test`, and `npm.cmd run build` should pass.
- `npm.cmd audit --audit-level=moderate` should be reviewed.
- Firestore rules must be published.
- Firebase Authentication authorized domains must include the production domain.
- Two-account manual smoke testing should pass on desktop and mobile.
- Exchange-rate failures should be considered a user-facing save blocker for non-household currencies.

## Future Ideas

- Receipt scanning and OCR.
- Receipt photo attachments.
- Charts and richer monthly analytics.
- Payment provider integrations.
- Bank import.
- Push notifications.
- Native mobile apps.
- Optional household base-currency selection.
