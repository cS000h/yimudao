import type { TemplateDocument } from '../ui/TemplateTree';

/** 原网页的全局状态集中在一局上下文内，多个实例不会互相污染。 */
export interface GameContext {
  [name: string]: any;
  document: TemplateDocument;
  S: any;
  screen: string;
}

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** 引擎、浏览器测试和微信只需各自提供这三个能力。 */
export interface GamePlatform {
  storage: StoragePort;
  playSound(name: string): void;
  request(path: string, options: any): Promise<any>;
}
