// 一次性迁移工具：按原章节拆分代码，用显式上下文替换网页全局变量。
// 保留局部变量作用域、函数提前声明和初始化顺序，不使用 eval。
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, '../index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source = ts.createSourceFile('original.js', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const host = ts.createCompilerHost({ allowJs: true });
const originalGet = host.getSourceFile.bind(host);
host.getSourceFile = (name, ...args) => name === 'original.js' ? source : originalGet(name, ...args);
const program = ts.createProgram(['original.js'], { allowJs: true, noLib: true }, host);
const checker = program.getTypeChecker();
const topSymbols = new Set();
const globalNames = new Set(['document', 'window', 'location', 'localStorage', 'fetch',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'requestAnimationFrame',
  'performance', 'AbortController']);
const platformNames = new Set(globalNames);
for (const statement of source.statements) {
  if (ts.isVariableStatement(statement)) for (const d of statement.declarationList.declarations) {
    if (!ts.isIdentifier(d.name)) throw new Error('Unexpected top-level destructuring');
    topSymbols.add(checker.getSymbolAtLocation(d.name));
    globalNames.add(d.name.text);
  }
  if (ts.isFunctionDeclaration(statement) && statement.name) {
    topSymbols.add(checker.getSymbolAtLocation(statement.name));
    globalNames.add(statement.name.text);
  }
  if (ts.isExpressionStatement(statement) && ts.isBinaryExpression(statement.expression)) {
    const left = statement.expression.left;
    if (ts.isPropertyAccessExpression(left) && left.expression.getText(source) === 'window') globalNames.add(left.name.text);
  }
}
const factory = ts.factory;
const property = name => factory.createPropertyAccessExpression(factory.createIdentifier('ctx'), name);
function isReference(node) {
  const p = node.parent;
  if (ts.isPropertyAccessExpression(p) && p.name === node) return false;
  if ((ts.isPropertyAssignment(p) || ts.isMethodDeclaration(p)) && p.name === node) return false;
  if ((ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionDeclaration(p) || ts.isFunctionExpression(p)) && p.name === node) return false;
  return true;
}
function transform(node) {
  const result = ts.transform(node, [context => {
    const visit = n => {
      // Cocos 默认宽松编译会把 [...迭代器] 当数组；显式展开兼容 Map/Set。
      if (ts.isArrayLiteralExpression(n) && n.elements.length === 1 && ts.isSpreadElement(n.elements[0])) {
        return factory.createCallExpression(factory.createPropertyAccessExpression(factory.createIdentifier('Array'),'from'),undefined,[ts.visitNode(n.elements[0].expression,visit)]);
      }
      if (ts.isParameter(n)) {
        return factory.updateParameterDeclaration(n, n.modifiers, n.dotDotDotToken, n.name,
          !n.initializer && !n.dotDotDotToken && ts.isIdentifier(n.name) ? factory.createToken(ts.SyntaxKind.QuestionToken) : n.questionToken,
          factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), n.initializer ? ts.visitNode(n.initializer, visit) : undefined);
      }
      if (ts.isVariableDeclaration(n)) {
        const loop = n.parent && n.parent.parent;
        return factory.updateVariableDeclaration(n, n.name, n.exclamationToken,
          loop && (ts.isForOfStatement(loop) || ts.isForInStatement(loop)) ? undefined : factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword), n.initializer ? ts.visitNode(n.initializer, visit) : undefined);
      }
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.getText(source) === 'Object.entries') {
        return factory.updateCallExpression(n, n.expression, [factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)], n.arguments.map(x=>ts.visitNode(x,visit)));
      }
      if (ts.isPropertyAccessExpression(n) && n.expression.getText(source) === 'window' && globalNames.has(n.name.text)) return property(n.name.text);
      if (ts.isShorthandPropertyAssignment(n)) {
        const symbol = checker.getShorthandAssignmentValueSymbol(n);
        if (topSymbols.has(symbol)) return factory.createPropertyAssignment(n.name.text, property(n.name.text));
      }
      if (ts.isIdentifier(n) && isReference(n) && globalNames.has(n.text)) {
        const symbol = checker.getSymbolAtLocation(n);
        if (platformNames.has(n.text) || !symbol || topSymbols.has(symbol)) return property(n.text);
      }
      return ts.visitEachChild(n, visit, context);
    };
    return visit;
  }]);
  const value = result.transformed[0];
  result.dispose();
  return value;
}
const printer = ts.createPrinter({ removeComments: true });
const print = node => printer.printNode(ts.EmitHint.Unspecified, node, source);
const sections = [
  ['data/Balance', 'const NUM =', '数值、种子等级与图标'],
  ['data/Decisions', 'const DECISIONS =', '节气决策、年景与田边相遇'],
  ['data/Events', 'const 随机池 =', '随机事件、延迟后果与人物故事'],
  ['data/Business', 'function 建后段', '收获后的加工、销售和经营分支'],
  ['data/Collections', 'const CODEX =', '图鉴和成就'],
  ['logic/Season', 'const clamp =', '抽取一季、事件触发、效果与跨季存档'],
  ['ui/FieldArtwork', 'const 阶段高 =', '稻田、农具和年景图形'],
  ['logic/Settlement', 'function 验米', '验米、年终结算和成就解锁'],
  ['ui/Screens', "const app = document", '封面、决策、结果、图鉴等界面内容'],
  ['logic/Flow', 'const 推演址 =', '页面流程与可选在线内容'],
  ['minigames/FieldEvents', 'function showFieldEventResult', '修水渠、除虫、浇水、拔草和独立练习'],
];
for (const section of sections) {
  section.push(script.indexOf(section[1]));
  if (section[3] < 0) throw new Error('Missing section: ' + section[1]);
}
sections.sort((a,b) => a[3] - b[3]);
const groups = sections.map(() => ({ functions: [], initialization: [] }));
for (const statement of source.statements) {
  const pos = statement.getStart(source);
  let index = sections.findLastIndex(s => pos >= s[3]);
  if (index < 0) continue; // 历史说明只有注释，不进入运行代码。
  const group = groups[index];
  if (ts.isFunctionDeclaration(statement)) {
    const fn = factory.createFunctionExpression(undefined, statement.asteriskToken, undefined, undefined,
      statement.parameters, undefined, statement.body);
    // 函数正文中的全局引用仍按原节点的符号表转换。
    const transformed = factory.updateFunctionExpression(fn, fn.modifiers, fn.asteriskToken, fn.name,
      fn.typeParameters, fn.parameters.map(transform), fn.type, transform(statement.body));
    group.functions.push(`// ${statement.name.text}：保留原玩法的计算或流程。\nctx.${statement.name.text} = ${print(transformed)};`);
  } else if (ts.isVariableStatement(statement)) {
    for (const d of statement.declarationList.declarations) {
      group.initialization.push(`ctx.${d.name.text} = ${d.initializer ? print(transform(d.initializer)) : 'undefined'};`);
    }
  } else {
    group.initialization.push(print(transform(statement)));
  }
}
const base = path.join(root, 'assets/scripts');
for (let i=0; i<sections.length; i++) {
  const file = path.join(base, sections[i][0] + '.ts');
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, `/** ${sections[i][2]}。由现有网页迁移；后续直接在本文件维护。 */\nimport type { GameContext } from '../runtime/GameContext';\n\nexport function register(ctx: GameContext): void {\n${groups[i].functions.join('\n\n')}\n}\n\n// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。\nexport function initialize(ctx: GameContext): void {\n${groups[i].initialization.join('\n\n')}\n}\n`);
}
fs.mkdirSync(path.join(base, 'runtime'), {recursive:true});
fs.writeFileSync(path.join(base, 'runtime/Modules.ts'), sections.map((s,i)=>`import * as module${i} from '../${s[0]}';`).join('\n') + `\n\n// 顺序与网页章节一致，末尾才启动首屏和小游戏计时器。\nexport const modules = [${sections.map((s,i)=>'module'+i).join(', ')}];\n`);
fs.writeFileSync(path.join(root, 'migration-source.json'), JSON.stringify({source:'../index.html',sha256:crypto.createHash('sha256').update(html).digest('hex'),sections:sections.map(s=>s[0]),note:'迁移后以 assets/scripts 为准；重新运行工具会覆盖迁移模块。'},null,2)+'\n');
console.log('Migrated', source.statements.length, 'top-level statements into', sections.length, 'modules.');
