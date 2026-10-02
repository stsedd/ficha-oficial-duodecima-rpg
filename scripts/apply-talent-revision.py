from pathlib import Path
import re

path=Path('app-v511.js')
s=path.read_text(encoding='utf-8')

replacements=[
    ("function talentAttributeBonus(k){return (state.talents||[]).filter(t=>t.talentId==='aumento-atributo'&&t.params?.attribute===k).length}", "function talentAttributeBonus(k){let total=0;(state.talents||[]).forEach(t=>{if(t.talentId==='aumento-atributo'){if(t.params?.attribute===k)total+=1;if(t.params?.attribute1===k)total+=1;if(t.params?.attribute2===k)total+=1}if(t.talentId==='resiliente'&&t.params?.attribute===k)total+=1});return total}"),
    ("function talentGrantedSkills(){const out=[];(state.talents||[]).filter(t=>t.talentId==='perito').forEach(t=>['skill1','skill2','skill3'].forEach(k=>{const v=t.params?.[k];if(v)out.push(v)}));return [...new Set(out)]}", "function talentGrantedSkills(){const out=[];(state.talents||[]).forEach(t=>{if(t.talentId==='perito')['skill1','skill2','skill3','skill4','skill5'].forEach(k=>{const v=t.params?.[k];if(v)out.push(v)});if(t.talentId==='expert'&&t.params?.skill)out.push(t.params.skill)});return [...new Set(out)]}"),
    ("function talentExpertSkills(){return [...new Set((state.talents||[]).filter(t=>t.talentId==='expert').map(t=>t.params?.skill).filter(Boolean))]}", "function talentExpertSkills(){const out=[];(state.talents||[]).filter(t=>t.talentId==='expert').forEach(t=>['expertise1','expertise2'].forEach(k=>{const v=t.params?.[k];if(v)out.push(v)}));return [...new Set(out)]}"),
    ("function defenseBonus(){const base=hasTalent('bruto')?effectiveAttr('con'):effectiveAttr('des');return base+talentCount('defensor')+armorDefense()+shieldDefense()+(Number(state.tempMods?.defense)||0)+globalD20Penalty()+conditionDefenseMod()}", "function defenseBonus(){const base=hasTalent('bruto')?effectiveAttr('con'):effectiveAttr('des'),defensor=hasTalent('defensor')?2:0,agil=hasTalent('agil')&&skillIsProficient('Agilidade')?Math.ceil(bp()/2):0;return base+defensor+agil+armorDefense()+shieldDefense()+(Number(state.tempMods?.defense)||0)+globalD20Penalty()+conditionDefenseMod()}"),
    ("function castAttack(){return effectiveAttr(god().casting)+bp()+globalD20Penalty()+attrRollConditionPenalty(god().casting)}", "function castAttack(){return effectiveAttr(god().casting)+bp()+(hasTalent('mestre-habilidades')?1:0)+globalD20Penalty()+attrRollConditionPenalty(god().casting)}"),
    ("Slots padrão nos níveis 1, 30, 60 e 90. Selecione um talento para ler a descrição primeiro; ele só entra na ficha quando você clicar em Adicionar.", "Você recebe um talento nos níveis 1, 30, 60 e 90, então já começa com um talento. Por padrão, cada talento só pode ser escolhido uma vez, a menos que a própria descrição diga o contrário. Selecione um talento para ler a descrição antes de adicionar.")
]
for old,new in replacements:
    if old not in s:
        raise SystemExit(f'Trecho esperado não encontrado: {old[:90]}')
    s=s.replace(old,new,1)

param_func='''  function talentParameterHtml(inst,def){
    const p=inst.params||{};let out='';
    const attrSelect=(key,label,value)=>`<label><span class="label">${label}</span><select data-talent-param="${inst.id}:${key}"><option value="">Selecione…</option>${ATTRS.map(([k,a,l])=>`<option value="${k}" ${value===k?'selected':''}>${l}</option>`).join('')}</select></label>`;
    if(def.params?.includes('attribute'))out+=attrSelect('attribute','Atributo',p.attribute||'');
    if(def.params?.includes('attribute1')){out+=attrSelect('attribute1','Ponto de atributo 1',p.attribute1||p.attribute||'');out+=attrSelect('attribute2','Ponto de atributo 2',p.attribute2||'')}
    if(def.params?.includes('element'))out+=`<label><span class="label">Elemento</span><input data-talent-param="${inst.id}:element" value="${esc(p.element||'')}" placeholder="Ex.: fogo, gelo..."></label>`;
    if(def.params?.includes('skill'))out+=`<label><span class="label">Nova perícia</span><select data-talent-param="${inst.id}:skill"><option value="">Selecione…</option>${skills.map(sk=>`<option ${p.skill===sk.name?'selected':''}>${sk.name}</option>`).join('')}</select></label>`;
    if(def.params?.includes('expertise1'))for(const key of ['expertise1','expertise2'])out+=`<label><span class="label">Expertise</span><select data-talent-param="${inst.id}:${key}"><option value="">Selecione…</option>${skills.filter(sk=>skillIsProficient(sk.name)||p[key]===sk.name).map(sk=>`<option ${p[key]===sk.name?'selected':''}>${sk.name}</option>`).join('')}</select></label>`;
    if(def.params?.some(x=>/^skill[1-5]$/.test(x)))for(const key of ['skill1','skill2','skill3','skill4','skill5'])out+=`<label><span class="label">Perícia</span><select data-talent-param="${inst.id}:${key}"><option value="">Selecione…</option>${skills.map(sk=>`<option ${p[key]===sk.name?'selected':''}>${sk.name}</option>`).join('')}</select></label>`;
    return out
  }
'''
s,n=re.subn(r"  function talentParameterHtml\(inst,def\)\{.*?\n  function talentPreviewHtml",param_func+"  function talentPreviewHtml",s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'Falha ao substituir talentParameterHtml: {n}')

