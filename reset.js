import { auth } from "./shared.js";
import { verifyPasswordResetCode, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const q=new URLSearchParams(location.search); const code=q.get("oobCode"); const info=document.getElementById("info"); const pass=document.getElementById("newPassword"); const btn=document.getElementById("applyBtn");
async function init(){ try{ await verifyPasswordResetCode(auth, code); info.textContent="Podaj nowe hasło."; }catch(e){ info.textContent="Link resetu jest nieważny lub wygasł."; btn.disabled=true; } }
btn?.addEventListener("click", async ()=>{ try{ await confirmPasswordReset(auth, code, pass.value.trim()); info.textContent="Hasło zostało zmienione. Możesz się zalogować."; btn.disabled=true; }catch(e){ info.textContent=e.message||String(e); } });
init();
