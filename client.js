import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  onUserChanged,
} from "./auth.js";

import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const state = {
  user: null,
  staffRole: null,
  menuItems: [],
  categories: [],
};

const ui = {
  brandName: document.getElementById("brandName"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  categories: document.getElementById("categories"),
  menuGrid: document.getElementById("menuGrid"),
  authInfo: document.getElementById("authInfo"),

  openAuthBtn: document.getElementById("openAuthBtn"),
  guestBtn: document.getElementById("guestBtn"),

  authModal: document.getElementById("authModal"),
  closeAuthBtn: document.getElementById("closeAuthBtn"),

  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginBtn: document.getElementById("loginBtn"),
  registerBtn: document.getElementById("registerBtn"),
  googleBtn: document.getElementById("googleBtn"),
  resetBtn: document.getElementById("resetBtn"),
  authMessage: document.getElementById("authMessage"),
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setAuthMessage(message, type = "info") {
  if (!ui.authMessage) return;
  ui.authMessage.textContent = message || "";
  ui.authMessage.classList.remove("is-error", "is-success", "is-info");
  if (type === "error") ui.authMessage.classList.add("is-error");
  else if (type === "success") ui.authMessage.classList.add("is-success");
  else ui.authMessage.classList.add("is-info");
}

function openAuthModal() {
  if (!ui.authModal) return;
  ui.authModal.hidden = false;
  setAuthMessage("");
}

function closeAuthModal() {
  if (!ui.authModal) return;
  ui.authModal.hidden = true;
}

function getPanelTarget(role) {
  switch (role) {
    case "admin":
      return "./admin.html";
    case "service":
      return "./service.html";
    case "kitchen":
      return "./kitchen.html";
    case "screen":
      return "./screen.html";
    default:
      return "./index.html";
  }
}

async function loadPublicSettings() {
  try {
    const snap = await getDoc(doc(db, "publicSettings", "current"));
    if (!snap.exists()) return;
    const data = snap.data();

    if (ui.brandName && data.brandName) ui.brandName.textContent = data.brandName;
    if (ui.heroTitle && data.heroTitle) ui.heroTitle.textContent = data.heroTitle;
    if (ui.heroSubtitle && data.heroSubtitle) ui.heroSubtitle.textContent = data.heroSubtitle;
  } catch (error) {
    console.error("Błąd ładowania publicSettings:", error);
  }
}

async function loadMenuItems() {
  try {
    const q = query(
      collection(db, "menuItems"),
      where("enabled", "==", true),
      orderBy("sortOrder", "asc")
    );

    const snap = await getDocs(q);

    state.menuItems = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    state.categories = [...new Set(state.menuItems.map((item) => item.category).filter(Boolean))];

    renderCategories();
    renderMenu();
  } catch (error) {
    console.error("Błąd ładowania menuItems:", error);
    if (ui.menuGrid) {
      ui.menuGrid.innerHTML = `<div class="card"><p>Nie udało się pobrać menu.</p></div>`;
    }
  }
}

function renderCategories() {
  if (!ui.categories) return;

  if (!state.categories.length) {
    ui.categories.innerHTML = `<span class="pill">brak kategorii</span>`;
    return;
  }

  ui.categories.innerHTML = state.categories
    .map((category) => `<span class="pill">${escapeHtml(category)}</span>`)
    .join("");
}

function renderMenu() {
  if (!ui.menuGrid) return;

  if (!state.menuItems.length) {
    ui.menuGrid.innerHTML = `<div class="card"><p>Brak produktów w menu.</p></div>`;
    return;
  }

  ui.menuGrid.innerHTML = state.menuItems
    .map((item) => {
      const price = Number(item.price || 0).toFixed(2);
      const name = escapeHtml(item.name);
      const description = escapeHtml(item.description || "");
      const category = escapeHtml(item.category || "");
      const imageUrl = item.imageUrl ? escapeHtml(item.imageUrl) : "";

      return `
        <article class="menu-card">
          <div class="menu-card__image">
            ${
              imageUrl
                ? `<img src="${imageUrl}" alt="${name}" loading="lazy">`
                : `<div class="menu-card__placeholder">brak zdjęcia</div>`
            }
          </div>
          <div class="menu-card__body">
            <div class="menu-card__header">
              <h3>${name}</h3>
              <strong>${price} zł</strong>
            </div>
            <p>${description}</p>
            <div class="menu-card__meta">Kategoria: ${category}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function getStaffRole(uid) {
  try {
    const snap = await getDoc(doc(db, "staff", uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (!data?.active) return null;
    return data.role || null;
  } catch (error) {
    console.error("Błąd odczytu staff:", error);
    return null;
  }
}

function renderAuthState() {
  if (!ui.openAuthBtn || !ui.guestBtn) return;

  if (!state.user) {
    ui.openAuthBtn.textContent = "Zaloguj / Rejestruj";
    ui.guestBtn.textContent = "Gość";
    if (ui.authInfo) ui.authInfo.textContent = "Niezalogowany.";
    return;
  }

  const email = state.user.email || "brak email";
  const role = state.staffRole || "client";

  ui.openAuthBtn.textContent = "Wyloguj";
  ui.guestBtn.textContent =
    role === "admin" || role === "service" || role === "kitchen" || role === "screen"
      ? `Panel: ${role}`
      : "Moje konto";

  if (ui.authInfo) {
    ui.authInfo.textContent = `Zalogowano: ${email} • rola: ${role}`;
  }
}

  const email = state.user.email || "brak email";
  const role = state.staffRole || "client";

  ui.openAuthBtn.textContent = "Wyloguj";
  ui.guestBtn.textContent =
    role === "admin" || role === "service" || role === "kitchen" || role === "screen"
      ? `Panel: ${role}`
      : "Moje konto";

  ui.authInfo.textContent = `Zalogowano: ${email} • rola: ${role}`;
}

async function handleUserChanged(user) {
  state.user = user;
  state.staffRole = null;

  if (user?.uid) {
    state.staffRole = await getStaffRole(user.uid);
  }

  renderAuthState();
}

async function handleOpenAuthButton() {
  if (!state.user) {
    openAuthModal();
    return;
  }

  try {
    await logoutUser();
    state.user = null;
    state.staffRole = null;
    renderAuthState();
    setAuthMessage("Wylogowano.", "success");
  } catch (error) {
    console.error(error);
    setAuthMessage(`Błąd wylogowania: ${error.message}`, "error");
  }
}

function handleGuestButton() {
  if (!state.user) {
    window.location.href = "./index.html";
    return;
  }

  const target = getPanelTarget(state.staffRole);
  window.location.href = target;
}

async function handleLogin() {
  const email = ui.loginEmail?.value?.trim();
  const password = ui.loginPassword?.value || "";

  try {
    await loginWithEmail(email, password);
    setAuthMessage("Zalogowano.", "success");
    setTimeout(() => closeAuthModal(), 500);
  } catch (error) {
    console.error(error);
    setAuthMessage(`Firebase: ${error.message}`, "error");
  }
}

async function handleRegister() {
  const email = ui.loginEmail?.value?.trim();
  const password = ui.loginPassword?.value || "";

  try {
    await registerWithEmail(email, password);
    setAuthMessage("Konto utworzone i zalogowano.", "success");
    setTimeout(() => closeAuthModal(), 700);
  } catch (error) {
    console.error(error);
    setAuthMessage(`Firebase: ${error.message}`, "error");
  }
}

async function handleGoogle() {
  try {
    await loginWithGoogle();
    setAuthMessage("Zalogowano przez Google.", "success");
    setTimeout(() => closeAuthModal(), 500);
  } catch (error) {
    console.error(error);
    setAuthMessage(`Firebase: ${error.message}`, "error");
  }
}

async function handleResetPassword() {
  const email = ui.loginEmail?.value?.trim();

  if (!email) {
    setAuthMessage("Najpierw wpisz adres e-mail.", "error");
    return;
  }

  try {
    await resetPassword(email);
    setAuthMessage("Wysłano e-mail do resetu hasła.", "success");
  } catch (error) {
    console.error(error);
    setAuthMessage(`Firebase: ${error.message}`, "error");
  }
}

function bindEvents() {
  ui.openAuthBtn?.addEventListener("click", handleOpenAuthButton);
  ui.guestBtn?.addEventListener("click", handleGuestButton);
  ui.closeAuthBtn?.addEventListener("click", closeAuthModal);

  ui.loginBtn?.addEventListener("click", handleLogin);
  ui.registerBtn?.addEventListener("click", handleRegister);
  ui.googleBtn?.addEventListener("click", handleGoogle);
  ui.resetBtn?.addEventListener("click", handleResetPassword);

  ui.authModal?.addEventListener("click", (event) => {
    if (event.target === ui.authModal) closeAuthModal();
  });
}

async function init() {
  bindEvents();
  renderAuthState();
  onUserChanged(handleUserChanged);
  await loadPublicSettings();
  await loadMenuItems();
}

init();
