import { completeEmailVerification } from "./auth.js";
import { qs, setNotice } from "./ui.js";
qs("#verifyBtn").addEventListener("click", async () => {
  try {
    await completeEmailVerification();
    setNotice(qs("#info"), "Adres e-mail potwierdzony.", "ok");
  } catch (error) {
    setNotice(qs("#info"), error.message || String(error), "error");
  }
});
