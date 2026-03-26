import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  initAuthPersistence,
  subscribeSettings,
  saveSettings,
  normalizeSettings,
  menuArray,
  applyTheme,
  $,
  fileToDataUrl,
  subscribeOrders,
  ordersArray,
  orderSummary,
  badgeHtml,
  formatDateTime,
  updateOrderStatus,
  deleteMenuItem,
  upsertMenuItem,
  getStaffDoc,
  requireRole,
  salesStats,
} from "./shared.js";

let settings = normalizeSettings();
let menuItems = [];
let orders = [];

function showTab(tabId){
  document.querySelectorAll('.tab-content').forEach((n)=>n.classList.remove('active'));
  document.querySelectorAll('[data-tab]').forEach((n)=>n.classList.remove('btn-primary'));
  $(tabId)?.classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('btn-primary');
}

function fillForms(){
  const map = {
    'text-brandName':'brandName','text-heroTitle':'heroTitle','text-heroSubtitle':'heroSubtitle','text-menuTitle':'menuTitle','text-menuSubtitle':'menuSubtitle','text-accountTitle':'accountTitle','text-accountSubtitle':'accountSubtitle','text-ordersTitle':'ordersTitle','text-ordersSubtitle':'ordersSubtitle','text-serviceTitle':'serviceTitle','text-serviceSubtitle':'serviceSubtitle','text-kitchenTitle':'kitchenTitle','text-kitchenSubtitle':'kitchenSubtitle','text-screenTitle':'screenTitle','text-screenSubtitle':'screenSubtitle','media-logoEmoji':'logoEmoji','media-heroMain':'heroMain','media-heroSecondary':'heroSecondary','media-heroThird':'heroThird','theme-bgColor':'bgColor','theme-panelColor':'panelColor','theme-primaryColor':'primaryColor','theme-textColor':'textColor','theme-fontFamily':'fontFamily','theme-headingSizePx':'headingSizePx','theme-bodySizePx':'bodySizePx','capacity-minLeadMinutes':'minLeadMinutes','capacity-slotMinutes':'slotMinutes','capacity-unitsPerSlot':'unitsPerSlot','schedule-openTime':'openTime','schedule-closeTime':'closeTime'
  };
  Object.entries(map).forEach(([id,key])=>{ if($(id)) $(id).value = settings[key] ?? ''; });
  ['home','pickup','delivery'].forEach((k)=>{ $(`delivery-${k}-enabled`).checked = settings.deliveryOptions?.[k]?.enabled !== false; $(`delivery-${k}-label`).value = settings.deliveryOptions?.[k]?.label || ''; });
  $('sound-serviceUrl').value = settings.sounds?.serviceUrl || '';
  $('sound-kitchenUrl').value = settings.sounds?.kitchenUrl || '';
  $('sound-serviceVolume').value = settings.sounds?.serviceVolume ?? 0.7;
  $('sound-kitchenVolume').value = settings.sounds?.kitchenVolume ?? 0.7;
  $('sound-serviceEnabled').checked = settings.sounds?.serviceEnabled !== false;
  $('sound-kitchenEnabled').checked = settings.sounds?.kitchenEnabled !== false;
  ['heroMain','heroSecondary','heroThird'].forEach((k)=>{ if($(`preview-${k}`)) $(`preview-${k}`).src = settings[k] || ''; });
  renderMenuEditor();
  renderOrders();
}

