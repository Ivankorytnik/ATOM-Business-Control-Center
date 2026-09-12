const API='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/commercial-analytics-api';
const PREFIX='atom-bcc-main-';
const K={
  start:PREFIX+'started-at',
  stages:PREFIX+'stage-statuses',
  teams:PREFIX+'team-owners',
  modules:PREFIX+'module-statuses',
  blockers:PREFIX+'blockers',
  dod:PREFIX+'dod',
  deadlines:PREFIX+'stage-deadlines'
};
const CLOUD_KEYS=Object.values(K);
const LOCAL_META_KEY='atom-bcc-local-meta-v03';

const STAGE_STATUSES=['Не начато','Подготовка','В работе','Ожидание','На согласовании','Блокер','Завершено'];
const MODULE_STATUSES=['Не начато','Проектирование','Разработка','Тестирование','Пилот','Готово','Блокер'];
const BLOCKER_STATUSES=['Открыт','В работе','Ожидаем ответ','На эскалации','Решен','Закрыт'];
const SEVERITY=['Низкая','Средняя','Высокая','Критическая'];
const PROGRESS={
  'Не начато':0,'Подготовка':10,'Проектирование':20,'В работе':45,'Разработка':45,
  'Ожидание':50,'На согласовании':70,'Тестирование':70,'Пилот':85,'Блокер':50,
  'Завершено':100,'Готово':100
};

const DATA={
  goal:'Внедрить единый Business Control Center, в котором руководство и владельцы процессов видят проекты, задачи, встречи, KPI, решения, блокеры и статус исполнения в одном рабочем контуре.',
  stages:[
    {id:'1',name:'Цели, границы и владелец BCC',start:0,end:7,team:'Коммерческий блок'},
    {id:'2',name:'Роли пользователей и RACI',start:0,end:14,team:'Коммерческий блок'},
    {id:'3',name:'Справочники и единая модель статусов',start:7,end:21,team:'IT / разработка'},
    {id:'4',name:'Портфель проектов и инициатив',start:14,end:28,team:'Коммерческий блок'},
    {id:'5',name:'Задачи, сроки и контроль исполнения',start:21,end:35,team:'IT / разработка'},
    {id:'6',name:'Встречи, решения и обязательства',start:28,end:42,team:'Руководители направлений'},
    {id:'7',name:'KPI и управленческие показатели',start:35,end:49,team:'DATA / BI'},
    {id:'8',name:'Блокеры и эскалации',start:42,end:56,team:'Коммерческий блок'},
    {id:'9',name:'Еженедельная управленческая отчетность',start:42,end:63,team:'DATA / BI'},
    {id:'10',name:'Облачная синхронизация и права доступа',start:49,end:70,team:'IT / разработка'},
    {id:'11',name:'Пилот с рабочими командами',start:63,end:84,team:'Руководители направлений'},
    {id:'12',name:'Приемка и переход в рабочий контур',start:84,end:90,team:'Коммерческий блок'}
  ],
  teams:[
    ['Коммерческий блок','A','Приоритеты, KPI, управленческие решения'],
    ['Корпоративные продажи','R/C','Проекты, задачи, фактическое исполнение'],
    ['Маркетинг','R/C','Инициативы, лиды, активности и KPI'],
    ['IT / разработка','R','Архитектура, интеграции, развитие BCC'],
    ['DATA / BI','C/R','Показатели, источники данных, витрины'],
    ['1С / Финансы','C','Финансовые факты и управленческие показатели'],
    ['Информационная безопасность','C/A','Доступы, требования ИБ, допуск в рабочий контур'],
    ['Руководители направлений','R','Актуальность задач, статусов, сроков и решений']
  ],
  modules:[
    ['Проекты','Портфель инициатив, владелец, сроки, готовность'],
    ['Мои задачи','Исполнение, срок, приоритет, просрочка'],
    ['Встречи','Адженда, решения, обязательства, контроль следующей встречи'],
    ['KPI','План, факт, прогноз и отклонения'],
    ['Блокеры','Проблемы, критичность, владелец, срок снятия'],
    ['Решения','Вопросы, которые требуют решения руководителя'],
    ['Команды и RACI','Ответственные и зоны ответственности'],
    ['Отчеты','Недельная сводка: сделано, план, риски, решения'],
    ['Справочники','Управление статусами, ролями, приоритетами и командами'],
    ['Права доступа','Ролевой доступ и разделение видимости данных'],
    ['Облачная синхронизация','Единое состояние между устройствами и пользователями']
  ],
  dod:[
    ['Структура BCC утверждена','Согласованы основные разделы и логика навигации'],
    ['Роли и права доступа определены','Понятно, кто что видит и кто что изменяет'],
    ['Проекты и задачи работают','Проверяется автоматически по статусам модулей «Проекты» и «Мои задачи»'],
    ['Встречи связаны с обязательствами','Проверяется автоматически по статусу модуля «Встречи»'],
    ['KPI имеют план и факт','Проверяется автоматически по статусу модуля «KPI»'],
    ['Блокеры и эскалации работают','Проверяется автоматически по статусу модуля «Блокеры»'],
    ['Справочники редактируются','Проверяется автоматически по статусу модуля «Справочники»'],
    ['Права и синхронизация проверены','Проверяется автоматически по модулям «Права доступа» и «Облачная синхронизация»'],
    ['Пилот проведен минимум на 2 командах','Собрана обратная связь реальных пользователей'],
    ['ИБ дала допуск в рабочий контур','Нет критических замечаний по хранению и доступам'],
    ['Еженедельный отчет формируется из BCC','Проверяется автоматически по статусу модуля «Отчеты»'],
    ['Приемка завершена','Коммерческий директор и владельцы процессов приняли систему']
  ]
};

