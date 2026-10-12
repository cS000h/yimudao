/** 界面模板的轻量数据树。没有真实 DOM、浏览器、WebView 或脚本执行。 */
export function decodeText(value: string): string {
  return value.replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1),16) : +code))
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export class TemplateElement {
  children: TemplateElement[] = [];
  parent: TemplateElement | null = null;
  attributes: Record<string, string> = {};
  style: Record<string, any>;
  dataset: Record<string, string>;
  open = false;
  private text = '';
  private listeners = new Map<string, ((event: any) => void)[]>();

  constructor(public tag: string, private owner: TemplateDocument) {
    this.style = new Proxy({}, {set: (object, key, value) => { object[key] = value; owner.touch(); return true; }});
    this.dataset = new Proxy({}, {
      get: (_, key) => this.attributes['data-' + String(key).replace(/[A-Z]/g, x=>'-'+x.toLowerCase())],
      set: (_, key, value) => { this.setAttribute('data-' + String(key).replace(/[A-Z]/g,x=>'-'+x.toLowerCase()), value); return true; },
      deleteProperty: (_, key) => { delete this.attributes['data-' + String(key)]; owner.touch(); return true; },
    });
  }

  get id(): string { return this.attributes.id || ''; }
  get className(): string { return this.attributes.class || ''; }
  set className(value: string) { this.setAttribute('class', value); }
  get disabled(): boolean { return 'disabled' in this.attributes; }
  set disabled(value: boolean) { if (value) this.attributes.disabled = ''; else delete this.attributes.disabled; this.owner.touch(); }
  get textContent(): string { return this.tag === '#text' ? this.text : this.children.map(c=>c.textContent).join(''); }
  set textContent(value: any) {
    if (this.tag === '#text') this.text = String(value);
    else {
      const child = new TemplateElement('#text', this.owner);
      child.text = String(value); child.parent = this; this.children = [child];
    }
    this.owner.touch();
  }
  get innerHTML(): string { return this.children.map(c=>c.serialize()).join(''); }
  set innerHTML(value: string) { this.children = parseTemplate(String(value), this.owner); this.children.forEach(c=>c.parent=this); this.owner.touch(true); }
  get classList() {
    return {
      add: (...names: string[]) => { this.className = Array.from(new Set(this.className.split(/\s+/).filter(Boolean).concat(names))).join(' '); },
      remove: (...names: string[]) => { this.className = this.className.split(/\s+/).filter(n=>!names.includes(n)).join(' '); },
      contains: (name: string) => this.className.split(/\s+/).includes(name),
    };
  }
  setAttribute(key: string, value: any): void { this.attributes[key] = String(value); this.owner.touch(); }
  getAttribute(key: string): string | null { return this.attributes[key] ?? null; }
  addEventListener(name: string, callback: (event: any) => void): void {
    this.listeners.set(name, (this.listeners.get(name)||[]).concat(callback));
  }
  dispatch(name: string): void { for (const listener of this.listeners.get(name)||[]) listener({preventDefault(){}}); }
  showModal(): void { this.open = true; this.owner.touch(true); }
  close(): void { this.open = false; this.owner.touch(true); }
  focus(_options?: any): void { /* 触屏版无网页键盘焦点；按钮由 Cocos 接收触摸。 */ }
  getBoundingClientRect(): {bottom:number} { return {bottom:0}; }
  querySelector(selector: string): TemplateElement | null { return this.querySelectorAll(selector)[0] || null; }
  querySelectorAll(selector: string): TemplateElement[] {
    const result: TemplateElement[] = [];
    const visit = (element: TemplateElement) => {
      for (const child of element.children) {
        if (selector.split(',').some(s=>matches(child,s.trim()))) result.push(child);
        visit(child);
      }
    };
    visit(this); return result;
  }
  insertAdjacentHTML(position: string, value: string): void {
    const nodes = parseTemplate(value,this.owner);
    if (position === 'afterend' && this.parent) {
      nodes.forEach(n=>n.parent=this.parent);
      this.parent.children.splice(this.parent.children.indexOf(this)+1,0,...nodes);
    } else { nodes.forEach(n=>n.parent=this); this.children.push(...nodes); }
    this.owner.touch(true);
  }
  serialize(): string {
    if (this.tag === '#text') return this.text;
    return `<${this.tag}${Object.entries(this.attributes).map(([k,v])=>` ${k}="${v}"`).join('')}>${this.innerHTML}</${this.tag}>`;
  }
}

