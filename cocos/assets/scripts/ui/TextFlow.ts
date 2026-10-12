import { TemplateElement } from './TemplateTree';
import { StyleSheet, pixels } from './StyleSheet';
const escape=(v:string)=>v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
/** 内联文字保留粗体、小字和颜色，块级内容由布局器分开排版。 */
export function richText(e:TemplateElement,styles:StyleSheet,scale=1):string {
 if(e.tag==='#text'){
  const s=styles.get(e),size=pixels(s['font-size'],17),tracking=s['letter-spacing']||'0';
  const amount=tracking.endsWith('em')?pixels(tracking)*size:pixels(tracking);
  let value=s['white-space']==='pre-line'?e.textContent.replace(/[^\S\n]+/g,' ').replace(/ *\n */g,'\n'):e.textContent.replace(/\s+/g,' ');
  // Cocos 富文本没有 CSS 字距；仅为短标题和标签补等宽的窄空格。
  if(amount>=size*.06&&value.trim().length<=20&&!/\n/.test(value.trim()))value=Array.from(value.trim()).join(amount>=size*.28?'\u2004':amount>=size*.15?'\u2009':'\u200a');
  return escape(value).replace(/\n/g,'<br/>');
 }
 if(e.tag==='br')return '<br/>';
 if(e.tag==='svg')return '';
 const s=styles.get(e),content=e.children.map((c,i)=>(i&&styles.get(c).display==='block'?'<br/>':'')+richText(c,styles,scale)).join('');
 let result=content;
 if(pixels(s['font-weight'])>=600||s['font-weight']==='bold')result='<b>'+result+'</b>';
 const ink=s.color?.match(/#[\da-f]{3,8}/i)?.[0];if(ink)result='<color='+ink+'>'+result+'</color>';
 return '<size='+pixels(s['font-size'],17)*scale+'>'+result+'</size>';
}
