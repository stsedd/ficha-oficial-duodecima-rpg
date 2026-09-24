(()=>{
  'use strict';

  const DISPLAY_VERSION='v5.15.3-magic-sacrifice';
  const materialRules=()=>new Map((window.DUODECIMA_SYSTEM?.materials||[]).map(x=>[x.id,x.targeting?.ruleText||'']));

  function installStyles(){
    if(document.querySelector('#stabilization-v516-styles'))return;
    const style=document.createElement('style');
    style.id='stabilization-v516-styles';
    style.textContent=`
      .core-material-rule{margin-top:8px;padding:8px 10px;border-left:3px solid var(--accent);border-radius:6px;background:color-mix(in srgb,var(--accent) 8%,transparent);font-size:12px;line-height:1.4}
      .core-material-rule b{display:block;margin-bottom:2px}
      .talent-stacking-hint{display:block;margin-top:6px;color:var(--muted);font-size:11px;line-height:1.35}
      .stabilization-toast{position:fixed;z-index:99999;right:18px;bottom:18px;max-width:min(440px,calc(100vw - 36px));padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--panel,#111);color:var(--text,#fff);box-shadow:0 18px 50px #0008;font:600 12px/1.45 system-ui,sans-serif}
      .magic-sac-row.magic-sacrifice-ux{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:13px 14px;border-color:color-mix(in srgb,var(--accent) 24%,var(--line));background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 5%,transparent),transparent 62%)}
      .magic-sac-row.magic-sacrifice-ux>.row{display:grid;grid-template-columns:34px minmax(42px,auto) 34px;align-items:center;gap:6px}
      .magic-sac-row.magic-sacrifice-ux>.row button{width:34px;height:34px;padding:0;display:grid;place-items:center;border-radius:9px;font-size:20px;font-weight:800;line-height:1}
      .magic-sac-row.magic-sacrifice-ux>.row button:first-child:not(:disabled){border-color:color-mix(in srgb,var(--accent) 66%,var(--line));background:color-mix(in srgb,var(--accent) 13%,transparent)}
      .magic-sac-row.magic-sacrifice-ux>.row strong{min-width:42px;text-align:center;font-size:20px;line-height:1;position:relative;padding-bottom:11px}
      .magic-sac-row.magic-sacrifice-ux>.row strong:after{content:'FINAL';position:absolute;left:50%;bottom:0;transform:translateX(-50%);font-size:7px;letter-spacing:.12em;color:var(--muted);font-weight:800}
      .magic-sacrifice-help{margin-top:10px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--accent) 22%,var(--line));border-radius:9px;background:color-mix(in srgb,var(--accent) 5%,transparent);font-size:11px;line-height:1.45;color:var(--muted)}
      .magic-sacrifice-help b{color:var(--text)}
      @media(max-width:640px){.magic-sac-row.magic-sacrifice-ux{grid-template-columns:1fr}.magic-sac-row.magic-sacrifice-ux>.row{justify-self:start}}
    `;
    document.head.appendChild(style);
  }

  function showNotice(message){
    document.querySelector('.stabilization-toast')?.remove();
    const toast=document.createElement('div');
    toast.className='stabilization-toast';toast.setAttribute('role','status');toast.textContent=message;
    document.body.appendChild(toast);setTimeout(()=>toast.remove(),4200);
  }

  function syncDisplayedVersion(){
    if(/v\d+\.\d+(?:\.\d+)?(?:[-\w.]*)?/i.test(document.title))document.title=document.title.replace(/v\d+\.\d+(?:\.\d+)?(?:[-\w.]*)?/i,DISPLAY_VERSION);
    const chip=document.querySelector('.version-chip');if(chip)chip.textContent=DISPLAY_VERSION;
    document.querySelectorAll('footer p').forEach(p=>{if(/v\d+\.\d+/i.test(p.textContent||''))p.textContent=(p.textContent||'').replace(/v\d+\.\d+(?:\.\d+)?(?:[-\w.]*)?/i,DISPLAY_VERSION)});
  }

  function closestEquipmentCard(el){return el?.closest?.('.weapon-card,.equipment-editor-card,[data-theme-component="equipment-card"],article.card,article')||null}
  function refreshMaterialRules(){
    const rules=materialRules();
    const entries=[];
    document.querySelectorAll('[data-weapon-field$=":material"]').forEach(select=>entries.push([select,select.value]));
    const armor=document.querySelector('#armorMaterial');if(armor)entries.push([armor,armor.value]);
    const shield=document.querySelector('#shieldMaterial');if(shield)entries.push([shield,shield.value]);
    for(const [select,id] of entries){
      const card=closestEquipmentCard(select);if(!card)continue;
      const old=card.querySelector(':scope > .core-material-rule');
      const text=String(rules.get(id)||'').trim();
      const restricted=text&&!/^Sem restrição especial/i.test(text);
      if(!restricted){old?.remove();continue;}
      const box=old||document.createElement('div');box.className='core-material-rule';
      box.innerHTML=`<b>Regra do material · Core</b>${escapeHtml(text)}`;
      if(!old)card.appendChild(box);
    }
  }

  function stackingLabel(mode){
    return ({
      unique:'Único: só pode ser adquirido uma vez.',
      additive:'Acumulativo: cada aquisição reaplica e acumula o efeito descrito.',
      parameterized:'Parametrizado: repetições devem representar novas escolhas; repetir a mesma escolha não gera benefício adicional salvo texto explícito.',
      'non-cumulative-repeat':'Repetível sem acúmulo: repetir uma escolha idêntica não aumenta o efeito. Confira antes de gastar outro talento.'
    })[mode]||'';
  }
  function refreshTalentHints(){
    const talents=window.DUODECIMA_TALENTS||[];
    for(const t of talents){
      const mode=t.stacking?.mode;if(!mode)continue;
      const selectors=[`[data-talent-id="${cssEscape(t.id)}"]`,`[data-talent="${cssEscape(t.id)}"]`,`[data-talent-card="${cssEscape(t.id)}"]`];
      document.querySelectorAll(selectors.join(',')).forEach(card=>{
        if(card.querySelector(':scope > .talent-stacking-hint'))return;
        const hint=document.createElement('small');hint.className='talent-stacking-hint';hint.textContent=stackingLabel(mode);card.appendChild(hint);
      });
    }
  }

  function sacrificeRowState(row){
    const text=row.querySelector('small')?.textContent||'';
    const spent=text.match(/sacrif[ií]cio\s*[−-]\s*(\d+)/i);
    const final=text.match(/final\s*([−-]?\d+)/i);
    return {spent:Number(spent?.[1]||0),final:final?Number(final[1].replace('−','-')):null};
  }
  function refreshMagicSacrificeUX(){
    const rows=[...document.querySelectorAll('.magic-sac-row')];
    if(!rows.length)return;
    const max=Math.max(1,Number(window.DUODECIMA_MAGIC?.maxSacrifices||3));
    const energy=Math.max(0,Number(window.DUODECIMA_MAGIC?.sacrificeEnergyEach||25));
    const states=rows.map(row=>[row,sacrificeRowState(row)]);
    const total=states.reduce((sum,[,s])=>sum+s.spent,0);
    for(const [row,s] of states){
      row.classList.add('magic-sacrifice-ux');
      const buttons=[...row.querySelectorAll('button[data-magic-sac]')];
      const reduce=buttons.find(b=>/:1$/.test(b.dataset.magicSac||''));
      const restore=buttons.find(b=>/:-1$/.test(b.dataset.magicSac||''));
      const controls=reduce?.parentElement||restore?.parentElement;
      if(!reduce||!restore||!controls)continue;
      if(controls.firstElementChild!==reduce){controls.insertBefore(reduce,controls.firstElementChild);controls.appendChild(restore);}
      if(reduce.textContent!=='−')reduce.textContent='−';
      if(restore.textContent!=='+')restore.textContent='+';
      reduce.disabled=total>=max||s.spent>=max;
      restore.disabled=s.spent<=0;
      const attr=row.querySelector('b')?.textContent?.trim()||'atributo';
      reduce.title=`Retirar 1 ponto de ${attr} e ganhar +${energy} Energia máxima`;
      restore.title=`Restaurar 1 ponto de ${attr} e remover ${energy} Energia máxima`;
      reduce.setAttribute('aria-label',`Diminuir ${attr} em 1 para ganhar Energia`);
      restore.setAttribute('aria-label',`Aumentar ${attr} em 1, desfazendo o sacrifício`);
      const value=controls.querySelector('strong');
      if(value&&s.final!==null&&value.textContent!==String(s.final))value.textContent=String(s.final);
    }
    const card=rows[0].closest('.card');
    if(!card)return;
    const eyebrow=card.querySelector('.eyebrow');if(eyebrow&&eyebrow.textContent!=='CONVERSÃO NO DESPERTAR')eyebrow.textContent='CONVERSÃO NO DESPERTAR';
    const title=card.querySelector('h2');if(title&&title.textContent!=='Atributos físicos → Energia')title.textContent='Atributos físicos → Energia';
    const desc=card.querySelector('p.muted.compact');
    const copy=`Use <b>−</b> para retirar um ponto de FOR, DES ou CON e receber <b>+${energy} de Energia máxima</b>. Use <b>+</b> para desfazer a troca. São até ${max} pontos no total; o atributo pode ficar negativo e bônus divinos não entram nessa conversão.`;
    if(desc&&desc.dataset.magicSacCopy!=='1'){desc.innerHTML=copy;desc.dataset.magicSacCopy='1';}
    if(!card.querySelector('.magic-sacrifice-help')){
      const help=document.createElement('div');help.className='magic-sacrifice-help';
      help.innerHTML='<b>Leitura dos controles:</b> o número no centro é o atributo final. O botão − reduz o atributo e aumenta a Energia; o botão + restaura o atributo.';
      rows.at(-1)?.after(help);
    }
  }

  function cssEscape(value){return window.CSS?.escape?CSS.escape(String(value)):String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&')}
  function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function themeCssIssues(css){
    const raw=String(css||'').replace(/\/\*[\s\S]*?\*\//g,'');
    if(!raw.trim())return [];
    const issues=[];
    const scopeToken='__DUODECIMA_SCOPE__';
    if(!raw.includes('{{scope}}'))issues.push('O CSS do tema não usa {{scope}}.');
    const normalized=raw.replace(/\{\{scope\}\}/g,scopeToken);
    const headers=[...normalized.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim()).filter(Boolean);
    for(const header of headers){
      if(header.startsWith('@'))continue;
      if(/^(from|to|\d+(?:\.\d+)?%)$/i.test(header))continue;
      const selectors=header.split(',').map(x=>x.trim()).filter(Boolean);
      for(const selector of selectors){if(!selector.includes(scopeToken)){issues.push(`Seletor fora do escopo: ${selector.slice(0,100)}`);break;}}
      if(issues.length>4)break;
    }
    return issues;
  }

  function wrapThemeImporter(){
    const input=document.querySelector('#exclusiveThemeInput');
    if(!input||input.dataset.scopeValidator==='1')return;
    const original=input.onchange;if(typeof original!=='function')return;
    input.dataset.scopeValidator='1';
    input.onchange=async event=>{
      const file=event.target?.files?.[0];
      if(!file)return original.call(input,event);
      try{
        const raw=await file.text();const parsed=JSON.parse(raw);
        const issues=themeCssIssues(parsed?.css);
        if(issues.length){
          event.target.value='';
          console.warn('[Tema exclusivo] CSS rejeitado:',issues);
          showNotice(`Tema não instalado: o CSS precisa permanecer dentro de {{scope}}. ${issues[0]}`);
          return;
        }
      }catch(_){ }
      return original.call(input,event);
    };
  }

  function contractCheck(){
    const core=window.DUODECIMA_SYSTEM;
    if(!core?.attributes||!core?.levels)return;
    window.DUODECIMA_CREATION_CONTRACT={
      startingPoints:core.attributes.startingPoints,
      normalAttributeMax:core.attributes.normalMax,
      minLevel:core.levels.min,
      maxLevel:core.levels.max,
      coreVersion:window.DUODECIMA_CORE_STATE?.version||'fallback'
    };
  }

  function refresh(){syncDisplayedVersion();refreshMaterialRules();refreshTalentHints();refreshMagicSacrificeUX();wrapThemeImporter();contractCheck()}

  async function init(){
    installStyles();refresh();
    const root=document.querySelector('#sheetView')||document.body;
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;refresh()});
    }).observe(root,{childList:true,subtree:true});
  }

  window.DUODECIMA_STABILIZATION_READY=init();
})();
