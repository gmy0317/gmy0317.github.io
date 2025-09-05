/* ===== Clock ===== */
function updateClock(){const el=document.getElementById('clock');if(!el)return;const n=new Date();const y=n.getFullYear(),m=String(n.getMonth()+1).padStart(2,'0'),d=String(n.getDate()).padStart(2,'0'),hh=String(n.getHours()).padStart(2,'0'),mm=String(n.getMinutes()).padStart(2,'0'),ss=String(n.getSeconds()).padStart(2,'0');el.textContent=`${y}-${m}-${d} ${hh}:${mm}:${ss}`;}
setInterval(updateClock,1000);updateClock();

/* ===== LiveChart (Canvas) — from your original scaffold ===== */
class LiveChart{
  constructor(canvas,opts){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.opts=Object.assign({seconds:90,fps:20,min:0,max:100,color:'rgba(160,200,255,0.9)',fill:'rgba(160,200,255,0.12)',labelEl:null,gen:()=>0,units:''},opts||{});this.data=[];this.lastFrame=0;this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);}
  loop(ts){if(ts-this.lastFrame>=1000/this.opts.fps){this.lastFrame=ts;const t=Date.now()/1000;let v=this.opts.gen(t);v=Math.max(this.opts.min,Math.min(this.opts.max,v));this.data.push({t,v});const cutoff=t-this.opts.seconds;while(this.data.length&&this.data[0].t<cutoff)this.data.shift();this.draw();if(this.opts.labelEl)this.opts.labelEl.textContent=`${this.data[this.data.length-1].v.toFixed(2)} ${this.opts.units}`;}requestAnimationFrame(this.loop);}
  draw(){const{canvas,ctx,opts}=this;const w=canvas.clientWidth,h=canvas.clientHeight||150;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);const padL=40,padR=10,padT=10,padB=20,x0=padL,y0=padT,x1=w-padR,y1=h-padB,pw=x1-x0,ph=y1-y0;ctx.fillStyle='rgba(8,14,24,0.9)';ctx.fillRect(x0,y0,pw,ph);ctx.strokeStyle='rgba(120,150,190,0.25)';ctx.strokeRect(x0+.5,y0+.5,pw-1,ph-1);
    ctx.lineWidth=1;ctx.strokeStyle='rgba(120,150,190,0.2)';const ySteps=4;for(let i=0;i<=ySteps;i++){const y=y0+(ph*i/ySteps);ctx.beginPath();ctx.moveTo(x0,y);ctx.lineTo(x1,y);ctx.stroke();const v=opts.max-(opts.max-opts.min)*i/ySteps;ctx.fillStyle='rgba(200,220,255,0.6)';ctx.font='11px Inter, sans-serif';ctx.textAlign='right';ctx.fillText(v.toFixed(0),x0-6,y+4);}
    const now=Date.now()/1000,tMin=now-opts.seconds,xTicks=5;for(let i=0;i<=xTicks;i++){const tx=tMin+(opts.seconds*i/xTicks);const x=x0+(tx-tMin)/opts.seconds*pw;ctx.beginPath();ctx.moveTo(x,y1);ctx.lineTo(x,y1+4);ctx.stroke();const dt=new Date(tx*1000);const hh=String(dt.getHours()).padStart(2,'0'),mm=String(dt.getMinutes()).padStart(2,'0'),ss=String(dt.getSeconds()).padStart(2,'0');ctx.textAlign='center';ctx.fillStyle='rgba(200,220,255,0.6)';ctx.fillText(`${hh}:${mm}:${ss}`,x,h-4);}
    if(this.data.length>=2){ctx.beginPath();for(let i=0;i<this.data.length;i++){const{t,v}=this.data[i];const x=x0+(t-tMin)/opts.seconds*pw;const y=y1-(v-opts.min)/(opts.max-opts.min)*ph;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.lineWidth=2;ctx.strokeStyle=opts.color;ctx.stroke();const last=this.data[this.data.length-1];ctx.lineTo(x0+(last.t-tMin)/opts.seconds*pw,y1);ctx.lineTo(x0+(this.data[0].t-tMin)/opts.seconds*pw,y1);ctx.closePath();ctx.fillStyle=opts.fill;ctx.fill();}
  }
}

