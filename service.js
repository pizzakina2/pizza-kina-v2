
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, initAuthPersistence, subscribeOrders, subscribeSettings, applyTheme, requireAdmin, $, ordersArray, badgeHtml, formatDateTime, orderSummary, updateOrderStatus, SERVICE_STATUS_OPTIONS, salesStats, activeOrdersList, playSound, menuArray, createGuestOrder, pickupOptions, cartUnits, formatDelivery } from "./shared.js";

let settings = null;
let ordersMap = {};
let lastActiveCount = 0;
let quickCart = [];
const FLOW = ["oczekuje","potwierdzone","w realizacji","gotowe do odbioru","odebrane"];

function nextStatus(value){
  const index = FLOW.indexOf(value);
  return FLOW[index + 1] || value;
}

function humanAuthError(code){
  switch(code){
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Błędny email lub hasło.";
    default:
      return "Nie udało się zalogować.";
  }
}

function renderQuickMenu(){
  const list = menuArray(settings).filter((item)=>item.enabled && Number(item.quantity) > 0);
  $("quickItemId").innerHTML = list.map((item)=>`<option value="${item.id}" data-price="${item.price}">${item.name} • ${item.price.toFixed(2)} zł • stan: ${item.quantity}</option>`).join("");
  syncQuickPriceFromSelect();
}

function syncQuickPriceFromSelect(){
  const selected = $("quickItemId").selectedOptions[0];
  if(!selected) return;
  $("quickItemPrice").value = selected.dataset.price || "0";
}

function quickCartItemsTotal(){
  return quickCart.reduce((sum, item)=>sum + (Number(item.price) * Number(item.qty)), 0);
}

function renderQuickCart(){
  $("quickCartBody").innerHTML = quickCart.length ? quickCart.map((item, index)=>`
    <tr>
      <td>${item.name}</td>
      <td>${item.qty}</td>
      <td>${Number(item.price).toFixed(2)} zł</td>
      <td>${(Number(item.price) * Number(item.qty)).toFixed(2)} zł</td>
      <td><button class="btn btn-danger" data-quick-del="${index}" style="padding:8px 12px">Usuń</button></td>
    </tr>
  `).join("") : `<tr><td colspan="5" class="small">Brak produktów w szybkim zamówieniu.</td></tr>`;

  document.querySelectorAll("[data-quick-del]").forEach((button)=>button.addEventListener("click", ()=>{
    quickCart.splice(Number(button.dataset.quickDel), 1);
    renderQuickCart();
  }));

  if($("quickOrderState") && quickCart.length){
    $("quickOrderState").className = "notice warn";
    $("quickOrderState").textContent = `Pozycje: ${quickCart.length}, suma: ${quickCartItemsTotal().toFixed(2)} zł`;
  }
}

function addQuickItem(){
  const list = menuArray(settings);
  const itemId = $("quickItemId")?.value;
  const menuItem = list.find((item)=>item.id === itemId);
  if(!menuItem){
    $("quickOrderState").className = "notice error";
    $("quickOrderState").textContent = "Wybierz produkt z listy.";
    return;
  }

  const qty = Math.max(1, Number($("quickItemQty")?.value || 1));
  const price = Math.max(0, Number($("quickItemPrice")?.value || menuItem.price));
  const existing = quickCart.find((item)=>item.id === menuItem.id && Number(item.price) === price);

  if(existing){
    existing.qty += qty;
  }else{
    quickCart.push({ id: menuItem.id, name: menuItem.name, qty, price });
  }

  $("quickItemQty").value = "1";
  renderQuickCart();
}

