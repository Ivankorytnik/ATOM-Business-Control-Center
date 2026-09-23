(function(){
"use strict";

var TASKS_KEY="atom-weekly-review-tasks-v01";
var HISTORY_KEY="atom-weekly-review-history-v01";
var REVIEWS_KEY="atom-weekly-review-meetings-v01";
var ACTOR_KEY="atom-weekly-review-actor-v01";
var STATUSES=["Новая","В работе","На контроле","Блокер","Готово","Отложено"];
var PRIORITIES=["Высокий","Средний","Низкий"];
var state={tasks:[],history:[],reviews:[],view:"tasks"};

function pad(n){return String(n).padStart(2,"0");}
function dateOnly(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
function parseDate(s){var p=String(s||"").split("-");return new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));}
function fmtDate(s){if(!s)return "—";return new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"2-digit"}).format(parseDate(s));}
function fmtDateTime(iso){return new Intl.DateTimeFormat("ru-RU",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(iso));}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m];});}
function uid(){return "t-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);}
function load(key,fallback){try{var v=localStorage.getItem(key);return v?JSON.parse(v):fallback;}catch(e){return fallback;}}
function save(){localStorage.setItem(TASKS_KEY,JSON.stringify(state.tasks));localStorage.setItem(HISTORY_KEY,JSON.stringify(state.history));localStorage.setItem(REVIEWS_KEY,JSON.stringify(state.reviews));}
function nowIso(){return new Date().toISOString();}
function actor(){return localStorage.getItem(ACTOR_KEY)||"Пользователь";}

function meetingPoint(base,shiftWeeks){
  var d=new Date(base||new Date());
  d.setHours(9,30,0,0);
  var day=d.getDay();
  var delta=(1-day+7)%7;
  if(delta===0 && new Date(base||new Date()).getTime()>d.getTime())delta=7;
  d.setDate(d.getDate()+delta+(shiftWeeks||0)*7);
  return d;
}
function nextMeeting(){return meetingPoint(new Date(),0);}
function previousMeeting(){var n=nextMeeting();var p=new Date(n);p.setDate(p.getDate()-7);return p;}
function cycle(){
  var next=nextMeeting(),prev=new Date(next);prev.setDate(prev.getDate()-7);
  return {prev:prev,next:next};
}
function daysBetween(a,b){return Math.round((b.getTime()-a.getTime())/86400000);}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function isOverdue(t){return t.status!=="Готово" && t.dueDate && parseDate(t.dueDate).getTime()<new Date().setHours(0,0,0,0);}
function changedSinceReview(t){return new Date(t.updatedAt||t.createdAt).getTime()>previousMeeting().getTime();}

function seedTasks(){
  var c=cycle(),start=dateOnly(c.prev),due=dateOnly(c.next);
  return [
    {id:uid(),vertical:"B2B",project:"ЭЛМА → Альфа",title:"Сделать MVP воронки ЭЛМА → Альфа",owner:"",status:"В работе",priority:"Высокий",progress:30,startDate:start,dueDate:due,result:"Сквозной сценарий: лид → квалификация → РЛ в Альфа → актуальный этап",createdAt:nowIso(),updatedAt:nowIso()},
    {id:uid(),vertical:"B2B",project:"Форма обратной связи",title:"Отработать 5 обращений с формы обратной связи",owner:"",status:"Новая",priority:"Высокий",progress:0,startDate:start,dueDate:due,result:"По всем 5 обращениям есть результат, ответственный и следующий шаг",createdAt:nowIso(),updatedAt:nowIso()},
    {id:uid(),vertical:"Все вертикали",project:"CMMT → Альфа",title:"Все проекты из CMMT залить в Альфа, создать РЛ, проставить этапы",owner:"",status:"В работе",priority:"Высокий",progress:10,startDate:start,dueDate:due,result:"100% проектов заведены, у каждого есть РЛ и актуальный этап",createdAt:nowIso(),updatedAt:nowIso()},
    {id:uid(),vertical:"B2B",project:"Альфа / база компаний",title:"Актуализировать 113 компаний предыдущей команды",owner:"",status:"Новая",priority:"Высокий",progress:0,startDate:start,dueDate:due,result:"По каждой компании принято решение: продолжить работу или закрыть; для активных указан текущий этап",createdAt:nowIso(),updatedAt:nowIso()},
    {id:uid(),vertical:"B2B",project:"ЭЛМА / ИИ-лиды",title:"Разобрать 100 лидов, сгенерированных ИИ",owner:"",status:"Новая",priority:"Средний",progress:0,startDate:start,dueDate:due,result:"Каждый лид квалифицирован либо закрыт как дисквалифицированный",createdAt:nowIso(),updatedAt:nowIso()},
    {id:uid(),vertical:"B2B",project:"ЭЛМА / обращения юрлиц",title:"Настроить автоматическое формирование лида из обращения юрлица",owner:"",status:"Новая",priority:"Средний",progress:0,startDate:start,dueDate:due,result:"Лид создается автоматически, источник лида = «Обращение»",createdAt:nowIso(),updatedAt:nowIso()}
  ];
}
function init(){
  state.tasks=load(TASKS_KEY,null);
  if(!state.tasks){state.tasks=seedTasks();save();}
  state.history=load(HISTORY_KEY,[]);
  state.reviews=load(REVIEWS_KEY,[]);
  bindStatic();
  refreshAll();
  setInterval(updateCountdown,30000);
}
function log(taskId,action,detail){
  state.history.unshift({id:uid(),at:nowIso(),taskId:taskId||"",action:action,detail:detail||"",actor:actor()});
  if(state.history.length>500)state.history=state.history.slice(0,500);
}
function taskById(id){return state.tasks.find(function(t){return t.id===id;});}
function statusBadge(s){
  var map={"Новая":"new","В работе":"work","На контроле":"control","Блокер":"block","Готово":"done","Отложено":"pause"};
  return '<span class="badge '+(map[s]||"new")+'">'+esc(s)+'</span>';
}
function priorityBadge(s){
  var map={"Высокий":"high","Средний":"medium","Низкий":"low"};
  return '<span class="badge '+(map[s]||"medium")+'">'+esc(s)+'</span>';
}
function filteredTasks(){
  var v=document.getElementById("verticalFilter").value;
  var s=document.getElementById("statusFilter").value;
  var o=document.getElementById("ownerFilter").value;
  var q=document.getElementById("searchFilter").value.trim().toLowerCase();
  return state.tasks.filter(function(t){
    if(v && t.vertical!==v)return false;
    if(s && t.status!==s)return false;
    if(o && (t.owner||"")!==o)return false;
    if(q && [t.vertical,t.project,t.title,t.owner,t.result].join(" ").toLowerCase().indexOf(q)===-1)return false;
    return true;
  }).sort(function(a,b){
    var p={Высокий:0,Средний:1,Низкий:2};
    if(a.status==="Блокер" && b.status!=="Блокер")return -1;
    if(b.status==="Блокер" && a.status!=="Блокер")return 1;
    if(isOverdue(a)!==isOverdue(b))return isOverdue(a)?-1:1;
    return (p[a.priority]||1)-(p[b.priority]||1) || String(a.dueDate).localeCompare(String(b.dueDate));
  });
}
function renderCycle(){
  var c=cycle();
  document.getElementById("cycleLabel").textContent=fmtDate(dateOnly(c.prev))+" 09:30 → "+fmtDate(dateOnly(c.next))+" 09:30";
  document.getElementById("cycleHint").textContent="Все незакрытые задачи должны иметь владельца, срок и следующий шаг к новому ревью.";
  document.getElementById("nextReview").textContent=new Intl.DateTimeFormat("ru-RU",{weekday:"long",day:"2-digit",month:"long"}).format(c.next)+" · 09:30";
  updateCountdown();
}
function updateCountdown(){
  var el=document.getElementById("reviewCountdown");if(!el)return;
  var ms=nextMeeting().getTime()-Date.now();
  if(ms<0){el.textContent="Ревью началось";return;}
  var d=Math.floor(ms/86400000);var h=Math.floor(ms%86400000/3600000);var m=Math.floor(ms%3600000/60000);
  el.textContent="через "+d+" дн. "+pad(h)+":"+pad(m);
}
function renderKpis(){
  var total=state.tasks.length;
  var open=state.tasks.filter(function(t){return t.status!=="Готово";}).length;
  var overdue=state.tasks.filter(isOverdue).length;
  var blockers=state.tasks.filter(function(t){return t.status==="Блокер";}).length;
  var done=state.tasks.filter(function(t){return t.status==="Готово";}).length;
  var arr=[
    ["Всего задач",total,"в текущем контуре"],
    ["Открыто",open,"требуют контроля"],
    ["Просрочено",overdue,overdue?"нужна реакция":"нет просрочки"],
    ["Блокеры",blockers,blockers?"нужна эскалация":"нет блокеров"],
    ["Готово",done,total?Math.round(done/total*100)+"% задач":"0%"]
  ];
  document.getElementById("kpiGrid").innerHTML=arr.map(function(x){return '<div class="kpi"><div class="label">'+esc(x[0])+'</div><div class="value">'+x[1]+'</div><div class="sub">'+esc(x[2])+'</div></div>';}).join("");
}
function renderOwnerFilter(){
  var select=document.getElementById("ownerFilter"),cur=select.value;
  var owners=[].concat(state.tasks.map(function(t){return (t.owner||"").trim();})).filter(Boolean).filter(function(v,i,a){return a.indexOf(v)===i;}).sort();
  select.innerHTML='<option value="">Все</option>'+owners.map(function(o){return '<option '+(o===cur?"selected":"")+'>'+esc(o)+'</option>';}).join("");
}
function renderTasks(){
  var tasks=filteredTasks(),rows=document.getElementById("taskRows");
  rows.innerHTML=tasks.map(function(t){
    var rowClass=(changedSinceReview(t)?" changed-row":"")+(isOverdue(t)?" overdue-row":"");
    var progress=Math.max(0,Math.min(100,Number(t.progress)||0));
    return '<tr class="'+rowClass+'">'+
      '<td>'+esc(t.vertical)+'</td>'+
      '<td class="project">'+esc(t.project)+'</td>'+
      '<td class="task-name">'+esc(t.title)+(t.result?'<span class="task-result">'+esc(t.result)+'</span>':"")+'</td>'+
      '<td class="owner">'+esc(t.owner||"—")+'</td>'+
      '<td>'+statusBadge(t.status)+'</td>'+
      '<td>'+priorityBadge(t.priority)+'</td>'+
      '<td><div class="progress-wrap"><div class="progress-track"><div class="progress-bar" style="width:'+progress+'%"></div></div><span class="progress-num">'+progress+'%</span></div></td>'+
      '<td><span class="date '+(isOverdue(t)?"overdue":"")+'">'+fmtDate(t.dueDate)+'</span></td>'+
      '<td>'+(changedSinceReview(t)?'<span class="changed-mark">'+fmtDateTime(t.updatedAt)+'</span>':'<span class="muted">до ревью</span>')+'</td>'+
      '<td><div class="row-actions"><button class="mini-btn" data-action="edit" data-id="'+esc(t.id)+'">Изм.</button><button class="mini-btn" data-action="done" data-id="'+esc(t.id)+'">✓</button></div></td>'+
    '</tr>';
  }).join("");
  document.getElementById("emptyTasks").classList.toggle("hidden",tasks.length>0);
}
function ganttRange(tasks){
  var c=cycle(),dates=[addDays(c.prev,-7),addDays(c.next,21)];
  tasks.forEach(function(t){if(t.startDate)dates.push(parseDate(t.startDate));if(t.dueDate)dates.push(parseDate(t.dueDate));});
  var min=new Date(Math.min.apply(null,dates.map(function(d){return d.getTime();})));
  var max=new Date(Math.max.apply(null,dates.map(function(d){return d.getTime();})));
  min.setHours(0,0,0,0);max.setHours(0,0,0,0);
  if(daysBetween(min,max)>70)max=addDays(min,70);
  return {min:min,max:max,days:daysBetween(min,max)+1};
}
function renderGantt(){
  var tasks=filteredTasks(),host=document.getElementById("gantt");
  if(!tasks.length){host.innerHTML='<div class="empty">Нет задач для отображения.</div>';return;}
  var r=ganttRange(tasks),dayWidth=100/r.days;
  var days=[];for(var i=0;i<r.days;i++)days.push(addDays(r.min,i));
  var axis=days.map(function(d){return '<div class="gantt-day '+(d.getDay()===1?"monday":"")+'" style="min-width:34px">'+pad(d.getDate())+'.'+pad(d.getMonth()+1)+'</div>';}).join("");
  var reviewOffset=Math.max(0,Math.min(100,daysBetween(r.min,nextMeeting())/Math.max(1,r.days-1)*100));
  var lines=tasks.map(function(t){
    var s=t.startDate?parseDate(t.startDate):r.min;var e=t.dueDate?parseDate(t.dueDate):s;
    var left=Math.max(0,daysBetween(r.min,s)/r.days*100);var width=Math.max(dayWidth,(daysBetween(s,e)+1)/r.days*100);
    if(left+width>100)width=100-left;
    var cls=t.status==="Блокер"?"block":t.status==="Готово"?"done":"";
    return '<div class="gantt-line"><div class="gantt-info"><b>'+esc(t.title)+'</b><small>'+esc(t.vertical)+' · '+esc(t.owner||"без владельца")+' · '+fmtDate(t.dueDate)+'</small></div><div class="gantt-track" style="--dayw:'+dayWidth+'%"><div class="gantt-review-marker" style="left:'+reviewOffset+'%"></div><div class="gantt-bar '+cls+'" title="'+esc(t.title)+'" style="left:'+left+'%;width:'+width+'%"></div></div></div>';
  }).join("");
  host.innerHTML='<div class="gantt-head"><div class="gantt-title">Задача</div><div class="gantt-axis" style="grid-template-columns:repeat('+r.days+',minmax(34px,1fr))">'+axis+'</div></div>'+lines;
}
function renderReviews(){
  var host=document.getElementById("reviewList");
  if(!state.reviews.length){host.innerHTML='<div class="empty">Снимков ревью пока нет. Нажмите «Зафиксировать ревью» на встрече.</div>';return;}
  host.innerHTML=state.reviews.map(function(r){
    return '<div class="review-card"><div class="review-card-head"><h3>'+fmtDateTime(r.at)+'</h3><span class="badge control">Ревью</span></div><div class="review-stats"><span>Всего: <b>'+r.total+'</b></span><span>Открыто: <b>'+r.open+'</b></span><span>Просрочено: <b>'+r.overdue+'</b></span><span>Блокеры: <b>'+r.blockers+'</b></span><span>Готово: <b>'+r.done+'</b></span></div><div class="review-note">'+esc(r.note||"Без комментария")+'</div></div>';
  }).join("");
}
function renderHistory(){
  var host=document.getElementById("historyList");
  if(!state.history.length){host.innerHTML='<div class="empty">Изменений пока нет.</div>';return;}
  host.innerHTML=state.history.map(function(h){
    var t=taskById(h.taskId);
    return '<div class="history-item"><div class="history-time">'+fmtDateTime(h.at)+'<br>'+esc(h.actor||"")+'</div><div class="history-task">'+esc(t?t.project:"Общий контур")+'</div><div class="history-change"><b>'+esc(h.action)+'</b> · '+esc(h.detail)+'</div></div>';
  }).join("");
}
function refreshAll(){
  renderCycle();renderKpis();renderOwnerFilter();renderTasks();renderGantt();renderReviews();renderHistory();
}
function setView(v){
  state.view=v;
  document.querySelectorAll(".view").forEach(function(el){el.classList.remove("active");});
  document.querySelectorAll(".tab").forEach(function(el){el.classList.toggle("active",el.dataset.view===v);});
  document.getElementById(v+"View").classList.add("active");
  if(v==="gantt")renderGantt();if(v==="reviews")renderReviews();if(v==="history")renderHistory();
}
function openModal(id){
  var t=id?taskById(id):null,c=cycle();
  document.getElementById("modalTitle").textContent=t?"Изменить задачу":"Новая задача";
  document.getElementById("taskId").value=t?t.id:"";
  document.getElementById("taskVertical").value=t?t.vertical:"B2B";
  document.getElementById("taskProject").value=t?t.project:"";
  document.getElementById("taskTitle").value=t?t.title:"";
  document.getElementById("taskOwner").value=t?t.owner:"";
  document.getElementById("taskStatus").value=t?t.status:"Новая";
  document.getElementById("taskPriority").value=t?t.priority:"Средний";
  document.getElementById("taskProgress").value=t?t.progress:0;
  document.getElementById("taskStart").value=t?t.startDate:dateOnly(new Date());
  document.getElementById("taskDue").value=t?t.dueDate:dateOnly(c.next);
  document.getElementById("taskResult").value=t?t.result:"";
  document.getElementById("deleteTaskBtn").classList.toggle("hidden",!t);
  document.getElementById("taskModal").classList.remove("hidden");
}
function closeModal(){document.getElementById("taskModal").classList.add("hidden");}
function formTask(){
  return {
    vertical:document.getElementById("taskVertical").value,
    project:document.getElementById("taskProject").value.trim(),
    title:document.getElementById("taskTitle").value.trim(),
    owner:document.getElementById("taskOwner").value.trim(),
    status:document.getElementById("taskStatus").value,
    priority:document.getElementById("taskPriority").value,
    progress:Number(document.getElementById("taskProgress").value)||0,
    startDate:document.getElementById("taskStart").value,
    dueDate:document.getElementById("taskDue").value,
    result:document.getElementById("taskResult").value.trim()
  };
}
function describeChanges(oldT,newT){
  var labels={vertical:"вертикаль",project:"проект",title:"задача",owner:"ответственный",status:"статус",priority:"приоритет",progress:"прогресс",startDate:"дата постановки",dueDate:"срок",result:"результат"};
  var changes=[];
  Object.keys(labels).forEach(function(k){if(String(oldT[k]||"")!==String(newT[k]||""))changes.push(labels[k]+": «"+String(oldT[k]||"—")+"» → «"+String(newT[k]||"—")+"»");});
  return changes.join("; ");
}
function saveTask(e){
  e.preventDefault();
  var id=document.getElementById("taskId").value,data=formTask();
  if(!data.project||!data.title||!data.startDate||!data.dueDate)return;
  if(parseDate(data.dueDate)<parseDate(data.startDate)){alert("Срок не может быть раньше даты постановки.");return;}
  if(id){
    var t=taskById(id),before=Object.assign({},t);
    Object.assign(t,data,{updatedAt:nowIso()});
    var detail=describeChanges(before,t);
    log(id,"Изменение задачи",detail||"Сохранено без изменения полей");
  }else{
    var n=Object.assign({id:uid(),createdAt:nowIso(),updatedAt:nowIso()},data);
    state.tasks.push(n);log(n.id,"Новая задача",n.title);
  }
  save();closeModal();refreshAll();
}
function markDone(id){
  var t=taskById(id);if(!t)return;
  var before=t.status;t.status="Готово";t.progress=100;t.updatedAt=nowIso();
  log(id,"Статус","«"+before+"» → «Готово»");save();refreshAll();
}
function deleteCurrent(){
  var id=document.getElementById("taskId").value;if(!id)return;
  var t=taskById(id);if(!confirm("Удалить задачу «"+t.title+"»?"))return;
  state.tasks=state.tasks.filter(function(x){return x.id!==id;});
  log(id,"Удаление задачи",t.title);save();closeModal();refreshAll();
}
function takeSnapshot(){
  var note=prompt("Комментарий по итогам ревью (необязательно):","");
  if(note===null)return;
  var r={id:uid(),at:nowIso(),note:note,total:state.tasks.length,open:state.tasks.filter(function(t){return t.status!=="Готово";}).length,overdue:state.tasks.filter(isOverdue).length,blockers:state.tasks.filter(function(t){return t.status==="Блокер";}).length,done:state.tasks.filter(function(t){return t.status==="Готово";}).length};
  state.reviews.unshift(r);log("","Зафиксировано ревью","Снимок задач: "+r.total+", открыто: "+r.open+", просрочено: "+r.overdue+", блокеры: "+r.blockers);save();refreshAll();setView("reviews");
}
function exportJson(){
  var payload={version:"0.1.0",exportedAt:nowIso(),tasks:state.tasks,history:state.history,reviews:state.reviews};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="atom-weekly-review-"+dateOnly(new Date())+".json";a.click();URL.revokeObjectURL(a.href);
}
function importJson(file){
  var reader=new FileReader();
  reader.onload=function(){
    try{
      var p=JSON.parse(reader.result);
      if(!Array.isArray(p.tasks))throw new Error("Нет массива tasks");
      if(!confirm("Импорт заменит текущие задачи. Продолжить?"))return;
      state.tasks=p.tasks;state.history=Array.isArray(p.history)?p.history:[];state.reviews=Array.isArray(p.reviews)?p.reviews:[];
      log("","Импорт данных","Импортировано задач: "+state.tasks.length);save();refreshAll();
    }catch(e){alert("Не удалось импортировать файл: "+e.message);}
  };
  reader.readAsText(file);
}
function bindStatic(){
  document.getElementById("addTaskBtn").addEventListener("click",function(){openModal();});
  document.getElementById("closeModalBtn").addEventListener("click",closeModal);
  document.getElementById("cancelModalBtn").addEventListener("click",closeModal);
  document.getElementById("taskForm").addEventListener("submit",saveTask);
  document.getElementById("deleteTaskBtn").addEventListener("click",deleteCurrent);
  document.getElementById("snapshotBtn").addEventListener("click",takeSnapshot);
  document.getElementById("exportBtn").addEventListener("click",exportJson);
  document.getElementById("importInput").addEventListener("change",function(e){if(e.target.files[0])importJson(e.target.files[0]);e.target.value="";});
  document.querySelectorAll(".tab").forEach(function(btn){btn.addEventListener("click",function(){setView(btn.dataset.view);});});
  ["verticalFilter","statusFilter","ownerFilter","searchFilter"].forEach(function(id){document.getElementById(id).addEventListener(id==="searchFilter"?"input":"change",function(){renderTasks();renderGantt();});});
  document.getElementById("clearFiltersBtn").addEventListener("click",function(){["verticalFilter","statusFilter","ownerFilter","searchFilter"].forEach(function(id){document.getElementById(id).value="";});renderTasks();renderGantt();});
  document.getElementById("taskRows").addEventListener("click",function(e){var b=e.target.closest("[data-action]");if(!b)return;if(b.dataset.action==="edit")openModal(b.dataset.id);if(b.dataset.action==="done")markDone(b.dataset.id);});
  document.getElementById("taskModal").addEventListener("click",function(e){if(e.target.id==="taskModal")closeModal();});
}
init();
})();