/* ===== signal generators ===== */
const makeSineGen=({base=0,amp=1,freq=0.05,noise=0.02,trend=0})=>{const phase=Math.random()*Math.PI*2;return t=>base+amp*Math.sin(2*Math.PI*freq*t+phase)+trend*(t%1000)/1000+(Math.random()*2-1)*noise*amp;}
const makeClampedGen=({min,max,drift=0,jitter=0.2})=>{let v=(min+max)/2;return()=>{v+=(Math.random()*2-1)*jitter+drift;if(v<min)v=min+(min-v)*0.2;if(v>max)v=max-(v-max)*0.2;return v;}}
const makeTrendUp=({start,slope=0.02,noise=0.2,cap=95})=>{let v=start;return()=>{v+=slope+(Math.random()*2-1)*noise;if(v>cap)v=cap-Math.random()*0.3;return Math.min(v,cap);}}

/* ===== stages & metrics ===== */
const STAGES={
  prep:{name:'Preparation',metrics:[]},
  cnc_stamp:{name:'CNC Stamping',metrics:[
    {key:'moldTemp',label:'Mold Temperature',units:'°C',min:30,max:80,hint:'推荐 40–60°C',normal:()=>makeClampedGen({min:40,max:60,jitter:0.25}),faultHigh:()=>makeTrendUp({start:62,slope:0.15,noise:0.12,cap:92}),color:'rgba(255,210,140,.95)',fill:'rgba(255,210,140,.14)'},
    {key:'spindleSpeed',label:'Spindle Speed',units:'SPM',min:800,max:1500,normal:()=>makeClampedGen({min:950,max:1350,jitter:2.5}),faultHigh:()=>makeClampedGen({min:1300,max:1500,jitter:3.5}),faultLow:()=>makeClampedGen({min:800,max:950,jitter:2.0}),color:'rgba(255,170,200,.95)',fill:'rgba(255,130,180,.12)'},
    {key:'spindleVib',label:'Spindle Vibration',units:'mm/s',min:0,max:10,normal:()=>makeSineGen({base:4.2,amp:1.2,freq:0.01,noise:0.08}),faultHigh:()=>makeSineGen({base:5.2,amp:1.6,freq:0.012,noise:0.12}),color:'rgba(150,200,255,.95)',fill:'rgba(120,170,255,.15)'},
    {key:'cutDepth',label:'Spindle Cutting Depth',units:'µm',min:50,max:150,hint:'±0.05–±0.15 mm',normal:()=>makeClampedGen({min:70,max:120,jitter:0.6}),faultHigh:()=>makeClampedGen({min:120,max:150,jitter:1.1}),color:'rgba(180,200,255,.95)',fill:'rgba(130,160,255,.12)'}
  ]},
  cnc_finish:{name:'CNC Finishing',metrics:[]},
  polish:{name:'Polishing',metrics:[
    {key:'polishPress',label:'Polishing Pressure',units:'N',min:50,max:150,normal:()=>makeClampedGen({min:70,max:120,jitter:0.8}),faultHigh:()=>makeClampedGen({min:50,max:150,jitter:1.4}),color:'rgba(160,220,255,.95)',fill:'rgba(120,200,255,.12)'},
    {key:'oxCurrent',label:'Oxidation Current',units:'A/dm²',min:1,max:2,normal:()=>makeClampedGen({min:1.2,max:1.8,jitter:0.01}),faultHigh:()=>makeClampedGen({min:1.6,max:2.0,jitter:0.02}),faultLow:()=>makeClampedGen({min:1.0,max:1.2,jitter:0.01}),color:'rgba(160,255,200,.95)',fill:'rgba(100,240,180,.12)'}
  ]},
  clean:{name:'Cleaning',metrics:[]},
  semi:{name:'Semi‑finished',metrics:[]}
};

