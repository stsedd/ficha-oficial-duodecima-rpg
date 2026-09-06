(()=>{
  const DEFAULT_CORE='https://stsedd.github.io/duodecima-core';
  const CORE_BASE=(window.DUODECIMA_CORE_BASE_OVERRIDE||DEFAULT_CORE).replace(/\/$/,'');
  const state={status:'loading',source:'fallback',version:null,error:null,baseUrl:CORE_BASE};
  window.DUODECIMA_CORE_STATE=state;

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const signed=n=>Number(n)>0?`+${n}`:`${n}`;
  const joinHuman=(arr=[])=>arr.length<=1?(arr[0]||''):arr.length===2?`${arr[0]} e ${arr[1]}`:`${arr.slice(0,-1).join(', ')} e ${arr.at(-1)}`;
  const guideSlug={marte:'marte-ultor',juno:'juno-mater'};
  const coreIdFromGuideSlug=slug=>slug==='marte-ultor'?'marte':slug==='juno-mater'?'juno':slug;
  const slugFor=d=>guideSlug[d.id]||d.id;

  async function getJSON(url){
    const r=await fetch(url+(url.includes('?')?'&':'?')+'_='+Date.now(),{cache:'no-store'});
    if(!r.ok) throw new Error(`${r.status} ${r.statusText} · ${url}`);
    return r.json();
  }
  async function loadCore(){
    const manifest=await getJSON(`${CORE_BASE}/manifest.json`);
    const pairs=await Promise.all(Object.entries(manifest.files).map(async([key,path])=>[key,await getJSON(`${CORE_BASE}/${path}`)]));
    return {manifest,...Object.fromEntries(pairs)};
  }
  function rootFor(page){const box=document.createElement('div');box.innerHTML=window.GUIA_CONTENT[page].html;return box;}
  function saveRoot(page,box){window.GUIA_CONTENT[page].html=box.innerHTML;}
  function sectionHead(kicker,title,badge,banner=false){return `${banner?'<div class="banner-strip"></div>':''}<div class="section-head"><div><small>${kicker}</small><h2>${title}</h2></div><span>${badge}</span></div>`;}
  function attrName(id,core){return core.attributes.attributes.find(a=>a.id===id)?.name||id.toUpperCase();}
  function skillName(id,core){return core.skills.skills.find(s=>s.id===id)?.name||id;}

  function patchAttributes(box,core){
    const sec=box.querySelector('#criacao'); if(!sec)return;
    const sys=core.system.attributes;
    sec.innerHTML=sectionHead('MECÂNICAS · I','Atributos','BASE',true)+`
      <article class="paper-card feature"><h3>Distribuição inicial</h3><p>O personagem ganha <strong>${sys.startingPoints} pontos</strong> para distribuir entre os seis atributos, até o máximo normal de <strong>${sys.normalMax} em cada</strong>. Bênçãos de heróis míticos podem ultrapassar esse limite.</p><p>Nos níveis <strong>${sys.increaseLevels.join(', ')}</strong>, recebe +1 ponto de atributo para distribuir.</p></article>
      <div class="attr-grid">${core.attributes.attributes.map(a=>`<article class="tone-${a.id}"><span>${esc(a.abbr)}</span><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p></article>`).join('')}</div>
      <article class="paper-card"><h3>Bonificação divina</h3><p>O parentesco divino pode conceder bônus de atributos e perícias próprias. Esses benefícios são lidos diretamente do kit de cada deus no Duodécima Core.</p></article>`;
  }
  function patchResources(box,core){
    const sec=box.querySelector('#recursos'); if(!sec)return;
    const r=core.system.resources, en=r.energy, san=r.sanity;
    sec.innerHTML=sectionHead('MECÂNICAS · II','Status','VITAL',true)+`
      <div class="resource-grid">
        <article class="resource hp"><span>♥</span><h3>HP / Vitalidade</h3><p>O valor inicial e a progressão dependem do deus. Consulte o kit correspondente para os valores canônicos.</p><div class="formula">Constituição se aplica conforme o kit</div></article>
        <article class="resource sanity"><span>◎</span><h3>Sanidade</h3><p>Todos começam com <strong>${san.base} pontos</strong>. Ela mede estabilidade psicológica e recebe penalidades conforme diminui.</p><div class="formula">${san.base} → ${esc(san.states[0]?.name||'Estável')}</div><div class="formula">0 → ${esc(san.states.at(-1)?.name||'Louco')}</div></article>
        <article class="resource energy"><span>ϟ</span><h3>Energia</h3><p>Começa em <strong>${en.base}</strong> e recebe <strong>+${en.increment} a cada ${en.everyLevels} níveis</strong>.</p><div class="formula">${Math.round(en.lowThresholdRatio*100)}% ou menos</div><p class="rule-line">${signed(en.lowPenaltyD20)} em rolagens de d20.</p><div class="formula">0 Energia</div><p class="rule-line">${esc(en.atZero)}.</p></article>
      </div>
      <article class="paper-card"><h3>Estados de Sanidade</h3><div class="table-wrap"><table><thead><tr><th>Pontos</th><th>Estado</th><th>Efeito</th></tr></thead><tbody>${san.states.map(x=>`<tr><td>${x.max===x.min?x.min:`${x.max}–${x.min}`}</td><td>${esc(x.name)}</td><td>${esc(x.effect)}</td></tr>`).join('')}</tbody></table></div></article>`;
  }
  function patchRest(box,core){
    const sec=box.querySelector('#descanso'); if(!sec)return;
    const r=core.system.rests;
    sec.innerHTML=sectionHead('MECÂNICAS · III','Descanso','RECUPERAÇÃO')+`<div class="grid two">
      <article class="paper-card feature"><span class="label">DESCANSO CURTO</span><h3>${esc(r.short.minimum)}</h3><p>Recupera <strong>${esc(r.short.hp)} HP</strong> e <strong>${esc(r.short.energy)} Energia</strong>.</p><p>${esc(r.short.refreshLimitedAbilities)}.</p></article>
      <article class="paper-card feature"><span class="label purple">DESCANSO LONGO</span><h3>${esc(r.long.minimum)}</h3><p>HP: <strong>${esc(r.long.hp)}</strong> · Energia: <strong>${esc(r.long.energy)}</strong>.</p><p>${esc(r.long.note)}</p></article></div>`;
  }
  function patchSkills(box,core){
    const sec=box.querySelector('#pericias'); if(!sec)return;
    const s=core.system.skills;
    sec.innerHTML=sectionHead('MECÂNICAS · IV','Perícias','TÉCNICA')+`
      <article class="paper-card feature"><h3>Quantidade inicial</h3><p>O personagem começa com <strong>${esc(s.initialCountFormula)}</strong> perícias. Recebe mais 1 nos níveis <strong>${s.extraChoiceLevels.join(' e ')}</strong>. Bonificações divinas podem conceder perícias extras.</p></article>
      <div class="skill-grid">${core.skills.skills.map(sk=>`<article class="tone-${sk.attribute}" data-skill-id="${esc(sk.id)}"><span>${esc(core.attributes.attributes.find(a=>a.id===sk.attribute)?.abbr||sk.attribute.toUpperCase())}</span><h3>${esc(sk.name)}</h3><p>${esc(sk.description||'Descrição ainda não consolidada no Core.')}</p>${sk.documentationStatus!=='documented'?'<small class="core-doc-note">EM CONSOLIDAÇÃO</small>':''}</article>`).join('')}</div>`;
  }
  function patchProficiency(box,core){
    const sec=box.querySelector('#prof'); if(!sec)return;
    const p=core.system.proficiency;
    sec.innerHTML=sectionHead('MECÂNICAS · V','Proficiência & Expertise','MESTRIA')+`<div class="grid two close-grid">
      <article class="paper-card"><h3>Bônus de Proficiência</h3><div class="bp-list">${p.ranges.map(r=>`<span>Nível ${r.max==null?`${r.min}+`:`${r.min}–${r.max}`} <b>+${r.bonus}</b></span>`).join('')}</div></article>
      <article class="paper-card"><h3>Expertise</h3><p>Uma perícia treinada soma o BP à rolagem. Com expertise, o BP é <strong>multiplicado por ${p.expertiseMultiplier}</strong>.</p><div class="formula">Treinada → atributo + BP</div><div class="formula">Expertise → atributo + (BP × ${p.expertiseMultiplier})</div></article></div>`;
  }
  function patchTraining(box,core){
    const sec=box.querySelector('#treinos'); if(!sec)return;
    const t=core.system.training, skills=core.system.skills;
    sec.innerHTML=sectionHead('MECÂNICAS · VI','Treinamento & Estacas','TREINO',true)+`
      <article class="paper-card feature"><h3>0 → ${t.masteryAt}</h3><p>Habilidades ativas, armas e perícias podem ser treinadas. Quanto mais estacas, maior o domínio; armas e perícias são consideradas dominadas ao chegar a <strong>${t.masteryAt} estacas</strong>.</p></article>
      <div class="training-grid"><article><h3>Treino Solo</h3><p>Simples: ${esc(t.solo.simple)} • Complexo: ${esc(t.solo.complex)} • Exemplar: ${esc(t.solo.exemplary)}.</p></article><article><h3>Dupla ou Trio</h3><p>Simples: ${esc(t.group.simple)} • Complexo: ${esc(t.group.complex)} • Exemplar: ${esc(t.group.exemplary)}.</p></article><article><h3>Bônus de Cargo</h3><p>${Object.entries(t.rankBonus).map(([k,v])=>`<strong>${esc(k[0].toUpperCase()+k.slice(1))} +${v}</strong>`).join(' • ')} estacas.</p></article></div>
      <div class="grid two"><article class="paper-card"><h3>Armas & Escudos</h3><p>${esc(t.weaponMastery)} ${esc(t.shieldMastery)}</p></article><article class="paper-card"><h3>Perícias treináveis</h3><p>Uma nova perícia pode ser treinada nos níveis <strong>${skills.trainableUnlockLevels.join(', ')}</strong>. Ela é desbloqueada ao atingir ${t.masteryAt} estacas.</p></article></div>`;
  }
  function patchTalents(box,core){
    const sec=box.querySelector('#talentos'); if(!sec)return;
    const levels=core.system.talents.gainLevels;
    sec.innerHTML=sectionHead('MECÂNICAS · VII','Talentos','DOM')+`
      <article class="paper-card feature"><h3>Níveis de talento</h3><p>O personagem recebe talentos nos níveis <strong>${levels.join(', ')}</strong>. Por padrão um talento pode ser escolhido novamente, salvo quando o próprio talento disser o contrário.</p><div class="milestones">${levels.map(x=>`<span>${x}</span>`).join('')}</div></article>
      <div class="talent-grid-full">${core.talents.talents.map(t=>`<article class="talent-card" data-talent-id="${esc(t.id)}" data-repeatable="${t.repeatable!==false}"><h3>${esc(t.name)}${t.minLevel>1?`<span>Nível ${t.minLevel}+</span>`:''}</h3><p>${esc(t.description)}${t.repeatable===false?' <strong>Este talento só pode ser escolhido uma vez.</strong>':''}</p></article>`).join('')}</div>`;
  }
  function patchCombat(box,core){
    const sec=box.querySelector('#combate'); if(!sec)return;
    const c=core.system.combat, costs=core.system.abilityEnergyCosts;
    sec.innerHTML=sectionHead('COMBATE · I','Combate','REFERÊNCIA',true)+`
      <article class="paper-card feature"><h3>Estrutura do turno</h3><p>Cada personagem possui <strong>${c.actionsPerTurn} ações por turno</strong>. A base de rolagem é <strong>${esc(c.baseRoll)}</strong>.</p></article>
      <div class="combat-ref-grid"><article><span>INICIATIVA</span><b>${esc(c.initiative)}</b></article><article><span>DEFESA</span><b>${esc(c.defense)}</b></article><article><span>DT DE HABILIDADE</span><b>${esc(c.abilityDC)}</b></article><article><span>ATAQUE DE ARMA</span><b>${esc(c.weaponAttack)}</b></article><article><span>ATAQUE DE HABILIDADE</span><b>${esc(c.abilityAttack)}</b></article><article><span>RESISTÊNCIA</span><b>${esc(c.resistance)}</b></article></div>
      <div class="grid two"><article class="paper-card"><h3>Críticos</h3><p><strong>1 natural:</strong> ${esc(c.criticals.natural1)}</p><p><strong>20 natural:</strong> ${esc(c.criticals.natural20)}</p><p><strong>Crítico padrão:</strong> ${esc(c.criticals.standard)}</p><p><strong>Crítico brutal:</strong> ${esc(c.criticals.brutal)}</p></article><article class="paper-card"><h3>Invocações</h3><p>Primeiro uso: <strong>${c.summons.firstCastActions} ações</strong>. A criatura recebe <strong>${c.summons.actionPerTurn} ação por turno</strong>. Renovar exige ${c.summons.renewalActions} ação.</p><p>${esc(c.summons.renewal)}</p></article></div>
      <article class="paper-card"><h3>Custos de Energia das habilidades</h3><div class="energy-cost-grid">${costs.map(x=>`<span><small>HAB. ${x.slots[0]}–${x.slots.at(-1)}</small><b>${x.cost}</b></span>`).join('')}</div></article>`;
  }
  function patchConditions(box,core){
    const sec=box.querySelector('#condicoes'); if(!sec)return;
    sec.innerHTML=sectionHead('COMBATE · II','Condições','ESTADOS',true)+`<p class="section-lead">As condições abaixo vêm diretamente do Duodécima Core. Ao alterar uma condição no Core, esta lista é atualizada automaticamente.</p><div class="condition-list">${core.conditions.conditions.map(c=>`<details class="searchable" id="cond-${esc(c.id)}" data-title="${esc(c.name)}"><summary>${esc(c.name)}</summary><div><p>${esc(c.description)}</p>${Object.keys(c.automation||{}).length?`<small class="core-automation">Automação disponível para ferramentas integradas.</small>`:''}</div></details>`).join('')}</div>`;
  }
  function patchDeath(box,core){
    const sec=box.querySelector('#morte'); if(!sec)return;
    const d=core.system.death;
    sec.innerHTML=sectionHead('COMBATE · III','Morte & Vida','0 HP')+`
      <article class="paper-card feature"><h3>Quando o HP chega a 0</h3><p>O personagem começa a fazer testes contra a morte usando <strong>${esc(d.roll)}</strong>. Resultado ${d.successAt}+ conta como sucesso.</p></article>
      <div class="death-flow"><span><b>0 HP</b><small>início</small></span><i>→</i><span><b>${d.successesToStabilize} sucessos</b><small>estabiliza</small></span><i>ou</i><span><b>${d.failuresToDie} falhas</b><small>morte</small></span></div>
      <div class="grid two"><article class="paper-card"><h3>Resultados especiais</h3><p><strong>1 natural:</strong> ${d.natural1Failures} falhas.</p><p><strong>20 natural:</strong> ${esc(d.natural20)}</p><p>Dano a 0 HP: ${d.damageAtZeroFailures} falha. Dano crítico: ${d.criticalDamageAtZeroFailures} falhas.</p></article><article class="paper-card"><h3>Estabilização</h3><p>Primeiros socorros: <strong>${skillName(d.firstAid.skill,core)} DT ${d.firstAid.dc}</strong>.</p><p>${esc(d.stableRecovery)}</p></article></div>
      <article class="notice core-removed-rule"><strong>Regra removida:</strong> não existe penalidade cumulativa em dados por cair a 0 HP e retornar.</article>`;
  }
  function patchSystem(core){const box=rootFor('sistema');patchAttributes(box,core);patchResources(box,core);patchRest(box,core);patchSkills(box,core);patchProficiency(box,core);patchTraining(box,core);patchTalents(box,core);patchCombat(box,core);patchConditions(box,core);patchDeath(box,core);saveRoot('sistema',box);}

  function abilityBlocks(ab){
    const blocks=(ab.blocks&&ab.blocks.length)?ab.blocks:[...(ab.summary?[{type:'description',text:ab.summary}]:[]),...(ab.tiers?.length?[{type:'tiers',items:ab.tiers}]:[]),...(ab.note?[{type:'note',text:ab.note}]:[])];
    return blocks.map(b=>{
      if(b.type==='description') return `<p class="core-ability-description">${esc(b.text)}</p>`;
      if(b.type==='note') return `<div class="core-ability-note">${esc(b.text)}</div>`;
      if(b.type==='tiers') return renderTiers(b.items||[]);
      if(b.type==='variants') return `<div class="core-complex-block"><div class="core-block-label">${esc(b.label||'Variantes')}</div><div class="core-variant-grid">${(b.items||[]).map(renderVariant).join('')}</div></div>`;
      if(b.type==='options') return `<div class="core-complex-block"><div class="core-block-label">${esc(b.label||'Opções')}</div><div class="core-option-grid">${(b.items||[]).map(o=>`<article><h4>${esc(o.name)}</h4><p>${esc(o.base||'')}</p>${o.upgrade?`<small>${esc(o.upgrade)}</small>`:''}</article>`).join('')}</div></div>`;
      return '';
    }).join('');
  }
  function renderTiers(items){return `<div class="core-tier-grid">${items.map(t=>`<article class="stake-line" data-stake="${esc(t.id||t.label)}"><span>${esc(t.label||t.id)}</span><em>${esc(t.text)}</em></article>`).join('')}</div>`;}
  function renderVariant(v){return `<article class="core-variant"><header><h4>${esc(v.name)}</h4><p>${esc(v.description||'')}</p></header>${v.stats?`<div class="core-stat-pills">${Object.entries(v.stats).map(([k,val])=>`<span><small>${k==='hpFormula'?'HP':k==='defense'?'DEFESA':esc(k)}</small><b>${esc(val)}</b></span>`).join('')}</div>`:''}${v.traits?.length?`<ul>${v.traits.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${v.abilities?.length?`<div class="core-variant-abilities">${v.abilities.map(a=>`<section><h5>${esc(a.name)}</h5>${a.description?`<p>${esc(a.description)}</p>`:''}${a.tiers?.length?renderTiers(a.tiers):''}</section>`).join('')}</div>`:''}</article>`;}
  function deitySummaryFromFallback(sec){
    if(!sec)return {who:'',play:''};
    const cards=[...sec.querySelectorAll('.deity-info')];
    const pick=label=>cards.find(c=>c.querySelector('small')?.textContent.trim().toUpperCase()===label)?.querySelector('p')?.innerHTML||'';
    return {who:pick('QUEM ERA'),play:pick('JOGANDO COM O KIT')};
  }
  function bonusesText(d,core){
    const attrs=Object.entries(d.attributeBonuses||{}).map(([id,v])=>`${signed(v)} em ${attrName(id,core)}`);
    const skills=(d.grantedSkills||[]).map(id=>skillName(id,core));
    const choices=(d.skillChoices||[]).map(id=>skillName(id,core));
    const skillBonus=Object.entries(d.skillBonuses||{}).map(([id,v])=>`${signed(v)} em ${skillName(id,core)}`);
    let out=attrs.join(', ');
    if(skills.length) out+=`${out?'. ':''}Ganha ${joinHuman(skills)}.`;
    if(choices.length) out+=`${out? ' ':''}Escolhe entre ${joinHuman(choices)}.`;
    if(skillBonus.length) out+=`${out?' ':''}${skillBonus.join(', ')}.`;
    return out||'Sem bonificação mecânica registrada.';
  }
  function renderAbility(ab,d,index,kind){
    const slug=slugFor(d); const isExtra=ab.category==='extra'; const no=isExtra?'EX':String(ab.slot||index+1).padStart(2,'0');
    const unlock=isExtra?'EXTRA':kind==='passive'?'PASSIVA':`NÍVEL ${ab.level??'—'}`;
    const cost=ab.cost!=null&&kind==='active'&&!isExtra?`<span class="core-cost">${ab.cost} EN</span>`:'';
    return `<details class="deity-ability searchable${isExtra?' deity-ability-extra':''}" data-title="${esc(d.name)} — ${esc(ab.name)}" id="${esc(slug)}-${kind==='passive'?'passiva':'ativa'}-${esc(ab.slot||index+1)}"><summary><span class="ability-no">${no}</span><strong>${esc(ab.name)}</strong><b>${unlock}</b>${cost}</summary><div class="ability-body" data-enhanced="1">${abilityBlocks(ab)}</div></details>`;
  }
  function renderDeityDetail(d,core,fallback){
    const narrative=deitySummaryFromFallback(fallback); const cast=d.castingAttribute?attrName(d.castingAttribute,core):'—'; const hp=d.hp?`${d.hp.base}${d.hp.constitutionApplies?' + Constituição':''}; +${d.hp.perDecade}${d.hp.constitutionApplies?' + Constituição':''} a cada 10 níveis`:'—';
    return `<section class="section deity-detail searchable" data-deity="${esc(slugFor(d))}" data-core-id="${esc(d.id)}" data-title="${esc(d.name)}" hidden id="deus-${esc(slugFor(d))}">
      <div class="deity-title"><small>${esc(d.groupLabel||'PROLE DIVINA')}</small><h2>${esc(d.name)}</h2><p>Kit sincronizado pelo Duodécima Core · ${esc(core.manifest.contentVersion)}</p></div>
      <div class="deity-info-grid">${narrative.who?`<article class="deity-info"><small>QUEM ERA</small><p>${narrative.who}</p></article>`:''}${narrative.play?`<article class="deity-info deity-info--wide"><small>JOGANDO COM O KIT</small><p>${narrative.play}</p></article>`:''}<article class="deity-info"><small>CONJURAÇÃO</small><p><strong>${esc(cast)}</strong></p></article><article class="deity-info"><small>HP</small><p>${esc(hp)}</p></article><article class="deity-info"><small>BONIFICAÇÕES DIVINAS</small><p>${esc(bonusesText(d,core))}</p></article>${d.resource?`<article class="deity-info"><small>RECURSO</small><p><strong>${esc(d.resource.name)}</strong>${d.resource.maxFormula?` · ${esc(d.resource.maxFormula)}`:''}</p></article>`:''}</div>
      ${d.notes?.length?`<div class="core-kit-notes">${d.notes.map(n=>`<p>${esc(n)}</p>`).join('')}</div>`:''}
      <div class="deity-tools"><div><small>KIT</small><h3>Habilidades passivas</h3></div><button class="toggle-abilities" data-target="passivas-${esc(slugFor(d))}" type="button">Expandir todas</button></div><div class="deity-abilities" id="passivas-${esc(slugFor(d))}">${d.passives.map((a,i)=>renderAbility(a,d,i,'passive')).join('')}</div>
      <div class="deity-tools deity-tools--active"><div><small>KIT</small><h3>Habilidades ativas</h3></div><button class="toggle-abilities" data-target="ativas-${esc(slugFor(d))}" type="button">Expandir todas</button></div><div class="deity-abilities" id="ativas-${esc(slugFor(d))}">${d.actives.map((a,i)=>renderAbility(a,d,i,'active')).join('')}</div>
    </section>`;
  }
  function patchGods(core){
    const box=rootFor('deuses');
    const fallbackSections=new Map([...box.querySelectorAll('.deity-detail')].map(s=>[coreIdFromGuideSlug(s.dataset.deity),s.cloneNode(true)]));
    const oldDescriptions=new Map();
    for(const group of core.gods.groups){
      const sec=box.querySelector(`#${CSS.escape(group.id)}`); if(!sec)continue;
      const map=new Map();
      sec.querySelectorAll('.god-row').forEach(row=>{const href=row.querySelector('.god-name[href]')?.getAttribute('href')||'';const slug=href.replace('#deus-','');const id=coreIdFromGuideSlug(slug)||'';if(id)map.set(id,row.querySelector('p')?.innerHTML||'');else {const name=row.querySelector('.god-name')?.textContent.trim();if(name==='Minerva')map.set('minerva',row.querySelector('p')?.innerHTML||'');}});
      oldDescriptions.set(group.id,map);
      const members=sec.querySelector('.pantheon-members'); if(members){members.innerHTML=core.gods.deities.filter(d=>d.group===group.id).map(d=>{const desc=map.get(d.id)||'Divindade integrante deste grupo do panteão romano.';return `<article class="god-row${d.kitAvailable?' is-ready':''}"><div>${d.kitAvailable?`<a class="god-name" href="#deus-${esc(slugFor(d))}">${esc(d.name)}</a>`:`<span class="god-name">${esc(d.name)}</span>`}<span class="god-state ${d.kitAvailable?'ready':'soon'}">${d.kitAvailable?'KIT DISPONÍVEL':'SEM KIT'}</span></div><p>${desc}</p></article>`;}).join('');}
    }
    const overview=box.querySelector('#panteoes .pantheon-grid'); if(overview){overview.querySelectorAll('.pantheon-card').forEach(card=>{const id=(card.getAttribute('href')||'').slice(1);const count=core.gods.deities.filter(d=>d.group===id&&d.kitAvailable).length;const b=card.querySelector('b');if(b)b.textContent=`${count} kits disponíveis`;});}
    box.querySelectorAll('.deity-detail').forEach(x=>x.remove());
    const kits=core.gods.deities.filter(d=>d.kitAvailable);
    box.insertAdjacentHTML('beforeend',kits.map(d=>renderDeityDetail(d,core,fallbackSections.get(d.id))).join(''));
    saveRoot('deuses',box);
  }
  function rebuildSearch(){
    const out=[];
    for(const [page,obj] of Object.entries(window.GUIA_CONTENT)){
      const root=document.createElement('div');root.innerHTML=obj.html;
      root.querySelectorAll('.searchable[id]').forEach(el=>{
        const deity=el.closest('.deity-detail');
        let title=el.dataset.title||el.querySelector('h2,h3,summary')?.textContent.trim()||el.id;
        out.push({page,anchor:el.id,deity:deity?.id||null,title,text:el.textContent.replace(/\s+/g,' ').trim()});
      });
    }
    window.GUIA_SEARCH=out;
  }
  function patchTalentEnhancerCompatibility(){window.GUIA_CORE_PATCHED=true;}
  function updateCoreStatus(){
    const el=document.querySelector('#coreStatus');if(!el)return;
    if(state.status==='online'){el.className='core-status is-online';el.innerHTML=`<i></i><span>CORE ${esc(state.version)}</span>`;el.title='Regras carregadas do Duodécima Core';}
    else {el.className='core-status is-fallback';el.innerHTML='<i></i><span>SNAPSHOT LOCAL</span>';el.title='Core indisponível; usando conteúdo local do Guia';}
  }
  async function init(){
    try{
      const core=await loadCore();
      patchSystem(core);patchGods(core);rebuildSearch();patchTalentEnhancerCompatibility();
      state.status='online';state.source='core';state.version=core.manifest.contentVersion;state.manifest=core.manifest;
    }catch(err){
      console.warn('[Duodécima Core] Falha ao sincronizar; usando snapshot local.',err);
      state.status='fallback';state.source='local';state.error=String(err?.message||err);
    }
    updateCoreStatus();
    return state;
  }
  window.DUODECIMA_CORE_READY=init();
})();
