import type { GameContext, GamePlatform } from './GameContext';
import { GameClock } from './GameClock';
import { modules } from './Modules';
import { TemplateDocument, TemplateElement } from '../ui/TemplateTree';

/** 初始化完整一局；内容模块只通过 ctx 共享状态，不访问宿主全局变量。 */
export class GameRuntime {
  readonly clock = new GameClock();
  readonly document = new TemplateDocument();
  readonly context: GameContext;

  constructor(platform: GamePlatform) {
    const document = this.document;
    const ctx: GameContext = this.context = {
      document, S: null, screen:'cover', localStorage:platform.storage,
      window: {scrollTo:document.scrollTo.bind(document), innerHeight:0},
      // API 地址由 Platform.request 统一补全，不再依赖 localhost。
      location:{protocol:'cocos:'}, fetch:platform.request,
      performance:{now:()=>this.clock.now},
      setTimeout:this.clock.timeout, clearTimeout:this.clock.clear,
      setInterval:this.clock.interval, clearInterval:this.clock.clear,
      requestAnimationFrame:this.clock.animationFrame,
      AbortController:class { signal={aborted:false}; abort(){this.signal.aborted=true;} },
    };
    modules.forEach(module=>module.register(ctx));
    modules.forEach(module=>module.initialize(ctx));
    ctx.playCue = (name: string) => { if(ctx.soundEnabled)platform.playSound(name); };
  }

  tick(seconds: number): void { if (!this.document.hidden)this.clock.tick(seconds*1000); }
  setHidden(hidden: boolean): void { this.document.setHidden(hidden); }

  /** 模板只允许“函数名(字面量参数)”；不解释任意 JavaScript。 */
  invoke(action: string, target?: TemplateElement): void {
    const match = action.trim().match(/^([\w\u3400-\u9fff]+)\((.*)\)$/s);
    if (!match || typeof this.context[match[1]] !== 'function') throw new Error('Unknown game action: '+action);
    const args: any[] = [];
    const tokens = match[2].match(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|[^,]+/g) || [];
    for (const raw of tokens) {
      const token=raw.trim();
      if(token==='this')args.push(target);
      else if(token==='true'||token==='false')args.push(token==='true');
      else if(token==='null')args.push(null);
      else if(/^[-+]?\d+(?:\.\d+)?$/.test(token))args.push(Number(token));
      else if((token.startsWith("'")&&token.endsWith("'"))||(token.startsWith('"')&&token.endsWith('"')))args.push(token.slice(1,-1).replace(/\\(['"\\])/g,'$1'));
      else throw new Error('Unsupported action parameter: '+token);
    }
    this.context[match[1]](...args);
  }

  dispose(): void { this.clock.dispose(); }
}
