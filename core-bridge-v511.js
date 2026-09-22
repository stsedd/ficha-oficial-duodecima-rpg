(() => {
  'use strict';

  const DEFAULT_BASE = 'https://stsedd.github.io/duodecima-core/';
  const SNAPSHOT_URL = './core-snapshot.json';
  const state = { status:'loading', source:'fallback', version:'—', error:null, base:DEFAULT_BASE };
  window.DUODECIMA_CORE_STATE = state;

  const escBase = value => String(value || DEFAULT_BASE).replace(/\/+$/, '') + '/';
  const coreBase = escBase(window.DUODECIMA_CORE_BASE || DEFAULT_BASE);
  state.base = coreBase;

  async function getJson(url, cache='default'){
    const response = await fetch(url, { cache });
    if(!response.ok) throw new Error(`${response.status} ${response.statusText} · ${url}`);
    return response.json();
  }
  const byId = (arr=[]) => new Map(arr.map(x => [x.id, x]));

  function cleanCoreText(value){
    let raw=String(value ?? '').replace(/\r/g,'').trim();
    if(!raw)return '';
    raw=raw.replace(/https?:\/\/cdn\.discordapp\.com\/emojis\/\S+/gi,'');
    raw=raw.replace(/\s*[ৎ౨꒰◝🤍💔🍒﹒ㄑ✦\[\],.\-–—]*\s*(?:cherry\s+bow|cherry\s+mae)\b[\s\S]*?(?:ícone\s+de\s+cargo|copão\s+de\s+600)[\s\S]*$/i,'');
    raw=raw.replace(/\s*[^\n]{0,140}\[SPQR\]\s*,?\s*(?:ícone|icone)\s+de\s+cargo[\s\S]*$/i,'');
    raw=raw.replace(/\s*[^\n]{0,140}(?:copão|copao)\s+de\s+600[\s\S]*$/i,'');
    raw=raw.replace(/<@!?&?\d+>|<#\d+>/g,'');
    return raw.replace(/[ \t\f\v]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  }
  function cleanCoreNode(value){
    if(typeof value==='string')return cleanCoreText(value);
    if(Array.isArray(value))return value.map(cleanCoreNode);
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,cleanCoreNode(v)]));
    return value;
  }

  function skillName(id, skills){ return skills.get(id)?.name || id; }

  function normalizeResource(r){
    if(!r) return null;
    return {
      id:r.id || String(r.name || 'recurso').toLowerCase().replace(/[^a-z0-9]+/g,'-'),
      name:r.name || 'Recurso Divino',
      scope:r.scope || 'personal',
      max:r.max || {type:'described',formula:r.maxFormula || '0'},
      maxFormula:r.maxFormula || r.max?.formula || (r.max?.value != null ? String(r.max.value) : '0'),
      sourceAbilityId:r.sourceAbilityId || null,
      reset:r.reset || null,
      thresholds:Array.isArray(r.thresholds) ? r.thresholds : [],
      sharedKey:r.sharedKey || null
    };
  }

  function mapGod(d, skills){
    const groupMap = {
      'triunviros':'Triunviro',
      'dii-consentis':'Dii Consentis',
      'dii-inferi':'Dii Inferi',
      'alati':'Alati',
      'ventis':'Ventis',
      'numina':'Numina'
    };
    const skillBonuses = {};
    for(const [id, value] of Object.entries(d.skillBonuses || {})) skillBonuses[skillName(id, skills)] = value;
    const out = {
      id:d.id,
      name:d.name,
      group:groupMap[d.group] || d.groupLabel || d.group,
      source:`Duodécima Core · ${state.version}`,
      casting:d.castingAttribute || 'fe',
      hpBase:Number(d.hp?.base ?? 20),
      hpPerDecade:Number(d.hp?.perDecade ?? 5),
      bonuses:{ ...(d.attributeBonuses || {}) },
      skillBonuses,
      grantedSkills:(d.grantedSkills || []).map(id => skillName(id, skills)),
      skillChoice:(d.skillChoices || []).map(id => skillName(id, skills)),
      notes:[...(d.notes || [])]
    };
    out.resources = (d.resources || []).map(normalizeResource).filter(Boolean);
    if(d.resource){
      const legacy = normalizeResource({
        ...d.resource,
        id:d.resource.id || out.resources[0]?.id || String(d.resource.name || 'recurso').toLowerCase().replace(/[^a-z0-9]+/g,'-'),
        max:{type:'described',formula:d.resource.maxFormula || '0'}
      });
      out.resource = legacy;
      if(!out.resources.length) out.resources=[legacy];
    }
    return out;
  }

  function coreTierObject(tiers=[]){
    if(!tiers.length) return null;
    const low = tiers.find(t => Number(t.min) === 0) || tiers.find(t => String(t.id).includes('0-15'));
    const mid = tiers.find(t => Number(t.min) === 16) || tiers.find(t => String(t.id).includes('16-29'));
    const high = tiers.find(t => Number(t.min) >= 30) || tiers.find(t => String(t.id).includes('30'));
    const obj = { low:low?.text || '', mid:mid?.text || '', high:high?.text || '' };
    return (obj.low || obj.mid || obj.high) ? obj : null;
  }

  function mapAbility(a, sourceGodId){
    return {
      id:a.id,
      name:a.name,
      type:a.type === 'passive' ? 'passive' : 'active',
      summary:cleanCoreText(a.summary || ''),
      tiers:coreTierObject(cleanCoreNode(a.tiers || [])),
      extra:cleanCoreText(a.note || ''),
      level:a.level,
      slot:a.slot,
      cost:a.cost,
      isExtra:a.category === 'extra',
      sourceGodId,
      coreBlocks:Array.isArray(a.blocks) ? cleanCoreNode(a.blocks) : [],
      coreTiers:Array.isArray(a.tiers) ? cleanCoreNode(a.tiers) : [],
      coreCategory:a.category || a.type,
      choices:Array.isArray(a.choices) ? cleanCoreNode(a.choices) : [],
      skillEffects:Array.isArray(a.skillEffects) ? cleanCoreNode(a.skillEffects) : []
    };
  }

  function mapAbilities(deities){
    const db = {};
    for(const d of deities.filter(x => x.kitAvailable)){
      db[d.id] = {
        passives:(d.passives || []).map(a => mapAbility(a,d.id)),
        actives:(d.actives || []).map(a => mapAbility(a,d.id))
      };
    }
    return db;
  }

  function mapTalents(core, policies){
    return (core.talents || []).map(t => ({
      id:t.id,
      name:t.name,
      minLevel:Number(t.minLevel || 1),
      description:t.description || '',
      repeatable:t.repeatable !== false,
      params:[...(t.params || [])],
      stacking:policies?.policies?.[t.id] || null,
      automation:t.automation || undefined,
      manual:!!t.manual
    }));
  }

  function mapConditions(core){
    return (core.conditions || []).map(c => ({
      id:c.id,
      name:c.name,
      mechanic:c.description || '',
      ...(c.automation || {})
    }));
  }

  function mapSystem(core){
    const sys = core.system || {};
    const equipment = core.equipment || {};
    return {
      levels:{
        min:Number(sys.levels?.min ?? 1),
        max:Number(sys.levels?.max ?? 100)
      },
      attributes:{
        startingPoints:Number(sys.attributes?.startingPoints ?? 8),
        normalMax:Number(sys.attributes?.normalMax ?? 5),
        increaseLevels:[...(sys.attributes?.increaseLevels || [20,40,60,80,100])]
      },
      conditions:mapConditions(core),
      materials:[...(equipment.materials || [])],
      craftingComponents:[...(equipment.craftingComponents || [])],
      armorTypes:[...(equipment.armorTypes || [])],
      weaponTypes:[...(equipment.weaponTypes || [])],
      proficiencyRanges:[...(sys.proficiency?.ranges || [])],
      expertiseMultiplier:Number(sys.proficiency?.expertiseMultiplier || 2),
      attributeIncreaseLevels:[...(sys.attributes?.increaseLevels || [20,40,60,80,100])],
      talentLevels:[...(sys.talents?.gainLevels || [1,30,60,90])],
      skillTrainingLevels:[...(sys.skills?.trainableUnlockLevels || [21,41,61,81,100])],
      extraSkillLevels:[...(sys.skills?.extraChoiceLevels || [20,40])],
      trainingStakes:[...(sys.training?.stakes || [])],
      energy:{
        base:Number(sys.resources?.energy?.base ?? 100),
        increment:Number(sys.resources?.energy?.increment ?? 25),
        everyLevels:Number(sys.resources?.energy?.everyLevels ?? 5),
        lowThresholdRatio:Number(sys.resources?.energy?.lowThresholdRatio ?? .5),
        lowPenaltyD20:Number(sys.resources?.energy?.lowPenaltyD20 ?? -1),
        atZero:sys.resources?.energy?.atZero || 'Inconsciente'
      },
      sanity:sys.resources?.sanity || null,
      abilityEnergyCosts:[...(sys.abilityEnergyCosts || [])],
      rests:sys.rests || {},
      combat:sys.combat || {},
      exhaustion:sys.exhaustion || {},
      death:sys.death || {},
      lineage:sys.lineage || {},
      magicAwakening:sys.magicAwakening || {},
      removedRules:[...(sys.removedRules || [])]
    };
  }

  function updateStatus(){
    const el = document.querySelector('#coreStatus');
    if(!el) return;
    if(state.status === 'online'){
      el.className = 'core-status online';
      el.innerHTML = `<i></i><span>CORE ${state.version}</span>`;
      el.title = 'Regras carregadas do Duodécima Core';
    } else if(state.status === 'fallback'){
      el.className = 'core-status fallback';
      el.innerHTML = `<i></i><span>${state.source==='snapshot'?'SNAPSHOT '+state.version:'SNAPSHOT LOCAL'}</span>`;
      el.title = state.source==='snapshot'?'Core remoto indisponível; usando o último snapshot canônico sincronizado.':'Core indisponível; usando a cópia local da ficha';
    } else {
      el.className = 'core-status loading';
      el.innerHTML = '<i></i><span>CORE…</span>';
    }
  }

  async function loadRemoteCore(){
    const manifest = await getJson(`${coreBase}manifest.json`, 'no-cache');
    const q = encodeURIComponent(manifest.contentVersion || manifest.updatedAt || 'current');
    const pairs = await Promise.all(Object.entries(manifest.files || {}).map(async ([key,file]) => [key,await getJson(`${coreBase}${file}?v=${q}`,'default')]));
    return { manifest, ...Object.fromEntries(pairs) };
  }

  async function loadSnapshot(){
    const snapshot=await getJson(`${SNAPSHOT_URL}?v=1`,'no-cache');
    if(!snapshot?.manifest||!snapshot?.gods||!snapshot?.skills||!snapshot?.system)throw new Error('Snapshot local incompleto.');
    return snapshot;
  }

  function installCore(bundle, source){
    const {manifest,attributes,skills,talents,talentPolicies,conditions,gods,system,equipment,aliases,origins}=bundle;
    if(!manifest||!attributes||!skills||!talents||!conditions||!gods||!system||!equipment)throw new Error('Pacote do Core incompleto.');
    state.version = manifest.contentVersion || manifest.updatedAt || 'online';
    const skillMap = byId(skills.skills || []);
    const deityList = (gods.deities || []).filter(d => d.kitAvailable && d.selectable !== false);
    window.DUODECIMA_SKILLS = (skills.skills || []).map(s => ({ name:s.name, attr:s.attribute, id:s.id, description:s.description || '' }));
    window.DUODECIMA_TALENTS = mapTalents(talents,talentPolicies);
    window.DUODECIMA_GODS = deityList.map(d => mapGod(d,skillMap));
    window.DUODECIMA_EXCLUDED_GODS = (gods.deities || []).filter(d => !d.kitAvailable || d.selectable === false).map(d => ({id:d.id,name:d.name,group:d.groupLabel || d.group}));
    window.DUODECIMA_ABILITIES = mapAbilities(deityList);
    window.DUODECIMA_SYSTEM = mapSystem({conditions:conditions.conditions || [], system, equipment});
    window.DUODECIMA_LINEAGE = system.lineage || {};
    window.DUODECIMA_ORIGINS = origins || {};
    const magicCore = system.magicAwakening || {};
    if(window.DUODECIMA_MAGIC){
      window.DUODECIMA_MAGIC = {
        ...window.DUODECIMA_MAGIC,
        maxSacrifices:Number(magicCore.maxSacrifices ?? window.DUODECIMA_MAGIC.maxSacrifices ?? 3),
        sacrificeEnergyEach:Number(magicCore.sacrificeEnergyEach ?? window.DUODECIMA_MAGIC.sacrificeEnergyEach ?? 25),
        sacrificeCanGoBelowZero:magicCore.canReduceBelowZero !== false,
        divineBonusesSacrificable:magicCore.divineBonusesSacrificable === true,
        sacrificialAttributes:[...(magicCore.sacrificialAttributes || ['for','des','con'])]
      };
    }
    window.DUODECIMA_CORE_DATA = {manifest,attributes,skills,talents,talentPolicies,conditions,gods,system,equipment,aliases,origins};
    state.manifest=manifest;
    state.source=source;
    state.status=source==='core'?'online':'fallback';
  }

  async function init(){
    updateStatus();
    try{
      const core=await loadRemoteCore();
      installCore(core,'core');
    }catch(remoteErr){
      console.warn('[Ficha · Duodécima Core] Falha no Core remoto; tentando snapshot local.',remoteErr);
      try{
        const snapshot=await loadSnapshot();
        installCore(snapshot,'snapshot');
        state.error=String(remoteErr?.message||remoteErr);
      }catch(snapshotErr){
        console.warn('[Ficha · Duodécima Core] Snapshot indisponível; usando dados legados empacotados.',snapshotErr);
        state.status='fallback';
        state.source='local';
        state.error=`${String(remoteErr?.message||remoteErr)} | snapshot: ${String(snapshotErr?.message||snapshotErr)}`;
      }
    }
    updateStatus();
    return state;
  }

  window.DUODECIMA_CORE_READY = init();
})();
