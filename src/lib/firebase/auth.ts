import { GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await upsertUserProfile(result.user);
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function upsertUserProfile(user: User) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const base = {
    uid: user.uid,
    displayName: user.displayName ?? "Unnamed",
    email: user.email ?? "",
    photoURL: user.photoURL ?? null,
    updatedAt: serverTimestamp()
  };

  await setDoc(
    userRef,
    snapshot.exists() ? base : { ...base, createdAt: serverTimestamp() },
    { merge: true }
  );
}