/* ===== roster: Day 34 + Night 16 ===== */
const rosterBase={
  day:[
    {name:'王强',lv:'S',years:15,shift:'白班',arrived:true,status:'在修',skills:['CNC','Hydraulics','Drive']},
    {name:'李娜',lv:'M',years:6, shift:'白班',arrived:true,status:'在修',skills:['Coolant','Fixture']},
    {name:'陈晨',lv:'M',years:4, shift:'白班',arrived:true,status:'排队',skills:['Polish','Fixture']},
    {name:'刘伟',lv:'S',years:10,shift:'白班',arrived:true,status:'在修',skills:['Encoder','Servo']},
    {name:'张颖',lv:'J',years:2, shift:'白班',arrived:true,status:'排队',skills:['CNC','Cleaning']},
    {name:'赵磊',lv:'M',years:5, shift:'白班',arrived:true,status:'在修',skills:['Coolant','Lubrication']},
    {name:'孙浩',lv:'M',years:7, shift:'白班',arrived:true,status:'待命',skills:['CNC','Cooling']},
    {name:'周敏',lv:'J',years:1, shift:'白班',arrived:true,status:'待命',skills:['Cleaning']},
    {name:'胡凯',lv:'S',years:12,shift:'白班',arrived:true,status:'巡检',skills:['Vibration','Lubrication']},
    {name:'郑洋',lv:'M',years:6, shift:'白班',arrived:true,status:'待命',skills:['Polish']},
    {name:'何静',lv:'M',years:5, shift:'白班',arrived:true,status:'待命',skills:['CNC']},
    {name:'曹瑞',lv:'S',years:9, shift:'白班',arrived:true,status:'在修',skills:['Servo','Encoder']},
    {name:'彭超',lv:'M',years:6, shift:'白班',arrived:true,status:'待命',skills:['Fixture']},
    {name:'吕丹',lv:'J',years:2, shift:'白班',arrived:true,status:'培训',skills:['Polish']},
    {name:'谢飞',lv:'M',years:5, shift:'白班',arrived:true,status:'待命',skills:['CNC']},
    {name:'邵林',lv:'S',years:11,shift:'白班',arrived:true,status:'巡检',skills:['Cooling','Hydraulics']},
    {name:'宋琪',lv:'M',years:4, shift:'白班',arrived:true,status:'待命',skills:['Polish']},
    {name:'蒋泽',lv:'J',years:1, shift:'白班',arrived:true,status:'待命',skills:['Cleaning']},
    {name:'于涛',lv:'M',years:6, shift:'白班',arrived:true,status:'待命',skills:['Drive']},
    {name:'陆琴',lv:'J',years:2, shift:'白班',arrived:true,status:'待命',skills:['Encoder']},
    {name:'韩磊',lv:'M',years:5, shift:'白班',arrived:false,status:'请假',skills:['CNC']}, /* 唯一缺勤 */
    {name:'齐亮',lv:'S',years:13,shift:'白班',arrived:true,status:'待命',skills:['Hydraulics']},
    {name:'童悦',lv:'M',years:6, shift:'白班',arrived:true,status:'待命',skills:['Cooling']},
    {name:'马楠',lv:'J',years:2, shift:'白班',arrived:true,status:'待命',skills:['Cleaning']},
    {name:'董倩',lv:'M',years:6, shift:'白班',arrived:true,status:'待命',skills:['CNC']},
    {name:'程峰',lv:'S',years:14,shift:'白班',arrived:true,status:'在修',skills:['Drive','Hydraulics']},
    {name:'石磊',lv:'M',years:7, shift:'白班',arrived:true,status:'待命',skills:['Fixture']},
    {name:'黎敏',lv:'M',years:5, shift:'白班',arrived:true,status:'待命',skills:['Polish']},
    {name:'贾宁',lv:'J',years:1, shift:'白班',arrived:true,status:'待命',skills:['Encoder']},
    {name:'向宇',lv:'M',years:6, shift:'白班',arrived:true,status:'待命',skills:['Servo']},
    {name:'汤帅',lv:'J',years:1, shift:'白班',arrived:true,status:'待命',skills:['Cooling']},
    {name:'侯璐',lv:'M',years:5, shift:'白班',arrived:true,status:'待命',skills:['Polish']},
    {name:'魏来',lv:'J',years:2, shift:'白班',arrived:true,status:'待命',skills:['Cleaning']},
    {name:'尹杰',lv:'M',years:6, shift:'白班',arrived:true,status:'待命',skills:['CNC']}
  ],
  night:[
    {name:'高宁',lv:'S',years:12,shift:'夜班',arrived:true,status:'待命',skills:['CNC','Hydraulics']},
    {name:'鲁峰',lv:'M',years:6, shift:'夜班',arrived:true,status:'待命',skills:['Cooling']},
    {name:'钱睿',lv:'J',years:1, shift:'夜班',arrived:true,status:'待命',skills:['Cleaning']},
    {name:'邱爽',lv:'M',years:5, shift:'夜班',arrived:true,status:'在修',skills:['Polish']},
    {name:'贺斌',lv:'M',years:7, shift:'夜班',arrived:true,status:'待命',skills:['Servo']},
    {name:'罗琦',lv:'J',years:2, shift:'夜班',arrived:true,status:'待命',skills:['Fixture']},
    {name:'魏晨',lv:'M',years:4, shift:'夜班',arrived:true,status:'巡检',skills:['Cooling']},
    {name:'程琳',lv:'J',years:2, shift:'夜班',arrived:true,status:'待命',skills:['Encoder']},
    {name:'付强',lv:'S',years:14,shift:'夜班',arrived:true,status:'在修',skills:['Drive']},
    {name:'童凯',lv:'M',years:5, shift:'夜班',arrived:true,status:'待命',skills:['CNC']},
    {name:'姚杰',lv:'J',years:1, shift:'夜班',arrived:true,status:'培训',skills:['Polish']},
    {name:'顾欣',lv:'M',years:4, shift:'夜班',arrived:true,status:'待命',skills:['Cleaning']},
    {name:'谢宁',lv:'M',years:6, shift:'夜班',arrived:true,status:'待命',skills:['CNC']},
    {name:'兰波',lv:'J',years:2, shift:'夜班',arrived:true,status:'待命',skills:['Lubrication']},
    {name:'杜浩',lv:'M',years:5, shift:'夜班',arrived:true,status:'待命',skills:['Fixture']},
    {name:'俞晨',lv:'S',years:11,shift:'夜班',arrived:true,status:'巡检',skills:['Vibration']}
  ]
};
let roster=JSON.parse(JSON.stringify(rosterBase));

