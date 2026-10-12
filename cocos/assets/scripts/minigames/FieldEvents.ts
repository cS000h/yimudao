/** 修水渠、除虫、浇水、拔草和独立练习。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// showFieldEventResult：保留原玩法的计算或流程。
ctx.showFieldEventResult = function () {
    if (!["decision", "result", "event", "note"].includes(ctx.screen))
        return;
    const event: any = (ctx.S.fieldEvents || []).filter((e?: any) => e.term === ctx.S.termIndex).slice(-1)[0];
    if (!event)
        return;
    const field: any = ctx.app.querySelector(".bigfield, .field");
    if (!field)
        return;
    field.insertAdjacentHTML("afterend", `<div class="field-event-result" role="status"><b>${event.won ? "✓ 处理完成" : "本次处理结果"}</b><p>${ctx.esc(event.line)}</p></div>`);
    const svg: any = field.querySelector("svg.tian");
    if (!svg)
        return;
    const positions: any = [[65, 85], [125, 100], [195, 80], [255, 105]];
    const marks: any = positions.map(([x, y]: any, i?: any) => {
        const style: any = `style="animation-delay:${i * .15}s"`;
        if (event.kind === "canal")
            return `<path class="canal-flow" d="M${x - 25} ${y}h50" fill="none" stroke="#63bac9" stroke-width="6"/>`;
        if (event.kind === "drought")
            return `<g class="event-water" ${style}><path d="M${x} ${y - 30}q-12 15 0 18q12-3 0-18" fill="#5eaec4"/><ellipse cx="${x}" cy="${y}" rx="18" ry="5" fill="none" stroke="#c4eef5" stroke-width="2"/></g>`;
        if (event.kind === "weeds")
            return `<g class="event-weed" ${style}><path d="M${x} ${y}v-25m0 12q-18 0-15-15q15 0 15 15m0 4q17-1 15-16q-14 0-15 16" fill="#658d36" stroke="#42662c" stroke-width="2"/><path d="M${x - 4} ${y + 5}l4-5 4 5" fill="none" stroke="#957245"/></g>`;
        return `<g class="event-pest" ${style}><ellipse cx="${x}" cy="${y}" rx="7" ry="10" fill="#80613d"/><path d="M${x - 10} ${y - 4}h20m-20 8h20" stroke="#59472d" stroke-width="2"/><path d="M${x + 9} ${y - 12}l4 4 8-10" fill="none" stroke="#fdf5d8" stroke-width="3"/></g>`;
    }).join("");
    svg.insertAdjacentHTML("beforeend", `<g class="field-event-animation" aria-hidden="true">${event.caught ? marks : ""}<rect x="65" y="12" width="190" height="23" rx="11" fill="#fffcf1" opacity=".94"/><text x="160" y="28" text-anchor="middle" font-size="11" fill="#41603a">${ctx.practiceEvents[event.kind].action} · ${event.won ? "处理完成" : "已处理，仍有遗漏"}</text></g>`);
};

// openPractice：保留原玩法的计算或流程。
ctx.openPractice = function () { ctx.screen = "practice"; ctx.render(); };

// leavePractice：保留原玩法的计算或流程。
ctx.leavePractice = function () { ctx.screen = "cover"; ctx.render(); };

// viewPractice：保留原玩法的计算或流程。
ctx.viewPractice = function () {
    return `<div class="pest-kicker">田间练习场</div><h1 class="term">突发事件练习</h1>
    <p class="brief">先练练手，再从容下田。选择一种事件，准备好后开始挑战。每种玩法的时限见下方。</p>
    <p class="pest-copy">随时重玩，不消耗体力，也不影响收成和存档。</p>
    ${Object.entries<any>(ctx.practiceEvents).map(([key, c]: any) => `<button class="practice-card" onclick="openPests(true,'${key}')">
      <span class="practice-icon" aria-hidden="true">${c.icon}</span><span><b>${c.name}</b><small>${c.hint}</small><em>${c.seconds} 秒 · 开始${c.action} →</em></span></button>`).join("")}
    <button class="go sm ghost" onclick="leavePractice()">回 到 首 页</button>`;
};

// openPests：保留原玩法的计算或流程。
ctx.openPests = function (practice: any = false, kind: any = "pest") {
    if (ctx.pestEvent || (practice ? ctx.screen !== "practice" : ctx.screen !== "decision" || ctx.S["选了"] !== null))
        return;
    const config: any = ctx.practiceEvents[kind];
    if (!config || (!practice && ctx.S.fieldEventSeen?.[kind]))
        return;
    const count: any = kind === "pestFixed" ? 5 : config.insect ? 3 : 3 + Math.floor(Math.random() * 3);
    ctx.pestEvent = { practice, kind, config, hits: {}, count, caught: new Set(), remaining: config.seconds * 1000, duration: config.seconds * 1000, phase: "ready", season: ctx.S };
    if (!practice) {
        ctx.pestTerms.add(ctx.S.termIndex);
        if (!ctx.S.fieldEventSeen)
            ctx.S.fieldEventSeen = {};
        ctx.S.fieldEventSeen[kind] = true;
    }
    if (kind === "canal") {
        ctx.showCanalIntro();
        return;
    }
    ctx.pestDialog.innerHTML = `<div class="pest-kicker">${practice ? "田间练习 · 不影响收成" : "突发事件 · " + config.name}</div>
    <h2 id="pest-title">${config.name}</h2>
    <p class="pest-copy">这次有 ${count} 处${config.target}需要处理。${config.hint} 准备好后开始 ${config.seconds} 秒计时。<span class="kb-hint"></span></p>
    <p class="pest-copy">${practice ? "放心练手，不奖励也不扣产量。" : "全部处理完成奖励 8 斤产量；每遗漏一处减产 2 斤。"} 切到后台会暂停。</p>
    <button class="go" onclick="beginPests()">准备好了 · 开始${config.action}</button>
    <button class="pest-practice" onclick="finishPests(true)">${practice ? "退出练习" : "这次交给自然"}</button>`;
    ctx.pestDialog.showModal();
    ctx.playCue("tap");
};

// beginPests：保留原玩法的计算或流程。
ctx.beginPests = function () {
    const e: any = ctx.pestEvent;
    if (!e || e.phase !== "ready")
        return;
    if (e.kind === "canal") {
        ctx.beginCanal();
        return;
    }
    e.phase = "playing";
    const config: any = e.config;
    const positions: any = [[18, 30], [50, 28], [82, 35], [32, 72], [70, 73]];
    for (let i: any = positions.length - 1; i > 0; i--) {
        const j: any = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    e.positions = positions.slice(0, e.count);
    ctx.pestDialog.innerHTML = `<div class="pest-kicker">${e.practice ? config.name + " · 练习" : "突发事件 · " + config.name}</div>
    <h2 id="pest-title">${config.title}</h2>
    <div class="pest-meta"><span id="pest-progress" role="status">已${config.verb} 0 / ${e.count}</span><b id="pest-time">${config.seconds}.0 秒</b></div>
    <div class="pest-meter"><span id="pest-bar"></span></div>
    <div class="pest-field">${ctx.drawField(ctx.S)}${positions.slice(0, e.count).map(([x, y]: any, i?: any) => `<button class="pest-bug ${e.kind}" data-pest-id="${i}" data-left="${config.hits}" style="left:${x}%;top:${y}%;animation-delay:-${i * .2}s" aria-label="${config.action}：第 ${i + 1} 处${config.target}" onclick="catchPest(${i},this)">
        ${config.icon}
      </button>`).join("")}</div>
    <p class="pest-copy">${config.hint} 离开页面自动暂停</p>
    <button class="pest-practice" onclick="finishPests(true)">${e.practice ? "结束练习" : "结束处理，按剩余数量结算"}</button>`;
    ctx.pestLastTick = ctx.performance.now();
    ctx.pestDialog.querySelector(".pest-bug").focus();
};

// catchPest：保留原玩法的计算或流程。
ctx.catchPest = function (id?: any, button?: any) {
    const e: any = ctx.pestEvent;
    if (!e || e.phase !== "playing" || e.caught.has(id))
        return;
    e.hits[id] = (e.hits[id] || 0) + 1;
    if (e.hits[id] < e.config.hits) {
        const left: any = e.config.hits - e.hits[id];
        button.setAttribute("data-left", left);
        button.setAttribute("aria-label", `${e.config.action}：第 ${id + 1} 处${e.config.target}，还需 ${left} 次`);
        if (e.kind === "drought") {
            button.innerHTML = ctx.practiceIcons["湿"];
            button.style.background = "#cce3dd";
        }
        else
            button.style.background = left === 2 ? "#ffe5b0" : "#ffd0a6";
        ctx.playCue("tap");
        return;
    }
    e.caught.add(id);
    button.disabled = true;
    button.classList.add("caught");
    ctx.playCue("tap");
    ctx.document.getElementById("pest-progress").textContent = `已${e.config.verb} ${e.caught.size} / ${e.count}`;
    if (e.caught.size === e.count)
        ctx.finishPests();
    else
        ctx.pestDialog.querySelector(".pest-bug:not(:disabled)").focus({ preventScroll: true });
};

// finishPests：保留原玩法的计算或流程。
ctx.finishPests = function (skipped: any = false) {
    const e: any = ctx.pestEvent;
    if (!e || e.phase === "done")
        return;
    if (e.kind === "canal") {
        ctx.finishCanal(skipped);
        return;
    }
    e.phase = "done";
    const missed: any = e.count - e.caught.size, won: any = missed === 0;
    let message: any = "练习结束，不影响本季收成。";
    if (!e.practice && e.season === ctx.S) {
        const delta: any = ctx.applyEffect(ctx.S, { harvest: won ? 8 : -missed * 2 });
        message = `本季产量 ${delta.harvest >= 0 ? "+" : ""}${delta.harvest} 斤。`;
        const line: any = `${e.config.name}：已${e.config.verb} ${e.caught.size}/${e.count} 处${e.config.target}。${message}`;
        ctx.S.log.push({ term: ctx.S["节气"][ctx.S.termIndex].term, line, delta });
        if (!ctx.S.fieldEvents)
            ctx.S.fieldEvents = [];
        ctx.S.fieldEvents.push({ term: ctx.S.termIndex, kind: e.kind, line, won, caught: e.caught.size });
    }
    ctx.pestDialog.innerHTML = `<div class="pest-kicker">${e.practice ? "练习完成" : e.config.name + " · 处理结果"}</div>
    <h2 id="pest-title">${won ? e.config.win : skipped ? "这次先到这里" : "时间到了"}</h2>
    <p class="pest-copy">已${e.config.verb} ${e.caught.size} / ${e.count} 处${e.config.target}。${won ? "稻苗又能安心生长了。" : `还有 ${missed} 处没处理好，下次再加把劲。`}</p>
    <p>${message}</p><button class="go" onclick="closePests()">${e.practice ? "返回练习场" : "回到田里"}</button>`;
    ctx.playCue(won ? "好" : "tap");
    ctx.pestDialog.querySelector(".go").focus();
};

// rotatePipe：保留原玩法的计算或流程。
ctx.rotatePipe = function (mask?: any) { return ((mask << 1) & 15) | (mask >> 3); };

// makeCanal：保留原玩法的计算或流程。
ctx.makeCanal = function (index?: any) {
    const route: any = ctx.canalMaps[index], tiles: any = Array.from({ length: 16 }, () => [5, 3, 7][Math.floor(Math.random() * 3)]);
    route.forEach((cell?: any, i?: any) => {
        let mask: any = i === 0 ? 8 : i === route.length - 1 ? 2 : 0;
        for (const n of [route[i - 1], route[i + 1]]) {
            if (n !== undefined)
                mask |= n === cell - 4 ? 1 : n === cell + 1 ? 2 : n === cell + 4 ? 4 : 8;
        }
        if (i > 0 && i < route.length - 1 && (i === 2 || Math.random() < .3)) {
            const spare: any = [1, 2, 4, 8].filter((b?: any) => !(mask & b));
            mask |= spare[Math.floor(Math.random() * spare.length)];
        }
        tiles[cell] = mask;
    });
    for (let i: any = 1; i < 15; i++)
        for (let r: any = Math.floor(Math.random() * 4); r > 0; r--)
            tiles[i] = ctx.rotatePipe(tiles[i]);
    while (tiles[1] & 8)
        tiles[1] = ctx.rotatePipe(tiles[1]);
    return tiles;
};

// canalWater：保留原玩法的计算或流程。
ctx.canalWater = function (tiles?: any) {
    const wet: any = new Set(), parents: any = {}, queue: any = [];
    if (tiles[0] & 8) {
        wet.add(0);
        queue.push(0);
    }
    for (let i: any = 0; i < queue.length; i++) {
        const c: any = queue[i], row: any = Math.floor(c / 4), col: any = c % 4;
        [row > 0 ? c - 4 : -1, col < 3 ? c + 1 : -1, row < 3 ? c + 4 : -1, col > 0 ? c - 1 : -1].forEach((n?: any, d?: any) => {
            if (n < 0 || wet.has(n) || !(tiles[c] & (1 << d)) || !(tiles[n] & (1 << ((d + 2) % 4))))
                return;
            wet.add(n);
            parents[n] = c;
            queue.push(n);
        });
    }
    return { wet, parents, won: wet.has(15) && !!(tiles[15] & 2) };
};

// showCanalIntro：保留原玩法的计算或流程。
ctx.showCanalIntro = function () {
    const e: any = ctx.pestEvent, enough: any = e.practice || ctx.S.stamina >= 8;
    ctx.pestDialog.innerHTML = `<div class="pest-kicker">${e.practice ? '修水渠 · 练习' : '村里的水渠坏了'}</div><h2 id="pest-title">田里的水，等着这条渠</h2>
    <p class="pest-copy">村口水渠接头错了位，水流不到田里。起点和终点固定，点击中间水管，每次顺时针旋转 90°，把水引到稻田。</p>
    <p class="pest-copy">16 种地图随机抽取，含直管、L 型和 T 型。限时 60 秒，切到后台暂停。</p>
    <p class="pest-copy">${e.practice ? '练习不消耗体力，不影响收成。' : `自己修扣 8 点体力（当前 ${ctx.S.stamina} 点）；接通增产 8 斤，动手后未修好减产 2 斤。`}</p>
    <button class="go" onclick="beginCanal()" ${enough ? '' : 'disabled'}>${enough ? (e.practice ? '开始修水渠练习' : '我自己上 · 体力 −8') : '体力不足，至少需要 8 点'}</button>
    <button class="pest-practice" onclick="finishCanal(true)">${e.practice ? '退出练习' : '留给村里维修 · 不扣体力'}</button>`;
    ctx.pestDialog.showModal();
};

// beginCanal：保留原玩法的计算或流程。
ctx.beginCanal = function () {
    const e: any = ctx.pestEvent;
    if (!e || e.kind !== 'canal' || e.phase !== 'ready' || (!e.practice && ctx.S.stamina < 8))
        return;
    if (!e.practice)
        ctx.S.stamina -= 8;
    e.started = true;
    e.phase = 'playing';
    e.mapIndex = Math.floor(Math.random() * ctx.canalMaps.length);
    e.tiles = ctx.makeCanal(e.mapIndex);
    ctx.pestLastTick = ctx.performance.now();
    ctx.pestDialog.innerHTML = `<div class="pest-kicker">${e.practice ? '修水渠 · 练习' : '自己维修 · 已扣 8 点体力'}</div><h2 id="pest-title">转动水管，让水流进田里</h2>
    <div class="pest-meta"><span id="canal-status" role="status"></span><b id="pest-time">60.0 秒</b></div><div class="pest-meter"><span id="pest-bar"></span></div>
    <p class="pest-copy">水路 ${e.mapIndex + 1} / 16 · 左上进水，右下出水</p><div id="canal-grid" class="canal-grid"></div>
    <p class="pest-copy">点击旋转 90°，蓝色表示已通水。T 型可以分流，不必接通全部支路。</p>
    <div id="canal-result"><button class="pest-practice" onclick="finishCanal(true)">结束维修</button></div>`;
    ctx.drawCanal();
    ctx.document.getElementById('canal-cell-1').focus({ preventScroll: true });
};

// drawCanal：保留原玩法的计算或流程。
ctx.drawCanal = function (focusCell?: any) {
    const e: any = ctx.pestEvent, w: any = ctx.canalWater(e.tiles), points: any = [[50, 0], [100, 50], [50, 100], [0, 50]];
    ctx.document.getElementById('canal-grid').innerHTML = e.tiles.map((mask?: any, i?: any) => {
        const arms: any = points.map(([x, y]: any, d?: any) => mask & (1 << d) ? `M50 50L${x} ${y}` : '').join(' ');
        const p: any = w.parents[i], inlet: any = i === 0 ? 3 : p === i - 4 ? 0 : p === i + 1 ? 1 : p === i + 4 ? 2 : 3;
        const flow: any = points.map(([x, y]: any, d?: any) => !(mask & (1 << d)) ? '' : d === inlet ? `M${x} ${y}L50 50` : `M50 50L${x} ${y}`).join(' ');
        const fixed: any = i === 0 || i === 15, dirs: any = ['上', '右', '下', '左'].filter((_?: any, d?: any) => mask & (1 << d)).join('、');
        return `<button id="canal-cell-${i}" class="canal-tile ${fixed ? 'fixed' : ''}" ${fixed || e.phase !== 'playing' ? 'disabled' : ''} onclick="turnCanal(${i})" aria-label="${fixed ? (i === 0 ? '固定起点' : '固定终点') : `第 ${Math.floor(i / 4) + 1} 行第 ${i % 4 + 1} 列水管`}，接口朝${dirs}${w.wet.has(i) ? '，已通水' : ''}">
      <svg viewBox="0 0 100 100" aria-hidden="true"><path d="${arms}" fill="none" stroke="#837963" stroke-width="27"/><path d="${arms}" fill="none" stroke="${w.wet.has(i) ? '#459cb7' : '#bdb59d'}" stroke-width="18"/>${w.wet.has(i) ? `<path class="canal-flow" d="${flow}" fill="none" stroke="#c9f6fa" stroke-width="6"/>` : ''}</svg>${fixed ? `<span class="canal-label">${i === 0 ? '水源 · 固定' : '稻田 · 固定'}</span>` : ''}</button>`;
    }).join('');
    ctx.document.getElementById('canal-status').textContent = w.won ? '水流已到达稻田！' : '蓝色水流正在寻找通路';
    if (focusCell !== undefined && e.phase === 'playing')
        ctx.document.getElementById(`canal-cell-${focusCell}`).focus({ preventScroll: true });
};

// turnCanal：保留原玩法的计算或流程。
ctx.turnCanal = function (i?: any) {
    const e: any = ctx.pestEvent;
    if (!e || e.kind !== 'canal' || e.phase !== 'playing' || !Number.isInteger(i) || i <= 0 || i >= 15)
        return;
    e.tiles[i] = ctx.rotatePipe(e.tiles[i]);
    ctx.playCue('tap');
    if (ctx.canalWater(e.tiles).won)
        ctx.finishCanal();
    else
        ctx.drawCanal(i);
};

// finishCanal：保留原玩法的计算或流程。
ctx.finishCanal = function (skipped: any = false) {
    const e: any = ctx.pestEvent;
    if (!e || e.kind !== 'canal' || e.phase === 'done')
        return;
    const won: any = !!e.started && !skipped && ctx.canalWater(e.tiles).won;
    e.phase = 'done';
    let line: any = !e.started ? '你把维修留给村里。' : won ? '水渠接通，清水重新流进田里。' : '这次没能接通，村里会继续安排维修。';
    if (!e.practice && e.season === ctx.S) {
        const delta: any = ctx.applyEffect(ctx.S, { harvest: !e.started ? 0 : won ? 8 : -2 });
        line += ` 体力 −${e.started ? 8 : 0}，产量 ${delta.harvest >= 0 ? '+' : ''}${delta.harvest} 斤。`;
        ctx.S.log.push({ term: ctx.S["节气"][ctx.S.termIndex].term, line, delta });
        if (!ctx.S.fieldEvents)
            ctx.S.fieldEvents = [];
        ctx.S.fieldEvents.push({ term: ctx.S.termIndex, kind: 'canal', line, won, caught: won ? 1 : 0 });
    }
    else
        line = (won ? '水渠接通了！' : '练习结束。') + ' 不消耗体力，不影响收成。';
    const result: any = `<p class="pest-copy" role="status">${line}</p><button class="go" onclick="closePests()">${e.practice ? '返回练习场' : '回到田里'}</button>`;
    if (e.started) {
        ctx.drawCanal();
        ctx.document.getElementById('pest-time').textContent = won ? '已接通' : '已结束';
        ctx.document.getElementById('canal-result').innerHTML = result;
    }
    else
        ctx.pestDialog.innerHTML = `<h2 id="pest-title">${e.practice ? '练习结束' : '交给村里维修'}</h2>${result}`;
    ctx.playCue(won ? '好' : 'tap');
    ctx.pestDialog.querySelector('.go').focus({ preventScroll: true });
};

// closePests：保留原玩法的计算或流程。
ctx.closePests = function (refresh: any = true) {
    ctx.pestDialog.close();
    ctx.pestEvent = null;
    if (refresh)
        ctx.render();
};

// 局势：保留原玩法的计算或流程。
ctx.getSeasonConditions = function () {
    const Y: any = ctx.S["年景"] || {};
    let hasDisease: any = false, hasPests: any = false;
    for (const x of (ctx.S.log || [])) {
        const gameName: any = x && x["诊"] && x["诊"]["名"];
        if (!gameName)
            continue;
        if (/病|瘟|枯|霉/.test(gameName))
            hasDisease = true;
        else
            hasPests = true;
    }
    const thisEntry: any = (ctx.S["节气"] || [])[ctx.S.termIndex] || {};
    return { "旱": !!Y["旱"], "雨": !!Y["雨"], "寒": !!Y["寒"],
        "名": Y["名"] || "平年", "段": thisEntry["阶段"] || "", "病过": hasDisease, "虫过": hasPests };
};

// 抽突发：保留原玩法的计算或流程。
ctx.drawFieldEventSchedule = function () {
    const slots: any = [];
    for (let i: any = 1; i < ctx.S["节气"].length - 1; i++)
        slots.push(i);
    for (let i: any = slots.length - 1; i > 0; i--) {
        const j: any = Math.floor(Math.random() * (i + 1));
        [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    ctx.pestTerms.clear();
    ctx.S.fieldEventSeen = {};
    const n: any = Math.random() < .5 ? 2 : 3;
    return { "季": ctx.S["季"] || 1, "位": slots.slice(0, n).sort((a?: any, b?: any) => a - b), "种": [] };
};

// 挑突发种：保留原玩法的计算或流程。
ctx.chooseFieldEventKind = function () {
    const conditions: any = ctx.getSeasonConditions();
    const used: any = ctx.S.fieldEventSeen || {};
    const allValues: any = ["drought", "weeds", "pest", "pestFixed", "canal"];
    let pool: any = allValues.filter((k?: any) => !used[k]);
    if (!pool.length) {
        ctx.S.fieldEventSeen = {};
        pool = allValues.slice();
    }
    if (conditions["旱"] && pool.includes("drought"))
        return "drought";
    if ((conditions["虫过"] || conditions["病过"]) && pool.includes("pest"))
        return "pest";
    const gameWeight: any = (k?: any) => {
        if (k === "canal")
            return conditions["雨"] ? 6 : 4; // Cocos 版提高修水渠的抽取权重。
        if (k === "drought")
            return conditions["旱"] ? 6 : conditions["雨"] ? 1 : 2;
        if (k === "weeds")
            return conditions["雨"] ? 6 : conditions["旱"] ? 1 : 2;
        return conditions["雨"] ? 3 : conditions["寒"] ? 1 : 2;
    };
    const gameTotal: any = pool.reduce((s?: any, k?: any) => s + gameWeight(k), 0);
    let r: any = Math.random() * gameTotal;
    for (const k of pool) {
        r -= gameWeight(k);
        if (r <= 0)
            return k;
    }
    return pool[pool.length - 1];
};

// triggerFieldEvent：保留原玩法的计算或流程。
ctx.triggerFieldEvent = function () {
    if (ctx.document.hidden || ctx.pestEvent || ctx.screen !== "decision" || ctx.S["选了"] !== null
        || ctx.S.termIndex < 1 || ctx.S.termIndex >= ctx.S["节气"].length - 1
        || ctx.pestTerms.has(ctx.S.termIndex))
        return;
    if (!ctx.S["突发"] || ctx.S["突发"]["季"] !== (ctx.S["季"] || 1))
        ctx.S["突发"] = ctx.drawFieldEventSchedule();
    const ordinal: any = ctx.S["突发"]["位"].indexOf(ctx.S.termIndex);
    if (ordinal < 0)
        return;
    if (!ctx.S["突发"]["种"][ordinal])
        ctx.S["突发"]["种"][ordinal] = ctx.chooseFieldEventKind();
    ctx.openPests(false, ctx.S["突发"]["种"][ordinal]);
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.practiceIcons = (() => {
    const shell: any = (core?: any) => `<svg viewBox="0 0 48 48" aria-hidden="true">${core}</svg>`;
    return {
        "虫": shell(`<path d="M13 17 5 12M13 25 4 26M15 33 7 39M35 17 43 12M35 25 44 26M33 33 41 39" stroke="#614a2b" stroke-width="3" stroke-linecap="round"/><ellipse cx="24" cy="27" rx="12" ry="15" fill="#8f663a"/><path d="M24 14v28M15 25h18M16 33h16" stroke="#503b24" stroke-width="2"/><circle cx="24" cy="12" r="8" fill="#526438"/><circle cx="21" cy="10" r="2" fill="#fff"/><circle cx="27" cy="10" r="2" fill="#fff"/>`),
        "旱": shell(`<path d="M6 33c0-8 8-14 18-14s18 6 18 14v4a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#e6d3ae" stroke="#7a5c37" stroke-width="2.5"/><path d="M15 40l5-7 6 4 7-6M24 20v9M33 25l-5 3" fill="none" stroke="#8d6b42" stroke-width="2.2" stroke-linecap="round"/>`),
        "湿": shell(`<path d="M6 33c0-8 8-14 18-14s18 6 18 14v4a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#7d5b38" stroke="#4d3720" stroke-width="2.5"/><path d="M15 40l5-7 6 4 7-6" fill="none" stroke="#5d452a" stroke-width="2.2" stroke-linecap="round"/><path d="M24 4c3.2 4.6 5 7.8 5 10.2a5 5 0 0 1-10 0C19 11.8 20.8 8.6 24 4z" fill="#5aa6c8" stroke="#3d7f9e" stroke-width="2"/>`),
        "草": shell(`<path d="M24 41C24 30 18 24 11 21c2 8 5 16 13 20z" fill="#5d8a34" stroke="#3f6425" stroke-width="2"/><path d="M24 41C24 30 30 24 37 21c-2 8-5 16-13 20z" fill="#6d9c3f" stroke="#3f6425" stroke-width="2"/><path d="M24 41V15" stroke="#4f7a2e" stroke-width="3" stroke-linecap="round"/><ellipse cx="24" cy="12" rx="3.2" ry="5.6" fill="#8aab52" stroke="#4f7a2e" stroke-width="1.8"/>`),
    };
})();

ctx.practiceEvents = {
    canal: { name: "村里的水渠坏了", action: "修水渠", hint: "16 种随机水路，旋转直管、L 型和 T 型接头，接通固定的起点与终点。", icon: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M4 24h20V6m0 18h20m-20 0v18" stroke="#837963" stroke-width="12" fill="none"/><path d="M4 24h20V6m0 18h20m-20 0v18" stroke="#63bac9" stroke-width="6" fill="none"/></svg>', seconds: 60 },
    pest: { name: "虫害来袭 · 移动靶", action: "除虫", target: "虫子", verb: "清除", title: "点掉叶片上的虫子", win: "虫子清光了！", hint: "追着移动的虫子点，每只点三下才能清除，数字表示剩余次数。", icon: ctx.practiceIcons["虫"], hits: 3, seconds: 15, insect: true, moving: true },
    pestFixed: { name: "虫害来袭 · 固定靶", action: "除虫", target: "虫子", verb: "清除", title: "清除停在叶片上的虫子", win: "虫子清光了！", hint: "虫子停在原地，每只点三下才能清除，数字表示剩余次数。", icon: ctx.practiceIcons["虫"], hits: 3, seconds: 15, insect: true, moving: false },
    drought: { name: "旱情告急", action: "浇水", target: "干土", verb: "浇透", title: "给干裂的田地浇水", win: "田地喝饱水了！", hint: "每块干土点击两次：第一次润湿，第二次浇透。", icon: ctx.practiceIcons["旱"], hits: 2, seconds: 8 },
    weeds: { name: "杂草冒头", action: "拔草", target: "杂草", verb: "拔除", title: "拔掉稻苗间的杂草", win: "杂草拔干净了！", hint: "点击带标记的杂草，把养分留给稻苗。", icon: ctx.practiceIcons["草"], hits: 1, seconds: 8 }
};

ctx.pestDialog = ctx.document.getElementById("pest-dialog");

ctx.pestEvent = null;

ctx.pestLastTick = ctx.performance.now();

ctx.pestTerms = new Set();

ctx.document.addEventListener("visibilitychange", () => { ctx.pestLastTick = ctx.performance.now(); });

ctx.pestDialog.addEventListener("cancel", (event?: any) => {
    event.preventDefault();
    if (ctx.pestEvent?.phase === "done")
        ctx.closePests();
    else
        ctx.finishPests(true);
});

ctx.canalMaps = [[0, 1, 2, 3, 7, 6, 10, 14, 15], [0, 1, 2, 6, 5, 9, 10, 14, 15], [0, 1, 2, 6, 10, 9, 13, 14, 15], [0, 1, 5, 4, 8, 9, 13, 14, 15], [0, 1, 5, 6, 10, 9, 13, 14, 15], [0, 1, 2, 3, 7, 6, 5, 9, 10, 14, 15], [0, 1, 2, 3, 7, 11, 10, 9, 13, 14, 15], [0, 1, 2, 6, 5, 4, 8, 9, 13, 14, 15], [0, 1, 2, 6, 7, 11, 10, 9, 13, 14, 15], [0, 1, 5, 4, 8, 12, 13, 9, 10, 14, 15], [0, 1, 5, 6, 10, 9, 8, 12, 13, 14, 15], [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 13, 14, 15], [0, 1, 2, 3, 7, 6, 10, 9, 8, 12, 13, 14, 15], [0, 1, 2, 3, 7, 11, 10, 9, 8, 12, 13, 14, 15], [0, 1, 2, 6, 10, 9, 5, 4, 8, 12, 13, 14, 15], [0, 1, 5, 6, 7, 11, 10, 9, 8, 12, 13, 14, 15]];

ctx.setInterval(() => {
    const now: any = ctx.performance.now(), elapsed: any = Math.min(now - ctx.pestLastTick, 250);
    ctx.pestLastTick = now;
    if (ctx.document.hidden)
        return;
    if (ctx.pestEvent?.phase === "playing") {
        ctx.pestEvent.remaining = Math.max(0, ctx.pestEvent.remaining - elapsed);
        ctx.document.getElementById("pest-time").textContent = `${(ctx.pestEvent.remaining / 1000).toFixed(1)} 秒`;
        ctx.document.getElementById("pest-bar").style.width = `${ctx.pestEvent.remaining / ctx.pestEvent.duration * 100}%`;
        if (ctx.pestEvent.config.moving) {
            const t: any = (ctx.pestEvent.duration - ctx.pestEvent.remaining) / 1000;
            ctx.pestEvent.positions.forEach(([x, y]: any, i?: any) => {
                if (ctx.pestEvent.caught.has(i))
                    return;
                const button: any = ctx.pestDialog.querySelector(`[data-pest-id="${i}"]`);
                button.style.left = `${x + Math.sin(t * 1.7 + i) * 5}%`;
                button.style.top = `${y + Math.sin(t * 1.3 + i * 2) * 7}%`;
            });
        }
        if (!ctx.pestEvent.remaining)
            ctx.finishPests();
    }
    else
        ctx.triggerFieldEvent();
}, 100);

ctx.prepareEvents();

ctx.render();
}
