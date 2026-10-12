interface Task { id: number; due: number; interval: number; callback: (...args: any[]) => void; }

/** 由 Cocos 每帧驱动；进入后台时不推进，小游戏和延迟回调一起暂停。 */
export class GameClock {
  now = 0;
  private nextId = 1;
  private tasks = new Map<number, Task>();

  timeout = (callback: () => void, milliseconds = 0): number => this.add(callback, milliseconds, 0);
  interval = (callback: () => void, milliseconds = 0): number => this.add(callback, milliseconds, milliseconds);
  clear = (id: number): void => { this.tasks.delete(id); };
  animationFrame = (callback: (time: number) => void): number => this.add(() => callback(this.now), 16, 0);

  private add(callback: () => void, milliseconds: number, interval: number): number {
    const id = this.nextId++;
    this.tasks.set(id, {id, due: this.now + Math.max(1, milliseconds), interval, callback});
    return id;
  }

  tick(milliseconds: number): void {
    this.now += Math.max(0, milliseconds);
    // 快照保证回调中新建的任务从下一帧开始，不产生同步递归。
    for (const task of Array.from(this.tasks.values())) {
      if (!this.tasks.has(task.id) || task.due > this.now) continue;
      if (task.interval) task.due = this.now + task.interval;
      else this.tasks.delete(task.id);
      task.callback();
    }
  }

  dispose(): void { this.tasks.clear(); }
}
