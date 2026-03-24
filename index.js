
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, subscribeSettings, subscribeOrders, subscribeUserOrders, initAuthPersistence, menuArray, normalizeSettings, money, $, applyTheme, formatOption, createOrder, cartUnits, pickupOptions, ordersArray, badgeHtml, formatDateTime, cancelOrder, orderSummary, installPwaHint, updatePassword } from "./shared.js";

let settings = normalizeSettings();
let ordersMap = {};
let userOrdersUnsub = null;
let currentUser = null;
let cart = JSON.parse(localStorage.getItem("pk_cart_v2") || "{}");
let pendingCheckoutAfterLogin = false;

function saveCart(){ localStorage.setItem("pk_cart_v2", JSON.stringify(cart)); }
function saveProfileData(profile){ localStorage.setItem("pk_profile_v1", JSON.stringify(profile)); }
function loadProfile(){ try{ return JSON.parse(localStorage.getItem("pk_profile_v1") || "{}"); }catch{ return {}; } }
function validatePhone(value){ return /^\d{9}$/.test(String(value||"").trim()); }
function validatePassword(value){ return String(value||"").length >= 6; }

function getEnabledDeliveryOptions(){
  return settings?.deliveryOptions || {
    home:{enabled:true,label:"U mnie w domu"},
    pickup:{enabled:true,label:"Odbiór osobisty"},
    delivery:{enabled:true,label:"Dowóz"}
  };
}
function syncDeliveryUi(){
  const opts = getEnabledDeliveryOptions();
  const homeLabel = $("deliveryLabelHome");
  const pickupLabel = $("deliveryLabelPickup");
  const deliveryLabel = $("deliveryLabelDelivery");
  if(homeLabel) homeLabel.textContent = opts.home?.label || "U mnie w domu";
  if(pickupLabel) pickupLabel.textContent = opts.pickup?.label || "Odbiór osobisty";
  if(deliveryLabel) deliveryLabel.textContent = opts.delivery?.label || "Dowóz";
  const radios = document.querySelectorAll("[name='deliveryType']");
  radios.forEach((radio)=>{
    const conf = opts[radio.value];
    const row = radio.closest("label");
    if(row) row.classList.toggle("hidden", conf?.enabled === false);
    if(conf?.enabled === false && radio.checked){
      const firstEnabled = Object.entries(opts).find(([,v])=>v?.enabled !== false)?.[0] || "home";
      document.querySelector(`[name="deliveryType"][value="${firstEnabled}"]`)?.setAttribute("checked","checked");
      document.querySelector(`[name="deliveryType"][value="${firstEnabled}"]`).checked = true;
    }
  });
  const selected = document.querySelector("[name='deliveryType']:checked")?.value || "home";
  $("deliveryAddress")?.classList.toggle("hidden", selected !== "delivery" || opts.delivery?.enabled === false);
}
function bindDeliveryUi(){
  document.querySelectorAll("[name='deliveryType']").forEach((radio)=>radio.addEventListener("change", syncDeliveryUi));
}
function getDeliveryData(){
  const opts = getEnabledDeliveryOptions();
  const type = document.querySelector("[name='deliveryType']:checked")?.value || "home";
  const label = opts[type]?.label || type;
  const address = type === "delivery" ? $("deliveryAddress")?.value.trim() || "" : "";
  return { type, label, address };
}

function humanAuthError(code){
  switch(code){
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Błędny email lub hasło.";
    case "auth/email-already-in-use":
      return "Ten email jest już zarejestrowany.";
    case "auth/weak-password":
      return "Hasło musi mieć minimum 6 znaków.";
    case "auth/invalid-email":
      return "Podaj poprawny adres email.";
    case "auth/too-many-requests":
      return "Za dużo prób. Spróbuj ponownie za chwilę.";
    case "auth/requires-recent-login":
      return "Zaloguj się ponownie, aby zmienić hasło.";
    default:
      return "Wystąpił błąd logowania.";
  }
}

function cartListItems(){
  const menuById = Object.fromEntries(menuArray(settings).map((item)=>[item.id, item]));
  return Object.entries(cart).map(([id, qty])=>{
    const item = menuById[id];
    return item ? { ...item, qty:Number(qty) } : null;
  }).filter(Boolean);
}

