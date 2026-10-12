const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];new Function(source);
const nodes={};let tick,now=0;
const element=()=>({innerHTML:'',style:{},textContent:'',focus(){},showModal(){},close(){},addEventListener(){},querySelector(){return element()}});
const context={assert,练图:{},Math,performance:{now:()=>now},document:{hidden:false,addEventListener(){},getElementById:id=>nodes[id]??=element()},setInterval:f=>tick=f,screen:'decision',S:{stamina:40,termIndex:1,选了:null,节气:Array(8).fill({term:'小满'}),stats:{harvest:600},log:[]},备事(){},render(){},响(){},applyEffect(s,e){s.stats.harvest+=e.harvest;return e;}};
vm.createContext(context);vm.runInContext(source.slice(source.indexOf('/* 首页练习独立')),context);
const run=s=>vm.runInContext(s,context);
run(`
assert.equal(new Set(canalMaps.map(r=>r.join(','))).size,16);
function solve(tiles,index,click=false){canalMaps[index].forEach((cell,i,route)=>{if(cell===0||cell===15)return;let mask=0;for(const n of [route[i-1],route[i+1]])mask|=n===cell-4?1:n===cell+1?2:n===cell+4?4:8;for(let r=0;r<4&&(tiles[cell]&mask)!==mask;r++){if(click)turnCanal(cell);else tiles[cell]=rotatePipe(tiles[cell]);}});}
for(let map=0;map<16;map++)for(let sample=0;sample<25;sample++){
 const tiles=makeCanal(map);assert.equal(canalWater(tiles).won,false);assert.ok(tiles.some(m=>[7,11,13,14].includes(m)));assert.equal(tiles[0],10);assert.equal(tiles[15],10);solve(tiles,map);assert.equal(canalWater(tiles).won,true);
}
openPests(false,'canal');assert.equal(S.stamina,40);beginCanal();beginCanal();assert.equal(S.stamina,32);turnCanal(0);assert.equal(pestEvent.tiles[0],10);solve(pestEvent.tiles,pestEvent.mapIndex,true);assert.equal(pestEvent.phase,'done');assert.equal(S.stats.harvest,608);finishPests();assert.equal(S.log.length,1);closePests();openPests(false,'canal');assert.equal(pestEvent,null);
S.fieldEventSeen={};S.stamina=7;openPests(false,'canal');beginCanal();assert.equal(pestEvent.phase,'ready');finishPests(true);assert.equal(S.stamina,7);assert.equal(S.stats.harvest,608);closePests();
screen='practice';const before=JSON.stringify(S);openPests(true,'canal');beginCanal();solve(pestEvent.tiles,pestEvent.mapIndex,true);assert.equal(pestEvent.phase,'done');assert.equal(JSON.stringify(S),before);closePests();openPests(true,'canal');beginCanal();
`);
context.document.hidden=true;now+=100;tick();run('assert.equal(pestEvent.remaining,60000)');context.document.hidden=false;for(let i=0;i<600;i++){now+=100;tick()}
run(`assert.equal(pestEvent.phase,'done');closePests();screen='decision';S.fieldEventSeen={drought:true,weeds:true,pest:true,pestFixed:true};assert.equal(挑突发种(),'canal');S.stamina=40;openPests(false,'canal');beginCanal();finishPests(true);assert.equal(S.stamina,32);assert.equal(S.stats.harvest,606);`);
console.log('PASS: 16 maps / 400 solvable boards, T pipes, fixed endpoints, costs, rewards, delegation, practice isolation, background pause, timeout, live selection');
