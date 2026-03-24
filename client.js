import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  resetPassword,
  logoutUser,
  onUserChanged,
  authReady,
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
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
  ui.authMessage.className = "notice";
  if (type === "error") ui.authMessage.classList.add("error");
  if (type === "success") ui.authMessage.classList.add("ok");
}

function openAuthModal() {
  if (!ui.authModal) return;
  ui.authModal.hidden = false;
  ui.authModal.classList.remove("hidden");
  setAuthMessage("");
}

function closeAuthModal() {
  if (!ui.authModal) return;
  ui.authModal.hidden = true;
  ui.authModal.classList.add("hidden");
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
    ["admin", "service", "kitchen", "screen"].includes(role)
      ? `Panel: ${role}`
      : "Moje konto";

  if (ui.authInfo) {
    ui.authInfo.textContent = `Zalogowano: ${email} • rola: ${role}`;
  }
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

  window.location.href = getPanelTarget(state.staffRole);
}

async function handleLogin() {
  const email = ui.loginEmail?.value?.trim();
  const password = ui.loginPassword?.value || "";
  if (!email || !password) {
    setAuthMessage("Wpisz e-mail i hasło.", "error");
    return;
  }
  try {
    await loginWithEmail(email, password);
    setAuthMessage("Zalogowano.", "success");
    setTimeout(closeAuthModal, 400);
  } catch (error) {
    console.error(error);
    setAuthMessage(`Firebase: ${error.message}`, "error");
  }
}

async function handleRegister() {
  const email = ui.loginEmail?.value?.trim();
  const password = ui.loginPassword?.value || "";
  if (!email || !password) {
    setAuthMessage("Wpisz e-mail i hasło.", "error");
    return;
  }
  try {
    await registerWithEmail(email, password);
    setAuthMessage("Konto utworzone. Zalogowano.", "success");
    setTimeout(closeAuthModal, 500);
  } catch (error) {
    console.error(error);
    setAuthMessage(`Firebase: ${error.message}`, "error");
  }
}

async function handleGoogle() {
  try {
    await loginWithGoogle();
    setAuthMessage("Logowanie Google uruchomione.", "success");
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

function renderCategories() {
  if (!ui.categories) return;
  if (!state.categories.length) {
    ui.categories.innerHTML = `<span class="chip">brak kategorii</span>`;
    return;
  }
  ui.categories.innerHTML = state.categories
    .map((category) => `<span class="chip">${escapeHtml(category)}</span>`)
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
      return `
        <article class="menu-item">
          <div class="img">${
            item.imageUrl
              ? `<img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name || "")}" style="width:100%;height:100%;object-fit:cover;">`
              : `brak zdjęcia`
          }</div>
          <div class="body">
            <div class="row" style="justify-content:space-between;align-items:flex-start;">
              <h3 style="margin:0;">${escapeHtml(item.name || "")}</h3>
              <div class="price">${price} zł</div>
            </div>
            <p>${escapeHtml(item.description || "")}</p>
            <div class="muted">Kategoria: ${escapeHtml(item.category || "")}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadMenuItems() {
  try {
    const q = query(
      collection(db, "menuItems"),
      where("enabled", "==", true),
      orderBy("sortOrder", "asc")
    );
    const snap = await getDocs(q);
    state.menuItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    state.categories = [...new Set(state.menuItems.map((x) => x.category).filter(Boolean))];
    renderCategories();
    renderMenu();
  } catch (error) {
    console.error("Błąd ładowania menuItems:", error);
    if (ui.menuGrid) {
      ui.menuGrid.innerHTML = `<div class="card"><p>Nie udało się pobrać menu.</p></div>`;
    }
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
  try {
    bindEvents();
    renderAuthState();
    await authReady();
    onUserChanged(handleUserChanged);
    await loadPublicSettings();
    await loadMenuItems();
  } catch (error) {
    console.error("client init error", error);
    setAuthMessage(`Start JS: ${error.message}`, "error");
  }
}

init();
