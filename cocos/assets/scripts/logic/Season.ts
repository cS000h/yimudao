/** 抽取一季、事件触发、效果与跨季存档。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// 抽年景：保留原玩法的计算或流程。
ctx.drawSeasonWeather = function () {
    const gameTotal: any = ctx.weatherPool.reduce((a?: any, y?: any) => a + (y["重"] || 1), 0);
    let r: any = Math.random() * gameTotal;
    for (const y of ctx.weatherPool) {
        r -= (y["重"] || 1);
        if (r < 0)
            return y;
    }
    return ctx.weatherPool[0];
};

// 抽行情：保留原玩法的计算或流程。
ctx.drawMarketConditions = function () {
    const gameTotal: any = ctx.marketPool.reduce((a?: any, y?: any) => a + (y["重"] || 1), 0);
    let r: any = Math.random() * gameTotal;
    for (const y of ctx.marketPool) {
        r -= (y["重"] || 1);
        if (r < 0)
            return y;
    }
    return ctx.marketPool[0];
};

// 算名望：保留原玩法的计算或流程。
ctx.calculatePrestige = function (S?: any, g?: any) {
    const gameGrade: any = ctx.prestigeTable[g["名"]] !== undefined ? ctx.prestigeTable[g["名"]] : 0;
    const e: any = S.stats.ecology;
    const gameEcology: any = e >= 85 ? 5 : e >= 70 ? 3 : e >= 50 ? 1 : e >= 35 ? 0 : -2;
    const relationships: any = ctx.clamp(S["回响"] - S["负面"], -3, 5);
    const gameTitle: any = S["酒"] === "名头" ? ctx.NUM["酒名望得"] : 0;
    const gameRoute: any = S.channel === "直销"
        ? (S["直"] === "摆摊" ? ctx.NUM["直销摊望"] : S["直"] === "跑馆" ? ctx.NUM["直销馆望"] : 0) : 0;
    const currentSeason: any = gameGrade + gameEcology + relationships + gameTitle + gameRoute;
    return { "等级": gameGrade, "生态": gameEcology, "人情": relationships, "名头": gameTitle, "门路": gameRoute, "本季": currentSeason, "前": S["名望"] || 0, "合计": Math.max(0, (S["名望"] || 0) + currentSeason) };
};

// 记隐：保留原玩法的计算或流程。
ctx.recordHiddenFlag = function (S?: any, gameHidden?: any) {
    for (const k in gameHidden) {
        if (k === "厨艺")
            S["厨艺"] = ctx.clamp((S["厨艺"] || 0) + gameHidden[k], 0, ctx.cookingSkillLimit);
        else
            S[k] = Math.max(0, (S[k] || 0) + gameHidden[k]);
    }
    ctx.saveArchive({ "厨艺": S["厨艺"] || 0, "蹭饭": S["蹭饭"] || 0, "食堂": S["食堂"] || 0 });
};

// 记象：保留原玩法的计算或流程。
ctx.recordImpression = function (S?: any, image?: any) {
    for (const k in image) {
        S["印象"][k] = ctx.clamp((S["印象"][k] || 0) + image[k], -ctx.impressionLimit, ctx.impressionLimit);
        S["本季印象"][k] = (S["本季印象"][k] || 0) + image[k];
    }
    ctx.saveArchive({ "印象": { ...S["印象"] } });
};

// 谁的事：保留原玩法的计算或流程。
ctx.eventOwner = function (ev?: any) {
    const output: any = new Set();
    const scan: any = (place?: any) => (place || []).forEach((ch?: any) => {
        if (ch && ch["象"])
            Object.keys(ch["象"]).forEach((k?: any) => output.add(k));
        if (ch && Array.isArray(ch["续"]))
            scan(ch["续"]);
    });
    if (ev && ev["诊"])
        scan(ev["诊"]["处置"]);
    return output;
};

// 人事对得上：保留原玩法的计算或流程。
ctx.matchesPersonalEvent = function (investigation?: any, ev?: any) {
    const gameText: any = String(ev["看见"] || ev.line || "");
    const old: any = investigation["旧"] || {};
    for (const k of ctx.assertPersonalEvents)
        if (k["认"].test(gameText) && !k["要"](old))
            return false;
    return true;
};

// 事上的人：保留原玩法的计算或流程。
ctx.eventPeople = function (ev?: any) {
    const output: any = [];
    for (const k of ctx.eventOwner(ev))
        output.push({ "键": k, "名": ctx.findPerson(k)["名"].replace(/\s+/g, ""), "值": (ctx.S["印象"] || {})[k] || 0 });
    return output;
};

// 事上做事：保留原玩法的计算或流程。
ctx.applyEventWork = function (o?: any) {
    const gameBlock: any = [], expense: any = ctx.resolveValue(o["费"], ctx.S), money: any = ctx.resolveValue(o["钱"], ctx.S);
    if (expense)
        gameBlock.push("花 " + expense + " 点体力");
    if (money)
        gameBlock.push("掏 " + money + " 元");
    const supplement: any = ctx.resolveValue(o["补"], ctx.S) || {};
    const ledger: any = Object.keys(supplement).filter((k?: any) => supplement[k])
        .map((k?: any) => ctx.LABEL[k] + " " + (supplement[k] > 0 ? "+" : "") + supplement[k] + ctx.UNIT[k]);
    if (ledger.length)
        gameBlock.push("收成上：" + ledger.join("、"));
    const image: any = ctx.resolveValue(o["象"], ctx.S) || {};
    const relationship: any = Object.keys(image).filter((k?: any) => image[k])
        .map((k?: any) => ctx.findPerson(k)["名"].replace(/\s+/g, "") + " 的印象 " + (image[k] > 0 ? "+" : "") + image[k]);
    if (relationship.length)
        gameBlock.push(relationship.join("、"));
    if (o["开"])
        gameBlock.push("（交情够这一条才出得来）");
    return gameBlock.join("；") || "不费什么，也没什么变化";
};

// 备事：保留原玩法的计算或流程。
ctx.prepareEvents = function () {
    if (!ctx.S || !ctx.S["节气"] || ctx.preparedPeople === ctx.S)
        return;
    ctx.preparedPeople = ctx.S;
    const table: any = (ctx.S["事改"] = {});
    const gameYear: any = ctx.S["年景"] || {};
    const situation: any = { "季": ctx.S["季"], "年景": gameYear["名"] || "", "年景说": gameYear["说"] || "",
        "钱": Math.round(ctx.S["现金"] || 0), "名望": ctx.S["名望"] || 0 };
    const old: any = {};
    for (const k in (ctx.S["旧"] || {}))
        if (ctx.S["旧"][k])
            old[k] = true;
    ctx.randomPool.forEach((ev?: any, i?: any) => {
        if (!ctx.S["抽中"][i] || !(ev["诊"] && ev["诊"]["岔"]))
            return;
        if (ev["家常"] || ev["校历"] || ev["同线"] || ev["人情"] || ev["感情"])
            return;
        const place: any = ev["诊"]["处置"] || [];
        if (!place.length)
            return;
        const pit: any = ctx.S["节气"].filter((d?: any) => d["阶段"] === ev.at)[0] || {};
        const scenario: any = {
            "节气": pit.term || "", "段": ev.at, "局面": situation, "旧": old, "人": ctx.eventPeople(ev),
            "文": { "看见": ev["看见"] || ev.line || "", "题": ev["诊"]["题"] || "", "问": ev["诊"]["问"] || "",
                "处置": place.map((o?: any) => ({ "选": String(ctx.resolveValue(o.text, ctx.S) || ""),
                    "说": String(ctx.resolveValue(o["说"], ctx.S) || ""), "做事": ctx.applyEventWork(o) })) },
        };
        const stopped: any = new ctx.AbortController();
        const noisy: any = ctx.setTimeout(() => stopped.abort(), 9000);
        try {
            ctx.fetch(ctx.eventEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "场景": scenario }), signal: stopped.signal })
                .then((r?: any) => r.json())
                .then((j?: any) => { if (j && j["有"])
                table[i] = j; })
                .catch(() => { })
                .finally(() => ctx.clearTimeout(noisy));
        }
        catch (e: any) {
            ctx.clearTimeout(noisy);
        }
    });
};

// 取改好的事：保留原玩法的计算或流程。
ctx.getRevisedEvent = function (i?: any) {
    const gameRevision: any = ctx.S && ctx.S["事改"] && ctx.S["事改"][i];
    if (!gameRevision || !gameRevision["看见"])
        return null;
    const ev: any = ctx.randomPool[i], place: any = (ev && ev["诊"] && ev["诊"]["处置"]) || [];
    if (!Array.isArray(gameRevision["处置"]) || gameRevision["处置"].length !== place.length)
        return null;
    return {
        "看见": gameRevision["看见"],
        "诊": { ...ev["诊"], "题": gameRevision["题"], "问": gameRevision["问"],
            "处置": place.map((o?: any, k?: any) => ({ ...o, text: gameRevision["处置"][k]["选"], "说": gameRevision["处置"][k]["说"] })) },
    };
};

// newSeason：保留原玩法的计算或流程。
ctx.newSeason = function (gameFixed?: any) {
    const f: any = gameFixed || {};
    const gameTerm: any = f["节气"] || ctx.buildSeasonTerms();
    const seasonalWeather: any = f["年景"] || ctx.drawSeasonWeather();
    const picked: any = ctx.randomPool.map((e?: any) => e.p > 0 && Math.random() < e.p);
    const currentSeasonStage: any = new Set(gameTerm.map((d?: any) => d["阶段"]));
    {
        const household: any = ctx.randomPool.findIndex((e?: any) => e["家常"]);
        if (household >= 0)
            picked[household] = currentSeasonStage.has(ctx.randomPool[household].at);
    }
    const investigation: any = {
        "说法": ctx.readArchive()["说法"] || {}, codex: { ...(ctx.readArchive()["认得"] || {}) },
        "旧": { ...(ctx.readArchive()["前事"] || {}) },
        "印象": { "周": 0, "陈": 0, "同": 0, "赵": 0, "师": 0, "主": 0, "村": 0, "农": 0, "乙": 0,
            ...(ctx.readArchive()["印象"] || {}) },
        "名望": ctx.readArchive()["名望"] || 0, "季": ctx.readArchive()["季"] || 1,
        "查过": {}, flags: {}, stats: {},
    };
    const personalEventSlot: any = [];
    ctx.randomPool.forEach((e?: any, i?: any) => {
        if (!(e["诊"] && e["诊"]["岔"]))
            return;
        if (e["家常"] || e["校历"] || e["同线"] || e["人情"] || e["感情"])
            return;
        picked[i] = false;
        if (e["需"] && !e["需"](investigation))
            return;
        if (!ctx.matchesPersonalEvent(investigation, e))
            return;
        if (currentSeasonStage.has(e.at))
            personalEventSlot.push(i);
    });
    if (!ctx.meetsPrestige("生人")(investigation)) {
        const low: any = personalEventSlot.filter((k?: any) => ctx.randomPool[k]["低望"]);
        if (low.length && Math.random() < .7) {
            const k: any = low[Math.floor(Math.random() * low.length)];
            picked[k] = true;
            personalEventSlot.splice(personalEventSlot.indexOf(k), 1);
        }
    }
    const seasonCount: any = ctx.readArchive()["季"] || 1;
    let usedColdOption: any = 0;
    {
        const encounteredPerson: any = ctx.readArchive()["见人"] || {};
        const headcount: any = {};
        for (const k of personalEventSlot)
            for (const w of ctx.eventOwner(ctx.randomPool[k]))
                (headcount[w] = headcount[w] || []).push(k);
        const selections: any = Object.keys(investigation["印象"]).filter((w?: any) => headcount[w] && headcount[w].length);
        if (selections.length) {
            const coldness: any = (w?: any) => seasonCount - (encounteredPerson[w] || 0);
            const coldest: any = Math.max(...selections.map(coldness));
            const tied: any = selections.filter((w?: any) => coldness(w) === coldest);
            const candidates: any = tied[Math.floor(Math.random() * tied.length)];
            const gameEntries: any = headcount[candidates];
            let gameTotal: any = 0;
            for (const k of gameEntries)
                gameTotal += ctx.randomPool[k].p || .2;
            let r: any = Math.random() * gameTotal, option: any = gameEntries[gameEntries.length - 1];
            for (const k of gameEntries) {
                r -= (ctx.randomPool[k].p || .2);
                if (r <= 0) {
                    option = k;
                    break;
                }
            }
            picked[option] = true;
            personalEventSlot.splice(personalEventSlot.indexOf(option), 1);
            usedColdOption = 1;
        }
    }
    {
        const byStage: any = new Map();
        for (const k of personalEventSlot) {
            const a: any = ctx.randomPool[k].at;
            if (!byStage.has(a))
                byStage.set(a, []);
            byStage.get(a).push(k);
        }
        // Creator 的宽松编译模式将展开表达式当作数组，迭代器先显式转数组。
        const phaseList: any = Array.from(byStage.keys());
        for (let i: any = phaseList.length - 1; i > 0; i--) {
            const j: any = Math.floor(Math.random() * (i + 1));
            [phaseList[i], phaseList[j]] = [phaseList[j], phaseList[i]];
        }
        const requirement: any = Math.max(0, Math.min(personalEventSlot.length, ctx.NUM["人事保底"] + (Math.random() < ctx.NUM["人事加件"] ? 1 : 0)) - usedColdOption);
        for (let i: any = 0; i < requirement; i++) {
            let gamePhase: any = null;
            for (let k: any = 0; k < phaseList.length; k++) {
                const trial: any = phaseList[(i + k) % phaseList.length];
                if (byStage.get(trial).length) {
                    gamePhase = trial;
                    break;
                }
            }
            if (!gamePhase)
                break;
            const gameEntries: any = byStage.get(gamePhase);
            let gameTotal: any = 0;
            for (const k of gameEntries)
                gameTotal += ctx.randomPool[k].p || .2;
            let r: any = Math.random() * gameTotal, option: any = gameEntries[gameEntries.length - 1];
            for (const k of gameEntries) {
                r -= (ctx.randomPool[k].p || .2);
                if (r <= 0) {
                    option = k;
                    break;
                }
            }
            picked[option] = true;
            gameEntries.splice(gameEntries.indexOf(option), 1);
        }
    }
    {
        const table: any = [];
        ctx.randomPool.forEach((e?: any, i?: any) => { if (e["校历"] && currentSeasonStage.has(e.at))
            table.push(i); });
        if (table.length) {
            const n: any = Math.max(1, ctx.readArchive()["季"] || 1);
            picked[table[(n - 1) % table.length]] = true;
        }
    }
    {
        const same: any = ctx.readArchive()["同进度"] || 0;
        if (same < ctx.classmateTrack.length) {
            const k: any = ctx.randomPool.findIndex((e?: any) => e["同线"] && e.at === ctx.classmateTrack[same].at && e["名"] === ctx.classmateTrack[same]["名"]);
            if (k >= 0)
                picked[k] = true;
        }
    }
    if (ctx.seasonNumber() >= ctx.relationshipStartSeason) {
        const table: any = [];
        ctx.randomPool.forEach((e?: any, i?: any) => { if (e["人情"] && currentSeasonStage.has(e.at))
            table.push(i); });
        if (table.length) {
            const n: any = ctx.seasonNumber() - ctx.relationshipStartSeason;
            picked[table[n % table.length]] = true;
        }
    }
    if (ctx.seasonNumber() >= ctx.romanceStartSeason) {
        const relationship: any = ctx.readArchive()["情进度"] || 0;
        if (relationship < ctx.romanceTracks.length) {
            const gameItem: any = ctx.romanceTracks[relationship];
            if (!gameItem["门"] || gameItem["门"](investigation)) {
                const k: any = ctx.randomPool.findIndex((e?: any) => e["感情"] && e.at === gameItem.at && e["名"] === gameItem["名"]);
                if (k >= 0)
                    picked[k] = true;
            }
        }
    }
    const ledgerOrigin: any = ctx.readArchive()["账来源"] || null;
    const machinery: any = Math.random() < (ledgerOrigin === "师" ? .78 : .45);
    const experience: any = Math.min((seasonCount - 1) * ctx.NUM["熟练每季"], ctx.NUM["熟练上限"]);
    const startingCapital: any = Math.min(Math.round((ctx.readArchive()["存"] || 0) * ctx.NUM["带钱比例"] / 10) * 10, ctx.NUM["带钱上限"]);
    return {
        stats: { harvest: ctx.NUM["亩产基准"], quality: ctx.NUM["品质基准"], ecology: ctx.NUM["生态基准"] },
        stamina: ctx.NUM["体力基准"] + experience,
        cost: 0, flags: {}, fired: {}, log: [],
        "旧": { ...(ctx.readArchive()["前事"] || {}) },
        codex: { ...(ctx.readArchive()["认得"] || {}) }, ach: { ...(ctx.readArchive().ach || {}) },
        "季": seasonCount, "本季认得": {},
        "熟练": experience, "底金": startingCapital,
        "种": ctx.readArchive()["种"] || null,
        "查过": {}, "本季成就": [],
        "灵感": {}, "新灵感": null,
        "说法": ctx.readArchive()["说法"] || {}, "新说法": null,
        "批过": ctx.readArchive()["批过"] || {}, "新批注": null,
        "见后话": { ...(ctx.readArchive()["见后话"] || {}) },
        "见人": { ...(ctx.readArchive()["见人"] || {}) },
        "厨艺": ctx.readArchive()["厨艺"] || 0,
        "蹭饭": ctx.readArchive()["蹭饭"] || 0,
        "食堂": ctx.readArchive()["食堂"] || 0,
        "名望": ctx.readArchive()["名望"] || 0, "本季名望": null,
        "印象": { "周": 0, "陈": 0, "同": 0, "赵": 0, "师": 0, "主": 0, "村": 0, "农": 0, "乙": 0,
            ...(ctx.readArchive()["印象"] || {}) },
        "本季印象": {},
        "最低体力": 99, "体力花": 0, "问周": 0, "探查": 0,
        "问周总": ctx.readArchive()["问周总"] || 0,
        "雇过": false, "回响": 0, "负面": 0,
        "显数": {}, "待查": null,
        termIndex: 0, chainIndex: 0,
        "节气": gameTerm, "年景": seasonalWeather, "抽中": picked, "年景已发": false,
        "事改": {},
        "移线": seasonalWeather["移线"] || 0,
        grain: 0, soldGrain: 0, rate: 0, channel: "", third: "",
        "账来源": ledgerOrigin, "农机": machinery, "农机用掉": null,
        "交数": 0, "交数总": ctx.readArchive()["交数总"] || 0,
        "同进度": ctx.readArchive()["同进度"] || 0,
        "情进度": ctx.readArchive()["情进度"] || 0,
        "缺席": 0, "缺席谈过": false,
        "现金": ctx.NUM["本钱"] + startingCapital, "行情": null, "后段": [], "额外": 0, "大寒说明": "",
        "选了": null,
        "选择": [],
    };
};

// applyEffect：保留原玩法的计算或流程。
ctx.applyEffect = function (state?: any, effect?: any) {
    if (typeof effect === "function")
        effect = effect(state);
    const d: any = {};
    for (const k in (effect || {})) {
        const before: any = state.stats[k];
        state.stats[k] = ctx.clampStat(k, state.stats[k] + effect[k]);
        d[k] = state.stats[k] - before;
    }
    return d;
};

// 档：保留原玩法的计算或流程。
ctx.readArchive = function () {
    try {
        return JSON.parse(ctx.localStorage.getItem(ctx.archiveStorageKey)) || ctx.memorySave || {};
    }
    catch (e: any) {
        return ctx.memorySave || {};
    }
};

// 存档：保留原玩法的计算或流程。
ctx.saveArchive = function (supplement?: any) {
    const old: any = ctx.readArchive();
    ctx.memorySave = { ...old, ...supplement };
    try {
        ctx.localStorage.setItem(ctx.archiveStorageKey, JSON.stringify(ctx.memorySave));
    }
    catch (e: any) { }
};

// 阶段末位：保留原玩法的计算或流程。
ctx.stageLastIndex = function (state?: any, stages?: any) {
    let last: any = -1;
    state["节气"].forEach((d?: any, i?: any) => { if (d["阶段"] === stages)
        last = i; });
    return last;
};

// 老周损嘴：保留原玩法的计算或流程。
ctx.farmerTeasing = function (S?: any) {
    const n: any = (S["问周总"] || 0) + (S["问周"] || 0) + 1;
    if (n < 3)
        return "";
    if (Math.random() >= Math.min(.6, .18 * (n - 2)))
        return "";
    const readArchive: any = n >= 9 ? 2 : n >= 5 ? 1 : 0;
    const gameEntries: any = ctx.teasingLines[readArchive];
    const k: any = (S["损过"] || 0) % gameEntries.length;
    S["损过"] = (S["损过"] || 0) + 1;
    return gameEntries[k] + "\n";
};

// 开诊：保留原玩法的计算或流程。
ctx.startDiagnosis = function (state?: any, diagnosis?: any) {
    if (!diagnosis)
        return null;
    const times: any = (diagnosis["名"] && (ctx.readArchive()["认得次"] || {})[diagnosis["名"]]) || 0;
    const z: any = { ...diagnosis, "点过": {}, "值": 0, "得": [], "完": false, "治": null,
        "熟": !!state.codex[diagnosis["名"]], "次": times };
    if (times >= 2 && z["成"] > 0) {
        z["值"] = z["成"];
        z["一眼"] = true;
        z["得"].push({ wh: `这 毛 病 你 认 过 ${times} 回`, "旧": true, "定": true,
            "得": "一样的斑、一样长在哪一片叶上，你在自己田里见过好几回了。\n这回没蹲下去，站在田埂上看了一眼就知道。" });
        return z;
    }
    if (!z["熟"] || z["成"] <= 1)
        return z;
    const dialogue: any = z["步"].findIndex((x?: any) => !x["收"] && (x["值"] === undefined ? 1 : x["值"]) < z["成"]);
    if (dialogue < 0)
        return z;
    z["点过"][dialogue] = true;
    z["得"].push({ wh: "上 季 你 认 过 它", "旧": true,
        "得": "这个你上季亲手认过，长什么样、长在哪儿、该往哪处看，都还有印象。" });
    z["值"] += 1;
    return z;
};

// 事件天相：保留原玩法的计算或流程。
ctx.eventWeather = function (ev?: any) {
    const t: any = String(ev["看见"] || ev.line || "");
    return {
        "旱": /旱|干裂|缺水|水位|渗没|卷叶|干得/.test(t),
        "雨": /阴雨|连阴|连着.{0,4}阴|下了|下雨|雨一|淋|泡了|淹|涝/.test(t),
    };
};

// 逆年景：保留原玩法的计算或流程。
ctx.adverseWeather = function (state?: any, ev?: any) {
    const Y: any = state["年景"];
    if (!Y || !Y.hit)
        return false;
    const thisEntry: any = (state["节气"] || [])[state.termIndex] || {};
    if (thisEntry["阶段"] !== Y.hit)
        return false;
    const gameSky: any = ctx.eventWeather(ev);
    if (Y["旱"] && gameSky["雨"])
        return true;
    if (Y["雨"] && gameSky["旱"])
        return true;
    return false;
};

// dueEvents：保留原玩法的计算或流程。
ctx.dueEvents = function (state?: any, termIndex?: any) {
    const out: any = [];
    const push: any = (line?: any, mood?: any, effect?: any, from?: any, codex?: any, lookup?: any, diagnosis?: any) => {
        const diagnosisOpened: any = ctx.startDiagnosis(state, diagnosis);
        if (codex)
            ctx.unlock(state, codex);
        const gamePrevious: any = { ...state.stats };
        const delta: any = ctx.applyEffect(state, effect);
        const item: any = { line, mood, delta, from: from || null, "查": lookup || null,
            "前": gamePrevious, "后": { ...state.stats },
            "诊": diagnosisOpened };
        if (mood === "bad")
            state["负面"]++;
        else if (mood === "good")
            state["回响"]++;
        out.push(item);
        state.log.push(item);
    };
    const here: any = state["节气"][termIndex];
    const gameName: any = here ? here.term : "收尾";
    const gamePhase: any = here ? here["阶段"] : "收尾";
    const sameSlot: any = state["节气"].map((d?: any, i?: any) => (d["阶段"] === gamePhase ? i : -1)).filter((i?: any) => i >= 0);
    const slot: any = sameSlot.indexOf(termIndex);
    const turn: any = (ev?: any) => {
        if (ev["诊"] && ev["诊"]["岔"])
            return true;
        if (sameSlot.length <= 1)
            return true;
        const sameGrade: any = ctx.randomPool.filter((e?: any) => e.at === gamePhase);
        return sameGrade.indexOf(ev) % sameSlot.length === slot;
    };
    const Y: any = state["年景"];
    const seasonWeatherEnd: any = Y && Y.hit ? ctx.stageLastIndex(state, Y.hit) : -1;
    if (Y && Y.hit && !state["年景已发"] && seasonWeatherEnd >= 0 && seasonWeatherEnd === termIndex - 1) {
        state["年景已发"] = true;
        const encountered: any = Y["反"] && state.flags[Y["反"]];
        const blocked: any = !encountered && Y["对冲"] && state.flags[Y["对冲"]];
        const usage: any = encountered ? { line: Y["反线"] || Y.line, effect: Y["反后"] || Y.effect, "移": Y["反移"] }
            : blocked ? { line: Y["对冲线"] || Y.line, effect: Y["对冲后"] || Y.effect, "移": Y["冲移"] }
                : { line: Y.line, effect: Y.effect, "移": Y["移线"] };
        const hasLedger: any = Object.keys(usage.effect || {}).length > 0;
        push(usage.line, encountered ? "bad" : blocked ? "good" : (Y["色"] === "a" ? "good" : hasLedger ? "bad" : ""), usage.effect, ["年景", Y["名"]], null, ctx.lookupReference["年景-" + Y["名"]]);
        if (usage["移"] !== undefined && usage["移"] !== state["移线"]) {
            const entry: any = out[out.length - 1];
            entry["移线前"] = state["移线"];
            entry["移线"] = usage["移"];
            state["移线"] = usage["移"];
        }
    }
    ctx.EVENTS.forEach((ev?: any, i?: any) => {
        if (state.fired[i] || (ev.at !== gameName && ev.at !== gamePhase) || !ev.when(state))
            return;
        state.fired[i] = true;
        push(ev["看见"] || ev.line, ev.mood, ev.effect, ev.from, ev.codex, ev["查"], ev["诊"]);
    });
    ctx.randomPool.forEach((ev?: any, i?: any) => {
        if (!state["抽中"][i] || state.fired["r" + i] || ev.at !== gamePhase)
            return;
        if (ev["需"] && !ev["需"](state))
            return;
        if (ctx.adverseWeather(state, ev)) {
            state["逆过"] = (state["逆过"] || 0) + 1;
            return;
        }
        if (!turn(ev))
            return;
        state.fired["r" + i] = true;
        if (ev["诊"] && ev["诊"]["岔"] && !ev["家常"]) {
            const people: any = ctx.eventOwner(ev);
            if (people.size) {
                let dirty: any = false;
                for (const w of people) {
                    state["见人"][w] = state["季"];
                    dirty = true;
                }
                if (dirty)
                    ctx.saveArchive({ "见人": { ...state["见人"] } });
            }
        }
        const blocked: any = ev["对冲"] && state.flags[ev["对冲"]];
        const gameText: any = blocked ? (ev["对冲看见"] || ev["看见"] || ev["对冲线"] || ev.line)
            : (ev["看见"] || ev.line);
        const rewritten: any = blocked ? null : ctx.getRevisedEvent(i);
        push(rewritten ? rewritten["看见"] : gameText, ev.mood, blocked ? (ev["对冲后"] || ev.effect) : ev.effect, null, ev.codex, ev["查"], rewritten ? rewritten["诊"] : ev["诊"]);
    });
    if (!state["缺席谈过"] && (state["缺席"] || 0) >= ctx.NUM["缺席线"]) {
        state["缺席谈过"] = true;
        push("老师把你叫到办公室。桌上摊着你那两张表，一张是学期初的，一张是上个月的。\n"
            + "「不是批评你。」他说。\n「你那个田我知道，是真忙。」\n"
            + "他把两张表并排放着，指了指上头的日期。\n"
            + "「可你数数，这学期你在这儿坐过几回。」", "", {}, null, null, null, { "岔": true, "成": 0, "步": [], "名": null,
            "题": "这 学 期 你 坐 过 几 回",
            "问": "你打算怎么办？",
            "处置": [
                { text: "承认：田里的事我放不下", "费": 1, "补": {}, "好": true,
                    "旗": "校-认了", "象": { "师": 2 },
                    "说": "你说田里那几个月是一年只有一次的，错过了就没了。\n"
                        + "他没接这句，过了一会儿说：「我知道。」\n"
                        + "「我不拦你，」他说，「但你得让我知道你在哪儿。」\n"
                        + "从那天起，你每天晚上收工以后给他发一条消息，就一行字：今天干了什么。\n"
                        + "他一条都没回过。可你发的每一条，他都看了。" },
                { text: "说：下学期我把课选松一点", "费": 0, "补": {}, "好": true,
                    "旗": "校-调课", "象": { "师": 1 },
                    "说": "他说这个不用跟我说，跟教务说。\n"
                        + "不过他把笔放下了，说你这句话他记着。\n"
                        + "下学期你真把两门课挪到了晚上。他没问，可你交表的时候看见他在上面签了字。" },
                { text: "说以后尽量来", "费": 0, "补": {}, "好": false,
                    "旗": "校-敷衍", "象": { "师": -2 },
                    "说": "他说行。\n"
                        + "这一个「行」字跟上次那个一模一样 —— 你听出来了。\n"
                        + "他把两张表收进抽屉，说：「去吧。」\n"
                        + "你走到门口回头看了一眼，他还坐在那儿，没动。" },
            ] });
    }
    return out;
};

// choose：保留原玩法的计算或流程。
ctx.choose = function (state?: any, decisionIndex?: any, optionIndex?: any) {
    const d: any = state["节气"][decisionIndex];
    const o: any = d.options[optionIndex];
    const gamePrevious: any = { ...state.stats }, previousStamina: any = state.stamina;
    const deficit: any = Math.max(0, o.stam - state.stamina);
    state.stamina = Math.max(0, state.stamina - o.stam);
    if (state.stamina < (state["最低体力"] === undefined ? 99 : state["最低体力"]))
        state["最低体力"] = state.stamina;
    state["体力花"] = (state["体力花"] || 0) + Math.max(0, o.stam - deficit);
    const laborFee: any = deficit * ctx.NUM["雇工价"];
    if (laborFee > 0)
        state["雇过"] = true;
    state.cost += o.cost + laborFee;
    if (o["用农机"])
        state["农机用掉"] = o["用农机"];
    state["现金"] = Math.max(0, state["现金"] - o.cost - laborFee);
    const delta: any = ctx.applyEffect(state, o.effect);
    (o.flags || []).forEach((f?: any) => { state.flags[f] = true; });
    const newCollection: any = ctx.unlock(state, o.codex);
    const lookup: any = ctx.lookupReference[`${d.term}-${optionIndex}`] || null;
    (state["选择"] || (state["选择"] = [])).push({
        "序": decisionIndex, term: d.term, title: d.title,
        "阶段": d["阶段"],
        "下标": optionIndex, text: o.text, delta,
        cost: o.cost, "雇工费": laborFee, "体力前": previousStamina, "体力": state.stamina,
    });
    ctx.prefetchProjection();
    return { text: o.result, note: o.note || null, delta, "查": lookup, "节气名": d.term,
        "关": o["关"] || null, "说": o["说"] || null,
        "前": gamePrevious, "后": { ...state.stats }, "体力前": previousStamina, "体力": state.stamina, "花销": o.cost,
        "雇工费": laborFee, "缺口": deficit, "新图鉴": newCollection };
};

// gradeOf：保留原玩法的计算或流程。
ctx.gradeOf = function (quality?: any, shiftThreshold?: any) {
    shiftThreshold = shiftThreshold || 0;
    let g: any = ctx.gradeTable[0];
    ctx.gradeTable.forEach((x?: any) => { if (x.min > 0 && quality >= x.min + shiftThreshold)
        g = x; });
    return g;
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.clamp = (n?: any, lo?: any, hi?: any) => Math.max(lo, Math.min(hi, n));

ctx.clampStat = (k?: any, n?: any) => { const [lo, hi]: any = ctx.LIMITS[k] || [0, 100]; return ctx.clamp(n, lo, hi); };

ctx.buildSeasonTerms = () => {
    const anchor: any = ctx.DECISIONS.filter((d?: any) => d["锚"]);
    const gameEntries: any = ctx.DECISIONS.filter((d?: any) => !d["锚"]).slice();
    for (let i: any = gameEntries.length - 1; i > 0; i--) {
        const j: any = Math.floor(Math.random() * (i + 1));
        [gameEntries[i], gameEntries[j]] = [gameEntries[j], gameEntries[i]];
    }
    return anchor.concat(gameEntries.slice(0, 8 - anchor.length)).sort((a?: any, b?: any) => a["序"] - b["序"]);
};

ctx.semesterClock = [
    { at: "分蘖", "校历": true, "名": "组会",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "群里发通知：这学期最后一次组会，下周三下午两点，每人讲十分钟。\n"
            + "上一条消息是班长发的，说考试安排出来了，三门课都在下周。\n"
            + "你划开日历看了一眼 —— 下周三，正好是该插秧那两天。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "下 周 三 下 午 两 点",
            "问": "你打算怎么办？",
            "处置": [
                { text: "去。秧往后挪两天插", "费": 8, "补": { harvest: -14, quality: 2 }, "好": true,
                    "旗": "校-去组会", "交": 1, "象": { "师": 3 },
                    "说": "你去了。讲的是插秧早晚跟分杈数的关系，用了自己那本记录。\n"
                        + "讲完老师问了一句：「你这个数，是几个点？」\n"
                        + "你说一个点，就这一亩。他点点头，没再说什么。\n"
                        + "散会出来天已经黑了。你骑车回镇上，第二天早上四点下的田。\n"
                        + "那两天的秧是补着插完的，比往年稀。" },
                { text: "不去。田里这两天走不开", "费": 0, "补": { harvest: 8 }, "好": false,
                    "旗": "校-缺组会", "缺": 1, "象": { "师": -2 },
                    "说": "你没去。\n"
                        + "那天下午你在田里，手机放在田埂上的书包里，震了两次。\n"
                        + "晚上回去看，是同学A 发的两张照片：投影上是别人的PPT，最后一页写着你的名字，下面是「请假」。\n"
                        + "他在消息里问你：你那个田，比组会还重要？\n"
                        + "你回了个「嗯」。他没再回。" },
                { text: "讲完就走，后面的讨论不参加", "费": 6, "补": { harvest: -5 }, "好": true,
                    "旗": "校-讲完就走", "交": 1, "象": { "师": 1 },
                    "说": "你讲完收拾电脑，跟前排说了声有事先走。\n"
                        + "走到门口的时候，老师在后头说了句：「你那个田里的数，回头拷我一份。」\n"
                        + "你说好。你确实拷了，第二天早上从田里回来拷的。\n"
                        + "讨论那一段说了什么，你到现在也不知道。" },
            ] } },
    { at: "孕穗", "校历": true, "名": "中期",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "学院要中期材料：一张进展表，一页纸，导师签字。\n"
            + "表在书包里放了半个月，边角磨得起毛。\n"
            + "填这个要在电脑前坐一晚上 —— 而这一晚上，田里正在晒水。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "那 张 表",
            "问": "你打算怎么办？",
            "处置": [
                { text: "今晚填了，明天一早寄出去", "费": 5, "补": { harvest: -5 }, "好": true,
                    "旗": "校-交中期", "交": 1, "象": { "师": 2 },
                    "说": "你在宿舍坐到十二点，把这一季的数一条一条填进去。\n"
                        + "填到「存在问题」那一栏，你停了一会儿，写的是：样本只有一亩，重复不了。\n"
                        + "第二天寄走。第三天老师回了一句：「这句写得对，先留着。」" },
                { text: "跟老师说明情况，宽限一周", "费": 1, "补": {}, "好": true,
                    "旗": "校-拖中期", "缺": 1, "象": { "师": -1 },
                    "说": "你发消息说田里正晒田，走不开，想宽限一周。\n"
                        + "他回得很快：「行。」\n"
                        + "就这一个字，没有下文。你盯着屏幕看了一会儿，把手机扣在桌上。\n"
                        + "一周后你交了。他签了字，没提这一周的事。" },
                { text: "照着去年的模板改个数字交上去", "费": 2, "补": {}, "好": false,
                    "旗": "校-糊弄中期", "象": { "师": -3 },
                    "说": "你找了上一届的表，把日期和数字换了，其余原样。\n"
                        + "交上去没人说什么。\n"
                        + "交完那天你有点得意 —— 半个钟头的事，别人坐一晚上。\n"
                        + "你没想到这张表会有人回头看。" },
            ] } },
    { at: "苗期", "校历": true, "名": "活动",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "学院群：本周四下午两点，报告厅，形势与政策讲座，现场签到，缺席计旷课。\n"
            + "通知发完，另一个群里同学B 在问：「周四下午谁去，帮我签一下。」\n"
            + "「我不在学校。」\n"
            + "没有人接。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "本 周 四 下 午 两 点",
            "问": "你打算怎么办？",
            "处置": [
                { text: "去。坐满两个钟头", "费": 4, "补": {}, "好": true,
                    "旗": "校-去讲座", "象": {},
                    "说": "你去了。报告厅坐了不到一半，前排是各班班长，点名用的。\n"
                        + "讲的人在念稿，底下有人写别的课的作业。\n"
                        + "散场时签到表从前面传过来。你签了。\n"
                        + "旁边那个空位上，有人一笔签了三个格子。" },
                { text: "找人代签，自己去田里", "费": 0, "补": { harvest: 4 }, "好": false,
                    "旗": "校-代签", "象": {},
                    "说": "你给同学B 发消息，说你帮他签，让他帮你签。\n"
                        + "他回得很快：「我不在学校。」\n"
                        + "「你让我怎么给你签。」\n"
                        + "你最后找了隔壁宿舍的。签是签上了。\n"
                        + "那天下午你在田里，风很好，稻苗刚缓过来。" },
                { text: "去，但把本子带上，坐最后一排", "费": 3, "补": { quality: 2 }, "好": true,
                    "旗": "校-带本子去", "象": {},
                    "说": "你带了本子。前半场理上一季的数，后半场抬头听了几句。\n"
                        + "讲到「把论文写在祖国大地上」，底下有人笑了一声。\n"
                        + "你没笑。那天上午你刚在田里蹲了三个钟头，膝盖上还沾着泥。" },
            ] } },
    { at: "成熟", "校历": true, "名": "催稿",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "老师发消息：初稿这周能给我吗。\n"
            + "上一条是三天前的，也是这一句，你还没回。\n"
            + "而这一周正好是开镰那一周。割下来的稻子摊在场上，一天要翻三遍。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "这 周 能 给 我 吗",
            "问": "你打算怎么办？",
            "处置": [
                { text: "熬夜写，写完再下田", "费": 9, "补": { harvest: -10, quality: 3 }, "好": true,
                    "旗": "校-熬夜交稿", "象": { "师": 2 },
                    "说": "你在宿舍写到三点。写到「结果」那一节，翻出本子对着抄数。\n"
                        + "第二天早上发过去，他回了一个「收到」。\n"
                        + "你八点到的田里，眼睛睁不开，翻场的时候差点踩进沟里。\n"
                        + "那天下午起了风，有一片谷子没来得及收堆，淋了半个钟头。\n"
                        + "你没跟任何人说是因为熬夜。" },
                { text: "回他：收完粮给，就三天", "费": 1, "补": { harvest: 3 }, "好": true,
                    "旗": "校-回了话", "象": { "师": -1 },
                    "说": "你回：老师，这周开镰，收完就写，晚三天。\n"
                        + "他回：「好，注意别中暑。」\n"
                        + "你看着这句愣了一下。\n"
                        + "三天后你交了。他签字的时候提了一句：「你那个田，收成怎么样。」\n"
                        + "你说还行。他说那就好。\n"
                        + "这件事就这么过去了，轻得让你有点不好意思。" },
                { text: "不回。等收完了再说", "费": 0, "补": { harvest: 5 }, "好": false,
                    "旗": "校-没回话", "象": { "师": -3 },
                    "说": "你把手机扣在桌上，出门了。\n"
                        + "接下来五天你都在场上。晒、翻、扬、装袋，晚上倒头就睡。\n"
                        + "想起来的时候是第六天，你打开微信，那两条消息还在最上面。\n"
                        + "你补了一句「老师对不起，刚忙完」。\n"
                        + "他回了一个「嗯」。\n"
                        + "那个「嗯」你看了好几遍。" },
            ] } },
];

ctx.classmateTrack = [
    { at: "苗期", "同线": true, "名": "进组",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "从实验楼到食堂那条路，你走到一半才发觉后面有人。\n"
            + "同学A 跟你隔着七八步，白大褂没脱，袖口沾着一点没干的培养基。\n"
            + "你回头。他也停下。\n"
            + "隔了两秒，他说：「我走这条路。」\n"
            + "然后他快走两步赶上来，说他上个月进了老师那个组，跟着师兄做。\n"
            + "「你那个田，」他把手套摘下来塞兜里，「什么时候带我去看一眼？」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "什 么 时 候 带 我 去 看 一 眼",
            "问": "你打算怎么办？",
            "处置": [
                { text: "这个周末，你来", "费": 6, "补": { harvest: -6 }, "好": true,
                    "旗": "同-带去田里", "象": { "同": 3 },
                    "说": "你说周末。那天你在地里干到晌午，直起腰才看见埂上站着个人。\n"
                        + "不知道站了多久。\n"
                        + "他在田埂上又站了半个钟头，问了一堆你答不上来的问题。\n"
                        + "「你这个没有对照啊。」他说。\n"
                        + "你说一亩地哪来的对照。他想了想，说也是。\n"
                        + "走的时候他蹲下去拔了一根稻子，装进自封袋，说要拿回去测。\n"
                        + "后来他真测了，发回来一张表。表上有一行数字你看了半天，跟你想的不一样。" },
                { text: "等我忙完这阵", "费": 0, "补": { harvest: 3 }, "好": false,
                    "旗": "同-推了", "象": { "同": -1 },
                    "说": "他说行，那就等你忙完。\n"
                        + "这句话他说得很轻，像是早就料到了。\n"
                        + "他站起来要走，又停了一下，像是还有半句没说。\n"
                        + "最后没说出来。\n"
                        + "后来他也没再提过。你忙完那阵是收完粮，那时候他已经不怎么找你了。" },
                { text: "反问他：你在组里做什么", "费": 2, "补": {}, "好": true,
                    "旗": "同-问了他做什么", "象": { "同": 2 },
                    "说": "他一口气说了几个词：转录组、差异表达、富集分析。\n"
                        + "一路走一路说，你停下来系鞋带，他也停下来等。\n"
                        + "说完就停了，像是不打算往下讲。\n"
                        + "你问这些跟田有什么关系。\n"
                        + "他想了想：「现在没有。以后可能有。」\n"
                        + "这句他说得很慢。\n"
                        + "那次「以后」一直到很后面才来。" },
            ] } },
    { at: "分蘖", "同线": true, "名": "拉你进组",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "你在窗口打饭，一回头看见同学A 站在过道上，端着盘子。\n"
            + "盘子里的饭已经凉了。\n"
            + "你问他等多久了。\n"
            + "「不久。」\n"
            + "坐下来他才说：组里缺人手做数据整理，他跟老师提了你的名字。\n"
            + "「你那本记录本，师兄说能整理成一套标准。」\n"
            + "他说这话的时候挺高兴，是那种替朋友高兴。\n"
            + "「不用你天天去，就是那本本子得拿出来。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "那 本 本 子 得 拿 出 来",
            "问": "你打算怎么办？",
            "处置": [
                { text: "行，本子给你拿去扫", "费": 3, "补": { quality: 2 }, "好": true,
                    "旗": "同-本子给组里", "象": { "同": 3, "师": 2 },
                    "说": "他把本子带走那两天，你心里空落落的。\n"
                        + "还回来的时候多了一个牛皮纸袋，里头是打印好的复印件，一页不差，还编了页码。\n"
                        + "他说：「原件我给你压平了。」\n"
                        + "你翻到最后一页，看见角落里有人用铅笔写了个「待核」。" },
                { text: "数据可以给，本子我自己留着", "费": 2, "补": {}, "好": true,
                    "旗": "同-只给数据", "象": { "同": 1, "师": 1 },
                    "说": "你把数抄了一份给他。他接过去看了看，说行。\n"
                        + "「不过你这个字，」\n他说：「师兄那边得重新录一遍。」\n"
                        + "后来那套「标准」里没有你的名字。你也没问。" },
                { text: "算了。这一亩我想自己先种明白", "费": 0, "补": { harvest: 4 }, "好": false,
                    "旗": "同-回绝了组里", "象": { "同": -2, "师": -1 },
                    "说": "他愣了一下，说行吧。\n"
                        + "「那可是个机会。」他说这话的时候没看你。\n"
                        + "之后有一阵他在楼道里碰见你只点一下头。\n"
                        + "你不后悔，就是有点不知道怎么跟他说话。" },
            ] } },
    { at: "孕穗", "同线": true, "名": "他那边出了事",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "半夜两点，同学A 在群里发消息，说数据对不上，让重做。\n"
            + "第二天在楼道碰见，他眼睛底下是青的，手里拎着两盒泡面。\n"
            + "他在你门口站了一会儿才开口。\n"
            + "「你那本子，」他说，「我想看看你是怎么记的。」\n"
            + "「我那个数，师兄说前后对不上。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "前 后 对 不 上",
            "问": "你打算怎么办？",
            "处置": [
                { text: "明天把本子送过去，顺便陪他坐一会儿", "费": 4, "补": { harvest: -3 }, "好": true,
                    "旗": "同-陪他坐了一晚", "象": { "同": 4 },
                    "说": "你俩在实验室坐到十一点。你一页一页翻本子，告诉他哪一栏是什么时候记的。\n"
                        + "翻到七月那一页，他停住了：「你这儿空了两天。」\n"
                        + "你说那两天下雨没下田。他说：「我那儿没空。」\n"
                        + "他那天晚上把那两天的数全划了，重跑。第二天早上数据对上了。" },
                { text: "说：你先睡两天，睡醒了再看", "费": 1, "补": {}, "好": true,
                    "旗": "同-让他先睡", "象": { "同": 2 },
                    "说": "你说你都熬成这样了，看什么都是错的。\n"
                        + "他看了你一会儿，说：「好。」\n"
                        + "他真睡了一天。第二天下午给你发消息，说找到了，是一个日期填错了。\n"
                        + "「你那天说的对，」\n他说：「我那时候看什么都觉得是错的。」" },
                { text: "说：我这儿也乱着，你自己想办法", "费": 0, "补": { harvest: 4 }, "好": false,
                    "旗": "同-没管", "象": { "同": -3 },
                    "说": "他嗯了一声，说行。\n"
                        + "他拎着泡面上楼了。你站在原地站了会儿，回田里去了。\n"
                        + "那之后他有一阵没找过你。\n"
                        + "你有时候想，那天要是留下会怎么样。想不出结果 —— 田里那两天确实正忙。" },
            ] } },
    { at: "成熟", "同线": true, "名": "他定了",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "同学A 保上了。明年去另一个城市。\n"
            + "他说这话的时候在收拾柜子，把一摞资料装进纸箱，用胶带绕了两圈。\n"
            + "这学期他来过田里两回，都没打招呼，站在埂那头看一会儿就走。\n"
            + "是隔壁地的人告诉你的。\n"
            + "「你明年还种吗？」\n"
            + "问完他自己停了停。\n"
            + "「这话我去年问过。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "你 明 年 还 种 吗",
            "问": "你打算怎么办？",
            "处置": [
                { text: "种", "费": 2, "补": {}, "好": true,
                    "旗": "同-说还种", "象": { "同": 2 },
                    "说": "你说了个字：种。\n"
                        + "他停下手里的活看了你一眼，说：「那我就等着看你那本子。」\n"
                        + "他把最后一箱搬出门的时候，回头说了一句：「明年要是缺人，喊我。」\n"
                        + "你知道他明年不会来。你也说了声好。" },
                { text: "不知道。地是租的，租约一年一签", "费": 2, "补": {}, "好": true,
                    "旗": "同-说不知道", "象": { "同": 2 },
                    "说": "他点点头，说也是。\n"
                        + "「地不是你的，田里的东西倒是你的。」他说。\n"
                        + "这句话你后来想了好几回。想的时候正在田里干活，太阳很大。" },
                { text: "反问他：你走了，这一亩我一个人看？", "费": 1, "补": {}, "好": false,
                    "旗": "同-问他走了怎么办", "象": { "同": -1 },
                    "说": "他愣了一下：「我又不是种地的。」\n"
                        + "说完就没再往下说。\n"
                        + "你说没事。两个人把箱子抬下楼，路上谁都没说话。\n"
                        + "这件事以后你俩都绕开不提。" },
            ] } },
    { at: "成熟", "同线": true, "名": "他走了以后",
        p: 0, mood: "", effect: {},
        line: "同学A 走了以后，实验室那条路你还是会路过。\n"
            + "有一回你走着走着觉得后面有人，回头，是空的。\n"
            + "那以后你就不太走那条路了。\n"
            + "后来碰见他师兄，师兄认出你：「你就是那个种稻子的。」\n"
            + "「他那套数据发出去了，署在第三个。\n"
            + "他加了条脚注，说原始记录来自一份手写本。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "第 三 个 署 名",
            "问": "你打算怎么办？",
            "处置": [
                { text: "回去翻翻本子，看是哪几条", "费": 3, "补": { quality: 2 }, "好": true,
                    "旗": "同-翻了本子", "象": { "同": 2 },
                    "说": "你翻到那几页，果然是他问过的，页边还有他用铅笔画过的横线，很轻。\n"
                        + "你把那几页复印了一份，夹在本子最前头。\n"
                        + "以后翻本子，先看见的是这一页。" },
                { text: "给他打个电话，问那几页是怎么回事", "费": 3, "补": {}, "好": true,
                    "旗": "同-打了电话", "象": { "同": 3 },
                    "说": "你拨过去是晚上十点，他那边很吵。\n"
                        + "你把师兄那句话说了。他沉默了一会儿。\n"
                        + "「我不知道这件事。我要是知道，会跟他们说。」\n"
                        + "你说明白。他停了一下：「那个脚注是我加的。你信不信。」\n"
                        + "你说信。" },
                { text: "什么也不做", "费": 0, "补": { harvest: 2 }, "好": true,
                    "旗": "同-没去翻", "象": {},
                    "说": "你说知道了，谢谢师兄。\n"
                        + "然后你回田里去了。那一季收成不错。\n"
                        + "本子还在原来的地方放着，你不会去翻 —— 那几条你本来就记得。" },
            ] } },
];

ctx.seasonNumber = () => Math.max(1, ctx.readArchive()["季"] || 1);

ctx.relationshipStartSeason = 2;

ctx.romanceStartSeason = 3;

ctx.relationshipTracks = [
    { at: "苗期", "人情": true, "名": "本子上的话",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "老周来田里坐了一下午，翻你那本记录。\n"
            + "翻到中间他停了：「这上头有几句话，是我跟你说的。」\n"
            + "你说知道。\n"
            + "「那你上回交上去那份材料，怎么写的？」\n"
            + "你告诉他：署名是老师，里头有一段看叶色施肥的，写的是「田间调研所得」。\n"
            + "他把本子合上，搁在膝盖上，没还给你。\n"
            + "「我一个种地的，不算什么。」他说。\n"
            + "「可那句话是我说的。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "那 句 话 是 我 说 的",
            "问": "你打算怎么办？",
            "处置": [
                { text: "说：下回那份材料，把你的名字加上", "费": 3, "补": {}, "好": false,
                    "旗": "人-要署名", "象": { "周": 2 },
                    "说": "你说了。他抬头看你，好一会儿才开口。\n"
                        + "「加我名字干什么，我又看不懂那个东西。」\n"
                        + "嘴上这么说，那天走的时候他把本子还给你了，还多坐了半个钟头。\n"
                        + "回学校你真跟老师提了。老师问你：「你知道署名是什么意思吗？」\n"
                        + "你说知道。他说那你再想想。\n"
                        + "这事后来没往下走。可老周那边，你一直没敢再提。" },
                { text: "说：那是学校的材料，跟这个不一样", "费": 0, "补": {}, "好": false,
                    "旗": "人-分了家", "象": { "周": -2 },
                    "说": "你解释了。他听着，点头，说也是。\n"
                        + "然后把本子还给你，站起来走了。\n"
                        + "走到埂口他回头：「往后你问我什么，我还是会说。」\n"
                        + "「就是你别再往那上头写我名字了。」\n"
                        + "你站在田里，觉得这句比骂你难听。" },
                { text: "认下来：那段不该那么写", "费": 5, "补": { harvest: -3 }, "好": true,
                    "旗": "人-认了错", "象": { "周": 3 },
                    "说": "你说那段写错了，不该写「田间调研」。\n"
                        + "他愣了一下，说：「你这孩子。」\n"
                        + "那天下午他跟你坐了很久，讲的全是没进本子的东西 ——\n"
                        + "哪年旱过，哪年虫来得早，哪块地的水最难放。\n"
                        + "他说这些不用记，记了也没用。\n"
                        + "你后来还是记了，记在另外一本上。" },
            ] } },
    { at: "分蘖", "人情": true, "名": "绕开他",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "米厂的老赵来了，车停在路口，人没下田，站在路上喊你。\n"
            + "「你上回那一车米，拉哪儿去了？」\n"
            + "你说拉城里了。\n"
            + "「我知道拉城里了。」他说。\n"
            + "「我是问你，怎么不先问问我。」\n"
            + "他这一句声音大了。埂那头有两个人停下来看。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "怎 么 不 先 问 问 我",
            "问": "你打算怎么办？",
            "处置": [
                { text: "当场顶回去：问了你也不加价", "费": 2, "补": {}, "好": false,
                    "旗": "人-顶了老赵", "象": { "赵": -2 },
                    "说": "「我不加价？」他笑了一声。\n"
                        + "「你去年来找我的时候，你那米是什么成色？」\n"
                        + "「三块二是我给的，不是你自己挣的。」\n"
                        + "他说完转身上车，倒出去的时候把土扬了一路。\n"
                        + "后来你听说，他跟另外两家说：那个学生的米，他不收了。\n"
                        + "你秋天还有一大半粮没出手，这句话你到时候会想起来。" },
                { text: "认个软：下回先问你", "费": 0, "补": {}, "好": false,
                    "旗": "人-认了软",
                    "说": "你说行，下回先问你。\n"
                        + "他脸色缓了，拍了拍你肩膀，说这才像话。\n"
                        + "开车走的时候还按了两下喇叭。\n"
                        + "埂那头那两个人也散了。\n"
                        + "从那以后，你每车米出手之前都得先给他打个电话。\n"
                        + "他给什么价，就是什么价。" },
                { text: "说：米是我的，卖给谁是我的事", "费": 4, "补": {}, "好": false,
                    "旗": "人-硬到底", "象": { "赵": -3 },
                    "说": "他没再笑。他下了车，走到田埂上来，站得离你很近。\n"
                        + "「是你的米。」他说。\n"
                        + "「可你这一亩地在这个村里，你的路在这个镇上。」\n"
                        + "「你想清楚。」\n"
                        + "他走了以后你在田里站了很久。\n"
                        + "你确实赢了这一句。你也确实少了一条退路 ——\n"
                        + "收粮那几天要是没人来拉，你这点米一斤也走不掉。" },
            ] } },
    { at: "孕穗", "人情": true, "名": "这块地明年",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "田主带了一个人来看地，那人围着你的田转了一圈，蹲下去抓了把土。\n"
            + "田主走过来，压低声音跟你说：这块地明年可能不租给你了。\n"
            + "「人家出一亩一千二。」\n"
            + "你说你出的是一千。\n"
            + "「是啊。」他说，「我没答应他。」\n"
            + "「可他是我表弟。」\n"
            + "那人还在田里站着，正拿手机拍你的田埂。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "他 是 我 表 弟",
            "问": "你打算怎么办？",
            "处置": [
                { text: "当场加价：我出一千二", "费": 8, "补": {}, "好": true,
                    "旗": "人-加租", "象": { "主": 2 },
                    "说": "田主看了你一眼，又看了他表弟一眼。\n"
                        + "「你一个学生，掏得起？」\n"
                        + "你说掏得起。\n"
                        + "他把表弟叫过来，说了几句。那人收手机的时候脸色不好看，\n"
                        + "临走踩坏了两棵稻子，是故意的。\n"
                        + "地保住了。可这一季的钱，你提前划出去一大块。" },
                { text: "翻脸：合同还没到期", "费": 1, "补": {}, "好": false,
                    "旗": "人-撕了租约", "象": { "主": -3 },
                    "说": "你把合同的事说了一遍，声音不小。\n"
                        + "田主没吭声。他表弟倒笑了，说：「合同？拿出来我看看。」\n"
                        + "你拿不出来 —— 那份东西你签完就没再见过。\n"
                        + "田主这才开口：「今年你照种，我不撵你。」\n"
                        + "「明年这块地，你另找吧。」\n"
                        + "他说这话的时候没看你。" },
                { text: "绕过田主，去村委会说这个事", "费": 5, "补": {}, "好": false,
                    "旗": "人-找了村里", "象": { "村": 2, "主": -3 },
                    "说": "村委会听完，说这事他们管不了，地是人家的。\n"
                        + "可他们还是给田主打了个电话。\n"
                        + "电话打完，地是保住了 —— 今年明年都还在你手里。\n"
                        + "但田主后来跟人说：这孩子有事不跟我说，跑去村里。\n"
                        + "这话传到你耳朵里的时候，已经过去一个多月了。" },
            ] } },
    { at: "成熟", "人情": true, "名": "你那个价",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "村委会来人，把你叫了去。\n"
            + "「你那一亩米，卖五块一斤。」\n"
            + "「村里现在有五户来反映，说凭什么一个学生能卖五块，他们卖三块二。」\n"
            + "「你卖你的，我们不拦。」\n"
            + "「可你天天在这村里进进出出。」\n"
            + "他把搪瓷杯往桌上一放。\n"
            + "「你说怎么办吧。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "你 说 怎 么 办 吧",
            "问": "你打算怎么办？",
            "处置": [
                { text: "说：那我明年不卖了", "费": 0, "补": {}, "好": false,
                    "旗": "人-缩了", "象": { "村": 2 },
                    "说": "他点点头，说这样最好，村里也省事。\n"
                        + "你出来的时候天还亮着，田在村口那边。\n"
                        + "你走回去，一路没想明白刚才那几句话是怎么说出口的。\n"
                        + "这一季的米你还是卖了，卖了五块。\n"
                        + "可你把一条自己踩出来的路，自己给填上了。" },
                { text: "顶回去：这是我的地，我的米", "费": 3, "补": {}, "好": false,
                    "旗": "人-顶了村里", "象": { "村": -3 },
                    "说": "「你的地？」他把杯子放下了。\n"
                        + "「地是租的，米是你种的，这话没错。」\n"
                        + "「可你要在这村里待下去。」\n"
                        + "你没再说话。你出来的时候，院里那几个人都在看你。\n"
                        + "后来你去村委会办什么事，都得等，都得排在最后。\n"
                        + "不是谁故意为难你 —— 就是没人愿意先叫你的号。" },
                { text: "提一句：要不我教他们怎么卖", "费": 6, "补": { harvest: -4 }, "好": true,
                    "旗": "人-带上村里", "象": { "村": 3 },
                    "说": "他愣了一下，问你什么意思。\n"
                        + "你说你那个价不是米好，是路子不一样 —— 装盒、认养、进城。\n"
                        + "你说要教，可以教。\n"
                        + "他想了半天，说你先拿两户试试。\n"
                        + "那两户后来真挣着钱了。\n"
                        + "代价是你自己那几天全搭在别人田里，自己这一亩的收尾，\n"
                        + "是摸黑做的。" },
            ] } },
    { at: "苗期", "人情": true, "名": "电话",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "你妈打电话来，先问吃饭没有，问了三遍。\n"
            + "绕了七八句才说到正题：今年的学费减免没批下来。\n"
            + "「你别管，我跟你爸想办法。」\n"
            + "「就是问问你 —— 你那个田，一年到底能挣多少？」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "一 年 到 底 能 挣 多 少",
            "问": "你打算怎么办？",
            "处置": [
                { text: "报实数：挣不了多少，刚够本", "费": 0, "补": {}, "好": true,
                    "旗": "家-报了实数",
                    "说": "电话那头静了几秒。\n"
                        + "「那你还种它干什么。」\n"
                        + "你说不全是为了挣钱。\n"
                        + "「我知道。」她说，「我不是那个意思。」\n"
                        + "然后她说要去给你爸做饭，就挂了。\n"
                        + "第二天你卡上多了两千块。你打回去问，她说是你爸让打的。" },
                { text: "往多了说：一年能挣小两万", "费": 0, "补": {}, "好": false,
                    "旗": "家-报了虚数",
                    "说": "她声音一下就亮起来了，说要告诉你二姨。\n"
                        + "你说别到处说。她说知道了知道了。\n"
                        + "挂了电话你算了算，一季净挣五千出头。\n"
                        + "「小两万」是你把三季、把最好的那一季、\n"
                        + "把还没到手的三产全加上，再乘了个二。\n"
                        + "这个数后来她记了很久。" },
                { text: "说：你别管我，我自己能撑", "费": 1, "补": {}, "好": false,
                    "旗": "家-顶了妈",
                    "说": "你这句话说得有点硬。\n"
                        + "她那边停了一下，说：「行，你长大了。」\n"
                        + "然后就是一些家常，说邻居家的事，说了十来分钟。\n"
                        + "挂了电话你才想起来，她一开始说的是学费的事，\n"
                        + "后来一个字都没再提。" },
            ] } },
    { at: "分蘖", "人情": true, "名": "你爸来了",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "你爸来了，没打招呼。\n"
            + "他在田埂上站了一个多钟头，一句话没说，也没问你什么。\n"
            + "你给他递水，他接了，喝一口，又还给你。\n"
            + "走的时候他说了一句：「你妈让我来看看。」\n"
            + "然后就走了。走到路口，又回头看了一眼这块田。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "你 妈 让 我 来 看 看",
            "问": "你打算怎么办？",
            "处置": [
                { text: "追上去，跟他讲这块田", "费": 4, "补": { harvest: -3 }, "好": true,
                    "旗": "家-讲了",
                    "说": "你追到路口，把他叫住，指着田一样一样讲。\n"
                        + "哪块是秧，哪块是分杈，水是从哪边进来的。\n"
                        + "他听着，不点头也不摇头。\n"
                        + "讲到一半他忽然说：「你爷爷那时候，也是这么插的。」\n"
                        + "然后他就不说了。你也没敢问。\n"
                        + "那天下午你少干了半天活，可他走的时候，是笑着走的。" },
                { text: "没追，站在原地看他走远", "费": 0, "补": {}, "好": false,
                    "旗": "家-没追",
                    "说": "你没动。\n"
                        + "他在路口站了一会儿，像是等你，又像不是。\n"
                        + "然后他拐过那棵树，就看不见了。\n"
                        + "那天晚上你给他打电话，问到家没有。\n"
                        + "他说到了。你说那就好。\n"
                        + "两边都停了一下，谁也没往下说。" },
                { text: "问他：你是不是不同意我种这个", "费": 2, "补": {}, "好": false,
                    "旗": "家-问了他",
                    "说": "他看了你半天。\n"
                        + "「我没不同意。」\n"
                        + "「我是怕你把书念废了，田也没种成。」\n"
                        + "「两头都落空。」\n"
                        + "他说完就走了，没等你回话。\n"
                        + "这句话你后来在地里干活的时候，会忽然想一遍。" },
            ] } },
    { at: "孕穗", "人情": true, "名": "饭桌上",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "放假回家，饭桌上你妈把话摊开了。\n"
            + "「你表姐今年考上了，你二姨天天在群里说。」\n"
            + "「我不是逼你。田你想种就种。」\n"
            + "「可你不能一边种田，一边把书念废了。」\n"
            + "你爸在旁边没抬头，扒了两口饭。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "两 头 都 落 空",
            "问": "你打算怎么办？",
            "处置": [
                { text: "说：书我不废，田我也不撂", "费": 4, "补": { harvest: -3 }, "好": true,
                    "旗": "家-两头都要",
                    "说": "你说这两样你都要。\n"
                        + "你妈把筷子放下了：「你现在嘴硬。」\n"
                        + "你爸这才抬头，说了句：「让他试试。」\n"
                        + "饭桌上就安静了。\n"
                        + "你妈没再说别的，起身去盛汤。回来的时候眼睛是红的。\n"
                        + "那顿饭你吃得很快。回学校那天，你起得比谁都早。" },
                { text: "说：那我退了田，专心念书", "费": 0, "补": {}, "好": false,
                    "旗": "家-退了田",
                    "说": "你妈脸色一下就松了，说这才对。\n"
                        + "你爸没说话，吃完饭就出去了。\n"
                        + "你那天晚上在屋里坐了很久。\n"
                        + "田里那一季的稻子还立在埂那边，再有二十来天就该收了。\n"
                        + "你说的是「退了」，可你没说什么时候退。" },
                { text: "反问：表姐考上了，跟我有什么关系", "费": 1, "补": {}, "好": false,
                    "旗": "家-呛了妈",
                    "说": "你妈手停在半空。\n"
                        + "「我是为你着急。」\n"
                        + "「你二姨天天在群里发，我一句话都插不上。」\n"
                        + "她把碗往里推了推，说不吃了，起身进了厨房。\n"
                        + "你爸看了你一眼，什么也没说。\n"
                        + "这顿饭剩下半桌菜。你后来还是把碗洗了。" },
            ] } },
    { at: "成熟", "人情": true, "名": "电话响了两遍",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "收粮那两天，家里来电话。\n"
            + "第一遍你没听见，田里机器响。\n"
            + "第二遍是同学A 跑过来喊你的：你妈住院了，胆结石，明天上午手术。\n"
            + "你打回去，你妈接的，说没事，说你爸在。\n"
            + "「你忙你的，家里不要紧。」\n"
            + "她说话的劲儿不太足。\n"
            + "你看了一眼天，天气预报说明天下午有雨。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "明 天 下 午 有 雨",
            "问": "你打算怎么办？",
            "处置": [
                { text: "连夜回去，田交给同学A 看着", "费": 9, "补": { harvest: -18, quality: -4 }, "好": false,
                    "旗": "家-回去了", "象": { "同": 2 },
                    "说": "你把钥匙给了同学A，把要交代的都写在纸上，坐晚上那班车走的。\n"
                        + "手术第二天上午做的，很顺。你在病房外头坐了一宿。\n"
                        + "第三天你赶回来，雨是前一天下的。\n"
                        + "田里倒了一片，同学A 说他按你写的做了，可水没来得及放。\n"
                        + "他没推责任，你也没怪他。\n"
                        + "你妈出院那天跟你说：「以后这种事，你别往回跑了。」\n"
                        + "她说这话的时候，你知道她不是那个意思。" },
                { text: "先把这两天的粮收完，收完就走", "费": 2, "补": { harvest: 6, quality: -3 }, "好": false,
                    "旗": "家-先收了粮",
                    "说": "你把机器留住了，两天两夜没怎么睡。\n"
                        + "粮进仓那天下午雨就下来了，一粒没淋着。\n"
                        + "手术是第二天上午，你到的时候，人已经推出来了。\n"
                        + "你妈醒过来第一句话是问你：「田收完了？」\n"
                        + "你说收完了。\n"
                        + "她嗯了一声，脸朝里睡了。\n"
                        + "这几天你没敢跟你爸对视。" },
                { text: "打电话让家里先说，你收完粮再定", "费": 1, "补": { harvest: 3 }, "好": false,
                    "旗": "家-没定",
                    "说": "你跟你爸说，这边粮还在地里，问能不能缓一天。\n"
                        + "你爸说行，你去忙。\n"
                        + "他没有说别的，也没有催。\n"
                        + "粮是收完了。你第二天下午赶到的，手术已经做完了。\n"
                        + "你爸在走廊里抽了半包烟，看见你只说了句「来了」。\n"
                        + "你妈到出院都没问你那两天在干什么。\n"
                        + "这话头后来一直没起过。" },
            ] } },
];

ctx.romanceTracks = [
    { at: "苗期", "感情": true, "名": "云台没带",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "同学B扛着云台来了，往埂上一架。\n"
            + "「大老远跑过来，你就这一亩。」\n"
            + "你说一亩够种了。\n"
            + "「够种。」同学B念了一遍，像在笑这个词。\n"
            + "镜头对着田，半天没动。",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "镜 头 对 着 田",
            "问": "你打算怎么办？",
            "处置": [
                { text: "把活撂下，陪着坐", "费": 3, "补": { harvest: -3 }, "好": true,
                    "旗": "感-坐下了", "象": { "乙": 3 },
                    "说": "你把锄头插在埂上，坐下来。\n"
                        + "「谁让你坐的。我又不拍你。」\n"
                        + "镜头挪了挪，把你也框进去。\n"
                        + "同学B开口：\n"
                        + "「你这田，长得挺一般的。」\n"
                        + "「……我今天其实没事，就是不想回宿舍。」" },
                { text: "说：那你拍你的，我把这片打完", "费": 0, "补": { harvest: 2 }, "好": false,
                    "旗": "感-没坐", "象": { "乙": -1 },
                    "说": "你说你自己拍，我打完这片。\n"
                        + "「谁稀得拍你。」\n"
                        + "你一趟趟从埂边过，镜头跟着转。\n"
                        + "同学B坐到天擦黑才走，一句没催。\n"
                        + "有人问推送里那是谁。\n"
                        + "回复就三个字：「一个外行。」" },
                { text: "问一句：你今天是不是有事", "费": 1, "补": {}, "好": true,
                    "旗": "感-问了", "象": { "乙": 2 },
                    "说": "你问：你今天是不是有事。\n"
                        + "「你烦不烦。」镜头盖扣上了。\n"
                        + "「……我妈打电话问我毕业干什么。」\n"
                        + "「我说我不知道。」\n"
                        + "「行了，你别那副表情。」\n"
                        + "走出十几步又回来拎三脚架。" },
            ] } },
    { at: "分蘖", "感情": true, "名": "我最近也挺烦的",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "半夜同学B发消息。\n"
            + "「你那本子记完了没有。」\n"
            + "你说没有。\n"
            + "「记那个有什么用。」\n"
            + "过了一会儿又来一条：「算了，当我没说。」\n"
            + "然后是第三条，只有四个字：\n"
            + "「我挺烦的。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "我 挺 烦 的",
            "问": "你打算怎么办？",
            "处置": [
                { text: "打过去，不聊田", "费": 4, "补": { harvest: -4 }, "好": true,
                    "旗": "感-打过去了", "象": { "乙": 3 },
                    "说": "你拨了电话。接得很快。\n"
                        + "「大半夜的，有病啊。」\n"
                        + "你说你有事就说。「没事。」\n"
                        + "同学B说方案卡了两个月，写不出来。\n"
                        + "「我跟谁都没说。你听了也没用。」\n"
                        + "「……算了，睡了。」" },
                { text: "回一句：怎么了", "费": 0, "补": {}, "好": false,
                    "旗": "感-只回了一句", "象": { "乙": -1 },
                    "说": "你回了两个字：怎么了。\n"
                        + "正在输入亮了很久：\n"
                        + "「没事，发错了。」\n"
                        + "第二天同学B先开口：「昨晚那几条你别多想。」\n"
                        + "你说没多想。「那就好。」\n"
                        + "再往后，同学B夜里发消息就少了。" },
                { text: "把话岔到田上：正好，我问你个事", "费": 1, "补": {}, "好": false,
                    "旗": "感-岔开了", "象": { "乙": -2 },
                    "说": "你问一箱多少运费。\n"
                        + "同学B回得很快，全是干货。\n"
                        + "「还有没有别的事。」\n"
                        + "你说没有了。\n"
                        + "「那睡了。」\n"
                        + "过了一分钟又来一条：「你这种人真是。」\n"
                        + "后来想起来，那天本来是另一件事。" },
            ] } },
    { at: "孕穗", "感情": true, "名": "那一页写的是你",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "同学B发来方案，说写完了。\n"
            + "翻到中间，有一整页写的是你。\n"
            + "不是写田，是你。\n"
            + "「我们大一上过同一节课。」\n"
            + "你不记得同学B也坐在里头。\n"
            + "「不想留，我删掉。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "那 一 页 写 的 是 你",
            "问": "你打算怎么办？",
            "处置": [
                { text: "说：留着吧", "费": 2, "补": {}, "好": true,
                    "旗": "感-留了", "象": { "乙": 3 },
                    "说": "你回：留着吧。\n"
                        + "过了很久来一个字：\n"
                        + "「哦。」\n"
                        + "那一页后来一个字没改。\n"
                        + "过了些日子你寄了一小袋新米过去。\n"
                        + "同学B回：「这个就是大白米饭。」\n"
                        + "再往后见面，说话反倒少了一点。" },
                { text: "说：删了，那不是材料", "费": 0, "补": {}, "好": false,
                    "旗": "感-删了", "象": { "乙": -1 },
                    "说": "你回：删了吧，那不算材料。\n"
                        + "「行。」回得很快。\n"
                        + "「我早说了让你别当真。」\n"
                        + "两分钟后又来一条：「删完了。」\n"
                        + "然后接着说包装的事。\n"
                        + "后来你半夜想起那一页，\n"
                        + "想不起上面写了什么。" },
                { text: "问一句：你写这个干什么", "费": 1, "补": { harvest: -2 }, "好": false,
                    "旗": "感-问破了", "象": { "乙": 1 },
                    "说": "你问：你写这个干什么。\n"
                        + "「这方案里得有个人。不然就是卖米的方案。」\n"
                        + "「我有什么好写的，我又没种地。」\n"
                        + "「我就是在旁边看着。看着的不算数。」\n"
                        + "那天正事说得很慢。" },
            ] } },
    { at: "成熟", "感情": true, "名": "别不吭声就走",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        line: "收完粮那天晚上，同学B又来了，还坐那道埂上。\n"
            + "「我不是来问你的。」\n"
            + "「你明年要是不种了，跟我说一声。」\n"
            + "「别到时候人没了，我还在这儿等着拍。」\n"
            + "「……我就是嫌白跑。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "别 不 吭 声 就 走",
            "问": "你打算怎么办？",
            "处置": [
                { text: "说：一定跟你说", "费": 1, "补": {}, "好": true,
                    "旗": "感-应了", "象": { "乙": 3 },
                    "说": "你说一定说。\n"
                        + "「哦。」\n"
                        + "嗯了一声就又坐下了，像是本来就该这样。\n"
                        + "后来同学B先站起来，走之前把你的塑料布压了一遍。\n"
                        + "「那行。」\n"
                        + "「一定说」这三个字从那天起就欠着了。" },
                { text: "反问：你明年还在不在", "费": 1, "补": {}, "好": false,
                    "旗": "感-反问了", "象": { "乙": 1 },
                    "说": "你反问：你明年还在不在。\n"
                        + "「你这人。」同学B笑了一声。\n"
                        + "「我问你，你怎么问起我来了。」\n"
                        + "你说你先答。\n"
                        + "「不答。」\n"
                        + "走到路口回头说了句什么，风把话吹散了。\n"
                        + "你没追上去问。" },
                { text: "不接这句，坐着", "费": 0, "补": {}, "好": false,
                    "旗": "感-没接", "象": { "乙": -1 },
                    "说": "你没说话。\n"
                        + "同学B也没催，就那么坐着。\n"
                        + "坐到露水下来了。\n"
                        + "「行。」同学B站起来，「当我没说。」\n"
                        + "「反正也没指望你答。」\n"
                        + "走了，走得比平时快。\n"
                        + "那句话就搁在埂上，谁也没再捡。" },
            ] } },
    { at: "成熟", "感情": true, "近": true, "名": "剪出来那段",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        "门": (s?: any) => (s["印象"]["乙"] || 0) >= 6,
        line: "同学B发来链接：剪完了。\n"
            + "「我剪了五版，这是最好的一版。」\n"
            + "你看到一半：镜头里的自己比你想的多。\n"
            + "有个镜头是你蹲在埂上系鞋带，十几秒。\n"
            + "「有问题你说，我改。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "系 鞋 带 那 十 几 秒",
            "问": "你打算怎么办？",
            "处置": [
                { text: "回：这段留着吧", "费": 2, "补": {}, "好": true,
                    "旗": "感-要了那一段", "象": { "乙": 3 },
                    "说": "你回：留着吧，挺好的。\n"
                        + "「有毛病吧。那一段什么都没有。」\n"
                        + "你说就是要那一段。\n"
                        + "那边很久没回。\n"
                        + "第二天片尾多了一行小字：\n"
                        + "「拍于京西，某年谷雨。」\n"
                        + "你存下来才发现看了三遍。" },
                { text: "回：那一段删了吧，跟我没关系", "费": 0, "补": {}, "好": false,
                    "旗": "感-让他删", "象": { "乙": -1 },
                    "说": "你回：那一段删了吧，跟我没关系。\n"
                        + "「本来就没关系。」\n"
                        + "过一会儿链接更新了一次。\n"
                        + "系鞋带那一段没了，换成稻穗的空镜。\n"
                        + "后来同学B问怎么样。你说挺好。\n"
                        + "「嗯。我早就想删了。」" },
                { text: "问：你留这个干嘛", "费": 1, "补": { harvest: -2 }, "好": true,
                    "旗": "感-问他为什么留", "象": { "乙": 2 },
                    "说": "你问：那一段留着干嘛。\n"
                        + "「总得有点人味儿。全是稻子，谁看。」\n"
                        + "「……你那天系鞋带半天，笨死了。」\n"
                        + "第二天那一段还在。\n"
                        + "底下有人说这镜头好。\n"
                        + "同学B截图发给你，没配字。" },
            ] } },
    { at: "成熟", "感情": true, "近": true, "名": "开春那张表",
        p: 0, mood: "", effect: {},
        "需": (s?: any) => true,
        "门": (s?: any) => (s["印象"]["乙"] || 0) >= 10,
        line: "田翻过了，渠清了，埂也修了。\n"
            + "同学B来的时候你在仓房里理袋子。\n"
            + "「路过。」\n"
            + "同学B没进来，站门口看墙上那张节气表。\n"
            + "「明年还贴吗。」\n"
            + "问完又补一句：「随便问问。」",
        "诊": { "岔": true, "成": 0, "步": [], "名": null,
            "题": "明 年 还 贴 吗",
            "问": "你打算怎么办？",
            "处置": [
                { text: "说：贴。你要是不来，我自己贴", "费": 2, "补": {}, "好": true,
                    "旗": "感-说还贴", "象": { "乙": 3 },
                    "说": "你说贴。\n"
                        + "「哦。」\n"
                        + "你把袋子码到墙角，回头的时候同学B还站在门口。\n"
                        + "「那明年这个片子还有得拍。」\n"
                        + "走出两步又回头：「你那袋子码反了。」\n"
                        + "你没码错。你就让它那么放着。" },
                { text: "说：你明年来看一眼不就知道了", "费": 2, "补": {}, "好": true,
                    "旗": "感-让他自己来看", "象": { "乙": 3 },
                    "说": "你说：明年来看一眼不就知道了。\n"
                        + "「谁要来看。我拍完了。」\n"
                        + "说完没走，进来帮你码袋子。\n"
                        + "「表卷了，粘一下。」\n"
                        + "第二天你粘了，背面有一行铅笔小字。\n"
                        + "开机那天的日期。你的字。" },
                { text: "反问：你明年走不走", "费": 1, "补": {}, "好": false,
                    "旗": "感-问走不走", "象": { "乙": 1 },
                    "说": "你问：你明年走不走。\n"
                        + "「问这个干嘛。你又不是我什么人。」\n"
                        + "「你问这个有什么用，你又不来送我。」\n"
                        + "说完愣了一下，说算了，我走了。\n"
                        + "那张节气表你后来没粘，就那么卷着。" },
            ] } },
];

ctx.randomPool.push(...ctx.semesterClock, ...ctx.classmateTrack, ...ctx.relationshipTracks, ...ctx.romanceTracks);

ctx.marketPool = [
    { "名": "行情平", "色": "", "级": "R", "签": "中", "重": 4, "原粮": 1.00, "礼盒": 1.00,
        "说": "粮站门口的价牌跟去年一个数，没动。",
        "报": "老陈说：今年没啥说的，就这个价。" },
    { "名": "粮价好", "色": "a", "级": "SR", "签": "上", "重": 2, "原粮": 1.18, "礼盒": 1.05,
        "说": "南边遭了灾，北边的稻谷一下成了紧俏货。",
        "报": "老陈的车还没停稳就喊：今年的价，你猜不着。",
        line: "粮价上来了。南边减产，收粮的都往北边跑。你的谷子比往年值钱。" },
    { "名": "粮价跌", "色": "d", "级": "SR", "签": "下", "重": 2, "原粮": 0.80, "礼盒": 0.92,
        "说": "粮库的仓满了，收粮的挑挑拣拣，还压价。",
        "报": "老陈搓着手：今年不好干，我也不敢多收。",
        line: "粮价跌了。老陈说不是他压价，是粮库那边满了，他收回去也压手里。" },
    { "名": "礼盒走俏", "色": "a", "级": "SSR", "签": "上上", "重": 1, "原粮": 0.96, "礼盒": 1.60,
        "说": "今年不知道怎么了，问礼盒的人一个接一个。",
        "报": "老陈说：你要是有米，我帮你问问，今年这东西抢手。",
        line: "礼盒今年特别走俏，单位发、走亲戚、送人，问的人一个接一个。你有多少，人家要多少。" },
    { "名": "送礼风紧", "色": "d", "级": "SSR", "签": "下下", "重": 1, "原粮": 1.04, "礼盒": 0.45,
        "说": "上头下了文，今年过节不让送礼盒了。",
        "报": "老陈指了指车里：看见没，去年订的盒子，全退回来了。",
        line: "礼盒走不动了。文件一发，单位不敢订，走亲戚也不敢提。做好的盒子堆在库里，人家宁可要散的。" },
];

ctx.signboard = (gameEcology?: any) => ctx.clamp(gameEcology / ctx.NUM["牌子基数"], ctx.NUM["牌子下限"], ctx.NUM["牌子上限"]);

ctx.prestigeTable = { "特级": 8, "一级": 5, "二级": 2, "等外": -2 };

ctx.reputationLabels = (prestige?: any) => 1 + 0.30 * (prestige || 0) / ((prestige || 0) + 200);

ctx.impressionLimit = 24;

ctx.cookingSkillLimit = 9;

ctx.assertPersonalEvents = [
    { "认": /跟你一块儿买的|买药那家店的记录/,
        "要": (old?: any) => !!(old["打药"] || old["除草剂"]) },
    { "认": /上个月从农资店买的那袋药|你打到第三遍/,
        "要": (old?: any) => !!old["打药"] },
    { "认": /你前两回打的那个/,
        "要": (old?: any) => !!old["打药"] },
    { "认": /不打药、留草的种法|打没打药、留没留草/,
        "要": (old?: any) => !(old["打药"] || old["除草剂"]) },
    { "认": /那两条袋子装过五十斤尿素/,
        "要": (old?: any) => !!old["多氮"] },
];

ctx.eventEndpoint = (ctx.location.protocol === "file:" ? "http://localhost:8787" : "") + "/api/生事";

ctx.preparedPeople = null;

ctx.archiveStorageKey = "yimudao.档.v1";

ctx.memorySave = {};

ctx.unlock = (state?: any, k?: any) => {
    const gameName: any = Array.isArray(k) ? k : [k];
    const gameGain: any = [];
    for (const x of gameName) {
        if (x && ctx.CODEX[x] && !state.codex[x]) {
            state.codex[x] = true;
            (state["本季认得"] || (state["本季认得"] = {}))[x] = true;
            gameGain.push(x);
        }
    }
    if (gameGain.length)
        ctx.saveArchive({ "认得": { ...state.codex } });
    return gameGain;
};

ctx.teasingLines = [
    ["「你还大学生呢。」他说。\n「这玩意儿我十岁就认得了。」",
        "「你们学校教不教这个？」他问。你说不教。他说：「那我教你。」",
        "「拿本子记了没有？」你说记了。「记了还问。」"],
    ["「你上学学了什么，」他说。\n「咋什么都不会。」",
        "「你这书念的。」他把叶子还给你。\n「念半天，草和稻还分不清。」",
        "「你老师要是知道你天天往我这儿跑，」他说。\n「他收不收你学费？」"],
    ["他看了你半天，说：「你这孩子。」就没下文了。",
        "「你这是把我当书查呢。」他说完自己笑了，「行，查吧。」",
        "「你再这么问下去，」他说。\n「村里该以为我收你钱了。」"],
];
}
