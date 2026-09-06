
(()=>{
  const pages=window.GUIA_CONTENT||{};
  const searchIndex=window.GUIA_SEARCH||[];
  const content=document.querySelector('#content');
  const title=document.querySelector('#pageTitle');
  const eyebrow=document.querySelector('#pageEyebrow');
  const sectionNav=document.querySelector('#sectionNav');
  const search=document.querySelector('#globalSearch');
  const results=document.querySelector('#searchResults');
  const sidebar=document.querySelector('#sidebar');
  const scrim=document.querySelector('#scrim');
  const sidebarCollapse=document.querySelector('#sidebarCollapse');
  const toTop=document.querySelector('#toTop');
  const labels={sistema:'ARCHIVVM · SISTEMA',crafting:'ARS · PRODUÇÃO',roma:'ROMA · LORE',magia:'ARS ARCANA',deuses:'PANTHEON · ROMA'};
  let current='sistema';
  let deityFocus=null;

  const norm=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function closeMenu(){sidebar.classList.remove('open');scrim.classList.remove('show')}

  const visualMap={
    poderes:['assets/visual/banner-sistema.webp','Sistema de jogo'],
    legados:['assets/visual/banner-legados.webp','Legados'],
    reclamacao:['assets/visual/reclamacoes.webp','Reclamação'],
    criacao:['assets/visual/atributos.webp','Atributos'],
    recursos:['assets/visual/banner-status.webp','Status'],
    treinos:['assets/visual/banner-treinamento.webp','Treinamento'],
    combate:['assets/visual/banner-combate.webp','Combate'],
    condicoes:['assets/visual/banner-condicoes.webp','Condições'],
    hierarquia:['assets/visual/hierarquia.webp','Hierarquia'],
    afinidade:['assets/visual/afinidade.webp','Afinidade'],
    'casa-lobo':['assets/visual/sobre-casa-lobo.webp','Casa do Lobo'],
    coortes:['assets/visual/sobre-coortes.webp','Coortes'],
    'nova-roma':['assets/visual/sobre-nova-roma.webp','Nova Roma'],
  };
  const pantheonVisuals={
    triunviros:['assets/visual/deuses-triunviros.webp','Triúnviros'],
    'dii-consentis':['assets/visual/deuses-dii-consentis.webp','Dii Consentis'],
    'dii-inferi':['assets/visual/deuses-dii-inferi.webp','Dii Inferi'],
    alati:['assets/visual/deuses-alati.webp','Alati'],
    ventis:['assets/visual/deuses-ventis.webp','Ventis'],
    numina:['assets/visual/deuses-numina.webp','Numina']
  };
  const openingVisuals={
    crafting:['assets/visual/banner-crafting-custom.webp','Crafting'],
    magia:['assets/visual/magia-hero.webp','Magia'],
    roma:['assets/visual/roma-hero.webp','Sobre Roma'],
    deuses:['assets/visual/deuses-triunviros.webp','Panteão romano']
  };
  function addImage(el,src,alt,cls){
    if(!el||el.querySelector(':scope > img.'+cls)) return;
    const img=document.createElement('img');img.className=cls;img.src=src;img.alt=alt;img.loading='eager';img.decoding='async';
    el.prepend(img);
  }
  function enhanceVisuals(){
    // Sistema: banner principal real, sem crop.
    if(current==='sistema' && !content.querySelector(':scope > .system-hero-media')){
      const fig=document.createElement('figure');fig.className='system-hero-media';
      fig.innerHTML='<img src="assets/visual/legio.webp" alt="Legio XII Fulminata">';
      content.prepend(fig);
    }
    if(current==='sistema' && !content.querySelector(':scope > .system-sheet-cta')){
      const cta=document.createElement('a');
      cta.className='system-sheet-cta';
      cta.href='https://stsedd.github.io/ficha-oficial-duodecima-rpg/';
      cta.target='_blank';cta.rel='noopener noreferrer';
      cta.innerHTML=`<span class="system-sheet-cta__sigil">XII</span><span class="system-sheet-cta__copy"><small>FICHA OFICIAL DA DUODÉCIMA</small><strong>Monte sua ficha aqui</strong><em>Escolha sua prole, acompanhe recursos, talentos, poderes e progressão em uma ficha integrada ao sistema.</em></span><span class="system-sheet-cta__action">ABRIR CRIADOR <b>↗</b></span>`;
      const hero=content.querySelector(':scope > .system-hero-media');
      if(hero) hero.after(cta); else content.prepend(cta);
    }
    // Aberturas principais. A imagem é elemento real para nunca ser cortada.
    const open=content.querySelector(':scope > .gods-opening,:scope > .crafting-opening,:scope > .magic-opening,:scope > .about-opening');
    if(open && openingVisuals[current]) addImage(open,...openingVisuals[current],'opening-visual');
    // Banners horizontais das seções.
    content.querySelectorAll('.section[id]').forEach(sec=>{
      const info=visualMap[sec.id];
      const strip=sec.querySelector(':scope > .banner-strip');
      if(info && strip) addImage(strip,...info,'section-banner-img');
      if(info && !strip && ['casa-lobo','coortes','nova-roma'].includes(sec.id)){
        const fig=document.createElement('figure');fig.className='section-visual';
        fig.innerHTML=`<img src="${info[0]}" alt="${info[1]}">`;
        sec.prepend(fig);
      }
    });
    // Outros panteões em Sobre Roma usa o banner horizontal próprio.
    if(current==='roma'){
      const sec=content.querySelector('#panteoes');
      if(sec && !sec.querySelector(':scope > .section-visual')){
        const fig=document.createElement('figure');fig.className='section-visual';
        fig.innerHTML='<img src="assets/visual/sobre-panteoes.webp" alt="Outros panteões">';
        sec.prepend(fig);
      }
    }
    // Banners dos grupos divinos: arte quadrada inteira + texto, sem cover.
    if(current==='deuses'){
      Object.entries(pantheonVisuals).forEach(([id,info])=>{
        const banner=content.querySelector(`#${CSS.escape(id)} .pantheon-banner`);
        if(!banner) return;
        const media=banner.querySelector(':scope > figure')||banner;
        addImage(media,...info,'pantheon-art');
      });
    }
  }

  const TALENT_GROUPS={
    combate:/ataque|duelista|campe[aã]o|mestre das armas|gambito|comandante|descuidado/i,
    defesa:/defensor|interceptador|resiliente|bruto|[áa]gil|escudos|corpo saud[aá]vel|dur[aá]vel/i,
    pericia:/expert|perito|l[ií]ngua de prata|pau pra toda obra|aumento de atributo/i,
    suporte:/curandeiro|chef|querido|inspirado/i,
    magia:/magia|m[aá]gico|elemental|habilidades|invocador/i
  };
  function talentGroup(name){for(const [k,re] of Object.entries(TALENT_GROUPS))if(re.test(name))return k;return 'utilidade';}
  function addSectionChrome(){
    content.querySelectorAll(':scope > .section[id]').forEach((sec,i)=>{
      const head=sec.querySelector(':scope > .section-head'); if(!head)return;
      sec.style.setProperty('--section-index',String(i+1).padStart(2,'0'));
      if(!head.querySelector('.section-rule')){const line=document.createElement('span');line.className='section-rule';head.append(line);}
    });
  }
  function enhanceSkills(){
    const sec=content.querySelector('#pericias'); if(!sec)return;
    const grid=sec.querySelector('.skill-grid'); if(!grid)return;
    if(!sec.querySelector('.skill-legend')){
      const legend=document.createElement('div');legend.className='skill-legend';legend.innerHTML=`
        <span class="tone-for"><i>FOR</i>Força</span><span class="tone-des"><i>DES</i>Destreza</span><span class="tone-con"><i>CON</i>Constituição</span>
        <span class="tone-int"><i>INT</i>Inteligência</span><span class="tone-fe"><i>FÉ</i>Fé</span><span class="tone-car"><i>CAR</i>Carisma</span>`;
      grid.before(legend);
    }
  }
  function enhanceResources(){
    const sec=content.querySelector('#recursos'); if(!sec)return;
    const table=sec.querySelector('.table-wrap table');
    if(table && !sec.querySelector('.sanity-scale')){
      const rows=[...table.querySelectorAll('tbody tr')];
      const scale=document.createElement('div');scale.className='sanity-scale';
      scale.innerHTML=rows.map((r,i)=>{const c=[...r.children].map(x=>x.innerHTML);return `<article data-band="${i}"><b>${c[0]}</b><strong>${c[1]}</strong><p>${c[2]}</p></article>`}).join('');
      table.closest('.table-wrap').replaceWith(scale);
    }
  }
  function enhanceProgressions(){
    const milestones=content.querySelector('#talentos .milestones');
    if(milestones && !milestones.dataset.enhanced){
      milestones.dataset.enhanced='1'; const labels=['INÍCIO','II','III','IV'];
      [...milestones.children].forEach((n,i)=>{n.innerHTML=`<b>${n.textContent.trim()}</b><small>${labels[i]}</small>`;});
    }
    const bp=content.querySelector('#prof .bp-list');
    if(bp) bp.classList.add('progress-track');
    const train=content.querySelector('#treinos .feature');
    if(train && !content.querySelector('#treinos .stake-track')){
      const track=document.createElement('div');track.className='stake-track';track.innerHTML=`<span><b>0–15</b><small>INICIAL</small></span><span><b>16–29</b><small>INTERMEDIÁRIO</small></span><span><b>30+</b><small>DOMÍNIO</small></span>`;
      train.after(track);
    }
  }
  function enhanceTalents(){
    const grid=content.querySelector('#talentos .talent-grid-full'); if(!grid)return;
    [...grid.children].forEach(card=>{
      const h=card.querySelector('h3'); if(!h)return;
      const requirement=h.querySelector('span'); if(requirement) requirement.classList.add('talent-level');
      if(!card.querySelector('.talent-meta')){
        const name=[...h.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim()||h.textContent.trim();
        const text=card.textContent;
        const meta=document.createElement('div');meta.className='talent-meta';
        const group=talentGroup(name);const unique=card.dataset.repeatable==='false'||/s[oó] pode ser escolhido uma vez/i.test(text);meta.innerHTML=`<span class="talent-kind kind-${group}">${group.toUpperCase()}</span>${unique?'<span class="talent-once">ÚNICO</span>':''}`;
        card.append(meta);
      }
    });
  }
  function enhanceConditions(){
    const sec=content.querySelector('#condicoes'); if(!sec)return;
    const list=sec.querySelector('.condition-list'); if(!list)return;
    if(!sec.querySelector('.condition-toolbar')){
      const bar=document.createElement('div');bar.className='condition-toolbar';bar.innerHTML='<input type="search" placeholder="Buscar condição…" aria-label="Buscar condição"><button type="button">Recolher todas</button>';
      list.before(bar);
      const input=bar.querySelector('input');input.addEventListener('input',()=>{const q=norm(input.value);[...list.children].forEach(d=>d.hidden=q&&!norm(d.textContent).includes(q));});
      bar.querySelector('button').addEventListener('click',e=>{const any=[...list.querySelectorAll('details')].some(d=>d.open);list.querySelectorAll('details').forEach(d=>d.open=!any);e.currentTarget.textContent=any?'Expandir todas':'Recolher todas';});
    }
  }
  function enhanceAffinity(){
    const sec=content.querySelector('#afinidade'); if(!sec)return;
    const scale=sec.querySelector('.affinity-scale'); if(scale && !sec.querySelector('.affinity-axis')){
      const axis=document.createElement('div');axis.className='affinity-axis';axis.innerHTML='<span><b>−100</b><small>ÓDIO</small></span><span><b>−50</b><small>INIMIZADE</small></span><span><b>−25</b><small>DESCONFIANÇA</small></span><span><b>0</b><small>NEUTRO</small></span><span><b>+30</b><small>RECONHECIMENTO</small></span><span><b>+60</b><small>CONFIANÇA</small></span><span><b>+100</b><small>VÍNCULO</small></span>';
      scale.before(axis);
    }
  }
  function enhancePantheonFilters(){
    if(current!=='deuses')return;
    const sec=content.querySelector('#panteoes'); if(!sec)return;
    if(!sec.querySelector('.pantheon-filter')){
      const filter=document.createElement('div');filter.className='pantheon-filter';
      filter.innerHTML='<button class="active" data-pfilter="all">Todos</button><button data-pfilter="triunviros">Triúnviros</button><button data-pfilter="dii-consentis">Consentis</button><button data-pfilter="dii-inferi">Inferi</button><button data-pfilter="alati">Alati</button><button data-pfilter="ventis">Ventis</button><button data-pfilter="numina">Numina</button>';
      const grid=sec.querySelector('.pantheon-grid');grid?.before(filter);
      filter.addEventListener('click',e=>{const b=e.target.closest('[data-pfilter]');if(!b)return;filter.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));const id=b.dataset.pfilter;if(id==='all'){content.querySelectorAll('.pantheon-section').forEach(x=>x.hidden=false);sec.querySelectorAll('.pantheon-card').forEach(x=>x.hidden=false);}else{content.querySelectorAll('.pantheon-section').forEach(x=>x.hidden=x.id!==id);sec.querySelectorAll('.pantheon-card').forEach(x=>x.hidden=!(x.getAttribute('href')||'').includes('#'+id));content.querySelector('#'+CSS.escape(id))?.scrollIntoView({behavior:'smooth',block:'start'});}});
    }
  }
  function enhanceDeityAbilities(){
    if(current!=='deuses')return;
    content.querySelectorAll('.deity-ability').forEach(d=>{
      const body=d.querySelector('.ability-body'); if(!body||body.dataset.enhanced)return;body.dataset.enhanced='1';
      [...body.querySelectorAll('p')].forEach(p=>{const m=p.innerHTML.match(/^<strong>(0-15|16-29|30\+):<\/strong>\s*(.*)$/i);if(m){p.classList.add('stake-line');p.dataset.stake=m[1];p.innerHTML=`<span>${m[1]}</span><em>${m[2]}</em>`;}});
      const summary=d.querySelector('summary'); const type=summary?.querySelector('b'); if(type)type.classList.add('ability-type');
    });
  }
  function enhanceJobs(){content.querySelectorAll('.job-grid>article').forEach((x,i)=>{if(!x.dataset.job)x.dataset.job=String(i+1).padStart(2,'0');});}
  function enhanceFamiliars(){content.querySelectorAll('#familiares .familiar-grid>article').forEach((x,i)=>x.style.setProperty('--familiar-index',String(i+1).padStart(2,'0')));}
  function enhanceMagic(){
    const circles=content.querySelector('#circulos .circle-grid'); if(circles)circles.classList.add('progression-circles');
    content.querySelectorAll('#alta-magia .high-magic-grid>article').forEach(x=>x.classList.add('arcane-card'));
  }
  function enhanceCrafting(){content.querySelectorAll('.material-grid>article').forEach((x,i)=>x.style.setProperty('--material-index',String(i+1).padStart(2,'0')));}
  function enhanceRoma(){content.querySelectorAll('#liderancas .leader-card').forEach((x,i)=>x.style.setProperty('--leader-index',String(i+1).padStart(2,'0')));}
  function enhanceInterface(){
    addSectionChrome();enhanceSkills();enhanceResources();enhanceProgressions();enhanceTalents();enhanceConditions();enhanceAffinity();enhancePantheonFilters();enhanceDeityAbilities();enhanceJobs();enhanceFamiliars();enhanceMagic();enhanceCrafting();enhanceRoma();
  }
  function fixInternalLinks(){
    content.querySelectorAll('a[href]').forEach(a=>{
      const href=(a.getAttribute('href')||'').replace(/\\/g,'');
      if(href==='sobre-roma/#estrangeiros') a.setAttribute('href','#page:roma:estrangeiros');
      if(href==='crafting/'||href==='crafting') a.setAttribute('href','#page:crafting');
    });
  }
  function sectionTitle(sec){
    const h=sec.querySelector('h2,h1'); if(h) return h.textContent.trim();
    return (sec.dataset.title||sec.id||'Seção').replace(/-/g,' ');
  }
  function rebuildSectionNav(){
    sectionNav.innerHTML='';
    [...content.querySelectorAll(':scope > .section[id]')].filter(s=>!s.classList.contains('deity-detail')).forEach(sec=>{
      const a=document.createElement('a');a.href='#'+sec.id;a.textContent=sectionTitle(sec);sectionNav.append(a);
    });
    if(current==='deuses'){
      const sep=document.createElement('div'); sep.className='sidebar-divider'; sectionNav.append(sep);
      const a=document.createElement('a');a.href='#panteoes';a.textContent='Índice dos deuses';sectionNav.append(a);
    }
  }
  function showPage(key, anchor=null, push=true){
    if(!pages[key]) key='sistema';
    current=key; deityFocus=null;
    content.className=`content page-${key}`;
    content.innerHTML=pages[key].html;
    fixInternalLinks();
    enhanceVisuals();
    enhanceInterface();
    title.textContent=pages[key].title;
    eyebrow.textContent=labels[key]||'ARCHIVVM';
    document.title=`${pages[key].title} · Guia da Duodécima`;
    document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===key));
    rebuildSectionNav();
    bindLocalControls();
    if(anchor){requestAnimationFrame(()=>navigateAnchor(anchor,false));} else window.scrollTo({top:0,behavior:'instant'});
    if(push) history.replaceState(null,'',`#page:${key}${anchor?':'+anchor:''}`);
    closeMenu();
  }
  function navigateAnchor(id,push=true){
    id=(id||'').replace(/^#/,''); if(!id) return;
    if(current==='deuses' && id.startsWith('deus-')){
      deityFocus=id;
      content.classList.add('deity-focus');
      content.querySelectorAll('.deity-detail').forEach(s=>s.hidden=s.id!==id);
      const target=content.querySelector('#'+CSS.escape(id));
      if(target){target.hidden=false;target.scrollIntoView({behavior:'smooth',block:'start'});}
    } else if(current==='deuses' && id==='panteoes'){
      deityFocus=null;content.classList.remove('deity-focus');
      content.querySelectorAll('.deity-detail').forEach(s=>s.hidden=true);
      content.querySelector('#panteoes')?.scrollIntoView({behavior:'smooth'});
    } else {
      let target=content.querySelector('#'+CSS.escape(id));
      if(!target && current==='deuses'){
        const ability=content.querySelector('#'+CSS.escape(id));
        if(ability){const deity=ability.closest('.deity-detail');if(deity){navigateAnchor(deity.id,false);ability.open=true;setTimeout(()=>ability.scrollIntoView({behavior:'smooth',block:'center'}),120);}}
      } else if(target){target.scrollIntoView({behavior:'smooth',block:'start'});}
    }
    if(push) history.replaceState(null,'',`#page:${current}:${id}`);
  }
  function bindLocalControls(){
    content.querySelectorAll('.toggle-abilities').forEach(btn=>btn.addEventListener('click',()=>{
      const box=content.querySelector('#'+CSS.escape(btn.dataset.target||'')); if(!box)return;
      const ds=[...box.querySelectorAll('details')]; const openAll=ds.some(d=>!d.open); ds.forEach(d=>d.open=openAll); btn.textContent=openAll?'Recolher todas':'Expandir todas';
    }));
  }
  document.addEventListener('click',e=>{
    const pageBtn=e.target.closest('[data-page]'); if(pageBtn){showPage(pageBtn.dataset.page);return;}
    const a=e.target.closest('a[href]'); if(!a)return;
    const href=a.getAttribute('href');
    if(href?.startsWith('#page:')){e.preventDefault();const p=href.slice(6).split(':');showPage(p.shift(),p.join(':')||null);return;}
    if(href?.startsWith('#')){e.preventDefault();navigateAnchor(href);closeMenu();}
  });
  document.querySelector('#menuBtn').addEventListener('click',()=>{sidebar.classList.toggle('open');scrim.classList.toggle('show')}); scrim.addEventListener('click',closeMenu);
  if(sidebarCollapse){let stored=false;try{stored=localStorage.getItem('guia_sidebar_collapsed')==='1'}catch{}document.body.classList.toggle('sidebar-collapsed',stored);sidebarCollapse.textContent=stored?'›':'‹';sidebarCollapse.addEventListener('click',()=>{const v=document.body.classList.toggle('sidebar-collapsed');sidebarCollapse.textContent=v?'›':'‹';try{localStorage.setItem('guia_sidebar_collapsed',v?'1':'0')}catch{}});}
  if(toTop){window.addEventListener('scroll',()=>toTop.classList.toggle('show',scrollY>700),{passive:true});toTop.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));}

  function doSearch(q){
    q=norm(q.trim()); if(q.length<2){results.hidden=true;results.innerHTML='';return;}
    const tokens=q.split(/\s+/).filter(Boolean);
    const found=[];
    for(const item of searchIndex){const hay=norm(item.title+' '+item.text);if(tokens.every(t=>hay.includes(t))){let score=tokens.reduce((n,t)=>n+(norm(item.title).includes(t)?5:1),0);found.push({...item,score});}}
    found.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).splice(30);
    results.innerHTML=found.length?found.map((x,i)=>`<button class="search-result" data-result="${i}"><small>${pages[x.page]?.title||x.page}</small><b>${escapeHtml(x.title)}</b></button>`).join(''):'<div class="search-empty">Nada encontrado.</div>';
    results.hidden=false;
    results._items=found;
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  search.addEventListener('input',()=>doSearch(search.value));
  search.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;search.blur();}});
  results.addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(!b)return;const item=results._items?.[+b.dataset.result];if(!item)return;results.hidden=true;search.value='';showPage(item.page,null,true);requestAnimationFrame(()=>{if(item.deity){navigateAnchor(item.deity,false);setTimeout(()=>{const ab=content.querySelector('#'+CSS.escape(item.anchor));if(ab){ab.open=true;ab.scrollIntoView({behavior:'smooth',block:'center'});}},100);}else navigateAnchor(item.anchor);});});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search.focus();search.select();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search-wrap')) results.hidden=true});

  function boot(){
    const raw=location.hash.startsWith('#page:')?location.hash.slice(6):'sistema';
    const [key,...rest]=raw.split(':');showPage(key,rest.join(':')||null,false);
  }
  boot();
})();
