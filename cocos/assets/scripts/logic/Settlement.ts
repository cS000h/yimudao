/** 验米、年终结算和成就解锁。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// 验米：保留原玩法的计算或流程。
ctx.gradeRice = function (state?: any) {
    const g: any = ctx.gradeOf(state.stats.quality, state["移线"]);
    let perception: any;
    if (g["名"] === "特级")
        perception = "抓一把摊在手心，米粒匀、透亮，没白肚。他捏了几粒放进嘴里嚼，点了点头，没说话。";
    else if (g["名"] === "一级")
        perception = "摊开看了看，米是好米，就是有几粒不太匀。他说：够得上一级。";
    else if (g["名"] === "二级")
        perception = "捏起来搓了搓，穗上带下来的青粒不少。他皱了皱眉：按二级走吧。";
    else
        perception = "他抓了一把，看了看就放下了：这米，按商品粮收吧，进不了等级。";
    const gameShift: any = state["移线"] || 0, secondGradeThreshold: any = ctx.gradeTable[1].min;
    if (gameShift > 0)
        perception += `\n他没急着报价，先把米倒进量器又碾了一道：「不是你的米不好，今年这天，籽粒不实，整精米率上不去。往日里 ${secondGradeThreshold} 分就够二级，今年得 ${secondGradeThreshold + gameShift}。」`;
    else if (gameShift < 0)
        perception += `\n他碾了一道，抬头说：「今年这米实。整精米率高，往常二级要 ${secondGradeThreshold} 分，今年 ${secondGradeThreshold + gameShift} 就够。」`;
    return { grade: g, "眼力": perception };
};

// 年终：保留原玩法的计算或流程。
ctx.yearEndStories = function (state?: any) {
    const g: any = ctx.gradeOf(state.stats.quality, state["移线"]), ricePrice: any = Math.round(g["价"] * (state["米价补"] || 1) * 100) / 100;
    const market: any = state["行情"] || { "原粮": 1, "礼盒": 1 };
    const grainPriceValue: any = Math.round(ricePrice * ctx.NUM["原粮折扣"] * ctx.NUM["出米率_代碾"] * market["原粮"] * (state["谷价补"] || 1) * ctx.staleRicePrice(state) * 10) / 10;
    const gameSoldGrain: any = state.soldGrain, retainedGrain: any = state.grain - gameSoldGrain;
    const gameRice: any = Math.round(retainedGrain * state.rate);
    const gameCard: any = ctx.signboard(state.stats.ecology);
    const prestigeValue: any = ctx.calculatePrestige(state, g);
    const milestone: any = ctx.reputationLabels(prestigeValue["前"]);
    let riceRedemption: any = 0, portions: any = 0, people: any = 0, serviceIndustry: any = 0, serviceDescription: any = "田闲着，一分钱没挣";
    if (state.third !== "无") {
        const coefficient: any = ctx.clamp((state.stats.ecology - 30) / 50, 0, 1.25);
        if (state.third === "认养") {
            portions = Math.round(ctx.NUM["认养份数"] * Math.min(1, coefficient * milestone) * (0.75 + Math.random() * 0.5));
            portions = Math.max(0, Math.min(portions, ctx.NUM["认养份数"], Math.floor(gameRice / ctx.NUM["认养兑米"])));
            riceRedemption = portions * ctx.NUM["认养兑米"];
            serviceIndustry = Math.round(portions * ctx.NUM["认养单价"]);
            serviceDescription = `${portions} 份被认养，兑出去 ${riceRedemption} 斤米`;
        }
        else {
            people = Math.round(ctx.NUM["研学人数"] * coefficient * gameCard * milestone);
            serviceIndustry = Math.round(people * ctx.NUM["研学单价"]);
            if (people < 1) {
                people = 0;
                serviceDescription = "田里没什么可看的，没人来";
            }
            else
                serviceDescription = `${people} 人次来研学`;
        }
    }
    else if (state.third !== "无")
        serviceDescription = "生态没养起来，没人愿意来";
    const saleableRice: any = Math.max(0, gameRice - riceRedemption);
    const freshMilling: any = state["自碾"] ? ctx.NUM["自碾礼盒加成"] : 1;
    const packageBox: any = ctx.packageStyles[state["盒"]] || ctx.packageStyles["成品"];
    const giftBoxLimit: any = Math.min(saleableRice, Math.round(g["礼盒"] * gameCard * market["礼盒"] * freshMilling * packageBox["量"]));
    const station: any = state["账来源"] === "自" ? ctx.NUM["站里年费"] : 0;
    if (station)
        state["现金"] = Math.max(0, state["现金"] - station);
    let cash: any = Math.max(0, state["现金"]);
    let giftBoxVolume: any = 0, processingVolume: any = 0, directSaleVolume: any = 0;
    if (state.channel === "礼盒" || state.channel === "混合") {
        giftBoxVolume = Math.min(giftBoxLimit, Math.floor(cash / packageBox["价"]));
        cash -= giftBoxVolume * packageBox["价"];
    }
    const direct: any = state["直"] || "敲门";
    const directMultiplier: any = direct === "摆摊" ? ctx.NUM["直销摊乘"] : direct === "跑馆" ? ctx.NUM["直销馆乘"] : 1;
    const directPrice: any = direct === "摆摊" ? ctx.NUM["直销摊价"] : direct === "跑馆" ? ctx.NUM["直销馆价"] : 1;
    if (state.channel === "直销") {
        directSaleVolume = Math.max(0, Math.min(saleableRice, Math.round(Math.min(saleableRice, Math.round((prestigeValue["前"] || 0) * 2), Math.round(saleableRice * 0.75)) * directMultiplier)));
    }
    const remainingRice: any = Math.max(0, saleableRice - giftBoxVolume - directSaleVolume);
    const credit: any = state["酒"] === "赊账";
    const winePrice: any = state["酒"] === "名头" ? ctx.NUM["酒名望价"]
        : credit ? ctx.NUM["深加工价"] - ctx.NUM["酒赊贴"] : ctx.NUM["深加工价"];
    if (state.channel === "混合" || state.channel === "深加工") {
        processingVolume = credit ? remainingRice : Math.min(remainingRice, Math.floor(cash / ctx.NUM["深加工费"]));
    }
    const rawGrainAmount: any = remainingRice - processingVolume;
    const packagingFee: any = Math.round(giftBoxVolume * packageBox["价"]) + (giftBoxVolume > 0 ? packageBox["费"] : 0);
    const processingFee: any = Math.round(processingVolume * ctx.NUM["深加工费"]);
    const giftBoxRevenue: any = Math.round(giftBoxVolume * ricePrice * packageBox["溢"]);
    const directSaleRevenue: any = Math.round(directSaleVolume * ricePrice * ctx.NUM["直销溢价"] * directPrice);
    const processingRevenue: any = Math.round(processingVolume * winePrice);
    const processingIndustry: any = giftBoxRevenue + directSaleRevenue + processingRevenue;
    const rawGrainPrice: any = ricePrice * ctx.NUM["原粮折扣"] * market["原粮"];
    const primaryIndustry: any = Math.round(gameSoldGrain * grainPriceValue + rawGrainAmount * rawGrainPrice);
    const bonus: any = state["额外"] || 0;
    const grossIncome: any = primaryIndustry + processingIndustry + serviceIndustry + ctx.NUM["粮补"] + bonus;
    const gameCost: any = state.cost + packagingFee + processingFee;
    ctx.saveArchive({ "存": Math.round(cash), "种": ctx.gradeOf(state.stats.quality, 0)["名"],
        "名望": prestigeValue["合计"], "印象": { ...(state["印象"] || {}) },
        "厨艺": state["厨艺"] || 0, "蹭饭": state["蹭饭"] || 0,
        "食堂": state["食堂"] || 0,
        "问周总": (state["问周总"] || 0) + (state["问周"] || 0),
        "交数总": (state["交数总"] || 0) + (state["交数"] || 0),
        "同进度": Math.min(ctx.classmateTrack.length, (ctx.readArchive()["同进度"] || 0) + 1),
        "情进度": ctx.seasonNumber() < ctx.romanceStartSeason ? (ctx.readArchive()["情进度"] || 0) : (() => {
            const relationship: any = ctx.readArchive()["情进度"] || 0;
            const gameItem: any = ctx.romanceTracks[Math.min(relationship, ctx.romanceTracks.length - 1)];
            const impression: any = { "印象": { ...(ctx.readArchive()["印象"] || {}) } };
            return (!gameItem || !gameItem["门"] || gameItem["门"](impression)) ? Math.min(ctx.romanceTracks.length, relationship + 1) : relationship;
        })(),
        "前事": { ...state.flags } });
    return { grade: g, "米价": ricePrice, "谷价": grainPriceValue, "牌": gameCard, "碑": milestone, "望": prestigeValue, "行情": market, "米": gameRice, "已卖谷": gameSoldGrain, "留谷": retainedGrain, "兑米": riceRedemption, "可售米": saleableRice,
        "一产": primaryIndustry, "二产": processingIndustry, "三产": serviceIndustry, "三产说明": serviceDescription, "礼盒量": giftBoxVolume, "加工量": processingVolume, "直销量": directSaleVolume, "原粮量": rawGrainAmount, "礼盒上限": giftBoxLimit,
        "礼盒钱": giftBoxRevenue, "直销钱": directSaleRevenue, "加工钱": processingRevenue, "直销单价": Math.round(ricePrice * ctx.NUM["直销溢价"] * directPrice * 100) / 100,
        "直": direct, "门路": prestigeValue["门路"],
        "盒": packageBox["名"], "酒": state["酒"] || "现结",
        "包装费": packagingFee, "加工费": processingFee, "额外": bonus, "兜里剩": Math.round(cash),
        "站里": station, "账来源": state["账来源"],
        "交数": state["交数"] || 0, "交数总": (state["交数总"] || 0) + (state["交数"] || 0),
        "缺席": state["缺席"] || 0, "同进度": state["同进度"] || 0, "情进度": state["情进度"] || 0,
        "毛收入": grossIncome, "补贴": ctx.NUM["粮补"], "成本": gameCost, "净收益": grossIncome - gameCost };
};

// 结成就：保留原玩法的计算或流程。
ctx.settleAchievements = function (S?: any, r?: any) {
    const got: any = [];
    ctx.ACH.forEach((a?: any) => { if (!S.ach[a.id] && a.when(S, r)) {
        S.ach[a.id] = true;
        S["本季成就"].push(a);
        got.push(a);
    } });
    if (got.length)
        ctx.saveArchive({ ach: { ...S.ach } });
    return got;
};

// 发牌：保留原玩法的计算或流程。
ctx.dealCards = function (ach?: any) { ach.forEach((a?: any) => ctx.achievementQueue.push(a)); ctx.showStoryCard(); };

// 弹牌：保留原玩法的计算或流程。
ctx.showStoryCard = function () {
    const el: any = ctx.document.getElementById("pop");
    if (!el)
        return;
    const a: any = ctx.achievementQueue[0];
    ctx.clearTimeout(ctx.cardTimer);
    if (!a) {
        el.className = "pop";
        el.innerHTML = "";
        return;
    }
    el.className = "pop on " + (a["级"] || "铜");
    el.innerHTML = `<span class="lv">${a["级"] || "铜"}</span>
    <div><b>${ctx.esc(a["名"])}</b><p>${ctx.esc(a["说"])}</p></div>`;
    ctx.playCue(a["级"] === "金" ? "金" : a["级"] === "银" ? "好" : "tap");
    ctx.cardTimer = ctx.setTimeout(ctx.completeCard, a["级"] === "金" ? 4000 : 3000);
};

// 收牌：保留原玩法的计算或流程。
ctx.completeCard = function () { ctx.achievementQueue.shift(); ctx.showStoryCard(); };

// 扫成就：保留原玩法的计算或流程。
ctx.scanAchievements = function (r?: any) {
    const got: any = ctx.settleAchievements(ctx.S, r);
    if (got.length)
        ctx.dealCards(got);
    return got;
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.achievementQueue = [];

ctx.cardTimer = null;

ctx.onPop = function () { if (ctx.achievementQueue.length)
    ctx.completeCard();
else {
    ctx.achievementQueue = [];
    ctx.showStoryCard();
} };
}
