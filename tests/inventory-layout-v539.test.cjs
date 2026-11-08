'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('inventory creation, library, manual controls and search remain separate regions',()=>{
 const app=read('app-v511.js');
 const start=app.indexOf('function renderInventoryTab(){');
 const end=app.indexOf('function ',start+10);
 const view=app.slice(start,end<0?undefined:end);
 for(const selector of ['inventory-toolbar-card card','inventory-toolbar-grid inventory-toolbar-grid--priority','inventory-import-card','inventory-manual-card','inventory-filter-row','inventorySearch','inventoryFilter','inventoryLibrarySelect','inventoryAddKind']){
   assert.ok(view.includes(selector),selector);
 }
 const css=read('inventory-visual-v527.css');
 assert.match(css,/v5\.39\.0 — conserto do layout/);
 assert.match(css,/\.inventory-toolbar-card\.card\s*>\s*\.inventory-toolbar-grid\.inventory-toolbar-grid--priority/);
 assert.match(css,/\.inventory-toolbar-card\.card\s*>\s*\.inventory-filter-row/);
 assert.match(css,/grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(css,/@media\(max-width:840px\)/);
 assert.match(css,/@media\(max-width:540px\)/);
 assert.ok(read('index.html').includes('inventory-visual-v527.css?v=5.39.0'));
});