/* ===== tasks ===== */
const taskSeed=[
  {id:'WO-10021',title:'Spindle #2 Bearing Inspection',owner:'王强',status:'进行中',pri:'高',eta:'40min'},
  {id:'WO-10022',title:'Coolant Filter Replacement',owner:'李娜',status:'进行中',pri:'中',eta:'25min'},
  {id:'WO-10023',title:'Polishing Head Alignment',owner:'陈晨',status:'排队',pri:'中',eta:'—'},
  {id:'WO-10024',title:'Encoder F31150 校验',owner:'刘伟',status:'进行中',pri:'中',eta:'35min'},
  {id:'WO-10025',title:'Clamp Tightening Audit',owner:'张颖',status:'排队',pri:'低',eta:'—'},
  {id:'WO-10026',title:'Cleaning Bath Titration',owner:'赵磊',status:'进行中',pri:'中',eta:'50min'}
];

/* ===== helpers ===== */
const $=id=>document.getElementById(id);
const peopleAll=()=>roster.day.concat(roster.night);

/* ===== render: metrics ===== */
let charts=[];function clearCharts(){charts.forEach(c=>c&&(c.data=[]));charts=[];}
function renderMetrics(stageKey,faultSpec=null){
  const grid=$('metrics-grid'),title=$('stage-title');grid.innerHTML='';clearCharts();title.textContent=STAGES[stageKey].name;
  const mlist=STAGES[stageKey].metrics;
  if(!mlist||mlist.length===0){grid.innerHTML=`<div class="empty">该工序暂无实时监测指标。请选择 <strong>CNC Stamping</strong> 或 <strong>Polishing</strong> 查看示例曲线。</div>`;return;}
  mlist.forEach(m=>{
    const card=document.createElement('div');card.className='metric';
    const hint=m.hint?`<span class="range-hint">${m.hint}</span>`:'';card.innerHTML=`<div class="subcard-title">${m.label} (${m.units}) ${hint}</div><canvas id="chart-${m.key}" height="150"></canvas><div class="metric-meta"><span class="range-hint">范围 ${m.min}–${m.max} ${m.units}</span><span id="val-${m.key}">--</span></div>`;
    grid.appendChild(card);
    let genFn=m.normal;if(faultSpec&&faultSpec[m.key]){const mode=faultSpec[m.key];if(mode==='low'&&m.faultLow)genFn=m.faultLow;else if(mode==='high'&&m.faultHigh)genFn=m.faultHigh;else if(mode===true&&(m.faultHigh||m.fault))genFn=(m.faultHigh||m.fault);}
    charts.push(new LiveChart($(`chart-${m.key}`),{seconds:120,min:m.min,max:m.max,color:m.color,fill:m.fill,units:m.units,labelEl:$(`val-${m.key}`),gen:genFn()}));
  });
}

