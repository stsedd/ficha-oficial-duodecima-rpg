/* Duodécima · inventário v5.27 — apenas apresentação e preferências locais. */
(() => {
  'use strict';
  const activeKey = window.DUODECIMA_CHARACTER_STORAGE_KEY || 'duodecima_universal_stage4_v24';
  const prefix = 'duodecima_ui_inventory_v2_' + activeKey + '_';
  const read = key => { try { return localStorage.getItem(prefix + key); } catch (_) { return null; } };
  const write = (key,value) => { try { localStorage.setItem(prefix + key,String(value)); } catch (_) {} };
  const transientKey = prefix + 'notes_';
  const memory = new Map();

  function noteState(id) {
    if(memory.has(id)) return memory.get(id);
    try { return sessionStorage.getItem(transientKey + id) === '1'; } catch (_) { return false; }
  }
  function saveNoteState(id,open) {
    memory.set(id,open);
    try { sessionStorage.setItem(transientKey + id,open ? '1' : '0'); } catch (_) {}
  }

  function makeHelp(pane) {
    const bar = pane.querySelector('.inventory-toolbar-card');
    const ledger = pane.querySelector('.inventory-ledger');
    if(!bar || !ledger || bar.querySelector('.inventory-help-inline')) return;
    const cards = ledger.querySelectorAll(':scope > article');
    if(cards.length < 2) return;
    const note = cards[1].querySelector('label:has(#inventoryNotes)');
    const description = cards[1].querySelector('p.muted');
    const help = document.createElement('div');
    help.className = 'inventory-help-inline';
    const details = document.createElement('details');
    details.className = 'inventory-help-details';
    const title = document.createElement('summary');
    title.textContent = 'Ajuda e notas gerais';
    const inner = document.createElement('div');
    inner.className = 'inventory-help-content';
    if(description) inner.append(description);
    if(note) inner.append(note);
    details.append(title,inner);
    help.append(details);
    bar.append(help);
  }

  function compactEquipment(pane,kind,title) {
    const card = pane.querySelector('#' + kind + 'Editor');
    if(!card) return;
    const header = card.querySelector(':scope > .row.between');
    if(!header || header.querySelector('.equipment-collapse')) return;
    const checkbox = card.querySelector('#' + kind + 'Equipped');
    const name = card.querySelector('#' + kind + 'Name');
    const image = card.querySelector('.inventory-image-preview img');
    const defaultName = kind === 'shield' ? 'Escudo' : 'Armadura';
    const unused = !checkbox?.checked && (!name || name.value.trim() === defaultName) && !image;
    const storageName = 'collapsed_' + kind;
    const saved = read(storageName);
    let collapsed = saved === null ? unused : saved === '1';
    const label = document.createElement('span');
    label.className = 'equipment-compact-summary';
    label.textContent = checkbox?.checked ? 'Equipado' : 'Não equipado';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'equipment-collapse ghost';
    toggle.setAttribute('aria-controls',kind + 'Editor');
    function show(){
      card.classList.toggle('is-collapsed',collapsed);
      card.dataset.collapsed = String(collapsed);
      toggle.textContent = collapsed ? 'Mostrar ' + title : 'Recolher';
      toggle.setAttribute('aria-expanded',String(!collapsed));
    }
    toggle.addEventListener('click', () => {
      collapsed = !collapsed;
      write(storageName,collapsed ? '1' : '0');
      show();
    });
    header.append(label,toggle);
    show();
  }

  function compactWeapon(card) {
    if(card.querySelector('.weapon-notes-details')) return;
    const area = card.querySelector('textarea[data-weapon-field$=":notes"]');
    if(!area) return;
    const label = area.closest('label');
    if(!label) return;
    const id = card.dataset.weaponCard || '';
    const value = String(area.value || '').trim();
    const details = document.createElement('details');
    details.className = 'weapon-notes-details';
    details.open = noteState(id);
    const summary = document.createElement('summary');
    const title = document.createElement('span');
    title.textContent = value ? 'Descrição e observações' : 'Adicionar descrição';
    summary.appendChild(title);
    if(value){
      const preview = document.createElement('small');
      preview.textContent = value.replace(/\s+/g,' ').slice(0,85) + (value.length > 85 ? '…' : '');
      preview.className = 'weapon-notes-preview';
      summary.append(preview);
    }
    label.before(details);
    details.append(summary,label);
    details.addEventListener('toggle',()=>saveNoteState(id,details.open));
  }

  function refine(){
    const pane = document.querySelector('#sheetView [data-pane="inventory"]');
    if(!pane) return;
    makeHelp(pane);
    compactEquipment(pane,'armor','armadura');
    compactEquipment(pane,'shield','escudo');
    pane.querySelectorAll('.weapon-card[data-weapon-card]').forEach(compactWeapon);
  }
  let scheduled=false;
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;refine()});
  }
  function init(){
    const root = document.getElementById('sheetView');
    if(!root) return;
    // renderSheet substitui o conteúdo inteiro; não é necessário observar cada campo do documento.
    new MutationObserver(schedule).observe(root,{childList:true});
    schedule();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