bind_func='''  function bindTalents(){
    const sel=byId('newTalentDef');if(sel)sel.onchange=()=>{state.talentDraftId=sel.value;const def=talentDef(sel.value),box=byId('talentPreview');if(box)box.innerHTML=talentPreviewHtml(def);const locked=!!def&&state.level<def.minLevel,standard=byId('addStandardTalent'),extra=byId('addExtraTalent');if(standard)standard.disabled=!sel.value||locked||standardTalentsUsed()>=talentSlotsEarned();if(extra)extra.disabled=!sel.value||locked;save()};
    const add=(extra)=>{const picker=byId('newTalentDef'),id=picker?.value,def=talentDef(id);if(!def)return;if(!extra&&standardTalentsUsed()>=talentSlotsEarned())return;if(state.level<def.minLevel){notify(`Este talento exige nível ${def.minLevel}.`);return}if(def.repeatable===false&&hasTalent(id)){notify('Este talento só pode ser escolhido uma vez.');return}state.talents.push({id:uid('talent'),talentId:id,extra:!!extra,params:{},notes:''});state.talentDraftId='';syncCurrentCaps();save();renderSheet()};
    const a=byId('addStandardTalent');if(a)a.onclick=()=>add(false);const e=byId('addExtraTalent');if(e)e.onclick=()=>add(true);
    document.querySelectorAll('[data-remove-talent]').forEach(b=>b.onclick=()=>{state.talents=state.talents.filter(t=>t.id!==b.dataset.removeTalent);syncCurrentCaps();save();renderSheet()});
    document.querySelectorAll('[data-talent-param]').forEach(el=>el.onchange=()=>{const idx=el.dataset.talentParam.indexOf(':'),id=el.dataset.talentParam.slice(0,idx),key=el.dataset.talentParam.slice(idx+1),t=state.talents.find(x=>x.id===id);if(!t)return;t.params=t.params||{};const oldValue=key==='attribute1'?(t.params.attribute1||t.params.attribute||''):(t.params[key]||'');
      if(t.talentId==='aumento-atributo'&&/^attribute[12]$/.test(key)&&el.value&&el.value!==oldValue&&ordinaryAttrRaw(el.value)>=5){notify('Este atributo já atingiu 5.');el.value=oldValue;return}
      if(t.talentId==='resiliente'&&key==='attribute'&&el.value&&el.value!==oldValue&&ordinaryAttrRaw(el.value)>=5){notify('Este atributo já atingiu 5.');el.value=oldValue;return}
      if(t.talentId==='perito'&&/^skill[1-5]$/.test(key)&&el.value&&el.value!==oldValue&&skillIsProficient(el.value)){notify('Escolha uma perícia em que você ainda não possua proficiência.');el.value=oldValue;return}
      if(t.talentId==='expert'&&key==='skill'&&el.value&&el.value!==oldValue&&skillIsProficient(el.value)){notify('A nova perícia de Expert precisa ser uma em que você ainda não possua proficiência.');el.value=oldValue;return}
      if(t.talentId==='expert'&&/^expertise[12]$/.test(key)&&el.value){if(!skillIsProficient(el.value)){notify('Expertise só pode ser escolhida em uma perícia na qual você possua proficiência.');el.value=oldValue;return}const other=key==='expertise1'?'expertise2':'expertise1';if(t.params?.[other]===el.value){notify('Escolha duas perícias diferentes para Expertise.');el.value=oldValue;return}}
      if(t.talentId==='adepto-elemental'&&key==='element'&&el.value.trim()){const chosen=el.value.trim().toLocaleLowerCase('pt-BR'),duplicate=(state.talents||[]).some(x=>x.id!==t.id&&x.talentId==='adepto-elemental'&&String(x.params?.element||'').trim().toLocaleLowerCase('pt-BR')===chosen);if(duplicate){notify('Adepto Elemental precisa usar um elemento diferente em cada escolha.');el.value=t.params.element||'';return}}
      t.params[key]=el.value;if(t.talentId==='aumento-atributo'&&key==='attribute1')delete t.params.attribute;syncCurrentCaps();save();renderSheet()});
    document.querySelectorAll('[data-talent-notes]').forEach(el=>el.onchange=()=>{const t=state.talents.find(x=>x.id===el.dataset.talentNotes);if(t){t.notes=el.value;save()}})
  }
'''
s,n=re.subn(r"  function bindTalents\(\)\{.*?\n  function bindLegacy\(\)\{",bind_func+"  function bindLegacy(){",s,count=1,flags=re.S)
if n!=1: raise SystemExit(f'Falha ao substituir bindTalents: {n}')

path.write_text(s,encoding='utf-8')
