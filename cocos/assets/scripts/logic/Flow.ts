/** 页面流程与可选在线内容。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// 推演钳位：保留原玩法的计算或流程。
ctx.clampProjection = function (impact?: any) {
    const output: any = {};
    let gameTotal: any = 0;
    for (const k of ctx.canReviseProjection) {
        const n: any = Number((impact || {})[k]);
        if (!Number.isFinite(n) || n === 0)
            continue;
        const pressure: any = Math.max(-ctx.projectionEntryKey, Math.min(ctx.projectionEntryKey, n));
        output[k] = pressure;
        gameTotal += Math.abs(pressure);
    }
    if (gameTotal > ctx.projectionTotal) {
        const gameRatio: any = ctx.projectionTotal / gameTotal;
        for (const k in output)
            output[k] = +(output[k] * gameRatio).toFixed(2);
    }
    return output;
};

// 推演场景：保留原玩法的计算或流程。
ctx.projectionScene = function (nextEntry?: any) {
    const i: any = Math.min(nextEntry === undefined ? ctx.S.termIndex + 1 : nextEntry, ctx.S["节气"].length - 1);
    const d: any = ctx.S["节气"][i];
    const cuePlayed: any = (ctx.S.log || []).slice(-3)
        .map((e?: any) => String(e.line || e["看见"] || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
    return {
        "节气": d ? d.term : "", "阶段": d ? d["阶段"] : "",
        "年景": ctx.S["年景"] ? ctx.S["年景"]["名"] : "",
        "已选": (ctx.S["选择"] || []).map((c?: any) => {
            const dd: any = ctx.DECISIONS[c["序"]];
            const o: any = dd && dd.options[c["下标"]];
            return { term: c.term, text: c.text, flags: (o && o.flags) || [] };
        }),
        "田情": { harvest: Math.round(ctx.S.stats.harvest), quality: Math.round(ctx.S.stats.quality),
            ecology: Math.round(ctx.S.stats.ecology) },
        "已响过": cuePlayed,
    };
};

// 推演预取：保留原玩法的计算或流程。
ctx.prefetchProjection = function () {
    if (!ctx.S || !ctx.S["节气"])
        return;
    const scene: any = ctx.projectionScene();
    const gameKey: any = scene["节气"] + "|" + scene["已选"].map((c?: any) => c.term + c.text).join(">");
    ctx.gameProjection = { "结": null, "键": gameKey, "等": true, "占位": null };
    const stopped: any = new ctx.AbortController();
    const noisy: any = ctx.setTimeout(() => stopped.abort(), 9000);
    ctx.fetch(ctx.projectionEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "场景": scene }), signal: stopped.signal })
        .then((r?: any) => r.json())
        .then((j?: any) => {
        ctx.clearTimeout(noisy);
        if (ctx.gameProjection["键"] !== gameKey)
            return;
        ctx.gameProjection["结"] = j;
        ctx.gameProjection["等"] = false;
        const pit: any = ctx.gameProjection["占位"] ? ctx.pendingEvents.indexOf(ctx.gameProjection["占位"]) : -1;
        ctx.gameProjection["占位"] = null;
        if (pit < 0)
            return;
        if (j && j["有"])
            ctx.applyProjection(j, pit);
        else {
            ctx.pendingEvents.splice(pit, 1);
            if (!ctx.pendingEvents.length) {
                ctx.eventIndex = 0;
                ctx.toDecision();
                return;
            }
            if (ctx.eventIndex >= ctx.pendingEvents.length)
                ctx.eventIndex = ctx.pendingEvents.length - 1;
        }
        ctx.render();
    })
        .catch(() => {
        ctx.clearTimeout(noisy);
        if (ctx.gameProjection["键"] !== gameKey)
            return;
        ctx.gameProjection["等"] = false;
        ctx.gameProjection["结"] = { "有": false };
        const pit: any = ctx.gameProjection["占位"] ? ctx.pendingEvents.indexOf(ctx.gameProjection["占位"]) : -1;
        ctx.gameProjection["占位"] = null;
        if (pit < 0)
            return;
        ctx.pendingEvents.splice(pit, 1);
        if (!ctx.pendingEvents.length) {
            ctx.eventIndex = 0;
            ctx.toDecision();
            return;
        }
        if (ctx.eventIndex >= ctx.pendingEvents.length)
            ctx.eventIndex = ctx.pendingEvents.length - 1;
        ctx.render();
    });
};

// 推演落地：保留原玩法的计算或流程。
ctx.applyProjection = function (simulation?: any, pit?: any) {
    const gamePrevious: any = { ...ctx.S.stats };
    const delta: any = ctx.applyEffect(ctx.S, ctx.clampProjection(simulation["影响"]));
    const entry: any = { "推演": true, "演": simulation, mood: "", delta: delta,
        line: simulation["看见"], "看见": simulation["看见"], from: null, "查": null,
        "前": gamePrevious, "后": { ...ctx.S.stats } };
    ctx.S.log.push(entry);
    if (pit >= 0 && ctx.pendingEvents[pit])
        ctx.pendingEvents[pit] = entry;
    else
        ctx.pendingEvents.push(entry);
    for (const k in delta)
        if (delta[k])
            ctx.flash[k] = delta[k];
    return entry;
};

// nextTerm：保留原玩法的计算或流程。
ctx.nextTerm = function () {
    ctx.pendingEvents = ctx.dueEvents(ctx.S, ctx.S.termIndex);
    ctx.eventIndex = 0;
    ctx.flash = {};
    ctx.pendingEvents.forEach((e?: any) => { for (const k in e.delta)
        if (e.delta[k])
            ctx.flash[k] = e.delta[k]; });
    if (ctx.gameProjection["等"]) {
        const gameShare: any = { "推演": "等", mood: "", delta: {}, line: "", from: null, "查": null };
        ctx.gameProjection["占位"] = gameShare;
        ctx.pendingEvents.push(gameShare);
    }
    else if (ctx.gameProjection["结"] && ctx.gameProjection["结"]["有"]) {
        ctx.applyProjection(ctx.gameProjection["结"], -1);
        ctx.gameProjection["结"] = null;
    }
    ctx.screen = ctx.pendingEvents.length ? "event" : "decision";
    ctx.render();
    ctx.scanAchievements(null);
};

// 选到底：保留原玩法的计算或流程。
ctx.finalizeOption = function (S?: any, c?: any, i?: any, gameChild?: any) {
    const stage: any = gameChild || [];
    let present: any = c.options[i];
    for (let k: any = 0; present && k < 8; k++) {
        if (present["设"])
            present["设"](S);
        if (present["续"]) {
            present = present["续"][stage[k] || 0];
            continue;
        }
        if (typeof present.pick !== "function")
            throw new Error("选到底：这条路上没有 pick —— " + (present && present.text));
        present.pick(S);
        return present;
    }
    throw new Error("选到底：续 套得太深，绕不出来（第 " + i + " 条）");
};

// 三产场景：保留原玩法的计算或流程。
ctx.buildServiceScene = function (c?: any) {
    const chain: any = ctx.currentStoryChain(), slots: any = ctx.S.chainIndex || 0;
    const selected: any = [];
    for (const p of chain.slice(0, slots))
        for (const t of (p["选过"] || []))
            selected.push({ term: p.term, text: t });
    const g: any = ctx.miban && ctx.miban.grade;
    const getValue: any = (v?: any) => { try {
        return typeof v === "function" ? v(ctx.S) : v;
    }
    catch {
        return "";
    } };
    return {
        "环节": "三产",
        "节气": c.term, "题": c.title,
        "年景": ctx.S["年景"] ? ctx.S["年景"]["名"] : "",
        "行情名": ctx.S["行情"] ? ctx.S["行情"]["名"] : "",
        "本屏": (c["选过"] || []).slice(),
        "已选": selected,
        "市情": { "名望": Math.round(ctx.S["名望"] || 0), "现金": Math.round(ctx.S["现金"] || 0),
            "等级": g ? g["名"] : "" },
        "已响过": [c.say, ...(c["后应录"] || [])].map(getValue)
            .filter((x?: any) => typeof x === "string" && x.trim()),
    };
};

// 三产要去：保留原玩法的计算或流程。
ctx.shouldOpenServices = function (scene?: any) {
    const stopped: any = new ctx.AbortController();
    const noisy: any = ctx.setTimeout(() => stopped.abort(), 9000);
    return ctx.fetch(ctx.projectionEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "场景": scene }), signal: stopped.signal })
        .then((r?: any) => r.json()).finally(() => ctx.clearTimeout(noisy));
};

// 三产在等：保留原玩法的计算或流程。
ctx.isServicePending = function (c?: any) { return c["推演页"] && c["推演页"]["状态"] === "等"; };

// 三产推演屏：保留原玩法的计算或流程。
ctx.renderServiceProjection = function (c?: any) {
    const chain: any = ctx.currentStoryChain(), gameStep: any = ctx.S.chainIndex || 0;
    const gameYear: any = ctx.chainNames === "年话";
    const gamePage: any = c["推演页"] || {};
    const heading: any = `${ctx.hud()}
    <div class="step">${gameYear ? "转过年来" : ctx.esc(c.term) + " · 收完之后"} 第 ${gameStep + 1} / ${chain.length} 步</div>
    <h2 class="term cmp">${ctx.esc(c.term)}<small>${gameYear ? "转 过 年 来" : "收 完 之 后"}</small></h2>`;
    if (gamePage["状态"] === "等") {
        return `${heading}<div class="spacer"></div>
      <div class="tuiyan"><span class="ty-tag">账 本 上 没 有 这 一 页</span>
        <p class="ty-wait"><i>把 这 一 屏 的 账 再 过 一 遍 ……</i></p>
      </div><div class="spacer"></div>
      <button class="go" onclick="finishServiceScreen()">等 不 及 了</button>`;
    }
    const simulation: any = gamePage["结"] || {};
    const basis: any = (simulation["依据"] || []).map((x?: any) => `<li><b>${ctx.esc(x.id)}</b><br>${ctx.esc(x["摘"])}</li>`).join("");
    return `${heading}<div class="spacer"></div>
    <div class="tuiyan">
      <span class="ty-tag">账 本 上 没 有 这 一 页</span>
      <p class="ty-see">${ctx.renderEmphasis(simulation["看见"] || "")}</p>
      ${simulation["推演"] ? `<p class="ty-why">${ctx.renderEmphasis(simulation["推演"])}</p>` : ""}
      ${simulation["显形"] ? `<span class="ty-when">这笔账要到 <b>${ctx.esc(simulation["显形"])}</b> 才算得清</span>` : ""}
      ${basis ? `<details class="ty-src"><summary>它凭这几条推的（${simulation["依据"].length} 条）</summary><ul>${basis}</ul></details>` : ""}
    </div><div class="spacer"></div>
    <button class="go" onclick="finishServiceScreen()">接 着 走</button>`;
};

// 条件菜单：保留原玩法的计算或流程。
ctx.conditionalMenu = function (S?: any) {
    const gameRice: any = S.grain || 0, sold: any = S.soldGrain || 0;
    const price: any = ctx.miban && ctx.miban.grade ? ctx.miban.grade["价"] : 0;
    const money: any = Math.round(S["现金"] || 0), prestigeValue: any = Math.round(S["名望"] || 0);
    const p: any = S["牌"] || {};
    return [
        { "名": "米还没卖完", "真": gameRice > 0 && sold < gameRice },
        { "名": "已经卖光了", "真": gameRice > 0 && sold >= gameRice },
        { "名": "有自碾设备", "真": !!S["自碾"] },
        { "名": "没买设备", "真": !S["自碾"] },
        { "名": "米到一级", "真": price >= 15 },
        { "名": "生态够认养", "真": S.stats.ecology >= ctx.NUM["三产门槛"] },
        { "名": "名望进得了门", "真": prestigeValue >= ctx.prestigeTrack["生人"]["线"] },
        { "名": "名望够招牌", "真": prestigeValue >= ctx.prestigeTrack["招牌"]["线"] },
        { "名": "手里有现钱", "真": money >= 800 },
        { "名": "走了礼盒", "真": S.channel === "礼盒" || S.channel === "混合" },
        { "名": "走了酒厂", "真": S.channel === "深加工" || S.channel === "混合" },
        { "名": "走了直销", "真": S.channel === "直销" },
        { "名": "今年认养或研学", "真": S.third === "认养" || S.third === "研学" },
        { "名": "盒子上印了名字", "真": !!p["印了自家名字"] },
        { "名": "印过盒子", "真": !!p["印了盒子"] },
        { "名": "盒子是牛皮纸的", "真": !!p["盒子是牛皮纸的"] },
        { "名": "盒里塞过手写条", "真": !!p["盒子里塞了手写的条"] },
        { "名": "跟酒厂打过交道", "真": !!(p["赊了酒厂的账"] || p["跟酒厂说定了长期"]) },
        { "名": "酒瓶上写过京西稻", "真": !!p["瓶子上写了京西稻"] },
        { "名": "接了认养", "真": !!p["接了认养"] },
        { "名": "认养的人来过田", "真": !!p["认养的人来看过田"] },
        { "名": "接了研学", "真": !!p["接了研学"] },
        { "名": "学校那边留了话", "真": !!p["学校那边留了话"] },
        { "名": "供上了饭馆", "真": !!p["供上了饭馆"] },
        { "名": "摆过摊", "真": !!p["摆了摊"] },
        { "名": "跑过馆子", "真": !!p["跑过馆子"] },
        { "名": "留了明年的种", "真": !!p["留了明年的种"] },
        { "名": "挑过碎米", "真": !!p["把碎米挑出去了"] },
        { "名": "稻桩留到了冬天", "真": !!p["稻桩留到了冬天"] },
        { "名": "田埂上留了草籽", "真": !!p["田埂上留了草籽"] },
    ];
};

// 补牌小字：保留原玩法的计算或流程。
ctx.missingCardDetail = function (gameEffect?: any, money?: any) {
    const gamePhase: any = [];
    if (gameEffect.quality)
        gamePhase.push("米 " + (gameEffect.quality > 0 ? "+" : "−") + " " + Math.abs(gameEffect.quality) + " 分");
    if (gameEffect.ecology)
        gamePhase.push("田 " + (gameEffect.ecology > 0 ? "+" : "−") + " " + Math.abs(gameEffect.ecology) + " 分");
    if (money)
        gamePhase.push((money > 0 ? "+" : "−") + " " + ctx.yuan(Math.abs(money)) + " 元");
    return gamePhase.length ? gamePhase.join(" · ") : "不落账，只落个说法";
};

// 落定：保留原玩法的计算或流程。
ctx.finalizeChoice = function (st?: any, gameEffect?: any, money?: any, flag?: any, toBonus?: any, description?: any) {
    if (Object.keys(gameEffect).length)
        ctx.applyEffect(st, gameEffect);
    if (money) {
        if (toBonus) {
            st["额外"] = (st["额外"] || 0) + money;
            if (description)
                st["大寒说明"] = description;
        }
        else
            st["现金"] = Math.max(0, Math.round((st["现金"] || 0) + money));
    }
    for (const f of flag)
        (st["牌"] = st["牌"] || {})[f] = true;
};

// 屏义务：保留原玩法的计算或流程。
ctx.screenObligations = function (c?: any, originalOptions?: any) {
    const table: any = () => new Map(originalOptions.filter((o?: any) => o && !o["回"])
        .map((o?: any) => [String(o.text || ""), o]));
    if (!c["续层"]) {
        if (c["承式"] === "续")
            return { "挑": (original?: any) => {
                    const base: any = table().get(String((original && original["承"]) || "").trim());
                    if (!base)
                        return null;
                    if (base["锁"] === true || (typeof base["锁"] === "function" && base["锁"](ctx.S)))
                        return null;
                    return { "续": base["续"] || null, "续题": base["续题"], "续简": base["续简"] };
                } };
        if (c["承式"] === "pick")
            return { "挑": (original?: any) => {
                    const base: any = table().get(String((original && original["承"]) || "").trim());
                    if (!base)
                        return null;
                    if (base["锁"] === true || (typeof base["锁"] === "function" && base["锁"](ctx.S)))
                        return null;
                    return { pick: typeof base.pick === "function" ? base.pick : null };
                } };
        if (c["自落"])
            return { "挑": (original?: any) => (original && !original["承"]) ? {} : null };
    }
    const obligation: any = ctx.stageObligations(originalOptions);
    if (!obligation)
        return null;
    return { "挑": () => obligation };
};

// 层义务：保留原玩法的计算或流程。
ctx.stageObligations = function (stage?: any) {
    const actual: any = stage.filter((o?: any) => o && !o["回"]);
    if (!actual.length)
        return null;
    const first: any = actual[0];
    for (const o of actual) {
        if (o.pick !== first.pick)
            return null;
        if (o["续"] !== first["续"])
            return null;
    }
    return { pick: typeof first.pick === "function" ? first.pick : null, "续": first["续"] || null };
};

// 造选项：保留原玩法的计算或流程。
ctx.buildOptions = function (original?: any, S?: any, obligation?: any, currentStage?: any, screenEntry?: any) {
    const wording: any = String((original && original["文字"]) || "").trim();
    if (!wording)
        return null;
    const gameEffect: any = {};
    for (const k of ["quality", "ecology"]) {
        const v: any = Math.round(Number((original["效果"] || {})[k]));
        if (Number.isFinite(v) && v)
            gameEffect[k] = Math.max(-8, Math.min(8, v));
    }
    let money: any = Math.round(Number(original["钱"]));
    if (!Number.isFinite(money))
        money = 0;
    money = Math.max(-3000, Math.min(3000, money));
    const flag: any = (Array.isArray(original["旗"]) ? original["旗"] : []).filter((x?: any) => ctx.cardTable.has(x));
    const o: any = {
        text: wording,
        sub: () => ctx.missingCardDetail(gameEffect, money),
        "生成": true,
        "设": (st?: any) => {
            const i: any = currentStage ? currentStage.indexOf(o) : -1;
            if (i >= 0)
                currentStage.splice(i, 1);
            ctx.finalizeChoice(st, gameEffect, money, flag, !!(screenEntry && screenEntry["钱落额外"]), o.text);
        },
        pick: (st?: any) => { if (obligation && obligation.pick)
            obligation.pick(st); ctx.recordTransaction(o); },
    };
    if (obligation && obligation["续"])
        o["续"] = obligation["续"];
    if (obligation && obligation["续题"] !== undefined)
        o["续题"] = obligation["续题"];
    if (obligation && obligation["续简"] !== undefined)
        o["续简"] = obligation["续简"];
    return o;
};

// 记账：保留原玩法的计算或流程。
ctx.recordTransaction = function (o?: any) {
    if (!o || !o["记"])
        return;
    try {
        ctx.fetch(ctx.logEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: o["记"], "选了": o.text, "第几步": o["第几步"], "屏": o["屏"] }) })
            .catch(() => { });
    }
    catch { }
};

// 组牌场景：保留原玩法的计算或流程。
ctx.cardGroupScene = function (c?: any) {
    const chain: any = ctx.currentStoryChain(), slots: any = ctx.S.chainIndex || 0;
    const getValue: any = (v?: any) => { try {
        return typeof v === "function" ? v(ctx.S) : v;
    }
    catch {
        return "";
    } };
    const selected: any = [];
    const gameDestination: any = c["续层"] ? slots + 1 : slots;
    for (const p of chain.slice(0, gameDestination))
        for (const t of (p["选过"] || []))
            selected.push({ term: p.term, text: t });
    const g: any = ctx.miban && ctx.miban.grade;
    if (!ctx.S["组牌局号"])
        ctx.S["组牌局号"] = Math.random().toString(36).slice(2, 10);
    return {
        "环节": "三产", "节气": c.term, "题": c.title,
        "局号": ctx.S["组牌局号"],
        "第几步": slots, "整条链": chain.map((x?: any) => x.term),
        "年景": ctx.S["年景"] ? ctx.S["年景"]["名"] : "", "行情名": ctx.S["行情"] ? ctx.S["行情"]["名"] : "",
        "田情": { harvest: Math.round(ctx.S.stats.harvest), quality: Math.round(ctx.S.stats.quality),
            ecology: Math.round(ctx.S.stats.ecology) },
        "现金": Math.round(ctx.S["现金"] || 0), "名望": Math.round(ctx.S["名望"] || 0),
        "等级": g ? g["名"] : "",
        "已选": selected,
        "本屏作者选项": c.options.map((o?: any) => ({ "文字": getValue(o.text), "小字": getValue(o.sub),
            "效果": getValue(o.effect) })).filter((x?: any) => x["文字"]),
        "已用过": (ctx.S["组牌用过"] || []).slice(-14),
        "条件菜单": ctx.conditionalMenu(ctx.S),
        "承表": c["承式"] ? c.options.filter((o?: any) => !o["回"] && getValue(o.text)).map((o?: any) => getValue(o.text)) : null,
        "旗表": Array.from(ctx.cardTable),
        "要几张": ctx.cardsPerScreen,
        "说": getValue(c.say), "引": getValue(c.brief),
    };
};

// 组牌要去：保留原玩法的计算或流程。
ctx.shouldOpenCardGroup = function (scene?: any) {
    const stopped: any = new ctx.AbortController();
    const noisy: any = ctx.setTimeout(() => stopped.abort(), 9000);
    return ctx.fetch(ctx.cardGroupEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "场景": scene }), signal: stopped.signal })
        .then((r?: any) => r.json()).finally(() => ctx.clearTimeout(noisy));
};

// 补上牌：保留原玩法的计算或流程。
ctx.fillMissingCards = function (c?: any, originalOptions?: any, output?: any) {
    if (ctx.currentStoryChain()[ctx.S.chainIndex] !== c)
        return;
    if (c.options !== originalOptions)
        return;
    if ((c["补过的层"] || []).includes(originalOptions))
        return;
    const obligations: any = ctx.screenObligations(c, originalOptions);
    if (!obligations)
        return;
    (c["补过的层"] = c["补过的层"] || []).push(originalOptions);
    const existing: any = [...originalOptions.map((x?: any) => String(x.text || "")), ...(ctx.S["组牌用过"] || [])];
    const created: any = [];
    for (const original of ((output && output["选项"]) || [])) {
        const reportedSteps: any = String((original && original["步"]) || "").trim();
        if (reportedSteps && reportedSteps !== String(c.term || ""))
            continue;
        const obligation: any = obligations["挑"](original);
        if (!obligation)
            continue;
        const o: any = ctx.buildOptions(original, ctx.S, obligation, originalOptions, c);
        if (!o)
            continue;
        if (existing.includes(o.text) || created.some((x?: any) => x.text === o.text))
            continue;
        o["记"] = (output && output["记录id"]) || "";
        o["第几步"] = ctx.S.chainIndex || 0;
        o["屏"] = c.term || "";
        created.push(o);
    }
    if (!created.length)
        return;
    for (const o of created)
        c.options.push(o);
    (ctx.S["组牌用过"] = ctx.S["组牌用过"] || []).push(...created.map((o?: any) => o.text));
    ctx.render();
};

// 续层补牌：保留原玩法的计算或流程。
ctx.fillNextStageCards = function (c?: any) {
    if (ctx.chainNames !== "后段")
        return;
    if (!c || (c["补过的层"] || []).includes(c.options) || c["补中"])
        return;
    if (!c.options || c.options.length < 2)
        return;
    if ((ctx.S["组牌次数"] || 0) >= ctx.cardGroupLimit)
        return;
    if (!ctx.stageObligations(c.options))
        return;
    const originalOptions: any = c.options;
    c["补中"] = true;
    ctx.shouldOpenCardGroup(ctx.cardGroupScene(c))
        .then((j?: any) => {
        c["补中"] = false;
        if (j && j["有"]) {
            ctx.S["组牌次数"] = (ctx.S["组牌次数"] || 0) + 1;
            ctx.fillMissingCards(c, originalOptions, j);
        }
    })
        .catch(() => { c["补中"] = false; });
};

// 后段补牌：保留原玩法的计算或流程。
ctx.fillLaterStageCards = function (c?: any) {
    if (!c || !c["可补"])
        return;
    if (c["续层"])
        return;
    if (!c.options || !c.options.length)
        return;
    if (c["补中"] || (c["补过的层"] || []).includes(c.options))
        return;
    if ((ctx.S["组牌次数"] || 0) >= ctx.cardGroupLimit)
        return;
    if (!c.options.some((o?: any) => o && !o["回"] && String(o.text || "").trim()))
        return;
    const originalOptions: any = c.options;
    c["补中"] = true;
    ctx.shouldOpenCardGroup(ctx.cardGroupScene(c))
        .then((j?: any) => { c["补中"] = false; if (j && j["有"]) {
        ctx.S["组牌次数"] = (ctx.S["组牌次数"] || 0) + 1;
        ctx.fillMissingCards(c, originalOptions, j);
    } })
        .catch(() => { c["补中"] = false; });
};

// 认说话人：保留原玩法的计算或流程。
ctx.identifySpeaker = function (gameText?: any) {
    let best: any = null;
    for (const [gameKey, gameStyle] of ctx.dialogueSpeaker) {
        for (const m of String(gameText).matchAll(gameStyle)) {
            if (!best || m.index >= best["位"])
                best = { "键": gameKey, "位": m.index };
        }
    }
    return best;
};

// 玩家抢了话：保留原玩法的计算或流程。
ctx.playerInterrupted = function (previousPanel?: any, gameName?: any) {
    let playSlot: any = -1;
    for (const m of previousPanel.matchAll(ctx.playerDialogue))
        if (m.index > playSlot)
            playSlot = m.index;
    return playSlot >= 0 && (!gameName || playSlot > gameName["位"]);
};

// 框里指名了别人：保留原玩法的计算或流程。
ctx.namesAnotherPerson = function (previousPanel?: any, gameName?: any) {
    if (gameName)
        return false;
    const m: any = ctx.namedPeople.exec(previousPanel);
    if (!m)
        return false;
    return !new RegExp(ctx.pronounFor).test(ctx.splitSentences(previousPanel));
};

// 框里没有话：保留原玩法的计算或流程。
ctx.hasNoDialogue = function (previousPanel?: any) {
    const gameLast: any = ctx.closingSentence(previousPanel);
    if (/(?:没|没有|不|别|未|甭)\s*(?:说|道|问|答|回|喊|叫|讲|提|劝)/.test(gameLast))
        return true;
    return /[写记抄填签画]\s*(?:上|下|了|着|过|来|去)?\s*[:：]?$/.test(gameLast)
        && !/(?:说|道|问|答)/.test(gameLast);
};

// 认这一句：保留原玩法的计算或流程。
ctx.identifySentence = function (previousPanel?: any, prefix?: any) {
    const panelContent: any = ctx.identifySpeaker(previousPanel);
    if (ctx.playerInterrupted(previousPanel, panelContent))
        return null;
    if (ctx.namesAnotherPerson(previousPanel, panelContent))
        return null;
    if (ctx.hasNoDialogue(previousPanel))
        return null;
    if (panelContent)
        return panelContent["键"];
    const allOptions: any = ctx.identifySpeaker(prefix);
    return allOptions ? allOptions["键"] : null;
};

// 拆台词：保留原玩法的计算或流程。
ctx.splitDialogue = function (spoken?: any) {
    const allValues: any = String(spoken == null ? "" : spoken);
    const pair: any = [];
    for (let gameFind: any = 0;;) {
        const a: any = allValues.indexOf("「", gameFind);
        if (a < 0)
            break;
        const b: any = allValues.indexOf("」", a + 1);
        if (b < 0)
            return null;
        const bundle: any = allValues.indexOf("「", a + 1);
        if (bundle >= 0 && bundle < b)
            return null;
        if (!allValues.slice(a + 1, b).trim())
            return null;
        pair.push({ a, b });
        gameFind = b + 1;
    }
    if (!pair.length)
        return null;
    const gameBlock: any = [];
    let gameSide: any = "", swimming: any = 0;
    for (let k: any = 0; k < pair.length; k++) {
        const { a, b }: any = pair[k];
        const gameStart: any = Math.max(allValues.lastIndexOf("\n", a - 1) + 1, swimming);
        let gameStop: any = allValues.indexOf("\n", b + 1);
        if (gameStop < 0)
            gameStop = allValues.length;
        const lower: any = pair[k + 1];
        if (lower && lower.a < gameStop) {
            const seam: any = allValues.slice(b + 1, lower.a);
            const gameLast: any = Math.max(seam.lastIndexOf("。"), seam.lastIndexOf("！"), seam.lastIndexOf("？"), seam.lastIndexOf("…"));
            gameStop = gameLast >= 0 ? b + 2 + gameLast : lower.a;
        }
        const previousPanel: any = allValues.slice(gameStart, a), nextPanel: any = allValues.slice(b + 1, gameStop), sentence: any = allValues.slice(a + 1, b);
        gameSide += allValues.slice(swimming, gameStart);
        swimming = gameStop;
        if (/[一二两三四五六七八九十]\s*个\s*字|[一两]\s*句\s*话/.test(previousPanel)) {
            gameSide += previousPanel + "「" + sentence + "」" + nextPanel;
            continue;
        }
        const person: any = ctx.identifySentence(previousPanel, allValues.slice(0, a));
        if (!person) {
            gameSide += previousPanel + "「" + sentence + "」" + nextPanel;
            continue;
        }
        if (gameSide)
            gameBlock.push({ "旁": gameSide });
        gameBlock.push({ "谁": person, "前框": previousPanel, "后框": nextPanel, "前旁": gameSide, "原": sentence, "话": "", "题": "", "要过": false, "号": ++ctx.dialogueCounter });
        gameSide = "";
    }
    gameSide += allValues.slice(swimming);
    if (gameSide)
        gameBlock.push({ "旁": gameSide });
    if (!gameBlock.some((x?: any) => x["谁"]))
        return null;
    if (!gameBlock.some((x?: any) => x["旁"] && x["旁"].trim()))
        return null;
    return gameBlock;
};

// 说文：保留原玩法的计算或流程。
ctx.narrativeText = function (reversed?: any) {
    if (!reversed || !reversed["块"])
        return "";
    return reversed["块"].map((x?: any) => x["旁"] !== undefined
        ? ctx.renderEmphasis(x["旁"])
        : '<span class="said" id="sq' + x["号"] + '">'
            + (x["话"] ? ctx.renderEmphasis(x["前框"] + "「" + x["话"] + "」" + x["后框"]) : "") + "</span>").join("");
};

// 填话：保留原玩法的计算或流程。
ctx.fillDialogue = function (gameBlock?: any) {
    try {
        const el: any = ctx.document.getElementById("sq" + gameBlock["号"]);
        if (el)
            el.innerHTML = ctx.renderEmphasis(gameBlock["前框"] + "「" + gameBlock["话"] + "」" + gameBlock["后框"]);
    }
    catch { }
};

// 说话要去：保留原玩法的计算或流程。
ctx.shouldOpenDialogue = function (e?: any, treatment?: any) {
    const reversed: any = treatment["反应"];
    if (!reversed || !reversed["块"])
        return;
    for (const gameBlock of reversed["块"]) {
        if (!gameBlock["谁"] || gameBlock["要过"])
            continue;
        gameBlock["要过"] = true;
        ctx.renderDialogueSentence(e, gameBlock);
    }
};

// 说话一句：保留原玩法的计算或流程。
ctx.renderDialogueSentence = function (e?: any, gameBlock?: any) {
    const stopped: any = new ctx.AbortController();
    const noisy: any = ctx.setTimeout(() => stopped.abort(), 7000);
    try {
        ctx.fetch(ctx.dialogueEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "场景": {
                    "谁": gameBlock["谁"],
                    "印象": (ctx.S["印象"] || {})[gameBlock["谁"]] || 0,
                    "节气": (e && e.at) || "",
                    "年景": (ctx.S["年景"] && ctx.S["年景"]["名"]) || "",
                    "事": [gameBlock["题"], gameBlock["前旁"]].filter(Boolean).join("　").slice(0, 300),
                    "前框": gameBlock["前框"], "后框": gameBlock["后框"],
                } }), signal: stopped.signal })
            .then((r?: any) => r.json())
            .then((j?: any) => { if (j && j["有"] && j["话"]) {
            gameBlock["话"] = j["话"];
            ctx.fillDialogue(gameBlock);
        } })
            .catch(() => { })
            .finally(() => ctx.clearTimeout(noisy));
    }
    catch {
        ctx.clearTimeout(noisy);
    }
};

// 链进：保留原玩法的计算或流程。
ctx.chainProgress = function (S?: any, c?: any, o?: any) {
    if (o["回"] && c["备"] && c["备"].length) {
        const p: any = c["备"].pop();
        c.options = p["项"];
        c.title = p["题"];
        c.brief = p["简"];
        c.say = p["话"];
        c.who = p["谁"];
        if (c["选过"] && c["选过"].length)
            c["选过"].pop();
        if (c["后应录"] && c["后应录"].length)
            c["后应录"].pop();
        ctx.playCue("tap");
        ctx.render();
        return;
    }
    if (ctx.chainNames === "后段" && !c["推演过"] && ctx.shouldSettleServices(c)) {
        c["推演过"] = true;
        c["推演页"] = { "状态": "等" };
        const currentScreen: any = c;
        ctx.shouldOpenServices(ctx.buildServiceScene(c))
            .then((j?: any) => {
            if (ctx.currentStoryChain()[S.chainIndex] !== currentScreen)
                return;
            if (j && j["有"]) {
                currentScreen["推演页"] = { "状态": "有", "结": j };
                ctx.render();
            }
            else {
                currentScreen["推演页"] = null;
                ctx.chainProgress(S, currentScreen, {});
            }
        })
            .catch(() => {
            if (ctx.currentStoryChain()[S.chainIndex] !== currentScreen)
                return;
            currentScreen["推演页"] = null;
            ctx.chainProgress(S, currentScreen, {});
        });
        ctx.render();
        return;
    }
    if (c["推演页"]) {
        ctx.render();
        return;
    }
    S.chainIndex++;
    if (S.chainIndex >= ctx.currentStoryChain().length) {
        if (ctx.chainNames === "年话") {
            ctx.completeYearStory(S);
            ctx.chainNames = "后段";
            ctx.newAch = S["本季成就"];
            ctx.screen = "年话完";
        }
        else {
            ctx.result = ctx.yearEndStories(S);
            ctx.settleAchievements(S, ctx.result);
            ctx.newAch = S["本季成就"];
            ctx.screen = "yearend";
        }
    }
    if (ctx.chainNames === "后段")
        ctx.fillLaterStageCards(ctx.currentStoryChain()[S.chainIndex]);
    ctx.playCue(S.chainIndex >= ctx.currentStoryChain().length ? "钱" : "tap");
    ctx.render();
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.projectionEndpoint = (ctx.location.protocol === "file:" ? "http://localhost:8787" : "") + "/api/推演";

ctx.gameProjection = { "结": null, "键": "", "等": false, "占位": null };

ctx.canReviseProjection = ["harvest", "quality", "ecology"];

ctx.projectionEntryKey = 3;

ctx.projectionTotal = 4;

ctx.startGame = function () {
    ctx.S.termIndex = 0;
    ctx.screen = "pull";
    ctx.render();
    const y: any = ctx.S["年景"], gameTier: any = y["级"] || "R";
    ctx.playCue(gameTier === "SSR" ? (y["色"] === "d" ? "凶" : "金") : "抽");
};

ctx.toField = function () { ctx.nextTerm(); };

ctx.toDecision = function () { ctx.screen = "decision"; ctx.render(); };

ctx.nextEvent = function () {
    ctx.eventIndex++;
    if (ctx.eventIndex >= ctx.pendingEvents.length) {
        ctx.eventIndex = 0;
        ctx.toDecision();
        return;
    }
    ctx.render();
};

ctx.onDiag = function (i?: any) {
    const e: any = ctx.pendingEvents[ctx.eventIndex];
    if (!e || !e["诊"] || e["诊"]["点过"][i] || e["诊"]["完"])
        return;
    const s: any = e["诊"]["步"][i];
    if (!s)
        return;
    e["诊"]["点过"][i] = true;
    const score: any = s["问周"] ? e["诊"]["成"] : (s["值"] === undefined ? 1 : s["值"]);
    const teasing: any = s["问周"] ? ctx.farmerTeasing(ctx.S) : "";
    e["诊"]["得"].push({ wh: s.wh || s.text, "得": teasing + s["得"], "定": score >= e["诊"]["成"] });
    if (s["收"])
        e["诊"]["完"] = true;
    else
        e["诊"]["值"] += score;
    if (e["诊"]["名"] && !e["诊"]["记过"] && e["诊"]["值"] >= e["诊"]["成"]) {
        e["诊"]["记过"] = true;
        const times: any = ctx.readArchive()["认得次"] || {};
        ctx.saveArchive({ "认得次": { ...times, [e["诊"]["名"]]: (times[e["诊"]["名"]] || 0) + 1 } });
    }
    if (s["费"])
        ctx.S.stamina = Math.max(0, ctx.S.stamina - s["费"]);
    if (ctx.S.stamina < (ctx.S["最低体力"] === undefined ? 99 : ctx.S["最低体力"]))
        ctx.S["最低体力"] = ctx.S.stamina;
    ctx.S["体力花"] = (ctx.S["体力花"] || 0) + (s["费"] || 0);
    if (s["问周"])
        ctx.S["问周"] = (ctx.S["问周"] || 0) + 1;
    ctx.S["探查"] = (ctx.S["探查"] || 0) + 1;
    ctx.playCue(s["收"] ? "坏" : "tap");
    ctx.render();
};

ctx.onTreat = function (i?: any) {
    const e: any = ctx.pendingEvents[ctx.eventIndex];
    if (!e || !e["诊"] || e["诊"]["治"])
        return;
    const o: any = (e["诊"]["处置"] || [])[i];
    if (!o)
        return;
    if (!ctx.isOptionUnlocked(o, ctx.S))
        return;
    if (o["续"]) {
        (e["诊"]["上"] || (e["诊"]["上"] = [])).push(o.text);
        e["诊"]["问"] = o["续"]["问"] || e["诊"]["问"];
        e["诊"]["处置"] = o["续"]["处置"] || [];
        ctx.playCue("tap");
        ctx.render();
        return;
    }
    const solution: any = (v?: any) => ctx.resolveValue(v, ctx.S);
    const expense: any = solution(o["费"]) || 0;
    const money: any = solution(o["钱"]) || 0;
    const image: any = solution(o["象"]);
    const response: any = solution(o["回"]) || 0;
    const originalSpeech: any = solution(o["说"]);
    let reversed: any = null, spoken: any = originalSpeech;
    {
        const gameBlock: any = ctx.splitDialogue(originalSpeech);
        if (gameBlock) {
            for (const x of gameBlock)
                if (x["谁"])
                    x["题"] = (e["诊"] && e["诊"]["题"]) || "";
            reversed = { "块": gameBlock };
            spoken = gameBlock.filter((x?: any) => x["旁"] !== undefined).map((x?: any) => x["旁"]).join("");
        }
    }
    const supplement: any = solution(o["补"]) || {};
    if (expense) {
        ctx.S.stamina = Math.max(0, ctx.S.stamina - expense);
        ctx.S["体力花"] = (ctx.S["体力花"] || 0) + expense;
    }
    if (money) {
        ctx.S.cost += money;
        ctx.S["现金"] = Math.max(0, ctx.S["现金"] - money);
    }
    if (o["旗"])
        ctx.S.flags[o["旗"]] = true;
    if (image)
        ctx.recordImpression(ctx.S, image);
    if (o["隐"])
        ctx.recordHiddenFlag(ctx.S, o["隐"]);
    if (response)
        ctx.S.stamina += response;
    if (o["问周"])
        ctx.S["问周"] = (ctx.S["问周"] || 0) + 1;
    if (o["交"])
        ctx.S["交数"] = (ctx.S["交数"] || 0) + o["交"];
    if (o["缺"])
        ctx.S["缺席"] = (ctx.S["缺席"] || 0) + o["缺"];
    const gamePrevious: any = { ...ctx.S.stats };
    const delta: any = ctx.applyEffect(ctx.S, supplement);
    e["诊"]["治"] = { ...o, "说": spoken, "反应": reversed, delta, "前": gamePrevious, "后": { ...ctx.S.stats } };
    if (reversed)
        ctx.shouldOpenDialogue(e, e["诊"]["治"]);
    ctx.flash = {};
    for (const k in delta)
        if (delta[k])
            ctx.flash[k] = delta[k];
    ctx.playCue(e["诊"]["岔"] ? "tap" : (o["好"] ? "好" : "坏"));
    ctx.render();
};

ctx.onWhy = function (k?: any) {
    ctx.describeNumber = ctx.describeNumber === k ? null : k;
    ctx.playCue("tap");
    ctx.render();
};

ctx.onLock = function (i?: any) {
    const d0: any = ctx.S["节气"][ctx.S.termIndex] || {}, o0: any = (d0.options || [])[i];
    if (!o0)
        return;
    const h: any = (d0["热区"] || [])[i] || {};
    const reason: any = typeof o0["锁说"] === "function" ? o0["锁说"](ctx.S) : o0["锁说"];
    ctx.playCue("tap");
    ctx.toast(`${h["标"] || o0.text} · ${reason || "还差一步"}`);
};

ctx.onHot = function (i?: any) {
    const d0: any = ctx.S["节气"][ctx.S.termIndex] || {}, o0: any = (d0.options || [])[i];
    if (o0 && !ctx.isOptionUnlocked(o0, ctx.S))
        return;
    if (ctx.S["选了"] !== null)
        return;
    ctx.S["选了"] = i;
    ctx.playCue("tap");
    const allEntries: any = ctx.app.querySelectorAll ? ctx.app.querySelectorAll(".hot") : [];
    if (allEntries[i] && allEntries[i].classList)
        allEntries[i].classList.add("on");
    const gameItem: any = ctx.app.querySelectorAll ? ctx.app.querySelectorAll(".shi.s" + i)[0] : null;
    if (gameItem && gameItem.classList)
        gameItem.classList.add("on");
    if (!ctx.app.querySelectorAll || !ctx.setTimeout) {
        ctx.S["选了"] = null;
        ctx.onChoose(i);
        return;
    }
    ctx.setTimeout(() => { ctx.S["选了"] = null; ctx.onChoose(i); }, 280);
};

ctx.toggleRelationships = function () { ctx.relationshipsExpanded = !ctx.relationshipsExpanded; ctx.preserveScroll = true; ctx.render(); };

ctx.onSound = function () {
    ctx.soundEnabled = !ctx.soundEnabled;
    if (ctx.soundEnabled)
        ctx.playCue("tap");
    ctx.render();
};

ctx.onChoose = function (i?: any) {
    const btn: any = ctx.document.querySelectorAll ? ctx.document.querySelectorAll(".btn")[i] : null;
    if (btn)
        btn.classList.add("pick");
    ctx.playCue("tap");
    ctx.setTimeout(() => {
        ctx.lastResult = ctx.choose(ctx.S, ctx.S.termIndex, i);
        ctx.flash = {};
        for (const k in ctx.lastResult.delta)
            if (ctx.lastResult.delta[k])
                ctx.flash[k] = ctx.lastResult.delta[k];
        if (ctx.lastResult["新图鉴"] && ctx.lastResult["新图鉴"].length)
            ctx.toast(`记下了 · ${ctx.lastResult["新图鉴"].join("、")}`);
        ctx.screen = "result";
        ctx.render();
        ctx.playCue(Object.keys(ctx.lastResult.delta).some((k?: any) => ctx.lastResult.delta[k] < 0) ? "坏" : "好");
        ctx.scanAchievements(null);
    }, 160);
};

ctx.onNight = function (option?: any) {
    const read: any = option === "读";
    const beforeSleep: any = ctx.S.stamina;
    ctx.S.stamina += read ? ctx.NUM["翻书恢复"] : ctx.NUM["睡觉恢复"];
    ctx.S["夜里"] = read ? "读" : "睡";
    if (!read) {
        ctx.playCue("tap");
        ctx.toast(`睡了 · 体力 +${ctx.NUM["睡觉恢复"]}`);
        ctx.onContinue();
        return;
    }
    ctx.S["待查"] = ctx.lastResult ? ctx.lastResult["查"] : null;
    const availableInspiration: any = !!(ctx.S["待查"] && ctx.S["待查"]["灵"]) && !ctx.S["灵感"][ctx.S["待查"]["灵"]] && beforeSleep >= ctx.NUM["灵感体力线"];
    ctx.S["新灵感"] = availableInspiration ? ctx.S["待查"]["灵"] : null;
    if (availableInspiration)
        ctx.S["灵感"][availableInspiration] = true;
    const gameMethod: any = ctx.S["待查"] && ctx.S["待查"]["法"];
    ctx.S["新说法"] = gameMethod && !ctx.S["说法"][gameMethod] ? gameMethod : null;
    if (ctx.S["新说法"]) {
        ctx.S["说法"][ctx.S["新说法"]] = true;
        ctx.saveArchive({ "说法": { ...ctx.S["说法"] } });
    }
    const gameRemaining: any = ctx.marginNotes.map((_?: any, i?: any) => i).filter((i?: any) => !(ctx.S["批过"] || {})[i]);
    ctx.S["新批注"] = (gameRemaining.length && Math.random() < ctx.NUM["边批概率"])
        ? gameRemaining[Math.floor(Math.random() * gameRemaining.length)] : null;
    if (ctx.S["新批注"] !== null) {
        (ctx.S["批过"] || (ctx.S["批过"] = {}))[ctx.S["新批注"]] = true;
        ctx.saveArchive({ "批过": { ...ctx.S["批过"] } });
    }
    ctx.S["查过"][ctx.S["节气"][ctx.S.termIndex].term] = true;
    ctx.playCue(availableInspiration ? "好" : "tap");
    ctx.screen = "note";
    ctx.render();
};

ctx.onContinue = function () {
    ctx.S["待查"] = null;
    ctx.S["新灵感"] = null;
    ctx.S["新说法"] = null;
    ctx.S["新批注"] = null;
    ctx.S.termIndex++;
    ctx.flash = {};
    if (ctx.S.termIndex >= ctx.S["节气"].length) {
        ctx.dueEvents(ctx.S, ctx.S["节气"].length);
        ctx.flash = {};
        ctx.S.log.forEach((e?: any) => { for (const k in e.delta)
            if (e.delta[k])
                ctx.flash[k] = e.delta[k]; });
        ctx.S.grain = ctx.S.stats.harvest;
        ctx.miban = ctx.gradeRice(ctx.S);
        ctx.screen = "miban";
        ctx.render();
        ctx.playCue(ctx.miban.grade["名"] === "特级" ? "金" : ctx.miban.grade["名"] === "等外" ? "坏" : "好");
        ctx.scanAchievements(null);
    }
    else
        ctx.nextTerm();
};

ctx.toChain = function () {
    if (!ctx.S["行情"])
        ctx.S["行情"] = ctx.drawMarketConditions();
    ctx.S["后段"] = ctx.buildLaterStage(ctx.S).map((gameStep?: any) => ({ ...gameStep, options: [...(gameStep.options || [])] }));
    ctx.S.chainIndex = 0;
    ctx.chainNames = "后段";
    ctx.screen = "hangqing";
    ctx.render();
    ctx.playCue(ctx.S["行情"]["级"] === "SSR" ? (ctx.S["行情"]["色"] === "d" ? "凶" : "金") : "抽");
};

ctx.toChainGo = function () { ctx.chainNames = "后段"; ctx.screen = "chain"; ctx.render(); };

ctx.onChain = function (i?: any) {
    const c: any = ctx.currentStoryChain()[ctx.S.chainIndex];
    if (!c)
        return;
    if (c["反应"]) {
        ctx.finishReaction();
        return;
    }
    if (!c.options[i])
        return;
    const o: any = c.options[i];
    const lk: any = o["锁"];
    if (lk === true || (typeof lk === "function" && lk(ctx.S)))
        return;
    if (c["层数"] === undefined)
        c["层数"] = c.options.length;
    if (!o["回"]) {
        (c["选过"] = c["选过"] || []).push(o.text);
        if (o["后"])
            (c["后应录"] = c["后应录"] || []).push(o["后"]);
    }
    if (o["设"])
        o["设"](ctx.S);
    if (o["续"]) {
        (c["备"] = c["备"] || []).push({ "项": c.options, "题": c.title, "简": c.brief, "话": c.say, "谁": c.who });
        c.options = o["续"];
        if (o["续题"] !== undefined)
            c.title = o["续题"];
        if (o["续简"] !== undefined)
            c.brief = o["续简"];
        if (o["续话"] !== undefined)
            c.say = o["续话"];
        if (o["续谁"] !== undefined)
            c.who = o["续谁"];
        c["续层"] = true;
        ctx.fillNextStageCards(c);
        ctx.playCue("tap");
        ctx.render();
        return;
    }
    if (typeof o.pick === "function")
        o.pick(ctx.S);
    if (o["后"]) {
        c["反应"] = { "说": o["后"], "谁": o["后谁"] !== undefined ? o["后谁"] : c.who, "进": o };
        ctx.playCue("tap");
        ctx.render();
        return;
    }
    ctx.chainProgress(ctx.S, c, o);
};

ctx.shouldSettleServices = (c?: any) => !!(c && c["层数"] >= 2 && c["选过"] && c["选过"].length);

ctx.finishServiceScreen = function () {
    const c: any = ctx.currentStoryChain()[ctx.S.chainIndex];
    if (!c || !c["推演页"])
        return;
    c["推演页"] = null;
    ctx.chainProgress(ctx.S, c, {});
};

ctx.cardGroupEndpoint = ctx.projectionEndpoint.slice(0, -2) + "组牌";

ctx.logEndpoint = ctx.projectionEndpoint.slice(0, -2) + "生成日志";

ctx.cardGroupLimit = 6;

ctx.cardsPerScreen = 3;

ctx.cardTable = new Set([
    "印了自家名字", "印了盒子", "盒子是牛皮纸的", "盒子里塞了手写的条",
    "赊了酒厂的账", "跟酒厂说定了长期", "瓶子上写了京西稻",
    "接了认养", "认养的人来看过田", "接了研学", "学校那边留了话",
    "供上了饭馆", "摆了摊", "跑过馆子", "留了明年的种",
    "把碎米挑出去了", "稻桩留到了冬天", "田埂上留了草籽",
]);

ctx.dialogueEndpoint = ctx.projectionEndpoint.slice(0, -2) + "说话";

ctx.dialogueSpeaker = [
    ["同", /同\s*学\s*A/gi],
    ["乙", /同\s*学\s*B/gi],
    ["赵", /米厂的老\s*赵|老\s*赵/g],
    ["周", /老\s*周/g],
    ["陈", /老\s*陈/g],
    ["师", /老\s*师/g],
    ["主", /田\s*主/g],
    ["村", /村\s*长/g],
    ["农", /农\s*资\s*店/g],
];

ctx.dialogueActions = "(?:说|道|问|答|回|喊|叫|念|读|写|应|补|讲|提|劝|骂|夸)(?:完|了|过|着|上|下)?";

ctx.playerDialogue = new RegExp("[你您]" + ctx.dialogueActions, "g");

ctx.pronounFor = "他|她|它|你|我|咱|谁|对方";

ctx.namedPeople = /([^\s，。、；：！？…「」（）]{1,4})(?:说|道|问|答)[了一]?[句声]?[:：]?\s*$/;

ctx.splitSentences = (previousPanel?: any) => previousPanel.split(/[。！？，、；：\n]/).pop() || previousPanel;

ctx.closingSentence = (previousPanel?: any) => {
    const gameSlice: any = String(previousPanel).split(/[。！？，、；：\n]/).filter((x?: any) => x.trim());
    return gameSlice.length ? gameSlice[gameSlice.length - 1] : "";
};

ctx.dialogueCounter = 0;

ctx.finishReaction = function () {
    const c: any = ctx.currentStoryChain()[ctx.S.chainIndex];
    if (!c || !c["反应"])
        return;
    const o: any = c["反应"]["进"];
    delete c["反应"];
    ctx.chainProgress(ctx.S, c, o);
};

ctx.openYearStory = function () {
    ctx.S["年话"] = ctx.buildYearStory(ctx.S);
    if (!ctx.S["年话"].length)
        return;
    ctx.S.chainIndex = 0;
    ctx.chainNames = "年话";
    ctx.screen = "chain";
    ctx.playCue("tap");
    ctx.render();
};

ctx.setTab = function (t?: any) { ctx.tab = t; ctx.render(); };

ctx.backToGame = function () {
    ctx.screen = ctx.bookSources === "封面" ? "cover"
        : ctx.S.termIndex >= ctx.S["节气"].length ? "yearend" : "decision";
    ctx.bookSources = "田";
    ctx.render();
};

ctx.bookSources = "田";

ctx.openBook = function (sourcePosition?: any) {
    ctx.bookSources = sourcePosition || "田";
    if (sourcePosition === "封面")
        ctx.tab = "成就";
    ctx.screen = "book";
    ctx.render();
};

ctx.restart = function () {
    ctx.saveArchive({ "季": (ctx.readArchive()["季"] || 1) + 1 });
    ctx.reset();
    ctx.achievementQueue = [];
    ctx.showStoryCard();
    ctx.render();
};
}
