from pathlib import Path

VERSION='v5.15.8-banner-fit'

def replace_once(text, old, new, label):
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly 1 match, found {count}')
    return text.replace(old,new,1)

# CSS: keep the real 4.5:1 geometry at every viewport width and never crop at 100%.
css_path=Path('styles-v511.css')
css=css_path.read_text(encoding='utf-8')
css=replace_once(
    css,
    '  aspect-ratio:4.5/1!important;min-height:0!important;max-height:260px!important;',
    '  aspect-ratio:4.5/1!important;min-height:0!important;max-height:none!important;height:auto!important;',
    'banner max-height'
)
css=replace_once(
    css,
    '  display:block;object-fit:cover!important;transform-origin:center center!important;',
    '  display:block;object-fit:contain!important;transform-origin:center center!important;',
    'published banner object-fit'
)
css=replace_once(
    css,
    '.banner-crop-viewport img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:center center;display:block}',
    '.banner-crop-viewport img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transform-origin:center center;display:block}',
    'crop preview object-fit'
)
css_path.write_text(css,encoding='utf-8')

# Permanent regression test: the real rendered banner must be 4.5:1 on desktop/mobile,
# must have no max-height cap, and 100% must show the whole image.
test_path=Path('scripts/ui-smoke.mjs')
test=test_path.read_text(encoding='utf-8')
needle="""  if(!layout.core)failures.push(`${test.name}: status do Core ausente`);\n\n  const themeButton=page.locator('#themePaletteBtn');\n"""
insert="""  if(!layout.core)failures.push(`${test.name}: status do Core ausente`);\n\n  const bannerCheck=await page.evaluate(async()=>{\n    const cover=document.querySelector('#siteBanner'),img=document.querySelector('#siteBannerImage');\n    if(!cover||!img)return {missing:true};\n    const svg=`<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1800\" height=\"400\" viewBox=\"0 0 1800 400\"><rect width=\"1800\" height=\"400\" fill=\"#d44\"/><rect x=\"0\" width=\"80\" height=\"400\" fill=\"#fff\"/><rect x=\"1720\" width=\"80\" height=\"400\" fill=\"#fff\"/></svg>`;\n    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);\n    img.classList.remove('hidden');\n    img.style.objectPosition='50% 50%';\n    img.style.transform='scale(1)';\n    try{await img.decode()}catch(_){}\n    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));\n    const rect=cover.getBoundingClientRect(),coverStyle=getComputedStyle(cover),imgStyle=getComputedStyle(img);\n    return {missing:false,width:rect.width,height:rect.height,ratio:rect.width/rect.height,maxHeight:coverStyle.maxHeight,objectFit:imgStyle.objectFit};\n  });\n  if(bannerCheck.missing)failures.push(`${test.name}: banner não encontrado`);\n  else{\n    if(Math.abs(bannerCheck.ratio-4.5)>.03)failures.push(`${test.name}: banner 1800x400 renderizou em ${bannerCheck.ratio.toFixed(3)}:1 (${bannerCheck.width.toFixed(1)}x${bannerCheck.height.toFixed(1)})`);\n    if(bannerCheck.maxHeight!=='none')failures.push(`${test.name}: banner ainda tem max-height ${bannerCheck.maxHeight}`);\n    if(bannerCheck.objectFit!=='contain')failures.push(`${test.name}: banner em 100% ainda usa object-fit ${bannerCheck.objectFit}`);\n    await page.screenshot({path:`ui-artifacts/${test.name}-banner-1800x400.png`,fullPage:false});\n  }\n\n  const themeButton=page.locator('#themePaletteBtn');\n"""
if test.count(needle)!=1:
    raise SystemExit(f'ui smoke insertion point: expected 1, found {test.count(needle)}')
test=test.replace(needle,insert,1)
test_path.write_text(test,encoding='utf-8')

Path('VERSION.txt').write_text(VERSION+'\n',encoding='utf-8')

manifest_path=Path('RUNTIME-MANIFEST.md')
manifest=manifest_path.read_text(encoding='utf-8')
note='- `v5.15.8-banner-fit`: remove o limite de 260 px que achatava a capa em telas largas; a área publicada permanece 4,5:1 e o banner em 100% usa `contain`, mostrando a imagem inteira sem crop. O smoke test valida um banner 1800×400 em desktop e mobile.\n'
anchor='## Regra de manutenção\n'
if note not in manifest:
    if anchor not in manifest:
        raise SystemExit('manifest anchor missing')
    manifest=manifest.replace(anchor,note+'\n'+anchor,1)
manifest_path.write_text(manifest,encoding='utf-8')
