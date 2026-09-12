window.DUODECIMA_GODS = [
  {
    "id": "iuppiter",
    "name": "Iuppiter Optimus Maximus",
    "group": "Triunviro",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "for": 1,
      "fe": 1,
      "con": 2
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Intimidação",
      "Atletismo"
    ],
    "notes": [
      "A ficha usa exatamente as bonificações escritas no Guia consolidado atual.",
      "Atualizado em 05/09/2026: bônus iniciais ajustados para +1 Força, +1 Fé e +2 Constituição."
    ],
    "resources": [
      {
        "id": "raiva-trovao",
        "name": "Raiva do Trovão",
        "scope": "personal",
        "max": {
          "type": "levelFormula",
          "formula": "8 + floor(nível/10)"
        },
        "sourceAbilityId": "raiva-trovao",
        "reset": {
          "type": "sceneOrInactivity",
          "text": "Ao final da cena ou após 2 turnos sem combate, conjuração elétrica ou tensão real."
        },
        "thresholds": [
          2,
          4,
          6,
          8,
          10
        ]
      }
    ],
    "resource": {
      "name": "Raiva do Trovão",
      "maxFormula": "8 + floor(nível/10)",
      "scope": "personal"
    }
  },
  {
    "id": "netuno",
    "name": "Netuno",
    "group": "Triunviro",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "fe": 1,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Acrobacia",
      "Atletismo"
    ],
    "notes": [],
    "resources": [
      {
        "id": "mare-crescente",
        "name": "Maré Crescente",
        "scope": "personal",
        "max": {
          "type": "levelFormula",
          "formula": "8 + floor(nível/10)"
        },
        "sourceAbilityId": "mare-crescente",
        "reset": {
          "type": "sceneOrInactivity",
          "text": "Conforme descrito na habilidade; encerra ao fim da cena ou após o período de inatividade indicado."
        },
        "thresholds": [
          2,
          4,
          6,
          7,
          10
        ]
      }
    ],
    "resource": {
      "name": "Maré Crescente",
      "maxFormula": "8 + floor(nível/10)",
      "scope": "personal"
    }
  },
  {
    "id": "plutao",
    "name": "Plutão",
    "group": "Triunviro",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "con": 2,
      "fe": 1,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Intimidação",
      "Intuição"
    ],
    "notes": [],
    "resources": [
      {
        "id": "acumulo-necromantico",
        "name": "Acúmulo Necromântico",
        "scope": "personal",
        "max": {
          "type": "levelFormula",
          "formula": "8 + floor(nível/10)"
        },
        "sourceAbilityId": "acumulo-necro",
        "reset": {
          "type": "sceneOrInactivity",
          "text": "Conforme descrito na habilidade; encerra ao fim da cena ou após o período de inatividade indicado."
        },
        "thresholds": [
          2,
          4,
          6,
          10
        ]
      }
    ],
    "resource": {
      "name": "Acúmulo Necromântico",
      "maxFormula": "8 + floor(nível/10)",
      "scope": "personal"
    }
  },
  {
    "id": "summanus",
    "name": "Summanus",
    "group": "Triunviro",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 22,
    "hpPerDecade": 4,
    "bonuses": {
      "int": 2,
      "fe": 1,
      "des": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Intimidação",
      "Furtividade"
    ],
    "notes": [],
    "resources": [
      {
        "id": "carga-noturna",
        "name": "Carga Noturna",
        "scope": "personal",
        "max": {
          "type": "levelFormula",
          "formula": "8 + floor(nível/10)"
        },
        "sourceAbilityId": "carga-noturna",
        "reset": {
          "type": "sceneOrInactivity",
          "text": "Conforme descrito na habilidade; encerra ao fim da cena ou após o período de inatividade indicado."
        },
        "thresholds": [
          2,
          4,
          6,
          10
        ]
      }
    ],
    "resource": {
      "name": "Carga Noturna",
      "maxFormula": "8 + floor(nível/10)",
      "scope": "personal"
    }
  },
  {
    "id": "vulcano",
    "name": "Vulcano",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "int",
    "hpBase": 33,
    "hpPerDecade": 5,
    "bonuses": {
      "con": 2,
      "for": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Tolerância"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "baco",
    "name": "Baco",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "des": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Tolerância"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "vesta",
    "name": "Vesta",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 25,
    "hpPerDecade": 6,
    "bonuses": {
      "for": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Tolerância"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "mercurio",
    "name": "Mercúrio",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "des",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Mãos Leves"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "febo",
    "name": "Febo",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Atuação",
      "Manipulação",
      "Intimidação",
      "Persuasão"
    ],
    "notes": [],
    "resources": []
  },
  {
    "id": "venus",
    "name": "Vênus",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "des": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Persuasão"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "marte",
    "name": "Marte Ultor",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "con",
    "hpBase": 25,
    "hpPerDecade": 6,
    "bonuses": {
      "for": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Atletismo"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "diana",
    "name": "Diana",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Agilidade"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "ceres",
    "name": "Ceres",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "con": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Natureza"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "juno",
    "name": "Juno Mater",
    "group": "Dii Consentis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intuição"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "fobetor",
    "name": "Fobetor",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "con": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intimidação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "desesperanca",
        "name": "Desesperança",
        "scope": "personal",
        "max": {
          "type": "levelFormula",
          "formula": "5 + floor(nível/10)"
        }
      }
    ],
    "resource": {
      "name": "Desesperança",
      "maxFormula": "5 + floor(nível/10)",
      "scope": "personal"
    }
  },
  {
    "id": "somnos",
    "name": "Somnos",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Conhecimento Mítico"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "fadiga-somnos",
        "name": "Fadiga",
        "scope": "target",
        "max": {
          "type": "fixed",
          "value": 10
        },
        "sourceAbilityId": "toque-letargico",
        "reset": {
          "type": "perTarget",
          "text": "Desaparece no fim da cena ou quando o alvo passa tempo suficiente fora dos efeitos de Somnos; efeitos específicos também podem consumir pontos."
        },
        "thresholds": [
          2,
          3,
          5,
          7,
          10
        ]
      }
    ]
  },
  {
    "id": "somnia",
    "name": "Somnia",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "des": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Manipulação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "esperanca-dourada",
        "name": "Esperança Dourada",
        "scope": "personal",
        "max": {
          "type": "levelFormula",
          "formula": "5 + floor(nível/10)"
        }
      }
    ],
    "resource": {
      "name": "Esperança Dourada",
      "maxFormula": "5 + floor(nível/10)",
      "scope": "personal"
    }
  },
  {
    "id": "fantaso",
    "name": "Fântaso",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intuição"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "letum",
    "name": "Letum",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "for": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intimidação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "ruina",
        "name": "Ruína",
        "scope": "personal",
        "max": {
          "type": "described",
          "formula": "5"
        }
      }
    ],
    "resource": {
      "name": "Ruína",
      "maxFormula": "5",
      "scope": "personal"
    }
  },
  {
    "id": "trivia",
    "name": "Trivia",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "int",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "int": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Conhecimento Mágico"
    ],
    "skillChoice": [],
    "notes": [
      "Trivia só tem filhas mulheres."
    ],
    "resources": []
  },
  {
    "id": "libitina",
    "name": "Libitina",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Conhecimento Religioso"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "laverna",
    "name": "Laverna",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Conhecimento Mágico"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "proserpina",
    "name": "Proserpina",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Natureza"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "carga-crepuscular",
        "name": "Carga Crepuscular",
        "scope": "personal",
        "max": {
          "type": "stakeProgression",
          "progression": [
            {
              "min": 0,
              "max": 15,
              "value": 2
            },
            {
              "min": 16,
              "max": 29,
              "value": 3
            },
            {
              "min": 30,
              "max": null,
              "value": 4
            }
          ]
        },
        "sourceAbilityId": "ciclo-inevitavel",
        "reset": {
          "type": "sceneOrCombat",
          "text": "As cargas desaparecem ao fim da cena ou combate."
        }
      }
    ]
  },
  {
    "id": "mors",
    "name": "Mors",
    "group": "Dii Inferi",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Furtividade"
    ],
    "skillChoice": [],
    "notes": [
      "Tocados por Mors não são filhos diretos: a relação é uma marca recebida no nascimento."
    ],
    "resources": []
  },
  {
    "id": "bellona",
    "name": "Bellona",
    "group": "Alati",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "con",
    "hpBase": 25,
    "hpPerDecade": 7,
    "bonuses": {
      "for": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Atletismo"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "vis",
    "name": "Vis",
    "group": "Alati",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 30,
    "hpPerDecade": 5,
    "bonuses": {
      "for": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intimidação"
    ],
    "skillChoice": [],
    "notes": [
      "Atualizado em 08/09/2026: atributo de conjuração é Fé e a perícia divina inicial é Intimidação."
    ],
    "resources": [
      {
        "id": "imperium",
        "name": "Imperium",
        "scope": "collective",
        "max": {
          "type": "fixed",
          "value": 10
        },
        "sourceAbilityId": "imperium",
        "reset": {
          "type": "scene",
          "text": "Imperium desaparece ao final da cena."
        },
        "sharedKey": "alati-imperium"
      },
      {
        "id": "frenesi-conquista",
        "name": "Frenesi",
        "scope": "ability",
        "max": {
          "type": "fixed",
          "value": 3
        },
        "sourceAbilityId": "frenesi-conquista",
        "reset": {
          "type": "abilityEnd",
          "text": "Todos os pontos desaparecem quando Frenesi de Conquista termina."
        }
      }
    ],
    "resource": {
      "name": "Imperium",
      "maxFormula": "10 (barra coletiva Alati)",
      "scope": "collective"
    }
  },
  {
    "id": "victoria",
    "name": "Victoria",
    "group": "Alati",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Agilidade",
      "Intimidação"
    ],
    "notes": [],
    "resources": [
      {
        "id": "imperium",
        "name": "Imperium",
        "scope": "collective",
        "max": {
          "type": "fixed",
          "value": 10
        },
        "sourceAbilityId": "imperium",
        "reset": {
          "type": "scene",
          "text": "Imperium desaparece ao final da cena."
        },
        "sharedKey": "alati-imperium"
      },
      {
        "id": "momentum-triunfal",
        "name": "Momentum",
        "scope": "ability",
        "max": {
          "type": "fixed",
          "value": 3
        },
        "sourceAbilityId": "momentum-triunfal",
        "reset": {
          "type": "abilityOrInactivity",
          "text": "Os pontos desaparecem após 2 turnos sem sucesso relevante ou quando o efeito os consumir."
        }
      }
    ],
    "resource": {
      "name": "Imperium",
      "maxFormula": "10 (barra coletiva Alati)",
      "scope": "collective"
    }
  },
  {
    "id": "aemulatio",
    "name": "Aemulatio",
    "group": "Alati",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "int",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "int": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Percepção",
      "Estratégia"
    ],
    "notes": [],
    "resources": [
      {
        "id": "imperium",
        "name": "Imperium",
        "scope": "collective",
        "max": {
          "type": "fixed",
          "value": 10
        },
        "sourceAbilityId": "imperium",
        "reset": {
          "type": "scene",
          "text": "Imperium desaparece ao final da cena."
        },
        "sharedKey": "alati-imperium"
      }
    ],
    "resource": {
      "name": "Imperium",
      "maxFormula": "10 (barra coletiva Alati)",
      "scope": "collective"
    }
  },
  {
    "id": "potestas",
    "name": "Potestas",
    "group": "Alati",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 25,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Atletismo",
      "Intimidação"
    ],
    "notes": [],
    "resources": [
      {
        "id": "imperium",
        "name": "Imperium",
        "scope": "collective",
        "max": {
          "type": "fixed",
          "value": 10
        },
        "sourceAbilityId": "imperium",
        "reset": {
          "type": "scene",
          "text": "Imperium desaparece ao final da cena."
        },
        "sharedKey": "alati-imperium"
      },
      {
        "id": "pontos-potestas",
        "name": "Pontos de Potestas",
        "scope": "personal",
        "max": {
          "type": "fixed",
          "value": 3
        },
        "sourceAbilityId": "potestas",
        "reset": {
          "type": "sceneOrSpent",
          "text": "Os pontos desaparecem ao final da cena ou quando forem utilizados."
        }
      }
    ],
    "resource": {
      "name": "Imperium",
      "maxFormula": "10 (barra coletiva Alati)",
      "scope": "collective"
    }
  },
  {
    "id": "aeolos",
    "name": "Aeolos",
    "group": "Ventis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Persuasão"
    ],
    "skillChoice": [],
    "notes": [
      "Aeolos integra o grupo Ventis no Guia consolidado, mas o próprio kit não possui a passiva Dança dos Ventos."
    ],
    "resources": []
  },
  {
    "id": "aquilon",
    "name": "Aquilon",
    "group": "Ventis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intimidação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "danca-dos-ventos",
        "name": "Dança dos Ventos",
        "scope": "collective",
        "max": {
          "type": "described",
          "formula": "20 (barra coletiva)"
        }
      }
    ],
    "resource": {
      "name": "Dança dos Ventos",
      "maxFormula": "20 (barra coletiva)",
      "scope": "collective"
    }
  },
  {
    "id": "auster",
    "name": "Auster",
    "group": "Ventis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "for": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Tolerância"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "danca-dos-ventos",
        "name": "Dança dos Ventos",
        "scope": "collective",
        "max": {
          "type": "described",
          "formula": "20 (barra coletiva)"
        }
      }
    ],
    "resource": {
      "name": "Dança dos Ventos",
      "maxFormula": "20 (barra coletiva)",
      "scope": "collective"
    }
  },
  {
    "id": "favonio",
    "name": "Favônio",
    "group": "Ventis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Natureza"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "danca-dos-ventos",
        "name": "Dança dos Ventos",
        "scope": "collective",
        "max": {
          "type": "described",
          "formula": "20 (barra coletiva)"
        }
      }
    ],
    "resource": {
      "name": "Dança dos Ventos",
      "maxFormula": "20 (barra coletiva)",
      "scope": "collective"
    }
  },
  {
    "id": "vulturnos",
    "name": "Vulturnos",
    "group": "Ventis",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "des": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intimidação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "danca-dos-ventos",
        "name": "Dança dos Ventos",
        "scope": "collective",
        "max": {
          "type": "described",
          "formula": "20 (barra coletiva)"
        }
      }
    ],
    "resource": {
      "name": "Dança dos Ventos",
      "maxFormula": "20 (barra coletiva)",
      "scope": "collective"
    }
  },
  {
    "id": "metus",
    "name": "Metus",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intimidação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "tensao",
        "name": "Tensão",
        "scope": "target",
        "max": {
          "type": "fixed",
          "value": 4
        },
        "sourceAbilityId": "tensao",
        "reset": {
          "type": "perTarget",
          "text": "Cada alvo mantém sua própria Tensão; remove conforme as habilidades de Metus determinarem."
        },
        "thresholds": [
          1,
          2,
          3,
          4
        ]
      }
    ],
    "resource": {
      "name": "Tensão",
      "maxFormula": "4",
      "scope": "target"
    }
  },
  {
    "id": "timor",
    "name": "Timor",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "for": 2,
      "car": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intimidação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "pavor",
        "name": "Pavor",
        "scope": "personal",
        "max": {
          "type": "stakeProgression",
          "progression": [
            {
              "min": 0,
              "max": 15,
              "value": 2
            },
            {
              "min": 16,
              "max": 29,
              "value": 3
            },
            {
              "min": 30,
              "max": null,
              "value": 4
            }
          ]
        },
        "sourceAbilityId": "pavor",
        "reset": {
          "type": "sceneOrCombat",
          "text": "Os pontos desaparecem ao fim da cena ou combate."
        }
      }
    ]
  },
  {
    "id": "angerona",
    "name": "Angerona",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "int": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Percepção"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "fama",
    "name": "Fama",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Conhecimento Histórico"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "arcus",
    "name": "Arcus",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "des": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Etiqueta"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "justitia",
    "name": "Justitia",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intuição"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "invidia",
    "name": "Invidia",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Enganação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": [
      {
        "id": "ressentimento",
        "name": "Ressentimento",
        "scope": "personal",
        "max": {
          "type": "stakeProgression",
          "progression": [
            {
              "min": 0,
              "max": 15,
              "value": 2
            },
            {
              "min": 16,
              "max": 29,
              "value": 3
            },
            {
              "min": 30,
              "max": null,
              "value": 4
            }
          ]
        },
        "sourceAbilityId": "ressentimento",
        "reset": {
          "type": "sceneOrCondition",
          "text": "Os pontos desaparecem ao trocar de Objeto da Inveja ou ao fim da cena."
        }
      }
    ]
  },
  {
    "id": "discordia",
    "name": "Discórdia",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Manipulação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "fortuna",
    "name": "Fortuna",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "des": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Mãos Leves"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "concordia",
    "name": "Concordia",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Persuasão"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "angitia",
    "name": "Angitia",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Medicina"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "juventas",
    "name": "Juventas",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "con": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Medicina"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "cupido-inanis",
    "name": "Cupido Inanis",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 18,
    "hpPerDecade": 4,
    "bonuses": {
      "car": 2,
      "int": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Manipulação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "jano",
    "name": "Jano",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "int",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "int": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Intuição"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "laetitia",
    "name": "Laetitia",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "car",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "car": 2,
      "des": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Atuação"
    ],
    "skillChoice": [],
    "notes": [],
    "resources": []
  },
  {
    "id": "cimopoleia",
    "name": "Cimopoleia",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "fe": 2,
      "con": 1
    },
    "skillBonuses": {},
    "grantedSkills": [],
    "skillChoice": [
      "Sobrevivência",
      "Intimidação"
    ],
    "notes": [
      "Filhos de Cimopoleia são considerados criaturas monstruosas."
    ],
    "resources": []
  },
  {
    "id": "silvano",
    "name": "Protegidos de Silvano",
    "group": "Numina",
    "source": "Duodécima Core · 2026.09.11.1",
    "casting": "fe",
    "hpBase": 20,
    "hpPerDecade": 5,
    "bonuses": {
      "con": 2,
      "fe": 1
    },
    "skillBonuses": {},
    "grantedSkills": [
      "Sobrevivência"
    ],
    "skillChoice": [],
    "notes": [
      "Protegidos de Silvano são ninfas ou espíritos silvestres."
    ],
    "resources": []
  }
];