const AUTO_DOD={
  2:()=>moduleStatus(0)==='Готово'&&moduleStatus(1)==='Готово',
  3:()=>moduleStatus(2)==='Готово',
  4:()=>moduleStatus(3)==='Готово',
  5:()=>moduleStatus(4)==='Готово',
  6:()=>moduleStatus(8)==='Готово',
  7:()=>moduleStatus(9)==='Готово'&&moduleStatus(10)==='Готово',
  10:()=>moduleStatus(7)==='Готово'
};

const app=document.getElementById('app');
let currentView='overview';
let clockTimer=null;
let syncTimer=null;
let hydrated=false;
let pushing=false;
const pendingKeys=new Set();

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const load=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}};
const meta=()=>load(LOCAL_META_KEY,{});
const setMeta=(key,ts)=>{const m=meta();m[key]=ts;localStorage.setItem(LOCAL_META_KEY,JSON.stringify(m));};
const localTs=key=>meta()[key]||'';
const nowIso=()=>new Date().toISOString();

function saveJson(key,value){
  const ts=nowIso();
  localStorage.setItem(key,JSON.stringify(value));
  setMeta(key,ts);
  pendingKeys.add(key);
  scheduleSync();
}
function saveRaw(key,value){
  const ts=nowIso();
  localStorage.setItem(key,String(value));
  setMeta(key,ts);
  pendingKeys.add(key);
  scheduleSync();
}
function setFromRemote(key,value,updatedAt){
  localStorage.setItem(key,value);
  setMeta(key,updatedAt||nowIso());
}

const started=()=>Boolean(localStorage.getItem(K.start));
const stageStatuses=()=>load(K.stages,{});
const teamOwners=()=>load(K.teams,{});
const moduleStatuses=()=>load(K.modules,{});
const blockers=()=>load(K.blockers,[]);
const dodManual=()=>load(K.dod,{});
const deadlineOverrides=()=>load(K.deadlines,{});

const stageStatus=id=>stageStatuses()[id]||'Не начато';
const moduleStatus=i=>moduleStatuses()[i]||'Не начато';
const stageProgress=id=>started()?(PROGRESS[stageStatus(id)]||0):0;
const stageScore=()=>started()?Math.round(DATA.stages.reduce((sum,s)=>sum+stageProgress(s.id),0)/DATA.stages.length):0;
const moduleScore=()=>Math.round(DATA.modules.reduce((sum,_,i)=>sum+(PROGRESS[moduleStatus(i)]||0),0)/DATA.modules.length);
const assignedOwner=v=>Boolean(v&&String(v).trim()&&String(v).trim()!=='Не назначен');
const ownerReadyCount=()=>DATA.teams.filter((_,i)=>assignedOwner(teamOwners()[i])).length;
const ownerScore=()=>Math.round(ownerReadyCount()/DATA.teams.length*100);
const dodDone=i=>AUTO_DOD[i]?Boolean(AUTO_DOD[i]()):Boolean(dodManual()[i]);
const dodReadyCount=()=>DATA.dod.filter((_,i)=>dodDone(i)).length;
const dodScore=()=>Math.round(dodReadyCount()/DATA.dod.length*100);
const implementationReadiness=()=>started()?Math.round(stageScore()*.5+moduleScore()*.25+ownerScore()*.1+dodScore()*.15):0;

const activeBlockers=()=>blockers().filter(x=>!['Решен','Закрыт'].includes(x.status));
const criticalBlockers=()=>activeBlockers().filter(x=>x.severity==='Критическая').length;
const incompleteBlockers=()=>activeBlockers().filter(x=>!assignedOwner(x.owner)||!x.due).length;

