import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCesDlBgm87wKLmOpOCVyMWTm59njJWHOo",
  authDomain: "pizza-kina-v2.firebaseapp.com",
  projectId: "pizza-kina-v2",
  storageBucket: "pizza-kina-v2.firebasestorage.app",
  messagingSenderId: "1012440833599",
  appId: "1:1012440833599:web:726101c745b16753c4a28a",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