function readForms(){
  const out = structuredClone(settings);
  const map = {
    'text-brandName':'brandName','text-heroTitle':'heroTitle','text-heroSubtitle':'heroSubtitle','text-menuTitle':'menuTitle','text-menuSubtitle':'menuSubtitle','text-accountTitle':'accountTitle','text-accountSubtitle':'accountSubtitle','text-ordersTitle':'ordersTitle','text-ordersSubtitle':'ordersSubtitle','text-serviceTitle':'serviceTitle','text-serviceSubtitle':'serviceSubtitle','text-kitchenTitle':'kitchenTitle','text-kitchenSubtitle':'kitchenSubtitle','text-screenTitle':'screenTitle','text-screenSubtitle':'screenSubtitle','media-logoEmoji':'logoEmoji','media-heroMain':'heroMain','media-heroSecondary':'heroSecondary','media-heroThird':'heroThird','theme-bgColor':'bgColor','theme-panelColor':'panelColor','theme-primaryColor':'primaryColor','theme-textColor':'textColor','theme-fontFamily':'fontFamily','theme-headingSizePx':'headingSizePx','theme-bodySizePx':'bodySizePx','capacity-minLeadMinutes':'minLeadMinutes','capacity-slotMinutes':'slotMinutes','capacity-unitsPerSlot':'unitsPerSlot','schedule-openTime':'openTime','schedule-closeTime':'closeTime'
  };
  Object.entries(map).forEach(([id,key])=>{ if($(id)) out[key] = $(id).value; });
  ['home','pickup','delivery'].forEach((k)=>{ out.deliveryOptions[k] = { enabled: $(`delivery-${k}-enabled`).checked, label: $(`delivery-${k}-label`).value.trim() }; });
  out.sounds = {
    serviceUrl: $('sound-serviceUrl').value.trim(), kitchenUrl: $('sound-kitchenUrl').value.trim(),
    serviceVolume: Number($('sound-serviceVolume').value || 0.7), kitchenVolume: Number($('sound-kitchenVolume').value || 0.7),
    serviceEnabled: $('sound-serviceEnabled').checked, kitchenEnabled: $('sound-kitchenEnabled').checked,
  };
  return normalizeSettings(out);
}

function renderMenuEditor(){
  $('menuEditorBody').innerHTML = menuArray(menuItems).map((item)=>`<tr>
    <td><input class="control" data-field="name" data-id="${item.id}" value="${item.name || ''}"></td>
    <td><input class="control" data-field="price" data-id="${item.id}" type="number" step="0.01" value="${item.price || 0}"></td>
    <td><input class="control" data-field="description" data-id="${item.id}" value="${item.description || ''}"></td>
    <td><input class="control" data-field="quantity" data-id="${item.id}" type="number" value="${item.quantity || 0}"></td>
    <td><input type="checkbox" data-field="enabled" data-id="${item.id}" ${item.enabled !== false ? 'checked':''}></td>
    <td><div class="stack"><input class="control" data-field="imageUrl" data-id="${item.id}" value="${item.imageUrl || ''}"><input class="control" data-file-image="${item.id}" type="file" accept="image/*"></div></td>
    <td><button class="btn btn-danger" data-delete="${item.id}" style="padding:8px 12px">Usuń</button></td>
  </tr>`).join('');
  document.querySelectorAll('[data-field]').forEach((el)=>el.addEventListener(el.type==='checkbox'?'change':'input', (e)=>{
    const item = menuItems.find((m)=>m.id === e.target.dataset.id); if(!item) return;
    const f = e.target.dataset.field;
    item[f] = e.target.type==='checkbox' ? e.target.checked : (['price','quantity'].includes(f) ? Number(e.target.value||0) : e.target.value);
  }));
  document.querySelectorAll('[data-delete]').forEach((btn)=>btn.addEventListener('click', async ()=>{ await deleteMenuItem(btn.dataset.delete); }));
  document.querySelectorAll('[data-file-image]').forEach((input)=>input.addEventListener('change', async (e)=>{
    const item = menuItems.find((m)=>m.id===e.target.dataset.fileImage); if(!item) return; const file = e.target.files?.[0]; if(!file) return; item.imageUrl = await fileToDataUrl(file); renderMenuEditor();
  }));
}

