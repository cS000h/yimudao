// 创建入口场景、资源元信息和离线音效；UUID 固定，重新运行不会破坏引用。
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
function uuid(name){const hex=crypto.createHash('sha256').update('yimudao/'+name).digest('hex').slice(0,32);return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);}
function compress(id){const hex=id.replace(/-/g,'');let result=hex.slice(0,5),chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';for(let i=5;i<32;i+=3){const n=parseInt(hex.slice(i,i+3),16);result+=chars[n>>6]+chars[n&63];}return result;}
function write(name,value){const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');}
const scriptId=uuid('assets/scripts/GameBootstrap.ts'),sceneId=uuid('assets/scenes/Main.scene');
write('assets/scenes/Main.scene',[
  {__type__:'cc.SceneAsset',_name:'Main',_objFlags:0,_native:'',scene:{__id__:1},asyncLoadAssets:false},
  {__type__:'cc.Scene',_name:'Main',_objFlags:0,_parent:null,_children:[{__id__:2}],_active:true,_components:[],_prefab:null,autoReleaseAssets:false,_globals:{__id__:4},_id:sceneId},
  {__type__:'cc.Node',_name:'Game',_objFlags:0,_parent:{__id__:1},_children:[],_active:true,_components:[{__id__:3}],_prefab:null,_lpos:{__type__:'cc.Vec3',x:0,y:0,z:0},_lrot:{__type__:'cc.Quat',x:0,y:0,z:0,w:1},_lscale:{__type__:'cc.Vec3',x:1,y:1,z:1},_layer:1,_euler:{__type__:'cc.Vec3',x:0,y:0,z:0},_id:'yimudao-game'},
  {__type__:compress(scriptId),_name:'',_objFlags:0,node:{__id__:2},_enabled:true,_prefab:null,apiBaseUrl:'',_id:'yimudao-bootstrap'},
  {__type__:'cc.SceneGlobals'},
]);
write('assets/scenes/Main.scene.meta',{ver:'1.1.50',importer:'scene',imported:true,uuid:sceneId,files:['.json'],subMetas:{},userData:{}});
write('settings/v2/packages/project.json',{__version__:'1.0.0',general:{designResolution:{width:420,height:820,fitHeight:false,fitWidth:true}}});
write('settings/v2/packages/builder.json',{__version__:'1.3.5',scenes:[{url:'db://assets/scenes/Main.scene',uuid:sceneId}],startScene:sceneId});
const tones={tap:[[620,0,.07,'triangle',.08]],好:[[587,0,.13,'sine',.11],[880,.085,.2,'sine',.1]],坏:[[392,0,.15,'sine',.11],[262,.1,.26,'sine',.11]],钱:[[1046,0,.09,'square',.06],[1318,.07,.18,'square',.05]],翻:[[440,0,.06,'triangle',.05]],抽:Array.from({length:7},(_,i)=>[240+i*46,i*.035,.18,'triangle',.045]),金:[523,659,784,1047].map((f,i)=>[f,i*.085,.55,'triangle',.1]),凶:[330,262,196,165].map((f,i)=>[f,i*.1,.55,'sawtooth',.06])};
for(const [name,notes] of Object.entries(tones)){
  const rate=22050,length=Math.ceil(Math.max(...notes.map(n=>n[1]+n[2]+.03))*rate),buffer=Buffer.alloc(44+length*2);
  buffer.write('RIFF',0);buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(length*2,40);
  for(let i=0;i<length;i++){let sample=0;for(const [f,start,duration,type,volume] of notes){const t=i/rate-start;if(t<0||t>duration)continue;const phase=(t*f)%1,wave=type==='sine'?Math.sin(t*f*Math.PI*2):type==='square'?phase<.5?1:-1:type==='triangle'?1-4*Math.abs(phase-.5):phase*2-1;const envelope=t<.012?t/.012:Math.exp(Math.log(.0001/volume)*(t-.012)/Math.max(.01,duration-.012));sample+=wave*volume*envelope;}buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),44+i*2);}
  const file=path.join(root,'assets/resources/audio/'+name+'.wav');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,buffer);
}
function metas(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name),name=path.relative(root,file);
  if(entry.name.endsWith('.meta'))continue;
  if(entry.isDirectory()){write(name+'.meta',{ver:'1.2.0',importer:'directory',imported:true,uuid:uuid(name),files:[],subMetas:{},userData:{}});metas(file);}
  else if(entry.name.endsWith('.ts'))write(name+'.meta',{ver:'4.0.24',importer:'typescript',imported:true,uuid:uuid(name),files:[],subMetas:{},userData:{}});
  else if(entry.name.endsWith('.wav'))write(name+'.meta',{ver:'1.0.11',importer:'audio-clip',imported:true,uuid:uuid(name),files:['.json', '.wav'],subMetas:{},userData:{}});
}}
metas(path.join(root,'assets'));
console.log('Created Main scene and 8 audio clips. Scene UUID:',sceneId);
