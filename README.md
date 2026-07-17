# SplitNest

SplitNest is a mobile-first expense-splitting app for households, couples, trips, and shared groups. It supports shared expenses, flexible split modes, recurring bills, monthly installments, settlements, invite-code onboarding, and system-aware light/dark theme behavior.

The app is built with Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore, React Hook Form, Zod, date-fns, lucide-react, and Vitest.

## Current Features

- Google sign-in through Firebase Authentication.
- User profile persistence in `users/{uid}`.
- Two-person household creation and invite-code joining.
- Realtime household, member, expense, recurring bill, and settlement listeners.
- Dashboard with current balance, monthly spending, recent expenses, recurring bill summary, and recent settlements.
- Expense list with search, category, month, and payer filters.
- Expenses grouped by month for easier scanning.
- Add, edit, detail, and soft-delete expense flows.
- Fixed household participants: all current household members are included in each expense.
- Split modes:
  - Equal split
  - One person owes all
  - Custom amounts
  - Custom percentage
- Live split preview while creating or editing expenses.
- Recurring bills with monthly and every-two-month schedules.
- Due recurring bills are materialized as normal expense documents.
- Recurring expense badges in the expense ledger.
- Settlement recording and settlement soft-delete.
- Mobile quick-add menu for expense, recurring bill, and settlement actions.
- Protected app routes with login redirect.
- Desktop sidebar and mobile bottom navigation.
- Toasts, empty states, loading states, form validation, and delete confirmations.
- Indigo/amber theme with system, light, and dark modes.
- Firestore Security Rules in `firestore.rules`.
- Unit tests for money parsing/formatting, split math, balances, settlements, and settled-up state.
- Optional demo seed helper.

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
3. Copy the web app config into `.env.local`.
4. Enable Authentication.
5. Enable the Google sign-in provider.
6. Create a Cloud Firestore database.
7. Publish the rules from `firestore.rules`.
8. Add your local development domain and production domain to Firebase Authentication authorized domains.

## Firestore Rules

Security rules live in `firestore.rules`.

The rules are designed around household membership:

- Users can read and update only their own profile document.
- Household documents are readable only by signed-in members.
- Invite codes allow signed-in users to join a household through a join proof.
- Expenses require valid household members, valid participants, and shares that add up to the total amount.
- Supported expense split types are `equal`, `one_person`, `amounts`, and `percentage`.
- Recurring bill writes require a valid member payer and a supported repeat schedule.
- Settlements can be created by household members and soft-deleted by household members.
- Hard deletes are denied.

Publish the rules before using the app with real data.

## Vercel Deployment Checklist

1. Push this repository to your Git provider.
2. Import the project in Vercel.
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables.
4. Deploy.
5. Add the Vercel domain to Firebase Authentication authorized domains.
6. Publish `firestore.rules` in Firebase.
7. Sign in with two Google accounts and confirm create/join, expenses, recurring bills, and settlements work.

## Core Concepts

### Households

The app is currently designed for one active two-person household. A household stores member IDs, member profile records, expenses, recurring bill templates, and settlements.

Users create a household or join one with an invite code. The joined household is stored as the user's `defaultHouseholdId`.

### Expenses And Splits

Expenses are stored under `households/{householdId}/expenses`.

Every expense includes all current household members as participants. The payer is selectable, and the split mode controls the `shares` map:

- `equal`: splits the total between household members.
- `one_person`: assigns the full owed share to one member.
- `amounts`: uses exact per-member ILS amounts.
- `percentage`: uses two percentages that add up to 100.

All shares are stored in integer minor units and must add up exactly to `amountMinor`.

### Recurring Bills

Recurring bill templates are stored under `households/{householdId}/recurringBills`.

V1 recurring bills are fixed-amount shared bills. They support:

- Monthly repeats
- Every-two-month repeats
- Paid-by selection
- Category
- Day of month
- Start month
- Pause/resume
- Soft-delete

When the app loads household data, due recurring bills are materialized as normal expense documents. Generated expenses include `recurringBillId` and `recurringOccurrenceKey` metadata, but otherwise behave like normal expenses in balances, monthly totals, recent expenses, and the expense list.

The deterministic occurrence key prevents duplicate generated expenses when both household members open the app.

### Settlements

Settlements are stored under `households/{householdId}/settlements`.

A settlement records one member paying another member back. Settlements reduce balances without modifying or deleting the original expenses.

Settlements use soft-delete through `deletedAt`, and deleted settlements are filtered out of balance calculations and recent settlement displays.

### Balances

Balances are calculated as a pure TypeScript utility in `src/lib/balances.ts`.

For every expense:

- Add the full amount to the payer's balance.
- Subtract each participant's owed share from their balance.

For every settlement:

- Add the settlement amount to the person who paid.
- Subtract the settlement amount from the person who received.

Positive balance means that person should receive money. Negative balance means that person owes money. Zero means settled up.

### Money Handling

All money is stored as integer minor units. For ILS, that means agorot:

- `ILS 123.45` is stored as `12345`.
- Formatting happens only at the UI boundary.
- Equal splits distribute any remainder one agorot at a time so totals always match.
- Custom amount and percentage splits validate that shares add up to the total.

### Theme And Dark Mode

The app uses semantic Tailwind color tokens backed by CSS variables:

- `background`
- `surface`
- `surface-muted`
- `text`
- `text-muted`
- `primary`
- `accent`
- `danger`
- `border`

The visual theme is ink/indigo/amber instead of green.

Theme behavior:

- First visit defaults to the browser or device system setting.
- Settings includes `System`, `Light`, and `Dark` options.
- Manual light/dark choices are stored in `localStorage`.
- Choosing `System` removes the override and follows `prefers-color-scheme`.

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

## Future Ideas

- Multiple households or trip spaces for vacation-style splitting.
- Group trips with more than two people.
- Receipt scanning and OCR.
- Receipt photo attachments.
- Charts and richer monthly analytics.
- Multi-currency support and conversion.
- Payment provider integrations.
- Bank import.
- Push notifications.
- Native mobile apps.
- Admin household management beyond the current two-member flow.