function renderOrders(){
  const list = ordersArray(ordersMap).map((order)=>({
    ...order,
    recordId: order.orderId || order.id,
    displaySafe: order.displayNumber || order.shortNumber || order.orderId || order.id || "-",
    nameSafe: order.customerName || order.name || "-",
    phoneSafe: order.customerPhone || order.phone || "-",
    pickupSafe: order.pickupTime || order.pickupLabel || "-"
  }));
  const active = list.filter((order)=>!["odebrane","anulowane"].includes(order.status));
  const archived = list.filter((order)=>["odebrane","anulowane"].includes(order.status));

  $("activeOrdersBody").innerHTML = active.length ? active.map((order)=>`
    <tr>
      <td>${order.displaySafe}</td>
      <td>${formatDateTime(order.createdAt)}</td>
      <td>${order.nameSafe}</td>
      <td>${order.phoneSafe}</td>
      <td>${orderSummary(order)}</td>
      <td>${order.pickupSafe}</td>
      <td>${formatDelivery(order)}</td>
      <td>${badgeHtml(order.status)}</td>
      <td><button class="btn btn-secondary" data-next="${order.recordId}" style="padding:8px 12px">➡</button></td>
      <td><select class="select" data-status="${order.recordId}">${SERVICE_STATUS_OPTIONS.map((status)=>`<option value="${status}" ${status===order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td>
    </tr>
  `).join("") : `<tr><td colspan="10" class="small">Brak aktywnych zamówień.</td></tr>`;

  $("archivedOrdersBody").innerHTML = archived.length ? archived.map((order)=>`
    <tr>
      <td>${order.displaySafe}</td>
      <td>${formatDateTime(order.createdAt)}</td>
      <td>${order.nameSafe}</td>
      <td>${order.phoneSafe}</td>
      <td>${orderSummary(order)}</td>
      <td>${order.pickupSafe}</td>
      <td>${formatDelivery(order)}</td>
      <td>${badgeHtml(order.status)}</td>
      <td><span class="small">Zamknięte</span></td>
    </tr>
  `).join("") : `<tr><td colspan="9" class="small">Brak archiwum.</td></tr>`;

  document.querySelectorAll("[data-status]").forEach((select)=>select.addEventListener("change", async (event)=>{
    try{
      await updateOrderStatus(event.target.dataset.status, event.target.value);
    }catch(error){
      $("quickOrderState").className = "notice error";
      $("quickOrderState").textContent = `Status błąd: ${error.message || error}`;
    }
  }));
  document.querySelectorAll("[data-next]").forEach((button)=>button.addEventListener("click", async ()=>{
    const order = active.find((item)=>item.recordId===button.dataset.next);
    if(!order) return;
    await updateOrderStatus(order.recordId, nextStatus(order.status));
  }));

  const stats = salesStats(ordersMap);
  $("salesBody").innerHTML = stats.lines.length ? stats.lines.map((line)=>`
    <tr><td>${line.name}</td><td>${line.qty}</td><td>${line.unitPrice.toFixed(2)} zł</td><td>${line.revenue.toFixed(2)} zł</td></tr>
  `).join("") : `<tr><td colspan="4" class="small">Brak sprzedaży.</td></tr>`;
  $("kpiOrders").textContent = String(active.length);
  $("kpiItems").textContent = String(stats.totalItems);
  $("kpiRevenue").textContent = `${stats.totalRevenue.toFixed(2)} zł`;
}
async function addQuickOrder(){
  if(!quickCart.length){
    $("quickOrderState").className = "notice error";
    $("quickOrderState").textContent = "Dodaj przynajmniej jeden produkt.";
    return;
  }

  const name = $("quickCustomerName")?.value.trim() || "Klient przy kasie";
  const phone = $("quickCustomerPhone")?.value.trim() || "";
  const pickupValue = $("quickPickupTime")?.value.trim() || "Jak najszybciej";
  const options = pickupOptions(ordersMap, settings, cartUnits(quickCart));
  const pickupOption = options.find((option)=>option.value === pickupValue) || { value: pickupValue, label: pickupValue, etaTs: Date.now() };

  try{
    const order = await createGuestOrder({ name, phone, note: "zamówienie przy kasie", pickupTime: pickupValue }, quickCart, pickupOption);
    quickCart = [];
    renderQuickCart();
    $("quickCustomerName").value = "";
    $("quickCustomerPhone").value = "";
    $("quickPickupTime").value = "";
    $("quickOrderState").className = "notice ok";
    $("quickOrderState").textContent = `Szybkie zamówienie dodane. Numer: ${order.displayNumber}`;
    renderQuickMenu();
  }catch(error){
    $("quickOrderState").className = "notice error";
    $("quickOrderState").textContent = error.message || "Nie udało się dodać zamówienia.";
  }
}

async function loginAdmin(){
  const email = $("email").value.trim();
  const password = $("password").value.trim();
  if(!email || !password) return;
  try{
    await signInWithEmailAndPassword(auth, email, password);
  }catch(error){
    alert(humanAuthError(error.code));
  }
}

async function initPage(){
  await initAuthPersistence();

  subscribeSettings((nextSettings)=>{
    settings = nextSettings;
    applyTheme(settings);
    renderQuickMenu();
    renderQuickCart();
  });

  subscribeOrders((nextOrders)=>{
    ordersMap = nextOrders || {};
    const active = activeOrdersList(ordersMap);
    if(lastActiveCount && active.length > lastActiveCount){
      playSound(settings?.sounds?.serviceUrl || "", settings?.sounds?.serviceEnabled !== false, settings?.sounds?.serviceVolume ?? 0.7);
    }
    lastActiveCount = active.length;
    renderOrders();
  });

  onAuthStateChanged(auth, (user)=>{
    const ok = requireAdmin(user);
    $("loginBox").classList.toggle("hidden", ok);
    $("appBox").classList.toggle("hidden", !ok);
    $("viewerBadge").textContent = ok ? "Admin" : "Gość";
  });

  $("loginBtn").addEventListener("click", loginAdmin);
  $("logoutBtn").addEventListener("click", async ()=>{ await signOut(auth); });
  $("printBtn").addEventListener("click", ()=>window.print());
  $("quickItemId").addEventListener("change", syncQuickPriceFromSelect);
  $("quickAddItemBtn").addEventListener("click", addQuickItem);
  $("quickOrderBtn").addEventListener("click", addQuickOrder);
}
initPage();
