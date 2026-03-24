import { onUserChanged, logoutUser, authReady } from "./auth.js";
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const requiredRole = "kitchen";
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");

function setNotice(text, ok = false) {
  if (!userInfo) return;
  userInfo.textContent = text;
  userInfo.className = "notice" + (ok ? " ok" : "");
}

async function getStaffRole(uid) {
  const snap = await getDoc(doc(db, "staff", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (!data?.active) return null;
  return data.role || null;
}

logoutBtn?.addEventListener("click", async () => {
  await logoutUser();
  location.href = "./index.html?v=final1";
});

await authReady();

onUserChanged(async (user) => {
  if (!user) {
    setNotice("Brak zalogowanego użytkownika. Wracam do strony klienta.");
    setTimeout(() => {
      location.href = "./index.html?v=final1";
    }, 600);
    return;
  }

  try {
    const role = await getStaffRole(user.uid);
    if (role !== requiredRole && !(requiredRole !== "admin" && role === "admin")) {
      setNotice(`Brak uprawnień. Zalogowano jako: ${user.email || "brak email"} • rola: ${role || "client"}`);
      return;
    }
    setNotice(`Zalogowano jako: ${user.email || "brak email"} • rola: ${role}`, true);
  } catch (error) {
    console.error(error);
    setNotice("Błąd odczytu uprawnień.");
  }
});
