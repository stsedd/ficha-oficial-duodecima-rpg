from pathlib import Path

VERSION='v5.15.7-image-storage'


def replace_once(text, old, new, label):
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old,new,1)


Path('VERSION.txt').write_text(VERSION+'\n',encoding='utf-8')

# Stabilization must follow the visible version already rendered by index.html
# instead of forcing an old hard-coded build label.
stab_path=Path('stabilization-v516.js')
stab=stab_path.read_text(encoding='utf-8')
stab=replace_once(
    stab,
    "  const DISPLAY_VERSION='v5.15.3-magic-sacrifice';",
    "  const DISPLAY_VERSION=(()=>{const chip=document.querySelector('.version-chip'),current=chip?.textContent?.trim()||'';return /^v\\d+\\.\\d+(?:\\.\\d+)?(?:[-\\w.]*)?$/i.test(current)?current:'v5.15.7-image-storage'})();",
    'stabilization display version'
)
stab_path.write_text(stab,encoding='utf-8')

app_path=Path('app-v511.js')
app=app_path.read_text(encoding='utf-8')

app=replace_once(
    app,
    "  function save(){state.schemaVersion=SCHEMA_VERSION;state.updatedAt=new Date().toISOString();safeStorage.setItem(STORAGE_KEY,JSON.stringify(state))}",
    "  function save(){state.schemaVersion=SCHEMA_VERSION;state.updatedAt=new Date().toISOString();try{safeStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch(err){console.error('[Ficha] Falha ao salvar a ficha localmente.',err);notify('A ficha atingiu o limite de armazenamento deste navegador. Remova imagens antigas ou exporte o JSON antes de continuar.');return false}}",
    'safe save'
)

old_images=(
"  function readImageToHistory(file,key){if(!file)return;const reader=new FileReader();reader.onload=()=>{state.history[key]=String(reader.result||'');save();renderSheet();notify(key==='portraitUrl'?'Retrato atualizado.':'Banner atualizado.')};reader.readAsDataURL(file)}\n"
"  function chooseStoredImage(onReady){\n"
"    const input=document.createElement('input');input.type='file';input.accept='image/*';\n"
"    input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const src=String(reader.result||'');const img=new Image();img.onload=()=>{try{const max=1000,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));canvas.height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);const compact=canvas.toDataURL('image/webp',.82);onReady(compact&&compact!=='data:,'?compact:src)}catch(err){onReady(src)}};img.onerror=()=>onReady(src);img.src=src};reader.readAsDataURL(file)};input.click();\n"
"  }\n"
)

new_images=(
"  function compactDataImage(source,maxDimension=480,targetLength=150000){\n"
"    return new Promise(resolve=>{const src=String(source||'');if(!/^data:image\\//i.test(src)){resolve(src);return}const img=new Image();img.onload=()=>{try{let width=img.naturalWidth||img.width||1,height=img.naturalHeight||img.height||1,scale=Math.min(1,maxDimension/Math.max(width,height));width=Math.max(1,Math.round(width*scale));height=Math.max(1,Math.round(height*scale));const encode=(w,h,q)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');ctx.drawImage(img,0,0,w,h);return canvas.toDataURL('image/webp',q)};let quality=.78,result=encode(width,height,quality);while(result.length>targetLength&&quality>.46){quality-=.08;result=encode(width,height,quality)}if(result.length>targetLength){const shrink=Math.max(.45,Math.min(.92,Math.sqrt(targetLength/result.length)*.92));width=Math.max(1,Math.round(width*shrink));height=Math.max(1,Math.round(height*shrink));result=encode(width,height,.68)}resolve(result&&result!=='data:,'?result:src)}catch(err){console.warn('[Ficha] Não foi possível compactar a imagem.',err);resolve(src)}};img.onerror=()=>resolve(src);img.src=src})\n"
"  }\n"
"  function readImageToHistory(file,key){if(!file)return;const reader=new FileReader();reader.onload=async()=>{const src=String(reader.result||''),isPortrait=key==='portraitUrl',compact=await compactDataImage(src,isPortrait?900:1400,isPortrait?420000:900000),previous=state.history[key];state.history[key]=compact;if(!save()){state.history[key]=previous;return}renderSheet();notify(isPortrait?'Retrato atualizado.':'Banner atualizado.')};reader.readAsDataURL(file)}\n"
"  function chooseStoredImage(onReady){\n"
"    const input=document.createElement('input');input.type='file';input.accept='image/*';\n"
"    input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=async()=>{const src=String(reader.result||''),compact=await compactDataImage(src,480,150000);onReady(compact)};reader.onerror=()=>notify('Não foi possível ler essa imagem.');reader.readAsDataURL(file)};input.click();\n"
"  }\n"
"  async function compactStoredEquipmentImages(){\n"
"    const refs=[state.armor,state.shield,...(state.weapons||[]),...(state.inventory?.items||[])].filter(Boolean);let changed=false;\n"
"    for(const ref of refs){const src=String(ref.imageUrl||'');if(!/^data:image\\//i.test(src)||src.length<=180000)continue;const compact=await compactDataImage(src,480,150000);if(compact&&compact.length<src.length){ref.imageUrl=compact;changed=true}}\n"
"    const portrait=String(state.history?.portraitUrl||'');if(/^data:image\\//i.test(portrait)&&portrait.length>520000){const compact=await compactDataImage(portrait,900,420000);if(compact&&compact.length<portrait.length){state.history.portraitUrl=compact;changed=true}}\n"
"    if(changed){console.info('[Ficha] Imagens antigas compactadas para reduzir o uso de armazenamento local.');save()}\n"
"  }\n"
)