/* ===== render: tasks ===== */
function renderTasks(list){const ul=$('task-list-main');ul.innerHTML='';list.forEach(t=>{const li=document.createElement('li');li.className='task';li.innerHTML=`<div class="t-head">${t.id} — ${t.title}</div><div class="t-sub">负责人：${t.owner}　状态：${t.status}　ETA：${t.eta}</div><div class="t-tags"><span class="tag ${t.pri==='高'?'pri':''}">优先级：${t.pri}</span><span class="tag ${t.status==='进行中'?'run':''}">进度</span></div>`;ul.appendChild(li);});}

/* ===== render: crew (derived from roster) ===== */
function renderCrewBoard(){
  const expectedDay=rosterBase.day.length,expectedNight=rosterBase.night.length;
  const arrivedDay=roster.day.filter(p=>p.arrived).length,arrivedNight=roster.night.filter(p=>p.arrived).length;
  const inwork=peopleAll().filter(p=>p.arrived&&String(p.status).startsWith('在修')).length;
  $('bar-day').style.width=`${Math.round(arrivedDay/expectedDay*100)}%`;
  $('bar-night').style.width=`${Math.round(arrivedNight/expectedNight*100)}%`;
  $('meta-day').textContent=`预期 ${expectedDay} • 实到 ${arrivedDay}`;
  $('meta-night').textContent=`预期 ${expectedNight} • 实到 ${arrivedNight}`;
  $('crew-inwork').textContent=String(inwork);
}

