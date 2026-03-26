import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  subscribeSettings,
  subscribeOrders,
  subscribeUserOrders,
  initAuthPersistence,
  menuArray,
  normalizeSettings,
  money,
  $,
  applyTheme,
  formatOption,
  createOrder,
  cartUnits,
  pickupOptions,
  ordersArray,
  badgeHtml,
  formatDateTime,
  cancelOrder,
  orderSummary,
  installPwaHint,
  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithGoogle,
  ensureUserProfile,
  getCurrentUserProfile,
  saveCurrentUserProfile,
  getStaffDoc,
} from "./shared.js";

let settings = normalizeSettings();
let ordersList = [];
let userOrdersUnsub = null;
let currentUser = null;
let currentStaff = null;
let cart = JSON.parse(localStorage.getItem("pk_cart_v3") || "{}");
let pendingCheckoutAfterLogin = false;

function saveCart(){ localStorage.setItem("pk_cart_v3", JSON.stringify(cart)); }
function saveProfileData(profile){ localStorage.setItem("pk_profile_v3", JSON.stringify(profile)); }
function loadProfile(){ try{ return JSON.parse(localStorage.getItem("pk_profile_v3") || "{}"); }catch{ return {}; } }
function validatePhone(value){ return /^\d{9}$/.test(String(value||"").trim()); }
function validatePassword(value){ return String(value||"").length >= 6; }

function buildActionUrl(pathname){ return `${window.location.origin}${pathname}`; }
async function sendVerifyEmailToUser(user){ return sendEmailVerification(user, { url: buildActionUrl("/verify.html"), handleCodeInApp: true }); }
async function resetPasswordForEmail(email){ return sendPasswordResetEmail(auth, email, { url: buildActionUrl("/reset.html"), handleCodeInApp: true }); }

function syncAuthUi(){
  const logged = !!currentUser;
  $("openAuthBtn")?.classList.toggle("hidden", logged);
  $("openProfileBtn")?.classList.toggle("hidden", !logged);
  $("logoutTopBtn")?.classList.toggle("hidden", !logged);
  $("viewerBadge").textContent = currentStaff?.role ? currentStaff.role : (logged ? (currentUser.email || "klient") : "Gość");
  const box = $("authStateBox");
  if(box){
    if(!logged) box.textContent = "Klient nie jest zalogowany.";
    else if(currentUser.emailVerified === false) box.textContent = "Konto zalogowane, ale email nie jest jeszcze potwierdzony.";
    else box.textContent = `Zalogowano jako ${currentUser.email}.`;
  }
  $("resendVerifyBtn")?.classList.toggle("hidden", !(logged && currentUser.emailVerified === false));
}

function openDrawer(id){ $("uiBackdrop")?.classList.add("show"); $(id)?.classList.add("open"); }
function closeDrawer(id){ $(id)?.classList.remove("open"); if(!document.querySelector(".drawer.open") && !$("authDrawer")?.classList.contains("open")) $("uiBackdrop")?.classList.remove("show"); }
function closeAuthDrawer(){ $("authDrawer")?.classList.remove("open"); if(!document.querySelector(".drawer.open")) $("uiBackdrop")?.classList.remove("show"); }

function attachHiddenAdmin(){
  const logo = $("secretLogo");
  const modal = $("adminModal");
  const closeBtn = $("closeAdminModal");
  if(!logo || !modal) return;
  let clicks = 0;
  let timer = null;
  logo.addEventListener("click", ()=>{
    clicks += 1;
    clearTimeout(timer);
    timer = setTimeout(()=>clicks = 0, 900);
    if(clicks >= 5){
      clicks = 0;
      modal.classList.add("show");
    }
  });
  closeBtn?.addEventListener("click", ()=>modal.classList.remove("show"));
  modal.addEventListener("click", (e)=>{ if(e.target === modal) modal.classList.remove("show"); });
}

function getMenuItems(){ return menuArray(settings.menuItems || []); }