function matches(element: TemplateElement, selector: string): boolean {
  if (selector.includes(':not(:disabled)')) { if(element.disabled)return false; selector=selector.replace(':not(:disabled)',''); }
  const attribute = selector.match(/\[([^=\]]+)(?:=["']?([^"'\]]*)["']?)?\]/);
  if (attribute) {
    if (!(attribute[1] in element.attributes) || (attribute[2] !== undefined && element.attributes[attribute[1]] !== attribute[2])) return false;
    selector = selector.replace(attribute[0],'');
  }
  const id = selector.match(/#([\w-]+)/);
  if (id && element.id !== id[1]) return false;
  const classes = Array.from(selector.matchAll(/\.([\w-]+)/g),m=>m[1]);
  if (!classes.every(c=>element.classList.contains(c))) return false;
  const tag = selector.match(/^[\w-]+/);
  return !tag || tag[0] === element.tag;
}

export function parseTemplate(markup: string, document: TemplateDocument): TemplateElement[] {
  const root = new TemplateElement('root', document), stack = [root];
  const tokens = markup.match(/<!--[\s\S]*?-->|<\/?[a-zA-Z][\w:-]*(?:"[^"]*"|'[^']*'|[^'">])*\/?\s*>|[^<]+/g) || [];
  const voidTags = new Set(['br','hr','img','input','meta','link','path','circle','rect','ellipse','line','polyline','polygon','stop']);
  for (const token of tokens) {
    if (token.startsWith('<!--')) continue;
    if (token.startsWith('</')) {
      const tag = token.match(/^<\/([\w:-]+)/)[1].toLowerCase();
      const index = stack.map(n=>n.tag).lastIndexOf(tag);
      if (index > 0) stack.splice(index);
    } else if (token.startsWith('<')) {
      const tag = token.match(/^<([\w:-]+)/)[1].toLowerCase();
      const element = new TemplateElement(tag,document);
      const body = token.slice(tag.length+1).replace(/\/?\s*>$/,'');
      const attributes = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      for (const match of body.matchAll(attributes)) element.attributes[match[1]] = decodeText(match[2]??match[3]??match[4]??'');
      for (const declaration of (element.attributes.style||'').split(';')) {
        const split = declaration.indexOf(':');
        if (split > 0) element.style[declaration.slice(0,split).trim().replace(/-([a-z])/g,(_,x)=>x.toUpperCase())] = declaration.slice(split+1).trim();
      }
      element.parent = stack[stack.length-1]; element.parent.children.push(element);
      if (!voidTags.has(tag) && !token.endsWith('/>')) stack.push(element);
    } else {
      const text = new TemplateElement('#text',document); text.textContent=decodeText(token);
      text.parent=stack[stack.length-1]; text.parent.children.push(text);
    }
  }
  return root.children;
}

export class TemplateDocument {
  revision = 0;
  layoutRevision = 0;
  scrollRevision = 0;
  scrollTop = 0;
  hidden = false;
  roots: TemplateElement[];
  private listeners = new Map<string, (() => void)[]>();
  constructor() {
    this.roots = ['app','bar','pop','toast','pest-dialog'].map(id=>{
      const element=new TemplateElement(id==='pest-dialog'?'dialog':'div',this); element.attributes.id=id;if(id!=='app')element.attributes.class=id;return element;
    });
  }
  touch(layout = false): void { this.revision++; if(layout)this.layoutRevision++; }
  getElementById(id: string): TemplateElement | null {
    for (const root of this.roots) { if(root.id===id)return root; const child=root.querySelector('#'+id); if(child)return child; }
    return null;
  }
  querySelectorAll(selector: string): TemplateElement[] { return this.roots.flatMap(root=>root.querySelectorAll(selector)); }
  addEventListener(name: string, callback: () => void): void { this.listeners.set(name,(this.listeners.get(name)||[]).concat(callback)); }
  setHidden(hidden: boolean): void { this.hidden=hidden; for(const cb of this.listeners.get('visibilitychange')||[])cb(); }
  scrollTo(_x: number, y: number): void { this.scrollTop=y; this.scrollRevision++; }
}
