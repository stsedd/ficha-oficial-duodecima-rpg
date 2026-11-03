(async function previewInventorySmokeV538(){
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({headless:true});
  const failures=[];
  try{
    for(const test of [
      {name:'desktop',viewport:{width:1440,height:900}},
      {name:'mobile',viewport:{width:390,height:844}}
    ]){
      const context=await browser.newContext({viewport:test.viewport});
      const page=await context.newPage();
      page.on('pageerror',e=>failures.push(test.name+' JS: '+e.message));
      try{
        await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle',timeout:60000});
        await page.waitForSelector('#sheetView:not(.hidden) [data-pane="inventory"] .duo-preview-banner',{state:'visible',timeout:25000});
        const pane=page.locator('#sheetView [data-pane="inventory"]');
        const before=await pane.evaluate(el=>({
          title:el.querySelector('.duo-preview-banner-title')?.textContent,
          mode:el.dataset.previewMode,
          tabs:el.querySelectorAll('.duo-preview-tab').length,
          weapons:el.querySelectorAll('[data-weapon-card]').length,
          items:el.querySelectorAll('[data-item-card]').length,
          editorHidden:el.querySelector('[data-weapon-card] .duo-preview-card-editor')?.hidden,
          hasOriginalCheckbox:!!el.querySelector('[data-weapon-card] [data-weapon-equipped]'),
          hasOriginalStats:!!el.querySelector('[data-weapon-card] .weapon-results')
        }));
        if(before.title!=='Inventário'||before.tabs!==3||before.weapons<2||before.items<3)failures.push(test.name+': preview ou exemplo incompleto: '+JSON.stringify(before));
        if(!before.editorHidden||!before.hasOriginalCheckbox||!before.hasOriginalStats)failures.push(test.name+': editor/campos originais não preservados');
        const weapon=pane.locator('[data-weapon-card]').first();
        await weapon.locator('.duo-preview-expand').click();
        if(!(await weapon.locator('.duo-preview-card-editor').isVisible()))failures.push(test.name+': expansão de arma não funciona');
        if(!(await weapon.locator('[data-weapon-field$=":name"]').isVisible()))failures.push(test.name+': editor de nome de arma não aparece');
        await pane.locator('.duo-preview-tab[data-preview-mode="items"]').click();
        const potion=pane.locator('[data-item-card="prev-pocao"]');
        if(!(await potion.isVisible()))failures.push(test.name+': item não aparece na aba de itens');
        const qtyBefore=await potion.locator('[data-item-field$=":qty"]').inputValue();
        const consume=potion.locator('.duo-preview-consume');
        if(!(await consume.isVisible()))failures.push(test.name+': ação rápida de consumo sumiu');
        await consume.click();
        await page.waitForTimeout(250);
        const qtyAfter=await pane.locator('[data-item-card="prev-pocao"] [data-item-field$=":qty"]').inputValue();
        if(Number(qtyAfter)!==Number(qtyBefore)-1)failures.push(test.name+': consumo não decrementou quantidade ('+qtyBefore+' => '+qtyAfter+')');
        await pane.locator('.duo-preview-tab[data-preview-mode="heritage"]').click();
        const heritage=pane.locator('[data-item-card="prev-anel"]');
        if(!(await heritage.isVisible()))failures.push(test.name+': herança não exibida');
        const other=pane.locator('[data-item-card="prev-corda"]');
        if(await other.isVisible())failures.push(test.name+': item comum exibido em heranças');
        await pane.locator('.duo-preview-add').click();
        if(!(await pane.locator('#inventoryAddKind').isVisible()))failures.push(test.name+': criação manual não abre');
        const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,screen:innerWidth}));
        if(width.scroll>width.screen+3)failures.push(test.name+': página com overflow horizontal '+JSON.stringify(width));
        console.log('preview inventory',test.name,JSON.stringify({...before,qtyBefore,qtyAfter,scroll:width.scroll}));
        await page.screenshot({path:'ui-artifacts/preview-inventory-'+test.name+'.png',fullPage:false});
      }catch(e){failures.push(test.name+': '+e.stack)}
      await context.close();
    }
  }finally{await browser.close()}
  if(failures.length){console.error('Falhas no protótipo:\n'+failures.join('\n'));process.exit(1)}
  console.log('Preview isolado de inventário passou em desktop e mobile.');
})().catch(e=>{console.error(e);process.exit(1)});