/* ===== render: people board (with filter chips) ===== */
let peopleScope='all'; // all | day | night
function renderPeopleFilters(){
  const pf=$('people-filters');const total=peopleAll().length,dayN=roster.day.length,nightN=roster.night.length;
  pf.innerHTML=`<button class="chip ${peopleScope==='all'?'active':''}" data-scope="all">全部 ${total}</button><button class="chip ${peopleScope==='day'?'active':''}" data-scope="day">白班 ${dayN}</button><button class="chip ${peopleScope==='night'?'active':''}" data-scope="night">夜班 ${nightN}</button>`;
  pf.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{peopleScope=b.dataset.scope;renderPeopleFilters();renderPeopleBoard();}));
}
function peopleInScope(){if(peopleScope==='day')return roster.day; if(peopleScope==='night')return roster.night; return peopleAll();}
function renderPeopleBoard(){
  const holder=$('people-holder'),stats=$('people-stats');holder.innerHTML='';
  const arr=peopleInScope();
  const arrived=arr.filter(p=>p.arrived).length,absent=arr.length-arrived,inwork=arr.filter(p=>p.arrived&&String(p.status).startsWith('在修')).length,standby=arr.filter(p=>p.status==='待命').length,patrol=arr.filter(p=>p.status==='巡检').length,train=arr.filter(p=>p.status==='培训').length;
  stats.innerHTML=`<span class="stat">人数 <strong>${arr.length}</strong></span><span class="stat">出勤 <strong>${arrived}</strong></span><span class="stat">在修 <strong>${inwork}</strong></span><span class="stat">待命 <strong>${standby}</strong></span><span class="stat">巡检 <strong>${patrol}</strong></span><span class="stat">培训 <strong>${train}</strong></span><span class="stat">缺勤 <strong>${absent}</strong></span>`;
  const head=document.createElement('div');head.className='person-row';head.style.fontWeight='700';head.innerHTML=`<div>姓名 / 等级</div><div>班次</div><div>工龄</div><div>技能</div><div>状态</div><div>备注</div>`;holder.appendChild(head);
  arr.forEach(p=>{const row=document.createElement('div');row.className='person-row';const stClass=p.arrived?(String(p.status).startsWith('在修')?'run':(p.status==='待命'?'wait':(p.status==='巡检'?'patrol':(p.status==='培训'?'wait':'wait')))):'absent';row.innerHTML=`<div class="person-name"><span class="avatar">${p.name.slice(-1)}</span><strong>${p.name}</strong><span class="badge-lv">${p.lv}</span></div><div><span class="shift-pill">${p.shift}</span></div><div>${p.years} 年</div><div class="skills">${(p.skills||[]).map(s=>`<span class="skill">${s}</span>`).join('')}</div><div><span class="status-pill ${stClass}">${p.arrived?p.status:'缺勤'}</span></div><div>${p.remark||''}</div>`;holder.appendChild(row);});
}

/* ===== Alerts (5 types from knowledge HTML) ===== */
const ALERT_LIBRARY=[
  {id:'mold_temp_high',stage:'cnc_stamp',title:'CNC 冲压 · 1#模具温度异常升高（伴随冒烟）',severity:'严重',desc:'模具温度超过上限 80 ℃；可伴随毛刺增大、模具表面变色或粘连材料。',reasons:['冲压频率过快（效率设定过高，热积累）。','润滑不足或失效（喷嘴堵塞 / 参数不当 / 润滑液状态不佳）。','冷却系统异常（流量/循环/换热不良）。'],actions:['立即降低冲压速度，必要时采用“跳冲”模式。','检查并优化润滑系统（喷嘴、参数、润滑液）。','检查冷却系统并优化冷却参数。'],faultSpec:{moldTemp:'high'}},
  {id:'cut_depth_oob',stage:'cnc_stamp',title:'CNC 冲压 · 1#主轴切削深度越限 / 精度下降',severity:'告警',desc:'名义范围 50–150 µm（±0.05–±0.15 mm）；加工件尺寸/形状精度变差。',reasons:['精度下降导致尺寸/形状超差。'],actions:['检查主轴形变量；检查主轴轴承之间的装配情况。'],faultSpec:{cutDepth:true}},
  {id:'spindle_speed_abn',stage:'cnc_stamp',title:'CNC 冲压 · 1#主轴速度异常',severity:'告警',pickVariant:()=>Math.random()<0.5?'low':'high',variant:{
    low:{desc:'转速过低（<800 SPM）。',reasons:['可能因程序/参数误设；低速一般更安全但可能影响节拍。'],actions:['复核程序设定与工艺参数，恢复至 800–1500 SPM 工艺窗口。'],faultSpec:{spindleSpeed:'low'}},
    high:{desc:'转速过高或逼近上限（>1500 SPM）。',reasons:['主电机/驱动器异常或参数设置不当；','润滑不良/轴承磨损导致传动阻力增大；','高速振动噪音：动平衡失效、紧固件松动或模具夹紧不良。'],actions:['降低速度并检查电机/驱动器报警，必要时调整伺服参数；','检查润滑系统与轴承工况；','若振动/噪音巨大，立即停机，做动平衡与全面紧固，复核模具夹紧。'],faultSpec:{spindleSpeed:'high'}}
  }},
  {id:'polish_pressure_abn',stage:'polish',title:'抛光 · 抛光压力异常（不足/过高）',severity:'告警',desc:'名义范围 50–150 N；可见表面划痕或抛光头松动迹象。',reasons:['压力不足或压力过高；','抛光头转速设置不当；','压力传动器/压力源异常或抛光头松动。'],actions:['校正抛光头转速。','检查压力传动器与压力源。','拧紧抛光头。'],faultSpec:{polishPress:true}},
  {id:'oxidation_current_abn',stage:'polish',title:'抛光 · 氧化电流异常',severity:'告警',pickVariant:()=>Math.random()<0.5?'low':'high',variant:{
    high:{desc:'过电流（>2 A/dm²）→ 过腐蚀：棱角球化、麻点/凹坑、失去光泽。',reasons:['电流/电压过高导致过腐蚀。'],actions:['立即降低电流/电压，检查槽液状态。'],faultSpec:{oxCurrent:'high'}},
    low:{desc:'电流过低（<1 A/dm²）→ 抛光不足、光泽差、处理时间延长。',reasons:['电流不足或导电回路/槽液状态不佳。'],actions:['适当提高电流/电压；延长抛光时间；检查导电回路与槽液状态。'],faultSpec:{oxCurrent:'low'}}
  }}
];

