// 重现 Creator 停止预览后，Canvas 已销毁、入口组件才清理的顺序。
const assert=require('assert'),path=require('path'),Module=require('module');
module.exports=output=>{
 const load=Module._load;
 let NativeRenderer;
 try{
  Module._load=function(name,...args){
   if(name==='cc')return {isValid:(node,strict)=>!!node&&!node.destroyed&&(!strict||!node.pending)};
   return load.call(this,name,...args);
  };
  ({NativeRenderer}=require(path.join(output,'ui/NativeRenderer.js')));
 }finally{Module._load=load;}
 const renderer=root=>Object.assign(Object.create(NativeRenderer.prototype),{root,disposed:false,bindings:[{}]});
 // children 访问本身禁止：不能先展开，再判断节点是否有效。
 let accessed=0;
 const destroyed={destroyed:true,get children(){accessed++;throw new Error('destroyed Canvas was accessed');}};
 const old=renderer(destroyed);old.dispose();old.dispose();old.sync();old.safeInvoke('startGame()');
 assert.equal(accessed,0);assert.equal(old.bindings.length,0);
 const scheduled=renderer({pending:true,get children(){throw new Error('pending Canvas was accessed');}});
 scheduled.dispose();
 // 正常切页仍销毁旧节点；已经等待销毁的节点不再重复操作。
 let removed=0,destroyedCount=0;
 const live={children:[]};
 const child={removeFromParent(){removed++;live.children.splice(live.children.indexOf(this),1);},destroy(){destroyedCount++;this.pending=true;}};
 const pending={pending:true,removeFromParent(){throw new Error('pending child removed');},destroy(){throw new Error('pending child destroyed twice');}};
 live.children=[child,pending];const normal=renderer(live);normal.dispose();normal.dispose();
 assert.equal(removed,1);assert.equal(destroyedCount,1);
 console.log('PASS: destroyed/pending Canvas cleanup; repeat dispose; stale callbacks; live node cleanup');
};
