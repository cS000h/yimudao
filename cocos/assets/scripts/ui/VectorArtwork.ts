import { Color, Graphics, Label, Layers, Node, UITransform } from 'cc';
import { TemplateElement } from './TemplateTree';

type Matrix = [number,number,number,number,number,number];
const identity: Matrix = [1,0,0,1,0,0];
const multiply = (a:Matrix,b:Matrix):Matrix => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];

function transform(value:string):Matrix {
  let matrix=identity;
  for(const m of value.matchAll(/(translate|scale|rotate|matrix)\(([^)]*)\)/g)) {
    const a=m[2].split(/[ ,]+/).filter(Boolean).map(Number);
    let part:Matrix=identity;
    if(m[1]==='translate')part=[1,0,0,1,a[0],a[1]||0];
    if(m[1]==='scale')part=[a[0],0,0,a[1]??a[0],0,0];
    if(m[1]==='matrix')part=a as Matrix;
    if(m[1]==='rotate') {
      const t=a[0]*Math.PI/180,c=Math.cos(t),s=Math.sin(t),x=a[1]||0,y=a[2]||0;
      part=[c,s,-s,c,x-c*x+s*y,y-s*x-c*y];
    }
    matrix=multiply(matrix,part);
  }
  return matrix;
}

export function color(hex:string,opacity=1):Color {
  const rgba=hex.match(/rgba?\(([^)]+)\)/);
  if(rgba){const v=rgba[1].split(',').map(Number);return new Color(v[0],v[1],v[2],Math.round((v[3]??1)*255*opacity));}
  if(hex==='transparent')return new Color(0,0,0,0);
  const names:Record<string,string>={currentColor:'#41603a',white:'#ffffff',black:'#000000'};
  hex=names[hex]||hex;
  const c=new Color();Color.fromHEX(c,hex.startsWith('#')?hex:'#41603a');c.a=Math.round(c.a*opacity);return c;
}

