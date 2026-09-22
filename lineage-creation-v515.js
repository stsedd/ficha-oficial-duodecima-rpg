(()=>{
  'use strict';

  const STORAGE_KEY='duodecima_universal_stage4_v24';
  const ATTR_LABEL={for:'Força',des:'Destreza',con:'Constituição',int:'Inteligência',fe:'Fé',car:'Carisma'};
  let originals=new Map();
  let appliedRuntimeSignature='';
  let reloadScheduled=false;

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uniq=arr=>[...new Set((arr||[]).filter(Boolean))];
  const originKey=data=>`${data?.godId||''}|${data?.lineage?.secondaryGodId||''}`;
  const runtimeSignature=data=>[
    data?.lineage?.type||'normal',
    data?.godId||'',
    data?.lineage?.secondaryGodId||'',
    data?.lineage?.structureGodId||'',
    data?.lineage?.compoundChoiceOrigins||'',
    data?.lineage?.compoundAttributePlus2||'',
    data?.lineage?.compoundAttributePlus1||'',
    data?.lineage?.compoundSkillChoice||''
  ].join('|');

  function readState(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch(_){return null}
  }
  function writeState(data){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true}catch(_){return false}
  }
  function godById(id){return (window.DUODECIMA_GODS||[]).find(g=>g.id===id)||null}
  function original(id){return originals.get(id)||null}

  function captureOriginals(){
    originals=new Map((window.DUODECIMA_GODS||[]).map(g=>[g.id,{
      hpBase:Number(g.hpBase||0),hpPerDecade:Number(g.hpPerDecade||0),
      bonuses:{...(g.bonuses||{})},grantedSkills:[...(g.grantedSkills||[])],skillChoice:[...(g.skillChoice||[])]
    }]));
  }

  function restoreGod(id){
    const g=godById(id),src=original(id);if(!g||!src)return;
    g.hpBase=src.hpBase;g.hpPerDecade=src.hpPerDecade;g.bonuses={...src.bonuses};g.grantedSkills=[...src.grantedSkills];g.skillChoice=[...src.skillChoice];
  }
  function restoreAllGods(){for(const id of originals.keys())restoreGod(id)}

  function attributeOptions(mainId,subId,value){
    const rows=[];
    for(const id of [mainId,subId]){
      const src=original(id),g=godById(id);if(!src||!g)continue;
      for(const [attr,bonus] of Object.entries(src.bonuses||{}))if(Number(bonus)===Number(value))rows.push({value:attr,label:`${g.name} · ${ATTR_LABEL[attr]||attr.toUpperCase()} +${value}`});
    }
    return rows;
  }
  function skillOptions(mainId,subId){
    const rows=[];
    for(const id of [mainId,subId]){
      const src=original(id),g=godById(id);if(!src||!g)continue;
      for(const skill of uniq([...(src.grantedSkills||[]),...(src.skillChoice||[])]))rows.push({value:skill,label:`${g.name} · ${skill}`});
    }
    const seen=new Set();return rows.filter(r=>{const k=r.value.toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
  }
  function isValid(value,rows){return !!value&&rows.some(r=>r.value===value)}

  function normalizeDirectState(data){
    if(!data?.lineage||data.lineage.type!=='direct')return false;
    if(data.lineage.structureGodId===data.godId)return false;
    data.lineage.structureGodId=data.godId;
    return true;
  }

  function applyCompoundData(data){
    if(!data?.lineage||data.lineage.type!=='compound')return;
    const main=godById(data.godId),sub=godById(data.lineage.secondaryGodId),a=original(data.godId),b=original(data.lineage.secondaryGodId);
    if(!main||!sub||!a||!b)return;

    const plus2=attributeOptions(data.godId,data.lineage.secondaryGodId,2);
    const plus1=attributeOptions(data.godId,data.lineage.secondaryGodId,1);
    const skills=skillOptions(data.godId,data.lineage.secondaryGodId);
    const sameOrigins=data.lineage.compoundChoiceOrigins===originKey(data);
    const pick2=sameOrigins?(data.lineage.compoundAttributePlus2||''):'';
    const pick1=sameOrigins?(data.lineage.compoundAttributePlus1||''):'';
    const pickSkill=sameOrigins?(data.lineage.compoundSkillChoice||''):'';

    main.hpBase=Math.min(Number(a.hpBase)||0,Number(b.hpBase)||0);
    // O Core define o menor HP inicial; a progressão por década segue o deus principal.
    main.hpPerDecade=Number(a.hpPerDecade)||0;
    main.bonuses={};
    if(isValid(pick2,plus2))main.bonuses[pick2]=(main.bonuses[pick2]||0)+2;
    if(isValid(pick1,plus1))main.bonuses[pick1]=(main.bonuses[pick1]||0)+1;
    main.grantedSkills=isValid(pickSkill,skills)?[pickSkill]:[];
    main.skillChoice=[];
  }

  function applyRuntimeLineage(data){
    restoreAllGods();
    if(data?.lineage?.type==='compound')applyCompoundData(data);
    appliedRuntimeSignature=runtimeSignature(data);
  }

  function preboot(){
    captureOriginals();
    const data=readState();
    if(!data){appliedRuntimeSignature=runtimeSignature(null);return;}
    let changed=normalizeDirectState(data);
    if(data.lineage?.type==='compound'&&data.divineSkillChoice){data.divineSkillChoice='';changed=true}
    applyRuntimeLineage(data);
    if(changed){writeState(data);appliedRuntimeSignature=runtimeSignature(data)}
  }

  function checkRuntimeSignature(){
    if(reloadScheduled)return;
    const current=runtimeSignature(readState());
    if(current===appliedRuntimeSignature)return;
    reloadScheduled=true;
    // Importar, resetar ou substituir a origem pode trocar o personagem sem reiniciar a aba.
    // Como o Legado Composto recompõe os dados canônicos do deus em memória, um reload curto
    // garante que a nova ficha sempre parta dos valores originais do Core antes de aplicar seu Legado.
    setTimeout(()=>location.reload(),0);
  }

  function observeRuntimeLifecycle(){
    let queued=false;
    const scheduleCheck=()=>{
      if(queued||reloadScheduled)return;
      queued=true;
      queueMicrotask(()=>{queued=false;checkRuntimeSignature()});
    };
    const root=document.querySelector('main')||document.body;
    if(root)new MutationObserver(scheduleCheck).observe(root,{childList:true,subtree:true});
    document.addEventListener('change',event=>{
      if(event.target?.id==='importInput')setTimeout(checkRuntimeSignature,0);
    });
    document.addEventListener('click',event=>{
      if(event.target?.closest?.('#resetBtn'))setTimeout(checkRuntimeSignature,0);
    });
  }

  function installStyles(){
    if(document.querySelector('#lineage-v515-styles'))return;
    const style=document.createElement('style');style.id='lineage-v515-styles';style.textContent=`
      .lineage-core-creation{margin-top:12px;padding:14px;border:1px solid var(--line);border-radius:10px;background:linear-gradient(145deg,color-mix(in srgb,var(--panel) 94%,var(--accent) 6%),var(--panel));}
      .lineage-core-creation .lineage-core-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}
      .lineage-core-creation .lineage-core-head h4{margin:2px 0 0;font:700 17px/1.1 var(--serif)}
      .lineage-core-creation .lineage-core-head small{color:var(--muted)}
      .lineage-core-creation .lineage-core-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .lineage-core-creation label{min-width:0}.lineage-core-creation select{width:100%}
      .lineage-core-creation .lineage-core-hp{margin:10px 0;padding:9px 10px;border-left:3px solid var(--accent);background:color-mix(in srgb,var(--accent) 7%,transparent)}
      .lineage-core-creation .lineage-core-actions{display:flex;align-items:center;gap:10px;justify-content:flex-end;margin-top:10px}
      .lineage-core-creation .lineage-core-status{margin-right:auto;color:var(--muted);font-size:12px}
      .lineage-core-creation.is-complete .lineage-core-status{color:var(--good,#5aa879)}
      .lineage-direct-core-note{margin-top:10px!important}
      @media(max-width:850px){.lineage-core-creation .lineage-core-fields{grid-template-columns:1fr}}
    `;document.head.appendChild(style);
  }

  function optionsHTML(rows,current,placeholder){return `<option value="">${esc(placeholder)}</option>${rows.map(r=>`<option value="${esc(r.value)}" ${r.value===current?'selected':''}>${esc(r.label)}</option>`).join('')}`}

  function disableFinishUntilComplete(view,complete){
    const finish=view.querySelector('#finishBtn');
    if(finish&&!complete){finish.disabled=true;finish.title='Defina o +2, o +1 e a perícia do Legado Composto.'}
  }

  function decorateCreation(){
    const view=document.querySelector('#creationView');if(!view||view.classList.contains('hidden'))return;
    const data=readState();if(!data?.lineage)return;
    const box=view.querySelector('.legacy-creation-box');if(!box)return;

    const type=data.lineage.type||'normal';
    if(type==='direct'){
      box.querySelector('.lineage-core-creation')?.remove();
      const structure=view.querySelector('#creationStructureGod');
      if(structure){const label=structure.closest('label');if(label)label.style.display='none'}
      const signature=`direct|${data.godId}|${data.lineage.secondaryGodId||''}`;
      let note=box.querySelector('.lineage-direct-core-note');
      if(note?.dataset.signature===signature)return;
      note?.remove();
      note=document.createElement('div');note.className='notice lineage-direct-core-note';note.dataset.signature=signature;
      note.innerHTML='<b>Bônus iniciais do Legado Direto:</b> HP inicial, bônus de atributos e perícia seguem sempre o <b>deus principal</b>. A segunda origem continua sendo usada para a composição do kit de habilidades.';
      box.appendChild(note);
      return;
    }

    box.querySelector('.lineage-direct-core-note')?.remove();
    if(type!=='compound'){box.querySelector('.lineage-core-creation')?.remove();return;}

    const main=godById(data.godId),sub=godById(data.lineage.secondaryGodId),a=original(data.godId),b=original(data.lineage.secondaryGodId);
    if(!main||!sub||!a||!b)return;
    const plus2=attributeOptions(data.godId,data.lineage.secondaryGodId,2),plus1=attributeOptions(data.godId,data.lineage.secondaryGodId,1),skills=skillOptions(data.godId,data.lineage.secondaryGodId);
    const sameOrigins=data.lineage.compoundChoiceOrigins===originKey(data);
    const pick2=sameOrigins?(data.lineage.compoundAttributePlus2||''):'',pick1=sameOrigins?(data.lineage.compoundAttributePlus1||''):'',pickSkill=sameOrigins?(data.lineage.compoundSkillChoice||''):'';
    const complete=sameOrigins&&isValid(pick2,plus2)&&isValid(pick1,plus1)&&isValid(pickSkill,skills);
    const hp=Math.min(Number(a.hpBase)||0,Number(b.hpBase)||0);
    const signature=['compound',data.godId,data.lineage.secondaryGodId||'',pick2,pick1,pickSkill,complete?'1':'0'].join('|');
    const existing=box.querySelector('.lineage-core-creation');
    if(existing?.dataset.signature===signature){disableFinishUntilComplete(view,complete);return;}
    existing?.remove();

    const panel=document.createElement('section');panel.className=`lineage-core-creation${complete?' is-complete':''}`;panel.dataset.signature=signature;panel.innerHTML=`
      <div class="lineage-core-head"><div><span class="label">BÔNUS INICIAIS · CORE</span><h4>Escolhas do Legado Composto</h4></div><small>Não soma os dois kits</small></div>
      <div class="lineage-core-hp"><b>HP inicial:</b> ${hp} + CON — menor valor entre ${esc(main.name)} e ${esc(sub.name)}.</div>
      <div class="lineage-core-fields">
        <label><span class="label">Escolha o +2</span><select id="compoundPlus2Core">${optionsHTML(plus2,pick2,'Selecione um bônus de +2…')}</select></label>
        <label><span class="label">Escolha o +1</span><select id="compoundPlus1Core">${optionsHTML(plus1,pick1,'Selecione um bônus de +1…')}</select></label>
        <label><span class="label">Perícia divina</span><select id="compoundSkillCore">${optionsHTML(skills,pickSkill,'Selecione uma perícia…')}</select></label>
      </div>
      <div class="lineage-core-actions"><span class="lineage-core-status">${complete?'Escolhas aplicadas à ficha.':'Faça as três escolhas antes de concluir a criação.'}</span><button type="button" class="primary" id="applyCompoundCore">Aplicar escolhas</button></div>`;
    box.appendChild(panel);
    disableFinishUntilComplete(view,complete);

    panel.querySelector('#applyCompoundCore')?.addEventListener('click',()=>{
      const now=readState();if(!now?.lineage)return;
      const v2=panel.querySelector('#compoundPlus2Core')?.value||'',v1=panel.querySelector('#compoundPlus1Core')?.value||'',vs=panel.querySelector('#compoundSkillCore')?.value||'';
      if(!isValid(v2,plus2)||!isValid(v1,plus1)||!isValid(vs,skills)){
        const status=panel.querySelector('.lineage-core-status');if(status)status.textContent='Selecione uma opção válida nos três campos.';return;
      }
      now.lineage.compoundAttributePlus2=v2;now.lineage.compoundAttributePlus1=v1;now.lineage.compoundSkillChoice=vs;now.lineage.compoundChoiceOrigins=originKey(now);now.divineSkillChoice='';
      // Se a perícia antes escolhida como comum agora virou divina, libera a vaga correspondente.
      now.initialSkills=(now.initialSkills||[]).filter(s=>s!==vs);
      if(writeState(now))location.reload();
    });
  }

  function observeCreation(){
    installStyles();
    const view=document.querySelector('#creationView');if(!view)return;
    let queued=false;const run=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;decorateCreation()})};
    new MutationObserver(run).observe(view,{childList:true,subtree:true});
    view.addEventListener('change',event=>{
      const id=event.target?.id;
      if(!['godSelect','creationLineageType','creationSecondaryGod'].includes(id))return;
      // O app base salva a troca e re-renderiza de forma síncrona. Recarregar logo depois
      // garante que HP, bônus e perícias sejam reconstruídos a partir das novas origens.
      setTimeout(()=>location.reload(),0);
    });
    run();
  }

  async function init(){
    try{await window.DUODECIMA_CORE_READY}catch(_){ }
    preboot();
    observeRuntimeLifecycle();
    observeCreation();
  }

  window.DUODECIMA_LINEAGE_CREATION_READY=init();
})();