function availableQuantity(item){
  return Math.max(0, Number(item.quantity || 0) - Number(cart[item.id] || 0));
}

function updateFabCount(){
  const count = cartListItems().reduce((sum,item)=>sum+Number(item.qty||0),0);
  const node = $("cartFabCount");
  if(node) node.textContent = String(count);
}

function setAuthState(text,type="warn"){
  $("authStateBox").className = `notice ${type}`;
  $("authStateBox").textContent = text;
}
function setOrderState(text,type="warn"){
  $("orderState").className = `notice ${type}`;
  $("orderState").textContent = text;
}

function renderMenu(){
  const list = menuArray(settings).filter((item)=>item.enabled && availableQuantity(item)>0);
  $("menuGrid").innerHTML = list.map((item)=>{
    const available = availableQuantity(item);
    return `<article class="card">
      <img src="${item.image}" alt="${item.name}">
      <div class="card-body">
        <div class="card-head">
          <h4 class="card-title">${item.name}</h4>
          <div class="price">${money(item.price)}</div>
        </div>
        <div class="card-desc">${item.description || ""}</div>
        <div class="small menu-stock">Dostępne teraz: ${available >= 999 ? "dużo" : available}</div>
        <div class="row" style="margin-top:12px">
          <input class="control" id="qty-${item.id}" type="number" min="1" max="${available}" value="1">
          <button class="btn btn-primary" data-add="${item.id}">Dodaj</button>
        </div>
      </div>
    </article>`;
  }).join("");

  document.querySelectorAll("[data-add]").forEach((button)=>button.addEventListener("click", ()=>{
    const id = button.dataset.add;
    const menuItem = menuArray(settings).find((item)=>item.id===id);
    if(!menuItem) return;
    const qty = Math.max(1, Number($(`qty-${id}`).value || 1));
    const current = Number(cart[id] || 0);
    const next = current + qty;
    if(next > Number(menuItem.quantity)){
      return setOrderState(`Dostępna ilość produktu ${menuItem.name}: ${menuItem.quantity}.`, "error");
    }
    cart[id] = next;
    saveCart();
    renderMenu();
    renderCart();
    refreshPickupOptions();
    syncDeliveryUi();
    openCartDrawer();
    $("cartFab")?.classList.add("pulse");
    setTimeout(()=>$("cartFab")?.classList.remove("pulse"), 400);
  }));
}

function renderCart(){
  const items = cartListItems();
  $("emptyCartInfo").classList.toggle("hidden", items.length > 0);
  $("cartList").innerHTML = items.map((item)=>`
    <div class="compact-cart-item slide-in">
      <div>
        <strong>${item.name}</strong>
        <div class="small">${item.qty} × ${money(item.price)}</div>
      </div>
      <div style="text-align:right">
        <strong>${money(item.qty * item.price)}</strong>
        <div class="inline-actions" style="justify-content:flex-end;margin-top:6px">
          <button class="btn btn-ghost" data-dec="${item.id}" style="padding:8px 12px">−</button>
          <button class="btn btn-ghost" data-inc="${item.id}" style="padding:8px 12px">+</button>
          <button class="btn btn-danger" data-del="${item.id}" style="padding:8px 12px">Usuń</button>
        </div>
      </div>
    </div>
  `).join("");

  $("cartTotal").textContent = money(items.reduce((sum,item)=>sum+(item.qty*item.price),0));
  document.querySelectorAll("[data-dec]").forEach((button)=>button.addEventListener("click", ()=>{
    const id=button.dataset.dec;
    cart[id]=Number(cart[id]||0)-1;
    if(cart[id]<=0) delete cart[id];
    saveCart(); renderMenu(); renderCart(); refreshPickupOptions();
  }));
  document.querySelectorAll("[data-inc]").forEach((button)=>button.addEventListener("click", ()=>{
    const id=button.dataset.inc;
    const item=menuArray(settings).find((entry)=>entry.id===id);
    const next=Number(cart[id]||0)+1;
    if(item && next > Number(item.quantity)) return;
    cart[id]=next;
    saveCart(); renderMenu(); renderCart(); refreshPickupOptions();
  }));
  document.querySelectorAll("[data-del]").forEach((button)=>button.addEventListener("click", ()=>{
    delete cart[button.dataset.del];
    saveCart(); renderMenu(); renderCart(); refreshPickupOptions();
  }));
  updateFabCount();
}

