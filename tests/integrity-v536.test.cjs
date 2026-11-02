'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const sandbox={window:{}};
vm.runInNewContext(read('integrity-validation-v536.js'),sandbox,{filename:'integrity-validation-v536.js'});
const validate=sandbox.window.DUODECIMA_VALIDATE_SHEET_V536;
const basic=()=>({schemaVersion:24,name:'Teste',isCreated:true,baseAttributes:{for:2},inventory:{items:[]},weapons:[],history:{summary:''}});
test('a normal current character is accepted unchanged',()=>{
 const input=basic();assert.equal(validate(input),input);
});
test('a legacy sheet with a recognizable shape is accepted',()=>{
 const input={schemaVersion:1,baseAttributes:{},name:'Legado'};
 assert.equal(validate(input),input);
});
test('a version-only JSON is rejected',()=>{
 assert.throws(()=>validate({schemaVersion:24}),/incompleto/);
});
test('invalid JSON shapes are rejected before migration',()=>{
 assert.throws(()=>validate({...basic(),weapons:{}}),/weapons/);
 assert.throws(()=>validate({...basic(),inventory:{items:{}}}),/inventário/);
 assert.throws(()=>validate({...basic(),history:[]}),/history/);
});
test('future and missing schema versions are rejected',()=>{
 assert.throws(()=>validate({...basic(),schemaVersion:25}),/Versão/);
 assert.throws(()=>validate({name:'Sem versão'}),/Versão/);
});
test('prototype-pollution keys are rejected, including nested keys',()=>{
 const input=JSON.parse('{"schemaVersion":24,"name":"x","history":{"__proto__":{"polluted":true}}}');
 assert.throws(()=>validate(input),/campo reservado/);
 const constructorKey=JSON.parse('{"schemaVersion":24,"name":"x","constructor":{"prototype":{"evil":1}}}');
 assert.throws(()=>validate(constructorKey),/campo reservado/);
});
test('large files are refused before import',()=>{
 assert.throws(()=>validate(basic(),{byteSize:32*1024*1024+1}),/32 MB/);
 assert.equal(validate(basic(),{byteSize:1024}).name,'Teste');
});
test('import runs validation before choosing a mode and replacing characters',()=>{
 const io=read('io-recovery-v51515.js');
 assert.match(io,/validateSheet\(await parseJsonFile\(file\),file\)/);
 assert.match(io,/const choice=await chooseImportMode\(file,data\)/);
 assert.match(io,/if\(!ok\)throw new Error\('Substituição cancelada/);
});
test('automatic backup retention excludes protected records',()=>{
 const app=read('app-v511.js');
 assert.match(app,/owned\.filter\(x=>!backupIsProtected\(x\)\)/);
 assert.match(app,/automatics\.slice\(SHEET_BACKUP_LIMIT\)/);
 assert.match(app,/if\(backupIsProtected\(entry\)\)/);
 assert.match(app,/stats:backupStats/);
});
test('save failures and successful saves emit status updates',()=>{
 const app=read('app-v511.js');
 assert.match(app,/duodecima:save-status/);
 assert.match(app,/broadcastSaveStatus\('error',err\)/);
 assert.match(app,/DUODECIMA_STORAGE_PERSISTENT=false/);
});
