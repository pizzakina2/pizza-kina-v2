
import { subscribeSettings, subscribeOrders, applyTheme, bigScreenGroups, $ } from "./shared.js";
function renderGroup(nodeId, list){ $(nodeId).innerHTML = list.length ? list.map((order)=>`<div class="number-card">${order.shortNumber}</div>`).join("") : `<div class="small">Brak numerów.</div>`; }
function initPage(){ subscribeSettings((settings)=>applyTheme(settings)); subscribeOrders((ordersMap)=>{ const groups=bigScreenGroups(ordersMap); renderGroup("numbers-confirmed", groups.potwierdzone); renderGroup("numbers-progress", groups.realizacja); renderGroup("numbers-ready", groups.gotowe); }); }
initPage();
