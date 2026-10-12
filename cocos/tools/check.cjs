// 使用安装的 Cocos 官方类型声明检查工程，测试输出写入临时目录。
const ts=require('typescript'),fs=require('fs'),path=require('path'),os=require('os');
const root=path.resolve(__dirname,'..');
const editor=process.env.COCOS_EDITOR||'/Applications/Cocos/Creator/3.8.8/CocosCreator.app';
const cc=path.join(editor,'Contents/Resources/resources/3d/engine/bin/.declarations/cc.d.ts');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):x.name.endsWith('.ts')?[path.join(dir,x.name)]:[]);}
const out=path.join(os.tmpdir(),'yimudao-cocos-tests');
const program=ts.createProgram([...files(path.join(root,'assets/scripts')),cc],{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,outDir:out,experimentalDecorators:true,skipLibCheck:true,noImplicitAny:false,strict:false});
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length){console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}));process.exit(1);}
// 命名约定：中文仅出现在注释、文案与兼容数据键中，不能用作 TS 标识符。
for(const file of files(path.join(root,'assets/scripts'))){
 const source=program.getSourceFile(file);
 const inspect=node=>{
  if(ts.isIdentifier(node)&&/[\u3400-\u9fff]/.test(node.text))throw new Error('Use an English identifier: '+node.text+' in '+file);
  ts.forEachChild(node,inspect);
 };
 inspect(source);
}
program.emit();console.log('PASS: TypeScript and Cocos 3.8.8 API checks');
require('./test-runtime.cjs')(out);

require('./test-presentation.cjs')(out);

require('./test-lifecycle.cjs')(out);
