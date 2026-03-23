import { completeEmailVerification } from "../../core/auth.js";
import { qs, setNotice } from "../../core/ui.js";
qs("#verifyBtn").addEventListener("click", async () => {
  try {
    await completeEmailVerification();
    setNotice(qs("#info"), "Adres e-mail potwierdzony.", "ok");
  } catch (error) {
    setNotice(qs("#info"), error.message || String(error), "error");
  }
});