function refreshPickupOptions(){
  const items = cartListItems();
  const options = pickupOptions(ordersMap, settings, cartUnits(items));
  $("pickupTime").innerHTML = options.map(formatOption).join("");
}

function renderMyOrders(map){
  const orders = ordersArray(map);
  $("myOrdersTableBody").innerHTML = orders.length ? orders.map((order)=>`
    <tr>
      <td>${order.displayNumber}</td>
      <td>${formatDateTime(order.createdAt)}</td>
      <td>${orderSummary(order)}</td>
      <td>${order.pickupTime || "-"}</td>
      <td>${badgeHtml(order.status)}</td>
      <td>${order.status==="oczekuje" ? `<button class="btn btn-danger" data-cancel="${order.orderId}" style="padding:8px 12px">Anuluj</button>` : `<span class="small">Brak akcji</span>`}</td>
    </tr>
  `).join("") : `<tr><td colspan="6" class="small">Brak zamówień klienta.</td></tr>`;

  document.querySelectorAll("[data-cancel]").forEach((button)=>button.addEventListener("click", async ()=>{
    try{
      await cancelOrder(button.dataset.cancel, currentUser);
      setOrderState("Zamówienie anulowane.", "ok");
    }catch(error){
      setOrderState(error.message || "Nie udało się anulować.", "error");
    }
  }));
}

function attachHiddenAdmin(){
  let taps=0;
  let timer=null;
  $("secretLogo").addEventListener("click", ()=>{
    taps+=1;
    clearTimeout(timer);
    timer=setTimeout(()=>{ taps=0; },1800);
    if(taps>=5){
      taps=0;
      $("adminModal").classList.add("show");
    }
  });
  $("closeAdminModal").addEventListener("click", ()=>$("adminModal").classList.remove("show"));
  $("adminModal").addEventListener("click", (event)=>{
    if(event.target.id==="adminModal") $("adminModal").classList.remove("show");
  });
}

function openBackdrop(){ $("uiBackdrop").classList.add("show"); }
function closeBackdrop(){
  if(
    !$("cartDrawer").classList.contains("show") &&
    !$("authDrawer").classList.contains("show") &&
    !$("profileDrawer").classList.contains("show") &&
    !$("privacyDrawer").classList.contains("show")
  ){
    $("uiBackdrop").classList.remove("show");
  }
}
function openCartDrawer(){ $("cartDrawer").classList.add("show"); openBackdrop(); }
function closeCartDrawer(){ $("cartDrawer").classList.remove("show"); closeBackdrop(); }
function toggleCartDrawer(force){
  const open = typeof force === "boolean" ? force : !$("cartDrawer").classList.contains("show");
  $("cartDrawer").classList.toggle("show", open);
  if(open) openBackdrop(); else closeBackdrop();
}
function toggleAuthDrawer(force){
  const open = typeof force === "boolean" ? force : !$("authDrawer").classList.contains("show");
  if(open){
    closeCartDrawer();
    toggleProfileDrawer(false);
    togglePrivacyDrawer(false);
  }
  $("authDrawer").classList.toggle("show", open);
  if(open) openBackdrop(); else closeBackdrop();
}
function toggleProfileDrawer(force){
  const open = typeof force === "boolean" ? force : !$("profileDrawer").classList.contains("show");
  $("profileDrawer").classList.toggle("show", open);
  if(open) openBackdrop(); else closeBackdrop();
}
function togglePrivacyDrawer(force){
  const open = typeof force === "boolean" ? force : !$("privacyDrawer").classList.contains("show");
  $("privacyDrawer").classList.toggle("show", open);
  if(open) openBackdrop(); else closeBackdrop();
}
function toggleCheckout(force){
  const open = typeof force === "boolean" ? force : !$("checkoutBox").classList.contains("hidden");
  $("checkoutBox").classList.toggle("hidden", !open);
  if(open){
    const profile = loadProfile();
    $("checkoutName").value = $("checkoutName").value || profile.name || "";
    $("checkoutPhone").value = $("checkoutPhone").value || profile.phone || "";
  }
}