function localDateString(ms){
  const d=new Date(Number(ms));
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
}
function dateEndMs(iso){return new Date(`${iso}T23:59:59`).getTime();}
function dateStartMs(iso){return new Date(`${iso}T00:00:00`).getTime();}
function fmtDate(ms){return new Intl.DateTimeFormat('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit'}).format(new Date(Number(ms)));}
function fmtStart(ms){return new Intl.DateTimeFormat('ru-RU',{dateStyle:'medium',timeStyle:'medium'}).format(new Date(Number(ms)));}
function addDays(ms,days){return Number(ms)+days*86400000;}
function projectBase(){return started()?Number(localStorage.getItem(K.start)):Date.now();}
function planStartMs(stage){return addDays(projectBase(),stage.start);}
function planEndMs(stage){return addDays(projectBase(),stage.end);}
function planEndIso(stage){return localDateString(planEndMs(stage));}
function stageDeadlineIso(stage){return deadlineOverrides()[stage.id]||planEndIso(stage);}
function stageDeadlineMs(stage){return dateEndMs(stageDeadlineIso(stage));}
function extendedDays(stage){const custom=deadlineOverrides()[stage.id];if(!custom)return 0;return Math.round((dateStartMs(custom)-dateStartMs(planEndIso(stage)))/86400000);}
function stageOverdue(stage){return started()&&stageStatus(stage.id)!=='Завершено'&&Date.now()>stageDeadlineMs(stage);}
function overdueStages(){return DATA.stages.filter(stageOverdue);}
function blockerOverdue(b){return b.due&&!['Решен','Закрыт'].includes(b.status)&&Date.now()>dateEndMs(b.due);}
function overdueBlockers(){return activeBlockers().filter(blockerOverdue);}
function teamOwner(team){const idx=DATA.teams.findIndex(r=>r[0]===team);return idx>=0?(teamOwners()[idx]||''):'';}

const progress=p=>`<div class="progress"><div style="width:${Math.max(0,Math.min(100,p))}%"></div></div>`;
const options=(arr,current)=>arr.map(x=>`<option ${x===current?'selected':''}>${esc(x)}</option>`).join('');
function badge(text,type='neutral'){return `<span class="badge ${type}">${esc(text)}</span>`;}
function statusBadge(status){
  if(['Завершено','Готово','Закрыт','Решен'].includes(status))return badge(status,'ok');
  if(status==='Блокер'||status==='Критическая')return badge(status,'bad');
  if(['В работе','Подготовка','Проектирование','Тестирование','Пилот','На согласовании'].includes(status))return badge(status,'work');
  return badge(status,'neutral');
}

function updateHeader(){
  const p=implementationReadiness();
  document.getElementById('headerProgress').textContent=p+'%';
  document.getElementById('headerProgressBar').style.width=p+'%';
}
function setSync(text,state='ok'){
  const el=document.getElementById('syncPill');
  if(!el)return;
  el.textContent=text;
  el.style.background=state==='error'?'#5b2d2d':state==='work'?'#5b4a20':'#173233';
}
function syncOkLabel(){return 'Синхронизировано '+new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(new Date());}

function render(view=currentView){
  currentView=view;
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  const views={overview,gantt,roadmap,teams,modules,issues,dod,architecture};
  app.innerHTML=views[view]();
  bind();
  updateHeader();
  updateClock();
}
document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>render(btn.dataset.view)));