/* ===== Alerts rendering ===== */
function setActiveStage(stageKey){const stepper=document.getElementById('line-stepper');stepper.querySelectorAll('.step').forEach(b=>b.classList.toggle('active',b.dataset.stage===stageKey));}
function clearAlerts(){const box=$('alert-list');box.innerHTML=`<div class="empty">暂无告警。点击底部按钮可触发仿真告警演示。</div>`;}
function renderAlertCard(scn,picked){const sevCls=scn.severity==='严重'?'danger':'warn';const desc=picked?.desc||scn.desc;const reasons=(picked?.reasons||scn.reasons||[]).map(x=>`<li>${x}</li>`).join('');const actions=(picked?.actions||scn.actions||[]).map(x=>`<li>${x}</li>`).join('');return `<div class="alert"><div class="alert-title"><span class="badge ${sevCls}">${scn.severity}</span> ${scn.title}</div><div class="alert-sub">${desc}</div><div class="alert-sub alert-list"><strong>可能原因</strong><ul>${reasons}</ul><strong>建议措施</strong><ul>${actions}</ul><span class="range-hint">（因果与处置来自「Macbook故障 5.0 树状图」知识条目）</span></div></div>`;}
let activeAlert=null;

/* ===== Dify / shortcuts & knowledge buttons ===== */
function wireAssistantShortcuts(){
  const wrapper=$('difyWrapper'),toggle=$('toggleMode');
  if(wrapper&&toggle){toggle.addEventListener('click',()=>{if(wrapper.classList.contains('filter-darken')){wrapper.classList.remove('filter-darken');wrapper.classList.add('overlay-darken');toggle.textContent='切换为颜色反转';}else{wrapper.classList.remove('overlay-darken');wrapper.classList.add('filter-darken');toggle.textContent='切换为遮罩模式';}});}
  const iframe=$('assistant-iframe'),title=$('assistant-title'),btnAsk=$('btn-ask'),btnLog=$('btn-log');
  if(btnAsk)btnAsk.addEventListener('click',e=>{e.preventDefault();iframe.src='https://udify.app/chat/LnwnQ3e2yGRQdc1Z';title.textContent='Agent Assistant（Dify）— Ask maintenance';document.getElementById('assistant').scrollIntoView({behavior:'smooth'});});
  if(btnLog)btnLog.addEventListener('click',e=>{e.preventDefault();iframe.src='https://udify.app/chat/CqHQ4RmaDJ8o1s5D';title.textContent='Agent Assistant（Dify）— Log repair';document.getElementById('assistant').scrollIntoView({behavior:'smooth'});});
}
function wireKnowledgeButtons(){
  const iframe=$('assistant-iframe'),title=$('assistant-title');
  document.querySelectorAll('.knowledge-btn').forEach(btn=>btn.addEventListener('click',()=>{iframe.src='https://udify.app/chat/LnwnQ3e2yGRQdc1Z';title.textContent=`Agent Assistant（Dify）— ${btn.textContent.split('\n')[0]}`;document.getElementById('assistant').scrollIntoView({behavior:'smooth'});}));}