/** 将原来的矢量图形描述绘制为 Cocos Graphics，微信端不需要 SVG/DOM 支持。 */
export function drawVector(svg:TemplateElement,parent:Node,width:number,height:number):void {
  const box=(svg.attributes.viewBox||`0 0 ${svg.attributes.width||24} ${svg.attributes.height||24}`).split(/[ ,]+/).map(Number);
  const sx=width/box[2],sy=height/box[3],gradients:Record<string,string>={};
  const ramps:Record<string,{vertical:boolean;stops:{at:number;ink:Color}[]}>={};
  // 一张田图共用一个 Graphics；每条稻叶单独建组件会占用大量 GPU 缓冲区。
  const paths=new Node('VectorPaths');paths.layer=Layers.Enum.UI_2D;parent.addChild(paths);
  const g=paths.addComponent(Graphics);
  for(const gradient of svg.querySelectorAll('linearGradient'))gradients[gradient.id]=gradient.children[0]?.attributes['stop-color']||'#d4dfc8';
  // 解析器将标签转为小写，兼容原画中的渐变节点。
  for(const gradient of svg.querySelectorAll('lineargradient'))gradients[gradient.id]=gradient.children[0]?.attributes['stop-color']||'#d4dfc8';
  for(const gradient of svg.querySelectorAll('lineargradient')){
    const stops=gradient.children.filter(c=>c.tag==='stop').map((c,i)=>({at:c.attributes.offset?parseFloat(c.attributes.offset)/(c.attributes.offset.endsWith('%')?100:1):i,ink:color(c.attributes['stop-color']||'#d4dfc8',Number(c.attributes['stop-opacity']??1))})).sort((a,b)=>a.at-b.at);
    ramps[gradient.id]={vertical:(gradient.attributes.y2||'0')!==(gradient.attributes.y1||'0'),stops};
  }
  const visit=(e:TemplateElement,attrs:Record<string,string>,matrix:Matrix,opacity:number)=>{
    const a={...attrs,...e.attributes};
    const m=multiply(matrix,transform(e.attributes.transform||''));
    const alpha=opacity*Number(e.attributes.opacity??1);
    const point=(x:number,y:number):[number,number]=>[(m[0]*x+m[2]*y+m[4]-box[0])*sx,-(m[1]*x+m[3]*y+m[5]-box[1])*sy];
    if(['defs','lineargradient','stop'].includes(e.tag))return;
    if(e.tag==='text') {
      const node=new Node('ArtworkText');node.layer=Layers.Enum.UI_2D;parent.addChild(node);
      const p=point(+a.x||0,+a.y||0);node.setPosition(p[0],p[1]);
      const ui=node.addComponent(UITransform);ui.setAnchorPoint(a['text-anchor']==='middle'?.5:0,.5);ui.setContentSize(width,24);
      const label=node.addComponent(Label);label.string=e.textContent;label.fontSize=(+a['font-size']||11)*sx;label.color=color(a.fill||'#55754a',alpha);
      return;
    }
    if(['path','rect','circle','ellipse','line','polygon','polyline'].includes(e.tag)) {
      const move=(x:number,y:number)=>g.moveTo(...point(x,y));
      const line=(x:number,y:number)=>g.lineTo(...point(x,y));
      const curve=(x1:number,y1:number,x2:number,y2:number,x:number,y:number)=>g.bezierCurveTo(...point(x1,y1),...point(x2,y2),...point(x,y));
      const ramp=ramps[(a.fill||'').match(/url\(#([^)]+)\)/)?.[1]||''];
      if(e.tag==='rect'&&ramp?.stops.length>1){
        // 原田图的天空、田水恢复渐变；共用 Graphics，不为每条色带建节点。
        const x=+a.x||0,y=+a.y||0,w=+a.width||0,h=+a.height||0;
        for(let strip=0;strip<32;strip++){
          const t=(strip+.5)/32,right=ramp.stops.findIndex(s=>s.at>=t),hi=ramp.stops[right<0?ramp.stops.length-1:right],lo=ramp.stops[Math.max(0,right<0?ramp.stops.length-1:right-1)];
          const ratio=hi.at===lo.at?0:Math.max(0,Math.min(1,(t-lo.at)/(hi.at-lo.at)));
          g.fillColor=new Color(lo.ink.r+(hi.ink.r-lo.ink.r)*ratio,lo.ink.g+(hi.ink.g-lo.ink.g)*ratio,lo.ink.b+(hi.ink.b-lo.ink.b)*ratio,(lo.ink.a+(hi.ink.a-lo.ink.a)*ratio)*alpha*Number(a['fill-opacity']??1));
          const x0=ramp.vertical?x:x+w*strip/32,x1=ramp.vertical?x+w:x+w*(strip+1)/32,y0=ramp.vertical?y+h*strip/32:y,y1=ramp.vertical?y+h*(strip+1)/32:y+h;
          move(x0,y0);line(x1,y0);line(x1,y1);line(x0,y1);g.close();g.fill();
        }return;
      }
      if(e.tag==='path')drawPath(a.d||'',move,line,curve,()=>g.close());
      if(e.tag==='rect') {
        const x=+a.x||0,y=+a.y||0,w=+a.width||0,h=+a.height||0;
        move(x,y);line(x+w,y);line(x+w,y+h);line(x,y+h);g.close();
      }
      if(e.tag==='ellipse'||e.tag==='circle') {
        const cx=+a.cx||0,cy=+a.cy||0,rx=+(a.rx||a.r)||0,ry=+(a.ry||a.r)||0;
        for(let i=0;i<=32;i++){const t=i*Math.PI/16,x=cx+rx*Math.cos(t),y=cy+ry*Math.sin(t);if(i)line(x,y);else move(x,y);}g.close();
      }
      if(e.tag==='line'){move(+a.x1||0,+a.y1||0);line(+a.x2||0,+a.y2||0);}
      if(e.tag==='polygon'||e.tag==='polyline') {
        const points=(a.points||'').split(/[ ,]+/).filter(Boolean).map(Number);
        for(let i=0;i<points.length;i+=2){if(i)line(points[i],points[i+1]);else move(points[i],points[i+1]);}
        if(e.tag==='polygon')g.close();
      }
      let fill=a.fill??'#000000';
      const gradient=fill.match(/url\(#([^)]+)\)/);if(gradient)fill=gradients[gradient[1]]||'#d4dfc8';
      if(fill!=='none'&&e.tag!=='line'&&e.tag!=='polyline'){g.fillColor=color(fill,alpha*Number(a['fill-opacity']??1));g.fill();}
      if(a.stroke&&a.stroke!=='none') {
        g.strokeColor=color(a.stroke,alpha*Number(a['stroke-opacity']??1));g.lineWidth=(+a['stroke-width']||1)*sx*Math.sqrt(Math.abs(m[0]*m[3]-m[1]*m[2]));
        g.lineCap=a['stroke-linecap']==='round'?Graphics.LineCap.ROUND:a['stroke-linecap']==='square'?Graphics.LineCap.SQUARE:Graphics.LineCap.BUTT;
        g.lineJoin=Graphics.LineJoin.ROUND;g.stroke();
      }
    }
    for(const child of e.children)visit(child,a,m,alpha);
  };
  visit(svg,{fill:'#000000'},identity,1);
}

// SVG 的曲线、相对坐标和椭圆弧转为引擎路径；弧线用小线段近似。
function drawPath(value:string,move:any,line:any,curve:any,close:any):void {
  const tokens=value.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[];
  let i=0,command='',x=0,y=0,startX=0,startY=0,controlX=0,controlY=0,previous='';
  const counts:Record<string,number>={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};
  while(i<tokens.length) {
    if(/^[a-z]$/i.test(tokens[i]))command=tokens[i++];
    const upper=command.toUpperCase(),relative=command!==upper;
    if(upper==='Z'){close();x=startX;y=startY;command='';previous='Z';continue;}
    const count=counts[upper];if(!count||i+count>tokens.length)break;
    if(tokens.slice(i,i+count).some(t=>/^[a-z]$/i.test(t)))break;
    const a=tokens.slice(i,i+count).map(Number);i+=count;
    const px=(v:number)=>v+(relative?x:0),py=(v:number)=>v+(relative?y:0);
    let nx=x,ny=y;
    if(upper==='M'||upper==='L'){nx=px(a[0]);ny=py(a[1]);if(upper==='M'){move(nx,ny);startX=nx;startY=ny;command=relative?'l':'L';}else line(nx,ny);}
    if(upper==='H'){nx=px(a[0]);line(nx,y);}
    if(upper==='V'){ny=py(a[0]);line(x,ny);}
    if(upper==='C'){nx=px(a[4]);ny=py(a[5]);controlX=px(a[2]);controlY=py(a[3]);curve(px(a[0]),py(a[1]),controlX,controlY,nx,ny);}
    if(upper==='S'){nx=px(a[2]);ny=py(a[3]);const cx=/[CS]/.test(previous)?2*x-controlX:x,cy=/[CS]/.test(previous)?2*y-controlY:y;controlX=px(a[0]);controlY=py(a[1]);curve(cx,cy,controlX,controlY,nx,ny);}
    if(upper==='Q'||upper==='T') {
      nx=px(a[upper==='Q'?2:0]);ny=py(a[upper==='Q'?3:1]);
      const cx=upper==='Q'?px(a[0]):/[QT]/.test(previous)?2*x-controlX:x,cy=upper==='Q'?py(a[1]):/[QT]/.test(previous)?2*y-controlY:y;
      curve(x+2*(cx-x)/3,y+2*(cy-y)/3,nx+2*(cx-nx)/3,ny+2*(cy-ny)/3,nx,ny);controlX=cx;controlY=cy;
    }
    if(upper==='A'){nx=px(a[5]);ny=py(a[6]);arc(x,y,nx,ny,a[0],a[1],a[2],a[3],a[4],line);}
    x=nx;y=ny;previous=upper;
  }
}

function arc(x:number,y:number,nx:number,ny:number,rx:number,ry:number,degrees:number,large:number,sweep:number,line:any):void {
  rx=Math.abs(rx);ry=Math.abs(ry);if(!rx||!ry){line(nx,ny);return;}if(x===nx&&y===ny)return;
  const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),dx=(x-nx)/2,dy=(y-ny)/2;
  const ax=c*dx+s*dy,ay=-s*dx+c*dy,scale=ax*ax/(rx*rx)+ay*ay/(ry*ry);
  if(scale>1){rx*=Math.sqrt(scale);ry*=Math.sqrt(scale);}
  const q=(large===sweep?-1:1)*Math.sqrt(Math.max(0,(rx*rx*ry*ry-rx*rx*ay*ay-ry*ry*ax*ax)/(rx*rx*ay*ay+ry*ry*ax*ax)));
  const cxp=q*rx*ay/ry,cyp=-q*ry*ax/rx,cx=c*cxp-s*cyp+(x+nx)/2,cy=s*cxp+c*cyp+(y+ny)/2;
  const start=Math.atan2((ay-cyp)/ry,(ax-cxp)/rx);let delta=Math.atan2((-ay-cyp)/ry,(-ax-cxp)/rx)-start;
  if(sweep&&delta<0)delta+=Math.PI*2;if(!sweep&&delta>0)delta-=Math.PI*2;
  const steps=Math.max(4,Math.ceil(Math.abs(delta)*8));
  for(let i=1;i<=steps;i++){const t=start+delta*i/steps,xx=rx*Math.cos(t),yy=ry*Math.sin(t);line(c*xx-s*yy+cx,s*xx+c*yy+cy);}
}