function overview(){
  const ts=localStorage.getItem(K.start);
  const modulesReady=DATA.modules.filter((_,i)=>moduleStatus(i)==='Готово').length;
  const completedStages=DATA.stages.filter(s=>stageStatus(s.id)==='Завершено').length;
  const attention=[];
  overdueStages().forEach(s=>attention.push({title:`Просрочен этап: ${s.name}`,note:`Текущий срок ${fmtDate(stageDeadlineMs(s))}`,type:'bad'}));
  overdueBlockers().forEach(b=>attention.push({title:`Просрочен блокер: ${b.description}`,note:`${b.owner||'Не назначен'} · срок ${b.due}`,type:'bad'}));
  activeBlockers().filter(b=>!assignedOwner(b.owner)).forEach(b=>attention.push({title:`Нет ответственного: ${b.description}`,note:b.source,type:'work'}));
  DATA.stages.filter(s=>stageStatus(s.id)==='Блокер').forEach(s=>attention.push({title:`Этап в статусе «Блокер»: ${s.name}`,note:s.team,type:'work'}));
  return `
    <div class="project-start-card">
      <div><div class="label">Статус проекта</div><div class="project-state">${started()?'Проект запущен':'Не начат'}</div><div class="start-meta">${ts?'Старт: '+fmtStart(ts):'Проект еще не начат'}</div></div>
      <div><div class="label">Время в проекте</div><div id="projectTimer" class="project-timer">00 дн. 00:00:00</div></div>
      <button id="startBtn" class="btn primary" ${started()?'disabled':''}>${started()?'Проект запущен':'Старт проекта'}</button>
    </div>
    <div class="grid">
      <div class="card kpi"><div class="label">Готовность внедрения</div><div class="value">${implementationReadiness()}%</div>${progress(implementationReadiness())}<div class="sub">этапы 50% · модули 25% · DoD 15% · владельцы 10%</div></div>
      <div class="card kpi"><div class="label">Выполнение этапов</div><div class="value">${stageScore()}%</div>${progress(stageScore())}<div class="sub">завершено ${completedStages} из ${DATA.stages.length}</div></div>
      <div class="card kpi"><div class="label">Модули готовы</div><div class="value">${modulesReady} / ${DATA.modules.length}</div><div class="sub">готовность модулей ${moduleScore()}%</div></div>
      <div class="card kpi"><div class="label">Критические блокеры</div><div class="value">${criticalBlockers()}</div><div class="sub">активных всего ${activeBlockers().length}</div></div>
    </div>
    <div class="grid" style="margin-top:14px">
      <div class="card kpi"><div class="label">Владельцы назначены</div><div class="value">${ownerReadyCount()} / ${DATA.teams.length}</div><div class="sub">готовность RACI ${ownerScore()}%</div></div>
      <div class="card kpi"><div class="label">Definition of Done</div><div class="value">${dodReadyCount()} / ${DATA.dod.length}</div><div class="sub">выполнено ${dodScore()}%</div></div>
      <div class="card kpi"><div class="label">Просроченные этапы</div><div class="value">${overdueStages().length}</div><div class="sub">по текущим срокам</div></div>
      <div class="card kpi"><div class="label">Просроченные блокеры</div><div class="value">${overdueBlockers().length}</div><div class="sub">без владельца или срока: ${incompleteBlockers()}</div></div>
    </div>
    <div class="section-title"><h2>Цель внедрения</h2></div>
    <div class="callout"><b>${DATA.goal}</b><br><br>BCC сначала используется для управления собственным внедрением. После приемки он становится постоянным рабочим центром управления бизнесом.</div>
    <div class="section-title"><h2>Требует внимания</h2><small>${attention.length?'показаны текущие отклонения':'критических отклонений нет'}</small></div>
    ${attention.length?`<div class="attention-list">${attention.slice(0,10).map(a=>`<div class="attention-item"><div><b>${esc(a.title)}</b><small>${esc(a.note)}</small></div>${badge(a.type==='bad'?'Требует действия':'Контроль',a.type)}</div>`).join('')}</div>`:'<div class="empty">На текущий момент система не видит просрочек, незакрытых назначений или этапов в статусе «Блокер».</div>'}
  `;
}

function gantt(){
  const base=projectBase();
  let maxOffset=90;
  DATA.stages.forEach(s=>{
    const current=stageDeadlineIso(s);
    const offset=Math.ceil((dateEndMs(current)-base)/86400000);
    maxOffset=Math.max(maxOffset,offset);
  });
  const horizon=Math.max(90,maxOffset+7);
  const weeks=Math.ceil(horizon/7);
  const gridStep=100/weeks;
  const weekHead=Array.from({length:weeks},(_,i)=>`<div class="gantt-week">Н${i+1}</div>`).join('');
  const rows=DATA.stages.map(s=>{
    const planLeft=s.start/horizon*100;
    const planWidth=Math.max(1.2,(s.end-s.start)/horizon*100);
    const ext=extendedDays(s);
    let extra='';
    if(ext>0){extra=`<div class="gantt-extension" style="left:${s.end/horizon*100}%;width:${ext/horizon*100}%"></div>`;}
    if(ext<0){const currentOffset=(dateStartMs(stageDeadlineIso(s))-base)/86400000;extra=`<div class="gantt-marker" title="Срок сокращен" style="left:${Math.max(0,currentOffset/horizon*100)}%"></div>`;}
    return `<div class="gantt-row"><div class="gantt-task"><b>${esc(s.name)}</b><small>${fmtDate(planStartMs(s))} - ${fmtDate(stageDeadlineMs(s))}${ext>0?` · продлен +${ext} дн.`:ext<0?` · сокращен ${Math.abs(ext)} дн.`:''}</small></div><div class="gantt-track"><div class="gantt-grid" style="background:repeating-linear-gradient(to right,transparent 0,transparent calc(${gridStep}% - 1px),var(--line) calc(${gridStep}% - 1px),var(--line) ${gridStep}%)"></div><div class="gantt-bar" style="left:${planLeft}%;width:${planWidth}%"></div>${extra}</div></div>`;
  }).join('');
  return `
    <div class="section-title"><h2>Диаграмма Ганта</h2><small>Плановые сроки и продления</small></div>
    <div class="callout"><b>${started()?'Сроки рассчитаны от фактической даты старта проекта.':'До старта показан предварительный план от сегодняшней даты.'}</b> Темная полоса показывает базовый план, желтая часть показывает продление.</div>
    <div class="gantt-wrap"><div class="gantt-head"><div class="gantt-task-head">Этап</div><div class="gantt-weeks" style="grid-template-columns:repeat(${weeks},1fr)">${weekHead}</div></div>${rows}</div>
    <div class="gantt-footer"><span>Старт: <b>${fmtDate(base)}</b></span><span>Базовый план завершения: <b>${fmtDate(addDays(base,90))}</b></span><span>Горизонт отображения: <b>${horizon} дней</b></span></div>
  `;
}