/* ===== stepper ===== */
function wireStepper(){const stepper=document.getElementById('line-stepper');stepper.querySelectorAll('.step').forEach(btn=>btn.addEventListener('click',()=>{stepper.querySelectorAll('.step').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const stage=btn.dataset.stage;if(activeAlert&&activeAlert.stage===stage){const picked=activeAlert._pickedVariant||null;const faultSpec=picked?.faultSpec||activeAlert.faultSpec||null;renderMetrics(stage,faultSpec);}else{renderMetrics(stage,null);}}));}

/* ===== demo button: random alert + staff pairing (across both shifts) ===== */
let demoActive=false;function pickRandomAlert(){const scn=ALERT_LIBRARY[Math.floor(Math.random()*ALERT_LIBRARY.length)];const pickedName=scn.pickVariant?scn.pickVariant():null;const picked=pickedName?scn.variant[pickedName]:null;return {...scn,_pickedVariant:picked};}
function pickStaffForEmergency(){const pool=peopleAll().filter(p=>p.arrived&&!String(p.status).startsWith('在修'));let senior=pool.find(p=>p.lv==='S')||pool.find(p=>p.lv==='M')||pool[0];let junior=pool.find(p=>p.lv==='J'&&p!==senior)||pool.find(p=>p.lv==='M'&&p!==senior)||pool.find(p=>p!==senior);return {senior,junior};}
function wireDemoButton(){
  const btn=$('btn-demo');
  btn.addEventListener('click',()=>{
    demoActive=!demoActive;
    if(demoActive){
      btn.classList.add('stop');btn.textContent='✅ 停止演示 / 恢复正常';
      activeAlert=pickRandomAlert();const picked=activeAlert._pickedVariant||null;const stage=activeAlert.stage;const faultSpec=picked?.faultSpec||activeAlert.faultSpec||null;
      setActiveStage(stage);renderMetrics(stage,faultSpec);$('alert-list').innerHTML=renderAlertCard(activeAlert,picked);
      // 老带新：跨班组择优
      const {senior,junior}=pickStaffForEmergency();if(senior){senior.status='在修(加急)';senior.remark='应急支援';}if(junior){junior.status='在修(加急)';junior.remark='应急支援';}
      const extra={id:'WO-EMERG',title:`${activeAlert.title}（老带新）`,owner:`${senior?senior.name:'—'}${junior?' + '+junior.name:''}`,status:'加急出勤',pri:'高',eta:'→ 现场中'};
      renderTasks([extra,...taskSeed]);renderCrewBoard();renderPeopleBoard();
    }else{
      btn.classList.remove('stop');btn.textContent='🚦 启动仿真故障演示';activeAlert=null;clearAlerts();roster=JSON.parse(JSON.stringify(rosterBase)); // reset
      const active=document.querySelector('.step.active')?.dataset.stage||'cnc_stamp';renderMetrics(active,null);renderTasks(taskSeed);renderCrewBoard();renderPeopleBoard();
    }
  });
}

/* ===== boot ===== */
window.addEventListener('DOMContentLoaded',()=>{
  wireAssistantShortcuts();wireKnowledgeButtons();wireStepper();wireDemoButton();
  setActiveStage('cnc_stamp');renderMetrics('cnc_stamp',null);
  clearAlerts();renderTasks(taskSeed);renderCrewBoard();renderPeopleFilters();renderPeopleBoard();
});
