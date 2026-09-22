(()=>{
  'use strict';

  const DISPLAY_VERSION='v5.15.1-stabilization';
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

  function cssEscape(value){return window.CSS?.escape?CSS.escape(String(value)):String(value).replace(/[^a-zA-Z0-9_-]/g,'\\$&')}
  function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

  function themeCssIssues(css){
    const raw=String(css||'').replace(/\/\*[\s\S]*?\*\//g,'');
    if(!raw.trim())return [];
    const issues=[];
    if(!raw.includes('{{scope}}'))issues.push('O CSS do tema não usa {{scope}}.');
    const headers=[...raw.matchAll(/([^{}]+)\{/g)].map(m=>m[1].trim()).filter(Boolean);
    for(const header of headers){
      if(header.startsWith('@'))continue;
      if(/^(from|to|\d+(?:\.\d+)?%)$/i.test(header))continue;
      const selectors=header.split(',').map(x=>x.trim()).filter(Boolean);
      for(const selector of selectors){
        if(!selector.includes('{{scope}}')){issues.push(`Seletor fora do escopo: ${selector.slice(0,100)}`);break;}
      }
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
      }catch(_){
        // O importador oficial continua responsável pelas demais validações e mensagens de formato.
      }
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

  function refresh(){syncDisplayedVersion();refreshMaterialRules();refreshTalentHints();wrapThemeImporter();contractCheck()}

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