function roadmap(){
  const rows=DATA.stages.map(s=>{
    const status=stageStatus(s.id),ext=extendedDays(s),owner=teamOwner(s.team);
    const deviation=stageOverdue(s)?badge('Просрочен','bad'):ext>0?badge(`Продлен +${ext} дн.`,'work'):ext<0?badge(`Сокращен ${Math.abs(ext)} дн.`,'ok'):badge('По плану','neutral');
    return `<tr>
      <td>${s.id}</td>
      <td><b>${esc(s.name)}</b><span class="deadline-note">${esc(s.team)}${owner?` · ${esc(owner)}`:''}</span></td>
      <td><select class="stageSelect" data-id="${s.id}">${options(STAGE_STATUSES,status)}</select></td>
      <td>${fmtDate(planEndMs(s))}</td>
      <td class="deadline-cell"><b>${fmtDate(stageDeadlineMs(s))}</b><span class="deadline-note">${deviation}</span></td>
      <td>${stageProgress(s.id)}% ${progress(stageProgress(s.id))}</td>
      <td><button class="btn deadlineBtn" data-id="${s.id}" ${started()?'':'disabled'}>Изменить срок</button></td>
    </tr>`;
  }).join('');
  return `
    <div class="section-title"><h2>Этапы внедрения</h2><small>Один источник для статусов, сроков и Ганта</small></div>
    <div class="callout"><b>Логика:</b> статус этапа влияет на прогресс. Срок можно изменить только после старта проекта. Продленный срок отдельно показывается в таблице и на Ганте. Статус «Блокер» автоматически создает запись в реестре блокеров.</div>
    <div class="table-wrap"><table class="table wide"><thead><tr><th>#</th><th>Этап</th><th>Статус</th><th>Плановый срок</th><th>Текущий срок</th><th>Готовность</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  `;
}

