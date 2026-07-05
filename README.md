# CoupleSplit

CoupleSplit is a mobile-first expense-splitting app for a two-person household. It uses Next.js App Router, TypeScript, Tailwind CSS, Firebase Authentication, Cloud Firestore, React Hook Form, Zod, date-fns, lucide-react, and Vitest.

## What Is Complete

- Google sign-in through Firebase Authentication.
- User profile persistence in `users/{uid}`.
- Household creation and invite-code joining.
- Realtime household, member, expense, and settlement listeners.
- Dashboard with current balance, monthly spending, recent expenses, and recent settlements.
- Expense list with search, category, month, and payer filters.
- Add, edit, detail, and soft-delete expense flows.
- Equal split calculation using integer minor units.
- Settlement recording that reduces balances without deleting expenses.
- Protected app routes with login redirect.
- Mobile bottom navigation and desktop sidebar.
- Toasts, empty states, loading states, form validation, and delete confirmation.
- Firestore Security Rules in `firestore.rules`.
- Unit tests for money parsing/formatting, equal split, balances, settlements, and settled-up state.
- Optional demo seed helper.

## Intentionally Later

- Exact, percentage, and shares split math beyond the scaffolded UI.
- Receipt scanning, OCR, recurring expenses, advanced charts, payment providers, bank import, push notifications, and native mobile apps.
- Multi-currency conversion.
- Admin household management beyond the two-member MVP.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the Firebase web app values in `.env.local`.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.

## Firebase Setup Checklist

1. Create a Firebase project.
2. Add a Web app in Firebase project settings.
3. Copy the web app config into `.env.local` and Vercel environment variables.
4. Enable Authentication.
5. Enable the Google sign-in provider.
6. Create a Cloud Firestore database.
7. Publish the rules from `firestore.rules`.
8. Add your local development domain and Vercel production domain to Firebase authorized domains.

## Vercel Deployment Checklist

1. Push this repository to your Git provider.
2. Import the project in Vercel.
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables.
4. Deploy.
5. Add the Vercel domain to Firebase Authentication authorized domains.
6. Confirm Firestore rules are published before personal use.

## Balance Algorithm

Balances are calculated as a pure TypeScript utility in `src/lib/balances.ts`.

For every expense:

- Add the full amount to the payer's balance.
- Subtract each participant's owed share from their balance.

For every settlement:

- Add the settlement amount to the person who paid.
- Subtract the settlement amount from the person who received.

Positive balance means that person should receive money. Negative balance means that person owes money. Zero means settled up.

## Money Handling

All money is stored as integer minor units. For ILS, that means agorot:

- `₪123.45` is stored as `12345`.
- Formatting happens only at the UI boundary.
- Equal splits distribute any remainder one agorot at a time so totals always match.

## Demo Seed

The optional seed helper creates one demo household, two fake members, several expenses, and one settlement.

```bash
npm run seed:demo
```

Run it only against a development Firebase project. It is not run automatically in production.
