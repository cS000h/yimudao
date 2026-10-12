// 验证迁移的实际风险：原版规则一致性、完整季节流程和小游戏结算。
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
function random(seed){let value=seed>>>0;return ()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};}
module.exports=function test(output){
  const {GameRuntime}=require(path.join(output,'runtime/GameRuntime.js'));
  const {GameClock}=require(path.join(output,'runtime/GameClock.js'));
  const {TemplateDocument}=require(path.join(output,'ui/TemplateTree.js'));
  const browserSource=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
  // Cocos 有意提高水渠权重；仅将参考版本这一项平衡规则对齐，其他玩法继续逐步比较。
  const original=browserSource.replace('if (k === "canal") return 局.雨 ? 3 : 2;', 'if (k === "canal") return 局.雨 ? 6 : 4;');
  assert.notEqual(original,browserSource,'browser canal weights should remain unchanged');
  const storage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),map};};
  const offline=()=>Promise.reject(new Error('offline'));
  const make=(seed,store=storage())=>{
    const saved=Math.random;Math.random=random(seed);
    try{return new GameRuntime({storage:store,playSound(){},request:offline});}finally{Math.random=saved;}
  };
  const probabilityRuntime=make(1),pc=probabilityRuntime.context,savedRandom=Math.random;
  try{
    for(const rainy of [false,true]){
      pc.局势=()=>({雨:rainy});pc.S.fieldEventSeen={};let canals=0;
      for(let i=0;i<12000;i++){Math.random=()=> (i+.5)/12000;if(pc.挑突发种()==='canal')canals++;}
      assert.equal(canals,rainy?Math.round(12000*6/19):4000,'Cocos canal probability');
    }
    pc.局势=()=>({旱:true});assert.equal(pc.挑突发种(),'drought');
    pc.局势=()=>({虫过:true});assert.equal(pc.挑突发种(),'pest');
    pc.局势=()=>({});pc.S.fieldEventSeen={canal:true};Math.random=()=>.999;assert.notEqual(pc.挑突发种(),'canal');
  }finally{Math.random=savedRandom;probabilityRuntime.dispose();}

  let compared=0,completed=0;
  for(let seed=1;seed<=30;seed++){
    const stream=random(seed),saved=Math.random;Math.random=stream;
    try{
      const r=new GameRuntime({storage:storage(),playSound(){},request:offline});
      const clock=new GameClock(),document=new TemplateDocument();
      const math=Object.create(Math);math.random=random(seed);
      const context={Math:math,document,localStorage:storage(),location:{protocol:'cocos:'},fetch:offline,
        performance:{now:()=>clock.now},setTimeout:clock.timeout,clearTimeout:clock.clear,setInterval:clock.interval,clearInterval:clock.clear,
        requestAnimationFrame:clock.animationFrame,scrollTo:document.scrollTo.bind(document),innerHeight:0,
        AbortController:class{signal={aborted:false};abort(){this.signal.aborted=true;}},console};
      context.window=context;vm.createContext(context);vm.runInContext(original,context);
      const compare=()=>{assert.equal(JSON.stringify(r.context.S),vm.runInContext('JSON.stringify(S)',context),'state differs at seed '+seed+' screen '+r.context.screen);for(const id of ['app','pest-dialog'])assert.equal(r.document.getElementById(id).innerHTML.replace(/<span class="kb-hint">[\s\S]*?<\/span>/g,''),document.getElementById(id).innerHTML.replace(/<span class="kb-hint">[\s\S]*?<\/span>/g,''),'template content differs at seed '+seed+' screen '+r.context.screen+' root '+id);compared++;};
      compare();
      const chooser=random(seed+99);
      for(let step=0;step<250;step++){
        const c=r.context,dialog=r.document.getElementById('pest-dialog');
        if(c.screen==='yearend'){completed++;break;}
        let elements=(dialog.open?dialog:r.document.getElementById('app')).querySelectorAll('[onclick]').filter(e=>!e.disabled);
        // 只选推进当前流程的动作，排除图鉴、流水账和已锁定选项。
        const ignored=/^(?:onWhy|on人情|onSound|onLock|openBook|openLog|openPractice|restart)\(/;
        elements=elements.filter(e=>!ignored.test(e.attributes.onclick));
        if(dialog.open)elements=elements.filter(e=>/^(?:finishPests|finishCanal|closePests)\(/.test(e.attributes.onclick));
        if(!elements.length&&dialog.open){c.finishPests(true);context.__target=null;vm.runInContext('finishPests(true)',context);}
        else {
          assert.ok(elements.length,'no advancing action at '+c.screen);
          const buttons=elements.filter(e=>/^onHot\(/.test(e.attributes.onclick));
          const choices=buttons.length?buttons:elements;
          const element=choices[Math.floor(chooser()*choices.length)],action=element.attributes.onclick;
          r.invoke(action,element);
          context.__target=(document.getElementById('pest-dialog').open?document.getElementById('pest-dialog'):document.getElementById('app')).querySelectorAll('[onclick]').find(e=>e.attributes.onclick===action);
          vm.runInContext(action.replace(/\bthis\b/g,'__target'),context);
        }
        for(let tick=0;tick<10;tick++){r.tick(.1);clock.tick(100);}
        compare();
      }
      r.dispose();clock.dispose();
    }finally{Math.random=saved;}
  }
  assert.equal(completed,30,'all random seasons should reach settlement');
  const store=storage(),r=make(100,store),c=r.context;
  r.invoke('openPractice()');
  const untouched=JSON.stringify(c.S);
  for(const key of ['pest','pestFixed','drought','weeds']){
    r.invoke(`openPests(true,'${key}')`);r.invoke('beginPests()');
    const targets=r.document.getElementById('pest-dialog').querySelectorAll('.pest-bug');
    for(let i=0;i<targets.length;i++)for(let hit=0;hit<c.practiceEvents[key].hits;hit++)r.invoke(`catchPest(${i},this)`,targets[i]);
    assert.equal(c.pestEvent.phase,'done');assert.equal(JSON.stringify(c.S),untouched);r.invoke('closePests()');
  }
  for(let index=0;index<16;index++){
    r.invoke("openPests(true,'canal')");r.invoke('beginCanal()');
    c.pestEvent.mapIndex=index;c.pestEvent.tiles=c.makeCanal(index);
    const route=c.canalMaps[index];
    for(let i=1;i<route.length-1;i++){
      const cell=route[i];let mask=0;
      for(const n of [route[i-1],route[i+1]])mask|=n===cell-4?1:n===cell+1?2:n===cell+4?4:8;
      for(let turns=0;turns<4&&(c.pestEvent.tiles[cell]&mask)!==mask;turns++)r.invoke(`turnCanal(${cell})`);
    }
    assert.equal(c.pestEvent.phase,'done','canal route '+index);assert.equal(JSON.stringify(c.S),untouched);r.invoke('closePests()');
  }
  r.invoke("openPests(true,'pest')");r.invoke('beginPests()');r.setHidden(true);r.tick(20);assert.equal(c.pestEvent.remaining,15000);r.setHidden(false);
  for(let i=0;i<151;i++)r.tick(.1);assert.equal(c.pestEvent.phase,'done');r.invoke('closePests()');
  // 正式事件确实影响收成，且重复结束不会再次结算。
  c.screen='decision';c.S.选了=null;c.S.termIndex=1;c.S.fieldEventSeen={};c.S.stamina=40;
  const beforeHarvest=c.S.stats.harvest;
  r.invoke("openPests(false,'canal')");r.invoke('beginCanal()');r.invoke('beginCanal()');assert.equal(c.S.stamina,32);
  r.invoke('finishCanal(true)');const afterHarvest=c.S.stats.harvest;r.invoke('finishCanal(true)');
  assert.equal(c.S.stats.harvest,afterHarvest);assert.equal(afterHarvest,beforeHarvest-2);r.invoke('closePests()');
  c.S.fieldEventSeen={};c.S.stamina=40;r.invoke("openPests(false,'pestFixed')");r.invoke('beginPests()');
  const targets=r.document.getElementById('pest-dialog').querySelectorAll('.pest-bug');
  for(let i=0;i<targets.length;i++)for(let hit=0;hit<3;hit++)r.invoke(`catchPest(${i},this)`,targets[i]);
  assert.equal(c.S.stats.harvest,afterHarvest+8);r.invoke('closePests()');
  c.存档({季:4,名望:30});const next=make(101,store);assert.equal(next.context.S.季,4);
  assert.throws(()=>r.invoke("startGame();alert('x')"));
  console.log(`PASS: ${compared} original/migrated state and template comparisons; 30 complete seasons; 5 practice types; 16 canal maps; live rewards/costs; background pause; persistent season; action safety`);
  r.dispose();next.dispose();
};
