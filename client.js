import { authReady, auth, loginWithEmail, registerWithEmail, signInWithGoogle, sendPasswordReset, onUserChanged } from "./auth.js";
import { loadPublicSettings, loadMenuItems } from "./menu.js";
import { qs, setNotice } from "./ui.js";

const state = {
  settings: null,
  menuItems: [],
  user: null,
};

function renderHero() {
  if (!state.settings) return;
  qs("#heroTitle").textContent = state.settings.heroTitle || "Zamów pizzę online bez dzwonienia.";
  qs("#heroSubtitle").textContent = state.settings.heroSubtitle || "Nowa, modularna wersja projektu.";
}

function renderCategories() {
  const categories = [...new Set(state.menuItems.map((item) => item.category || "inne"))];
  qs("#categories").innerHTML = categories.map((cat) => `<span class="chip">${cat}</span>`).join("");
}

function renderMenu() {
  const html = state.menuItems.map((item) => `
    <article class="menu-item">
      <div class="img">${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover">` : "brak zdjęcia"}</div>
      <div class="body stack">
        <div class="row" style="justify-content:space-between">
          <strong>${item.name}</strong>
          <span class="price">${Number(item.price || 0).toFixed(2)} zł</span>
        </div>
        <div class="muted">${item.description || ""}</div>
        <div class="muted">Kategoria: ${item.category || "inne"}</div>
      </div>
    </article>
  `).join("");
  qs("#menuGrid").innerHTML = html || `<div class="muted">Brak produktów. Dodamy je w panelu admina.</div>`;
}

function bindAuthModal() {
  const modal = qs("#authModal");
  qs("#openAuthBtn").addEventListener("click", () => modal.classList.remove("hidden"));
  qs("#closeAuthBtn").addEventListener("click", () => modal.classList.add("hidden"));

  qs("#loginBtn").addEventListener("click", async () => {
    try {
      await loginWithEmail(qs("#emailInput").value.trim(), qs("#passwordInput").value);
      setNotice(qs("#authInfo"), "Zalogowano.", "ok");
      modal.classList.add("hidden");
    } catch (error) {
      setNotice(qs("#authInfo"), error.message || String(error), "error");
    }
  });

  qs("#registerBtn").addEventListener("click", async () => {
    try {
      await registerWithEmail(qs("#emailInput").value.trim(), qs("#passwordInput").value);
      setNotice(qs("#authInfo"), "Konto utworzone. Sprawdź mail i potwierdź adres e-mail.", "ok");
    } catch (error) {
      setNotice(qs("#authInfo"), error.message || String(error), "error");
    }
  });

  qs("#googleBtn").addEventListener("click", async () => {
    try {
      await signInWithGoogle();
      modal.classList.add("hidden");
    } catch (error) {
      setNotice(qs("#authInfo"), error.message || String(error), "error");
    }
  });

  qs("#resetBtn").addEventListener("click", async () => {
    const email = qs("#emailInput").value.trim();
    if (!email) return setNotice(qs("#authInfo"), "Podaj e-mail do resetu hasła.", "error");
    try {
      await sendPasswordReset(email);
      setNotice(qs("#authInfo"), "Mail z resetem został wysłany.", "ok");
    } catch (error) {
      setNotice(qs("#authInfo"), error.message || String(error), "error");
    }
  });
}

async function init() {
  bindAuthModal();
  await authReady();
  onUserChanged((user) => {
    state.user = user || null;
  });
  state.settings = await loadPublicSettings();
  state.menuItems = await loadMenuItems();
  renderHero();
  renderCategories();
  renderMenu();
}

init().catch((error) => console.error(error));
