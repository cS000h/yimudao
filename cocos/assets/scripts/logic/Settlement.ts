/** 验米、年终结算和成就解锁。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// 验米：保留原玩法的计算或流程。
ctx.验米 = function (state?: any) {
    const g: any = ctx.gradeOf(state.stats.quality, state.移线);
    let 眼力: any;
    if (g.名 === "特级")
        眼力 = "抓一把摊在手心，米粒匀、透亮，没白肚。他捏了几粒放进嘴里嚼，点了点头，没说话。";
    else if (g.名 === "一级")
        眼力 = "摊开看了看，米是好米，就是有几粒不太匀。他说：够得上一级。";
    else if (g.名 === "二级")
        眼力 = "捏起来搓了搓，穗上带下来的青粒不少。他皱了皱眉：按二级走吧。";
    else
        眼力 = "他抓了一把，看了看就放下了：这米，按商品粮收吧，进不了等级。";
    const 移: any = state.移线 || 0, 二线: any = ctx.等级表[1].min;
    if (移 > 0)
        眼力 += `\n他没急着报价，先把米倒进量器又碾了一道：「不是你的米不好，今年这天，籽粒不实，整精米率上不去。往日里 ${二线} 分就够二级，今年得 ${二线 + 移}。」`;
    else if (移 < 0)
        眼力 += `\n他碾了一道，抬头说：「今年这米实。整精米率高，往常二级要 ${二线} 分，今年 ${二线 + 移} 就够。」`;
    return { grade: g, 眼力 };
};

// 年终：保留原玩法的计算或流程。
ctx.年终 = function (state?: any) {
    const g: any = ctx.gradeOf(state.stats.quality, state.移线), 米价: any = Math.round(g.价 * (state.米价补 || 1) * 100) / 100;
    const 行情: any = state.行情 || { 原粮: 1, 礼盒: 1 };
    const 谷价v: any = Math.round(米价 * ctx.NUM.原粮折扣 * ctx.NUM.出米率_代碾 * 行情.原粮 * (state.谷价补 || 1) * ctx.陈价(state) * 10) / 10;
    const 已卖谷: any = state.soldGrain, 留谷: any = state.grain - 已卖谷;
    const 米: any = Math.round(留谷 * state.rate);
    const 牌: any = ctx.牌子(state.stats.ecology);
    const 望: any = ctx.算名望(state, g);
    const 碑: any = ctx.口碑(望.前);
    let 兑米: any = 0, 份: any = 0, 人: any = 0, 三产: any = 0, 三产说明: any = "田闲着，一分钱没挣";
    if (state.third !== "无") {
        const 系数: any = ctx.clamp((state.stats.ecology - 30) / 50, 0, 1.25);
        if (state.third === "认养") {
            份 = Math.round(ctx.NUM.认养份数 * Math.min(1, 系数 * 碑) * (0.75 + Math.random() * 0.5));
            份 = Math.max(0, Math.min(份, ctx.NUM.认养份数, Math.floor(米 / ctx.NUM.认养兑米)));
            兑米 = 份 * ctx.NUM.认养兑米;
            三产 = Math.round(份 * ctx.NUM.认养单价);
            三产说明 = `${份} 份被认养，兑出去 ${兑米} 斤米`;
        }
        else {
            人 = Math.round(ctx.NUM.研学人数 * 系数 * 牌 * 碑);
            三产 = Math.round(人 * ctx.NUM.研学单价);
            if (人 < 1) {
                人 = 0;
                三产说明 = "田里没什么可看的，没人来";
            }
            else
                三产说明 = `${人} 人次来研学`;
        }
    }
    else if (state.third !== "无")
        三产说明 = "生态没养起来，没人愿意来";
    const 可售米: any = Math.max(0, 米 - 兑米);
    const 现碾: any = state.自碾 ? ctx.NUM.自碾礼盒加成 : 1;
    const 盒: any = ctx.盒款[state.盒] || ctx.盒款.成品;
    const 礼盒上限: any = Math.min(可售米, Math.round(g.礼盒 * 牌 * 行情.礼盒 * 现碾 * 盒.量));
    const 站里: any = state.账来源 === "自" ? ctx.NUM.站里年费 : 0;
    if (站里)
        state.现金 = Math.max(0, state.现金 - 站里);
    let 现金: any = Math.max(0, state.现金);
    let 礼盒量: any = 0, 加工量: any = 0, 直销量: any = 0;
    if (state.channel === "礼盒" || state.channel === "混合") {
        礼盒量 = Math.min(礼盒上限, Math.floor(现金 / 盒.价));
        现金 -= 礼盒量 * 盒.价;
    }
    const 直: any = state.直 || "敲门";
    const 直乘: any = 直 === "摆摊" ? ctx.NUM.直销摊乘 : 直 === "跑馆" ? ctx.NUM.直销馆乘 : 1;
    const 直价: any = 直 === "摆摊" ? ctx.NUM.直销摊价 : 直 === "跑馆" ? ctx.NUM.直销馆价 : 1;
    if (state.channel === "直销") {
        直销量 = Math.max(0, Math.min(可售米, Math.round(Math.min(可售米, Math.round((望.前 || 0) * 2), Math.round(可售米 * 0.75)) * 直乘)));
    }
    const 余米: any = Math.max(0, 可售米 - 礼盒量 - 直销量);
    const 赊账: any = state.酒 === "赊账";
    const 酒价: any = state.酒 === "名头" ? ctx.NUM.酒名望价
        : 赊账 ? ctx.NUM.深加工价 - ctx.NUM.酒赊贴 : ctx.NUM.深加工价;
    if (state.channel === "混合" || state.channel === "深加工") {
        加工量 = 赊账 ? 余米 : Math.min(余米, Math.floor(现金 / ctx.NUM.深加工费));
    }
    const 原粮量: any = 余米 - 加工量;
    const 包装费: any = Math.round(礼盒量 * 盒.价) + (礼盒量 > 0 ? 盒.费 : 0);
    const 加工费: any = Math.round(加工量 * ctx.NUM.深加工费);
    const 礼盒钱: any = Math.round(礼盒量 * 米价 * 盒.溢);
    const 直销钱: any = Math.round(直销量 * 米价 * ctx.NUM.直销溢价 * 直价);
    const 加工钱: any = Math.round(加工量 * 酒价);
    const 二产: any = 礼盒钱 + 直销钱 + 加工钱;
    const 原粮价: any = 米价 * ctx.NUM.原粮折扣 * 行情.原粮;
    const 一产: any = Math.round(已卖谷 * 谷价v + 原粮量 * 原粮价);
    const 额外: any = state.额外 || 0;
    const 毛收入: any = 一产 + 二产 + 三产 + ctx.NUM.粮补 + 额外;
    const 成本: any = state.cost + 包装费 + 加工费;
    ctx.存档({ 存: Math.round(现金), 种: ctx.gradeOf(state.stats.quality, 0).名,
        名望: 望.合计, 印象: { ...(state.印象 || {}) },
        厨艺: state.厨艺 || 0, 蹭饭: state.蹭饭 || 0,
        食堂: state.食堂 || 0,
        问周总: (state.问周总 || 0) + (state.问周 || 0),
        交数总: (state.交数总 || 0) + (state.交数 || 0),
        同进度: Math.min(ctx.同学线.length, (ctx.档().同进度 || 0) + 1),
        情进度: ctx.第几季() < ctx.感情线起 ? (ctx.档().情进度 || 0) : (() => {
            const 情: any = ctx.档().情进度 || 0;
            const 件: any = ctx.感情线[Math.min(情, ctx.感情线.length - 1)];
            const 印: any = { 印象: { ...(ctx.档().印象 || {}) } };
            return (!件 || !件.门 || 件.门(印)) ? Math.min(ctx.感情线.length, 情 + 1) : 情;
        })(),
        前事: { ...state.flags } });
    return { grade: g, 米价, 谷价: 谷价v, 牌, 碑, 望, 行情, 米, 已卖谷, 留谷, 兑米, 可售米,
        一产, 二产, 三产, 三产说明, 礼盒量, 加工量, 直销量, 原粮量, 礼盒上限,
        礼盒钱, 直销钱, 加工钱, 直销单价: Math.round(米价 * ctx.NUM.直销溢价 * 直价 * 100) / 100,
        直, 门路: 望.门路,
        盒: 盒.名, 酒: state.酒 || "现结",
        包装费, 加工费, 额外, 兜里剩: Math.round(现金),
        站里, 账来源: state.账来源,
        交数: state.交数 || 0, 交数总: (state.交数总 || 0) + (state.交数 || 0),
        缺席: state.缺席 || 0, 同进度: state.同进度 || 0, 情进度: state.情进度 || 0,
        毛收入, 补贴: ctx.NUM.粮补, 成本, 净收益: 毛收入 - 成本 };
};

// 结成就：保留原玩法的计算或流程。
ctx.结成就 = function (S?: any, r?: any) {
    const got: any = [];
    ctx.ACH.forEach((a?: any) => { if (!S.ach[a.id] && a.when(S, r)) {
        S.ach[a.id] = true;
        S.本季成就.push(a);
        got.push(a);
    } });
    if (got.length)
        ctx.存档({ ach: { ...S.ach } });
    return got;
};

// 发牌：保留原玩法的计算或流程。
ctx.发牌 = function (ach?: any) { ach.forEach((a?: any) => ctx.成就队.push(a)); ctx.弹牌(); };

// 弹牌：保留原玩法的计算或流程。
ctx.弹牌 = function () {
    const el: any = ctx.document.getElementById("pop");
    if (!el)
        return;
    const a: any = ctx.成就队[0];
    ctx.clearTimeout(ctx.牌计时);
    if (!a) {
        el.className = "pop";
        el.innerHTML = "";
        return;
    }
    el.className = "pop on " + (a.级 || "铜");
    el.innerHTML = `<span class="lv">${a.级 || "铜"}</span>
    <div><b>${ctx.esc(a.名)}</b><p>${ctx.esc(a.说)}</p></div>`;
    ctx.响(a.级 === "金" ? "金" : a.级 === "银" ? "好" : "tap");
    ctx.牌计时 = ctx.setTimeout(ctx.收牌, a.级 === "金" ? 4000 : 3000);
};

// 收牌：保留原玩法的计算或流程。
ctx.收牌 = function () { ctx.成就队.shift(); ctx.弹牌(); };

// 扫成就：保留原玩法的计算或流程。
ctx.扫成就 = function (r?: any) {
    const got: any = ctx.结成就(ctx.S, r);
    if (got.length)
        ctx.发牌(got);
    return got;
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.成就队 = [];

ctx.牌计时 = null;

ctx.onPop = function () { if (ctx.成就队.length)
    ctx.收牌();
else {
    ctx.成就队 = [];
    ctx.弹牌();
} };
}
