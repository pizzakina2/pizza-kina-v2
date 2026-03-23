import { completePasswordReset } from "./auth.js";
import { qs, setNotice } from "./ui.js";
qs("#applyBtn").addEventListener("click", async () => {
  try {
    await completePasswordReset(qs("#newPassword").value);
    setNotice(qs("#info"), "Hasło zostało zmienione.", "ok");
  } catch (error) {
    setNotice(qs("#info"), error.message || String(error), "error");
  }
});
