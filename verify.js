import { auth } from "./shared.js";
import { applyActionCode } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const q=new URLSearchParams(location.search); const code=q.get("oobCode"); const info=document.getElementById("info"); const btn=document.getElementById("verifyBtn");
btn?.addEventListener("click", async ()=>{ try{ await applyActionCode(auth, code); info.textContent="Email został potwierdzony. Możesz wrócić do logowania."; btn.disabled=true; }catch(e){ info.textContent="Link weryfikacyjny jest nieważny lub wygasł."; console.error(e); } });
