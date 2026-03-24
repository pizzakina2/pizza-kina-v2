import { completeEmailVerification } from "./auth.js";

const btn = document.getElementById("verifyBtn");
const info = document.getElementById("info");

function setNotice(text, ok = false) {
  info.textContent = text;
  info.className = "notice" + (ok ? " ok" : "");
}

btn?.addEventListener("click", async () => {
  try {
    await completeEmailVerification();
    setNotice("Adres e-mail potwierdzony.", true);
  } catch (error) {
    setNotice(error.message || String(error));
  }
});