function fillProfileFromStorage(){
  const profile = loadProfile();
  if(profile.name){
    if($("customerName")) $("customerName").value = profile.name;
    if($("checkoutName")) $("checkoutName").value = profile.name;
  }
  if(profile.phone){
    if($("customerPhone")) $("customerPhone").value = profile.phone;
    if($("checkoutPhone")) $("checkoutPhone").value = profile.phone;
  }
}

async function registerClient(){
  const email=$("clientEmail").value.trim();
  const password=$("clientPassword").value.trim();
  if(!email || !password) return setAuthState("Podaj email i hasło klienta.", "error");
  if(!validatePassword(password)) return setAuthState("Hasło musi mieć minimum 6 znaków.", "error");
  try{
    await createUserWithEmailAndPassword(auth, email, password);
    setAuthState("Konto zostało utworzone.", "ok");
    toggleAuthDrawer(false);
    if(pendingCheckoutAfterLogin){
      pendingCheckoutAfterLogin = false;
      openCartDrawer();
      toggleCheckout(true);
    }
  }catch(error){
    setAuthState(humanAuthError(error.code), "error");
  }
}

async function loginClient(){
  const email=$("clientEmail").value.trim();
  const password=$("clientPassword").value.trim();
  if(!email || !password) return setAuthState("Podaj email i hasło klienta.", "error");
  try{
    await signInWithEmailAndPassword(auth, email, password);
    setAuthState("Zalogowano.", "ok");
    toggleAuthDrawer(false);
    if(pendingCheckoutAfterLogin){
      pendingCheckoutAfterLogin = false;
      openCartDrawer();
      toggleCheckout(true);
    }
  }catch(error){
    setAuthState(humanAuthError(error.code), "error");
  }
}

async function changePasswordClient(){
  if(!currentUser) return setAuthState("Najpierw zaloguj klienta.", "error");
  const newPass = prompt("Podaj nowe hasło (minimum 6 znaków):");
  if(!newPass) return;
  if(!validatePassword(newPass)) return setAuthState("Nowe hasło musi mieć minimum 6 znaków.", "error");
  try{
    await updatePassword(currentUser, newPass);
    setAuthState("Hasło zostało zmienione.", "ok");
  }catch(error){
    setAuthState(humanAuthError(error.code), "error");
  }
}

function saveProfileAndMirror(){
  const profile = {
    name: $("customerName").value.trim(),
    phone: $("customerPhone").value.trim()
  };
  saveProfileData(profile);
  $("checkoutName").value = profile.name;
  $("checkoutPhone").value = profile.phone;
  setOrderState("Dane klienta zapisane.", "ok");
}

async function submitOrder(){
  const items=cartListItems();
  if(!currentUser){
    setAuthState("Najpierw zaloguj klienta.", "error");
    toggleAuthDrawer(true);
    return;
  }
  if(!items.length) return setOrderState("Koszyk jest pusty.", "error");
  const name=$("checkoutName").value.trim();
  const phone=$("checkoutPhone").value.trim();
  const note=$("customerNote").value.trim();
  const pickupTime=$("pickupTime").value;
  const delivery = getDeliveryData();
  if(!name || !phone) return setOrderState("Podaj imię i nazwisko oraz telefon.", "error");
  if(!validatePhone(phone)) return setOrderState("Telefon musi mieć dokładnie 9 cyfr.", "error");
  if(delivery.type === "delivery" && !delivery.address) return setOrderState("Podaj adres dostawy.", "error");
  if(!pickupTime) return setOrderState("Wybierz godzinę odbioru.", "error");
  const options=pickupOptions(ordersMap, settings, cartUnits(items));
  const pickupOption=options.find((option)=>option.value===pickupTime) || options[0];
  try{
    const order=await createOrder(currentUser, { name, phone, note, delivery }, items, pickupOption);
    saveProfileData({ name, phone });
    $("customerName").value = name;
    $("customerPhone").value = phone;
    cart={};
    saveCart();
    renderMenu();
    renderCart();
    refreshPickupOptions();
    syncDeliveryUi();
    $("customerNote").value="";
    toggleCheckout(false);
    closeCartDrawer();
    setOrderState(`Zamówienie zapisane. Numer: ${order.displayNumber}`, "ok");
  }catch(error){
    setOrderState(`Nie udało się wysłać zamówienia: ${error.message || error}`, "error");
  }
}

