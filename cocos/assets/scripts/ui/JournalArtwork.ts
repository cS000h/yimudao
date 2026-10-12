import { Graphics, Layers, Node } from 'cc';
import { color } from './VectorArtwork';

/** 一张 Graphics 画出田野小景。天气由已有年景名称决定，不引入新资源或玩法。 */
export function drawJournalField(parent:Node,width:number,height:number,year='',dark=false):void {
  const node=new Node('田野小景');node.layer=Layers.Enum.UI_2D;parent.addChild(node);
  const g=node.addComponent(Graphics);
  const rainy=/雨|淋|涝|阴/.test(year),dry=/旱|热|伏|炎/.test(year),cold=/霜|凉|冷/.test(year);
  const sky=dark?'#3b5746':cold?'#dce6df':'#e1eadb';
  const distant=dark?'#5b7052':'#c0d0b1',near=dark?'#6d8159':'#9eaf88';
  const rice=dark?'#c5c58a':dry?'#b29b59':'#7b9564';
  const fill=(ink:string,draw:()=>void)=>{g.fillColor=color(ink);draw();g.fill();};
  fill(sky,()=>g.roundRect(0,-height,width,height,10));
  // 有利年景留一束日光；阴雨年景用云和雨线表达。
  if(!rainy&&!cold){
    fill(dark?'#d8c589':'#e4c788',()=>g.circle(width*.79,-height*.25,height*.12));
    g.strokeColor=color(dark?'#d8c589':'#e4c788',.5);g.lineWidth=1;
    for(let i=0;i<8;i++){const a=i*Math.PI/4,cx=width*.79,cy=-height*.25,r=height*.19;g.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);g.lineTo(cx+Math.cos(a)*(r+4),cy+Math.sin(a)*(r+4));}g.stroke();
  }else{
    fill(dark?'#879889':'#f3f4eb',()=>{g.circle(width*.75,-height*.25,12);g.circle(width*.81,-height*.2,16);g.circle(width*.86,-height*.26,11);});
    if(rainy){g.strokeColor=color(dark?'#b6c8b8':'#9aafa5',.7);g.lineWidth=1.2;for(let i=0;i<7;i++){const x=width*.67+i*8;g.moveTo(x,-height*.47);g.lineTo(x-3,-height*.58);}g.stroke();}
  }
  fill(distant,()=>{g.moveTo(0,-height*.59);g.bezierCurveTo(width*.15,-height*.33,width*.26,-height*.66,width*.44,-height*.53);g.bezierCurveTo(width*.63,-height*.35,width*.85,-height*.54,width,-height*.48);g.lineTo(width,-height);g.lineTo(0,-height);g.close();});
  fill(near,()=>{g.moveTo(0,-height*.72);g.bezierCurveTo(width*.3,-height*.61,width*.6,-height*.92,width,-height*.66);g.lineTo(width,-height);g.lineTo(0,-height);g.close();});
  // 一道弯水渠把天空和稻田连起来，近景稻株只用几笔。
  g.strokeColor=color(dark?'#93b2a2':'#d5e5d5');g.lineWidth=3;
  g.moveTo(width*.62,-height*.63);g.bezierCurveTo(width*.35,-height*.76,width*.65,-height*.87,width*.45,-height);g.stroke();
  g.strokeColor=color(rice);g.lineWidth=1.3;
  for(let i=0;i<12;i++){
    const x=14+i*(width-28)/11,y=-height+7+(i%3)*4,h=12+(i%4)*2;
    if(Math.abs(x-width*.48)<width*.08)continue;
    g.moveTo(x,y);g.lineTo(x,y+h);g.moveTo(x,y+2);g.bezierCurveTo(x-6,y+5,x-7,y+10,x-6,y+h-2);g.moveTo(x,y+2);g.bezierCurveTo(x+6,y+5,x+7,y+10,x+6,y+h-3);
  }g.stroke();
  if(cold){g.strokeColor=color(dark?'#d6e2d5':'#f6faf3');g.lineWidth=1;for(let i=0;i<5;i++){const x=22+i*width/7,y=-height*.28;g.moveTo(x-3,y);g.lineTo(x+3,y);g.moveTo(x,y-3);g.lineTo(x,y+3);}g.stroke();}
}
