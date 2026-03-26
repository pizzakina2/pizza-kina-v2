import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  serverTimestamp,
  runTransaction,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  sendEmailVerification,
  sendPasswordResetEmail,
};

export const $ = (id) => document.getElementById(id);
export const money = (v) => `${Number(v || 0).toFixed(2)} zł`;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const STATUS_FLOW = [
  "oczekuje",
  "potwierdzone",
  "w realizacji",
  "gotowe do odbioru",
  "odebrane",
  "anulowane",
];

export const DEFAULT_SETTINGS = {
  brandName: "PiZZA-KINA",
  heroTitle: "PiZZA-KINA",
  heroSubtitle: "Świeża pizza, szybki odbiór i wygodne zamówienia online.",
  menuTitle: "Menu",
  menuSubtitle: "Dodaj produkty do koszyka i wybierz godzinę odbioru.",
  serviceTitle: "Panel obsługi",
  serviceSubtitle: "Aktywne zamówienia i statusy live.",
  kitchenTitle: "Panel kuchni",
  kitchenSubtitle: "Uproszczona kolejka realizacji.",
  screenTitle: "Ekran odbioru",
  screenSubtitle: "Duże numerki jak na wyświetlaczu odbioru.",
  adminTitle: "Panel admina",
  adminSubtitle: "Ustawienia, menu i historia zamówień.",
  accountTitle: "Konto klienta",
  accountSubtitle: "Historia zamówień i dane klienta.",
  ordersTitle: "Moje zamówienia",
  ordersSubtitle: "Twoja historia zamówień.",
  logoEmoji: "🍕",
  heroMain: "",
  heroSecondary: "",
  heroThird: "",
  bgColor: "#121212",
  panelColor: "#1e1e1e",
  primaryColor: "#b91c1c",
  textColor: "#f7f7f7",
  fontFamily: "system-ui, sans-serif",
  headingSizePx: 28,
  bodySizePx: 16,
  minLeadMinutes: 15,
  slotMinutes: 15,
  unitsPerSlot: 4,
  openTime: "13:30",
  closeTime: "20:40",
  deliveryOptions: {
    home: { enabled: true, label: "U mnie w domu" },
    pickup: { enabled: true, label: "Odbiór osobisty" },
    delivery: { enabled: true, label: "Dowóz" },
  },
  sounds: {
    serviceUrl: "",
    kitchenUrl: "",
    serviceVolume: 0.7,
    kitchenVolume: 0.7,
    serviceEnabled: true,
    kitchenEnabled: true,
  },
};

export function normalizeSettings(raw = {}) {
  const d = structuredClone(DEFAULT_SETTINGS);
  const src = raw || {};
  return {
    ...d,
    ...src,
    deliveryOptions: {
      ...d.deliveryOptions,
      ...(src.deliveryOptions || {}),
      home: { ...d.deliveryOptions.home, ...(src.deliveryOptions?.home || {}) },
      pickup: { ...d.deliveryOptions.pickup, ...(src.deliveryOptions?.pickup || {}) },
      delivery: { ...d.deliveryOptions.delivery, ...(src.deliveryOptions?.delivery || {}) },
    },
    sounds: { ...d.sounds, ...(src.sounds || {}) },
  };
}

export function applyTheme(settings) {
  const s = normalizeSettings(settings);
  const root = document.documentElement;
  root.style.setProperty("--bg", s.bgColor);
  root.style.setProperty("--panel", s.panelColor);
  root.style.setProperty("--panel-2", s.panelColor);
  root.style.setProperty("--primary", s.primaryColor);
  root.style.setProperty("--primary-2", s.primaryColor);
  root.style.setProperty("--text", s.textColor);
  root.style.setProperty("--font-family", s.fontFamily);
  root.style.setProperty("--heading-size", `${Number(s.headingSizePx)}px`);
  root.style.setProperty("--body-size", `${Number(s.bodySizePx)}px`);

  document.querySelectorAll("[data-text-key]").forEach((node) => {
    const key = node.dataset.textKey;
    if (s[key]) node.textContent = s[key];
  });
  document.querySelectorAll("[data-media-key]").forEach((node) => {
    const key = node.dataset.mediaKey;
    if (!s[key]) return;
    if (node.tagName === "IMG") node.src = s[key];
    else node.textContent = s[key];
  });
}

