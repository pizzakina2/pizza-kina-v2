import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const firebaseConfig = {
  "apiKey": "AIzaSyBWOEXNkWxxQjGlSFeUB1sH_3IwPuR0JtY",
  "authDomain": "pizza-kina-v2.firebaseapp.com",
  "projectId": "pizza-kina-v2",
  "storageBucket": "pizza-kina-v2.firebasestorage.app",
  "messagingSenderId": "1012440833599",
  "appId": "1:1012440833599:web:f7f39eb0325fe363c4a28a"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
