import { subscribeSettings, subscribeOrders, applyTheme, $, bigScreenGroups } from './shared.js';
function renderBox(id,list){ const node=$(id); if(!node) return; node.innerHTML = (list||[]).map((o)=>`<div class="number-pill">${o.displayNumber||o.orderId}</div>`).join('') || `<div class="small">Brak</div>`; }
subscribeSettings((next)=>applyTheme(next));
subscribeOrders((rows)=>{ const groups=bigScreenGroups(rows); renderBox('numbers-confirmed', groups.potwierdzone); renderBox('numbers-progress', groups.realizacja); renderBox('numbers-ready', groups.gotowe); });
