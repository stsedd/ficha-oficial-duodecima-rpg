(() => {
  'use strict';

  const DEFAULT_BASE = 'https://stsedd.github.io/duodecima-core/';
  const state = { status:'loading', source:'fallback', version:'—', error:null, base:DEFAULT_BASE };
  window.DUODECIMA_CORE_STATE = state;

  const escBase = value => String(value || DEFAULT_BASE).replace(/\/+$/, '') + '/';
  const coreBase = escBase(window.DUODECIMA_CORE_BASE || DEFAULT_BASE);
  state.base = coreBase;

  async function getJson(url){
    const response = await fetch(url, { cache:'no-store' });
    if(!response.ok) throw new Error(`${response.status} ${response.statusText} · ${url}`);
    return response.json();
  }
  const byId = (arr=[]) => new Map(arr.map(x => [x.id, x]));

  function attrName(id, attrs){ return attrs.get(id)?.name || id; }
  function skillName(id, skills){ return skills.get(id)?.name || id; }

  function resourceMaxFactory(formula){
    const raw = String(formula || '').toLowerCase();
    return lvl => {
      const level = Math.max(1, Number(lvl) || 1);
      if(raw.includes('floor') && raw.includes('/10')){
        const first = Number((raw.match(/-?\d+(?:\.\d+)?/) || ['0'])[0]);
        return first + Math.floor(level / 10);
      }
      const n = Number((raw.match(/-?\d+(?:\.\d+)?/) || ['0'])[0]);
      return Number.isFinite(n) ? n : 0;
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
    if(d.resource){
      out.resource = {
        name:d.resource.name,
        maxFormula:d.resource.maxFormula || '0',
        scope:d.resource.scope || 'personal',
        max:resourceMaxFactory(d.resource.maxFormula)
      };
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
      summary:a.summary || '',
      tiers:coreTierObject(a.tiers || []),
      extra:a.note || '',
      level:a.level,
      slot:a.slot,
      cost:a.cost,
      isExtra:a.category === 'extra',
      sourceGodId,
      coreBlocks:Array.isArray(a.blocks) ? a.blocks : [],
      coreTiers:Array.isArray(a.tiers) ? a.tiers : [],
      coreCategory:a.category || a.type
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

  function mapTalents(core){
    return (core.talents || []).map(t => ({
      id:t.id,
      name:t.name,
      minLevel:Number(t.minLevel || 1),
      description:t.description || '',
      repeatable:t.repeatable !== false,
      params:[...(t.params || [])],
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
      conditions:mapConditions(core),
      materials:[...(equipment.materials || [])],
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
      el.innerHTML = '<i></i><span>SNAPSHOT LOCAL</span>';
      el.title = 'Core indisponível; usando a cópia local da ficha';
    } else {
      el.className = 'core-status loading';
      el.innerHTML = '<i></i><span>CORE…</span>';
    }
  }

  async function init(){
    updateStatus();
    try{
      const manifest = await getJson(`${coreBase}manifest.json?t=${Date.now()}`);
      state.version = manifest.contentVersion || manifest.updatedAt || 'online';
      const q = encodeURIComponent(state.version);
      const file = key => manifest.files?.[key] || `data/${key}.json`;
      const [attributes,skills,talents,conditions,gods,system,equipment,aliases] = await Promise.all([
        getJson(`${coreBase}${file('attributes')}?v=${q}`),
        getJson(`${coreBase}${file('skills')}?v=${q}`),
        getJson(`${coreBase}${file('talents')}?v=${q}`),
        getJson(`${coreBase}${file('conditions')}?v=${q}`),
        getJson(`${coreBase}${file('gods')}?v=${q}`),
        getJson(`${coreBase}${file('system')}?v=${q}`),
        getJson(`${coreBase}${file('equipment')}?v=${q}`),
        getJson(`${coreBase}${file('aliases')}?v=${q}`)
      ]);
      const skillMap = byId(skills.skills || []);
      const deityList = (gods.deities || []).filter(d => d.kitAvailable && d.selectable !== false);
      window.DUODECIMA_SKILLS = (skills.skills || []).map(s => ({ name:s.name, attr:s.attribute, id:s.id, description:s.description || '' }));
      window.DUODECIMA_TALENTS = mapTalents(talents);
      window.DUODECIMA_GODS = deityList.map(d => mapGod(d,skillMap));
      window.DUODECIMA_EXCLUDED_GODS = (gods.deities || []).filter(d => !d.kitAvailable || d.selectable === false).map(d => ({id:d.id,name:d.name,group:d.groupLabel || d.group}));
      window.DUODECIMA_ABILITIES = mapAbilities(deityList);
      window.DUODECIMA_SYSTEM = mapSystem({conditions:conditions.conditions || [], system, equipment});
      window.DUODECIMA_CORE_DATA = {manifest,attributes,skills,talents,conditions,gods,system,equipment,aliases};
      state.status='online'; state.source='core'; state.manifest=manifest;
    }catch(err){
      console.warn('[Ficha · Duodécima Core] Falha ao carregar Core; usando snapshot local.',err);
      state.status='fallback'; state.source='local'; state.error=String(err?.message || err);
    }
    updateStatus();
    return state;
  }

  window.DUODECIMA_CORE_READY = init();
})();
