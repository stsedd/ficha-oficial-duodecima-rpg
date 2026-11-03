(async function testMinimalArmamentarium(){
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({headless:true});
  const problems=[];
  try{
    for(const profile of [
      {name:'desktop',width:1440,height:1000},
      {name:'mobile',width:390,height:844},
      {name:'desktop-large',width:2200,height:1100}
    ]){
      const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height}});
      const page=await ctx.newPage();
      page.on('pageerror',err=>problems.push(profile.name+': JS '+err.message));
      try{
        await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle',timeout:60000});
        await page.waitForSelector('#sheetView:not(.hidden) [data-pane="inventory"] .am-shell',{state:'visible',timeout:25000});
        const pane=page.locator('#sheetView [data-pane="inventory"]');
        if(profile.name==='desktop'){
          const shot=await page.screenshot({type:'jpeg',quality:35,fullPage:false});
          console.log('PREVIEW_VISUAL_JPEG:'+shot.toString('base64'));
        }
        const initial=await pane.evaluate(root=>{
          const l=root.querySelector('.am-list').getBoundingClientRect(),r=root.querySelector('.am-detail').getBoundingClientRect();
          return {count:root.querySelectorAll('.am-item-row').length,panes:root.querySelectorAll('.am-tab').length,
            list:{x:l.x,right:l.right,width:l.width},detail:{x:r.x,width:r.width,visible:getComputedStyle(root.querySelector('.am-detail')).display!=='none'},
            hiddenOriginals:root.querySelector('.am-originals')?.hidden,
            linked:!!root.querySelector('[data-weapon-equipped]')&&!!root.querySelector('[data-item-deck]'),
            used:root.querySelectorAll('.am-chip').length,
            theme:document.body.dataset.theme
          };
        });
        const marker=profile.name+': ';
        if(initial.count!==6||initial.panes!==4||!initial.hiddenOriginals||!initial.linked||initial.used<3)problems.push(marker+'estrutura inadequada '+JSON.stringify(initial));
        if(profile.name==='mobile'){
          if(initial.detail.visible)problems.push(marker+'painel de detalhes visível sem seleção');
        }else if(!(initial.list.right<initial.detail.x))problems.push(marker+'não há duas colunas lado a lado');
        // Abrir um item: no mobile, muda para a vista de detalhe.
        await pane.locator('[data-am-item="item:prev-pocao"]').click();
        if(!(await pane.locator('.am-detail-name').isVisible()))problems.push(marker+'painel não visível após selecionar item');
        const before=await pane.locator('[data-item-card="prev-pocao"] [data-item-field$=":qty"]').inputValue();
        await pane.locator('.am-detail-read .am-text-action').filter({hasText:'Consumir 1'}).click();
        await page.waitForTimeout(150); // O campo original está corretamente oculto fora da edição.
        const after=await pane.locator('[data-item-card="prev-pocao"] [data-item-field$=":qty"]').inputValue();
        if(Number(after)!==Number(before)-1)problems.push(marker+'consumo não diminuiu quantidade '+before+' -> '+after);
        if(profile.name==='mobile')await pane.locator('.am-mobile-back').click();
        await pane.locator('[data-am-mode="heritage"]').click();
        const names=await pane.locator('.am-item-copy strong').allTextContents();
        if(!names.some(n=>n.includes('Anel'))||names.some(n=>n.includes('Corda')))problems.push(marker+'filtragem de heranças: '+JSON.stringify(names));
        await pane.locator('[data-am-mode="all"]').click();
        const searchButton=pane.locator('button[aria-label="Buscar no inventário"]');
        await searchButton.click();
        await pane.locator('.am-search-panel input[type="search"]').fill('Corda');
        const found=await pane.locator('.am-item-copy strong').allTextContents();
        if(found.length!==1||!found[0].includes('Corda'))problems.push(marker+'busca falhou '+JSON.stringify(found));
        await pane.locator('[data-am-item="item:prev-corda"]').click();
        await pane.locator('.am-detail-actions .am-primary').click();
        const editor=pane.locator('.am-edit-view');
        if(!(await editor.isVisible()))problems.push(marker+'editor não abriu');
        if(!(await editor.locator('[data-item-field$=":name"]').isVisible()))problems.push(marker+'campo original de nome não aparece no editor');
        await editor.locator('.am-edit-header button').click();
        await pane.locator('.am-search-panel input[type="search"]').fill('');
        if(profile.name==='mobile')await pane.locator('.am-mobile-back').click();
        await pane.locator('[data-am-item="weapon:prev-gladius"]').click();
        const equippedBefore=await pane.locator('[data-weapon-equipped="prev-gladius"]').isChecked();
        await pane.locator('.am-detail-actions .am-secondary').click();
        await page.waitForTimeout(150); // O controle original fica oculto até clicar em Editar.
        const equippedAfter=await pane.locator('[data-weapon-equipped="prev-gladius"]').isChecked();
        if(equippedBefore===equippedAfter)problems.push(marker+'equipar não alterou o checkbox original');
        await pane.locator('button[aria-label="Adicionar item"]').click();
        if(!(await pane.locator('#inventoryAddKind').isVisible()))problems.push(marker+'adicionar não abre editor original');
        const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,screen:window.innerWidth}));
        if(dimensions.scroll>dimensions.screen+4)problems.push(marker+'overflow horizontal '+JSON.stringify(dimensions));
        await page.screenshot({path:'ui-artifacts/armamentarium-minimal-'+profile.name+'.png',fullPage:false});
        console.log('Armamentarium minimal',profile.name,JSON.stringify({initial,equippedBefore,equippedAfter,quantity:[before,after],width:dimensions}));
      }catch(err){problems.push(profile.name+': '+(err.stack||err.message))}
      await ctx.close();
    }
  }finally{await browser.close()}
  if(problems.length){console.error('Falhas do Armamentarium minimal:\n'+problems.join('\n'));process.exit(1)}
  console.log('✅ Armamentarium minimal: estrutura, mobile, pesquisa, edição, consumo, equipamento e inclusão aprovados.');
})().catch(e=>{console.error(e);process.exit(1)});
