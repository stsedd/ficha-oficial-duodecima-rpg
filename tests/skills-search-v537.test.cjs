'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const app=read('app-v511.js'),css=read('skills-search-collapse-v537.css'),ui=read('skills-search-collapse-v537.js'),html=read('index.html');
test('all skill controls and calculations survive visual reordering',()=>{
 const start=app.indexOf('function renderSkillMatrix(){'),end=app.indexOf('function renderSkillTrainingCard(){',start);
 const view=app.slice(start,end);
 for(const attr of ['data-skill-manual','data-skill-expertise','data-skill-source','data-skill-detail','skillValue(sk.name)','skillIsProficient','skillHasExpertise']){
  assert.ok(view.includes(attr),attr);
 }
 const flags=view.indexOf('<div class="skill-ledger-flags">');
 const roll=view.indexOf('<strong class="skill-roll-value"',flags);
 const name=view.indexOf('<div class="skill-ledger-name">',roll);
 const details=view.indexOf('<details class="skill-settings">',name);
 assert.ok(flags>=0&&roll>flags&&name>roll&&details>name);
 assert.ok(view.indexOf('<span class="skill-attr-badge"',name)>name);
});
test('responsive columns only appear when the skills container has enough width',()=>{
 assert.match(css,/container-type:inline-size/);
 assert.match(css,/@container duo-skills \(min-width:890px\)/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:780px\)/);
 assert.match(css,/@media\(max-width:370px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('search is keyboard accessible and resolves results to the right pane',()=>{
 assert.match(app,/data-global-search/);
 assert.match(ui,/event\.ctrlKey\|\|event\.metaKey/);
 for(const type of ['Perícia','Habilidade','Item','Arma','Familiar','Magia','Talento'])assert.ok(ui.includes("'"+type+"'"),type);
 assert.match(ui,/querySelector\('\[data-tab="/);
 assert.match(ui,/expandParents\(el\)/);
});
test('collapsible sections default open, and only store UI state in session',()=>{
 assert.match(ui,/sessionStorage\.getItem/);
 assert.match(ui,/sessionStorage\.setItem/);
 assert.match(ui,/===.closed./);
 assert.doesNotMatch(ui,/localStorage\.setItem/);
 for(const selector of ['overview-talents','overview-quick','inventory-toolbar-card','lineage-config-visible'])assert.ok(ui.includes(selector));
 assert.match(ui,/child\.hidden=collapsed/);
});
test('versioned assets are loaded',()=>{
 assert.ok(html.includes('skills-search-collapse-v537.js?v=5.37.0'));
 assert.ok(html.includes('skills-search-collapse-v537.css?v=5.37.2'));
 assert.match(html,/bootstrap-v511\.js\?v=5\.38\.3/);
 assert.match(read('bootstrap-v511.js'),/app-v511\.js\?v=5\.38\.2-/);
});

test('v5.37.1 keeps P/E on the same horizontal line and name beside badge',()=>{
 const fix=css.slice(css.indexOf('/* v5.37.1 — correção de regressão'));
 assert.ok(fix.length>100,'layout regression patch is present');
 assert.match(fix,/\.skill-row-main\s*>\s*\.skill-ledger-flags\s*\{/);
 assert.match(fix,/flex-direction:row!important/);
 assert.match(fix,/\.skill-ledger-row \.skill-ledger-name\s*\{/);
 assert.match(fix,/\.skill-ledger-flags\s*>\s*\.skill-tiny-check\s*\{/);
 assert.match(fix,/min-height:40px!important/);
 assert.match(fix,/\.skill-ledger-flags\s*>\s*\.skill-tiny-check:focus-within/);
 assert.match(fix,/@media\(max-width:550px\)/);
});

test('v5.37.2 groups skills by attributes in balanced columns',()=>{
 const start=app.indexOf('function renderSkillMatrix(){');
 const view=app.slice(start,app.indexOf('function renderSkillTrainingCard(){',start));
 for(const attr of ["key:'for'","key:'con'","key:'fe'","key:'car'","key:'des'","key:'int'"])assert.ok(view.includes(attr),attr);
 for(const group of ['skill-ledger-column','skill-ledger-group','skill-ledger-group-title','skill-ledger-group-rows'])assert.ok(view.includes(group),group);
 assert.match(view,/skills\.filter\(sk=>sk\.attr===group\.key\)\.map\(renderSkillRow\)/);
 assert.match(css,/@container duo-skills \(min-width:650px\)/);
 assert.match(css,/\.skill-ledger-row \.skill-ledger-name \.skill-attr-badge\{\s*display:none!important/);
 assert.match(css,/\.attribute-sidebar \.section-title h3\{[\s\S]*?white-space:nowrap!important/);
 assert.match(css,/@media \(min-width:781px\) and \(max-width:1559px\)/);
});
