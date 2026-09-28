(()=>{
  'use strict';
  const STORAGE_KEY='duodecima_universal_stage4_v24';

  function isRebento(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')?.roma?.rebentoApproved===true}
    catch(_){return false}
  }

  function sync(){
    const active=isRebento();
    document.body.dataset.rebento=active?'true':'false';
  }

  function init(){
    sync();
    let queued=false;
    const queue=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;sync()});
    };
    new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
    document.addEventListener('change',event=>{
      if(event.target?.id==='rebentoApproved'||event.target?.id==='rebentoProfileToggle')setTimeout(sync,0);
    },false);
    window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY)sync()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