function renderOrders(){
  const body = $('ordersAdminBody'); if(!body) return;
  const list = ordersArray(orders);
  body.innerHTML = list.length ? list.map((order)=>`<tr><td><input type="checkbox"></td><td>${order.displayNumber || order.orderId}</td><td>${formatDateTime(order.createdAt)}</td><td>${order.customerName || '-'}</td><td>${order.customerPhone || '-'}</td><td>${orderSummary(order)}</td><td>${order.pickupLabel || '-'}</td><td>${badgeHtml(order.status)}</td><td><button class="btn btn-secondary" data-next="${order.orderId}" style="padding:8px 12px">➡</button></td><td><select class="select" data-status="${order.orderId}">${['oczekuje','potwierdzone','w realizacji','gotowe do odbioru','odebrane','anulowane'].map((s)=>`<option value="${s}" ${s===order.status?'selected':''}>${s}</option>`).join('')}</select></td><td>-</td></tr>`).join('') : `<tr><td colspan="11" class="small">Brak zamówień.</td></tr>`;
  body.querySelectorAll('[data-status]').forEach((el)=>el.addEventListener('change', ()=>updateOrderStatus(el.dataset.status, el.value)));
  body.querySelectorAll('[data-next]').forEach((el)=>el.addEventListener('click', ()=>{
    const flow = ['oczekuje','potwierdzone','w realizacji','gotowe do odbioru','odebrane','anulowane'];
    const order = list.find((o)=>o.orderId===el.dataset.next); if(!order) return; const idx = flow.indexOf(order.status); updateOrderStatus(order.orderId, flow[idx+1] || order.status);
  }));
  const sales = salesStats(list);
  if($('saveInfo')) $('saveInfo').textContent = `Zamówienia: ${list.length} • Utarg: ${sales.totalRevenue.toFixed(2)} zł`;
}

async function handleLogin(){
  await signInWithEmailAndPassword(auth, $('adminEmail').value.trim(), $('adminPassword').value.trim());
}

function bind(){
  document.querySelectorAll('[data-tab]').forEach((btn)=>btn.addEventListener('click', ()=>showTab(btn.dataset.tab)));
  $('loginBtn')?.addEventListener('click', ()=>handleLogin().catch((e)=>alert(e.message || String(e))));
  $('logoutBtn')?.addEventListener('click', ()=>signOut(auth));
  $('saveAllBtn')?.addEventListener('click', async ()=>{ settings = readForms(); await saveSettings(settings); for(const item of menuItems){ await upsertMenuItem(item.id, item); } $('saveInfo').textContent = 'Zapisano.'; });
  $('addMenuItemBtn')?.addEventListener('click', ()=>{
    const id = String(($('newMenuName').value || `produkt-${Date.now()}`)).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');
    menuItems.push({ id, name:$('newMenuName').value.trim() || 'Nowy produkt', description:$('newMenuDescription').value.trim(), price:Number($('newMenuPrice').value||0), quantity:Number($('newMenuQuantity').value||999), enabled:true, imageUrl:$('newMenuImage').value.trim(), sortOrder:Date.now(), category:'pizza' });
    renderMenuEditor();
  });
}

async function init(){
  await initAuthPersistence();
  bind();
  subscribeSettings((next)=>{ settings = next; applyTheme(settings); fillForms(); });
  import('./shared.js').then((m)=>m.subscribeMenu((rows)=>{ menuItems = rows; renderMenuEditor(); }));
  subscribeOrders((rows)=>{ orders = rows; renderOrders(); });
  onAuthStateChanged(auth, async (user)=>{
    const staff = user?.uid ? await getStaffDoc(user.uid) : null;
    const allowed = requireRole(staff, ['admin']);
    $('loginBox').classList.toggle('hidden', allowed);
    $('adminApp').classList.toggle('hidden', !allowed);
    $('adminStatus').textContent = allowed ? `Zalogowano: ${user.email}` : 'Admin nie jest zalogowany.';
  });
}

init().catch(console.error);
