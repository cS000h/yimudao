// 从网页版保留静态视觉规则；动画和浏览器伪元素由原生界面单独处理。
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
const css=Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g),m=>m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g,'');
const rules=[];
for(const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
 const selectors=m[1].trim().split(',').map(x=>x.trim()).filter(x=>x&&!/[@:%]|\b(from|to)\b/.test(x));
 const declarations={};
 for(const d of m[2].split(';')) {const i=d.indexOf(':');if(i>0)declarations[d.slice(0,i).trim()]=d.slice(i+1).trim();}
 for(const selector of selectors)rules.push({selector,declarations});
}
fs.writeFileSync(path.resolve(__dirname,'../assets/scripts/ui/WebStyles.ts'),'/** 自动提取的原版静态样式，更新时运行 tools/extract-styles.cjs。 */\nexport const webStyles = '+JSON.stringify(rules,null,0)+';\n');
console.log('Extracted '+rules.length+' style rules');
