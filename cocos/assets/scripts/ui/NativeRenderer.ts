import { Button, Graphics, isValid, Label, Layers, Mask, Node, RichText, ScrollView, UIOpacity, UITransform, Vec2 } from 'cc';
import { GameRuntime } from '../runtime/GameRuntime';
import { TemplateElement } from './TemplateTree';
import { Theme } from './Theme';
import { color, drawVector } from './VectorArtwork';
import { StyleSheet, Style, pixels, edges, lineHeight } from './StyleSheet';
import { richText } from './TextFlow';
import { drawJournalField } from './JournalArtwork';

interface Binding { element:TemplateElement; node:Node; label?:Label; rich?:RichText; button?:Button; area?:{width:number;height:number}; meter?:{width:number;fill:string}; }
const inlineTags=new Set(['#text','span','b','strong','i','em','u','small','br']);

function readableText(e:TemplateElement):string {
  if(e.tag==='#text')return e.textContent.replace(/\s+/g,' ');
  if(e.tag==='svg')return '';
  if(e.tag==='br')return '\n';
  return e.children.map(c=>{
    const value=readableText(c);
    const separate=['p','div','small','h1','h2','h3','li'].includes(c.tag)||['full','sub','sz'].some(name=>c.classList.contains(name))||e.tag==='button'&&c.tag==='i';
    return separate?'\n'+value+'\n':value;
  }).join('').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

/** 以 Cocos 节点、Label、Graphics、Button 和 ScrollView 绘制页面。 */
export class NativeRenderer {
  private styles=new StyleSheet();
  private header:Node;
  private page:Node;
  private view:ScrollView;
  private content:Node;
  private modalLayer:Node;
  private modalView:ScrollView|null=null;
  private bindings:Binding[]=[];
  private layoutRevision=-1;
  private revision=-1;
  private scrollRevision=-1;
  private toast:Label;
  private pop:Label;
  private progress:Graphics;
  private error:Label;
  private activeDialog=false;
  private disposed=false;

  constructor(private root:Node,private runtime:GameRuntime,private width:number,private height:number) {
    const bg=this.box(root,'Paper',width,height);bg.setPosition(-width/2,height/2);this.background(bg,width,height,Theme.paper);
    // 稀疏纸纤维使用一张 Graphics，避免每粒纹理创建节点。
    const grainNode=new Node('PaperGrain');grainNode.layer=Layers.Enum.UI_2D;bg.addChild(grainNode);const grain=grainNode.addComponent(Graphics);grain.fillColor=color('#857650',.035);
    let seed=71;for(let i=0;i<2400;i++){seed=(seed*16807)%2147483647;const gx=seed%width;seed=(seed*16807)%2147483647;grain.rect(gx,-(seed%height),.6,.6);}grain.fill();
    this.page=this.box(root,'GamePage',width,height);this.page.setPosition(-width/2,height/2);
    this.header=this.box(root,'PinnedHeader',width,0);this.header.setPosition(-width/2,height/2);this.header.setSiblingIndex(100);
    const main=this.scroll(this.page,'MainScroll',width,height);this.view=main.view;this.content=main.content;
    this.modalLayer=this.box(root,'DialogLayer',width,height);this.modalLayer.setPosition(-width/2,height/2);this.modalLayer.active=false;
    const toastNode=this.box(root,'Toast',width-40,64);toastNode.setPosition(-width/2+20,-height/2+90);
    this.background(toastNode,width-40,64,'#55754a');this.toast=this.label(toastNode,'',width-68,16,24,'#fffaf0',14,12);toastNode.active=false;
    const popNode=this.box(root,'Achievement',width-40,86);popNode.setPosition(-width/2+20,height/2-16);
    this.background(popNode,width-40,86,'#e8dfb6');this.pop=this.label(popNode,'',width-68,16,24,Theme.ink,14,12);popNode.active=false;
    popNode.on(Node.EventType.TOUCH_END,()=>this.safeInvoke('onPop()'));
    const progressNode=new Node('SeasonProgress');progressNode.layer=Layers.Enum.UI_2D;root.addChild(progressNode);progressNode.setPosition(-width/2,height/2);
    this.progress=progressNode.addComponent(Graphics);
    const errorNode=this.box(root,'RuntimeError',width-40,150);errorNode.setPosition(-width/2+20,height/2-50);
    this.background(errorNode,width-40,150,'#f2d8ca');this.error=this.label(errorNode,'',width-68,15,24,Theme.bad,14,12);errorNode.active=false;
  }

  private box(parent:Node,name:string,width:number,height:number):Node {
    const node=new Node(name);node.layer=Layers.Enum.UI_2D;parent.addChild(node);
    const ui=node.addComponent(UITransform);ui.setAnchorPoint(0,1);ui.setContentSize(width,height);return node;
  }

  private background(node:Node,width:number,height:number,fill:string,stroke?:string,radius=10,shadow=false):void {
    const g=node.getComponent(Graphics)||node.addComponent(Graphics);g.clear();
    if(shadow){for(let spread=8;spread>=2;spread-=2){g.fillColor=color(stroke||'#352f1d',.025);g.roundRect(-spread,-height-spread-4,width+spread*2,height+spread*2,radius+spread);g.fill();}}
    // 用两层实心圆角画描边，移动端不会出现细线接缝。
    if(stroke){g.fillColor=color(stroke);g.roundRect(0,-height,width,height,Math.min(radius,height/2));g.fill();}
    const inset=stroke?1.2:0;g.fillColor=color(fill);
    if(width>inset*2&&height>inset*2){g.roundRect(inset,-height+inset,width-inset*2,height-inset*2,Math.max(0,Math.min(radius-inset,height/2)));g.fill();}
  }

  private label(parent:Node,text:string,width:number,size:number,lineHeight:number,ink=Theme.ink,x=0,y=0):Label {
    const node=this.box(parent,'Text',width,lineHeight);node.setPosition(x,-y);
    const label=node.addComponent(Label);label.fontFamily=Theme.fontFamily;label.string=text;label.fontSize=size;label.lineHeight=lineHeight;
    label.color=color(ink);label.enableWrapText=true;label.overflow=Label.Overflow.RESIZE_HEIGHT;
    label.horizontalAlign=Label.HorizontalAlign.LEFT;label.verticalAlign=Label.VerticalAlign.TOP;label.updateRenderData(true);return label;
  }

  private scroll(parent:Node,name:string,width:number,height:number):{view:ScrollView;content:Node} {
    const frame=this.box(parent,name,width,height);frame.addComponent(Mask).type=Mask.Type.GRAPHICS_RECT;
    const content=this.box(frame,name+'Content',width,height);content.setPosition(0,0);
    const view=frame.addComponent(ScrollView);view.content=content;view.horizontal=false;view.vertical=true;view.inertia=true;view.elastic=true;
    // viewport 和 content 都使用左上角坐标，布局不依赖网页滚动。
    view.brake=.75;return {view,content};
  }

  private safeInvoke(action:string,target?:TemplateElement):void {
    if(this.disposed||!isValid(this.root,true))return;
    try{this.runtime.invoke(action,target);this.sync();}
    catch(error){this.showError(error);}
  }

  showError(error:any):void {
    console.error('[一亩稻]',error);this.error.node.parent.active=true;
    this.error.string='游戏遇到问题，请查看控制台。\n'+String(error?.message||error).slice(0,180);
  }

  sync():void {
    if(this.disposed||!isValid(this.root,true))return;
    const doc=this.runtime.document;
    if(this.layoutRevision!==doc.layoutRevision){this.rebuild();this.layoutRevision=doc.layoutRevision;}
    if(this.revision===doc.revision)return;
    this.revision=doc.revision;this.styles.clear();
    for(const binding of this.bindings) {
      const e=binding.element;
      if(binding.label)binding.label.string=readableText(e);
      if(binding.rich)binding.rich.string=richText(e,this.styles,2);
      if(binding.button)binding.button.interactable=!e.disabled;
      if(binding.meter)this.background(binding.node,binding.meter.width*pixels(this.styles.get(e).width)/100,6,binding.meter.fill,undefined,3);
      if(e.classList.contains('pest-bug')) {
        binding.node.active=!e.classList.contains('caught');
        const area=binding.area;
        if(area)binding.node.setPosition(parseFloat(e.style.left||'50')*area.width/100-24,-parseFloat(e.style.top||'50')*area.height/100+24);
        const counter=binding.node.getChildByName('HitCounter')?.getComponent(Label);
        if(counter)counter.string=e.attributes['data-left']||'';
      }
    }
    this.toast.node.parent.active=doc.getElementById('toast').classList.contains('on');this.toast.string=doc.getElementById('toast').textContent;
    this.pop.node.parent.active=doc.getElementById('pop').classList.contains('on');this.pop.string=readableText(doc.getElementById('pop'));
    const fraction=Number((doc.getElementById('bar').style.transform||'').match(/scaleX\(([^)]+)\)/)?.[1]||0);
    this.progress.clear();this.progress.fillColor=color(Theme.green);this.progress.rect(0,-4,this.width*fraction,4);this.progress.fill();
    if(doc.scrollRevision!==this.scrollRevision) {
      this.scrollRevision=doc.scrollRevision;
      this.view.scrollToOffset(new Vec2(0,doc.scrollTop),0);
      if(this.modalView)this.modalView.scrollToTop(0);
    }
  }

  private rebuild():void {
    const doc=this.runtime.document,offset=this.view.getScrollOffset();this.styles.clear();
    this.clearChildren(this.content);this.bindings=[];
    this.clearChildren(this.header);let headerHeight=0;
    const app=doc.getElementById('app'),head=app.children.find(c=>c.classList.contains('head'));
    if(head){headerHeight=this.layout(head,this.header,this.width,0,0);this.header.setSiblingIndex(2);}
    this.view.node.setPosition(0,-headerHeight);this.view.node.getComponent(UITransform).setContentSize(this.width,this.height-headerHeight);
    let y=head?0:24;
    const blocks:{element:TemplateElement;nodes:Node[];height:number}[]=[];
    for(const child of app.children)if(child!==head){
      const before=new Set(this.content.children),height=this.layout(child,this.content,this.width-44,22,y);
      blocks.push({element:child,nodes:this.content.children.filter(n=>!before.has(n)),height});y+=height;
    }
    y=this.fillPage(blocks,y,this.height-headerHeight-40);
    this.content.getComponent(UITransform).setContentSize(this.width,Math.max(this.height-headerHeight,y+40));
    this.view.scrollToOffset(new Vec2(0,Math.max(0,offset.y)),0);
    this.clearChildren(this.modalLayer);
    const dialog=doc.getElementById('pest-dialog');this.modalLayer.active=dialog.open;this.modalView=null;
    if(dialog.open) {
      this.background(this.modalLayer,this.width,this.height,Theme.paper);
      const scroll=this.scroll(this.modalLayer,'FieldEventScroll',this.width,this.height);
      this.modalView=scroll.view;let my=22;
      for(const child of dialog.children)my+=this.layout(child,scroll.content,this.width-40,20,my);
      scroll.content.getComponent(UITransform).setContentSize(this.width,Math.max(this.height,my+36));
      if(this.activeDialog)this.modalView.scrollToOffset(new Vec2(0,0),0);
    }
    this.activeDialog=dialog.open;
    this.revision=-1;
  }

  private fillPage(blocks:{element:TemplateElement;nodes:Node[];height:number}[],natural:number,limit:number):number {
    const flex=blocks.filter(b=>this.styles.get(b.element).flex?.startsWith('1'));
    if(!flex.length||natural>=limit)return natural;
    const extra=limit-natural;
    const info=flex.map(block=>{
      const s=this.styles.get(block.element),pad=edges(s.padding),margin=edges(s.margin);
      const overhead=pad[0]+pad[2]+Math.max(0,margin[0])+Math.max(0,margin[2]);
      return {block,overhead,min:Math.max(0,block.height-overhead),size:0};
    });
    let remaining=info.reduce((sum,x)=>sum+x.min,extra),active=[...info];
    // CSS flex:1 的内容尺寸均分，正文的最小高度不被压缩。
    while(active.length){
      const share=remaining/active.length,locked=active.filter(x=>x.min>share);
      if(!locked.length){active.forEach(x=>x.size=share);break;}
      locked.forEach(x=>{x.size=x.min;remaining-=x.min;});active=active.filter(x=>!locked.includes(x));
    }
    let offset=0;
    for(const block of blocks){
      block.nodes.forEach(n=>n.setPosition(n.position.x,n.position.y-offset,n.position.z));
      const item=info.find(x=>x.block===block);if(!item)continue;
      const growth=Math.max(0,item.size+item.overhead-block.height);
      for(const node of block.nodes){
        const ui=node.getComponent(UITransform);if(ui)ui.height+=growth;
        if(this.styles.get(block.element)['justify-content']==='center')node.children.forEach(n=>n.setPosition(n.position.x,n.position.y-growth/2,n.position.z));
      }
      offset+=growth;
    }
    return natural+offset;
  }

  private text(e:TemplateElement,parent:Node,width:number,x:number,y:number):number {
    const s=this.styles.get(e),markup=richText(e,this.styles,2);
    if(!readableText(e).trim())return 0;
    // 以两倍分辨率绘制，再缩回逻辑字号；半像素字号与汉字边缘更接近网页。
    const node=this.box(parent,e.className||'Paragraph',width*2,1);node.setPosition(x,-y);node.setScale(.5,.5,1);
    const text=node.addComponent(RichText);text.handleTouchEvent=false;text.fontFamily=Theme.fontFamily;text.fontSize=pixels(s['font-size'],17)*2;
    const inlineHeight=(part:TemplateElement):number=>Math.max(lineHeight(this.styles.get(part)),...part.children.filter(c=>inlineTags.has(c.tag)&&this.styles.get(c).display!=='block').map(inlineHeight));
    text.lineHeight=inlineHeight(e)*2;text.verticalAlign=RichText.VerticalAlign.CENTER;text.maxWidth=width*2;text.fontColor=color(s.color||Theme.ink);
    text.horizontalAlign=s['text-align']==='center'?RichText.HorizontalAlign.CENTER:s['text-align']==='right'?RichText.HorizontalAlign.RIGHT:RichText.HorizontalAlign.LEFT;
    text.string=markup;
    if(text.horizontalAlign===RichText.HorizontalAlign.LEFT){
      // 引擎的中文禁则表未包含全角冒号等；不让这些符号单独落在一行。
      const parts=node.children.map(n=>n.getComponent(Label)).filter(Boolean);
      for(let i=1;i<parts.length;i++){
        const current=parts[i],previous=parts[i-1],chars=Array.from(previous.string);
        if(/^[：；）】」』]+$/.test(current.string)&&chars.length>1&&previous.node.position.y>current.node.position.y&&previous.isBold===current.isBold&&previous.fontSize===current.fontSize){
          current.string=chars.pop()+current.string;previous.string=chars.join('');
          previous.updateRenderData(true);current.updateRenderData(true);
        }
      }
    }
    // RichText 按实际字形换行并更新尺寸，不再用字符数猜测正文高度。
    const measured=node.getComponent(UITransform).height;
    // 3.8.8 富文本尺寸包含额外基线空间；它不是 CSS 的段落间距。
    const lines=Math.max(1,Math.floor(measured/text.lineHeight+.001));
    const height=lines*text.lineHeight/2,baseline=measured-height*2;
    node.setPosition(x,-y+baseline/4);
    this.bindings.push({element:e,node,rich:text});return height;
  }

  private children(e:TemplateElement,node:Node,width:number,x:number,y:number):number {
    let top=y,run:TemplateElement[]=[];
    const flush=()=>{
      if(!run.length)return;
      const group={tag:'span',attributes:{},style:{},parent:e,children:run,className:'',classList:{contains:()=>false}} as any as TemplateElement;
      // 使用原节点作为父级，保留字体继承；每组文本只生成一个富文本组件。
      const stable=run;group.children=stable;Object.defineProperty(group,'textContent',{get:()=>stable.map(c=>c.textContent).join(''),configurable:true});
      top+=this.text(group,node,width,x,top);run=[];
    };
    for(const c of e.children) {
      const style=this.styles.get(c);
      if(style.position==='absolute')continue;
      if(inlineTags.has(c.tag)&&!['block','grid','inline-grid','flex','inline-flex'].includes(style.display))run.push(c);
      else {flush();top+=this.layout(c,node,width,x,top);}


    }
    flush();return top-y;
  }

  private layout(e:TemplateElement,parent:Node,width:number,x:number,y:number):number {
    const s=this.styles.get(e),has=(name:string)=>e.classList.contains(name);
    if(s.display==='none'||has('kb-hint')||has('spark'))return 0;
    if(e.tag==='#text'&&!e.textContent.trim())return 0;
    const margin=edges(s.margin),padding=edges(s.padding);
    margin[0]=pixels(s['margin-top'],margin[0]);margin[2]=pixels(s['margin-bottom'],margin[2]);
    padding[0]=pixels(s['padding-top'],padding[0]);padding[2]=pixels(s['padding-bottom'],padding[2]);
    padding[1]=pixels(s['padding-right'],padding[1]);padding[3]=pixels(s['padding-left'],padding[3]);
    y+=Math.max(0,margin[0]);const outer=Math.max(0,margin[0])+Math.max(0,margin[2]);
    if(e.tag==='svg') {
      const box=(e.attributes.viewBox||'0 0 24 24').split(/[ ,]+/).map(Number);
      const w=/100%/.test(s.width||'')?width:Math.min(width,pixels(s.width,pixels(e.attributes.width,24)));
      const h=pixels(s.height,w*box[3]/box[2]);
      const node=this.box(parent,'Artwork',w,h);node.setPosition(x,-y);drawVector(e,node,w,h);return h+outer;
    }
    if(has('bigfield'))return this.field(e,parent,width+44,x-22,y)+outer;
    if(has('field')||has('pest-field'))return this.field(e,parent,width,x,y)+outer;
    if(e.id==='canal-grid')return this.grid(e,parent,width,x,y,4)+outer;
    if(has('hud'))return this.hudRow(e,parent,width,x,y)+outer;
    if(has('tstrip'))return this.seasonStrip(e,parent,width,x,y)+outer;
    if(has('tabs')||has('steps'))return this.grid(e,parent,width,x,y,Math.min(4,e.children.filter(c=>c.tag!=='#text').length))+outer;
    if(has('spacer'))return 16;
    if(has('hr')||e.tag==='hr'){const node=this.box(parent,'Divider',width,1);node.setPosition(x,-y);this.background(node,width,1,Theme.line);return outer+1;}
    if(has('mixbar')||has('meter')||has('pest-meter'))return this.meter(e,parent,width,x,y)+outer;
    if(s.position==='absolute')return 0;
    const node=this.box(parent,e.id||e.className||e.tag,width,0);node.setPosition(x,-y);
    const innerWidth=width-padding[1]-padding[3];let height=padding[0];
    if((e.tag==='p'||['h1','h2','h3','summary','li','#text'].includes(e.tag))&&!e.children.some(c=>this.styles.get(c).display==='block'))height+=this.text(e,node,innerWidth,padding[3],height);
    else if(s.display==='flex'&&s['flex-direction']!=='column')height+=this.flex(e,node,innerWidth,padding[3],height);
    else height+=this.children(e,node,innerWidth,padding[3],height);
    height+=padding[2];height=Math.max(height,pixels(s['min-height']),pixels(s.height));
    node.getComponent(UITransform).setContentSize(width,height);
    if(s.opacity||e.disabled)node.addComponent(UIOpacity).opacity=Math.round(255*(e.disabled ? .45 : s.animation&&pixels(s.opacity,1)===0 ? 1 : pixels(s.opacity,1)));
    const fill=this.fill(s),border=s.border;
    const stroke=(s['border-color']||border||'').match(/#[\da-f]{3,8}|rgba?\([^)]+\)/i)?.[0];
    if(fill||border){this.background(node,width,height,fill||Theme.paper,stroke,pixels(s['border-radius'],10),!!s['box-shadow']);node.getComponent(Graphics).node.setSiblingIndex(0);}
    for(const side of ['left','top','bottom']){const rule=s['border-'+side];if(!rule)continue;const ink=rule.match(/#[\da-f]{3,8}|rgba?\([^)]+\)/i)?.[0];if(!ink)continue;const thickness=pixels(rule,1);const line=this.box(node,'Rule',side==='left'?thickness:width,side==='left'?height:thickness);line.setPosition(0,side==='bottom'?-height:0);this.background(line,side==='left'?thickness:width,side==='left'?height:thickness,ink,undefined,0);}
    if(has('yc'))this.yearTier(e,node,width);
    if(e.tag==='button'||e.attributes.onclick){
      const button=node.addComponent(Button);button.transition=Button.Transition.SCALE;button.zoomScale=.985;button.interactable=!e.disabled;
      node.on(Button.EventType.CLICK,()=>{if(e.attributes.onclick)this.safeInvoke(e.attributes.onclick,e);});
      this.bindings.push({element:e,node,button});
    }
    return height+outer;
  }

  private flex(e:TemplateElement,node:Node,width:number,x:number,y:number):number {
    const s=this.styles.get(e),gap=pixels(s.gap,6),items=e.children.filter(c=>c.tag!=='#text'||c.textContent.trim());
    const equal=items.some(c=>this.styles.get(c).flex?.startsWith('1'));
    const wrap=s['flex-wrap']==='wrap';
    let left=0,top=0,row=0;
    const desired=items.map(c=>{const cs=this.styles.get(c),pad=edges(cs.padding),size=pixels(cs['font-size'],17);return c.classList.contains('practice-icon')?36:Math.min(width,pixels(cs.width,readableText(c).length*size*.85+pad[1]+pad[3]+10));});
    const total=desired.reduce((a,b)=>a+b,0),available=width-gap*(items.length-1);
    for(let index=0;index<items.length;index++){const c=items[index];
      let w=equal?available/items.length:desired[index];
      if(!wrap&&!equal&&total>available)w=c.classList.contains('practice-icon')?36:(available-(items[0]?.classList.contains('practice-icon')?36:0))*desired[index]/(total-(items[0]?.classList.contains('practice-icon')?36:0));
      if(wrap&&left&&left+w>width){top+=row+gap;left=0;row=0;}
      const h=this.layout(c,node,w,x+left,y+top);row=Math.max(row,h);left+=w+gap;
    }
    return top+row;
  }

  private fill(s:Style):string|undefined {
    const value=s['background-color']||s.background||'';
    if(value==='transparent'||value==='none')return undefined;
    return value.match(/#[\da-f]{3,8}|rgba?\([^)]+\)/i)?.[0];
  }

  private yearTier(e:TemplateElement,node:Node,width:number):void {
    const tier=e.querySelector('.tier');if(!tier||!tier.textContent)return;
    const bad=e.classList.contains('xiong'),rare=e.classList.contains('SSR'),w=tier.textContent.length*14+24;
    const tab=this.box(node,'WeatherRibbon',w,32);tab.setPosition(width-w,0);
    this.background(tab,w,32,rare?(bad?'#d88164':'#d8b34f'):bad?'#623e32':'#3c5033',undefined,8);
    const text=this.label(tab,tier.textContent,w,12,20,rare?(bad?'#3a1008':'#3a2c08'):'#d6dfca',0,5);text.horizontalAlign=Label.HorizontalAlign.CENTER;
    // 天气小画放在标题右侧，保留绘本气氛；正文从原来的位置开始。
    const title=e.children.find(c=>c.tag==='b');
    if(title){const art=this.box(node,'WeatherSketch',222,90);art.setPosition(width-94,-38);art.setScale(1/3,1/3,1);drawJournalField(art,222,90,title.textContent,true);}
  }

  private meter(e:TemplateElement,parent:Node,width:number,x:number,y:number):number {
    const node=this.box(parent,e.className,width,8);node.setPosition(x,-y);this.background(node,width,6,'#e6dfc8',undefined,3);
    let offset=0;
    for(const c of e.children){const s=this.styles.get(c),fraction=pixels(s.width)/100;if(!fraction)continue;
      const segment=this.box(node,'MeterFill',width*fraction,6);segment.setPosition(offset,0);this.background(segment,width*fraction,6,this.fill(s)||Theme.green,undefined,3);this.bindings.push({element:c,node:segment,meter:{width,fill:this.fill(s)||Theme.green}});offset+=width*fraction;}
    return 10;
  }

  private action(e:TemplateElement,parent:Node,width:number,x:number,y:number,compact=false):number {
    return this.layout(e,parent,width,x,y);
  }

  private grid(e:TemplateElement,parent:Node,width:number,x:number,y:number,columns:number):number {
    const children=e.children.filter(c=>c.tag!=='#text'||c.textContent.trim());
    const gap=6,cellWidth=(width-gap*(columns-1))/columns;let top=y;
    for(let i=0;i<children.length;i+=columns) {
      let rowHeight=0;
      for(let j=0;j<columns&&i+j<children.length;j++) {
        const c=children[i+j];
        const h=e.id==='canal-grid'?this.pipe(c,parent,cellWidth,x+j*(cellWidth+gap),top):e.classList.contains('hud')?this.hudCell(c,parent,cellWidth,x+j*(cellWidth+gap),top):this.action(c,parent,cellWidth,x+j*(cellWidth+gap),top,true);
        rowHeight=Math.max(rowHeight,h);
      }
      top+=rowHeight;
    }
    return top-y+8;
  }

  private hudRow(e:TemplateElement,parent:Node,width:number,x:number,y:number):number {
    const cells=e.children.filter(c=>c.tag!=='#text'),sound=cells.find(c=>c.classList.contains('snd'));
    const gap=4,w=(width-(sound?26:0)-gap*(cells.length-1))/(cells.length-(sound?1:0));
    let left=x,height=0;
    for(const cell of cells){const cw=cell===sound?26:w;height=Math.max(height,this.hudCell(cell,parent,cw,left,y));left+=cw+gap;}
    return height;
  }

  private hudCell(e:TemplateElement,parent:Node,width:number,x:number,y:number):number {
    const node=this.box(parent,'Stat',width,78);node.setPosition(x,-y);
    const value=e.children.find(c=>c.tag==='b');
    if(value){const label=this.label(node,value.textContent,width, pixels(this.styles.get(value)['font-size'],18),22,this.styles.get(value).color||Theme.ink,0,0);label.horizontalAlign=Label.HorizontalAlign.CENTER;label.isBold=true;this.bindings.push({element:value,node:label.node,label});}
    const title=e.children.filter(c=>c.tag==='#text').map(c=>c.textContent.trim()).join('');
    const icon=e.querySelector('.ic')?.querySelector('svg');
    if(icon){const art=this.box(node,'StatIcon',12,12);art.setPosition((width-36)/2,-25);drawVector(icon,art,12,12);}
    const name=this.label(node,title,icon?width-16:width,e.classList.contains('snd')?15:11,16,Theme.dim,icon?16:0,value?24:0);name.horizontalAlign=Label.HorizontalAlign.CENTER;
    let top=value?42:20;
    for(const detail of e.children.filter(c=>c.tag==='i')){const text=this.label(node,readableText(detail).replace(/\n/g,' '),width,10.5,14,this.styles.get(detail).color||Theme.dim,0,top);text.horizontalAlign=Label.HorizontalAlign.CENTER;this.bindings.push({element:detail,node:text.node,label:text});top+=text.node.getComponent(UITransform).height;}
    if(e.attributes.onclick)node.on(Node.EventType.TOUCH_END,()=>this.safeInvoke(e.attributes.onclick,e));return Math.max(56,top);
  }

  private seasonStrip(e:TemplateElement,parent:Node,width:number,x:number,y:number):number {
    const cells=e.children.filter(c=>c.tag==='div'),gap=3,w=(width-gap*(cells.length-1))/cells.length;
    let height=0;
    cells.forEach((cell,index)=>{height=Math.max(height,this.layout(cell,parent,w,x+index*(w+gap),y));});
    return height;
  }

  private pipe(e:TemplateElement,parent:Node,size:number,x:number,y:number):number {
    const node=this.box(parent,e.id||'Pipe',size,size);node.setPosition(x,-y);this.background(node,size,size,'#e5d9bd');
    const svg=e.children.find(c=>c.tag==='svg');if(svg)drawVector(svg,node,size,size);
    const text=e.querySelector('.canal-label')?.textContent;if(text)this.label(node,text,size,11,16,Theme.ink,0,size-17);
    const button=node.addComponent(Button);button.transition=Button.Transition.SCALE;button.interactable=!e.disabled;
    node.on(Button.EventType.CLICK,()=>{if(e.attributes.onclick)this.safeInvoke(e.attributes.onclick,e);});this.bindings.push({element:e,node,button});return size+6;
  }

  private field(e:TemplateElement,parent:Node,width:number,x:number,y:number):number {
    const height=e.classList.contains('pest-field')?250:width*140/320;
    const node=this.box(parent,'RiceField',width,height);node.setPosition(x,-y);this.background(node,width,height,'#d5dfc5');
    const svg=e.children.find(c=>c.tag==='svg');if(svg)drawVector(svg,node,width,height);
    for(const button of e.querySelectorAll('.hot, .pest-bug')) {
      const pest=button.classList.contains('pest-bug'),size=pest?48:36;
      const target=this.box(node,button.attributes.onclick||'FieldAction',size,size);
      target.setPosition(parseFloat(button.style.left||'50')*width/100-size/2,-parseFloat(button.style.top||'50')*height/100+size/2);
      this.background(target,size,size,pest?'#fff2d2':'#fffaf0',Theme.green);
      const icon=button.querySelector('svg');if(icon)drawVector(icon,target,size,size);
      if(pest) {
        const counter=this.label(target,button.attributes['data-left']||'',size,14,20,Theme.ink,2,0);counter.node.name='HitCounter';counter.isBold=true;
      }else this.label(target,button.textContent.trim()||String((+button.attributes.onclick?.match(/\((\d+)/)?.[1]||0)+1),size-4,14,20,Theme.green,5,7);
      const component=target.addComponent(Button);component.transition=Button.Transition.SCALE;component.interactable=!button.disabled;
      target.on(Button.EventType.CLICK,()=>this.safeInvoke(button.attributes.onclick,button));
      this.bindings.push({element:button,node:target,button:component,area:{width,height}});
    }
    // 田图后的说明由页面继续排版；图中的热区与下面的文字选项共享动作。
    const caption=e.children.filter(c=>c.tag!=='svg'&&!c.attributes.onclick).map(readableText).join(' ').trim();
    if(caption){const label=this.label(node,caption,width,13,22,Theme.dim,0,height+6);return height+label.node.getComponent(UITransform).height+18;}
    return height+12;
  }

  private clearChildren(parent:Node):void {
    // 场景退出时，Cocos 会先销毁子节点，再调用入口组件 onDestroy。
    // strict 模式同时排除已销毁和等待销毁的节点，避免重复访问 children。
    if(!isValid(parent,true))return;
    for(const child of [...parent.children]){
      if(!isValid(child,true))continue;
      child.removeFromParent();child.destroy();
    }
  }

  get scrollTop():number {return this.disposed||!isValid(this.root,true)?0:this.view.getScrollOffset().y;}

  dispose():void {
    if(this.disposed)return;
    this.disposed=true;
    this.clearChildren(this.root);this.bindings=[];
  }
}
