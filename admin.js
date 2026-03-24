
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, initAuthPersistence, subscribeSettings, subscribeOrders, saveSettings, normalizeSettings, menuArray, applyTheme, $, fileToDataUrl, requireAdmin, ordersArray, orderSummary, badgeHtml, formatDateTime, updateOrderStatus, db, ref, remove, formatDelivery } from "./shared.js";
let settings = normalizeSettings(); let ordersMap = {}; const FLOW=["oczekuje","potwierdzone","w realizacji","gotowe do odbioru","odebrane","anulowane"]; function nextStatus(value){ const index=FLOW.indexOf(value); return FLOW[index+1] || value; }
function showTab(tabId){ document.querySelectorAll(".tab-content").forEach((node)=>node.classList.remove("active")); document.querySelectorAll("[data-tab]").forEach((button)=>button.classList.remove("btn-primary")); $(tabId).classList.add("active"); document.querySelector(`[data-tab="${tabId}"]`)?.classList.add("btn-primary"); }
function fillForms(){ const { texts, theme, media, capacity, sounds, schedule, deliveryOptions } = settings; Object.entries(texts).forEach(([key, value])=>{ const node=$(`text-${key}`); if(node) node.value=value; }); Object.entries(theme).forEach(([key, value])=>{ const node=$(`theme-${key}`); if(node) node.value=value; }); Object.entries(media).forEach(([key, value])=>{ const node=$(`media-${key}`); if(node) node.value=value; }); $("preview-heroMain").src = media.heroMain; $("preview-heroSecondary").src = media.heroSecondary; $("preview-heroThird").src = media.heroThird; $("capacity-minLeadMinutes").value=capacity.minLeadMinutes; $("capacity-slotMinutes").value=capacity.slotMinutes; $("capacity-unitsPerSlot").value=capacity.unitsPerSlot; $("sound-serviceUrl").value=sounds.serviceUrl || ""; $("sound-kitchenUrl").value=sounds.kitchenUrl || ""; $("sound-serviceVolume").value=String(sounds.serviceVolume ?? 0.7); $("sound-kitchenVolume").value=String(sounds.kitchenVolume ?? 0.7); $("sound-serviceEnabled").checked = sounds.serviceEnabled !== false; $("sound-kitchenEnabled").checked = sounds.kitchenEnabled !== false; $("schedule-openTime").value = schedule.openTime || "13:30"; $("schedule-closeTime").value = schedule.closeTime || "20:40"; [0,1,2,3,4,5,6].forEach((day)=>{ const node=$(`schedule-day-${day}`); if(node) node.checked = schedule.days?.[String(day)] !== false; }); $("delivery-home-enabled").checked = deliveryOptions.home?.enabled !== false; $("delivery-home-label").value = deliveryOptions.home?.label || "U mnie w domu"; $("delivery-pickup-enabled").checked = deliveryOptions.pickup?.enabled !== false; $("delivery-pickup-label").value = deliveryOptions.pickup?.label || "Odbiór osobisty"; $("delivery-delivery-enabled").checked = deliveryOptions.delivery?.enabled !== false; $("delivery-delivery-label").value = deliveryOptions.delivery?.label || "Dowóz"; renderMenuEditor(); renderOrdersAdmin(); }
function renderMenuEditor(){ const list=menuArray(settings); $("menuEditorBody").innerHTML = list.map((item)=>`<tr><td><input class="control" data-field="name" data-id="${item.id}" value="${item.name}"></td><td><input class="control" data-field="price" data-id="${item.id}" type="number" step="0.01" value="${item.price}"></td><td><input class="control" data-field="description" data-id="${item.id}" value="${item.description || ""}"></td><td><input class="control" data-field="quantity" data-id="${item.id}" type="number" value="${item.quantity}"></td><td><input type="checkbox" data-field="enabled" data-id="${item.id}" ${item.enabled ? "checked" : ""}></td><td><div class="stack"><input class="control" data-field="image" data-id="${item.id}" value="${item.image || ""}"><input class="control" data-file-image="${item.id}" type="file" accept="image/*"></div></td><td><button class="btn btn-danger" data-delete="${item.id}" style="padding:8px 12px">Usuń</button></td></tr>`).join("");
document.querySelectorAll("[data-field]").forEach((input)=>{ input.addEventListener("input", (event)=>{ const { id, field } = event.target.dataset; if(!settings.menu[id]) return; if(field==="enabled") settings.menu[id][field] = event.target.checked; else if(field==="price" || field==="quantity") settings.menu[id][field] = Number(event.target.value || 0); else settings.menu[id][field] = event.target.value; }); if(input.type==="checkbox"){ input.addEventListener("change", (event)=>{ const { id, field } = event.target.dataset; settings.menu[id][field] = event.target.checked; }); }});
document.querySelectorAll("[data-file-image]").forEach((input)=>input.addEventListener("change", async (event)=>{ const id=event.target.dataset.fileImage; const file=event.target.files?.[0]; if(!file) return; settings.menu[id].image = await fileToDataUrl(file); renderMenuEditor(); }));
document.querySelectorAll("[data-delete]").forEach((button)=>button.addEventListener("click", ()=>{ delete settings.menu[button.dataset.delete]; renderMenuEditor(); })); }
function readFormToSettings(){ Object.keys(settings.texts).forEach((key)=>{ const node=$(`text-${key}`); if(node) settings.texts[key] = node.value.trim(); }); Object.keys(settings.theme).forEach((key)=>{ const node=$(`theme-${key}`); if(node) settings.theme[key] = node.type === "number" ? Number(node.value || 0) : node.value; }); Object.keys(settings.media).forEach((key)=>{ const node=$(`media-${key}`); if(node) settings.media[key] = node.value.trim(); }); settings.capacity.minLeadMinutes = Math.max(15, Number($("capacity-minLeadMinutes").value || 15)); settings.capacity.slotMinutes = Math.max(5, Number($("capacity-slotMinutes").value || 15)); settings.capacity.unitsPerSlot = Math.max(1, Number($("capacity-unitsPerSlot").value || 4)); settings.sounds.serviceUrl = $("sound-serviceUrl").value.trim(); settings.sounds.kitchenUrl = $("sound-kitchenUrl").value.trim(); settings.sounds.serviceVolume = Number($("sound-serviceVolume").value || 0.7); settings.sounds.kitchenVolume = Number($("sound-kitchenVolume").value || 0.7); settings.sounds.serviceEnabled = $("sound-serviceEnabled").checked; settings.sounds.kitchenEnabled = $("sound-kitchenEnabled").checked;
 settings.schedule.openTime = $("schedule-openTime").value || "13:30";
 settings.schedule.closeTime = $("schedule-closeTime").value || "20:40";
 settings.schedule.days = settings.schedule.days || {};
 [0,1,2,3,4,5,6].forEach((day)=>{ settings.schedule.days[String(day)] = !!$(`schedule-day-${day}`).checked; });
 settings.deliveryOptions.home.enabled = $("delivery-home-enabled").checked;
 settings.deliveryOptions.home.label = $("delivery-home-label").value.trim() || "U mnie w domu";
 settings.deliveryOptions.pickup.enabled = $("delivery-pickup-enabled").checked;
 settings.deliveryOptions.pickup.label = $("delivery-pickup-label").value.trim() || "Odbiór osobisty";
 settings.deliveryOptions.delivery.enabled = $("delivery-delivery-enabled").checked;
 settings.deliveryOptions.delivery.label = $("delivery-delivery-label").value.trim() || "Dowóz";
 }