if app.count(old_images)!=1:
    raise SystemExit(f'image helpers: expected exactly 1 block, found {app.count(old_images)}')
app=app.replace(old_images,new_images,1)

replacements=[
    (
        "document.querySelectorAll('[data-upload-item-image]').forEach(b=>b.onclick=()=>{const it=inv.items.find(x=>x.id===b.dataset.uploadItemImage);if(!it)return;chooseStoredImage(url=>{it.imageUrl=url;save();renderSheet();notify('Imagem do item atualizada.')})});",
        "document.querySelectorAll('[data-upload-item-image]').forEach(b=>b.onclick=()=>{const it=inv.items.find(x=>x.id===b.dataset.uploadItemImage);if(!it)return;chooseStoredImage(url=>{const previous=it.imageUrl;it.imageUrl=url;if(!save()){it.imageUrl=previous;return}renderSheet();notify('Imagem do item atualizada.')})});",
        'item image rollback'
    ),
    (
        "const upload=byId('uploadArmorImage');if(upload)upload.onclick=()=>chooseStoredImage(url=>{state.armor.imageUrl=url;save();renderSheet();notify('Imagem da armadura atualizada.')});",
        "const upload=byId('uploadArmorImage');if(upload)upload.onclick=()=>chooseStoredImage(url=>{const previous=state.armor.imageUrl;state.armor.imageUrl=url;if(!save()){state.armor.imageUrl=previous;return}renderSheet();notify('Imagem da armadura atualizada.')});",
        'armor image rollback'
    ),
    (
        "const upload=byId('uploadShieldImage');if(upload)upload.onclick=()=>chooseStoredImage(url=>{state.shield.imageUrl=url;save();renderSheet();notify('Imagem do escudo atualizada.')});",
        "const upload=byId('uploadShieldImage');if(upload)upload.onclick=()=>chooseStoredImage(url=>{const previous=state.shield.imageUrl;state.shield.imageUrl=url;if(!save()){state.shield.imageUrl=previous;return}renderSheet();notify('Imagem do escudo atualizada.')});",
        'shield image rollback'
    ),
    (
        "document.querySelectorAll('[data-upload-weapon-image]').forEach(b=>b.onclick=()=>{const w=state.weapons.find(x=>x.id===b.dataset.uploadWeaponImage);if(!w)return;chooseStoredImage(url=>{w.imageUrl=url;save();renderSheet();notify('Imagem da arma atualizada.')})});",
        "document.querySelectorAll('[data-upload-weapon-image]').forEach(b=>b.onclick=()=>{const w=state.weapons.find(x=>x.id===b.dataset.uploadWeaponImage);if(!w)return;chooseStoredImage(url=>{const previous=w.imageUrl;w.imageUrl=url;if(!save()){w.imageUrl=previous;return}renderSheet();notify('Imagem da arma atualizada.')})});",
        'weapon image rollback'
    ),
]
for old,new,label in replacements:
    app=replace_once(app,old,new,label)

app=replace_once(
    app,
    "  load();\n  await initExclusiveThemes();",
    "  load();\n  await compactStoredEquipmentImages();\n  await initExclusiveThemes();",
    'startup image compaction'
)
app_path.write_text(app,encoding='utf-8')

boot_path=Path('bootstrap-v511.js')
boot=boot_path.read_text(encoding='utf-8')
boot=replace_once(
    boot,
    "script.src = `app-v511.js?v=5.15.5-fortuna-month-reset-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;",
    "script.src = `app-v511.js?v=v5.15.7-image-storage-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;",
    'app cache key'
)
boot=replace_once(
    boot,
    "patch.src=`stabilization-v516.js?v=5.15.3-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;",
    "patch.src=`stabilization-v516.js?v=v5.15.7-image-storage-${encodeURIComponent(window.DUODECIMA_CORE_STATE?.version || 'fallback')}`;",
    'stabilization cache key'
)
boot_path.write_text(boot,encoding='utf-8')

index=Path('index.html')
html=index.read_text(encoding='utf-8')
if 'v5.15.6-banner-ratio' not in html:
    raise SystemExit('current visible version not found in index.html')
html=html.replace('v5.15.6-banner-ratio',VERSION)
index.write_text(html,encoding='utf-8')

sync_path=Path('.github/workflows/sync-index-version.yml')
sync=sync_path.read_text(encoding='utf-8')
if "      - 'VERSION.txt'" not in sync:
    sync=replace_once(
        sync,
        "      - 'scripts/patch-index-version.mjs'\n",
        "      - 'scripts/patch-index-version.mjs'\n      - 'VERSION.txt'\n",
        'VERSION trigger'
    )
sync_path.write_text(sync,encoding='utf-8')

manifest=Path('RUNTIME-MANIFEST.md')
m=manifest.read_text(encoding='utf-8')
note='- `v5.15.7-image-storage`: impede a camada de estabilização de regredir o número de versão e compacta imagens de armamentos antes de salvá-las, incluindo compactação automática das imagens antigas e tratamento de limite do armazenamento local.\n'
anchor='## Regra de manutenção\n'
if note not in m:
    if anchor not in m:
        raise SystemExit('manifest anchor not found')
    m=m.replace(anchor,note+'\n'+anchor,1)
manifest.write_text(m,encoding='utf-8')
