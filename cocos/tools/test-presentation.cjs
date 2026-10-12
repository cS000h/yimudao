// 检查曾经丢失的视觉层级和跨季内容，不能代替 Creator 实际预览。
const assert=require('assert'),path=require('path');
module.exports=output=>{
 const {TemplateDocument}=require(path.join(output,'ui/TemplateTree.js'));
 const {StyleSheet}=require(path.join(output,'ui/StyleSheet.js'));
 const {richText}=require(path.join(output,'ui/TextFlow.js'));
 const {GameRuntime}=require(path.join(output,'runtime/GameRuntime.js'));
 const doc=new TemplateDocument(),styles=new StyleSheet(),app=doc.getElementById('app');
 app.innerHTML='<div class="yc SSR xiong"><span class="tier">下下</span><span class="k">今年的年景</span><b class="d">秋淋</b><p class="ln">二级 <b>63</b><span>历史验米线</span></p></div><div class="kan"><b>上季结余</b><p>带过来的本钱</p></div><button class="btn">观察<span class="cost">消耗 <i>3 点体力</i></span></button><button class="go">继续</button>';
 assert.equal(styles.get(app.querySelector('.yc')).background,'#2b3f26');
 assert.equal(styles.get(app.querySelector('.yc').children.find(e=>e.tag==='b'))['font-size'],'22px');
 assert.equal(styles.get(app.querySelector('.kan')).background,'#f6faef');
 assert.equal(styles.get(app.querySelector('.btn')).background,'#fffcf1');
 assert.equal(styles.get(app.querySelector('.go')).background,'#41603a');
 const markup=richText(app.querySelector('.ln'),styles);
 assert.match(markup,/<b>63<\/b>/);assert.match(markup,/<br\/>.*历史验米线/);
 assert.equal(styles.get(app.querySelector('.cost'))['font-size'],'12.5px');
 const values=new Map(),r=new GameRuntime({storage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},playSound(){},request:()=>Promise.reject(new Error('offline'))});
 const c=r.context;
 assert.equal(c.带过来({...c.S,季:1}),'');
 const carry=c.带过来({...c.S,季:4,底金:2000,熟练:6});
 assert.match(carry,/带过来/);assert.match(carry,/2,000/);assert.match(carry,/第 4 季/);assert.match(carry,/6 点体力/);
 r.invoke("openBook('封面')");assert.ok(r.document.getElementById('app').querySelectorAll('[onclick]').length>2);
 r.invoke('openPractice()');const choices=r.document.getElementById('app').querySelectorAll('.practice-card');assert.equal(choices.length,5);assert.ok(choices.some(e=>e.attributes.onclick.includes('canal')));
 r.dispose();console.log('PASS: year/carry cards, rich text hierarchy, button styles, season-4 carryover, book and practice entries');
};