async function saveAll(){ readFormToSettings(); try{ await saveSettings(settings); $("saveInfo").className="notice ok"; $("saveInfo").textContent="Ustawienia zapisane."; }catch(error){ $("saveInfo").className="notice error"; $("saveInfo").textContent=`Błąd zapisu: ${error.message || error}`; } }
async function handleImageUpload(field, previewId){ const file=$(`file-${field}`).files?.[0]; if(!file) return; const data=await fileToDataUrl(file); $(previewId).src = data; $(`media-${field}`).value = data; }
async function handleSoundUpload(field){ const file=$(`file-sound-${field}`).files?.[0]; if(!file) return; if(file.size > 1024*1024){ $("saveInfo").className="notice error"; $("saveInfo").textContent="Plik audio jest za duży do zapisania jako data URL. Użyj linku do pliku audio."; return; } const data=await fileToDataUrl(file); $(`sound-${field}Url`).value = data; }
async function loginAdmin(){ const email=$("adminEmail").value.trim(); const password=$("adminPassword").value.trim(); if(!email || !password) return alert("Podaj email i hasło admina."); try{ await signInWithEmailAndPassword(auth, email, password); alert("Logowanie OK"); }catch(error){ alert(`Logowanie błąd: ${error.code || "unknown"} | ${error.message || error}`); } }
function selectedOrderIds(){ return Array.from(document.querySelectorAll('[data-order-check]:checked')).map((node)=>node.value); }
function renderOrdersAdmin(){
  if(!$("ordersAdminBody")) return;
  const query = ($("orderSearch")?.value || "").trim().toLowerCase();
  const limit = Number($("orderLimit")?.value || 50);
  let list = ordersArray(ordersMap).map((order)=>({
    ...order,
    recordId: order.orderId || order.id,
    displaySafe: order.displayNumber || order.shortNumber || order.orderId || order.id || "-",
    nameSafe: order.customerName || order.name || "-",
    phoneSafe: order.customerPhone || order.phone || "-",
    pickupSafe: order.pickupTime || order.pickupLabel || "-"
  }));
  if(query){
    list = list.filter((order)=>[
      order.displaySafe, order.nameSafe, order.phoneSafe, order.status, order.recordId
    ].join(" ").toLowerCase().includes(query));
  }
  if(limit > 0) list = list.slice(0, limit);

  $("ordersAdminBody").innerHTML = list.length ? list.map((order)=>`<tr>
    <td><input type="checkbox" data-order-check value="${order.recordId}"></td>
    <td>${order.displaySafe}</td>
    <td>${formatDateTime(order.createdAt)}</td>
    <td>${order.nameSafe}</td>
    <td>${order.phoneSafe}</td>
    <td>${orderSummary(order)}</td>
    <td>${order.pickupSafe}</td>
    <td>${formatDelivery(order)}</td>
    <td>${badgeHtml(order.status || "oczekuje")}</td>
    <td><button class="btn btn-secondary" data-order-next="${order.recordId}" style="padding:8px 12px">➡</button></td>
    <td><select class="select" data-order-status="${order.recordId}">${FLOW.map((status)=>`<option value="${status}" ${status===order.status ? "selected" : ""}>${status}</option>`).join("")}</select></td>
    <td><button class="btn btn-danger" data-order-delete="${order.recordId}" style="padding:8px 12px">Usuń</button></td>
  </tr>`).join("") : `<tr><td colspan="12" class="small">Brak wyników.</td></tr>`;

  document.querySelectorAll("[data-order-status]").forEach((select)=>select.addEventListener("change", async (event)=>{
    await updateOrderStatus(event.target.dataset.orderStatus, event.target.value);
  }));
  document.querySelectorAll("[data-order-next]").forEach((button)=>button.addEventListener("click", async ()=>{
    const order = list.find((item)=>item.recordId===button.dataset.orderNext);
    if(!order) return;
    await updateOrderStatus(order.recordId, nextStatus(order.status));
  }));
  document.querySelectorAll("[data-order-delete]").forEach((button)=>button.addEventListener("click", async ()=>{
    await deleteOrder(button.dataset.orderDelete);
  }));
}
async function deleteOrder(orderId){
  const order = ordersMap[orderId] || Object.values(ordersMap).find((item)=>(item.orderId || item.id) === orderId);
  await remove(ref(db, `orders/${orderId}`));
  if(order?.uid){
    await remove(ref(db, `userOrders/${order.uid}/${orderId}`));
  }
  $("ordersAdminInfo").className="notice ok";
  $("ordersAdminInfo").textContent="Zamówienie usunięte.";
}
async function bulkApply(){ const status=$("bulkStatus").value; if(!status) return; for(const id of selectedOrderIds()){ await updateOrderStatus(id, status); } }
async function bulkDelete(){ for(const id of selectedOrderIds()){ await deleteOrder(id); } }
function sanitizeNewId(value){ return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || `item-${Date.now()}`; }
async function initPage(){ await initAuthPersistence(); subscribeSettings((nextSettings)=>{ settings=nextSettings; applyTheme(settings); fillForms(); }); subscribeOrders((nextOrders)=>{ ordersMap=nextOrders || {}; renderOrdersAdmin(); }); onAuthStateChanged(auth, (user)=>{ const ok=requireAdmin(user); $("loginBox").classList.toggle("hidden", ok); $("adminApp").classList.toggle("hidden", !ok); $("adminStatus").textContent = ok ? `Admin: ${user.email}` : "Admin nie jest zalogowany."; }); document.querySelectorAll("[data-tab]").forEach((button)=>button.addEventListener("click", ()=>showTab(button.dataset.tab))); $("loginBtn").addEventListener("click", loginAdmin); $("logoutBtn").addEventListener("click", async ()=>{ await signOut(auth); }); $("saveAllBtn").addEventListener("click", saveAll); $("addMenuItemBtn").addEventListener("click", ()=>{ const id=sanitizeNewId($("newMenuName").value || `produkt-${Date.now()}`); settings.menu[id] = { id, name:$("newMenuName").value.trim() || "Nowy produkt", price:Number($("newMenuPrice").value || 0), description:$("newMenuDescription").value.trim(), quantity:Number($("newMenuQuantity").value || 0), enabled:true, image:$("newMenuImage").value.trim() || settings.media.heroMain }; $("newMenuName").value=""; $("newMenuPrice").value=""; $("newMenuDescription").value=""; $("newMenuQuantity").value=""; $("newMenuImage").value=""; renderMenuEditor(); }); $("file-heroMain").addEventListener("change", ()=>handleImageUpload("heroMain", "preview-heroMain")); $("file-heroSecondary").addEventListener("change", ()=>handleImageUpload("heroSecondary", "preview-heroSecondary")); $("file-heroThird").addEventListener("change", ()=>handleImageUpload("heroThird", "preview-heroThird")); $("file-sound-service").addEventListener("change", ()=>handleSoundUpload("service")); $("file-sound-kitchen").addEventListener("change", ()=>handleSoundUpload("kitchen")); $("orderSearch")?.addEventListener("input", renderOrdersAdmin); $("orderLimit")?.addEventListener("change", renderOrdersAdmin); $("bulkApplyBtn")?.addEventListener("click", bulkApply); $("bulkDeleteBtn")?.addEventListener("click", bulkDelete); $("toggleAllOrders")?.addEventListener("change", (event)=>document.querySelectorAll("[data-order-check]").forEach((node)=>node.checked=event.target.checked)); $("toggleAllOrdersHead")?.addEventListener("change", (event)=>document.querySelectorAll("[data-order-check]").forEach((node)=>node.checked=event.target.checked)); showTab("tab-general"); }
initPage();
