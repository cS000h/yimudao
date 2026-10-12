/** 页面流程与可选在线内容。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// 推演钳位：保留原玩法的计算或流程。
ctx.推演钳位 = function (影响?: any) {
    const 出: any = {};
    let 总: any = 0;
    for (const k of ctx.推演可改) {
        const n: any = Number((影响 || {})[k]);
        if (!Number.isFinite(n) || n === 0)
            continue;
        const 压: any = Math.max(-ctx.推演单键, Math.min(ctx.推演单键, n));
        出[k] = 压;
        总 += Math.abs(压);
    }
    if (总 > ctx.推演总量) {
        const 比: any = ctx.推演总量 / 总;
        for (const k in 出)
            出[k] = +(出[k] * 比).toFixed(2);
    }
    return 出;
};

// 推演场景：保留原玩法的计算或流程。
ctx.推演场景 = function (下一个?: any) {
    const i: any = Math.min(下一个 === undefined ? ctx.S.termIndex + 1 : 下一个, ctx.S.节气.length - 1);
    const d: any = ctx.S.节气[i];
    const 响过: any = (ctx.S.log || []).slice(-3)
        .map((e?: any) => String(e.line || e.看见 || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
    return {
        节气: d ? d.term : "", 阶段: d ? d.阶段 : "",
        年景: ctx.S.年景 ? ctx.S.年景.名 : "",
        已选: (ctx.S.选择 || []).map((c?: any) => {
            const dd: any = ctx.DECISIONS[c.序];
            const o: any = dd && dd.options[c.下标];
            return { term: c.term, text: c.text, flags: (o && o.flags) || [] };
        }),
        田情: { harvest: Math.round(ctx.S.stats.harvest), quality: Math.round(ctx.S.stats.quality),
            ecology: Math.round(ctx.S.stats.ecology) },
        已响过: 响过,
    };
};

// 推演预取：保留原玩法的计算或流程。
ctx.推演预取 = function () {
    if (!ctx.S || !ctx.S.节气)
        return;
    const 场: any = ctx.推演场景();
    const 键: any = 场.节气 + "|" + 场.已选.map((c?: any) => c.term + c.text).join(">");
    ctx.推演 = { 结: null, 键: 键, 等: true, 占位: null };
    const 停: any = new ctx.AbortController();
    const 闹: any = ctx.setTimeout(() => 停.abort(), 9000);
    ctx.fetch(ctx.推演址, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 场景: 场 }), signal: 停.signal })
        .then((r?: any) => r.json())
        .then((j?: any) => {
        ctx.clearTimeout(闹);
        if (ctx.推演.键 !== 键)
            return;
        ctx.推演.结 = j;
        ctx.推演.等 = false;
        const 坑: any = ctx.推演.占位 ? ctx.pendingEvents.indexOf(ctx.推演.占位) : -1;
        ctx.推演.占位 = null;
        if (坑 < 0)
            return;
        if (j && j.有)
            ctx.推演落地(j, 坑);
        else {
            ctx.pendingEvents.splice(坑, 1);
            if (!ctx.pendingEvents.length) {
                ctx.事件位 = 0;
                ctx.toDecision();
                return;
            }
            if (ctx.事件位 >= ctx.pendingEvents.length)
                ctx.事件位 = ctx.pendingEvents.length - 1;
        }
        ctx.render();
    })
        .catch(() => {
        ctx.clearTimeout(闹);
        if (ctx.推演.键 !== 键)
            return;
        ctx.推演.等 = false;
        ctx.推演.结 = { 有: false };
        const 坑: any = ctx.推演.占位 ? ctx.pendingEvents.indexOf(ctx.推演.占位) : -1;
        ctx.推演.占位 = null;
        if (坑 < 0)
            return;
        ctx.pendingEvents.splice(坑, 1);
        if (!ctx.pendingEvents.length) {
            ctx.事件位 = 0;
            ctx.toDecision();
            return;
        }
        if (ctx.事件位 >= ctx.pendingEvents.length)
            ctx.事件位 = ctx.pendingEvents.length - 1;
        ctx.render();
    });
};

// 推演落地：保留原玩法的计算或流程。
ctx.推演落地 = function (演?: any, 坑?: any) {
    const 前: any = { ...ctx.S.stats };
    const delta: any = ctx.applyEffect(ctx.S, ctx.推演钳位(演.影响));
    const 条: any = { 推演: true, 演: 演, mood: "", delta: delta,
        line: 演.看见, 看见: 演.看见, from: null, 查: null,
        前: 前, 后: { ...ctx.S.stats } };
    ctx.S.log.push(条);
    if (坑 >= 0 && ctx.pendingEvents[坑])
        ctx.pendingEvents[坑] = 条;
    else
        ctx.pendingEvents.push(条);
    for (const k in delta)
        if (delta[k])
            ctx.flash[k] = delta[k];
    return 条;
};

// nextTerm：保留原玩法的计算或流程。
ctx.nextTerm = function () {
    ctx.pendingEvents = ctx.dueEvents(ctx.S, ctx.S.termIndex);
    ctx.事件位 = 0;
    ctx.flash = {};
    ctx.pendingEvents.forEach((e?: any) => { for (const k in e.delta)
        if (e.delta[k])
            ctx.flash[k] = e.delta[k]; });
    if (ctx.推演.等) {
        const 占: any = { 推演: "等", mood: "", delta: {}, line: "", from: null, 查: null };
        ctx.推演.占位 = 占;
        ctx.pendingEvents.push(占);
    }
    else if (ctx.推演.结 && ctx.推演.结.有) {
        ctx.推演落地(ctx.推演.结, -1);
        ctx.推演.结 = null;
    }
    ctx.screen = ctx.pendingEvents.length ? "event" : "decision";
    ctx.render();
    ctx.扫成就(null);
};

// 选到底：保留原玩法的计算或流程。
ctx.选到底 = function (S?: any, c?: any, i?: any, 子?: any) {
    const 层: any = 子 || [];
    let 当: any = c.options[i];
    for (let k: any = 0; 当 && k < 8; k++) {
        if (当.设)
            当.设(S);
        if (当.续) {
            当 = 当.续[层[k] || 0];
            continue;
        }
        if (typeof 当.pick !== "function")
            throw new Error("选到底：这条路上没有 pick —— " + (当 && 当.text));
        当.pick(S);
        return 当;
    }
    throw new Error("选到底：续 套得太深，绕不出来（第 " + i + " 条）");
};

// 三产场景：保留原玩法的计算或流程。
ctx.三产场景 = function (c?: any) {
    const 链: any = ctx.当前链(), 位: any = ctx.S.chainIndex || 0;
    const 已选: any = [];
    for (const p of 链.slice(0, 位))
        for (const t of (p.选过 || []))
            已选.push({ term: p.term, text: t });
    const g: any = ctx.miban && ctx.miban.grade;
    const 取值: any = (v?: any) => { try {
        return typeof v === "function" ? v(ctx.S) : v;
    }
    catch {
        return "";
    } };
    return {
        环节: "三产",
        节气: c.term, 题: c.title,
        年景: ctx.S.年景 ? ctx.S.年景.名 : "",
        行情名: ctx.S.行情 ? ctx.S.行情.名 : "",
        本屏: (c.选过 || []).slice(),
        已选: 已选,
        市情: { 名望: Math.round(ctx.S.名望 || 0), 现金: Math.round(ctx.S.现金 || 0),
            等级: g ? g.名 : "" },
        已响过: [c.say, ...(c.后应录 || [])].map(取值)
            .filter((x?: any) => typeof x === "string" && x.trim()),
    };
};

// 三产要去：保留原玩法的计算或流程。
ctx.三产要去 = function (场?: any) {
    const 停: any = new ctx.AbortController();
    const 闹: any = ctx.setTimeout(() => 停.abort(), 9000);
    return ctx.fetch(ctx.推演址, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 场景: 场 }), signal: 停.signal })
        .then((r?: any) => r.json()).finally(() => ctx.clearTimeout(闹));
};

// 三产在等：保留原玩法的计算或流程。
ctx.三产在等 = function (c?: any) { return c.推演页 && c.推演页.状态 === "等"; };

// 三产推演屏：保留原玩法的计算或流程。
ctx.三产推演屏 = function (c?: any) {
    const 链: any = ctx.当前链(), 步: any = ctx.S.chainIndex || 0;
    const 年: any = ctx.链名 === "年话";
    const 页: any = c.推演页 || {};
    const 头: any = `${ctx.hud()}
    <div class="step">${年 ? "转过年来" : ctx.esc(c.term) + " · 收完之后"} 第 ${步 + 1} / ${链.length} 步</div>
    <h2 class="term cmp">${ctx.esc(c.term)}<small>${年 ? "转 过 年 来" : "收 完 之 后"}</small></h2>`;
    if (页.状态 === "等") {
        return `${头}<div class="spacer"></div>
      <div class="tuiyan"><span class="ty-tag">账 本 上 没 有 这 一 页</span>
        <p class="ty-wait"><i>把 这 一 屏 的 账 再 过 一 遍 ……</i></p>
      </div><div class="spacer"></div>
      <button class="go" onclick="三产屏完()">等 不 及 了</button>`;
    }
    const 演: any = 页.结 || {};
    const 依据: any = (演.依据 || []).map((x?: any) => `<li><b>${ctx.esc(x.id)}</b><br>${ctx.esc(x.摘)}</li>`).join("");
    return `${头}<div class="spacer"></div>
    <div class="tuiyan">
      <span class="ty-tag">账 本 上 没 有 这 一 页</span>
      <p class="ty-see">${ctx.重(演.看见 || "")}</p>
      ${演.推演 ? `<p class="ty-why">${ctx.重(演.推演)}</p>` : ""}
      ${演.显形 ? `<span class="ty-when">这笔账要到 <b>${ctx.esc(演.显形)}</b> 才算得清</span>` : ""}
      ${依据 ? `<details class="ty-src"><summary>它凭这几条推的（${演.依据.length} 条）</summary><ul>${依据}</ul></details>` : ""}
    </div><div class="spacer"></div>
    <button class="go" onclick="三产屏完()">接 着 走</button>`;
};

// 条件菜单：保留原玩法的计算或流程。
ctx.条件菜单 = function (S?: any) {
    const 米: any = S.grain || 0, 卖了: any = S.soldGrain || 0;
    const 价: any = ctx.miban && ctx.miban.grade ? ctx.miban.grade.价 : 0;
    const 钱: any = Math.round(S.现金 || 0), 望: any = Math.round(S.名望 || 0);
    const p: any = S.牌 || {};
    return [
        { 名: "米还没卖完", 真: 米 > 0 && 卖了 < 米 },
        { 名: "已经卖光了", 真: 米 > 0 && 卖了 >= 米 },
        { 名: "有自碾设备", 真: !!S.自碾 },
        { 名: "没买设备", 真: !S.自碾 },
        { 名: "米到一级", 真: 价 >= 15 },
        { 名: "生态够认养", 真: S.stats.ecology >= ctx.NUM.三产门槛 },
        { 名: "名望进得了门", 真: 望 >= ctx.望线.生人.线 },
        { 名: "名望够招牌", 真: 望 >= ctx.望线.招牌.线 },
        { 名: "手里有现钱", 真: 钱 >= 800 },
        { 名: "走了礼盒", 真: S.channel === "礼盒" || S.channel === "混合" },
        { 名: "走了酒厂", 真: S.channel === "深加工" || S.channel === "混合" },
        { 名: "走了直销", 真: S.channel === "直销" },
        { 名: "今年认养或研学", 真: S.third === "认养" || S.third === "研学" },
        { 名: "盒子上印了名字", 真: !!p["印了自家名字"] },
        { 名: "印过盒子", 真: !!p["印了盒子"] },
        { 名: "盒子是牛皮纸的", 真: !!p["盒子是牛皮纸的"] },
        { 名: "盒里塞过手写条", 真: !!p["盒子里塞了手写的条"] },
        { 名: "跟酒厂打过交道", 真: !!(p["赊了酒厂的账"] || p["跟酒厂说定了长期"]) },
        { 名: "酒瓶上写过京西稻", 真: !!p["瓶子上写了京西稻"] },
        { 名: "接了认养", 真: !!p["接了认养"] },
        { 名: "认养的人来过田", 真: !!p["认养的人来看过田"] },
        { 名: "接了研学", 真: !!p["接了研学"] },
        { 名: "学校那边留了话", 真: !!p["学校那边留了话"] },
        { 名: "供上了饭馆", 真: !!p["供上了饭馆"] },
        { 名: "摆过摊", 真: !!p["摆了摊"] },
        { 名: "跑过馆子", 真: !!p["跑过馆子"] },
        { 名: "留了明年的种", 真: !!p["留了明年的种"] },
        { 名: "挑过碎米", 真: !!p["把碎米挑出去了"] },
        { 名: "稻桩留到了冬天", 真: !!p["稻桩留到了冬天"] },
        { 名: "田埂上留了草籽", 真: !!p["田埂上留了草籽"] },
    ];
};

// 补牌小字：保留原玩法的计算或流程。
ctx.补牌小字 = function (效果?: any, 钱?: any) {
    const 段: any = [];
    if (效果.quality)
        段.push("米 " + (效果.quality > 0 ? "+" : "−") + " " + Math.abs(效果.quality) + " 分");
    if (效果.ecology)
        段.push("田 " + (效果.ecology > 0 ? "+" : "−") + " " + Math.abs(效果.ecology) + " 分");
    if (钱)
        段.push((钱 > 0 ? "+" : "−") + " " + ctx.yuan(Math.abs(钱)) + " 元");
    return 段.length ? 段.join(" · ") : "不落账，只落个说法";
};

// 落定：保留原玩法的计算或流程。
ctx.落定 = function (st?: any, 效果?: any, 钱?: any, 旗?: any, 到额外?: any, 说明?: any) {
    if (Object.keys(效果).length)
        ctx.applyEffect(st, 效果);
    if (钱) {
        if (到额外) {
            st.额外 = (st.额外 || 0) + 钱;
            if (说明)
                st.大寒说明 = 说明;
        }
        else
            st.现金 = Math.max(0, Math.round((st.现金 || 0) + 钱));
    }
    for (const f of 旗)
        (st.牌 = st.牌 || {})[f] = true;
};

// 屏义务：保留原玩法的计算或流程。
ctx.屏义务 = function (c?: any, 原选项?: any) {
    const 表: any = () => new Map(原选项.filter((o?: any) => o && !o.回)
        .map((o?: any) => [String(o.text || ""), o]));
    if (!c.续层) {
        if (c.承式 === "续")
            return { 挑: (原?: any) => {
                    const 底: any = 表().get(String((原 && 原.承) || "").trim());
                    if (!底)
                        return null;
                    if (底.锁 === true || (typeof 底.锁 === "function" && 底.锁(ctx.S)))
                        return null;
                    return { 续: 底.续 || null, 续题: 底.续题, 续简: 底.续简 };
                } };
        if (c.承式 === "pick")
            return { 挑: (原?: any) => {
                    const 底: any = 表().get(String((原 && 原.承) || "").trim());
                    if (!底)
                        return null;
                    if (底.锁 === true || (typeof 底.锁 === "function" && 底.锁(ctx.S)))
                        return null;
                    return { pick: typeof 底.pick === "function" ? 底.pick : null };
                } };
        if (c.自落)
            return { 挑: (原?: any) => (原 && !原.承) ? {} : null };
    }
    const 义务: any = ctx.层义务(原选项);
    if (!义务)
        return null;
    return { 挑: () => 义务 };
};

// 层义务：保留原玩法的计算或流程。
ctx.层义务 = function (层?: any) {
    const 真: any = 层.filter((o?: any) => o && !o.回);
    if (!真.length)
        return null;
    const 一: any = 真[0];
    for (const o of 真) {
        if (o.pick !== 一.pick)
            return null;
        if (o.续 !== 一.续)
            return null;
    }
    return { pick: typeof 一.pick === "function" ? 一.pick : null, 续: 一.续 || null };
};

// 造选项：保留原玩法的计算或流程。
ctx.造选项 = function (原?: any, S?: any, 义务?: any, 本层?: any, 屏?: any) {
    const 文字: any = String((原 && 原.文字) || "").trim();
    if (!文字)
        return null;
    const 效果: any = {};
    for (const k of ["quality", "ecology"]) {
        const v: any = Math.round(Number((原.效果 || {})[k]));
        if (Number.isFinite(v) && v)
            效果[k] = Math.max(-8, Math.min(8, v));
    }
    let 钱: any = Math.round(Number(原.钱));
    if (!Number.isFinite(钱))
        钱 = 0;
    钱 = Math.max(-3000, Math.min(3000, 钱));
    const 旗: any = (Array.isArray(原.旗) ? 原.旗 : []).filter((x?: any) => ctx.牌表.has(x));
    const o: any = {
        text: 文字,
        sub: () => ctx.补牌小字(效果, 钱),
        生成: true,
        设: (st?: any) => {
            const i: any = 本层 ? 本层.indexOf(o) : -1;
            if (i >= 0)
                本层.splice(i, 1);
            ctx.落定(st, 效果, 钱, 旗, !!(屏 && 屏.钱落额外), o.text);
        },
        pick: (st?: any) => { if (义务 && 义务.pick)
            义务.pick(st); ctx.记账(o); },
    };
    if (义务 && 义务.续)
        o.续 = 义务.续;
    if (义务 && 义务.续题 !== undefined)
        o.续题 = 义务.续题;
    if (义务 && 义务.续简 !== undefined)
        o.续简 = 义务.续简;
    return o;
};

// 记账：保留原玩法的计算或流程。
ctx.记账 = function (o?: any) {
    if (!o || !o.记)
        return;
    try {
        ctx.fetch(ctx.日志址, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: o.记, 选了: o.text, 第几步: o.第几步, 屏: o.屏 }) })
            .catch(() => { });
    }
    catch { }
};

// 组牌场景：保留原玩法的计算或流程。
ctx.组牌场景 = function (c?: any) {
    const 链: any = ctx.当前链(), 位: any = ctx.S.chainIndex || 0;
    const 取值: any = (v?: any) => { try {
        return typeof v === "function" ? v(ctx.S) : v;
    }
    catch {
        return "";
    } };
    const 已选: any = [];
    const 到: any = c.续层 ? 位 + 1 : 位;
    for (const p of 链.slice(0, 到))
        for (const t of (p.选过 || []))
            已选.push({ term: p.term, text: t });
    const g: any = ctx.miban && ctx.miban.grade;
    if (!ctx.S.组牌局号)
        ctx.S.组牌局号 = Math.random().toString(36).slice(2, 10);
    return {
        环节: "三产", 节气: c.term, 题: c.title,
        局号: ctx.S.组牌局号,
        第几步: 位, 整条链: 链.map((x?: any) => x.term),
        年景: ctx.S.年景 ? ctx.S.年景.名 : "", 行情名: ctx.S.行情 ? ctx.S.行情.名 : "",
        田情: { harvest: Math.round(ctx.S.stats.harvest), quality: Math.round(ctx.S.stats.quality),
            ecology: Math.round(ctx.S.stats.ecology) },
        现金: Math.round(ctx.S.现金 || 0), 名望: Math.round(ctx.S.名望 || 0),
        等级: g ? g.名 : "",
        已选: 已选,
        本屏作者选项: c.options.map((o?: any) => ({ 文字: 取值(o.text), 小字: 取值(o.sub),
            效果: 取值(o.effect) })).filter((x?: any) => x.文字),
        已用过: (ctx.S.组牌用过 || []).slice(-14),
        条件菜单: ctx.条件菜单(ctx.S),
        承表: c.承式 ? c.options.filter((o?: any) => !o.回 && 取值(o.text)).map((o?: any) => 取值(o.text)) : null,
        旗表: Array.from(ctx.牌表),
        要几张: ctx.一屏几张,
        说: 取值(c.say), 引: 取值(c.brief),
    };
};

// 组牌要去：保留原玩法的计算或流程。
ctx.组牌要去 = function (场?: any) {
    const 停: any = new ctx.AbortController();
    const 闹: any = ctx.setTimeout(() => 停.abort(), 9000);
    return ctx.fetch(ctx.组牌址, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 场景: 场 }), signal: 停.signal })
        .then((r?: any) => r.json()).finally(() => ctx.clearTimeout(闹));
};

// 补上牌：保留原玩法的计算或流程。
ctx.补上牌 = function (c?: any, 原选项?: any, 出?: any) {
    if (ctx.当前链()[ctx.S.chainIndex] !== c)
        return;
    if (c.options !== 原选项)
        return;
    if ((c.补过的层 || []).includes(原选项))
        return;
    const 义务s: any = ctx.屏义务(c, 原选项);
    if (!义务s)
        return;
    (c.补过的层 = c.补过的层 || []).push(原选项);
    const 已有: any = [...原选项.map((x?: any) => String(x.text || "")), ...(ctx.S.组牌用过 || [])];
    const 造好: any = [];
    for (const 原 of ((出 && 出.选项) || [])) {
        const 报的步: any = String((原 && 原.步) || "").trim();
        if (报的步 && 报的步 !== String(c.term || ""))
            continue;
        const 义务: any = 义务s.挑(原);
        if (!义务)
            continue;
        const o: any = ctx.造选项(原, ctx.S, 义务, 原选项, c);
        if (!o)
            continue;
        if (已有.includes(o.text) || 造好.some((x?: any) => x.text === o.text))
            continue;
        o.记 = (出 && 出.记录id) || "";
        o.第几步 = ctx.S.chainIndex || 0;
        o.屏 = c.term || "";
        造好.push(o);
    }
    if (!造好.length)
        return;
    for (const o of 造好)
        c.options.push(o);
    (ctx.S.组牌用过 = ctx.S.组牌用过 || []).push(...造好.map((o?: any) => o.text));
    ctx.render();
};

// 续层补牌：保留原玩法的计算或流程。
ctx.续层补牌 = function (c?: any) {
    if (ctx.链名 !== "后段")
        return;
    if (!c || (c.补过的层 || []).includes(c.options) || c.补中)
        return;
    if (!c.options || c.options.length < 2)
        return;
    if ((ctx.S.组牌次数 || 0) >= ctx.组牌上限)
        return;
    if (!ctx.层义务(c.options))
        return;
    const 原选项: any = c.options;
    c.补中 = true;
    ctx.组牌要去(ctx.组牌场景(c))
        .then((j?: any) => {
        c.补中 = false;
        if (j && j.有) {
            ctx.S.组牌次数 = (ctx.S.组牌次数 || 0) + 1;
            ctx.补上牌(c, 原选项, j);
        }
    })
        .catch(() => { c.补中 = false; });
};

// 后段补牌：保留原玩法的计算或流程。
ctx.后段补牌 = function (c?: any) {
    if (!c || !c.可补)
        return;
    if (c.续层)
        return;
    if (!c.options || !c.options.length)
        return;
    if (c.补中 || (c.补过的层 || []).includes(c.options))
        return;
    if ((ctx.S.组牌次数 || 0) >= ctx.组牌上限)
        return;
    if (!c.options.some((o?: any) => o && !o.回 && String(o.text || "").trim()))
        return;
    const 原选项: any = c.options;
    c.补中 = true;
    ctx.组牌要去(ctx.组牌场景(c))
        .then((j?: any) => { c.补中 = false; if (j && j.有) {
        ctx.S.组牌次数 = (ctx.S.组牌次数 || 0) + 1;
        ctx.补上牌(c, 原选项, j);
    } })
        .catch(() => { c.补中 = false; });
};

// 认说话人：保留原玩法的计算或流程。
ctx.认说话人 = function (文?: any) {
    let 最好: any = null;
    for (const [键, 式] of ctx.说话人) {
        for (const m of String(文).matchAll(式)) {
            if (!最好 || m.index >= 最好.位)
                最好 = { 键, 位: m.index };
        }
    }
    return 最好;
};

// 玩家抢了话：保留原玩法的计算或流程。
ctx.玩家抢了话 = function (前框?: any, 名?: any) {
    let 玩位: any = -1;
    for (const m of 前框.matchAll(ctx.玩家口))
        if (m.index > 玩位)
            玩位 = m.index;
    return 玩位 >= 0 && (!名 || 玩位 > 名.位);
};

// 框里指名了别人：保留原玩法的计算或流程。
ctx.框里指名了别人 = function (前框?: any, 名?: any) {
    if (名)
        return false;
    const m: any = ctx.指名.exec(前框);
    if (!m)
        return false;
    return !new RegExp(ctx.代词).test(ctx.分句(前框));
};

// 框里没有话：保留原玩法的计算或流程。
ctx.框里没有话 = function (前框?: any) {
    const 末: any = ctx.尾句(前框);
    if (/(?:没|没有|不|别|未|甭)\s*(?:说|道|问|答|回|喊|叫|讲|提|劝)/.test(末))
        return true;
    return /[写记抄填签画]\s*(?:上|下|了|着|过|来|去)?\s*[:：]?$/.test(末)
        && !/(?:说|道|问|答)/.test(末);
};

// 认这一句：保留原玩法的计算或流程。
ctx.认这一句 = function (前框?: any, 前缀?: any) {
    const 框里: any = ctx.认说话人(前框);
    if (ctx.玩家抢了话(前框, 框里))
        return null;
    if (ctx.框里指名了别人(前框, 框里))
        return null;
    if (ctx.框里没有话(前框))
        return null;
    if (框里)
        return 框里.键;
    const 全里: any = ctx.认说话人(前缀);
    return 全里 ? 全里.键 : null;
};

// 拆台词：保留原玩法的计算或流程。
ctx.拆台词 = function (说?: any) {
    const 全: any = String(说 == null ? "" : 说);
    const 对: any = [];
    for (let 找: any = 0;;) {
        const a: any = 全.indexOf("「", 找);
        if (a < 0)
            break;
        const b: any = 全.indexOf("」", a + 1);
        if (b < 0)
            return null;
        const 套: any = 全.indexOf("「", a + 1);
        if (套 >= 0 && 套 < b)
            return null;
        if (!全.slice(a + 1, b).trim())
            return null;
        对.push({ a, b });
        找 = b + 1;
    }
    if (!对.length)
        return null;
    const 块: any = [];
    let 旁: any = "", 游: any = 0;
    for (let k: any = 0; k < 对.length; k++) {
        const { a, b }: any = 对[k];
        const 起: any = Math.max(全.lastIndexOf("\n", a - 1) + 1, 游);
        let 止: any = 全.indexOf("\n", b + 1);
        if (止 < 0)
            止 = 全.length;
        const 下: any = 对[k + 1];
        if (下 && 下.a < 止) {
            const 缝: any = 全.slice(b + 1, 下.a);
            const 末: any = Math.max(缝.lastIndexOf("。"), 缝.lastIndexOf("！"), 缝.lastIndexOf("？"), 缝.lastIndexOf("…"));
            止 = 末 >= 0 ? b + 2 + 末 : 下.a;
        }
        const 前框: any = 全.slice(起, a), 后框: any = 全.slice(b + 1, 止), 句: any = 全.slice(a + 1, b);
        旁 += 全.slice(游, 起);
        游 = 止;
        if (/[一二两三四五六七八九十]\s*个\s*字|[一两]\s*句\s*话/.test(前框)) {
            旁 += 前框 + "「" + 句 + "」" + 后框;
            continue;
        }
        const 谁: any = ctx.认这一句(前框, 全.slice(0, a));
        if (!谁) {
            旁 += 前框 + "「" + 句 + "」" + 后框;
            continue;
        }
        if (旁)
            块.push({ 旁 });
        块.push({ 谁, 前框, 后框, 前旁: 旁, 原: 句, 话: "", 题: "", 要过: false, 号: ++ctx.说话号 });
        旁 = "";
    }
    旁 += 全.slice(游);
    if (旁)
        块.push({ 旁 });
    if (!块.some((x?: any) => x.谁))
        return null;
    if (!块.some((x?: any) => x.旁 && x.旁.trim()))
        return null;
    return 块;
};

// 说文：保留原玩法的计算或流程。
ctx.说文 = function (反?: any) {
    if (!反 || !反.块)
        return "";
    return 反.块.map((x?: any) => x.旁 !== undefined
        ? ctx.重(x.旁)
        : '<span class="said" id="sq' + x.号 + '">'
            + (x.话 ? ctx.重(x.前框 + "「" + x.话 + "」" + x.后框) : "") + "</span>").join("");
};

// 填话：保留原玩法的计算或流程。
ctx.填话 = function (块?: any) {
    try {
        const el: any = ctx.document.getElementById("sq" + 块.号);
        if (el)
            el.innerHTML = ctx.重(块.前框 + "「" + 块.话 + "」" + 块.后框);
    }
    catch { }
};

// 说话要去：保留原玩法的计算或流程。
ctx.说话要去 = function (e?: any, 治?: any) {
    const 反: any = 治.反应;
    if (!反 || !反.块)
        return;
    for (const 块 of 反.块) {
        if (!块.谁 || 块.要过)
            continue;
        块.要过 = true;
        ctx.说话一句(e, 块);
    }
};

// 说话一句：保留原玩法的计算或流程。
ctx.说话一句 = function (e?: any, 块?: any) {
    const 停: any = new ctx.AbortController();
    const 闹: any = ctx.setTimeout(() => 停.abort(), 7000);
    try {
        ctx.fetch(ctx.说话址, { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 场景: {
                    谁: 块.谁,
                    印象: (ctx.S.印象 || {})[块.谁] || 0,
                    节气: (e && e.at) || "",
                    年景: (ctx.S.年景 && ctx.S.年景.名) || "",
                    事: [块.题, 块.前旁].filter(Boolean).join("　").slice(0, 300),
                    前框: 块.前框, 后框: 块.后框,
                } }), signal: 停.signal })
            .then((r?: any) => r.json())
            .then((j?: any) => { if (j && j.有 && j.话) {
            块.话 = j.话;
            ctx.填话(块);
        } })
            .catch(() => { })
            .finally(() => ctx.clearTimeout(闹));
    }
    catch {
        ctx.clearTimeout(闹);
    }
};

// 链进：保留原玩法的计算或流程。
ctx.链进 = function (S?: any, c?: any, o?: any) {
    if (o.回 && c.备 && c.备.length) {
        const p: any = c.备.pop();
        c.options = p.项;
        c.title = p.题;
        c.brief = p.简;
        c.say = p.话;
        c.who = p.谁;
        if (c.选过 && c.选过.length)
            c.选过.pop();
        if (c.后应录 && c.后应录.length)
            c.后应录.pop();
        ctx.响("tap");
        ctx.render();
        return;
    }
    if (ctx.链名 === "后段" && !c.推演过 && ctx.三产该算(c)) {
        c.推演过 = true;
        c.推演页 = { 状态: "等" };
        const 本屏: any = c;
        ctx.三产要去(ctx.三产场景(c))
            .then((j?: any) => {
            if (ctx.当前链()[S.chainIndex] !== 本屏)
                return;
            if (j && j.有) {
                本屏.推演页 = { 状态: "有", 结: j };
                ctx.render();
            }
            else {
                本屏.推演页 = null;
                ctx.链进(S, 本屏, {});
            }
        })
            .catch(() => {
            if (ctx.当前链()[S.chainIndex] !== 本屏)
                return;
            本屏.推演页 = null;
            ctx.链进(S, 本屏, {});
        });
        ctx.render();
        return;
    }
    if (c.推演页) {
        ctx.render();
        return;
    }
    S.chainIndex++;
    if (S.chainIndex >= ctx.当前链().length) {
        if (ctx.链名 === "年话") {
            ctx.收年话(S);
            ctx.链名 = "后段";
            ctx.newAch = S.本季成就;
            ctx.screen = "年话完";
        }
        else {
            ctx.result = ctx.年终(S);
            ctx.结成就(S, ctx.result);
            ctx.newAch = S.本季成就;
            ctx.screen = "yearend";
        }
    }
    if (ctx.链名 === "后段")
        ctx.后段补牌(ctx.当前链()[S.chainIndex]);
    ctx.响(S.chainIndex >= ctx.当前链().length ? "钱" : "tap");
    ctx.render();
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.推演址 = (ctx.location.protocol === "file:" ? "http://localhost:8787" : "") + "/api/推演";

ctx.推演 = { 结: null, 键: "", 等: false, 占位: null };

ctx.推演可改 = ["harvest", "quality", "ecology"];

ctx.推演单键 = 3;

ctx.推演总量 = 4;

ctx.startGame = function () {
    ctx.S.termIndex = 0;
    ctx.screen = "pull";
    ctx.render();
    const y: any = ctx.S.年景, 级: any = y.级 || "R";
    ctx.响(级 === "SSR" ? (y.色 === "d" ? "凶" : "金") : "抽");
};

ctx.toField = function () { ctx.nextTerm(); };

ctx.toDecision = function () { ctx.screen = "decision"; ctx.render(); };

ctx.nextEvent = function () {
    ctx.事件位++;
    if (ctx.事件位 >= ctx.pendingEvents.length) {
        ctx.事件位 = 0;
        ctx.toDecision();
        return;
    }
    ctx.render();
};

ctx.onDiag = function (i?: any) {
    const e: any = ctx.pendingEvents[ctx.事件位];
    if (!e || !e.诊 || e.诊.点过[i] || e.诊.完)
        return;
    const s: any = e.诊.步[i];
    if (!s)
        return;
    e.诊.点过[i] = true;
    const 分: any = s.问周 ? e.诊.成 : (s.值 === undefined ? 1 : s.值);
    const 损嘴: any = s.问周 ? ctx.老周损嘴(ctx.S) : "";
    e.诊.得.push({ wh: s.wh || s.text, 得: 损嘴 + s.得, 定: 分 >= e.诊.成 });
    if (s.收)
        e.诊.完 = true;
    else
        e.诊.值 += 分;
    if (e.诊.名 && !e.诊.记过 && e.诊.值 >= e.诊.成) {
        e.诊.记过 = true;
        const 次: any = ctx.档().认得次 || {};
        ctx.存档({ 认得次: { ...次, [e.诊.名]: (次[e.诊.名] || 0) + 1 } });
    }
    if (s.费)
        ctx.S.stamina = Math.max(0, ctx.S.stamina - s.费);
    if (ctx.S.stamina < (ctx.S.最低体力 === undefined ? 99 : ctx.S.最低体力))
        ctx.S.最低体力 = ctx.S.stamina;
    ctx.S.体力花 = (ctx.S.体力花 || 0) + (s.费 || 0);
    if (s.问周)
        ctx.S.问周 = (ctx.S.问周 || 0) + 1;
    ctx.S.探查 = (ctx.S.探查 || 0) + 1;
    ctx.响(s.收 ? "坏" : "tap");
    ctx.render();
};

ctx.onTreat = function (i?: any) {
    const e: any = ctx.pendingEvents[ctx.事件位];
    if (!e || !e.诊 || e.诊.治)
        return;
    const o: any = (e.诊.处置 || [])[i];
    if (!o)
        return;
    if (!ctx.开着(o, ctx.S))
        return;
    if (o.续) {
        (e.诊.上 || (e.诊.上 = [])).push(o.text);
        e.诊.问 = o.续.问 || e.诊.问;
        e.诊.处置 = o.续.处置 || [];
        ctx.响("tap");
        ctx.render();
        return;
    }
    const 解: any = (v?: any) => ctx.算(v, ctx.S);
    const 费: any = 解(o.费) || 0;
    const 钱: any = 解(o.钱) || 0;
    const 象: any = 解(o.象);
    const 回: any = 解(o.回) || 0;
    const 说原: any = 解(o.说);
    let 反: any = null, 说: any = 说原;
    {
        const 块: any = ctx.拆台词(说原);
        if (块) {
            for (const x of 块)
                if (x.谁)
                    x.题 = (e.诊 && e.诊.题) || "";
            反 = { 块 };
            说 = 块.filter((x?: any) => x.旁 !== undefined).map((x?: any) => x.旁).join("");
        }
    }
    const 补: any = 解(o.补) || {};
    if (费) {
        ctx.S.stamina = Math.max(0, ctx.S.stamina - 费);
        ctx.S.体力花 = (ctx.S.体力花 || 0) + 费;
    }
    if (钱) {
        ctx.S.cost += 钱;
        ctx.S.现金 = Math.max(0, ctx.S.现金 - 钱);
    }
    if (o.旗)
        ctx.S.flags[o.旗] = true;
    if (象)
        ctx.记象(ctx.S, 象);
    if (o.隐)
        ctx.记隐(ctx.S, o.隐);
    if (回)
        ctx.S.stamina += 回;
    if (o.问周)
        ctx.S.问周 = (ctx.S.问周 || 0) + 1;
    if (o.交)
        ctx.S.交数 = (ctx.S.交数 || 0) + o.交;
    if (o.缺)
        ctx.S.缺席 = (ctx.S.缺席 || 0) + o.缺;
    const 前: any = { ...ctx.S.stats };
    const delta: any = ctx.applyEffect(ctx.S, 补);
    e.诊.治 = { ...o, 说, 反应: 反, delta, 前, 后: { ...ctx.S.stats } };
    if (反)
        ctx.说话要去(e, e.诊.治);
    ctx.flash = {};
    for (const k in delta)
        if (delta[k])
            ctx.flash[k] = delta[k];
    ctx.响(e.诊.岔 ? "tap" : (o.好 ? "好" : "坏"));
    ctx.render();
};

ctx.onWhy = function (k?: any) {
    ctx.说数 = ctx.说数 === k ? null : k;
    ctx.响("tap");
    ctx.render();
};

ctx.onLock = function (i?: any) {
    const d0: any = ctx.S.节气[ctx.S.termIndex] || {}, o0: any = (d0.options || [])[i];
    if (!o0)
        return;
    const h: any = (d0.热区 || [])[i] || {};
    const 因: any = typeof o0.锁说 === "function" ? o0.锁说(ctx.S) : o0.锁说;
    ctx.响("tap");
    ctx.toast(`${h.标 || o0.text} · ${因 || "还差一步"}`);
};

ctx.onHot = function (i?: any) {
    const d0: any = ctx.S.节气[ctx.S.termIndex] || {}, o0: any = (d0.options || [])[i];
    if (o0 && !ctx.开着(o0, ctx.S))
        return;
    if (ctx.S.选了 !== null)
        return;
    ctx.S.选了 = i;
    ctx.响("tap");
    const 全部: any = ctx.app.querySelectorAll ? ctx.app.querySelectorAll(".hot") : [];
    if (全部[i] && 全部[i].classList)
        全部[i].classList.add("on");
    const 件: any = ctx.app.querySelectorAll ? ctx.app.querySelectorAll(".shi.s" + i)[0] : null;
    if (件 && 件.classList)
        件.classList.add("on");
    if (!ctx.app.querySelectorAll || !ctx.setTimeout) {
        ctx.S.选了 = null;
        ctx.onChoose(i);
        return;
    }
    ctx.setTimeout(() => { ctx.S.选了 = null; ctx.onChoose(i); }, 280);
};

ctx.on人情 = function () { ctx.人情开 = !ctx.人情开; ctx.不滚 = true; ctx.render(); };

ctx.onSound = function () {
    ctx.开声 = !ctx.开声;
    if (ctx.开声)
        ctx.响("tap");
    ctx.render();
};

ctx.onChoose = function (i?: any) {
    const btn: any = ctx.document.querySelectorAll ? ctx.document.querySelectorAll(".btn")[i] : null;
    if (btn)
        btn.classList.add("pick");
    ctx.响("tap");
    ctx.setTimeout(() => {
        ctx.lastResult = ctx.choose(ctx.S, ctx.S.termIndex, i);
        ctx.flash = {};
        for (const k in ctx.lastResult.delta)
            if (ctx.lastResult.delta[k])
                ctx.flash[k] = ctx.lastResult.delta[k];
        if (ctx.lastResult.新图鉴 && ctx.lastResult.新图鉴.length)
            ctx.toast(`记下了 · ${ctx.lastResult.新图鉴.join("、")}`);
        ctx.screen = "result";
        ctx.render();
        ctx.响(Object.keys(ctx.lastResult.delta).some((k?: any) => ctx.lastResult.delta[k] < 0) ? "坏" : "好");
        ctx.扫成就(null);
    }, 160);
};

ctx.onNight = function (选?: any) {
    const 读: any = 选 === "读";
    const 睡前: any = ctx.S.stamina;
    ctx.S.stamina += 读 ? ctx.NUM.翻书恢复 : ctx.NUM.睡觉恢复;
    ctx.S.夜里 = 读 ? "读" : "睡";
    if (!读) {
        ctx.响("tap");
        ctx.toast(`睡了 · 体力 +${ctx.NUM.睡觉恢复}`);
        ctx.onContinue();
        return;
    }
    ctx.S.待查 = ctx.lastResult ? ctx.lastResult.查 : null;
    const 可灵: any = !!(ctx.S.待查 && ctx.S.待查.灵) && !ctx.S.灵感[ctx.S.待查.灵] && 睡前 >= ctx.NUM.灵感体力线;
    ctx.S.新灵感 = 可灵 ? ctx.S.待查.灵 : null;
    if (可灵)
        ctx.S.灵感[可灵] = true;
    const 法: any = ctx.S.待查 && ctx.S.待查.法;
    ctx.S.新说法 = 法 && !ctx.S.说法[法] ? 法 : null;
    if (ctx.S.新说法) {
        ctx.S.说法[ctx.S.新说法] = true;
        ctx.存档({ 说法: { ...ctx.S.说法 } });
    }
    const 剩: any = ctx.边批.map((_?: any, i?: any) => i).filter((i?: any) => !(ctx.S.批过 || {})[i]);
    ctx.S.新批注 = (剩.length && Math.random() < ctx.NUM.边批概率)
        ? 剩[Math.floor(Math.random() * 剩.length)] : null;
    if (ctx.S.新批注 !== null) {
        (ctx.S.批过 || (ctx.S.批过 = {}))[ctx.S.新批注] = true;
        ctx.存档({ 批过: { ...ctx.S.批过 } });
    }
    ctx.S.查过[ctx.S.节气[ctx.S.termIndex].term] = true;
    ctx.响(可灵 ? "好" : "tap");
    ctx.screen = "note";
    ctx.render();
};

ctx.onContinue = function () {
    ctx.S.待查 = null;
    ctx.S.新灵感 = null;
    ctx.S.新说法 = null;
    ctx.S.新批注 = null;
    ctx.S.termIndex++;
    ctx.flash = {};
    if (ctx.S.termIndex >= ctx.S.节气.length) {
        ctx.dueEvents(ctx.S, ctx.S.节气.length);
        ctx.flash = {};
        ctx.S.log.forEach((e?: any) => { for (const k in e.delta)
            if (e.delta[k])
                ctx.flash[k] = e.delta[k]; });
        ctx.S.grain = ctx.S.stats.harvest;
        ctx.miban = ctx.验米(ctx.S);
        ctx.screen = "miban";
        ctx.render();
        ctx.响(ctx.miban.grade.名 === "特级" ? "金" : ctx.miban.grade.名 === "等外" ? "坏" : "好");
        ctx.扫成就(null);
    }
    else
        ctx.nextTerm();
};

ctx.toChain = function () {
    if (!ctx.S.行情)
        ctx.S.行情 = ctx.抽行情();
    ctx.S.后段 = ctx.建后段(ctx.S).map((步?: any) => ({ ...步, options: [...(步.options || [])] }));
    ctx.S.chainIndex = 0;
    ctx.链名 = "后段";
    ctx.screen = "hangqing";
    ctx.render();
    ctx.响(ctx.S.行情.级 === "SSR" ? (ctx.S.行情.色 === "d" ? "凶" : "金") : "抽");
};

ctx.toChainGo = function () { ctx.链名 = "后段"; ctx.screen = "chain"; ctx.render(); };

ctx.onChain = function (i?: any) {
    const c: any = ctx.当前链()[ctx.S.chainIndex];
    if (!c)
        return;
    if (c.反应) {
        ctx.反应完();
        return;
    }
    if (!c.options[i])
        return;
    const o: any = c.options[i];
    const lk: any = o.锁;
    if (lk === true || (typeof lk === "function" && lk(ctx.S)))
        return;
    if (c.层数 === undefined)
        c.层数 = c.options.length;
    if (!o.回) {
        (c.选过 = c.选过 || []).push(o.text);
        if (o.后)
            (c.后应录 = c.后应录 || []).push(o.后);
    }
    if (o.设)
        o.设(ctx.S);
    if (o.续) {
        (c.备 = c.备 || []).push({ 项: c.options, 题: c.title, 简: c.brief, 话: c.say, 谁: c.who });
        c.options = o.续;
        if (o.续题 !== undefined)
            c.title = o.续题;
        if (o.续简 !== undefined)
            c.brief = o.续简;
        if (o.续话 !== undefined)
            c.say = o.续话;
        if (o.续谁 !== undefined)
            c.who = o.续谁;
        c.续层 = true;
        ctx.续层补牌(c);
        ctx.响("tap");
        ctx.render();
        return;
    }
    if (typeof o.pick === "function")
        o.pick(ctx.S);
    if (o.后) {
        c.反应 = { 说: o.后, 谁: o.后谁 !== undefined ? o.后谁 : c.who, 进: o };
        ctx.响("tap");
        ctx.render();
        return;
    }
    ctx.链进(ctx.S, c, o);
};

ctx.三产该算 = (c?: any) => !!(c && c.层数 >= 2 && c.选过 && c.选过.length);

ctx.三产屏完 = function () {
    const c: any = ctx.当前链()[ctx.S.chainIndex];
    if (!c || !c.推演页)
        return;
    c.推演页 = null;
    ctx.链进(ctx.S, c, {});
};

ctx.组牌址 = ctx.推演址.slice(0, -2) + "组牌";

ctx.日志址 = ctx.推演址.slice(0, -2) + "生成日志";

ctx.组牌上限 = 6;

ctx.一屏几张 = 3;

ctx.牌表 = new Set([
    "印了自家名字", "印了盒子", "盒子是牛皮纸的", "盒子里塞了手写的条",
    "赊了酒厂的账", "跟酒厂说定了长期", "瓶子上写了京西稻",
    "接了认养", "认养的人来看过田", "接了研学", "学校那边留了话",
    "供上了饭馆", "摆了摊", "跑过馆子", "留了明年的种",
    "把碎米挑出去了", "稻桩留到了冬天", "田埂上留了草籽",
]);

ctx.说话址 = ctx.推演址.slice(0, -2) + "说话";

ctx.说话人 = [
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

ctx.言语动 = "(?:说|道|问|答|回|喊|叫|念|读|写|应|补|讲|提|劝|骂|夸)(?:完|了|过|着|上|下)?";

ctx.玩家口 = new RegExp("[你您]" + ctx.言语动, "g");

ctx.代词 = "他|她|它|你|我|咱|谁|对方";

ctx.指名 = /([^\s，。、；：！？…「」（）]{1,4})(?:说|道|问|答)[了一]?[句声]?[:：]?\s*$/;

ctx.分句 = (前框?: any) => 前框.split(/[。！？，、；：\n]/).pop() || 前框;

ctx.尾句 = (前框?: any) => {
    const 片: any = String(前框).split(/[。！？，、；：\n]/).filter((x?: any) => x.trim());
    return 片.length ? 片[片.length - 1] : "";
};

ctx.说话号 = 0;

ctx.反应完 = function () {
    const c: any = ctx.当前链()[ctx.S.chainIndex];
    if (!c || !c.反应)
        return;
    const o: any = c.反应.进;
    delete c.反应;
    ctx.链进(ctx.S, c, o);
};

ctx.to年话 = function () {
    ctx.S.年话 = ctx.建年话(ctx.S);
    if (!ctx.S.年话.length)
        return;
    ctx.S.chainIndex = 0;
    ctx.链名 = "年话";
    ctx.screen = "chain";
    ctx.响("tap");
    ctx.render();
};

ctx.setTab = function (t?: any) { ctx.tab = t; ctx.render(); };

ctx.backToGame = function () {
    ctx.screen = ctx.书来源 === "封面" ? "cover"
        : ctx.S.termIndex >= ctx.S.节气.length ? "yearend" : "decision";
    ctx.书来源 = "田";
    ctx.render();
};

ctx.书来源 = "田";

ctx.openBook = function (从?: any) {
    ctx.书来源 = 从 || "田";
    if (从 === "封面")
        ctx.tab = "成就";
    ctx.screen = "book";
    ctx.render();
};

ctx.restart = function () {
    ctx.存档({ 季: (ctx.档().季 || 1) + 1 });
    ctx.reset();
    ctx.成就队 = [];
    ctx.弹牌();
    ctx.render();
};
}
