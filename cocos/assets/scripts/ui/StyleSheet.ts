import { TemplateElement } from './TemplateTree';
import { Theme } from './Theme';
import { webStyles } from './WebStyles';
import { journalStyles } from './JournalStyles';
export type Style=Record<string,string>;
const variables:Style={paper:Theme.paper,card:Theme.card,ink:Theme.ink,dim:Theme.dim,green:Theme.green,'green-d':Theme.greenDark,gold:Theme.gold,'gold-l':'#f8eed4',line:Theme.line,bad:Theme.bad,good:'#37623f',clay:'#8a6a45',inkline:'#b8a37a'};
const inherited=['color','font-size','font-weight','text-align','line-height','white-space','letter-spacing','font-family'];
function simple(e:TemplateElement,selector:string):boolean {
 const tag=selector.match(/^[\w-]+/);if(tag&&e.tag!==tag[0])return false;
 for(const m of selector.matchAll(/([.#])([^.#\[\s]+)/g))if(m[1]==='#'?e.id!==m[2]:!e.classList.contains(m[2]))return false;
 for(const m of selector.matchAll(/\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\]/g))if(!(m[1] in e.attributes)||m[2]&&e.attributes[m[1]]!==m[2])return false;
 return true;
}
function matches(e:TemplateElement,selector:string):boolean {
 const tokens=selector.replace(/([>+~])/g,' $1 ').trim().split(/\s+/);let at=tokens.length-1,current=e;
 if(!simple(current,tokens[at--]))return false;
 while(at>=0) {
  const token=tokens[at--];
  if(token==='>'){current=current.parent;if(!current||!simple(current,tokens[at--]))return false;}
  else if(token==='+'){const siblings=current.parent?.children.filter(c=>c.tag!=='#text')||[];current=siblings[siblings.indexOf(current)-1];if(!current||!simple(current,tokens[at--]))return false;}
  else if(token==='~')return false;
  else {current=current.parent;while(current&&!simple(current,token))current=current.parent;if(!current)return false;}
 }
 return true;
}
const rules=webStyles.map((r,index)=>({...r,index,weight:(r.selector.match(/#/g)||[]).length*100+(r.selector.match(/[.\[]/g)||[]).length*10+(r.selector.match(/(^|\s|>)[a-z]+/g)||[]).length})).sort((a,b)=>a.weight-b.weight||a.index-b.index);
/** 仅解释原生布局用到的静态属性，玩法代码不承担视觉样式。 */
export class StyleSheet {
 private cache=new Map<TemplateElement,Style>();
 clear(){this.cache.clear();}
 get(e:TemplateElement):Style {
  const found=this.cache.get(e);if(found)return found;
  const s:Style={'font-size':'17px','line-height':'1.85','color':Theme.ink,'font-family':Theme.fontFamily,'font-weight':'400'};
  if(e.parent){const p=this.get(e.parent);for(const key of inherited)if(p[key])s[key]=p[key];}
  if(e.tag==='p')s.margin='1em 0';
  if(['h1','h2','h3'].includes(e.tag)){s['font-size']=e.tag==='h1'?'34px':e.tag==='h2'?'26px':'20px';s['font-weight']='600';s.margin='10px 0';}
  if(['b','strong'].includes(e.tag))s['font-weight']='600';
  for(const rule of rules)if(matches(e,rule.selector))Object.assign(s,rule.declarations);
  for(const rule of journalStyles)if(matches(e,rule.selector))Object.assign(s,rule.declarations);
  for(const d of (e.attributes.style||'').split(';')){const i=d.indexOf(':');if(i>0)s[d.slice(0,i).trim()]=d.slice(i+1).trim();}
  for(const key of Object.keys(e.style))s[key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=String(e.style[key]);
  for(const key of Object.keys(s))s[key]=s[key].replace(/var\(--([^),]+)(?:,[^)]+)?\)/g,(_,name)=>variables[name]||Theme.ink).replace(/\s*!important/g,'');
  for(const key of ['margin','margin-top','margin-bottom','margin-left','margin-right','padding','padding-top','padding-bottom','padding-left','padding-right'])if(s[key])s[key]=s[key].replace(/(-?[\d.]+)em/g,(_,n)=>String(Number(n)*pixels(s['font-size'],17))+'px');
  this.cache.set(e,s);return s;
 }
}
export function pixels(value:string|undefined,fallback=0):number {return value&&!/^(auto|none|normal|calc|var)/.test(value)?parseFloat(value)||0:fallback;}
export function edges(value:string|undefined):number[]{const v=(value||'0').split(/\s+/).map(x=>pixels(x));return [v[0],v[1]??v[0],v[2]??v[0],v[3]??v[1]??v[0]];}
export function lineHeight(s:Style):number {const size=pixels(s['font-size'],17),line=s['line-height']||'1.85';return /px/.test(line)?pixels(line):pixels(line,1.85)*size;}
