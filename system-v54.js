window.DUODECIMA_SYSTEM = {
  conditions: [
    {name:'Abalado', mechanic:'Condição mental. O efeito exato pode variar conforme a habilidade que a aplicou.'},
    {name:'Agarrado', mechanic:'A criatura está contida por outra força ou criatura; acompanhe o efeito específico que aplicou a condição.'},
    {name:'Apavorado', mechanic:'Condição de medo intenso. O efeito exato pode variar conforme a habilidade que a aplicou.'},
    {name:'Atordoado', mechanic:'Não pode agir e é considerado Desprevenido enquanto a condição durar.', defenseMod:-4},
    {name:'Caído', mechanic:'Ataques corpo a corpo contra o alvo recebem +3; ataques à distância contra ele sofrem -3.'},
    {name:'Cego', mechanic:'Condição de perda de visão. Acompanhe o efeito específico da habilidade ou cena.'},
    {name:'Confuso', mechanic:'Condição mental. Acompanhe a instrução da habilidade ou do narrador que causou a confusão.'},
    {name:'Desprevenido', mechanic:'Sofre -4 em Defesa enquanto estiver Desprevenido.', defenseMod:-4},
    {name:'Desorientado', mechanic:'Sofre -2 em Percepção, Investigação, testes de Destreza e Defesa.', defenseMod:-2, dexRollMod:-2},
    {name:'Enjoado', mechanic:'Condição física. Acompanhe a duração e o efeito indicados pela fonte que a aplicou.'},
    {name:'Enredado', mechanic:'Condição de restrição. Acompanhe o efeito específico da fonte que a aplicou.'},
    {name:'Envenenado', mechanic:'Condição causada por veneno ou toxina. Acompanhe o efeito específico da substância ou habilidade.'},
    {name:'Exausto', mechanic:'Use a trilha de Exaustão 0–6 da ficha: −2 em d20 e −5 m de deslocamento por nível; no nível 5, HP/Energia máximos pela metade; no nível 6, morte.'},
    {name:'Fascinado', mechanic:'Condição de atenção ou encanto forçado. Acompanhe o efeito específico da habilidade.'},
    {name:'Fatigado', mechanic:'Condição de desgaste físico. Não é removida automaticamente por descanso nesta ficha.'},
    {name:'Inconsciente', mechanic:'A criatura não pode agir enquanto estiver inconsciente.'},
    {name:'Incorpóreo', mechanic:'Condição especial de forma incorpórea. Acompanhe os limites descritos pelo efeito que a concedeu.'},
    {name:'Invisível', mechanic:'A criatura não pode ser vista normalmente; acompanhe os efeitos da fonte que concedeu invisibilidade.'},
    {name:'Lento', mechanic:'Condição de redução de mobilidade. A intensidade depende da habilidade que a aplicou.'},
    {name:'Ofuscado', mechanic:'Condição visual. Acompanhe a penalidade indicada pela fonte que a aplicou.'},
    {name:'Paralisado', mechanic:'Defesa passa a 5 enquanto estiver Paralisado.', fixedDefense:5},
    {name:'Pasmo', mechanic:'Condição de hesitação/choque. Acompanhe o efeito específico da fonte que a aplicou.'},
    {name:'Queimando', mechanic:'Dano ou desgaste contínuo por fogo/calor conforme a fonte que aplicou a condição.'},
    {name:'Sangrando', mechanic:'Dano ou desgaste contínuo por sangramento conforme a fonte que aplicou a condição.'},
    {name:'Silenciado', mechanic:'Não pode usar fala clara, comandos verbais ou conjuração verbal enquanto o efeito impedir isso.'},
    {name:'Surdo', mechanic:'Não consegue ouvir normalmente enquanto a condição durar.'},
    {name:'Surpreendido', mechanic:'Condição de surpresa. Acompanhe o efeito narrativo/mecânico definido para a cena.'}
  ],
  materials: [
    {id:'ferro-aco',name:'Ferro / Aço',attack:0,resistance:3,unbreakable:false,armorHint:'Leve'},
    {id:'mithril',name:'Mithril',attack:1,resistance:2,unbreakable:false,armorHint:'Defensiva'},
    {id:'bronze-celestial',name:'Bronze Celestial',attack:1,resistance:4,unbreakable:false,armorHint:'Defensiva'},
    {id:'uro',name:'Uro',attack:2,resistance:5,unbreakable:false,armorHint:'Responsiva'},
    {id:'ouro-imperial',name:'Ouro Imperial',attack:3,resistance:null,unbreakable:true,armorHint:'Sem armadura/escudo complexo'},
    {id:'ferro-estigio',name:'Ferro Estígio',attack:3,resistance:null,unbreakable:true,armorHint:'Não é normalmente forjável'}
  ],
  armorTypes: [
    {id:'nenhuma',name:'Sem armadura',defense:0,reduction:0},
    {id:'leve',name:'Leve',defense:1,reduction:1},
    {id:'defensiva',name:'Defensiva',defense:2,reduction:1},
    {id:'responsiva',name:'Responsiva',defense:1,reduction:2},
    {id:'pesada',name:'Pesada',defense:2,reduction:2}
  ],
  weaponTypes: [
    {id:'corpo-a-corpo',name:'Corpo a corpo',die:8},
    {id:'distancia',name:'À distância',die:6},
    {id:'desarmado',name:'Desarmado / improvisado',die:6}
  ]
};
