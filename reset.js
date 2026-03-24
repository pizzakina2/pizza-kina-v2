import { completePasswordReset } from "./auth.js";

const btn = document.getElementById("applyBtn");
const info = document.getElementById("info");
const input = document.getElementById("newPassword");

function setNotice(text, ok = false) {
  info.textContent = text;
  info.className = "notice" + (ok ? " ok" : "");
}

btn?.addEventListener("click", async () => {
  try {
    const password = input?.value || "";
    if (!password || password.length < 6) {
      setNotice("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }
    await completePasswordReset(password);
    setNotice("Hasło zostało zmienione.", true);
  } catch (error) {
    setNotice(error.message || String(error));
  }
});