function teams(){
  const owners=teamOwners();
  const rows=DATA.teams.map((r,i)=>{
    const ready=assignedOwner(owners[i]);
    return `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td><input class="ownerInput" data-i="${i}" value="${esc(owners[i]||'')}" placeholder="ФИО / роль"></td><td>${ready?badge('Назначен','ok'):badge('Не назначен','bad')}</td></tr>`;
  }).join('');
  return `<div class="section-title"><h2>Команды и RACI</h2><small>R делает · A отвечает · C консультирует</small></div><div class="callout"><b>Готовность владельцев:</b> ${ownerReadyCount()} из ${DATA.teams.length}. Значение «Не назначен» не считается назначением.</div><div class="table-wrap"><table class="table"><thead><tr><th>Команда</th><th>RACI</th><th>Роль</th><th>Ответственный</th><th>Готовность</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function modules(){
  const rows=DATA.modules.map((r,i)=>{
    const status=moduleStatus(i),p=PROGRESS[status]||0;
    return `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td><select class="moduleSelect" data-i="${i}">${options(MODULE_STATUSES,status)}</select></td><td>${p}% ${progress(p)}</td></tr>`;
  }).join('');
  return `<div class="section-title"><h2>Модули ATOM BCC</h2><small>Модули дают 25% общей готовности внедрения</small></div><div class="callout"><b>Важно:</b> часть Definition of Done теперь рассчитывается автоматически по фактическим статусам модулей. Нельзя вручную отметить функцию готовой, если связанный модуль еще не готов.</div><div class="table-wrap"><table class="table"><thead><tr><th>Модуль</th><th>Назначение</th><th>Статус внедрения</th><th>Готовность</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function issues(){
  const list=blockers();
  const rows=list.map(b=>`<tr>
    <td><input class="blField" data-id="${b.id}" data-key="source" value="${esc(b.source||'')}"></td>
    <td><textarea class="blField" data-id="${b.id}" data-key="description">${esc(b.description||'')}</textarea></td>
    <td><select class="blField" data-id="${b.id}" data-key="severity">${options(SEVERITY,b.severity)}</select></td>
    <td><input class="blField" data-id="${b.id}" data-key="owner" value="${esc(b.owner||'')}"></td>
    <td><input type="date" class="blField" data-id="${b.id}" data-key="due" value="${esc(b.due||'')}">${blockerOverdue(b)?'<span class="deadline-note">'+badge('Просрочен','bad')+'</span>':''}</td>
    <td><select class="blField" data-id="${b.id}" data-key="status">${options(BLOCKER_STATUSES,b.status)}</select></td>
    <td><textarea class="blField" data-id="${b.id}" data-key="comment">${esc(b.comment||'')}</textarea></td>
    <td><button class="btn danger delBlocker" data-id="${b.id}">Удалить</button></td>
  </tr>`).join('');
  return `
    <div class="section-title"><h2>Блокеры внедрения</h2><small>Активных: ${activeBlockers().length} · критических: ${criticalBlockers()} · просроченных: ${overdueBlockers().length}</small></div>
    <div class="callout"><b>Обязательные поля:</b> источник, описание, ответственный и срок. Этап в статусе «Блокер» создает связанную запись автоматически.</div>
    <div class="card"><h3 style="margin-top:0">Добавить блокер</h3><div class="form-grid"><input id="blSource" placeholder="Этап / модуль"><input id="blDesc" placeholder="Описание проблемы"><select id="blSeverity">${SEVERITY.map(x=>`<option>${x}</option>`).join('')}</select><input id="blOwner" placeholder="Ответственный"><input id="blDue" type="date"><textarea id="blComment" placeholder="Комментарий / что нужно для снятия блокера"></textarea></div><button id="addBlocker" class="btn primary" style="margin-top:10px">Создать блокер</button></div>
    <div class="section-title"><h2>Реестр блокеров</h2></div>
    ${list.length?`<div class="table-wrap"><table class="table wide"><thead><tr><th>Источник</th><th>Проблема</th><th>Критичность</th><th>Ответственный</th><th>Срок</th><th>Статус</th><th>Комментарий</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">Блокеров пока нет.</div>'}
  `;
}

function dod(){
  const rows=DATA.dod.map((r,i)=>{
    const auto=Boolean(AUTO_DOD[i]);
    const done=dodDone(i);
    return `<label class="check ${auto?'check-auto':''}"><input type="checkbox" class="dodCheck" data-i="${i}" ${done?'checked':''} ${auto?'disabled':''}><span><b>${esc(r[0])}</b><small>${esc(r[1])}${auto?' · автоматически':''}</small></span>${done?badge('Выполнено','ok'):badge(auto?'Ждет модули':'Не выполнено',auto?'work':'neutral')}</label>`;
  }).join('');
  return `<div class="section-title"><h2>Definition of Done</h2><small>${dodReadyCount()} из ${DATA.dod.length} · ${dodScore()}%</small></div><div class="callout"><b>Логика приемки:</b> технические критерии связаны со статусами модулей и рассчитываются автоматически. Организационные критерии остаются ручными, потому что требуют фактического подтверждения.</div><div class="checklist">${rows}</div>`;
}

function architecture(){
  return `<div class="section-title"><h2>Архитектура ATOM BCC</h2><small>BCC как управленческий слой, а не замена учетных систем</small></div>
  <div class="card"><div class="flow"><div class="node"><b>ELMA / CRM</b></div><div class="node"><b>Альфа-Авто</b></div><div class="node"><b>1С / Финансы</b></div><div class="node"><b>DATA / DWH / BI</b></div><div class="node"><b>Ручные данные</b></div><div class="arrow">→</div><div class="node"><b>ATOM BCC</b><br><small>единый управленческий слой</small></div><div class="arrow">→</div><div class="node"><b>Проекты</b></div><div class="node"><b>Задачи</b></div><div class="node"><b>Встречи</b></div><div class="node"><b>KPI</b></div><div class="node"><b>Решения</b></div><div class="node"><b>Блокеры</b></div><div class="arrow">→</div><div class="node"><b>Контроль руководителя</b></div></div></div>
  <div class="callout"><b>BCC не заменяет ELMA, 1С, DWH, BI или профильные системы.</b><br><br>Он связывает их на уровне управления: владелец, срок, статус, отклонение, решение, блокер и факт исполнения.</div>
  <div class="callout warn"><b>Текущий сайт остается публичным тестовым контуром.</b> Ролевые права и конфиденциальные данные должны появляться только после отдельного защищенного рабочего контура и допуска ИБ.</div>`;
}

function ensureStageBlocker(stage){
  const list=blockers();
  const exists=list.some(b=>b.linkType==='stage'&&b.linkId===stage.id&&!['Решен','Закрыт'].includes(b.status));
  if(exists)return;
  list.push({
    id:'stage-'+stage.id+'-'+Date.now().toString(36),
    linkType:'stage',linkId:stage.id,source:stage.name,
    description:'Этап переведен в статус «Блокер». Уточните причину.',
    severity:'Высокая',owner:teamOwner(stage.team)||'Не назначен',due:stageDeadlineIso(stage),status:'Открыт',comment:'Создан автоматически из этапа внедрения.'
  });
  saveJson(K.blockers,list);
}
function closeStageBlockers(stage){
  const list=blockers();let changed=false;
  list.forEach(b=>{
    if(b.linkType==='stage'&&b.linkId===stage.id&&!['Решен','Закрыт'].includes(b.status)){
      b.status='Закрыт';
      b.comment=((b.comment||'')+' Закрыт автоматически после завершения этапа.').trim();
      changed=true;
    }
  });
  if(changed)saveJson(K.blockers,list);
}
function patchBlocker(id,key,value,rerender=false){
  const list=blockers();const b=list.find(x=>x.id===id);if(!b)return;
  b[key]=value;
  saveJson(K.blockers,list);
  if(rerender)render('issues');
}

function bind(){
  const startBtn=document.getElementById('startBtn');
  if(startBtn)startBtn.onclick=()=>{if(started())return;saveRaw(K.start,String(Date.now()));render('overview');};

  document.querySelectorAll('.stageSelect').forEach(el=>el.onchange=()=>{
    const s=stageStatuses();s[el.dataset.id]=el.value;saveJson(K.stages,s);
    const stage=DATA.stages.find(x=>x.id===el.dataset.id);
    if(el.value==='Блокер')ensureStageBlocker(stage);
    if(el.value==='Завершено')closeStageBlockers(stage);
    render('roadmap');
  });

  document.querySelectorAll('.deadlineBtn').forEach(btn=>btn.onclick=()=>{
    if(!started())return;
    const stage=DATA.stages.find(s=>s.id===btn.dataset.id);
    const current=stageDeadlineIso(stage);
    const value=prompt(`Новый срок для этапа «${stage.name}» в формате ГГГГ-ММ-ДД`,current);
    if(value===null)return;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(dateStartMs(value))){alert('Введите дату в формате ГГГГ-ММ-ДД');return;}
    if(dateStartMs(value)<dateStartMs(localDateString(planStartMs(stage)))){alert('Срок не может быть раньше даты начала этапа');return;}
    const d=deadlineOverrides();
    if(value===planEndIso(stage))delete d[stage.id];else d[stage.id]=value;
    saveJson(K.deadlines,d);
    const list=blockers();let changed=false;
    list.forEach(b=>{if(b.linkType==='stage'&&b.linkId===stage.id&&!['Решен','Закрыт'].includes(b.status)){b.due=value;changed=true;}});
    if(changed)saveJson(K.blockers,list);
    render('roadmap');
  });

  document.querySelectorAll('.moduleSelect').forEach(el=>el.onchange=()=>{
    const m=moduleStatuses();m[el.dataset.i]=el.value;saveJson(K.modules,m);render('modules');
  });

  document.querySelectorAll('.ownerInput').forEach(el=>el.onchange=()=>{
    const o=teamOwners();o[el.dataset.i]=el.value.trim();saveJson(K.teams,o);render('teams');
  });

  document.querySelectorAll('.dodCheck').forEach(el=>el.onchange=()=>{
    if(AUTO_DOD[el.dataset.i])return;
    const d=dodManual();d[el.dataset.i]=el.checked;saveJson(K.dod,d);render('dod');
  });

  const addBtn=document.getElementById('addBlocker');
  if(addBtn)addBtn.onclick=()=>{
    const source=document.getElementById('blSource').value.trim();
    const description=document.getElementById('blDesc').value.trim();
    const severity=document.getElementById('blSeverity').value;
    const owner=document.getElementById('blOwner').value.trim();
    const due=document.getElementById('blDue').value;
    const comment=document.getElementById('blComment').value.trim();
    if(!source||!description||!assignedOwner(owner)||!due){alert('Заполните источник, описание, ответственного и срок');return;}
    const list=blockers();
    list.push({id:'bl-'+Date.now().toString(36),source,description,severity,owner,due,status:'Открыт',comment});
    saveJson(K.blockers,list);render('issues');
  };

  document.querySelectorAll('.blField').forEach(el=>el.onchange=()=>patchBlocker(el.dataset.id,el.dataset.key,el.value,true));
  document.querySelectorAll('.delBlocker').forEach(el=>el.onclick=()=>{
    if(!confirm('Удалить блокер?'))return;
    saveJson(K.blockers,blockers().filter(b=>b.id!==el.dataset.id));render('issues');
  });
}

function updateClock(){
  clearInterval(clockTimer);
  const el=document.getElementById('projectTimer');
  if(!el||!started())return;
  const tick=()=>{
    const t=Math.max(0,Math.floor((Date.now()-Number(localStorage.getItem(K.start)))/1000));
    const d=Math.floor(t/86400),h=Math.floor((t%86400)/3600),m=Math.floor((t%3600)/60),s=t%60,p=n=>String(n).padStart(2,'0');
    el.textContent=`${d} дн. ${p(h)}:${p(m)}:${p(s)}`;
  };
  tick();clockTimer=setInterval(tick,1000);
}

async function api(method,params='',body){
  const r=await fetch(`${API}?table=ca_sync_state${params?'&'+params:''}`,{
    method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined
  });
  if(!r.ok)throw new Error(await r.text());
  const text=await r.text();return text?JSON.parse(text):null;
}
function remoteRowsOnly(rows){return (Array.isArray(rows)?rows:[]).filter(r=>CLOUD_KEYS.includes(r.key));}
function compareIso(a,b){if(!a&&!b)return 0;if(!a)return -1;if(!b)return 1;return new Date(a).getTime()-new Date(b).getTime();}
function scheduleSync(){
  if(!hydrated)return;
  clearTimeout(syncTimer);setSync('Сохраняется...','work');syncTimer=setTimeout(pushPending,180);
}
async function pushPending(){
  if(pushing||!hydrated||!pendingKeys.size)return;
  pushing=true;
  const keys=[...pendingKeys];
  const sent=keys.map(key=>({key,value:localStorage.getItem(key),updated_at:localTs(key)||nowIso()})).filter(r=>r.value!==null);
  const sentTs=Object.fromEntries(sent.map(r=>[r.key,r.updated_at]));
  try{
    if(sent.length)await api('POST','on_conflict=key',sent);
    keys.forEach(key=>{if(localTs(key)===sentTs[key])pendingKeys.delete(key);});
    setSync(syncOkLabel());
  }catch(e){
    console.error('BCC sync push failed',e);setSync('Ошибка синхронизации','error');
  }finally{
    pushing=false;
    if(pendingKeys.size){clearTimeout(syncTimer);syncTimer=setTimeout(pushPending,1200);}
  }
}
async function hydrate(){
  try{
    setSync('Синхронизация...','work');
    const rows=remoteRowsOnly(await api('GET','select=key,value,updated_at&order=updated_at.asc'));
    const remote=new Map(rows.map(r=>[r.key,r]));
    let changed=false;
    CLOUD_KEYS.forEach(key=>{
      const localValue=localStorage.getItem(key),localUpdated=localTs(key),r=remote.get(key);
      if(!r){if(localValue!==null)pendingKeys.add(key);return;}
      if(localValue===null){setFromRemote(key,r.value,r.updated_at);changed=true;return;}
      if(localUpdated&&compareIso(localUpdated,r.updated_at)>0){pendingKeys.add(key);return;}
      if(localValue!==r.value||!localUpdated){setFromRemote(key,r.value,r.updated_at);changed=true;}
    });
    hydrated=true;
    if(pendingKeys.size)await pushPending();
    else setSync(syncOkLabel());
    if(changed)render(currentView);
  }catch(e){
    console.error('BCC sync hydrate failed',e);hydrated=true;setSync('Локальный режим','error');
  }
}
async function pullRemote(){
  if(!hydrated||pushing||pendingKeys.size)return;
  try{
    const rows=remoteRowsOnly(await api('GET','select=key,value,updated_at&order=updated_at.asc'));
    let changed=false;
    rows.forEach(r=>{
      if(pendingKeys.has(r.key))return;
      const lv=localStorage.getItem(r.key),lt=localTs(r.key);
      if(lv===null||!lt||compareIso(r.updated_at,lt)>0){
        if(lv!==r.value)changed=true;
        setFromRemote(r.key,r.value,r.updated_at);
      }
    });
    if(changed)render(currentView);
    setSync(syncOkLabel());
  }catch(e){
    console.error('BCC sync pull failed',e);setSync('Локальный режим','error');
  }
}

window.addEventListener('storage',e=>{if(CLOUD_KEYS.includes(e.key))render(currentView);});
render();
hydrate();
setInterval(pullRemote,15000);