export async function initAuthPersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn(e);
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function getStaffDoc(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "staff", uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

export async function ensureUserProfile(user, extra = {}) {
  if (!user?.uid) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const payload = {
    email: user.email || "",
    displayName: user.displayName || extra.displayName || "",
    phone: extra.phone || snap.data()?.phone || "",
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

export function subscribeSettings(cb) {
  return onSnapshot(doc(db, "publicSettings", "current"), (snap) => {
    cb(normalizeSettings(snap.exists() ? snap.data() : {}));
  });
}

export async function saveSettings(settings) {
  await setDoc(doc(db, "publicSettings", "current"), normalizeSettings(settings), { merge: true });
}

export function menuArray(itemsMapOrArray) {
  if (Array.isArray(itemsMapOrArray)) return [...itemsMapOrArray].sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0));
  return Object.entries(itemsMapOrArray || {}).map(([id, v]) => ({ id, ...v })).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0));
}

export async function getAllMenuItems() {
  const snap = await getDocs(query(collection(db, "menuItems"), orderBy("sortOrder", "asc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeMenu(cb) {
  return onSnapshot(query(collection(db, "menuItems"), orderBy("sortOrder", "asc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function upsertMenuItem(id, data) {
  const ref = doc(db, "menuItems", id);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteMenuItem(id) {
  await deleteDoc(doc(db, "menuItems", id));
}

export function ordersArray(input) {
  const list = Array.isArray(input) ? input : Object.values(input || {});
  return [...list].sort((a,b)=>(Number(b.createdAt||0)-Number(a.createdAt||0)));
}

export function formatDateTime(ts) {
  if (!ts) return "-";
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function badgeHtml(status) {
  const safe = String(status || "oczekuje");
  return `<span class="badge badge-${safe.replaceAll(" ", "-")}">${safe}</span>`;
}

export function orderSummary(order) {
  return (order.items || []).map((item) => `${item.name} × ${item.qty}`).join(", ");
}

export function cartUnits(items) {
  return (items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

function parseHm(value, fallback = "13:30") {
  const raw = String(value || fallback);
  const [h, m] = raw.split(":").map(Number);
  return { h: Number.isFinite(h) ? h : 13, m: Number.isFinite(m) ? m : 30 };
}
function setTimeOnDate(date, hm) {
  const d = new Date(date);
  d.setHours(hm.h, hm.m, 0, 0);
  return d;
}
function minutesFromNow(ts) {
  return Math.max(0, Math.round((ts - Date.now()) / 60000));
}

export function pickupOptions(settings, orders, requestedUnits = 1) {
  const s = normalizeSettings(settings);
  const minLead = Math.max(15, Number(s.minLeadMinutes || 15));
  const slotMinutes = Math.max(5, Number(s.slotMinutes || 15));
  const unitsPerSlot = Math.max(1, Number(s.unitsPerSlot || 4));
  const activeUnits = ordersArray(orders).filter((o) => !["gotowe do odbioru", "odebrane", "anulowane"].includes(o.status)).reduce((sum, o) => sum + cartUnits(o.items || []), 0);
  const earliestSlotIndex = Math.floor(activeUnits / unitsPerSlot);
  const openHm = parseHm(s.openTime, "13:30");
  const closeHm = parseHm(s.closeTime, "20:40");
  const options = [];
  let cursor = new Date(Date.now() + (minLead + earliestSlotIndex * slotMinutes) * 60000);
  cursor.setSeconds(0, 0);
  let guard = 0;
  while (options.length < 8 && guard < 96) {
    guard += 1;
    const openAt = setTimeOnDate(cursor, openHm);
    const closeAt = setTimeOnDate(cursor, closeHm);
    if (cursor < openAt) cursor = openAt;
    if (cursor > closeAt) {
      cursor.setDate(cursor.getDate() + 1);
      cursor = setTimeOnDate(cursor, openHm);
      continue;
    }
    const value = `${String(cursor.getHours()).padStart(2, "0")}:${String(cursor.getMinutes()).padStart(2, "0")}`;
    options.push({ value, label: `${value} (${minutesFromNow(cursor.getTime())} min)`, etaTs: cursor.getTime(), requestedUnits });
    cursor = new Date(cursor.getTime() + slotMinutes * 60000);
  }
  return options;
}

export function formatOption(option) {
  return `<option value="${option.value}">${option.label}</option>`;
}

async function getNextDisplayNumber() {
  const ref = doc(db, "publicSettings", "counters");
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? Number(snap.data().orderSeq || 0) : 0;
    const next = current + 1;
    tx.set(ref, { orderSeq: next, updatedAt: serverTimestamp() }, { merge: true });
    return `K${String(next).padStart(3, "0")}`;
  });
}

export async function createOrder(user, customer, cartItems, pickupOption) {
  const displayNumber = await getNextDisplayNumber();
  const orderRef = doc(collection(db, "orders"));
  const payload = {
    orderId: orderRef.id,
    uid: user?.uid || "",
    email: user?.email || "",
    customerName: customer.name || "Klient",
    customerPhone: customer.phone || "",
    note: customer.note || "",
    delivery: customer.delivery || null,
    items: (cartItems || []).map((i) => ({ id: i.id, name: i.name, price: Number(i.price || 0), qty: Number(i.qty || 0) })),
    units: cartUnits(cartItems),
    total: (cartItems || []).reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 0), 0),
    displayNumber,
    shortNumber: displayNumber,
    pickupTime: pickupOption?.value || "",
    pickupEtaTs: pickupOption?.etaTs || Date.now(),
    pickupLabel: pickupOption?.label || pickupOption?.value || "",
    status: "oczekuje",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const batch = writeBatch(db);
  batch.set(orderRef, payload);
  if (user?.uid) batch.set(doc(db, "users", user.uid, "orders", orderRef.id), { createdAt: payload.createdAt, status: payload.status, displayNumber });
  batch.set(doc(db, "orderQueueScreen", orderRef.id), { displayNumber, status: payload.status, updatedAt: Date.now() });
  await batch.commit();
  return payload;
}

export async function createGuestOrder(customer, cartItems, pickupOption) {
  return createOrder(null, customer, cartItems, pickupOption);
}

export function subscribeOrders(cb) {
  return onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc")), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeUserOrders(user, cb) {
  if (!user?.uid) return () => {};
  return onSnapshot(query(collection(db, "orders"), where("uid", "==", user.uid), orderBy("createdAt", "desc")), (snap) => cb(snap.docs.map((d)=>({ id:d.id, ...d.data() }))));
}

export async function updateOrderStatus(orderId, nextStatus) {
  await updateDoc(doc(db, "orders", orderId), { status: nextStatus, updatedAt: Date.now() });
  await setDoc(doc(db, "orderQueueScreen", orderId), { status: nextStatus, updatedAt: Date.now() }, { merge: true });
}

export async function cancelOrder(orderId, user) {
  const ref = doc(db, "orders", orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Brak zamówienia.");
  const data = snap.data();
  if (data.uid !== user.uid) throw new Error("Brak uprawnień.");
  await updateOrderStatus(orderId, "anulowane");
}

export function salesStats(orders) {
  const stats = {};
  let totalRevenue = 0;
  let totalItems = 0;
  ordersArray(orders).filter((o)=>o.status !== "anulowane").forEach((o) => {
    totalRevenue += Number(o.total || 0);
    (o.items || []).forEach((item) => {
      totalItems += Number(item.qty || 0);
      stats[item.name] ||= { name: item.name, qty: 0, revenue: 0, unitPrice: Number(item.price || 0) };
      stats[item.name].qty += Number(item.qty || 0);
      stats[item.name].revenue += Number(item.qty || 0) * Number(item.price || 0);
    });
  });
  return { lines: Object.values(stats).sort((a,b)=>b.revenue-a.revenue), totalRevenue, totalItems };
}

export function countsForKitchen(orders) {
  const counts = {};
  ordersArray(orders).filter((o)=>!["gotowe do odbioru","odebrane","anulowane"].includes(o.status)).forEach((o) => {
    (o.items || []).forEach((item) => {
      counts[item.name] ||= { name: item.name, qty: 0 };
      counts[item.name].qty += Number(item.qty || 0);
    });
  });
  return Object.values(counts).sort((a,b)=>b.qty-a.qty);
}

export function bigScreenGroups(orders) {
  const list = ordersArray(orders).filter((o)=>!["odebrane","anulowane"].includes(o.status));
  return {
    potwierdzone: list.filter((o)=>o.status === "potwierdzone" || o.status === "oczekuje"),
    realizacja: list.filter((o)=>o.status === "w realizacji"),
    gotowe: list.filter((o)=>o.status === "gotowe do odbioru"),
  };
}

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function playSound(src, enabled = true, volume = 0.7) {
  if (!src || enabled === false) return;
  try {
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, Number(volume || 0.7)));
    await audio.play();
  } catch (e) {
    console.warn(e);
  }
}

export async function getCurrentUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveCurrentUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export function requireRole(staff, roles) {
  return !!staff?.active && roles.includes(staff.role);
}

export function installPwaHint(node) {
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (node && isiOS && !standalone) setTimeout(() => node.classList.remove("hidden"), 1000);
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.error));
  }
}