function renderMenu(){
  const grid = $("menuGrid");
  if(!grid) return;
  const items = getMenuItems().filter((item)=>item.enabled !== false);
  if(!items.length){ grid.innerHTML = `<div class="panel-body"><p>Brak produktów.</p></div>`; return; }
  grid.innerHTML = items.map((item)=>`<article class="menu-card">
    <div class="menu-card__image">${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.name}">` : `<div class="menu-card__placeholder">brak zdjęcia</div>`}</div>
    <div class="menu-card__body">
      <div class="menu-card__header"><h3>${item.name}</h3><strong>${money(item.price)}</strong></div>
      <p>${item.description || ""}</p>
      <div class="row" style="justify-content:space-between;align-items:center"><span class="small">Dostępne teraz: ${Number(item.quantity || 0) > 999 ? "dużo" : Number(item.quantity || 0)}</span><button class="btn btn-primary" data-add-cart="${item.id}">Dodaj</button></div>
    </div>
  </article>`).join("");
  grid.querySelectorAll("[data-add-cart]").forEach((btn)=>btn.addEventListener("click", ()=>addToCart(btn.dataset.addCart)));
}

function cartItems(){
  const map = new Map(getMenuItems().map((item)=>[item.id, item]));
  return Object.entries(cart).map(([id, qty])=>({ ...map.get(id), id, qty:Number(qty||0) })).filter((item)=>item.name && item.qty>0);
}

function addToCart(id){
  const item = getMenuItems().find((entry)=>entry.id === id);
  if(!item) return;
  cart[id] = Number(cart[id] || 0) + 1;
  saveCart();
  renderCart();
  openDrawer("cartDrawer");
}

function changeCart(id, delta){
  const next = Number(cart[id] || 0) + delta;
  if(next <= 0) delete cart[id];
  else cart[id] = next;
  saveCart();
  renderCart();
}

function populatePickupOptions(){
  const select = $("pickupTime");
  if(!select) return;
  const options = pickupOptions(settings, ordersList, cartUnits(cartItems()));
  select.innerHTML = options.map(formatOption).join("");
}

function renderCart(){
  const list = $("cartList");
  const empty = $("emptyCartInfo");
  const totalNode = $("cartTotal");
  const items = cartItems();
  if(!list || !empty || !totalNode) return;
  empty.classList.toggle("hidden", items.length > 0);
  list.innerHTML = items.map((item)=>`<div class="cart-row"><div><strong>${item.name}</strong><div class="small">${money(item.price)}</div></div><div class="row"><button class="btn btn-ghost" data-cart-minus="${item.id}">−</button><span>${item.qty}</span><button class="btn btn-ghost" data-cart-plus="${item.id}">+</button></div></div>`).join("");
  list.querySelectorAll("[data-cart-minus]").forEach((btn)=>btn.addEventListener("click", ()=>changeCart(btn.dataset.cartMinus, -1)));
  list.querySelectorAll("[data-cart-plus]").forEach((btn)=>btn.addEventListener("click", ()=>changeCart(btn.dataset.cartPlus, 1)));
  totalNode.textContent = money(items.reduce((sum, item)=>sum + Number(item.price||0) * Number(item.qty||0), 0));
  $("cartFabCount").textContent = String(items.reduce((sum, item)=>sum + Number(item.qty||0), 0));
  populatePickupOptions();
}

function syncDeliveryUi(){
  const opts = settings.deliveryOptions || normalizeSettings().deliveryOptions;
  $("deliveryLabelHome").textContent = opts.home?.label || "U mnie w domu";
  $("deliveryLabelPickup").textContent = opts.pickup?.label || "Odbiór osobisty";
  $("deliveryLabelDelivery").textContent = opts.delivery?.label || "Dowóz";
  const radios = Array.from(document.querySelectorAll('input[name="deliveryType"]'));
  radios.forEach((radio)=>{
    const enabled = opts[radio.value]?.enabled !== false;
    radio.disabled = !enabled;
    radio.parentElement.classList.toggle("muted", !enabled);
  });
  if(radios.every((radio)=>radio.checked === false || radio.disabled)){
    const firstEnabled = radios.find((radio)=>!radio.disabled);
    if(firstEnabled) firstEnabled.checked = true;
  }
  const selected = radios.find((radio)=>radio.checked)?.value || "home";
  $("deliveryAddress").classList.toggle("hidden", selected !== "delivery");
}

function fillProfile(profile){
  $("customerName").value = profile.name || "";
  $("customerPhone").value = profile.phone || "";
  $("checkoutName").value = profile.name || "";
  $("checkoutPhone").value = profile.phone || "";
}

async function refreshProfile(){
  const local = loadProfile();
  if(currentUser?.uid){
    const dbProfile = await getCurrentUserProfile(currentUser.uid);
    fillProfile({ name: dbProfile?.displayName || local.name || "", phone: dbProfile?.phone || local.phone || "" });
  } else {
    fillProfile(local);
  }
}

function renderMyOrders(rows){
  const body = $("myOrdersTableBody");
  if(!body) return;
  const list = ordersArray(rows || []);
  body.innerHTML = list.length ? list.map((order)=>`<tr><td>${order.displayNumber || order.shortNumber || order.orderId}</td><td>${formatDateTime(order.createdAt)}</td><td>${orderSummary(order)}</td><td>${order.pickupLabel || order.pickupTime || "-"}</td><td>${badgeHtml(order.status)}</td><td>${["oczekuje","potwierdzone"].includes(order.status) ? `<button class="btn btn-ghost" data-cancel-order="${order.orderId}">Anuluj</button>` : "-"}</td></tr>`).join("") : `<tr><td colspan="6" class="small">Brak zamówień.</td></tr>`;
  body.querySelectorAll("[data-cancel-order]").forEach((btn)=>btn.addEventListener("click", async ()=>{
    try{ await cancelOrder(btn.dataset.cancelOrder, currentUser); }catch(error){ $("orderState").textContent = error.message || String(error); }
  }));
}

async function handleRegister(){
  const email = $("clientEmail").value.trim();
  const password = $("clientPassword").value.trim();
  if(!email || !validatePassword(password)){ $("authStateBox").textContent = "Podaj email i hasło min. 6 znaków."; return; }
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(cred.user, { displayName: $("checkoutName").value.trim(), phone: $("checkoutPhone").value.trim() });
  await sendVerifyEmailToUser(cred.user);
  $("authStateBox").textContent = "Konto utworzone. Wysłano email weryfikacyjny.";
}

async function handleLogin(){
  const email = $("clientEmail").value.trim();
  const password = $("clientPassword").value.trim();
  if(!email || !password){ $("authStateBox").textContent = "Podaj email i hasło."; return; }
  await signInWithEmailAndPassword(auth, email, password);
  closeAuthDrawer();
}

async function handleGoogle(){
  await signInWithGoogle();
  closeAuthDrawer();
}

async function handleReset(){
  const email = $("clientEmail").value.trim();
  if(!email){ $("authStateBox").textContent = "Najpierw wpisz email."; return; }
  await resetPasswordForEmail(email);
  $("authStateBox").textContent = "Wysłano email do resetu hasła.";
}

async function handleSaveProfile(){
  const profile = { name: $("customerName").value.trim(), phone: $("customerPhone").value.trim() };
  saveProfileData(profile);
  if(currentUser?.uid){ await saveCurrentUserProfile(currentUser.uid, { displayName: profile.name, phone: profile.phone }); }
  fillProfile(profile);
}

async function handleChangePassword(){
  if(!currentUser) return;
  const next = prompt("Nowe hasło (min. 6 znaków):", "");
  if(!next || !validatePassword(next)) return;
  await updatePassword(currentUser, next);
  alert("Hasło zmienione.");
}

async function handleSubmitOrder(){
  const items = cartItems();
  if(!items.length){ $("orderState").textContent = "Koszyk jest pusty."; return; }
  if(!currentUser){ pendingCheckoutAfterLogin = true; openDrawer("authDrawer"); $("orderState").textContent = "Zaloguj się, aby złożyć zamówienie."; return; }
  if(currentUser.emailVerified === false){ $("orderState").textContent = "Najpierw potwierdź email."; return; }
  const name = $("checkoutName").value.trim();
  const phone = $("checkoutPhone").value.trim();
  if(!name || !validatePhone(phone)){ $("orderState").textContent = "Podaj imię i 9-cyfrowy telefon."; return; }
  const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value || "home";
  const address = $("deliveryAddress").value.trim();
  if(deliveryType === "delivery" && !address){ $("orderState").textContent = "Podaj adres dostawy."; return; }
  const pickupValue = $("pickupTime").value;
  const pickupLabel = $("pickupTime").selectedOptions[0]?.textContent || pickupValue;
  const order = await createOrder(currentUser, { name, phone, note: $("customerNote").value.trim(), delivery: { type: deliveryType, address } }, items, { value: pickupValue, label: pickupLabel, etaTs: Date.now() });
  cart = {};
  saveCart();
  renderCart();
  $("checkoutBox").classList.add("hidden");
  $("orderState").textContent = `Zamówienie przyjęte. Numer: ${order.displayNumber}`;
  saveProfileData({ name, phone });
  await saveCurrentUserProfile(currentUser.uid, { displayName: name, phone });
}

function bindUi(){
  $("openAuthBtn")?.addEventListener("click", ()=>openDrawer("authDrawer"));
  $("logoutTopBtn")?.addEventListener("click", ()=>signOut(auth));
  $("openProfileBtn")?.addEventListener("click", ()=>openDrawer("profileDrawer"));
  $("closeProfileBtn")?.addEventListener("click", ()=>closeDrawer("profileDrawer"));
  $("privacyFooterBtn")?.addEventListener("click", ()=>openDrawer("privacyDrawer"));
  $("closePrivacyBtn")?.addEventListener("click", ()=>closeDrawer("privacyDrawer"));
  $("cartFab")?.addEventListener("click", ()=>openDrawer("cartDrawer"));
  $("closeCartBtn")?.addEventListener("click", ()=>closeDrawer("cartDrawer"));
  $("uiBackdrop")?.addEventListener("click", ()=>{ document.querySelectorAll(".drawer.open").forEach((el)=>el.classList.remove("open")); $("authDrawer")?.classList.remove("open"); $("uiBackdrop")?.classList.remove("show"); });
  $("toMenuBtn")?.addEventListener("click", ()=>document.getElementById("menuSection")?.scrollIntoView({ behavior:"smooth" }));
  $("registerBtn")?.addEventListener("click", ()=>handleRegister().catch((e)=>$("authStateBox").textContent = e.message || String(e)));
  $("loginBtn")?.addEventListener("click", ()=>handleLogin().catch((e)=>$("authStateBox").textContent = e.message || String(e)));
  $("resetPasswordBtn")?.addEventListener("click", ()=>handleReset().catch((e)=>$("authStateBox").textContent = e.message || String(e)));
  $("googleBtn")?.addEventListener("click", ()=>handleGoogle().catch((e)=>$("authStateBox").textContent = e.message || String(e)));
  $("resendVerifyBtn")?.addEventListener("click", ()=>sendVerifyEmailToUser(currentUser).then(()=>$("authStateBox").textContent = "Wysłano ponownie link weryfikacyjny.").catch((e)=>$("authStateBox").textContent = e.message || String(e)));
  $("saveProfileBtn")?.addEventListener("click", ()=>handleSaveProfile().catch(console.error));
  $("changePasswordBtn")?.addEventListener("click", ()=>handleChangePassword().catch((e)=>alert(e.message || String(e))));
  $("clearCartBtn")?.addEventListener("click", ()=>{ cart = {}; saveCart(); renderCart(); });
  $("proceedToCheckoutBtn")?.addEventListener("click", ()=>$("checkoutBox")?.classList.toggle("hidden"));
  document.querySelectorAll('input[name="deliveryType"]').forEach((radio)=>radio.addEventListener("change", syncDeliveryUi));
  $("submitOrderBtn")?.addEventListener("click", ()=>handleSubmitOrder().catch((e)=>$("orderState").textContent = e.message || String(e)));
}

async function init(){
  await initAuthPersistence();
  bindUi();
  attachHiddenAdmin();
  installPwaHint($("installHint"));
  subscribeSettings((next)=>{ settings = next; applyTheme(settings); renderMenu(); syncDeliveryUi(); populatePickupOptions(); });
  subscribeOrders((rows)=>{ ordersList = rows; populatePickupOptions(); });
  onAuthStateChanged(auth, async (user)=>{
    currentUser = user;
    currentStaff = user?.uid ? await getStaffDoc(user.uid) : null;
    syncAuthUi();
    if(userOrdersUnsub){ userOrdersUnsub(); userOrdersUnsub = null; }
    if(user?.uid){
      await ensureUserProfile(user);
      await refreshProfile();
      userOrdersUnsub = subscribeUserOrders(user, renderMyOrders);
      if(pendingCheckoutAfterLogin){ pendingCheckoutAfterLogin = false; openDrawer("cartDrawer"); $("checkoutBox")?.classList.remove("hidden"); }
    } else {
      renderMyOrders([]);
      await refreshProfile();
    }
  });
  renderCart();
}

init().catch(console.error);
