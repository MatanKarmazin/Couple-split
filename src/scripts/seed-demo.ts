import { initializeApp } from "firebase/app";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { calculateEqualShares } from "@/lib/money";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("Set NEXT_PUBLIC_FIREBASE_* variables before running the demo seed.");
}

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
});

const db = getFirestore(app);
const householdId = "demo-household";
const alice = { uid: "demo-alice", displayName: "Alice", email: "alice@example.com", photoURL: null, role: "owner" as const };
const ben = { uid: "demo-ben", displayName: "Ben", email: "ben@example.com", photoURL: null, role: "member" as const };

async function main() {
  await setDoc(doc(db, "households", householdId), {
    name: "Demo household",
    createdByUid: alice.uid,
    memberIds: [alice.uid, ben.uid],
    inviteCode: "DEMO123",
    defaultCurrency: "ILS",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await setDoc(doc(db, "households", householdId, "members", alice.uid), { ...alice, joinedAt: serverTimestamp() });
  await setDoc(doc(db, "households", householdId, "members", ben.uid), { ...ben, joinedAt: serverTimestamp() });

  for (const item of [
    { description: "Friday dinner", amountMinor: 18600, category: "Food", paidByUid: alice.uid },
    { description: "Groceries", amountMinor: 24350, category: "Groceries", paidByUid: ben.uid },
    { description: "Electric bill", amountMinor: 31200, category: "Utilities", paidByUid: alice.uid }
  ] as const) {
    await addDoc(collection(db, "households", householdId, "expenses"), {
      householdId,
      ...item,
      currency: "ILS",
      splitType: "equal",
      participants: [alice.uid, ben.uid],
      shares: calculateEqualShares(item.amountMinor, [alice.uid, ben.uid]),
      date: new Date().toISOString().slice(0, 10),
      notes: "",
      createdByUid: item.paidByUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  await addDoc(collection(db, "households", householdId, "settlements"), {
    householdId,
    fromUid: ben.uid,
    toUid: alice.uid,
    amountMinor: 5000,
    currency: "ILS",
    date: new Date().toISOString().slice(0, 10),
    note: "Partial payment",
    createdByUid: ben.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

main().then(() => {
  console.log("Demo seed created.");
});
