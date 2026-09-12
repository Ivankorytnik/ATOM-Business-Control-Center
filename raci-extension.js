(function(){
  const NEW_TEAMS=[
    ['Коммерческий блок','Цели, приоритеты, KPI, управленческие решения и приемка'],
    ['B2B продажи','Корпоративная воронка, проекты, задачи и фактическое исполнение'],
    ['B2C продажи','Розничная воронка, проекты, задачи и фактическое исполнение'],
    ['Маркетинг','Каналы привлечения, кампании, инициативы и маркетинговые KPI'],
    ['Сайт','Формы, точки входа, события и клиентский путь на сайте'],
    ['Метрики','Яндекс Метрика / GA, UTM, атрибуция и цифровые показатели'],
    ['1 линия','Первичный контакт, обращения, статусы и причины обращений'],
    ['2 линия','Квалификация сложных обращений, решения и эскалации'],
    ['ELMA','Лид, квалификация, статусы, обязательные поля и интеграции CRM'],
    ['Альфа-Авто','Продажная воронка после квалификации, договор и выдача'],
    ['1С / финансы','Финансовый факт, оплаты, договорные и учетные показатели'],
    ['DATA / DWH','Сбор, хранение, модель данных, качество и сквозные идентификаторы'],
    ['BI','Витрины, управленческие показатели, визуализация и отчетность'],
    ['ИБ','Права доступа, требования безопасности и допуск в рабочий контур']
  ];
  const TEAM_NAMES=NEW_TEAMS.map(r=>r[0]);

  const DEFAULT_RACI={
    'Коммерческий блок':['A/R','A/R','A','A','A','A','A','A','A','C','A','A'],
    'B2B продажи':['C','C','C','R','R','R','C','R','C','I','R','C'],
    'B2C продажи':['C','C','C','R','R','R','C','R','C','I','R','C'],
    'Маркетинг':['C','C','C','R','R','R','C','R','C','I','R','C'],
    'Сайт':['I','C','C','C','C','I','C','R','I','C','C','I'],
    'Метрики':['I','C','C','C','C','I','R','R','C','C','C','I'],
    '1 линия':['I','C','C','C','R','R','C','R','I','I','R','I'],
    '2 линия':['I','C','C','C','R','R','C','R','I','I','R','I'],
    'ELMA':['I','C','R','C','R','C','C','R','C','C','C','I'],
    'Альфа-Авто':['I','C','R','C','R','C','C','R','C','C','C','I'],
    '1С / финансы':['I','C','C','C','C','C','C','R','C','C','C','I'],
    'DATA / DWH':['C','C','R','C','C','C','R','R','R','R','C','C'],
    'BI':['C','C','C','C','C','C','R','C','R','C','C','C'],
    'ИБ':['C','C','C','I','I','I','I','C','I','A','C','R']
  };

  const STAGE_TEAM={
    '1':'Коммерческий блок',
    '2':'Коммерческий блок',
    '3':'DATA / DWH',
    '4':'Коммерческий блок',
    '5':'Коммерческий блок',
    '6':'Коммерческий блок',
    '7':'BI',
    '8':'Коммерческий блок',
    '9':'BI',
    '10':'DATA / DWH',
    '11':'B2B продажи',
    '12':'Коммерческий блок'
  };

  const ROLE_OPTIONS=['-','R','A','C','I','A/R'];
  const LEGACY_ALIASES={
    'Коммерческий блок':['Коммерческий блок'],
    'B2B продажи':['B2B продажи','Корпоративные продажи'],
    'B2C продажи':['B2C продажи'],
    'Маркетинг':['Маркетинг'],
    'Сайт':['Сайт'],
    'Метрики':['Метрики'],
    '1 линия':['1 линия'],
    '2 линия':['2 линия'],
    'ELMA':['ELMA'],
    'Альфа-Авто':['Альфа-Авто'],
    '1С / финансы':['1С / финансы','1С / Финансы'],
    'DATA / DWH':['DATA / DWH','DATA / BI'],
    'BI':['BI','DATA / BI'],
    'ИБ':['ИБ','Информационная безопасность']
  };

  function cloneDefaultRaci(){
    const out={};
    TEAM_NAMES.forEach(name=>{out[name]={};DATA.stages.forEach((s,i)=>out[name][s.id]=DEFAULT_RACI[name][i]||'-');});
    return out;
  }

  function migrateTeams(){
    const existing=teamOwners();
    const oldNames=Array.isArray(existing.__teamNames)?existing.__teamNames:DATA.teams.map(r=>r[0]);
    const ownerByName={};
    oldNames.forEach((name,i)=>{if(assignedOwner(existing[i]))ownerByName[name]=existing[i];});

    const next={};
    TEAM_NAMES.forEach((name,i)=>{
      const aliases=LEGACY_ALIASES[name]||[name];
      const owner=aliases.map(a=>ownerByName[a]).find(assignedOwner);
      if(owner)next[i]=owner;
    });
    next.__teamNames=[...TEAM_NAMES];

    const saved=existing.__raci&&typeof existing.__raci==='object'?existing.__raci:{};
    const matrix=cloneDefaultRaci();
    TEAM_NAMES.forEach(name=>{
      DATA.stages.forEach(s=>{
        const v=saved?.[name]?.[s.id];
        if(ROLE_OPTIONS.includes(v))matrix[name][s.id]=v;
      });
    });
    next.__raci=matrix;

    const needsMigration=JSON.stringify(existing.__teamNames||[])!==JSON.stringify(TEAM_NAMES)||!existing.__raci;
    if(needsMigration)saveJson(K.teams,next);
  }

  const oldTeamNames=DATA.teams.map(r=>r[0]);
  migrateTeams();
  DATA.teams=NEW_TEAMS.map(r=>[r[0],'',r[1]]);
  DATA.stages.forEach(s=>{if(STAGE_TEAM[s.id])s.team=STAGE_TEAM[s.id];});

  function raciMatrix(){
    const o=teamOwners();
    const saved=o.__raci&&typeof o.__raci==='object'?o.__raci:{};
    const matrix=cloneDefaultRaci();
    TEAM_NAMES.forEach(name=>DATA.stages.forEach(s=>{
      const v=saved?.[name]?.[s.id];
      if(ROLE_OPTIONS.includes(v))matrix[name][s.id]=v;
    }));
    return matrix;
  }

  function roleFor(name,stageId){return raciMatrix()?.[name]?.[stageId]||'-';}
  function hasA(v){return v==='A'||v==='A/R';}
  function hasR(v){return v==='R'||v==='A/R';}
  function stageRaciHealth(stageId,matrix=raciMatrix()){
    const values=TEAM_NAMES.map(n=>matrix[n]?.[stageId]||'-');
    const a=values.filter(hasA).length;
    const r=values.filter(hasR).length;
    return {a,r,valid:a===1&&r>=1};
  }
  function validStagesCount(){const m=raciMatrix();return DATA.stages.filter(s=>stageRaciHealth(s.id,m).valid).length;}

  window.ATOM_BCC_RACI={TEAM_NAMES,raciMatrix,stageRaciHealth};

  teams=function(){
    const owners=teamOwners();
    const matrix=raciMatrix();
    const ownerRows=NEW_TEAMS.map((r,i)=>{
      const ready=assignedOwner(owners[i]);
      return `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td><input class="ownerInput" data-i="${i}" value="${esc(owners[i]||'')}" placeholder="ФИО / роль"></td><td>${ready?badge('Назначен','ok'):badge('Не назначен','bad')}</td></tr>`;
    }).join('');

    const head=DATA.stages.map(s=>{
      const h=stageRaciHealth(s.id,matrix);
      return `<th class="raci-stage-head" title="${esc(s.name)}"><span>${s.id}</span>${h.valid?'<small class="raci-ok">OK</small>':'<small class="raci-bad">!</small>'}</th>`;
    }).join('');

    const matrixRows=TEAM_NAMES.map((name,teamIndex)=>`<tr><td class="raci-team"><b>${esc(name)}</b></td>${DATA.stages.map(s=>`<td class="raci-cell"><select class="raciSelect" data-team="${esc(name)}" data-stage="${s.id}" aria-label="${esc(name)} · ${esc(s.name)}">${ROLE_OPTIONS.map(v=>`<option value="${v}" ${matrix[name][s.id]===v?'selected':''}>${v}</option>`).join('')}</select></td>`).join('')}</tr>`).join('');

    const stagesLegend=DATA.stages.map(s=>{
      const h=stageRaciHealth(s.id,matrix);
      return `<div class="raci-stage-card ${h.valid?'valid':'invalid'}"><b>${s.id}. ${esc(s.name)}</b><small>A: ${h.a} · R: ${h.r}${h.valid?' · корректно':' · нужно исправить'}</small></div>`;
    }).join('');

    return `
      <div class="section-title"><h2>Команды и RACI</h2><small>14 команд · 12 этапов внедрения</small></div>
      <div class="raci-summary">
        <div class="card kpi"><div class="label">Команд</div><div class="value">${TEAM_NAMES.length}</div><div class="sub">полный контур BCC</div></div>
        <div class="card kpi"><div class="label">Владельцы назначены</div><div class="value">${ownerReadyCount()} / ${TEAM_NAMES.length}</div><div class="sub">влияет на общую готовность</div></div>
        <div class="card kpi"><div class="label">Этапы RACI корректны</div><div class="value">${validStagesCount()} / ${DATA.stages.length}</div><div class="sub">1 A и минимум 1 R на этап</div></div>
      </div>

      <div class="section-title"><h2>Владельцы команд</h2><small>Ответственный за взаимодействие команды с проектом</small></div>
      <div class="table-wrap"><table class="table wide"><thead><tr><th>Команда</th><th>Зона участия</th><th>Ответственный</th><th>Готовность</th></tr></thead><tbody>${ownerRows}</tbody></table></div>

      <div class="section-title"><h2>Матрица RACI по этапам</h2><small>R делает · A отвечает · C консультирует · I информируется · A/R отвечает и делает</small></div>
      <div class="callout"><b>Правило:</b> на каждом этапе должен быть ровно один A (или A/R) и минимум один R. Матрица редактируется и сохраняется вместе с владельцами команд.</div>
      <div class="raci-wrap"><table class="raci-table"><thead><tr><th class="raci-team-head">Команда</th>${head}</tr></thead><tbody>${matrixRows}</tbody></table></div>

      <div class="section-title"><h2>Проверка этапов</h2><small>автоматическая валидация RACI</small></div>
      <div class="raci-stage-grid">${stagesLegend}</div>
    `;
  };

  const originalBind=bind;
  bind=function(){
    originalBind();
    document.querySelectorAll('.raciSelect').forEach(el=>el.onchange=()=>{
      const o=teamOwners();
      const matrix=raciMatrix();
      if(!matrix[el.dataset.team])matrix[el.dataset.team]={};
      matrix[el.dataset.team][el.dataset.stage]=el.value;
      o.__teamNames=[...TEAM_NAMES];
      o.__raci=matrix;
      saveJson(K.teams,o);
      render('teams');
    });
  };

  render(currentView);
})();