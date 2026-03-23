import {
  auth
} from "./firebase.js";
import {
  GoogleAuthProvider,
  applyActionCode,
  browserLocalPersistence,
  confirmPasswordReset,
  getRedirectResult,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();
let authReadyPromise;

export function authReady() {
  if (!authReadyPromise) {
    authReadyPromise = setPersistence(auth, browserLocalPersistence).then(async () => {
      try { await getRedirectResult(auth); } catch (_) {}
    });
  }
  return authReadyPromise;
}

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  return cred;
}

export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    if (String(error?.code || "").includes("popup")) {
      return signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
}

export async function sendPasswordReset(email) {
  const actionCodeSettings = {
    url: `${location.origin}/index.html?auth=login&reset=done`,
    handleCodeInApp: false
  };
  return sendPasswordResetEmail(auth, email, actionCodeSettings);
}

function getOobCode() {
  return new URLSearchParams(location.search).get("oobCode");
}

export async function completePasswordReset(newPassword) {
  const code = getOobCode();
  if (!code) throw new Error("Brak kodu resetu hasła w adresie.");
  return confirmPasswordReset(auth, code, newPassword);
}

export async function completeEmailVerification() {
  const code = getOobCode();
  if (!code) throw new Error("Brak kodu weryfikacji w adresie.");
  return applyActionCode(auth, code);
}

export { auth, signOut };
