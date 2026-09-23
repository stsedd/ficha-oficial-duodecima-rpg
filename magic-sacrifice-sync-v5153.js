(()=>{
  'use strict';

  const ABBR={for:'FOR',des:'DES',con:'CON'};

  function numberFrom(text){
    const n=Number(String(text??'').replace('−','-'));
    return Number.isFinite(n)?n:null;
  }

  function sacrificeState(){
    const out={};
    document.querySelectorAll('#sheetView .magic-sac-row').forEach(row=>{
      const control=row.querySelector('[data-magic-sac]');
      const key=control?.dataset?.magicSac?.split(':')?.[0];
      if(!ABBR[key])return;
      const copy=row.querySelector('small')?.textContent||'';
      const sacrificeMatch=copy.match(/sacrif[ií]cio\s*[−-]\s*(\d+)/i);
      const finalMatch=copy.match(/final\s*([−-]?\d+)/i);
      const sacrifice=Number(sacrificeMatch?.[1]||0);
      const final=numberFrom(finalMatch?.[1]);
      if(final===null)return;
      out[key]={sacrifice,final};
    });
    return out;
  }

  function syncAttributeCards(){
    const states=sacrificeState();
    if(!Object.keys(states).length)return;

    document.querySelectorAll('#sheetView .attr').forEach(card=>{
      const label=(card.querySelector('.attr-name')?.textContent||'').trim();
      const key=Object.keys(ABBR).find(k=>label.startsWith(`${ABBR[k]} ·`));
      if(!key||!states[key])return;

      const {sacrifice,final}=states[key];
      const total=card.querySelector('.attr-total');
      if(total&&total.textContent!==String(final))total.textContent=String(final);

      const breakdown=card.querySelector('.attr-break');
      if(!breakdown)return;
      let text=breakdown.textContent||'';
      text=text.replace(/\s*·\s*magia\s*[−-]\s*\d+/gi,'');
      if(sacrifice>0)text+=` · magia −${sacrifice}`;

      text=text.replace(/penalidade de sanidade\s*([−-]?\d+)\s*\(efetivo\s*[−-]?\d+\)/i,(_m,rawPenalty)=>{
        const penalty=numberFrom(rawPenalty)??0;
        return `penalidade de sanidade ${rawPenalty} (efetivo ${final+penalty})`;
      });

      if(breakdown.textContent!==text)breakdown.textContent=text;
      card.dataset.magicSacrifice=String(sacrifice);
    });
  }

  function init(){
    const root=document.querySelector('#sheetView');
    if(!root)return;
    let queued=false;
    const refresh=()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        syncAttributeCards();
      });
    };
    syncAttributeCards();
    new MutationObserver(refresh).observe(root,{childList:true,subtree:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