async function initPage(){
  await initAuthPersistence();
  subscribeSettings((nextSettings)=>{
    settings=nextSettings;
    applyTheme(settings);
    fillProfileFromStorage();
    renderMenu();
    renderCart();
    refreshPickupOptions();
    syncDeliveryUi();
  });
  subscribeOrders((nextOrders)=>{
    ordersMap=nextOrders || {};
    renderMenu();
    refreshPickupOptions();
  });
  onAuthStateChanged(auth, (user)=>{
    currentUser=user && user.email!=="admin@pizza.pl" ? user : null;
    $("viewerBadge").textContent = currentUser ? "Klient zalogowany" : "Gość";
    $("openAuthBtn").classList.toggle("hidden", !!currentUser);
    $("openProfileBtn").classList.toggle("hidden", !currentUser);
    $("logoutTopBtn").classList.toggle("hidden", !currentUser);
    setAuthState(currentUser ? `Klient: ${currentUser.email}` : "Klient nie jest zalogowany.", currentUser ? "ok" : "warn");
    if(userOrdersUnsub) userOrdersUnsub();
    if(currentUser){
      userOrdersUnsub = subscribeUserOrders(currentUser.uid, renderMyOrders);
    }else{
      renderMyOrders({});
      userOrdersUnsub = null;
    }
  });

  $("registerBtn").addEventListener("click", registerClient);
  $("loginBtn").addEventListener("click", loginClient);
  $("logoutTopBtn").addEventListener("click", async ()=>{ await signOut(auth); });
  $("openAuthBtn").addEventListener("click", ()=>toggleAuthDrawer());
  $("openProfileBtn").addEventListener("click", ()=>toggleProfileDrawer());
  $("changePasswordBtn").addEventListener("click", changePasswordClient);
  $("saveProfileBtn").addEventListener("click", saveProfileAndMirror);
  $("submitOrderBtn").addEventListener("click", submitOrder);
  $("clearCartBtn").addEventListener("click", ()=>{ cart={}; saveCart(); renderMenu(); renderCart(); refreshPickupOptions(); });
  $("toMenuBtn").addEventListener("click", ()=>$("menuSection").scrollIntoView({ behavior:"smooth" }));
  $("cartFab").addEventListener("click", ()=>toggleCartDrawer());
  $("closeCartBtn").addEventListener("click", closeCartDrawer);
  $("proceedToCheckoutBtn").addEventListener("click", ()=>{
    if(!currentUser){
      pendingCheckoutAfterLogin = true;
      setAuthState("Zaloguj się, aby przejść do zamówienia.", "warn");
      toggleAuthDrawer(true);
      return;
    }
    openCartDrawer();
    toggleCheckout(true);
  });
  $("closeProfileBtn").addEventListener("click", ()=>toggleProfileDrawer(false));
  $("privacyFooterBtn")?.addEventListener("click", ()=>togglePrivacyDrawer());
  $("closePrivacyBtn").addEventListener("click", ()=>togglePrivacyDrawer(false));
  $("uiBackdrop").addEventListener("click", ()=>{
    closeCartDrawer();
    toggleAuthDrawer(false);
    toggleProfileDrawer(false);
    togglePrivacyDrawer(false);
  });

  attachHiddenAdmin();
  bindDeliveryUi();
  installPwaHint($("installHint"));
  fillProfileFromStorage();
  renderMenu();
  renderCart();
  refreshPickupOptions();
  updateFabCount();
}
initPage();
