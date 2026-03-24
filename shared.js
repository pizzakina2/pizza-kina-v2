
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, push, set, update, get, onValue, off, runTransaction, remove } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, updatePassword, sendEmailVerification, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset, applyActionCode } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth, ADMIN_EMAIL, ref, push, set, update, get, onValue, off, runTransaction, remove, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, updatePassword, sendEmailVerification, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset, applyActionCode };

export const DEFAULT_SETTINGS = {
  texts: {
    brandName: "PIZZA_KINA",
    heroTitle: "Zamów pizzę online bez dzwonienia.",
    heroSubtitle: "Klient ma konto i historię zamówień. Obsługa, kuchnia, admin i ekran numerków działają live.",
    menuTitle: "Menu",
    menuSubtitle: "Dodaj produkty do koszyka i wybierz godzinę odbioru.",
    accountTitle: "Konto klienta",
    accountSubtitle: "Zarejestruj się albo zaloguj. Widzisz tylko swoje zamówienia.",
    ordersTitle: "Moje zamówienia",
    ordersSubtitle: "Status zamówień i możliwość anulowania, zanim ruszy realizacja.",
    serviceTitle: "Panel obsługi",
    serviceSubtitle: "Pełna tabela aktywnych zamówień, dane klienta, druk i statystyki.",
    kitchenTitle: "Panel kuchni",
    kitchenSubtitle: "Uproszczona tabela zamówień i zbiorcza tabela przygotowania.",
    adminTitle: "Panel admina",
    adminSubtitle: "Ustawienia czasu realizacji, wyglądu, menu, dźwięków i treści.",
    screenTitle: "Ekran odbioru",
    screenSubtitle: "Duże numerki jak na wyświetlaczu odbioru."
  },
  theme: {
    bgColor: "#121212",
    panelColor: "#1e1e1e",
    primaryColor: "#ff6b2d",
    textColor: "#f5f5f5",
    fontFamily: "Arial, Helvetica, sans-serif",
    headingSizePx: 32,
    bodySizePx: 16
  },
  media: {
    logoEmoji: "🍕",
    heroMain: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=80",
    heroSecondary: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=1200&q=80",
    heroThird: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=1200&q=80"
  },
  capacity: { minLeadMinutes: 15, slotMinutes: 15, unitsPerSlot: 4 },
  schedule: {
    days: { "0": true, "1": true, "2": true, "3": true, "4": true, "5": true, "6": true },
    openTime: "13:30",
    closeTime: "20:40"
  },
  deliveryOptions: {
    home: { enabled: true, label: "U mnie w domu" },
    pickup: { enabled: true, label: "Odbiór osobisty" },
    delivery: { enabled: true, label: "Dowóz" }
  },
  sounds: { serviceUrl: "", kitchenUrl: "", serviceEnabled: true, kitchenEnabled: true, serviceVolume: 0.7, kitchenVolume: 0.7 },
  menu: {
    margherita: { id: "margherita", name: "Margherita", price: 24, description: "Sos pomidorowy, mozzarella, oregano.", quantity: 999, enabled: true, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=80" },
    capricciosa: { id: "capricciosa", name: "Capricciosa", price: 31, description: "Szynka, pieczarki, mozzarella, sos.", quantity: 999, enabled: true, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=1200&q=80" },
    pepperoni: { id: "pepperoni", name: "Pepperoni", price: 34, description: "Pepperoni, mozzarella, sos pomidorowy.", quantity: 999, enabled: true, image: "https://images.unsplash.com/photo-1620374645498-af6bd681a0bd?auto=format&fit=crop&w=1200&q=80" },
    hawajska: { id: "hawajska", name: "Hawajska", price: 32, description: "Szynka, ananas, mozzarella, sos.", quantity: 999, enabled: true, image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=1200&q=80" },
    diavola: { id: "diavola", name: "Diavola", price: 36, description: "Salami pikantne, jalapeño, mozzarella.", quantity: 999, enabled: true, image: "https://images.unsplash.com/photo-1548365328-9f547fb0953b?auto=format&fit=crop&w=1200&q=80" },
    vege: { id: "vege", name: "Vege", price: 30, description: "Papryka, cebula, kukurydza, pieczarki.", quantity: 999, enabled: true, image: "https://images.unsplash.com/photo-1511689660979-10d2b1aada49?auto=format&fit=crop&w=1200&q=80" }
  }
};

export const ORDER_STATUSES = ["oczekuje","potwierdzone","w realizacji","gotowe do odbioru","odebrane","anulowane"];
export const SERVICE_STATUS_OPTIONS = ORDER_STATUSES;
export const KITCHEN_STATUS_OPTIONS = ["w realizacji", "gotowe do odbioru"];
export function $(id){ return document.getElementById(id); }
export function sanitizeId(value){ return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || `item-${Date.now()}`; }
export function money(value){ return `${Number(value || 0).toFixed(2)} zł`; }
export function dateKeyLocal(date=new Date()){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function shortDate(date=new Date()){ return `${String(date.getFullYear()).slice(-2)}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
export function formatDateTime(ts){ if(!ts) return "-"; const d=new Date(ts); return `${shortDate(d)} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
export function badgeClass(status){ if(status==="oczekuje") return "badge badge-oczekuje"; if(status==="potwierdzone") return "badge badge-potwierdzone"; if(status==="w realizacji") return "badge badge-realizacja"; if(status==="gotowe do odbioru") return "badge badge-gotowe"; if(status==="odebrane") return "badge badge-odebrane"; return "badge badge-anulowane"; }
export function badgeHtml(status){ return `<span class="${badgeClass(status)}">${status}</span>`; }
export function deepMerge(target, source){ const out=structuredClone(target); if(!source||typeof source!=="object") return out; Object.keys(source).forEach((k)=>{ const sv=source[k]; const tv=out[k]; if(sv&&typeof sv==="object"&&!Array.isArray(sv)){ out[k]=deepMerge(tv||{}, sv); } else { out[k]=sv; } }); return out; }
export function normalizeMenu(menu){ if(!menu||typeof menu!=="object") return structuredClone(DEFAULT_SETTINGS.menu); const out={}; Object.entries(menu).forEach(([key, item])=>{ const id=sanitizeId(item?.id||key); out[id]={ id, name:item?.name||id, price:Number(item?.price||0), description:item?.description||"", quantity:Number(item?.quantity ?? 999), enabled:item?.enabled!==false, image:item?.image||DEFAULT_SETTINGS.menu.margherita.image }; }); return out; }
export function normalizeSettings(raw){
  const merged=deepMerge(DEFAULT_SETTINGS, raw||{});
  merged.menu=normalizeMenu(merged.menu);
  merged.schedule = deepMerge(DEFAULT_SETTINGS.schedule, merged.schedule || {});
  merged.deliveryOptions = deepMerge(DEFAULT_SETTINGS.deliveryOptions, merged.deliveryOptions || {});
  return merged;
}
export function menuArray(settings){ return Object.values(normalizeMenu(settings?.menu)).sort((a,b)=>a.name.localeCompare(b.name,"pl")); }
export async function ensureSettings(){ const settingsRef=ref(db, "settings"); const snapshot=await get(settingsRef); if(!snapshot.exists()){ await set(settingsRef, DEFAULT_SETTINGS); return structuredClone(DEFAULT_SETTINGS); } return normalizeSettings(snapshot.val()); }
export function subscribeSettings(callback){ const settingsRef=ref(db, "settings"); return onValue(settingsRef, async (snapshot)=>{ if(!snapshot.exists()){ await set(settingsRef, DEFAULT_SETTINGS); callback(structuredClone(DEFAULT_SETTINGS)); return; } callback(normalizeSettings(snapshot.val())); }); }
export function subscribeOrders(callback){ return onValue(ref(db, "orders"), (snapshot)=>callback(snapshot.val() || {})); }
export function subscribeUserOrders(uid, callback){ return onValue(ref(db, `userOrders/${uid}`), (snapshot)=>callback(snapshot.val() || {})); }
export function normalizeOrderRecord(id, value){
  const createdAt = Number(value?.createdAt || 0);
  const fallbackShort = String(value?.shortNumber || value?.orderSeq || String(id).slice(-3) || "000").padStart(3, "0").slice(-3);
  return {
    id,
    orderId: value?.orderId || id,
    displayNumber: value?.displayNumber || (value?.shortNumber ? `${shortDate(createdAt ? new Date(createdAt) : new Date())} ${String(value.shortNumber).padStart(3,"0")}` : fallbackShort),
    shortNumber: value?.shortNumber || fallbackShort,
    createdAt,
    updatedAt: Number(value?.updatedAt || createdAt || Date.now()),
    customerName: value?.customerName || value?.name || "-",
    customerPhone: value?.customerPhone || value?.phone || "-",
    items: Array.isArray(value?.items) ? value.items : [],
    pickupTime: value?.pickupTime || value?.pickupLabel || "-",
    status: value?.status || "odebrane",
    uid: value?.uid || "",
    total: Number(value?.total || 0),
    note: value?.note || "",
    ...value
  };
}
export function ordersArray(map){ return Object.entries(map||{}).map(([id, value])=>normalizeOrderRecord(id, value)).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)); }
export function activeOrdersList(map){ return ordersArray(map).filter((order)=>!["odebrane","anulowane"].includes(order.status)); }
export function activeProductionOrders(map){ return ordersArray(map).filter((order)=>!["odebrane","anulowane"].includes(order.status)); }
export function cancellable(order){ return order?.status === "oczekuje"; }
export async function buildNextOrderNumbers(){ const now=new Date(); const key=dateKeyLocal(now); const counterRef=ref(db, `counters/${key}`); const result=await runTransaction(counterRef, (current)=>Number(current||0)+1); const seq=Number(result.snapshot.val() || 1); const shortNumber=String(seq).padStart(3, "0"); return { dateKey:key, shortNumber, displayNumber:`${shortDate(now)} ${shortNumber}`, seq }; }
export function cartUnits(items){ return items.reduce((sum, item)=>sum+Number(item.qty||0), 0); }
export function orderUnits(order){ return (order.items||[]).reduce((sum, item)=>sum+Number(item.qty||0), 0); }

export function minutesFromNow(ts){ return Math.max(0, Math.ceil((ts - Date.now()) / 60000)); }
function parseHm(value, fallback){
  const raw = String(value || fallback || "13:30");
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if(!match) return parseHm(fallback || "13:30");
  return { h:Number(match[1]), m:Number(match[2]) };
}
function setTimeOnDate(date, hm){
  const next = new Date(date.getTime());
  next.setHours(hm.h, hm.m, 0, 0);
  return next;
}
export function formatDelivery(order){
  const delivery = order?.delivery;
  if(!delivery) return "-";
  if(delivery.type === "delivery"){
    return delivery.address ? `${delivery.label}: ${delivery.address}` : delivery.label || "Dowóz";
  }
  return delivery.label || "-";
}
export function pickupOptions(ordersMap, settings, requestedUnits){
  const cap=settings.capacity || DEFAULT_SETTINGS.capacity;
  const schedule=settings.schedule || DEFAULT_SETTINGS.schedule;
  const minLead=Math.max(15, Number(cap.minLeadMinutes||15));
  const slotMinutes=Math.max(5, Number(cap.slotMinutes||15));
  const unitsPerSlot=Math.max(1, Number(cap.unitsPerSlot||4));
  const activeUnits=activeProductionOrders(ordersMap).reduce((sum, order)=>["gotowe do odbioru","odebrane","anulowane"].includes(order.status) ? sum : sum + orderUnits(order), 0);
  const neededUnits=Math.max(1, Number(requestedUnits||1));
  const earliestSlotIndex=Math.floor(activeUnits / unitsPerSlot);
  const openHm=parseHm(schedule.openTime, "13:30");
  const closeHm=parseHm(schedule.closeTime, "20:40");
  const enabledDays = schedule.days || DEFAULT_SETTINGS.schedule.days;
  const options=[];
  const startTs = Date.now() + (minLead + earliestSlotIndex * slotMinutes) * 60000;
  let cursor = new Date(startTs);
  cursor.setSeconds(0,0);
  cursor.setMinutes(Math.ceil(cursor.getMinutes()/5)*5);
  let guard=0;
  while(options.length < 8 && guard < 800){
    guard += 1;
    const dayEnabled = !!enabledDays[String(cursor.getDay())];
    const openAt = setTimeOnDate(cursor, openHm);
    const closeAt = setTimeOnDate(cursor, closeHm);
    if(!dayEnabled){
      cursor.setDate(cursor.getDate()+1);
      cursor = setTimeOnDate(cursor, openHm);
      continue;
    }
    if(cursor < openAt){
      cursor = openAt;
    }
    if(cursor > closeAt){
      cursor.setDate(cursor.getDate()+1);
      cursor = setTimeOnDate(cursor, openHm);
      continue;
    }
    const value=`${String(cursor.getHours()).padStart(2,"0")}:${String(cursor.getMinutes()).padStart(2,"0")}`;
    let label = `${value} (${minutesFromNow(cursor.getTime())} min)`;
    if(cursor.toDateString() !== new Date().toDateString()){
      label = `${value} • ${cursor.toLocaleDateString("pl-PL", { weekday:"short", day:"2-digit", month:"2-digit" })}`;
    }
    options.push({ value, label, etaTs:cursor.getTime(), requestedUnits:neededUnits });
    cursor = new Date(cursor.getTime() + slotMinutes * 60000);
  }
  return options;
}
export function orderSummary(order){ return (order.items||[]).map((item)=>`${item.name} × ${item.qty}`).join(", "); }
export function orderSummaryLines(order){ return (order.items||[]).map((item)=>`${item.name} × ${item.qty}`).join("<br>"); }
export function applyTheme(settings){ const t=settings.theme || DEFAULT_SETTINGS.theme; const vars={ "--bg":t.bgColor, "--panel":t.panelColor, "--panel-2":t.panelColor, "--primary":t.primaryColor, "--primary-2":t.primaryColor, "--text":t.textColor, "--font-family":t.fontFamily, "--heading-size":`${Number(t.headingSizePx)}px`, "--body-size":`${Number(t.bodySizePx)}px` }; Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v)); document.querySelectorAll("[data-text-key]").forEach((node)=>{ const key=node.dataset.textKey; if(settings.texts?.[key]) node.textContent=settings.texts[key]; }); document.querySelectorAll("[data-media-key]").forEach((node)=>{ const key=node.dataset.mediaKey; const value=settings.media?.[key]; if(!value) return; if(node.tagName==="IMG") node.src=value; else node.textContent=value; }); }
export function formatOption(option){ return `<option value="${option.value}">${option.label}</option>`; }
export async function saveSettings(settings){ await set(ref(db, "settings"), normalizeSettings(settings)); }
export async function updateOrderStatus(orderId, nextStatus){ const orderRef=ref(db, `orders/${orderId}`); const snapshot=await get(orderRef); if(!snapshot.exists()) return; const order=snapshot.val(); const payload={ status:nextStatus, updatedAt:Date.now() }; await update(orderRef, payload); if(order.uid){ await update(ref(db, `userOrders/${order.uid}/${orderId}`), payload); } }
export async function cancelOrder(orderId, user){ const orderRef=ref(db, `orders/${orderId}`); const snapshot=await get(orderRef); if(!snapshot.exists()) return; const order=snapshot.val(); if(order.uid!==user.uid || !cancellable(order)){ throw new Error("Nie można anulować tego zamówienia."); } const payload={ status:"anulowane", cancelledAt:Date.now(), updatedAt:Date.now() }; await update(orderRef, payload); await update(ref(db, `userOrders/${user.uid}/${orderId}`), payload); for(const item of (order.items||[])){ const qtyRef=ref(db, `settings/menu/${item.id}/quantity`); await runTransaction(qtyRef, (current)=>Number(current ?? 0)+Number(item.qty || 0)); } }
export async function createOrder(user, customer, cartItems, pickupOption){ const numbers=await buildNextOrderNumbers(); const orderId=push(ref(db, "orders")).key; const order={ orderId, uid:user.uid, email:user.email, customerName:customer.name, customerPhone:customer.phone, note:customer.note||"", delivery:customer.delivery || null, items:cartItems.map((item)=>({ id:item.id, name:item.name, price:Number(item.price), qty:Number(item.qty) })), units:cartUnits(cartItems), total:cartItems.reduce((sum, item)=>sum + (Number(item.price)*Number(item.qty)), 0), orderDateKey:numbers.dateKey, orderSeq:numbers.seq, shortNumber:numbers.shortNumber, displayNumber:numbers.displayNumber, createdAt:Date.now(), updatedAt:Date.now(), pickupTime:pickupOption.value, pickupEtaTs:pickupOption.etaTs, pickupLabel:pickupOption.label, status:"oczekuje" }; const reserved=[]; for(const item of cartItems){ const qtyRef=ref(db, `settings/menu/${item.id}/quantity`); const result=await runTransaction(qtyRef, (current)=>{ const available=Number(current ?? 0); const needed=Number(item.qty || 0); if(available < needed) return; return available-needed; }); if(!result.committed){ for(const rollbackItem of reserved){ const rollbackRef=ref(db, `settings/menu/${rollbackItem.id}/quantity`); await runTransaction(rollbackRef, (current)=>Number(current ?? 0)+Number(rollbackItem.qty || 0)); } throw new Error(`Brak wystarczającej ilości produktu: ${item.name}`); } reserved.push(item); } await set(ref(db, `orders/${orderId}`), order); await set(ref(db, `userOrders/${user.uid}/${orderId}`), order); return order; }
export async function createGuestOrder(customer, cartItems, pickupOption){
  const numbers = await buildNextOrderNumbers();
  const orderId = push(ref(db, "orders")).key;
  const order = {
    orderId,
    uid: "",
    email: "",
    customerName: customer.name || "Klient przy kasie",
    customerPhone: customer.phone || "",
    note: customer.note || "zamówienie przy kasie",
    delivery: customer.delivery || null,
    items: cartItems.map((item)=>({ id:item.id, name:item.name, price:Number(item.price), qty:Number(item.qty) })),
    units: cartUnits(cartItems),
    total: cartItems.reduce((sum, item)=>sum + (Number(item.price)*Number(item.qty)), 0),
    orderDateKey: numbers.dateKey,
    orderSeq: numbers.seq,
    shortNumber: numbers.shortNumber,
    displayNumber: numbers.displayNumber,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pickupTime: pickupOption?.value || customer.pickupTime || "",
    pickupEtaTs: pickupOption?.etaTs || Date.now(),
    pickupLabel: pickupOption?.label || customer.pickupTime || "",
    status: "potwierdzone"
  };
  const reserved = [];
  for(const item of cartItems){
    const qtyRef = ref(db, `settings/menu/${item.id}/quantity`);
    const result = await runTransaction(qtyRef, (current)=>{
      const available = Number(current ?? 0);
      const needed = Number(item.qty || 0);
      if(available < needed) return;
      return available-needed;
    });
    if(!result.committed){
      for(const rollbackItem of reserved){
        const rollbackRef = ref(db, `settings/menu/${rollbackItem.id}/quantity`);
        await runTransaction(rollbackRef, (current)=>Number(current ?? 0)+Number(rollbackItem.qty || 0));
      }
      throw new Error(`Brak wystarczającej ilości produktu: ${item.name}`);
    }
    reserved.push(item);
  }
  await set(ref(db, `orders/${orderId}`), order);
  return order;
}
export function countsForKitchen(ordersMap){ const counts={}; activeProductionOrders(ordersMap).filter((order)=>!["gotowe do odbioru"].includes(order.status)).forEach((order)=>{ (order.items||[]).forEach((item)=>{ counts[item.name]=counts[item.name] || { name:item.name, qty:0 }; counts[item.name].qty += Number(item.qty||0); }); }); return Object.values(counts).sort((a,b)=>b.qty-a.qty); }
export function salesStats(ordersMap){ const stats={}; let totalRevenue=0; let totalItems=0; ordersArray(ordersMap).filter((order)=>!["anulowane"].includes(order.status)).forEach((order)=>{ (order.items||[]).forEach((item)=>{ stats[item.name]=stats[item.name] || { name:item.name, qty:0, revenue:0, unitPrice:Number(item.price||0) }; stats[item.name].qty += Number(item.qty||0); stats[item.name].revenue += Number(item.qty||0)*Number(item.price||0); totalItems += Number(item.qty||0); }); totalRevenue += Number(order.total||0); }); return { lines:Object.values(stats).sort((a,b)=>b.revenue-a.revenue), totalRevenue, totalItems }; }
export function bigScreenGroups(ordersMap){ const source=activeProductionOrders(ordersMap); return { potwierdzone:source.filter((o)=>o.status==="potwierdzone"), realizacja:source.filter((o)=>o.status==="w realizacji"), gotowe:source.filter((o)=>o.status==="gotowe do odbioru") }; }
export async function fileToDataUrl(file){ return new Promise((resolve,reject)=>{ const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result||"")); reader.onerror=reject; reader.readAsDataURL(file); }); }
export async function playSound(src, enabled=true, volume=0.7){ if(!src || enabled===false) return; try{ const audio=new Audio(src); audio.currentTime=0; audio.volume=Math.max(0, Math.min(1, Number(volume || 0.7))); await audio.play(); }catch(error){ console.warn(error); } }
export function requireAdmin(user){ return !!user && user.email===ADMIN_EMAIL; }
export function installPwaHint(node){ const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent); const standalone=window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true; if(node && isiOS && !standalone){ setTimeout(()=>node.classList.remove("hidden"), 1000); } if("serviceWorker" in navigator){ window.addEventListener("load", ()=>navigator.serviceWorker.register("./sw.js").catch(console.error)); } }
export async function initAuthPersistence(){ await setPersistence(auth, browserLocalPersistence); }
