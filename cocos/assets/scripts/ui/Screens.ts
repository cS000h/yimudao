/** 封面、决策、结果、图鉴等界面内容。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// reset：保留原玩法的计算或流程。
ctx.reset = function () {
    ctx.closePests(false);
    ctx.pestTerms.clear();
    ctx.S = ctx.newSeason();
    ctx.screen = "cover";
    ctx.pendingEvents = [];
    ctx.lastResult = null;
    ctx.已倒过 = false;
    ctx.事件位 = 0;
    ctx.链名 = "后段";
    ctx.flash = {};
    ctx.miban = null;
    ctx.result = null;
    ctx.newAch = [];
    ctx.备事();
};

// toast：保留原玩法的计算或流程。
ctx.toast = function (msg?: any) {
    const t: any = ctx.document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("on");
    ctx.clearTimeout(ctx.toastTimer);
    ctx.toastTimer = ctx.setTimeout(() => t.classList.remove("on"), 2300);
};

// 音：保留原玩法的计算或流程。
ctx.音 = function (频?: any, 起?: any, 长?: any, 型?: any, 量?: any) {
    const o: any = ctx.声.createOscillator(), g: any = ctx.声.createGain();
    const t: any = ctx.声.currentTime + 起;
    o.type = 型;
    o.frequency.value = 频;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(量, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + 长);
    o.connect(g);
    g.connect(ctx.声.destination);
    o.start(t);
    o.stop(t + 长 + .03);
};

// 响：保留原玩法的计算或流程。
ctx.响 = function (k?: any) {
    if (!ctx.开声)
        return;
    try {
        const AC: any = ctx.window.AudioContext || ctx.window.webkitAudioContext;
        if (!AC)
            return;
        if (!ctx.声)
            ctx.声 = new AC();
        if (ctx.声.state === "suspended")
            ctx.声.resume();
        (ctx.音效[k] || ctx.音效.tap)();
    }
    catch (e: any) { }
};

// 年景条：保留原玩法的计算或流程。
ctx.年景条 = function () {
    if (ctx.screen === "cover" || ctx.screen === "practice")
        return "";
    const y: any = ctx.S.年景;
    if (!y)
        return "";
    const 移: any = ctx.S.移线 || 0;
    return `<div class="yrow" onclick="openLog()">
    <span class="k">今 年</span>
    <b class="${y.色 === "d" ? "d" : y.色 === "a" ? "a" : ""}">${ctx.esc(y.名)}</b>
    ${移 ? `<i class="${移 > 0 ? "up" : "dn"}">验米线 ${移 > 0 ? "抬了" : "落了"} ${Math.abs(移)} 点</i>` : ""}
    <span class="go2">翻翻这几步</span></div>`;
};

// 人情条：保留原玩法的计算或流程。
ctx.人情条 = function () {
    if (ctx.screen === "cover" || ctx.screen === "practice")
        return "";
    if (ctx.S.名望 === undefined && !ctx.S.印象)
        return "";
    const 望: any = Math.round(ctx.S.名望 || 0);
    const 名单: any = [["周", "老周"], ["陈", "老陈"], ["同", "同学A"], ["赵", "老赵"], ["师", "老师"],
        ["主", "田主"], ["村", "村长"], ["农", "农资店"], ["乙", "同学B"]];
    const 人: any = 名单.map(([k, 名]: any) => {
        const v: any = (ctx.S.印象 || {})[k] || 0;
        const c: any = v >= 8 ? "a" : v <= -3 ? "d" : "";
        return `<button class="pn ${c}${ctx.说数 === k ? " on" : ""}"
      onclick="onWhy('${k}')">${名} ${v > 0 ? "+" : ""}${v}</button>`;
    }).join("");
    const 开: any = ctx.说数 ? (ctx.说数 === "望" ? ["名 望", String(望), ctx.名望说(望)]
        : [ctx.人里找(ctx.说数).名, ctx.有正负((ctx.S.印象 || {})[ctx.说数] || 0), ctx.印象说(ctx.说数, (ctx.S.印象 || {})[ctx.说数] || 0)])
        : null;
    const 门: any = ctx.说数 === "望" ? ctx.名望门(望) : "";
    const 看人: any = ctx.说数 && ctx.说数 !== "望";
    const 摊: any = ctx.人情开 || 看人;
    return `<div class="yrow">
    <span class="k">名 望</span>
    <button class="pn w${ctx.说数 === "望" ? " on" : ""}" onclick="onWhy('望')"><b>${望}</b>名望</button>
    ${摊
        ? `<span class="tip">${ctx.说数 === "望" ? "再 点 一 下 收 起 来" : "点 数 字 有 话 说"}</span>`
        : `<button class="pn more" onclick="on人情()">人情 ${名单.length} 人 ▾</button>`}</div>
    ${ctx.说数 === "望" ? `<div class="whysay"><b>${开[0]} ${开[1]}</b>${ctx.esc(开[2])}</div>` : ""}
    ${ctx.说数 === "望" && 门 ? `<div class="whysay"><b>名 望 能 办 的 事</b>${门}</div>` : ""}
    ${摊 ? `<div class="yrow">
    <span class="k">人 情</span>
    ${人}<button class="pn more" onclick="on人情()">收起 ▴</button></div>` : ""}
    ${看人 ? `<div class="whysay"><b>${开[0]} ${开[1]}</b>${ctx.esc(开[2])}</div>` : ""}`;
};

// 名望门：保留原玩法的计算或流程。
ctx.名望门 = function (n?: any) {
    const 列: any = Object.keys(ctx.望线).map((k?: any) => ctx.望线[k]).sort((a?: any, b?: any) => a.线 - b.线);
    const 开: any = 列.filter((x?: any) => n >= x.线), 关: any = 列.filter((x?: any) => n < x.线);
    if (!开.length && !关.length)
        return "";
    const 行: any = [];
    if (关.length) {
        if (开.length)
            行.push(`<p class="ml"><em>已经开着</em><span>${ctx.esc(开[开.length - 1].门)}。`
                + `这样的门一共 ${开.length} 扇。</span></p>`);
        行.push(`<p class="ml"><em>下一扇还差 ${关[0].线 - Math.round(n)} 点</em>`
            + `<span>${ctx.esc(关[0].门)}。</span></p>`);
    }
    else
        行.push(`<p class="ml"><em>都开完了</em><span>${列.length} 扇门全开着。`
            + `这一片能替你办的事，你都办得成了。</span></p>`);
    return 行.join("");
};

// 名望说：保留原玩法的计算或流程。
ctx.名望说 = function (n?: any) {
    if (n < 20)
        return "你是外来的学生，租了一亩地。村里知道有这么个人，叫不出名字。";
    if (n < 60)
        return "路上碰见会点个头。谁家办席不叫你，但也没人躲着你。";
    if (n < 130)
        return "他们知道你是农大来的那个学生了。买农资能赊两天账。";
    if (n < 260)
        return "这一片拿你当自己人。有人专门绕过来看你这块稻子是怎么种的。";
    if (n < 450)
        return "镇上管农业的也知道你。写材料、拍片子、开会，都要喊你一声。";
    return "你不用再解释了。你说这块地该怎么种，旁边的人照做。";
};

// 印象说：保留原玩法的计算或流程。
ctx.印象说 = function (k?: any, v?: any) {
    const 表: any = {
        周: ["他看见你就当没看见，田埂上碰见也绕着走。",
            "他还是给你指点，但话只说到一半。你问第二句他就不接了。",
            "你和他不熟。见面也就是点个头，没什么话说。",
            "他肯跟你说实话了。你问什么，他答什么。",
            "他路过你这块田会停下来看两眼。有事你不用叫他，他自己就来了。",
            "他把你当自己人。那本记了四十年的本子，他愿意给你翻。"],
        陈: ["你的事他不接。电话打过去，他说忙。",
            "他收你的谷子挑得比谁都细，价却按最低的算。",
            "见面就是生意。过磅、结账，多一句都没有。",
            "他愿意跟你把价先谈好再动手，不跟你绕。",
            "你的谷子他先给你留着，什么时候出米什么时候算。",
            "他信你这人不糊弄数。别人嫌你事多，他专找你这样的。"],
        同: ["他在楼道里看见你，拐进另一条走廊。",
            "他跟你说话客气，客气得像不认识。",
            "你们是一起下田的同学。除了课上的事，没什么来往。",
            "他会把他田里的数拿给你看，也问你两句。",
            "他遇上拿不准的事会来找你，不管他老师怎么说。",
            "他把你说的记在本子上，一条一条照着改。"],
        赵: ["他见了你就说机器忙。你那点谷子，他让你拉回去。",
            "碾你的米他不上心，出米率报得比谁家都低。",
            "你们只是买卖。他把机器开着，你等着，碾完拉走，没别的话。",
            "他愿意跟你多说两句，告诉你哪一批米该早点碾。",
            "他给你留着机器，你什么时候来什么时候碾。",
            "他会跟你说行里的实话：今年什么光景、哪家在压价。这话他不跟外人讲。"],
        师: ["他把你叫到办公室，问你到底还想不想念了。",
            "他在组会上不点你的名，可你知道他在说谁。",
            "你是他带的学生。你下田，他知道，也就是知道。",
            "他会问你田里的数，问得挺细。",
            "他把你的数据要过去看，说这个能写。",
            "他跟别人提起你，说这是他带的学生。"],
        主: ["他说这块地明年不打算租了。",
            "他隔三差五来田里转一圈，转完什么也不说就走。",
            "你们只在交租的时候见。他把钱点了，你走人。",
            "他会问一句今年怎么样，问完就骑车走了。",
            "他愿意让你在田边搭个棚，没多要钱。",
            "他跟别人说，这块地租给你，他不操心。"],
        村: ["他说你这个事，村里不好办。",
            "你去盖章，他让你过两天再来。",
            "你会在这条埂上碰见他，点个头，各走各的。",
            "你去找他，他肯把政策跟你讲一遍。",
            "村里有什么名额，他先想到你这一块田。",
            "他跟上面来的人说，这块地是我们村的样板。"],
        农: ["他见你进门就说没有。",
            "他给你的价，比给别人的高。",
            "一手交钱一手交货。他不问你种什么。",
            "他会跟你说哪个牌子别买。",
            "赊账本上给你留了一页。",
            "进了新货他先给你留一份，说这个你用得上。"],
        乙: ["在群里说着话，你一进去，话题就换了一个。",
            "找你只为一件事：让你把田里的照片发两张过去。",
            "你们是同学。各做各的，各忙各的。",
            "肯把那一套怎么卖的想法讲给你听了。",
            "上新品之前会先问你一句：这个你会不会买。",
            "把你这一亩写进了方案里，署了你的名字。"],
    };
    const 档: any = (表[k] || 表.周);
    if (v <= -15)
        return 档[0];
    if (v <= -7)
        return 档[1];
    if (v <= 1)
        return 档[2];
    if (v <= 8)
        return 档[3];
    if (v <= 17)
        return 档[4];
    return 档[5];
};

// 节气条：保留原玩法的计算或流程。
ctx.节气条 = function () {
    if (ctx.screen === "cover")
        return "";
    const 全收: any = ctx.screen === "miban" || ctx.screen === "chain" || ctx.screen === "yearend"
        || ctx.S.termIndex >= ctx.S.节气.length;
    const cells: any = ctx.S.节气.map((d?: any, i?: any) => {
        const cls: any = 全收 || i < ctx.S.termIndex ? "过" : i === ctx.S.termIndex ? "今" : "";
        return `<div class="td ${cls}"><u class="ph">${ctx.节图[d.阶段] || ctx.节图.冬}</u>`
            + `<i></i><span>${d.term}</span></div>`;
    }).join("");
    return `<div class="tstrip">${cells}</div>`;
};

// 品阶行：保留原玩法的计算或流程。
ctx.品阶行 = function (q?: any, 移线: any = 0) {
    const g: any = ctx.gradeOf(q, 移线);
    const 下: any = ctx.等级表.find((x?: any) => x.min > 0 && x.min + 移线 > q);
    const 标: any = 移线 ? `<b class="${移线 > 0 ? "up" : "dn"}">${移线 > 0 ? "↑" : "↓"}</b>` : "";
    if (!下)
        return `<i class="top">${g.名} · 到顶了${标}</i>`;
    const 差: any = 下.min + 移线 - q;
    return `<i class="${差 <= 4 ? "near" : ""}">${g.名} · 差 ${差} 点到${下.名}${标}</i>`;
};

// hud：保留原玩法的计算或流程。
ctx.hud = function (withField?: any) {
    const cells: any = ["harvest", "quality", "ecology"].map((k?: any) => {
        const v: any = ctx.S.stats[k], f: any = ctx.flash[k];
        const cls: any = f > 0 ? "up" : f < 0 ? "dn" : (v <= 25 ? "low" : "");
        const 从: any = ctx.S.显数[k], 滚: any = (f && 从 !== undefined && 从 !== v) ? ` data-from="${从}"` : "";
        ctx.S.显数[k] = v;
        return `<div class="c ${cls} ${k}"><b${滚}>${v}</b><u class="ic">${ctx.数图[k]}</u>${ctx.LABEL[k]}${k === "quality" ? ctx.品阶行(v, ctx.S.移线) : ""}</div>`;
    }).join("");
    const 后段中: any = ctx.screen === "hangqing" || ctx.screen === "chain";
    const 钱: any = 后段中
        ? `<div class="c m"><b>${ctx.S.现金 < 0 ? "-" + ctx.yuan(-ctx.S.现金) : ctx.yuan(Math.round(ctx.S.现金))}</b>手头现金</div>`
        : `<div class="c m"><b>${ctx.S.cost ? "-" + ctx.yuan(ctx.S.cost) : "0"}</b>已投入</div>`;
    return `<div class="head"><div class="hud">${cells}
    <div class="c s ${ctx.S.stamina <= 15 ? "low" : ""}"><b>${ctx.S.stamina}</b>体力</div>
    ${钱}
    <div class="c snd ${ctx.开声 ? "" : "off"}" onclick="onSound()">${ctx.开声 ? "♪" : "×"}</div>
  </div>${ctx.人情条()}${ctx.年景条()}${ctx.节气条()}</div>${withField
        ? `<div class="field">${ctx.田的画(ctx.S)}<span class="wh">田 里 的 样 子</span>${ctx.esc(ctx.田的样子(ctx.S))}</div>`
        : ""}`;
};

// 起动画：保留原玩法的计算或流程。
ctx.起动画 = function () {
    if (!ctx.app.querySelectorAll)
        return;
    ctx.app.querySelectorAll("[data-from]").forEach((el?: any) => {
        const 从: any = +el.dataset.from, 到: any = +el.textContent;
        delete el.dataset.from;
        if (从 === 到 || !isFinite(从) || !isFinite(到))
            return;
        const t0: any = ctx.performance.now(), 时长: any = 430;
        const 走: any = (t?: any) => {
            const p: any = Math.min(1, (t - t0) / 时长);
            el.textContent = Math.round(从 + (到 - 从) * (1 - Math.pow(1 - p, 3)));
            if (p < 1)
                ctx.requestAnimationFrame(走);
            else
                el.textContent = 到;
        };
        ctx.requestAnimationFrame(走);
    });
    ctx.app.querySelectorAll("[data-w]").forEach((el?: any, i?: any) => {
        const 宽: any = el.dataset.w;
        ctx.setTimeout(() => {
            el.style.transition = "width .85s cubic-bezier(.2,.8,.3,1)";
            el.style.width = 宽;
        }, 150 + i * 130);
    });
    ctx.app.querySelectorAll("[data-count]").forEach((el?: any) => {
        const 到: any = +el.dataset.count;
        delete el.dataset.count;
        if (!isFinite(到))
            return;
        const 负: any = 到 < 0, t0: any = ctx.performance.now(), 时长: any = 1150;
        const 走: any = (t?: any) => {
            const p: any = Math.min(1, (t - t0) / 时长);
            const v: any = Math.round(到 * (1 - Math.pow(1 - p, 3)));
            el.textContent = (负 && v !== 0 ? "−" : "") + Math.abs(v).toLocaleString("zh-CN");
            if (p < 1)
                ctx.requestAnimationFrame(走);
            else
                el.textContent = (负 ? "−" : "") + Math.abs(到).toLocaleString("zh-CN");
        };
        ctx.setTimeout(() => ctx.requestAnimationFrame(走), 320);
    });
    ctx.app.querySelectorAll("[data-wipe]").forEach((el?: any) => {
        ctx.setTimeout(() => el.classList.add("wiped"), 260);
    });
};

// deltaText：保留原玩法的计算或流程。
ctx.deltaText = function (d?: any) {
    return Object.keys(d).filter((k?: any) => d[k])
        .map((k?: any) => `${ctx.LABEL[k]} ${d[k] > 0 ? "+" : ""}${d[k]}${ctx.UNIT[k]}`).join("　");
};

// 年景卡：保留原玩法的计算或流程。
ctx.年景卡 = function (y?: any) {
    const 移: any = y.移线 || 0;
    const 名: any = ["二级", "一级", "特级"];
    const 线: any = 移
        ? `<p class="ln">今年验米的线　${ctx.等级表.slice(1).map((x?: any, i?: any) => `${名[i]} <b>${x.min + 移}</b>`).join("　")}
       <span>往常是 ${ctx.等级表.slice(1).map((x?: any) => x.min).join(" / ")}。${移 > 0
            ? "今年籽粒不实，碾出来碎米多，线往上抬。" : "今年籽粒灌得饱，整米多，线往下走。"}</span></p>`
        : "";
    return `<div class="yc ${y.级 || "R"} ${y.色 === "d" ? "xiong" : ""}">
    <span class="tier">${y.签 || ""}</span>
    <span class="k">今 年 的 年 景</span>
    <b class="${y.色}">${y.名}</b>
    <p>${ctx.esc(y.说)}</p>
    <p style="color:#a8b8a2">${ctx.esc(y.报)}</p>${线}</div>`;
};

// viewCover：保留原玩法的计算或流程。
ctx.viewCover = function () {
    return `<div class="cover">
    <h1 class="name">一亩稻</h1>
    <p class="sub">京 西 稻 · 第 ${ctx.档().季 || 1} 季</p>
    <div class="lead">
      <p>玉泉山的水从西边流过来。清代，这一带的水田种出来的稻子，是要送进宫的。鼎盛的时候，海淀有近十万亩稻田。</p>
      <p>2000 年，京密引水渠不再给农田供水。稻田一年少一两万亩。到今天，全区剩下约两千亩，是当年的百分之二。</p>
      <p>这剩下的两千亩，靠一个农业文化遗产的名头，靠一亩地九百块的粮补，靠一家三十个人的镇属公司年年往里贴，才留下来。</p>
      <p>你是实习生。这个夏天，学校安排你到上庄生产实习一季。</p>
      <p>带你的人是老周，上庄镇农业公司的技术员，五十七岁，这一带的稻子他种了四十年。头一天见面，他上下看了你一眼，没问你学过什么，只说了一句：</p>
      <p><em>「来了就先看。别急着动手。」</em></p>
      <p>公司划出一亩试验田，让你从头跟一季。<em>种成什么样，你自己负责。</em></p>
    </div>
    ${ctx.攒下来(ctx.S)}
    <button class="go" onclick="startGame()">下 田</button>
    <button class="go sm ghost" onclick="openPractice()">突 发 事 件 练 习</button>
    <button class="go sm ghost" onclick="openBook('封面')">看 看 攒 下 的 东 西</button>
    <p class="foot">八 个 节 气 　·　验 米 　·　卖 米</p>
  </div>`;
};

// 攒下来：保留原玩法的计算或流程。
ctx.攒下来 = function (S?: any) {
    if ((S.季 || 1) < 2)
        return "";
    const keys: any = Object.keys(ctx.CODEX);
    const 认得: any = keys.filter((k?: any) => S.codex[k]).length;
    const 成就: any = ctx.ACH.filter((a?: any) => S.ach[a.id]).length;
    const 金: any = ctx.ACH.filter((a?: any) => (a.级 || "铜") === "金" && S.ach[a.id]).length;
    const 金总: any = ctx.ACH.filter((a?: any) => (a.级 || "铜") === "金").length;
    return `<div class="kan">
    <span class="k">这 一 季 开 局 带 着 的</span>
    <b>田里的毛病，你认得 ${认得} / ${keys.length} 样</b>
    <p>认出来一次就忘不掉。再碰上，白送你一条线索，只送一条，
    剩下两条还得自己蹲下去看。</p>
    <b>成就 ${成就} / ${ctx.ACH.length} 块，其中金牌 ${金} / ${金总}</b>
    <p>上一季的收成扣掉花销，两成留下来做了这一季的本钱；
    在田里练出来的力气，也带过来了一点。</p>
  </div>`;
};

// viewStation：保留原玩法的计算或流程。
ctx.viewStation = function () {
    const 项: any = [["土地使用费", 1242], ["实验站管理费", 500], ["试验地附属设施使用费", 500], ["环境卫生耗材费", 220]];
    const 行: any = 项.map(([k, v]: any) => '<div class="li"><span class="k">' + k
        + '</span><span class="v">' + v + '</span></div>').join("");
    return `<div class="pull">
    <p class="lead2">站 里 的 账</p>
    <h2 class="term">先交钱，后拿地</h2>
    <p class="brief">上庄实验站。地是人家的，你在这儿种一亩，
      一年的固定开销是这些 —— 站里的公开收费标准，一分不少。</p>
    <div class="ledger">
      ${行}
      <div class="li sub"><span class="k">小计</span><span class="v">${ctx.NUM.站里年费} 元</span></div>
    </div>
    <p class="brief" style="margin-top:16px">还没下种，就先欠着这么多。
      这笔钱你出不起 —— 一年的本钱拢共 ${ctx.NUM.本钱} 元。
      所以它得有个来源。</p>
    <p class="grade-note" style="color:#7d8a6e;font-size:14.5px;margin:2px 0 0">
      农忙那几天要人，站里也管：请一趟机器 ${ctx.NUM.站里农机} 元，
      雇一个人一天 ${ctx.NUM.站里临工} 元。贵不贵，等你忙不过来那天才知道。</p>
    <div class="spacer"></div>
    <button class="go" onclick="定账(0)">挂 在 老 师 的 课 题 下 面
      <span class="cost">他出钱，你每季交一份数据</span></button>
    <button class="go sm ghost" onclick="定账(1)">自 己 扛
      <span class="cost">谁也不欠，每年划走 ${ctx.NUM.站里年费} <i class="hard">元</i></span></button>
  </div>`;
};

// viewPull：保留原玩法的计算或流程。
ctx.viewPull = function () {
    return `<div class="pull">
    <p class="lead2">今 年 的 天</p>
    ${ctx.年景卡(ctx.S.年景)}
    ${ctx.带过来(ctx.S)}
    <p class="grade-note" style="color:#7d8a6e;font-size:14.5px;margin:2px 0 0">
      这一季就这个天。先看清楚，再决定怎么种，天改不了，怎么应对是你的事。</p>
  </div>
  <div class="spacer"></div>
  <button class="go" onclick="去站里()">看 看 田 里</button>`;
};

// 推演屏：保留原玩法的计算或流程。
ctx.推演屏 = function (e?: any) {
    const d: any = ctx.S.节气[Math.min(ctx.S.termIndex, ctx.S.节气.length - 1)];
    const 末: any = ctx.事件位 + 1 < ctx.pendingEvents.length ? "还 有 一 件" : "继 续";
    const 头: any = `${ctx.hud(true)}
    <div class="step">第 ${ctx.S.termIndex + 1} / ${ctx.S.节气.length} 个节气</div>
    <h2 class="term">${d.term}<small>${d.date}</small></h2>`;
    if (e.推演 === "等") {
        return `${头}<div class="spacer"></div>
      <div class="tuiyan"><span class="ty-tag">账 本 上 没 有 这 一 页</span>
        <p class="ty-wait"><i>把 这 一 季 做 过 的 事 过 一 遍 ……</i></p>
      </div><div class="spacer"></div>
      <button class="go" onclick="nextEvent()">${末}</button>`;
    }
    const 演: any = e.演 || {};
    const 负: any = Object.keys(e.delta).some((k?: any) => e.delta[k] < 0);
    const dt: any = ctx.deltaText(e.delta);
    const 依据: any = (演.依据 || []).map((x?: any) => `<li><b>${ctx.esc(x.id)}</b><br>${ctx.esc(x.摘)}</li>`).join("");
    return `${头}<div class="spacer"></div>
    <div class="tuiyan">
      <span class="ty-tag">账 本 上 没 有 这 一 页</span>
      <p class="ty-see">${ctx.重(演.看见 || "")}</p>
      ${演.推演 ? `<p class="ty-why">${ctx.重(演.推演)}</p>` : ""}
      ${dt ? `<div style="margin-top:11px"><span class="dl ${负 ? "neg" : "pos"}">${dt}</span></div>` : ""}
      ${演.显形 ? `<span class="ty-when">这一笔要到 <b>${ctx.esc(演.显形)}</b> 才看得全</span>` : ""}
      ${依据 ? `<details class="ty-src"><summary>它凭这几条推的（${演.依据.length} 条）</summary><ul>${依据}</ul></details>` : ""}
    </div><div class="spacer"></div>
    <button class="go" onclick="nextEvent()">${末}</button>`;
};

// viewEvent：保留原玩法的计算或流程。
ctx.viewEvent = function () {
    const e: any = ctx.pendingEvents[ctx.事件位];
    if (!e)
        return "";
    if (e.推演)
        return ctx.推演屏(e);
    const d: any = ctx.S.节气[Math.min(ctx.S.termIndex, ctx.S.节气.length - 1)];
    const 负: any = Object.keys(e.delta).some((k?: any) => e.delta[k] < 0);
    const dt: any = ctx.deltaText(e.delta);
    const 标: any = e.from && e.from[0] === "年景" ? `今 年 的 天 · ${ctx.S.年景.签 || ""}`
        : e.家常 ? "吃 饭 了"
            : e.mood === "good" ? "有 回 响" : "出 事 了";
    const 多: any = ctx.pendingEvents.length > 1
        ? ` · 这个节气第 ${ctx.事件位 + 1} 件，共 ${ctx.pendingEvents.length} 件` : "";
    const 末: any = ctx.事件位 + 1 < ctx.pendingEvents.length ? "还 有 一 件" : "继 续";
    const 头: any = `${ctx.hud(true)}
    <div class="step">第 ${ctx.S.termIndex + 1} / ${ctx.S.节气.length} 个节气${多}</div>
    <h2 class="term">${d.term}<small>${d.date}</small></h2>`;
    if (!e.诊) {
        return `${头}<div class="spacer"></div>
      <div class="event ${e.mood}">
        <span class="tag">${标}</span>
        <p>${ctx.重(e.line)}</p>
        ${dt ? `<span class="dl ${负 ? "neg" : "pos"}">${dt}</span>` : ""}
        ${e.from ? `<span class="from">这笔账来自 <b>${e.from.join(" ")}</b></span>` : ""}
      </div>${ctx.查块(e.查)}<div class="spacer"></div>
      <button class="go" onclick="nextEvent()">${末}</button>`;
    }
    const z: any = e.诊;
    const 能: any = z.步.map((s?: any, i?: any) => ({ s, i })).filter((x?: any) => !z.点过[x.i]);
    const 够: any = z.值 >= z.成;
    const 完: any = z.完 || 够 || !能.length;
    const 看见: any = `<div class="kan"><span class="k">${z.岔 ? "这 么 档 子 事" : "田 里 是 什 么 样"}</span><p>${ctx.重(e.line)}</p></div>`;
    const 事件题: any = z.岔 && z.题
        ? `<h3 class="title" style="font-size:19px">${ctx.esc(z.题)}</h3>` : "";
    const 线索: any = z.得.length
        ? `<div class="zh">${z.得.map((x?: any) => `<div class="cond${x.定 ? " 定" : ""}"><span class="wh">${ctx.esc(x.wh)}</span>${ctx.重(x.得)}${x.定 ? '<span class="ding">这 一 处 够 了</span>' : ""}</div>`).join("")}</div>`
        : "";
    const 有定案: any = 能.some((x?: any) => (x.s.问周 ? z.成 : (x.s.值 === undefined ? 1 : x.s.值)) >= z.成);
    const 提点: any = 够 ? ""
        : z.成 === 1 ? "这毛病扎眼，找对地方，一眼就认得出来。"
            : 有定案 ? (z.得.length
                ? "还差一点。剩这几处里，说不定有一处就够。"
                : "说不定一处就够，看你找的是不是那一处。")
                : (z.得.length
                    ? "看了一处，可光一处说不准，得两处对起来看。"
                    : "这毛病光看一处说不准，得两处对起来看。");
    const 提点全: any = 提点 && z.熟 ? "上季你认过它。" + 提点 : 提点;
    if (!完) {
        return `${头}
      <h3 class="title" style="font-size:19px">${ctx.esc(z.题 || "这是怎么了")}</h3>
      ${看见}${线索}
      <p class="brief">光站在田埂上看不出来。你打算怎么办？</p>
      <div class="spacer"></div>
      ${能.map((x?: any) => `<button class="btn" onclick="onDiag(${x.i})">${ctx.重(x.s.text)}
        <span class="cost">${x.s.费 ? `花 ${x.s.费} 点体力` : "不费什么"}${x.s.收 ? "　·　这一条看过就算完了" : ""}</span></button>`).join("")}
      <p class="tianhint">${提点全}</p>
      <div class="spacer"></div>`;
    }
    if (够) {
        const c: any = ctx.CODEX[z.名];
        const 结: any = z.岔 ? "" : `<div class="zh"><div class="got">
      <span class="lb">你 认 出 来 了</span>
      <span class="nm">${ctx.esc(z.名)}</span>
      ${c ? `<p><b style="font-weight:600">书上说</b>　${ctx.重(c[1])}</p>` : ""}
      ${z.白 ? `<p><b style="font-weight:600">说白了</b>　${ctx.重(z.白)}</p>` : ""}
    </div></div>`;
        if (z.治) {
            const t: any = z.治, d2: any = ctx.deltaText(t.delta);
            return `${头}${事件题}${看见}${线索}${结}
        <div class="event ${z.岔 ? "" : (t.好 ? "good" : "bad")}">
          <span class="tag">${z.岔 ? "你 拿 了 主 意" : "你 动 手 了"}</span>
          <p>${ctx.说文(t.反应) || ctx.重(t.说)}</p>
          ${d2 ? `<span class="dl ${t.好 ? "pos" : "neg"}">${d2}</span>` : ""}
        </div><div class="spacer"></div>
        <button class="go" onclick="nextEvent()">${末}</button>`;
        }
        const 处: any = z.处置 || [];
        if (!处.length) {
            return `${头}${看见}${线索}${结}<div class="spacer"></div>
        <button class="go" onclick="nextEvent()">${末}</button>`;
        }
        return `${头}${事件题}${看见}${线索}${结}
      <p class="brief">${ctx.esc(z.问 || "知道是什么了。这一手还救不救得回来，你得拿个主意。")}</p>
      <div class="spacer"></div>
      ${处.map((o?: any, i?: any) => {
            if (!ctx.开着(o, ctx.S))
                return "";
            const 小: any = ctx.小字文(o, ctx.S);
            const 费: any = ctx.算数(o.费, ctx.S), 钱: any = ctx.算数(o.钱, ctx.S);
            return `<button class="btn" onclick="onTreat(${i})">${ctx.重(o.text)}
        <span class="cost">${[费 ? `花 ${费} 点体力` : "", 钱 ? `掏 ${ctx.yuan(钱)} 元` : ""].filter(Boolean).join("　·　") || "不费什么"}</span>${小 ? `<span class="cost" style="color:var(--dim);opacity:.8">${ctx.esc(小)}</span>` : ""}</button>`;
        }).join("")}
      ${(() => {
            const 行: any = 处.map((o?: any, i?: any) => ctx.开着(o, ctx.S) ? "" : (() => {
                const 因: any = typeof o.锁说 === "function" ? o.锁说(ctx.S) : o.锁说;
                return `<div class="lk"><b>${ctx.重(o.text)}</b><span>${ctx.esc(因 || "还差一步")}</span></div>`;
            })()).join("");
            return 行 ? `<div class="locks">${行}</div>` : "";
        })()}
      <div class="spacer"></div>`;
    }
    return `${头}${看见}${线索}
    <div class="zh"><div class="blind">你在田里转了两圈，蹲下去又站起来，还是没看出这是个什么。
      该记的账还是记上了，只是你到现在也不知道，那是什么。</div></div>
    <div class="spacer"></div>
    <button class="go" onclick="nextEvent()">${末}</button>`;
};

// viewDecision：保留原玩法的计算或流程。
ctx.viewDecision = function () {
    const d: any = ctx.S.节气[ctx.S.termIndex];
    if (ctx.大田屏(d))
        return ctx.田里点(d);
    const buttons: any = ctx.有位(d).map((i?: any) => {
        const o: any = d.options[i];
        const 缺口: any = Math.max(0, o.stam - ctx.S.stamina);
        const 钱: any = o.cost + 缺口 * ctx.NUM.雇工价;
        const bits: any = [`${o.stam} 点体力`];
        if (缺口 > 0)
            bits.push(`自己干不完，雇 ${缺口} 个人工 <i class="hard">+${ctx.yuan(缺口 * ctx.NUM.雇工价)} 元</i>`);
        if (o.cost > 0)
            bits.push(`花 <i>${ctx.yuan(o.cost)} 元</i>`);
        return `<button class="btn" onclick="onChoose(${i})">
      ${ctx.esc(o.text)}<span class="cost">${bits.join("　·　")}</span>${ctx.注文(o, ctx.S)}${ctx.方向文(o, ctx.S)}</button>`;
    }).join("");
    return `${ctx.hud(true)}
    <div class="step">第 ${ctx.S.termIndex + 1} / ${ctx.S.节气.length} 个节气</div>
    <h2 class="term cmp">${d.term}<small>${d.date}</small></h2>
    <h3 class="title cmp">${ctx.esc(d.title)}</h3>
    ${ctx.说话(d)}
    <p class="brief cmp">${ctx.esc(d.brief)}</p>
    <div class="spacer"></div>${buttons}${ctx.锁条(d)}<div class="spacer"></div>`;
};

// 田里单：保留原玩法的计算或流程。
ctx.田里单 = function (d?: any) {
    const 行: any = (d.options || []).map((o?: any, i?: any) => {
        const h: any = d.热区[i] || {};
        const 标: any = h.标 || o.text || "";
        if (ctx.开着(o, ctx.S)) {
            const 注: any = ctx.小字文(o, ctx.S);
            const 全: any = (o.text && o.text !== 标)
                ? `<span class="full">${ctx.esc(o.text)}</span>` : "";
            const 尾: any = `${注 ? ctx.esc(注) : ""}${ctx.方向文(o, ctx.S)}`;
            return `<button class="r" onclick="onHot(${i})"><b><em>${ctx.圈码(i)}</em>${ctx.esc(标)}</b>${全}${尾 ? `<i>${尾}</i>` : ""}</button>`;
        }
        const 因: any = typeof o.锁说 === "function" ? o.锁说(ctx.S) : o.锁说;
        return `<div class="r lk"><b><em>${ctx.圈码(i)}</em>${ctx.esc(标)}</b><i>${ctx.esc(因 || "还差一步")}</i></div>`;
    }).join("");
    return `<div class="roster">${行}</div>`;
};

// 锁条：保留原玩法的计算或流程。
ctx.锁条 = function (d?: any) {
    const 锁: any = ctx.锁着(d);
    if (!锁.length)
        return "";
    const 行: any = 锁.map((i?: any) => {
        const o: any = d.options[i];
        const 因: any = typeof o.锁说 === "function" ? o.锁说(ctx.S) : o.锁说;
        return `<div class="lk"><b>${ctx.esc(o.text)}</b><span>${ctx.esc(因 || "还差一步")}</span></div>`;
    }).join("");
    const 全是灵: any = 锁.every((i?: any) => d.options[i].要灵);
    const 全是开: any = 锁.every((i?: any) => d.options[i].开);
    const 题: any = 全是灵 ? "翻过书，才想得起这几手" : 全是开 ? "还有几条路，你还没走到" : "还有几条路，你还没走到";
    return `<div class="locks">${行}</div>`;
};

// 田里点：保留原玩法的计算或流程。
ctx.田里点 = function (d?: any) {
    const 点: any = (d.options || []).map((o?: any, i?: any) => {
        const h: any = d.热区[i] || {};
        const 左: any = h.x / 320 * 100, 上: any = h.y / 140 * 100;
        if (!ctx.开着(o, ctx.S))
            return `<button class="hot lk"
        style="left:${左.toFixed(2)}%;top:${上.toFixed(2)}%"
        onclick="onLock(${i})" aria-label="${ctx.esc(o.text)}"><span class="dot"></span></button>`;
        const 缺口: any = Math.max(0, o.stam - ctx.S.stamina);
        const bits: any = [`${o.stam} 体力`];
        if (缺口 > 0)
            bits.push(`雇工 +${ctx.yuan(缺口 * ctx.NUM.雇工价)}`);
        if (o.cost > 0)
            bits.push(`${ctx.yuan(o.cost)} 元`);
        const 靠右: any = h.x > 210, 靠左: any = h.x < 90;
        const 抬: any = h.抬 ? "translateY(-20px)" : "";
        const 位: any = 靠右 ? `right:calc(50% + 6px);transform:${抬}`
            : 靠左 ? `left:calc(50% + 6px);transform:${抬}`
                : `left:50%;transform:translateX(-50%) ${抬}`;
        return `<button class="hot" style="left:${左.toFixed(2)}%;top:${上.toFixed(2)}%"
        onclick="onHot(${i})" aria-label="${ctx.esc(o.text)}">
      <span class="bub ${靠右 ? "r" : 靠左 ? "l" : "c"}" style="${位}"><b><em>${ctx.圈码(i)}</em>${ctx.esc(h.标)}</b><i>${bits.join(" · ")}${ctx.方向文(o, ctx.S)}</i></span>
      ${h.画 ? "" : `<span class="dot"></span>`}</button>`;
    }).join("");
    return `${ctx.hud(false)}
    <div class="bigfield">${ctx.田的画(ctx.S)}${点}</div>
    <p class="tsay"><span class="wh">田 里 的 样 子</span>${ctx.esc(ctx.田的样子(ctx.S))}</p>
    <div class="step">第 ${ctx.S.termIndex + 1} / ${ctx.S.节气.length} 个节气</div>
    <h2 class="term cmp">${d.term}<small>${d.date}</small> · ${ctx.esc(d.title)}</h2>
    ${ctx.说话(d)}
    <p class="brief cmp">${ctx.esc(d.brief)}</p>
    <p class="tianhint">田里的 ①②③ 和下面这张单子是同一批事，点哪个都一样。</p>
    ${ctx.田里单(d)}
    <div class="spacer"></div>`;
};

// viewResult：保留原玩法的计算或流程。
ctx.viewResult = function () {
    const d: any = ctx.S.节气[ctx.S.termIndex], R: any = ctx.lastResult;
    const 大: any = ["harvest", "quality", "ecology"].filter((k?: any) => R.delta[k]).map((k?: any, n?: any) => {
        const v: any = R.delta[k];
        return `<div class="dl-big ${v > 0 ? "u" : "d"}" style="animation-delay:${n * .08}s">
      <b>${v > 0 ? "+" : ""}${v}</b><span>${ctx.LABEL[k]}${ctx.UNIT[k]}</span></div>`;
    }).join("");
    const 体: any = R.体力前 - R.体力;
    const 有念: any = !!(R.查 && R.查.灵 && !ctx.S.灵感[R.查.灵]);
    const 够力: any = ctx.S.stamina >= ctx.NUM.灵感体力线;
    const 夜话: any = !R.查 ? " · 今天这一手，书上没有对应的那一页"
        : !有念 ? (够力 ? " · 这事儿上回翻到过，今晚顶多再抄一遍"
            : " · 精神不够，翻不出念头")
            : 够力 ? " · 今天这事儿，我好像在哪儿看过"
                : " · 今天这事儿我好像在哪儿看过，可就这点精神，怕是熬不出来";
    const 花: any = [];
    if (R.花销)
        花.push(`花 ${ctx.yuan(R.花销)} 元`);
    if (R.雇工费)
        花.push(`自己干不动，请了 ${R.缺口} 个人工，${ctx.yuan(R.雇工费)} 元`);
    if (体)
        花.push(`出力 ${体} 点`);
    const 大田: any = ctx.大田屏(d);
    return `${ctx.hud(大田 ? false : undefined)}
    ${大田 ? `<div class="bigfield">${ctx.田的画(ctx.S)}</div>
      <p class="tianhint" style="margin:2px 0 12px">田还摆在这儿，是让你回头看一眼这一手干了什么。这一屏不用点。</p>` : ""}
    <div class="step">${d.term} · ${ctx.esc(d.title)}</div>
    ${大 ? `<div class="deltas">${大}</div>` : ""}
    <p style="font-size:18px;white-space:pre-line">${ctx.esc(R.text)}</p>
    ${R.note ? `<p style="color:var(--dim);font-size:15px">${ctx.esc(R.note)}</p>` : ""}
    ${R.说 ? `<div class="kan">
      <span class="k">这 一 手 跟 什 么 有 关</span>
      <b>${ctx.esc(R.关)}</b>
      <p>${ctx.重(R.说)}</p></div>` : ""}
    ${花.length ? `<p style="color:var(--clay);font-size:14.5px;margin:14px 0 0">
      ${花.join("　·　")}　·　本季已投入 ${ctx.yuan(ctx.S.cost)} 元</p>` : ""}
    <div class="spacer"></div>
    <p class="tianhint">天 黑 了 · 宿 舍 · 熄 灯 前</p>
    <button class="go" onclick="onNight('读')">翻 翻 书
      <small>翻到半夜 · 今晚只回 ${ctx.NUM.翻书恢复} 点体力${夜话}</small></button>
    <button class="go sm ghost" style="margin-top:10px" onclick="onNight('睡')">倒 头 就 睡
      <small>今晚回 ${ctx.NUM.睡觉恢复} 点体力${有念 ? " · 那点念头，只好先放着" : " · 什么也不多"}</small></button>`;
};

// 法块文：保留原玩法的计算或流程。
ctx.法块文 = function () {
    const 条: any = Object.keys(ctx.S.说法 || {}).length;
    const 开: any = ctx.书门(ctx.S), 总: any = ctx.书门总数();
    const 没这条: any = { ...ctx.S.说法 };
    if (ctx.S.新说法)
        delete 没这条[ctx.S.新说法];
    const 门前: any = ctx.书门({ 说法: 没这条 });
    const 新开: any = (ctx.S.新说法 ? 开 : []).filter((x?: any) => !门前.includes(x));
    const 新件: any = 新开.map((a?: any) => ctx.随机池.find((e?: any) => e.书 && e.at === a)).filter(Boolean);
    const 进度: any = `从种下到开镰，一共有 ${总} 处地方用得上抄来的话。` +
        `本子上 ${条} 条，已经开了 ${开.length} 处。`;
    if (ctx.S.新说法)
        return `<div class="fa"><span class="k">抄 在 本 子 上 了</span>
      <b>${ctx.esc(ctx.S.新说法)}</b>
      ${新件.map((x?: any) => `<span class="where">这条用得上。${ctx.esc(x.书说)}</span>`).join("")}
      <span class="where">${进度}</span></div>`;
    const 法: any = ctx.S.待查 && ctx.S.待查.法;
    if (!法)
        return "";
    return `<div class="fa 旧"><span class="k">这 条 早 就 抄 过 了</span>
      <b>${ctx.esc(法)}</b>
      <span class="where">${进度}</span></div>`;
};

// viewNote：保留原玩法的计算或流程。
ctx.viewNote = function () {
    const d: any = ctx.S.节气[ctx.S.termIndex];
    const 灵: any = ctx.S.新灵感 ? ctx.灵感[ctx.S.新灵感] : null;
    const 欠: any = !灵 && ctx.S.待查 && ctx.S.待查.灵;
    const 法块: any = ctx.法块文();
    const 批块: any = (ctx.S.新批注 !== null && ctx.S.新批注 !== undefined && ctx.边批[ctx.S.新批注])
        ? `<div class="pi"><span class="k">页 边 有 铅 笔 字</span>
        <p>${ctx.esc(ctx.边批[ctx.S.新批注])}</p></div>` : "";
    const 旁: any = 灵
        ? `<div class="ling"><span class="k">脑 子 里 多 出 个 念 头</span>
        <p>${ctx.重(灵.得)}</p>
        <span class="where">等 ${灵.落} 那一天，田里会多出一处你能点的东西。</span></div>`
        : 欠
            ? `<div class="ling 欠"><span class="k">今 晚 翻 不 动</span>
        <p>眼睛在字上走，念头起不来。今天在地里太乏了。</p>
        <span class="where">体力不到 ${ctx.NUM.灵感体力线} 的晚上，翻书只剩字。想熬出东西，白天就得省着点力气。</span></div>`
            : "";
    const 翻空: any = !ctx.S.待查 && !灵 && !法块 && !批块
        ? `<div class="ling 欠"><span class="k">今 晚 翻 空 了</span>
        <p>翻到半夜，没翻出跟今天这一手对得上的那一页。</p>
        <span class="where">书是按"你白天怎么做的"分篇的，不是每一手都有对应的一页。
          睡 觉比翻书多回 ${ctx.NUM.睡觉恢复 - ctx.NUM.翻书恢复} 点体力，往后看一眼结果屏上那行小字再定。</span></div>`
        : "";
    return `${ctx.hud()}
    <div class="step">${d.term} · 宿舍 · 熄灯前</div>
    ${ctx.查块(ctx.S.待查)}${旁}${法块}${批块}${翻空}
    <div class="spacer"></div>
    <button class="go" onclick="onContinue()">${ctx.S.termIndex + 1 >= ctx.S.节气.length ? "收 割" : "睡 了 · 明 天 再 说"}</button>`;
};

// viewMiban：保留原玩法的计算或流程。
ctx.viewMiban = function () {
    const g: any = ctx.miban.grade, 气: any = g.气 || "c";
    const 星数: any = { a: 5, b: 3, c: 1, d: 0 }[气];
    const 位置: any = [[22, 26], [74, 20], [48, 14], [30, 64], [68, 58]];
    const 星: any = 位置.slice(0, 星数)
        .map(([x, y]: any, i?: any) => `<span class="spark" style="left:${x}%;top:${y}%;animation-delay:${.45 + i * .14}s"></span>`).join("");
    const 牌: any = { a: "够 得 上 贡 米", b: "地 头 现 碾 鲜 米", c: "收 粮 等 级", d: "这 一 季 的 米" }[气];
    const bar: any = (k?: any, v?: any) => {
        const pct: any = k === "harvest" ? ctx.clamp((v - 400) / 8, 0, 100) : ctx.clamp(v, 0, 100);
        return `<div style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--dim);margin-bottom:7px">
      <span style="width:34px;flex:none">${ctx.LABEL[k]}</span>
      <span style="flex:1;height:6px;background:#e6e0cf;border-radius:3px;overflow:hidden">
        <span data-w="${pct}%" style="display:block;height:100%;border-radius:3px;width:0;
          background:${气 === "a" ? "var(--gold)" : 气 === "d" ? "#c2a878" : "var(--green)"}"></span></span>
      <span style="width:38px;text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)">${v}${ctx.UNIT[k]}</span></div>`;
    };
    return `<div style="margin:0 0 16px">${ctx.节气条()}</div>
    <div class="step">秋分之后 · 验米</div>
    <div class="grade-wrap ${气}">${星}
      <div class="grade-ico ${气}">${g.ico || ""}</div>
      <div class="grade-name ${气}">${g.名}</div>
      <div class="grade-tag">${牌}</div>
      <p class="praise">${ctx.esc(g.夸)}</p></div>
    <p class="grade-note" style="margin-top:0">${ctx.esc(ctx.miban.眼力)}</p>
    <div style="margin:14px 0 0">${bar("harvest", ctx.S.stats.harvest)}${bar("quality", ctx.S.stats.quality)}${bar("ecology", ctx.S.stats.ecology)}</div>
    <p class="grade-note" style="color:var(--dim)">这个等级决定了你的米按什么价走，${ctx.yuan(g.价)} 元一斤。${ctx.esc(g.口感)}。</p>
    <div class="field" style="margin-top:18px">${ctx.田的画(ctx.S)}<span class="wh">这 一 季 的 田</span>${ctx.esc(ctx.田的样子(ctx.S))}</div>
    ${ctx.S.log.length ? `<h3 class="title" style="font-size:17px">地里的账</h3>
      ${ctx.S.log.map((e?: any) => `<p class="note-line">${ctx.重(e.line)}</p>`).join("")}` : ""}
    <div class="spacer"></div>
    <button class="go" onclick="toChain()">把 粮 拉 回 去</button>`;
};

// viewHangqing：保留原玩法的计算或流程。
ctx.viewHangqing = function () {
    return `<div class="pull">
    <p class="lead2">今 年 的 市</p>
    ${ctx.行情卡(ctx.S.行情)}
    <p class="grade-note" style="color:#7d8a6e;font-size:14.5px;margin:2px 0 0">
      稻子已经收上来了，市什么样，现在才知道。种是一回事，卖是另一回事。</p>
  </div>
  <div class="spacer"></div>
  <button class="go" onclick="toChainGo()">开 磅 秤</button>`;
};

// viewChain：保留原玩法的计算或流程。
ctx.viewChain = function () {
    const 年: any = ctx.链名 === "年话", 链: any = ctx.当前链();
    const step: any = ctx.S.chainIndex || 0, c: any = 链[step];
    if (!c)
        return ctx.viewYearEnd();
    const 取值: any = (v?: any) => typeof v === "function" ? v(ctx.S) : v;
    const 可选: any = (v?: any) => { const x: any = 取值(v); return x == null ? "" : String(x); };
    if (c.推演页)
        return ctx.三产推演屏(c);
    if (c.反应) {
        const 谁: any = 可选(c.反应.谁);
        return `${ctx.hud()}
    <div class="step">${年 ? "转过年来" : ctx.esc(c.term) + " · 收完之后"} 第 ${step + 1} / ${链.length} 步</div>
    <h2 class="term cmp">${ctx.esc(c.term)}<small>${年 ? "转 过 年 来" : "收 完 之 后"}</small></h2>
    <div class="say">${谁 ? `<span class="who">${ctx.esc(谁)}</span>` : ""}<p style="white-space:pre-line">${ctx.esc(可选(c.反应.说))}</p></div>
    <div class="spacer"></div>
    <button class="go" onclick="反应完()">知 道 了</button><div class="spacer"></div>`;
    }
    const buttons: any = c.options.map((o?: any, i?: any) => {
        const 锁: any = o.锁 === true || (typeof o.锁 === "function" && o.锁(ctx.S));
        const 副: any = 可选(o.sub);
        return `<button class="btn${锁 ? " lockbtn" : ""}${o.生成 ? " genbtn" : ""}" ${锁 ? "disabled" : `onclick="onChain(${i})"`}>
      ${ctx.esc(o.text)}${副 ? `<span class="cost">${ctx.esc(副)}</span>` : ""}</button>`;
    }).join("");
    const 谁: any = 可选(c.who);
    return `${ctx.hud()}
    <div class="step">${年 ? "转过年来" : ctx.esc(c.term) + " · 收完之后"} 第 ${step + 1} / ${链.length} 步</div>
    <h2 class="term cmp">${ctx.esc(c.term)}<small>${年 ? "转 过 年 来" : "收 完 之 后"}</small></h2>
    <h3 class="title cmp">${ctx.esc(c.title)}</h3>
    <p class="brief cmp">${ctx.esc(c.brief)}</p>
    ${c.say ? `<div class="say">${谁 ? `<span class="who">${ctx.esc(谁)}</span>` : ""}<p style="white-space:pre-line">${ctx.esc(可选(c.say))}</p></div>` : ""}
    <div class="spacer"></div>${buttons}<div class="spacer"></div>`;
};

// view年话完：保留原玩法的计算或流程。
ctx.view年话完 = function () {
    const 剩: any = ctx.待后话(ctx.S).length;
    const 本趟: any = (ctx.S.年话 || []).length;
    return `${ctx.hud()}
    <div class="step">转过年来</div>
    <h2 class="term cmp" style="font-size:30px">走 完 了<small>转 过 年 来</small></h2>
    <p class="brief cmp">这一趟 ${本趟} 件，都记在账上了。</p>
    <div class="spacer"></div>
    <div class="sf-wrap">
      <div class="sf-tag">这 一 季 到 这 儿</div>
      <div class="sf-name">${剩 ? `还有 ${剩} 件` : "都走完了"}</div>
      <p class="sf-why">${剩 ? `这些是历年攒下的，一季只走一趟。剩下的排在后面几季，跑不了。`
        : `攒下的都走完了。往后还会有新的，一件一件来。`}</p>
    </div>
    <div class="spacer"></div>
    <button class="go" onclick="restart()">再 种 一 季</button>
    <p class="foot">这一季的账早算完了，不用再翻回去看一遍</p>
    <button class="go sm ghost" style="margin-top:10px" onclick="回到账本()">还 是 想 翻 一 眼 账 本</button>`;
};

// 种法：保留原玩法的计算或流程。
ctx.种法 = function (S?: any, r?: any) {
    const 生: any = S.stats.ecology, 毛: any = r.毛收入 || 1;
    const 二产占: any = (r.二产 || 0) / 毛, 一产占: any = (r.一产 || 0) / 毛, 三产占: any = (r.三产 || 0) / 毛;
    const 抄: any = Object.keys(S.说法 || {}).length, 认: any = Object.keys(S.codex || {}).length;
    const 等外: any = r.grade.名 === "等外";
    if (抄 >= 6 && 等外)
        return { 名: "抄 书 的",
            说: `本子上抄了 ${抄} 条，图鉴认下 ${认} 样。可这一季的米卖的是「等外」的价。`
                + `抄下来的那些话，还没落到田里。` };
    if (生 <= 35)
        return { 名: "下 猛 药 的",
            说: `田里挑不出毛病来，因为没剩什么活物。生态 ${生}。`
                + `产量是好看的，这一季也确实是靠产量把钱挣回来的。` };
    const 大: any = Math.max(一产占, 二产占, 三产占);
    if (三产占 === 大 && 三产占 >= .3)
        return { 名: "守 田 的",
            说: `生态 ${生} 撑着，${r.三产说明}。这一季 ${Math.round(三产占 * 100)}% 的进项`
                + `不是从谷子上来的 —— 你是把这一亩当一块地养着，不是当一季庄稼收。` };
    if (二产占 === 大 && 二产占 >= .45)
        return { 名: "卖 米 的",
            说: `谷子进了碾房再出来，价就不是那个价了。这一季 ${Math.round(二产占 * 100)}% 的进项`
                + `是在米上挣的 —— 种得好不好，到最后是碾出来才认。` };
    if (一产占 === 大 && 一产占 >= .55)
        return { 名: "交 粮 的",
            说: `谷子过完磅就拉走了，省心。这一季 ${Math.round(一产占 * 100)}% 的进项是原粮，`
                + `也就是那个价：粮库收多少就是多少，不看你这一年费了多少心。` };
    if ((S.季 || 1) < 2)
        return { 名: "刚 开 张 的",
            说: `第一季。这块地上一回种的人不是你，它的脾气你还没摸出来。`
                + `一亩稻头一年种，这本账本来就难平。` };
    return { 名: "种 地 的",
        说: `没走哪条出奇的路。八个节气一步没落，该薅的薅了，该灌的灌了，`
            + `收上来的也就是这个数。一亩地一年本来就是这样。` };
};

// viewLog：保留原玩法的计算或流程。
ctx.viewLog = function () {
    const 走: any = ctx.S.选择 || [];
    let 上段: any = null;
    const 行: any = 走.map((c?: any, i?: any) => {
        const 段: any = c.阶段 && c.阶段 !== 上段 ? c.阶段 : null;
        if (c.阶段)
            上段 = c.阶段;
        const dl: any = Object.keys(c.delta || {}).filter((k?: any) => c.delta[k])
            .map((k?: any) => `<span class="${c.delta[k] > 0 ? "p" : "m"}">${ctx.LABEL[k]} ${c.delta[k] > 0 ? "+" : ""}${c.delta[k]}${ctx.UNIT[k]}</span>`).join("　");
        const 花: any = [];
        if (c.cost)
            花.push(`${ctx.yuan(c.cost)} 元`);
        if (c.雇工费)
            花.push(`雇工 ${ctx.yuan(c.雇工费)} 元`);
        花.push(`${c.体力前 - c.体力} 点体力`);
        return `${段 ? `<div class="ph">${ctx.esc(ctx.段带白(段))}</div>` : ""}<div class="it">
      <div class="hd"><b>${ctx.esc(c.term)}</b><s>${ctx.esc(c.title)}</s>
        <em>第 ${i + 1} 步${花.length ? "　·　" + 花.join("　") : ""}</em></div>
      <p class="tx">${ctx.esc(c.text)}</p>
      ${dl ? `<div class="dl">${dl}</div>` : ""}</div>`;
    }).join("");
    return `<div class="step">这 一 季 走 到 哪 儿 了</div>
    ${ctx.年景卡(ctx.S.年景)}
    ${走.length ? `<div class="lg">${行}</div>`
        : `<p style="color:var(--dim);font-size:15px">还没动手。第一手之前，田里什么都还没发生。</p>`}
    <div class="acc">
      账　已投入 <b>${ctx.yuan(ctx.S.cost)}</b> 元　·　手头现金 <b>${ctx.yuan(Math.round(ctx.S.现金))}</b> 元<br>
      力气　还剩 <b>${ctx.S.stamina}</b> 点　·　后面还有 <b>${Math.max(0, ctx.S.节气.length - ctx.S.termIndex - 1)}</b> 个节气<br>
      本子　抄了 <b>${Object.keys(ctx.S.说法 || {}).length}</b> 条说法${Object.keys(ctx.S.说法 || {}).length ? `　·　最近一条是「${ctx.esc(Object.keys(ctx.S.说法).pop())}」` : "　·　翻翻书就有了"}
    </div>
    <div class="spacer"></div>
    <button class="go sm ghost" onclick="openBook('田')">看 看 攒 下 的 东 西</button>
    <button class="go sm ghost" onclick="closeLog()">回 去</button>`;
};

// 关键两手：保留原玩法的计算或流程。
ctx.关键两手 = function (S?: any) {
    const 分: any = (e?: any) => Object.keys(e.delta)
        .reduce((a?: any, k?: any) => a + (k === "harvest" ? e.delta[k] * 0.12 : e.delta[k] * 1.6), 0);
    const 有: any = S.log.filter((e?: any) => e.from && e.from.length);
    if (有.length < 2)
        return null;
    const 排: any = 有.slice().sort((a?: any, b?: any) => 分(a) - 分(b));
    const 坑: any = 排[0], 赚: any = 排[排.length - 1];
    const 因: any = (e?: any) => e.from.filter((x?: any) => x !== "＋").join("　→　");
    return { 坑: 分(坑) < -1.2 ? { 因: 因(坑), e: 坑 } : null,
        赚: 分(赚) > 1.2 ? { 因: 因(赚), e: 赚 } : null };
};

// viewYearEnd：保留原玩法的计算或流程。
ctx.viewYearEnd = function () {
    const r: any = ctx.result, 评: any = ctx.评等级(r.净收益), 两手: any = ctx.关键两手(ctx.S), 种: any = ctx.种法(ctx.S, r);
    const 星数: any = { a: 5, b: 3, c: 1, d: 0 }[评.气] || 0;
    const 星位: any = [[22, 26], [74, 20], [48, 14], [30, 64], [68, 58]];
    const 星: any = 星位.slice(0, 星数)
        .map(([x, y]: any, i?: any) => `<span class="spark" style="left:${x}%;top:${y}%;animation-delay:${.45 + i * .14}s"></span>`).join("");
    const 源: any = [
        { 名: "一产 · 卖原粮", v: r.一产, 色: "var(--green)" },
        { 名: "二产 · 礼盒", v: r.礼盒钱, 色: "var(--gold)" },
        { 名: "二产 · 自己拉进城", v: r.直销钱, 色: "#9e5a35" },
        { 名: "二产 · 深加工", v: r.加工钱, 色: "#5f5142" },
        { 名: "三产 · " + r.三产说明.split("，")[0], v: r.三产, 色: "var(--clay)" },
        { 名: "政策 · 粮补", v: r.补贴, 色: "#a8a294" },
    ].filter((x?: any) => x.v > 0);
    const 总: any = 源.reduce((a?: any, x?: any) => a + x.v, 0) || 1;
    const 条: any = 源.map((x?: any) => `<span style="width:${(x.v / 总 * 100).toFixed(1)}%;background:${x.色}"></span>`).join("");
    const 图例: any = 源.map((x?: any) => `<div class="mix-li">
      <span class="dot" style="background:${x.色}"></span>
      <span class="nm">${ctx.esc(x.名)}</span>
      <span class="amt">${ctx.yuan(x.v)} 元</span>
      <span class="pc">${(x.v / 总 * 100).toFixed(0)}%</span></div>`).join("");
    const 二产脚注: any = [
        r.直销钱 > 0 && r.直 && r.直 !== "敲门"
            ? "走法：" + (r.直 === "摆摊" ? "摆摊" : "跑饭馆") : "",
        r.礼盒上限 && r.礼盒量 < r.礼盒上限
            ? (r.礼盒量 ? `礼盒装了 ${ctx.yuan(r.礼盒量)} 斤，本来装得下 ${ctx.yuan(r.礼盒上限)} 斤`
                : `礼盒本来装得下 ${ctx.yuan(r.礼盒上限)} 斤，一斤没装`)
            : "",
    ].filter(Boolean).join("　·　");
    const li: any = (k?: any, v?: any, 类?: any) => `<div class="li${类 ? " " + 类 : ""}"><span class="k">${k}</span><span class="v">${v}</span></div>`;
    const 二产本钱: any = (r.包装费 || 0) + (r.加工费 || 0);
    const 二产本钱明细: any = [r.包装费 ? "包装 " + ctx.yuan(r.包装费) : "",
        r.加工费 ? "加工 " + ctx.yuan(r.加工费) : ""].filter(Boolean).join(" ＋ ");
    const 序: any = { 金: 0, 银: 1, 铜: 2 };
    const 牌: any = ctx.newAch.slice().sort((a?: any, b?: any) => 序[a.级] - 序[b.级]);
    const ach: any = 牌.length ? `<h3 class="title" style="font-size:17px">这一季，你得了 ${牌.length} 块牌子</h3>
    ${牌.map((a?: any, i?: any) => `<div class="ach ${a.级}" style="animation-delay:${i * .07}s">
      <span class="d">${a.级}</span><div><b>${ctx.esc(a.名)}</b><span>${ctx.esc(a.说)}</span></div></div>`).join("")}`
        : `<h3 class="title" style="font-size:17px">这一季，没有牌子</h3>
       <p class="grade-note" style="margin-top:0">走了一条没人走过的路，下一季换个走法试试。</p>`;
    return `<div style="margin:0 0 16px">${ctx.节气条()}</div>
    <div class="step">年终 · 账本</div>
    <h2 class="term" style="font-size:30px">一季的账<small>一 亩 地</small></h2>

    <div class="yearend-wrap ${评.气}">${星}
      <div class="yr-name ${评.气}">${评.名}</div>
      <div class="yr-tag">这 一 季 的 收 成</div>
      <p class="praise">${ctx.esc(评.说)}</p>
    </div>

    <div class="sf-wrap">
      <div class="sf-tag">这 一 季 是 个 什 么 种 法</div>
      <div class="sf-name">${ctx.esc(种.名)}</div>
      <p class="sf-why">${ctx.esc(种.说)}</p>
    </div>

    <div class="netbig ${r.净收益 >= 0 ? "u" : "d"}">
      <span class="k">净 收 益</span>
      <b data-count="${r.净收益}">0</b><i>元</i>
      <span class="sub">毛收入 ${ctx.yuan(r.毛收入)} 元　－　本季投入 ${ctx.yuan(r.成本)} 元</span>
    </div>

    <h3 class="title" style="font-size:17px">钱是从哪条路上来的</h3>
    <div class="mixbar" data-wipe>${条}</div>
    <div class="mix">${图例}${二产脚注 ? `<p class="mix-note">${ctx.esc(二产脚注)}</p>` : ""}</div>

    ${两手 ? `<h3 class="title" style="font-size:17px">这一季的两个转折</h3>
      <div class="keymoves">
        ${两手.赚 ? `<div class="km u"><span class="tag">最赚的一手</span>
          <b>${ctx.esc(两手.赚.因)}</b><p>${ctx.esc(两手.赚.e.line)}</p></div>` : ""}
        ${两手.坑 ? `<div class="km d"><span class="tag">最亏的一手</span>
          <b>${ctx.esc(两手.坑.因)}</b><p>${ctx.esc(两手.坑.e.line)}</p></div>` : ""}
      </div>` : ""}

    <h3 class="title" style="font-size:17px">底账</h3>
    <div class="ledger">
      ${li("打下来的稻谷 " + ctx.yuan(ctx.S.grain) + " 斤", "折成米 " + ctx.yuan(r.米) + " 斤" + (r.兑米 ? "（认养兑走 " + r.兑米 + " 斤）" : ""))}
      ${li("验米等级 " + r.grade.名, ctx.yuan(r.米价) + " 元/斤")}
      ${li("今年的行情 " + r.行情.名 + (r.行情.原粮 !== 1
        ? "（原粮 " + (r.行情.原粮 > 1 ? "+" : "") + Math.round((r.行情.原粮 - 1) * 100) + "%）" : ""), "牌子撑起 " + Math.round(r.牌 * 100) + "%", "sub")}

      <div class="hr"></div>
      ${r.额外 ? li("大寒 · " + ctx.S.大寒说明, (r.额外 > 0 ? "+" : "") + ctx.yuan(r.额外) + " 元") : ""}
      ${二产本钱 ? li("二产的本钱 · " + 二产本钱明细, "-" + ctx.yuan(二产本钱) + " 元") : ""}
      ${r.站里 ? li("站里的账 · 今年的地租", "-" + ctx.yuan(r.站里) + " 元") : ""}
      ${r.账来源 === "师" ? li("站里的账 · 老师垫的", ctx.yuan(ctx.NUM.站里年费) + " 元，不用你还", "sub") : ""}

      ${li("收完粮之后，手里还剩", ctx.yuan(r.兜里剩) + " 元" + (r.兜里剩 < ctx.NUM.礼盒包装 * 20 ? "（不够再铺一摊了）" : ""), "big")}
    </div>
    ${ach}
    ${ctx.人情账(ctx.S, r)}
    ${ctx.回学校(ctx.S, r)}
    ${ctx.后话(ctx.S, r)}
    ${ctx.继承卡(ctx.S, r)}
    ${ctx.还开着什么(ctx.S)}
    <div class="spacer"></div>
    <button class="go ghost" onclick="restart()">再 种 一 季</button>
    <p class="foot">换个走法，账就不是这个数</p>`;
};

// 人情账：保留原玩法的计算或流程。
ctx.人情账 = function (S?: any, r?: any) {
    const 望: any = r.望 || {};
    const 本: any = 望.本季, 共: any = 望.合计 !== undefined ? 望.合计 : (S.名望 || 0);
    const 三: any = ["周", "陈", "同", "赵", "师", "主", "村", "农", "乙"].map((k?: any) => {
        const 累: any = (S.印象 || {})[k] || 0, 季: any = (S.本季印象 || {})[k] || 0;
        const 宽: any = Math.min(100, Math.round(Math.abs(累) / (ctx.印象上下 || 24) * 100));
        return `<div class="pn2 ${累 >= 8 ? "u" : 累 <= -3 ? "d" : ""}">
        <b>${ctx.人名[k]}</b><i>${累 > 0 ? "+" : ""}${累}</i>
        <span>${ctx.esc(ctx.印象判(累))}</span>${季 ? `<u>本季 ${季 > 0 ? "+" : ""}${季}</u>` : ""}</div>
      <div class="pbar"><i style="width:${宽}%"></i></div>`;
    }).join("");
    return `<div class="kan"><span class="k">人 情 账</span>
    <div class="mz"><b>${Math.round(共)}</b><i>名望</i>
      <em>${本 ? `这一季 ${本 > 0 ? "+" : ""}${Math.round(本)}` : "这一季没动"}</em></div>
    <p>名望是这一带怎么看你。它不换钱，换的是人家肯不肯替你走一趟：
      托人捎个手续、赊一回账、荐个人进去干活、进镇上的门说话。
      攒到哪一档，哪几扇门才开 —— 点上面那个数，能看见现在开着的是哪几扇。
      另外认养和研学的价钱也跟着它走。</p>
    ${三}</div>`;
};

// 继承卡：保留原玩法的计算或流程。
ctx.继承卡 = function (S?: any, r?: any) {
    const 认得: any = Object.keys(S.本季认得 || {});
    const 共: any = Object.keys(ctx.CODEX).filter((k?: any) => S.codex[k]).length;
    const 总: any = Object.keys(ctx.CODEX).length;
    const 认: any = 认得.length
        ? `<b>认得 ${认得.length} 样：${认得.map((k?: any) => ctx.esc(k)).join("　")}</b>`
        : `<b>这一季没认出新东西，田里的毛病，这一季是绕着走的。</b>`;
    const 带: any = 共
        ? `<p>下一季开局，认过的这些还带在身上，再碰上，白送你一条线索。${共 < 总 ? `图鉴 ${共} / ${总}，还差 ${总 - 共} 样。` : "图鉴满了。"}</p>`
        : `<p>田里的毛病，得自己蹲下去看才认得出来。认出来一次，往后就忘不掉。</p>`;
    const 留: any = `<p>手上剩的 ${ctx.yuan(r.兜里剩)} 元，两成跟着进下一季，
    下一季开局本钱 ${ctx.yuan(ctx.NUM.本钱 + Math.min(Math.round(r.兜里剩 * ctx.NUM.带钱比例 / 10) * 10, ctx.NUM.带钱上限))} 元起。
    身体的底子也没白练，下一季多 ${Math.min((S.季 || 1) * ctx.NUM.熟练每季, ctx.NUM.熟练上限)} 点体力。</p>`;
    return `<div class="kan"><span class="k">这 一 季 你 留 下 了 什 么</span>${认}${带}${留}</div>`;
};

// 还开着什么：保留原玩法的计算或流程。
ctx.还开着什么 = function (S?: any) {
    const 季: any = Math.max(1, S.季 || 1);
    const 数词: any = (n?: any) => "一二三四五六七八九十"[n - 1] || String(n);
    const 行: any = [];
    if (季 < ctx.人情线起)
        行.push(`<b>人情线　第 ${ctx.人情线起} 季开</b>
      <p>跟村里几个人把脸撕破，还有家里那本账。
      一季一件，一共${数词(ctx.人情线.length)}件。</p>`);
    if (季 < ctx.感情线起)
        行.push(`<b>感情线　第 ${ctx.感情线起} 季开</b>
      <p>田埂上多出来的那个人。${数词(ctx.感情线.length)}步，一步一步攒出来的。</p>`);
    if (!行.length)
        return "";
    return `<div class="kan"><span class="k">还 有 ${行.length === 2 ? "两" : 数词(行.length)} 条 线 没 开</span>${行.join("")}</div>`;
};

// 带过来：保留原玩法的计算或流程。
ctx.带过来 = function (S?: any) {
    if ((S.季 || 1) < 2)
        return "";
    const 行: any = [];
    if (S.底金 > 0)
        行.push(`<b>上季结余 ${ctx.yuan(ctx.档().存 || 0)} 元，带过来 ${ctx.yuan(S.底金)} 元</b>
      <p>上季剩下的钱，两成跟着你进这一季，已经算在开局本钱里了。
      这一季本钱 ${ctx.yuan(ctx.NUM.本钱 + S.底金)} 元。</p>`);
    if (S.熟练 > 0)
        行.push(`<b>第 ${S.季} 季了，手上的活儿比头一季熟，开局多 ${S.熟练} 点体力</b>
      <p>哪个节气该干什么，不用现琢磨了。省下来的是想事的工夫。</p>`);
    const 认得: any = Object.keys(S.codex).length;
    if (认得)
        行.push(`<b>认得 ${认得} 样，还带在身上</b>
      <p>再碰上，白送你一条线索，只送一条，剩下的还得自己蹲下去看。</p>`);
    if (!行.length)
        return "";
    return `<div class="kan"><span class="k">从 上 一 季 带 过 来 的</span>${行.join("")}</div>`;
};

// 回学校：保留原玩法的计算或流程。
ctx.回学校 = function (S?: any, r?: any) {
    const 级: any = r.grade.名;
    const 王: any = 级 === "特级"
        ? { t: "「这块地能这么种。」带队老师把表推回来，\n「你把过程写下来，下次组会讲一次。」" }
        : 级 === "一级"
            ? { t: "「一级，可以了。」带队老师说，\n「我以为你们下去就是拍拍照，看来不是。」" }
            : r.净收益 >= 15000
                ? { t: "「账算得不错。」带队老师翻了两页，\n「可我更想知道，你那一亩地明年还能不能这么种。」" }
                : r.三产 > 0
                    ? { t: "「你把米卖出去这一手，比米本身有意思。」带队老师说，\n「镇上的公司愁的就是这个。你接着说。」" }
                    : { t: "「第一季，正常。」带队老师把表合上，\n「明年下去，把每天干了什么都记上，这个比最后那个数有用。」" };
    const 留: any = S.stats.ecology >= 65 || r.三产 > 0;
    const 周: any = 留
        ? { t: "老周蹲在田埂上，把最后一捆稻把子码齐。\n「这一亩地，明年还归你。」他说，\n「你要是还来。」" }
        : { t: "老周把锹往肩上一扛，走了两步，回头说：\n「头一年能收回一仓，不赖了。\n我头一年种的，还没你这个数。」" };
    const 校: any = (S.交数 || 0) + (S.缺席 || 0) === 0 ? ""
        : S.缺席 >= ctx.NUM.缺席线
            ? { w: "带队老师 · 办公室", t: `「这一学期你交了 ${S.交数} 回，缺了 ${S.缺席} 回。」
他把表推过来，「数我收下了，缺的那些我也记着。」` }
            : S.缺席 > 0
                ? { w: "带队老师 · 组会前", t: `「交了 ${S.交数} 回，缺了 ${S.缺席} 回。」
他点点头，「还行。缺的那 ${S.缺席} 回，下回补上。」` }
                : { w: "带队老师 · 组会前", t: `「${S.交数} 回，一回没缺。」
他把表夹进本子里，「你那边田里忙，我知道。这份数我留着。」` };
    return `<h3 class="title" style="font-size:17px">收完了，回学校</h3>
    <div class="say"><span class="who">带队老师 · 组会前</span><p style="white-space:pre-line">${ctx.esc(王.t)}</p></div>
    ${校 ? `<div class="say"><span class="who">${ctx.esc(校.w)}</span><p style="white-space:pre-line">${ctx.esc(校.t)}</p></div>` : ""}
    <div class="say"><span class="who">老周 · 田埂上</span><p style="white-space:pre-line">${ctx.esc(周.t)}</p></div>`;
};

// 待后话：保留原玩法的计算或流程。
ctx.待后话 = function (S?: any) {
    return ctx.ECHO.filter((e?: any) => { try {
        return !!e.当(S);
    }
    catch (err: any) {
        return false;
    } })
        .filter((e?: any) => !ctx.已走过(S, e.id))
        .sort((a?: any, b?: any) => b.重 - a.重);
};

// 后话：保留原玩法的计算或流程。
ctx.后话 = function (S?: any, r?: any) {
    const 中: any = ctx.待后话(S);
    if (!中.length)
        return "";
    const 走了: any = ctx.本季走过后话(S);
    const 显: any = 中.slice(0, ctx.后话一屏), 剩: any = 中.length - 显.length;
    const 头: any = 走了
        ? `<h3 class="title" style="font-size:17px">转 过 年 来</h3>
       <p class="grade-note" style="margin:-2px 0 10px">这一季走完了。剩下 ${中.length} 件，排在后面几季。</p>`
        : `<h3 class="title" style="font-size:17px">转 过 年 来</h3>
       <p class="grade-note" style="margin:-2px 0 10px">这些是前几季攒下的，到今天才轮得上。</p>`;
    const 尾: any = 走了 ? "" : `<button class="go" onclick="to年话()">去 走 一 趟</button>`;
    return `${头}
    ${显.map((e?: any, i?: any) => `<div class="say" style="animation-delay:${i * .09}s">
      <span class="who">${ctx.esc(e.谁)}</span>
      <p style="white-space:pre-line">${ctx.esc(ctx.引子(e.说))}</p></div>`).join("")}
    ${!走了 && 剩 ? `<p class="grade-note">还有 ${剩} 件排在后面。</p>` : ""}
    ${尾}`;
};

// 建年话：保留原玩法的计算或流程。
ctx.建年话 = function (S?: any) {
    return ctx.待后话(S).slice(0, ctx.后话一屏).map((e?: any) => ({
        id: e.id, 后话: e,
        term: "年 后", who: e.谁,
        title: e.题 || "转 过 年 来",
        brief: e.引 || "这些是前几季攒下的，到今天才轮得上。",
        say: e.说,
        options: e.问 ? e.问.options
            : [{ text: "知道了", sub: () => "这一趟就到这儿", pick: () => { } }],
    }));
};

// 收年话：保留原玩法的计算或流程。
ctx.收年话 = function (S?: any) {
    const 链: any = S.年话 || [];
    const 见: any = { ...(S.见后话 || {}) };
    链.forEach((c?: any) => { 见[c.id] = S.季 || 1; });
    S.见后话 = 见;
    S.后话趟 = S.季 || 1;
    ctx.存档({ 见后话: 见, 后话趟: S.后话趟, 名望: S.名望 || 0, 存: Math.round(S.现金 || 0),
        印象: { ...(S.印象 || {}) }, 前事: { ...S.flags } });
    const got: any = ctx.结成就(S, null);
    if (got.length)
        ctx.发牌(got);
    return got;
};

// viewBook：保留原玩法的计算或流程。
ctx.viewBook = function () {
    const keys: any = Object.keys(ctx.CODEX);
    const got: any = keys.filter((k?: any) => ctx.S.codex[k]).length;
    const groups: any = ctx.分类.filter((c?: any) => keys.some((k?: any) => ctx.CODEX[k][0] === c));
    let body: any;
    if (ctx.tab === "成就") {
        body = ["金", "银", "铜"].map((级?: any) => {
            const 组: any = ctx.ACH.filter((a?: any) => (a.级 || "铜") === 级);
            if (!组.length)
                return "";
            const 得: any = 组.filter((a?: any) => ctx.S.ach[a.id]).length;
            return `<h3 class="title" style="font-size:15px;letter-spacing:.14em;margin:20px 0 6px">
          <span class="lvdot ${级}"></span>${级}牌 · ${得}/${组.length}</h3>`
                + 组.map((a?: any) => {
                    const has: any = ctx.S.ach[a.id];
                    if (!has)
                        return `<div class="cx lock"><div class="h">
            <u class="ci lock"></u><b>？ ？ ？</b><span class="cat">还没拿到</span></div></div>`;
                    return `<div class="cx"><div class="h">
            <u class="ci">${ctx.鉴图[ctx.鉴类[a.id]] || ""}</u><b>${ctx.esc(a.名)}</b></div>
            <p>${ctx.esc(a.说)}</p></div>`;
                }).join("");
        }).join("");
    }
    else if (ctx.tab === "全部") {
        body = keys.map((k?: any) => {
            const has: any = ctx.S.codex[k], [cat, txt]: any = ctx.CODEX[k];
            return has
                ? `<div class="cx"><div class="h">
            <u class="ci">${ctx.鉴图[ctx.图鉴类[cat]] || ""}</u><b>${k}</b><span class="cat">${cat}</span></div>
            <p>${txt}</p></div>`
                : `<div class="cx lock"><div class="h">
            <u class="ci${ctx.图鉴类[cat] ? "" : " lock"}">${ctx.图鉴类[cat] ? ctx.鉴图[ctx.图鉴类[cat]] : ""}</u>
            <b>？ ？ ？</b><span class="cat">${cat}　还没见过</span></div></div>`;
        }).join("");
    }
    else {
        const 只: any = ctx.tab === "田" ? "田里的" : ctx.tab;
        body = ctx.分类.filter((c?: any) => c === 只).map((c?: any) => {
            const inC: any = keys.filter((k?: any) => ctx.CODEX[k][0] === c);
            if (!inC.length)
                return "";
            return `<h3 class="title" style="font-size:15px;color:var(--dim);letter-spacing:.14em;margin:20px 0 4px">${c}</h3>`
                + inC.map((k?: any) => {
                    const has: any = ctx.S.codex[k];
                    return has
                        ? `<div class="cx"><div class="h">
                <u class="ci">${ctx.鉴图[ctx.图鉴类[c]] || ""}</u><b>${k}</b></div>
                <p>${ctx.CODEX[k][1]}</p></div>`
                        : `<div class="cx lock"><div class="h">
                <u class="ci${ctx.图鉴类[c] ? "" : " lock"}">${ctx.图鉴类[c] ? ctx.鉴图[ctx.图鉴类[c]] : ""}</u>
                <b>？ ？ ？</b><span class="cat">还没见过</span></div></div>`;
                }).join("");
        }).join("");
    }
    const 成就数: any = ctx.ACH.filter((a?: any) => ctx.S.ach[a.id]).length;
    return `<div class="step">这一季记住的东西</div>
    <div class="tabs">
      <button class="${ctx.tab === "田" ? "on" : ""}" onclick="setTab('田')">田里的</button>
      <button class="${ctx.tab === "手上的" ? "on" : ""}" onclick="setTab('手上的')">手上的</button>
      <button class="${ctx.tab === "全部" ? "on" : ""}" onclick="setTab('全部')">全部 ${got}/${keys.length}</button>
      <button class="${ctx.tab === "成就" ? "on" : ""}" onclick="setTab('成就')">成就 ${成就数}/${ctx.ACH.length}</button>
    </div>${body}<div class="spacer"></div>
    <button class="go sm ghost" onclick="backToGame()">${ctx.书来源 === "封面" ? "回 到 封 面" : "回 到 田 里"}</button>`;
};

// render：保留原玩法的计算或流程。
ctx.render = function () {
    ctx.app.innerHTML =
        ctx.screen === "practice" ? ctx.viewPractice() :
            ctx.screen === "cover" ? ctx.viewCover() :
                ctx.screen === "pull" ? ctx.viewPull() :
                    ctx.screen === "站里" ? ctx.viewStation() :
                        ctx.screen === "event" ? ctx.viewEvent() :
                            ctx.screen === "decision" ? ctx.viewDecision() :
                                ctx.screen === "result" ? ctx.viewResult() :
                                    ctx.screen === "note" ? ctx.viewNote() :
                                        ctx.screen === "miban" ? ctx.viewMiban() :
                                            ctx.screen === "hangqing" ? ctx.viewHangqing() :
                                                ctx.screen === "chain" ? ctx.viewChain() :
                                                    ctx.screen === "年话完" ? ctx.view年话完() :
                                                        ctx.screen === "book" ? ctx.viewBook() :
                                                            ctx.screen === "log" ? ctx.viewLog() :
                                                                ctx.viewYearEnd();
    const p: any = ctx.screen === "cover" || ctx.screen === "practice" || ctx.screen === "pull" || ctx.screen === "log" ? 0
        : ctx.screen === "hangqing" ? 8 / 13
            : ctx.screen === "chain" ? (8 + (ctx.S.chainIndex || 0)) / (8 + (ctx.当前链().length || 5))
                : ctx.screen === "年话完" ? 1
                    : ctx.screen === "miban" ? 8 / 12
                        : Math.min(ctx.S.termIndex, 8) / 12;
    ctx.document.getElementById("bar").style.transform = `scaleX(${p})`;
    ctx.showFieldEventResult();
    ctx.起动画();
    if (ctx.不滚)
        ctx.不滚 = false;
    else {
        ctx.window.scrollTo(0, 0);
        try {
            const 排: any = ctx.app.querySelectorAll(".btn, .go");
            const 末: any = 排[排.length - 1];
            const 视: any = ctx.window.innerHeight;
            if (末 && 视 > 0) {
                const 底: any = 末.getBoundingClientRect().bottom;
                if (底 > 视 - 10)
                    ctx.window.scrollTo(0, Math.min(底 - 视 + 10, 视 * 0.35));
            }
        }
        catch (e: any) { }
    }
    ctx.triggerFieldEvent();
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.app = ctx.document.getElementById('app');

ctx.LABEL = { harvest: "产量", quality: "品质", ecology: "生态" };

ctx.UNIT = { harvest: "斤", quality: "分", ecology: "分" };

ctx.S = ctx.newSeason();

ctx.screen = "cover";

ctx.pendingEvents = [];

ctx.lastResult = null;

ctx.flash = {};

ctx.miban = null;

ctx.result = null;

ctx.newAch = [];

ctx.toastTimer = null;

ctx.tab = "田";

ctx.说数 = null;

ctx.人情开 = false;

ctx.不滚 = false;

ctx.事件位 = 0;

ctx.esc = (s?: any) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

ctx.重 = (s?: any) => ctx.esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

ctx.查块 = (c?: any) => !c ? "" : `<div class="note">
  <span class="k">晚 上 回 宿 舍 · 翻 资 料</span>
  <p class="q">${ctx.esc(c.问)}</p>
  <p class="s"><b>书 上 说</b>${ctx.esc(c.书)}</p>
  <p class="p"><b>说 白 了</b>${ctx.esc(c.白)}</p></div>`;

ctx.yuan = (n?: any) => Number(n).toLocaleString("zh-CN");

ctx.para = (s?: any) => String(s).split("\n").map((l?: any) => `<p>${ctx.esc(l)}</p>`).join("");

ctx.声 = null;

ctx.开声 = true;

ctx.音效 = {
    tap: () => ctx.音(620, 0, .07, "triangle", .08),
    好: () => { ctx.音(587, 0, .13, "sine", .11); ctx.音(880, .085, .20, "sine", .10); },
    坏: () => { ctx.音(392, 0, .15, "sine", .11); ctx.音(262, .10, .26, "sine", .11); },
    钱: () => { ctx.音(1046, 0, .09, "square", .06); ctx.音(1318, .07, .18, "square", .05); },
    翻: () => ctx.音(440, 0, .06, "triangle", .05),
    抽: () => { for (let i: any = 0; i < 7; i++)
        ctx.音(240 + i * 46, i * .035, .18, "triangle", .045); },
    金: () => [523, 659, 784, 1047].forEach((f?: any, i?: any) => ctx.音(f, i * .085, .55, "triangle", .10)),
    凶: () => [330, 262, 196, 165].forEach((f?: any, i?: any) => ctx.音(f, i * .10, .55, "sawtooth", .06)),
};

ctx.人里找 = (k?: any) => ({ 周: { 名: "老 周" }, 陈: { 名: "老 陈" }, 同: { 名: "同 学 A" },
    赵: { 名: "米厂的老赵" }, 师: { 名: "老 师" },
    主: { 名: "田 主" }, 村: { 名: "村 长" }, 农: { 名: "农 资 店" },
    乙: { 名: "同 学 B" } }[k] || { 名: k });

ctx.有正负 = (v?: any) => (v > 0 ? "+" + v : String(v));

ctx.定账 = function (i?: any) {
    const 来源: any = i === 0 ? "师" : "自";
    ctx.S.账来源 = 来源;
    ctx.存档({ 账来源: 来源 });
    ctx.S.农机 = Math.random() < (来源 === "师" ? .78 : .45);
    ctx.响("tap");
    ctx.toField();
};

ctx.去站里 = function () {
    if (ctx.S.账来源) {
        ctx.toField();
        return;
    }
    ctx.screen = "站里";
    ctx.render();
};

ctx.开着 = (o?: any, S?: any) => !(o.要灵 && !S.灵感[o.要灵]) && !(o.开 && !o.开(S));

ctx.有位 = (d?: any) => (d.options || []).map((o?: any, i?: any) => i)
    .filter((i?: any) => ctx.开着(d.options[i], ctx.S));

ctx.锁着 = (d?: any) => (d.options || []).map((o?: any, i?: any) => i)
    .filter((i?: any) => !ctx.开着(d.options[i], ctx.S));

ctx.圈码 = (i?: any) => "①②③④⑤⑥⑦⑧⑨"[i] || String(i + 1);

ctx.链名 = "后段";

ctx.当前链 = () => (ctx.链名 === "年话" ? (ctx.S.年话 || []) : (ctx.S.后段 || []));

ctx.回到账本 = function () { ctx.screen = "yearend"; ctx.响("tap"); ctx.render(); };

ctx.季评 = [
    { 名: "下下", min: -1e9, 气: "d",
        说: "往里贴了钱。镇属那家三十来号人的公司，年年也都在往里贴。京西稻就是这么留下来的，你这一亩今年也算了一份。" },
    { 名: "下", min: 3000, 气: "d",
        说: "贴进去一些，不多。一亩稻头一年种，这本账本来就难平。头一年种的人，都得往里贴这一笔。" },
    { 名: "中", min: 12000, 气: "c",
        说: "收支打平，还余了一点。一亩地头一年能不往里掏钱，这就算站住了。" },
    { 名: "上", min: 17500, 气: "b",
        说: "账是正的，还宽裕。这一亩地今年自己养活了自己，还余出钱来。在海淀，这件事已经不常听见了。" },
    { 名: "上上", min: 22000, 气: "a",
        说: "一亩地挣出了镇上一个人小半年的工钱。京西稻到今天还能留在地里，靠的就是这个数。" },
];

ctx.评等级 = (v?: any) => { let g: any = ctx.季评[0]; ctx.季评.forEach((x?: any) => { if (v >= x.min)
    g = x; }); return g; };

ctx.回看从哪儿来 = "decision";

ctx.openLog = function () { ctx.回看从哪儿来 = ctx.screen; ctx.screen = "log"; ctx.render(); };

ctx.closeLog = function () { ctx.screen = ctx.回看从哪儿来; ctx.render(); };

ctx.印象档 = [
    [10, "他跟你交心了。"],
    [6, "他拿你当自家人。"],
    [4, "他认你这个后生。"],
    [2, "见面能说上几句。"],
    [1, "点头的交情。"],
    [0, "还没打过几回交道。"],
    [-2, "他不大爱搭理你。"],
    [-5, "他见你绕着走。"],
    [-99, "他不想跟你说话。"]
];

ctx.印象判 = (v?: any) => (ctx.印象档.find((x?: any) => v >= x[0]) || ctx.印象档[ctx.印象档.length - 1])[1];

ctx.人名 = { 周: "老周", 陈: "老陈", 同: "同学A", 赵: "老赵", 师: "老师",
    主: "田主", 村: "村长", 农: "农资店", 乙: "同学B" };

ctx.ECHO = [
    { id: "周友", 重: 50, 谁: "老周 · 家里", 题: "炕桌上那本本子", 当: (S?: any) => S.印象.周 >= 4,
        说: "他让你上家里坐。炕桌上摊着那本本子，线缝过两回。\n「随便翻，翻坏了也没事。」",
        问: { options: [
                { text: "翻开看看，一页一页地翻",
                    sub: () => "本子就摊在那儿。他不催你，也不解释",
                    续题: "翻到第三本，纸都脆了",
                    续简: "四十年，字越写越小。去年那页画着个圈，旁边一个字没有。",
                    续谁: "老周",
                    续话: "他没拦你，把灯罩往下压了压。",
                    续: [
                        { text: "问他：这个圈，圈的是什么",
                            sub: () => "那一页上就一个圈。你翻来覆去看了三遍，没有别的字",
                            pick: (st?: any) => {
                                st.flags["后-上炕"] = true;
                                st.flags["后-问那个圈"] = true;
                                ctx.记象(st, { 周: 3 });
                            },
                            后: "他指头在圈上按了一下：「那一片，没了。」\n那一年南边那几亩改成了苗圃。" },
                        { text: "抄一段走，回去对着看",
                            sub: () => "抄的是虫情那几页。你自己那本上还空着",
                            pick: (st?: any) => {
                                st.flags["后-上炕"] = true;
                                st.flags["后-抄虫情"] = true;
                                ctx.记象(st, { 周: 2 });
                            },
                            后: "他把台灯往你那边推了推。\n「抄了就得用。不用就别抄。」" },
                        { text: "合上，不翻了",
                            sub: () => "翻了一半。他也没问你翻着啥了",
                            pick: (st?: any) => { st.flags["后-上炕"] = true; ctx.记象(st, { 周: 1 }); },
                            后: "你把本子合上。他收进柜子，转头去灶上添水。" },
                    ] },
                { text: "问他一句，这本子为什么记了四十年",
                    sub: (st?: any) => (st.印象.周 || 0) >= 8
                        ? "你跟他到这份上了，他肯讲"
                        : `得处得够近他才肯讲（印象 ${st.印象.周 || 0} / 8）`,
                    锁: (st?: any) => (st.印象.周 || 0) < 8,
                    续题: "他把手里的烟摁灭了",
                    续简: "这个话头没人跟他接过。",
                    续谁: "老周",
                    续话: "他半天没说话，烟摁灭在缸沿上。",
                    续: [
                        { text: "问他：这四十年，哪一年最难",
                            sub: () => "他记了四十年，总有一年是不想记的",
                            pick: (st?: any) => {
                                st.flags["后-上炕"] = true;
                                st.flags["后-听四十年"] = true;
                                ctx.记象(st, { 周: 4 });
                            },
                            后: "他说了个年份，很短。你算了一下，那一年他三十出头。\n别的一个字没多说。" },
                        { text: "问他：记这些，到底顶什么用",
                            sub: () => "你问的是实话。这个问题你自己也想了两季",
                            pick: (st?: any) => {
                                st.flags["后-上炕"] = true;
                                st.flags["后-听四十年"] = true;
                                ctx.记象(st, { 周: 3 });
                            },
                            后: "「顶不了什么，就是记着。」\n「哪年记岔了，第二年就对不上。对不上就知道自己记岔了。」" },
                        { text: "不追问了，给他把茶续上",
                            sub: () => "他不想说的时候，问也问不出来",
                            pick: (st?: any) => { st.flags["后-上炕"] = true; ctx.记象(st, { 周: 3 }); },
                            后: "他把话岔到今年雨水上去。\n你走的时候，那本本子还摊在炕桌上。" },
                    ] },
                { text: "茶喝了半杯就走，别打扰他",
                    sub: () => "坐了不到一刻钟，你起身告辞",
                    续题: "他把你送到门口",
                    续简: "他手扶在门框上，站住了。",
                    续谁: "老周",
                    续话: "送你到门口，没往外走。",
                    续: [
                        { text: "走到院门口，回头问一句今年种什么",
                            sub: () => "他种了四十年，问你这一句不亏",
                            pick: (st?: any) => { ctx.记象(st, { 周: 3 }); },
                            后: "他想了想，说了个种法，就一句话。\n你走出巷子才反应过来：两种种法的先后他给你点了。" },
                        { text: "走到院门口，跟他说本子的事改天再聊",
                            sub: () => "今天不说，等于把话往后推了一年",
                            pick: (st?: any) => { ctx.记象(st, { 周: 1 }); },
                            后: "他嗯了一声，把门带上。" },
                    ] },
            ] } },
    { id: "周传", 重: 78, 谁: "老周 · 田埂上", 题: "往后这本子归谁记", 当: (S?: any) => S.flags["周-抄本子"] && S.印象.周 >= 4,
        说: "本子你抄完了，厚厚一沓。他拿过来翻了两页，又推回给你。\n「往后这本子归你记。」他说。\n「我这岗年底就撤了，记了也没人看。」",
        问: { options: [
                { text: "接过来，往后这本子我记",
                    sub: () => "厚厚一沓，从今天起归你写。往下每一季田里的事，都得落进去",
                    续题: "往后这本子记什么",
                    续简: "接过来了就是接过来了。第一页写什么，往后就照什么记。",
                    续谁: "老周",
                    续话: "他把本子往你手里一塞，塞完就背过手去，不看你。",
                    续: [
                        { text: "接着他的记法，一天不落",
                            sub: () => "他那本子是按日子记的：几月几号，水多深，虫什么样。笨，但四十年不断",
                            pick: (st?: any) => {
                                st.flags["后-接本子"] = true;
                                st.flags["后-照老记法"] = true;
                                ctx.记象(st, { 周: 5 });
                            },
                            后: "他翻到你写的第一页看了看，点了点头，什么也没说。\n过了两天你才发现，他把那页折了个角。" },
                        { text: "改成按节气记，一季八页",
                            sub: () => "他的记法你用不惯。你自己那一套已经记了一年了",
                            pick: (st?: any) => { st.flags["后-接本子"] = true; ctx.记象(st, { 周: 3 }); },
                            后: "「随你。」他说，「记着就行。」\n他嘴上这么说，还是把那本按日子的旧本子留在了你这一摞底下。" },
                        { text: "算了，还是您拿着吧",
                            sub: () => "退回去，重新挑一个",
                            回: true, pick: () => { } },
                    ] },
                { text: "本子还是您拿着，我学着记",
                    sub: () => "他笑了笑，把本子收回去，顺手从柜子里给你找了个空本子",
                    续题: "一旧一新，两本怎么并行",
                    续简: "他那本还在他手上，你这本是你自己的。同样一件事，往后有两份记录。",
                    续谁: "老周",
                    续话: "他从柜子里翻出个空本子，是新的，硬皮，比他那本还讲究。",
                    续: [
                        { text: "问他：那您这本，往后还给我看吗",
                            sub: () => "两本并行，看不看他的，是你的事也是他的事",
                            pick: (st?: any) => { st.flags["后-跟着记"] = true; ctx.记象(st, { 周: 4 }); },
                            后: "「你来看就是。」他说，「不看也行。」\n后来每一季你都去翻一回。他那本的字，你慢慢全认得了。" },
                        { text: "接过空本子，先说好怎么记",
                            sub: () => "你按节气，他按日子。两份记录对起来才看得出哪年不一样",
                            pick: (st?: any) => {
                                st.flags["后-跟着记"] = true;
                                st.flags["后-两本并行"] = true;
                                ctx.记象(st, { 周: 3 });
                            },
                            后: "他说行。想了一会儿又问：「按节气的话，一个节气你记几行？」\n你说了个数，他记下了。" },
                    ] },
                { text: "这我可接不住",
                    sub: () => "四十年的东西，你不敢接",
                    续题: "他说了句什么",
                    续简: "他没生气。这话他大概自己也想过了。",
                    续谁: "老周",
                    续话: "他嗯了一声，把本子收回去，动作不快也不慢。",
                    续: [
                        { text: "跟他把话说完：不是你不想接，是你怕记砸",
                            sub: () => "他刚才没问，你也没说。不说清楚，这事就僵在这儿",
                            pick: (st?: any) => { ctx.记象(st, { 周: 2 }); },
                            后: "他听完，说：「我记岔过。第三年就岔过一回，后来对上了。」\n「记砸了不要紧，撂下才要紧。」他说完就走了。" },
                        { text: "不提了，扭头说田里的事",
                            sub: () => "话到此为止",
                            pick: (st?: any) => { ctx.记象(st, { 周: -1 }); },
                            后: "他顺着你的话说了下去，两个人都没再提本子。\n往后他照样教你，只是路过田埂时话少了几句。" },
                    ] },
            ] } },
    { id: "周冷", 重: 55, 谁: "老周", 题: "他绕到南边走了", 当: (S?: any) => S.印象.周 <= -4,
        说: "他不再路过你这块田了。以前一天两趟，现在绕到南边那条路上走。\n你在地里碰见过他一回，他点了下头，没停脚。",
        问: { options: [
                { text: "上他家去一趟，把话说开",
                    sub: () => "他不开门你也得去。这一片往后还要不要处，就看这一趟",
                    续题: "站在他家门口",
                    续简: "门开着一条缝。院里没动静，你听见里头有人挪椅子。",
                    续谁: "老周",
                    续话: "他开了门，站在门里没让开。手还扶在门闩上。",
                    续: [
                        { text: "不进屋，就在门口把话说完",
                            sub: () => "他站着，你也站着。这一片的事，说到底也不复杂",
                            pick: (st?: any) => { st.flags["后-登门"] = true; ctx.记象(st, { 周: 4 }); },
                            后: "他听完没说好也没说不好。\n过了两天，你在地头又看见他绕着走 —— 这回是从你田边上走的。" },
                        { text: "先说软话，再进屋坐下",
                            sub: () => "登门就是低一头。你不低，这趟就白跑了",
                            pick: (st?: any) => {
                                st.flags["后-登门"] = true;
                                st.flags["后-先低头周"] = true;
                                ctx.记象(st, { 周: 3 });
                            },
                            后: "他让开了半步。茶是他自己沏的，倒了两杯，一杯推到你面前。\n那一季他都没再教你什么，但也不绕路了。" },
                    ] },
                { text: "不吭声，低头种你的田",
                    sub: () => "见了面点个头，别的什么也不说",
                    续题: "地里的活照做，人不照处",
                    续简: "他绕他的，你种你的。这一片就这么大，早晚还得碰上。",
                    续谁: "老周",
                    续话: "连着两季，你们就这么点着头过去了。",
                    续: [
                        { text: "第三季，主动问他一件事",
                            sub: () => "不道歉，也不提旧账，就是问件事",
                            pick: (st?: any) => { st.flags["后-登门"] = true; ctx.记象(st, { 周: 2 }); },
                            后: "他答了。答得很短，答完就走了。\n但这回他停脚了 —— 前两季他是不停的。" },
                        { text: "就这么下去",
                            sub: () => "点头之交也不耽误种地",
                            pick: (st?: any) => { ctx.记象(st, { 周: 1 }); },
                            后: "这一片的事你还是照做，只是再没人提点你哪一步会岔。\n他绕到南边那条路上，一年一年地绕。" },
                    ] },
                { text: "绕就绕，谁离不开谁",
                    sub: () => "这一片少一个人教你，你照样种",
                    续题: "话传到村里去了",
                    续简: "田埂上没秘密。谁跟谁不说话，一个夏天就传遍。",
                    续谁: "村长",
                    续话: "村长在地头碰见你，问了一句你跟老周怎么回事。",
                    续: [
                        { text: "跟村长说清楚：不是不处，是各有各的种法",
                            sub: () => "话由他说出去，比你自己解释管用",
                            pick: (st?: any) => { ctx.记象(st, { 村: 2 }); },
                            后: "村长听完笑了：「他那个人，你顺着他一句就完了。」\n这话你记着了，只是没用上。" },
                        { text: "不解释，随他们怎么传",
                            sub: () => "你的事不用跟谁交代",
                            pick: (st?: any) => { st.flags["后-结下"] = true; ctx.记象(st, { 周: -2 }); ctx.记象(st, { 村: -1 }); },
                            后: "村里后来把你们俩的事说成了「农大那个不吃敬酒」。\n这一片是熟人社会，这话传得比你种的稻子还远。" },
                    ] },
            ] } },
    { id: "周走", 重: 80, 谁: "村口", 题: "立在埂上的那把锹", 当: (S?: any) => S.flags["地-劝签"],
        说: "老周的地还是签了。开春动工，他搬去城里跟儿子住。\n走之前把那把锹立在你这块田的田埂上，没留话。",
        问: { options: [
                { text: "把锹收回去，搁在仓房里",
                    sub: () => "他用了几十年的东西。立在埂上，一场雨就锈了",
                    续题: "锹收进来了，搁哪儿",
                    续简: "仓房里就那么大地方。东西一收进去，就跟收进去别的东西一样，容易忘。",
                    续谁: "农资店",
                    续话: "农资店的人看见你扛着锹进来，说：「老周那把？他昨天来买过一袋肥，没提这个。」",
                    续: [
                        { text: "问一句：他昨天买肥，是给自己田里用？",
                            sub: () => "他地都签了，还买肥做什么",
                            pick: (st?: any) => {
                                st.flags["后-收锹"] = true;
                                st.flags["后-追一句"] = true;
                                ctx.记象(st, { 周: 2 });
                            },
                            后: "「给他兄弟捎的。」农资店说。\n「他自己那点地，开春就平了。」\n你把锹靠在仓房最里头，锹把上那层包浆你一直没舍得擦。" },
                        { text: "不问。把锹收好，付钱走人",
                            sub: () => "他搬走了就是搬走了。问出来也不能怎样",
                            pick: (st?: any) => { st.flags["后-收锹"] = true; ctx.记象(st, { 周: 2 }); },
                            后: "你把锹靠在仓房最里头。那年秋天翻地，你用的就是它。\n锹口薄，比你自己那把好使。" },
                    ] },
                { text: "立在原地，谁也不许动",
                    sub: () => "他立在那儿的，你就让它立着",
                    续题: "一把锹在埂上立着",
                    续简: "路过的人都看得见。有人问你这是谁的，有人说该收起来。",
                    续谁: "老赵",
                    续话: "老赵从田埂上过，看了一眼那把锹，又看了你一眼。",
                    续: [
                        { text: "跟老赵说：他立在这儿的，我不动",
                            sub: () => "这话得说明白，不然人家以为你懒得收",
                            pick: (st?: any) => { ctx.记象(st, { 周: 2 }); ctx.记象(st, { 赵: 1 }); },
                            后: "老赵点了点头，没说什么，走了。\n第二天那把锹还在原地 —— 有人在锹把上系了根红绳。" },
                        { text: "不解释。旁边立块小牌子，写上「老周的锹」",
                            sub: () => "一块牌子，省得一个个解释",
                            pick: (st?: any) => {
                                st.flags["后-收锹"] = true;
                                st.flags["后-立小牌"] = true;
                                ctx.记象(st, { 周: 3 });
                            },
                            后: "牌子立上以后，人人从那儿过都要看一眼。\n后来村里修路，那块牌子被人挪到了新砌的矮墙上。" },
                    ] },
                { text: "去村里问一句，他那摊事往后归谁管",
                    sub: () => "他那个岗年底撤了。这一片的水、虫、茬口，原来一直是他在记",
                    续题: "村委办公室里",
                    续简: "他那一摊本来也没个名目。人走了，事就悬着。",
                    续谁: "村长",
                    续话: "村长给你倒了杯水，说这个事他也在想。",
                    续: [
                        { text: "说你接：这片的水口、虫情，我来记",
                            sub: () => "接下来容易。他的本子在你手上，可往后没人查你了",
                            pick: (st?: any) => {
                                st.flags["后-接老周的岗"] = true;
                                ctx.记象(st, { 周: 3 });
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 15;
                            },
                            后: "村长当场就点了头，说年底开会报一声。\n散了会你才想起来，他那个本子是四十年的——你那本才两年。" },
                        { text: "先问清楚：这活儿有补助没有",
                            sub: () => "问钱不丢人。白干活干不满三年",
                            pick: (st?: any) => { ctx.记象(st, { 村: 1 }); },
                            后: "村长说这个得往上申请，一时半会儿批不下来。\n你说了句「那先干着」，他应了。后来那笔钱一直没批下来。" },
                    ] },
            ] } },
    { id: "组会", 重: 45, 谁: "带队老师 · 组会", 题: "后半句没说完",
        当: (S?: any) => (S.交数总 || 0) >= 2 && Object.keys(S.codex).length >= 6,
        说: "轮到你讲。你把那一亩地的账投在屏幕上：八个节气，哪一步花了多少，秋天收回来多少。\n讲到「晒田压纹枯病」那段，坐后排的老师抬起头来问了一句：「这是你自己摸出来的？」",
        问: { options: [
                { text: "是，蹲田里一条一条摸出来的",
                    sub: () => "实话。代价是底下的人会接着往下追问细节",
                    续题: "他把笔搁下了",
                    续简: "这一句说出来，屋里就换了口气。有人把本子往前挪了挪。",
                    续谁: "带队老师 · 组会",
                    续话: "他没说好也没说不好，只把笔搁在桌上，等你往下讲。",
                    续: [
                        { text: "把晒田那几天的时间点报清楚",
                            sub: () => "哪一天开始晒、晒到田面什么样、哪一天回水。报得出来，就说明真蹲过",
                            pick: (st?: any) => { st.flags["后-照实答"] = true; ctx.记象(st, { 师: 3 }); },
                            后: "你报完，他在本子上写了一行。散会以后有人过来问你那一亩在哪个村。" },
                        { text: "说：有几条我到现在也没弄明白",
                            sub: () => "实话往下再走一步。承认没弄明白，比报得漂亮更让人信",
                            pick: (st?: any) => {
                                st.flags["后-照实答"] = true;
                                st.flags["后-说没弄明白"] = true;
                                ctx.记象(st, { 师: 4 });
                                st.名望 = (st.名望 || 0) + 10;
                            },
                            后: "他抬起头看了你两秒，说：「没弄明白的那几条，明年接着摸。」\n他这句话比刚才那一问还重。" },
                    ] },
                { text: "一半是书上抄的，一半是田里看的",
                    sub: () => "把本子摊开，哪条是抄的指哪条",
                    续题: "本子摊开了，往下得指着说",
                    续简: "抄的和看的都在这一本上头。指哪一条，往后那几个字就跟着你。",
                    续谁: "带队老师 · 组会",
                    续话: "你把本子摊开。前排有人笑了一声，不大。",
                    续: [
                        { text: "指那几条最扎实的，说这是抄的",
                            sub: () => "扎实的那几条多半书上都有。先说清楚，省得人家替你翻书",
                            pick: (st?: any) => {
                                st.flags["后-照实答"] = true;
                                ctx.记象(st, { 师: 2 });
                                st.名望 = (st.名望 || 0) + 8;
                            },
                            后: "他点了点头：「抄不丢人，抄了不知道哪条对不上才丢人。」" },
                        { text: "专挑书上没有的那几条说",
                            sub: () => "这几条是你自己摸出来的，说出来就得担着",
                            pick: (st?: any) => {
                                st.flags["后-照实答"] = true;
                                st.flags["后-指书上没有的"] = true;
                                ctx.记象(st, { 师: 3 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "他说：「这几条你写成一条一条的，比讲一节课有用。」\n散会后你真去写了。写到一半发现有一条自己也说不圆。" },
                    ] },
                { text: "含糊过去，说是查的文献",
                    sub: () => "台下没人追问。这一关你过了",
                    续题: "过了这一关，可你自己知道",
                    续简: "你翻到下一页的时候停了一下。这一页的账，一行一行都是你自己记的。",
                    续谁: "带队老师 · 组会",
                    续话: "你把这一页翻过去了。屋里没人再问。",
                    续: [
                        { text: "翻过去，接着往下讲",
                            sub: () => "这一页翻过去了，后面还有七页",
                            pick: (st?: any) => { ctx.记象(st, { 师: -2 }); },
                            后: "讲完散会，没人过来跟你说话。\n你收电脑的时候，后排那位老师已经走了。" },
                        { text: "讲到一半自己改口：这几条是田里看的",
                            sub: () => "话说到一半改口，比一开始就说是田里看的更难",
                            pick: (st?: any) => { st.flags["后-照实答"] = true; ctx.记象(st, { 师: 2 }); },
                            后: "他抬起头看了你一眼，说：「接着讲。」\n就这两个字，可你后半段讲得比前半段稳。" },
                    ] },
            ] } },
    { id: "观测点", 重: 58, 谁: "带队老师 · 组会前", 题: "这块地动不动得", 当: (S?: any) => S.flags["数-照实"] && S.名望 >= 15,
        说: "「数是你自己填的，一个没动。」老师把表放下，\n「这块地别换人，你那本记录本留下来，我们做长期观测用。」",
        问: { options: [
                { text: "留，我接着记",
                    sub: () => "往后每一季都得照实填。填错一年，这块地的长期数据就废了",
                    续题: "这块地往后几年归你记",
                    续简: "长期观测点一记就是好几年。中间断一年，前面那些全白记。",
                    续谁: "带队老师 · 组会前",
                    续话: "他把表收进包里，抬头看你，等你往下说。",
                    续: [
                        { text: "问他：我这地是租的，换地了怎么办",
                            sub: () => "地是租的，租约一年一签。这话现在不问，往后就是个坑",
                            pick: (st?: any) => {
                                st.flags["后-接着记"] = true;
                                st.flags["后-问换地"] = true;
                                ctx.记象(st, { 师: 3 });
                                ctx.记象(st, { 主: 2 });
                            },
                            后: "他想了想说：「换地就得重新起。所以这话你得先跟田主落死。」\n后来那条租约上多写了一行：换人提前一季说。" },
                        { text: "先应下来，别的往后再说",
                            sub: () => "长期观测点挂在你这儿，往后几年都得照实填",
                            pick: (st?: any) => { st.flags["后-接着记"] = true; ctx.记象(st, { 师: 2 }); ctx.记象(st, { 主: 1 }); },
                            后: "他在表上填了你的名字。往后每年秋后多一张表，不多，一页。" },
                    ] },
                { text: "留，但得先跟田主说一声",
                    sub: () => "地是租的。观测点要挂好几年，换人换地就断了，这话得他点头",
                    续题: "跟田主怎么开这个口",
                    续简: "地是人家的。往人家地上挂点东西，说得再客气也是麻烦人家。",
                    续谁: "带队老师 · 组会前",
                    续话: "老师点了点头，说这话该说。笔搁下了，等你。",
                    续: [
                        { text: "把观测点这事原原本本跟田主说",
                            sub: () => "挂几年、每年几趟、来的人动不动地。说全了，他才能拿主意",
                            pick: (st?: any) => {
                                st.flags["后-挂观测点"] = true;
                                st.flags["后-跟田主说了"] = true;
                                ctx.记象(st, { 主: 3 });
                                ctx.记象(st, { 师: 1 });
                            },
                            后: "田主听完只问了一句：「动我的地不？」\n你说不动，就是年年要看几趟。他说那行。后来他每年秋后都替你把田埂上的草锄了。" },
                        { text: "先问他明年还租不租给我",
                            sub: () => "挂不挂是后话。先得知道这一亩明年还是不是你的",
                            pick: (st?: any) => { st.flags["后-挂观测点"] = true; ctx.记象(st, { 主: 2 }); },
                            后: "田主说租，明年还租你。你这才把观测点的事说出口。\n两件事分开说，都比合在一起说省事。" },
                    ] },
                { text: "算了，本子我自己留着",
                    sub: () => "记录本是你的。你舍不得交出去",
                    续题: "他没劝你",
                    续简: "老师把包拉上了。这一句停在半空里，谁都没接。",
                    续谁: "带队老师 · 组会前",
                    续话: "他说「也行」，把包拉上。手在拉链上停了半秒。",
                    续: [
                        { text: "改口：留，但本子我留个底",
                            sub: () => "观测点要的是那份表，不是你这一个本子",
                            pick: (st?: any) => {
                                st.flags["后-接着记"] = true;
                                st.flags["后-留底"] = true;
                                ctx.记象(st, { 师: 2 });
                            },
                            后: "他说这样最好。往后每年他给你的那份表，你自己抄一份留着。\n后来那两份年年都对得上，一笔不差。" },
                        { text: "不改口",
                            sub: () => "本子是自己的，这点你分得清楚",
                            pick: (st?: any) => { ctx.记象(st, { 师: -1 }); },
                            后: "他走了以后，你把本子收回抽屉最里头。\n那一季再没人来问过你的数。" },
                    ] },
            ] } },
    { id: "书呆", 重: 66, 谁: "同学", 题: "本子厚了，米还是那个米", 当: (S?: any) => Object.keys(S.说法).length >= 10 && S.stats.quality < 45,
        说: "你抄了一本子的说法，一条一条背得出来。可田里的米还是那个等级。\n同学翻了翻你的本子，说：「这些我也能抄。」",
        问: { options: [
                { text: "把本子合上，先去田里蹲半天",
                    sub: () => "抄来的话一条没用上，那就先别抄了",
                    续题: "田里那半天怎么过",
                    续简: "本子合上了，可你手里没别的。抄的那些话还在脑子里，就看落不落得下去。",
                    续谁: "同学",
                    续话: "他没拦你，把本子推回给你，说了句「那你去」。",
                    续: [
                        { text: "挑抄得最熟的那一条，去田里对着看",
                            sub: () => "背得最熟的那条，多半就是最没用上的那条",
                            pick: (st?: any) => {
                                st.flags["后-下田"] = true;
                                st.flags["后-对一条"] = true;
                                ctx.记象(st, { 周: 3 });
                                ctx.记象(st, { 同: 1 });
                            },
                            后: "你在田里蹲了一下午，把那条对着看了三遍。\n看出来的东西跟你背的不一样 —— 你那条背的是大田，你这是一亩。" },
                        { text: "什么也不带，就蹲着看",
                            sub: () => "不带本子去，看多少算多少",
                            pick: (st?: any) => { st.flags["后-下田"] = true; ctx.记象(st, { 周: 2 }); ctx.记象(st, { 同: 1 }); },
                            后: "蹲到天擦黑，什么结论也没得出来。\n但你记住了虫子是从哪一侧爬上叶子的 —— 这个书上没写。" },
                    ] },
                { text: "接着抄。抄完总比不抄强",
                    sub: () => "本子厚了总是好事，这是你信的那套",
                    续题: "本子又厚了一沓",
                    续简: "抄这件事本身不坏。坏的是抄完之后那一亩还是老样子。",
                    续谁: "同学",
                    续话: "他看你又摊开本子，什么也没说，走了。",
                    续: [
                        { text: "挑几条这季用得上的，抄完就用",
                            sub: () => "抄是为了用。哪条这季用得上，你自己清楚",
                            pick: (st?: any) => { ctx.记象(st, { 同: 1 }); ctx.记象(st, { 周: 1 }); },
                            后: "这一季你真用上了两条。米没升等，但稗子比去年少了一成。" },
                        { text: "从头抄到尾，一条不落",
                            sub: () => "厚就好。这是你信的那套",
                            pick: (st?: any) => { ctx.记象(st, { 同: -1 }); },
                            后: "本子又厚了一沓。秋后过磅，米还是那个等级。\n同学没再翻过你的本子。" },
                    ] },
                { text: "拿这本子去找老周，一条一条念给他听",
                    sub: () => "让他告诉你，哪几条在你这一亩上根本不成立",
                    续题: "他搬了个小凳坐下",
                    续简: "他说「你念」。本子上有些话，在别处对，在你这块地上不对。",
                    续谁: "老周",
                    续话: "他搬了个小凳在田埂上坐下，说：「你念。」",
                    续: [
                        { text: "一条一条念完，等他说",
                            sub: () => "念完再听。他要说的就在那几条上",
                            pick: (st?: any) => { st.flags["后-念给周听"] = true; ctx.记象(st, { 周: 3 }); },
                            后: "你念到第九条他开口了：「这条在我这儿不成立。前年试过。」\n你问他为什么，他说了两个字：「水凉。」" },
                        { text: "念到一半就问：哪几条在你这儿不成立",
                            sub: () => "省时间，但他得把话头接过去",
                            pick: (st?: any) => {
                                st.flags["后-念给周听"] = true;
                                st.flags["后-直接问"] = true;
                                ctx.记象(st, { 周: 3 });
                                st.名望 = (st.名望 || 0) + 8;
                            },
                            后: "他想了想，给你点了四条。四条里有三条书上写得明明白白。\n「书是老书，地在变。」他说。" },
                    ] },
            ] } },
    { id: "土专", 重: 72, 谁: "田里", 题: "比他快那一截", 当: (S?: any) => Object.keys(S.codex).length >= 10 && S.名望 >= 40,
        说: "叶子刚泛黄，你蹲下去掰开基部看了一眼，就知道是什么了，不用再翻书。\n老周在旁边看着，说：「你现在比我快。」",
        问: { options: [
                { text: "哪儿啊，我这也是跟您学的",
                    sub: () => "实话，也是给他留面子",
                    续题: "他没接这句客气话",
                    续简: "他种了四十年。你这一句客气话，他听得出来。",
                    续谁: "老周",
                    续话: "他嗯了一声，眼睛还看着田里，没接你这句话。",
                    续: [
                        { text: "再补一句：那本本子我抄了三回",
                            sub: () => "快不是白来的。三回抄本子这事他没看见",
                            pick: (st?: any) => { ctx.记象(st, { 周: 3 }); },
                            后: "他这回转过头来看了你一眼，说：「抄三回，那是笨功夫。」\n过了一会儿又添一句：「笨功夫管用。」" },
                        { text: "把话岔开，问他这块地明年种什么",
                            sub: () => "这一句到这儿就够了，不用往深里说",
                            pick: (st?: any) => { ctx.记象(st, { 周: 2 }); },
                            后: "他跟你说了个种法，说完就走了。\n那年秋天他确实照那个种法种的。" },
                    ] },
                { text: "那您再教我一件事",
                    sub: () => "他肯教你的就那几手了。趁他还在这一片",
                    续题: "他想了想",
                    续简: "手上的活已经交得差不多了。再教，教什么是个事。",
                    续谁: "老周",
                    续话: "他蹲下去，从兜里摸出烟，没点，就那么在手里捏着。",
                    续: [
                        { text: "问他：您看这块地，哪一步我做错了",
                            sub: () => "他天天从这儿过。问他哪一步岔了，他答得出来",
                            pick: (st?: any) => { st.flags["后-再学一手"] = true; ctx.记象(st, { 周: 4 }); },
                            后: "他说：「不在这儿。在你秋天收得太早。」\n你愣住了。那一季你确实抢了三天。" },
                        { text: "问他：您种了四十年，最不放心哪一步",
                            sub: () => "他这四十年上栽过的跟头，比手上的活值钱",
                            pick: (st?: any) => {
                                st.flags["后-再学一手"] = true;
                                st.flags["后-问不放心"] = true;
                                ctx.记象(st, { 周: 3 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "他想了好一会儿，说了三个字：「看水的人。」\n水口那一摊事全靠人盯着。他说这话的时候，你听出来他不是在说技术。" },
                    ] },
                { text: "嗯，是比您快了",
                    sub: () => "他愣了一下，笑了。这话他听得进去",
                    续题: "他笑了",
                    续简: "这话不客气。可四十年的人听这种话，跟别人不一样。",
                    续谁: "老周",
                    续话: "他愣了一下，笑了。笑完把烟点上了，抽了两口才说话。",
                    续: [
                        { text: "再问他一句：是不是我哪儿还差着",
                            sub: () => "他笑了不等于他没话。这句问出来，他才肯说",
                            pick: (st?: any) => { st.flags["后-认快"] = true; ctx.记象(st, { 周: 3 }); },
                            后: "他说：「你差的不是手。是种了两年就想改种法。」\n这话他记了一年多，今天才说出口。" },
                        { text: "不说话了，接着干你的活",
                            sub: () => "话说完了，田里的活还等着",
                            pick: (st?: any) => {
                                st.flags["后-认快"] = true;
                                ctx.记象(st, { 周: 1 });
                                st.名望 = (st.名望 || 0) + 10;
                            },
                            后: "他抽完烟走了。往后这一片再有人问，他会说农大那个「比我看得快」。" },
                    ] },
            ] } },
    { id: "同友", 重: 50, 谁: "同学A", 题: "说了两年的那顿饭", 当: (S?: any) => S.印象.同 >= 4,
        说: "同学A 说，毕业前请你吃个饭，就去学校南门那家。\n「你那一季，我后来想了很久。」他说。\n「我当时要是也去看一眼就好了。」",
        问: { options: [
                { text: "去，这顿饭得吃",
                    sub: () => "他说这话不是客套。这顿饭你要是推了，往后就真推了",
                    续题: "坐下来点了菜，话怎么起头",
                    续简: "他说他想了很久。这句是起头，往下就看你怎么接。",
                    续谁: "同学A",
                    续话: "他把菜单推给你，说「你点」，完了自己倒了杯水，没喝，就那么端着。",
                    续: [
                        { text: "跟他说：那阵子我也没想着叫你",
                            sub: () => "他记着的就是这个。你先说，比他说省事",
                            pick: (st?: any) => { st.flags["后-吃那顿饭"] = true; ctx.记象(st, { 同: 4 }); },
                            后: "他把杯子放下，说：「我知道。我就是觉得，看一眼也不耽误什么。」\n这顿饭后来吃了三个钟头。" },
                        { text: "跟他说：想看现在看也不晚",
                            sub: () => "田还在。他也还在。这一句比什么都实在",
                            pick: (st?: any) => {
                                st.flags["后-吃那顿饭"] = true;
                                st.flags["后-约他下田"] = true;
                                ctx.记象(st, { 同: 4 });
                                st.名望 = (st.名望 || 0) + 6;
                            },
                            后: "他说行。第二天真跟你去了田里，蹲了半下午。\n蹲完他说：「我以为就是块地。」" },
                    ] },
                { text: "去，顺便叫他再来田里一趟",
                    sub: () => "饭吃完了人还在。让他自己看看那一亩到底什么样",
                    续题: "他来了田里",
                    续简: "嘴上说一百遍不如让他蹲一次。可他来了之后看不看，不由你。",
                    续谁: "同学A",
                    续话: "他站在田埂上，手插在兜里，看了半天没吭声。",
                    续: [
                        { text: "把这一季的账翻给他看",
                            sub: () => "八个节气哪一步花了多少、收回来多少，都在本子上",
                            pick: (st?: any) => {
                                st.flags["后-吃那顿饭"] = true;
                                st.flags["后-带同下田"] = true;
                                ctx.记象(st, { 同: 3 });
                                st.名望 = (st.名望 || 0) + 8;
                            },
                            后: "他翻了两页，说：「这个我会算。」\n翻到第五页他不说话了，一直翻到底。" },
                        { text: "不给他看账，让他自己下田踩一脚",
                            sub: () => "账是冷的。田是泥的",
                            pick: (st?: any) => {
                                st.flags["后-吃那顿饭"] = true;
                                st.flags["后-带同下田"] = true;
                                ctx.记象(st, { 同: 4 });
                            },
                            后: "他脱了鞋下去踩了一脚，上来的时候脚上全是泥。\n「这么深。」他说。这一句比前面那些话都管用。" },
                    ] },
                { text: "改天吧，田里走不开",
                    sub: () => "他也没多说。这顿饭拖到毕业也没吃成",
                    续题: "他说了句「行」",
                    续简: "这个「行」跟上一个「行」不一样。你没接住，他也没再递。",
                    续谁: "同学A",
                    续话: "他说了句「行」，把手机收起来了，低头扒了两口饭。",
                    续: [
                        { text: "补一句：等收完这季我请你",
                            sub: () => "话补得回来，日子补不回来。但补一句总比不补强",
                            pick: (st?: any) => { ctx.记象(st, { 同: 1 }); },
                            后: "他说好。收完那一季你想起来的时候，他已经回家过暑假了。\n再开学就是大四。" },
                        { text: "不补。这顿饭就是没吃成",
                            sub: () => "田里的事排在前头，这是你自己排的",
                            pick: (st?: any) => { ctx.记象(st, { 同: -2 }); },
                            后: "那顿饭一直没吃。毕业那天他跟你合了张影，笑得很正常。\n后来他在群里发过一张别的田的照片，没配字。" },
                    ] },
            ] } },
    { id: "同冷", 重: 55, 谁: "学院楼", 题: "楼道里那一声", 当: (S?: any) => S.印象.同 <= -4,
        说: "在楼道里碰见同学A，他看见你，拐进了另一条走廊。\n后来你听人说，他那件事最后还是算在了他头上，带他的老师背了指导责任。",
        问: { options: [
                { text: "喊住他",
                    sub: () => "楼道里人来人往。你喊了一声，他停了一下",
                    续题: "他停下来了，可没转身",
                    续简: "他站住了，手还插在兜里，眼睛看的是楼道尽头那扇窗。",
                    续谁: "同学A",
                    续话: "你喊了一声，他站住了。没回头。",
                    续: [
                        { text: "走过去，站到他跟前说",
                            sub: () => "他背对着你。话说给人听，得站在人跟前说",
                            pick: (st?: any) => {
                                st.flags["后-叫住同"] = true;
                                st.flags["后-当面说"] = true;
                                ctx.记象(st, { 同: 4 });
                            },
                            后: "他听完了，说：「那事跟你没关系。」\n话说得挺硬，可他说完之后站着没走，等你先说下一句。" },
                        { text: "先跟他说：那件事是我欠你的",
                            sub: () => "他要听的是这一句。别的说再多都是绕",
                            pick: (st?: any) => { st.flags["后-叫住同"] = true; ctx.记象(st, { 同: 4 }); },
                            后: "他转过来了。「我又没让你赔。」他说。\n两个人就站在楼道里，一直到下课铃响。" },
                    ] },
                { text: "装作没看见，错过去",
                    sub: () => "两个人就这么走过去了",
                    续题: "走过去之后，你回头看了一眼",
                    续简: "他已经拐进那条走廊了。这一回你没喊，下一回就喊不出口了。",
                    续谁: "同学A",
                    续话: "走廊里就你们两个人。他拐进去了，你往前走了三步。",
                    续: [
                        { text: "停下，回头追过去",
                            sub: () => "刚走过去三步。追回去还来得及",
                            pick: (st?: any) => { st.flags["后-叫住同"] = true; ctx.记象(st, { 同: 3 }); },
                            后: "你追到那条走廊口，他正靠着墙站着，没走。\n「我等你回头呢。」他说。" },
                        { text: "往前走，不回头",
                            sub: () => "这一步迈出去，往后就是两条路",
                            pick: (st?: any) => { ctx.记象(st, { 同: -2 }); },
                            后: "他那件事最后算在了他头上，带他的老师背了指导责任。\n这一条你在心里记了一季。" },
                    ] },
                { text: "晚上给他发条消息，把话说清楚",
                    sub: () => "当面说不出口的，写下来能写清楚",
                    续题: "消息写完，停在发送键上",
                    续简: "写下来的话，一次说不清楚就还能改。可发出去就收不回来了。",
                    续谁: "同学A",
                    续话: "你把那段话删了三遍。最后剩了两行，停在发送键上。",
                    续: [
                        { text: "发出去，两行就两行",
                            sub: () => "短的那两行，比长的那段管用",
                            pick: (st?: any) => { st.flags["后-给同发消息"] = true; ctx.记象(st, { 同: 3 }); },
                            后: "他隔了半个钟头回了两个字：「知道。」\n第二天在食堂碰见，他端着盘子坐到你对面了。" },
                        { text: "先删了，明天当面说",
                            sub: () => "消息发出去就是证据。当面说，说完就过去了",
                            pick: (st?: any) => {
                                st.flags["后-给同发消息"] = true;
                                st.flags["后-当面说"] = true;
                                ctx.记象(st, { 同: 2 });
                            },
                            后: "第二天食堂里你刚坐下，他就端着盘子过来了。\n你还没开口，他先说：「昨天那条，你发了我看见了。」" },
                    ] },
            ] } },
    { id: "陈友", 重: 50, 谁: "老陈 · 粮站", 题: "价给你留着", 当: (S?: any) => S.印象.陈 >= 4,
        说: "老陈打电话来，说今年的价他先给你留着，什么时候出米什么时候算。\n「你这个人，」他说，「数上不糊弄。」",
        问: { options: [
                { text: "那就谢了。什么时候出米什么时候算",
                    sub: () => "他信你，你也别端着",
                    续题: "价留着，可留着的不只是一个数",
                    续简: "这一季的谷子还没出米。价是按今天的行情定的，往后涨跌都归他担着。",
                    续谁: "老陈",
                    续话: "他在电话那头说行。停了一下，又说了句「今年雨少，你那边水够不够」。",
                    续: [
                        { text: "跟他说水够，顺口问一句他那边收成怎么样",
                            sub: () => "他问了一句田里的事。你也问他一句",
                            pick: (st?: any) => { ctx.记象(st, { 陈: 3 }); },
                            后: "他说收得一般。又说：「不过我这库空着，你出多少我收多少。」\n这话比那个价实在。" },
                        { text: "先把价定死在一张纸上",
                            sub: () => "话在电话里，纸上什么都没有。定死了，往后谁也不亏",
                            pick: (st?: any) => { st.flags["后-价写纸上"] = true; ctx.记象(st, { 陈: 4 }); },
                            后: "他让你过去一趟，当着面把价写在单子上，两个人各按了个手印。\n「你这个人就是麻烦。」他说，说完把单子收进抽屉里了。" },
                    ] },
                { text: "问他一句：这个数你自己担不担风险",
                    sub: () => "价留着，粮跌了是他自己吃亏。这话得问出口",
                    续题: "他笑了一声",
                    续简: "这话他做了这些年，没人问过。他自己也没跟人算过。",
                    续谁: "老陈",
                    续话: "他笑了一声，说：「你问这个干嘛。」",
                    续: [
                        { text: "说：不能让你白担着，跌了按跌的算",
                            sub: () => "话说到这份上，两个人的账才算真摊开",
                            pick: (st?: any) => {
                                st.flags["后-问陈风险"] = true;
                                st.flags["后-分摊"] = true;
                                ctx.记象(st, { 陈: 5 });
                                st.名望 = (st.名望 || 0) + 8;
                            },
                            后: "他想了半天，说：「按你说的办。」\n那一季粮价真跌了。他按跌的给你结的，一分没含糊。" },
                        { text: "说：就是随口问问",
                            sub: () => "问出口了又收回来，他看着呢",
                            pick: (st?: any) => { st.flags["后-问陈风险"] = true; ctx.记象(st, { 陈: 3 }); },
                            后: "他说：「我不担谁担。」把话头岔过去了。\n这一季他按留的价给你结的，比市价高了一毛二。" },
                    ] },
                { text: "还是按市价走吧，别为我担着",
                    sub: () => "该多少是多少，你不想欠这份人情",
                    续题: "他说了句什么",
                    续简: "这话是给他省事，也是给自己省事。可他不是图省事才这么干的。",
                    续谁: "老陈",
                    续话: "他嗯了一声，说：「行，那就按市价。」完了又把话头拉回来。\n「不过你那谷子出米率高，这个我照给。」",
                    续: [
                        { text: "谢他，出米率那部分照数结",
                            sub: () => "该拿的拿着，不该拿的不拿",
                            pick: (st?: any) => { ctx.记象(st, { 陈: 2 }); },
                            后: "过磅那天你自己去了，站在秤边上看着他记数。\n「你倒是盯着。」他说。\n你说：「不是盯你，是记账。」" },
                        { text: "连出米率那部分也推了，一律按市价",
                            sub: () => "推干净了，往后见面清清爽爽",
                            pick: (st?: any) => { ctx.记象(st, { 陈: 1 }); },
                            后: "他没再坚持，按市价结了。\n结完他把一张单子推给你，说：「明年的，你先看看。」" },
                    ] },
            ] } },
    { id: "陈断", 重: 75, 谁: "镇上的粮站", 题: "没人来收了", 当: (S?: any) => S.flags["条-加价"],
        说: "转过年来，你的谷子没人来收。都嫌你事多。\n老陈没说不收，只是把价压得比谁都低。",
        问: { options: [
                { text: "上门去，把去年那几条当面说清楚",
                    sub: () => "价压得低是明摆着的。你去，是为了让他知道你知道",
                    续题: "这话怎么开口",
                    续简: "他那台秤就摆在门口。说软了没用，说硬了往后更难。",
                    续谁: "老陈",
                    续话: "他看见你来了，没起身，把算盘往边上推了推。",
                    续: [
                        { text: "把去年的单子摊在秤上，一条一条对",
                            sub: () => "写清楚的那几条都在这儿。你把纸推过去，不说话",
                            pick: (st?: any) => { st.flags["后-找老陈"] = true; ctx.记象(st, { 陈: 4 }); },
                            后: "他对着看了半天，说：「你这一条，是我签的。」\n那一季他按市价给你收的。往后那几条他再没提过。" },
                        { text: "先说软话，把这一季的谷先卖出去",
                            sub: () => "价低就低，先把本钱收回来。话留到明年再说",
                            pick: (st?: any) => {
                                st.flags["后-找老陈"] = true;
                                st.flags["后-先低头"] = true;
                                ctx.记象(st, { 陈: 1 });
                            },
                            后: "他压的那个价，你认了。过磅的时候他多给你算了二十斤。\n「这一季算我占你便宜。」他说。往后他还照压。" },
                    ] },
                { text: "换一家，不跟他打交道了",
                    sub: () => "这一片收粮的就那几个。换一家，谷还是要过他的磅",
                    续题: "换的这一家，磅还是他那台",
                    续简: "这一片就那几台秤。换人不换秤，等于什么都没换。",
                    续谁: "老陈",
                    续话: "你换的那家姓王。过磅那天你才看见，磅是老陈的，人也是老陈的伙计。",
                    续: [
                        { text: "认了，往后就当不知道",
                            sub: () => "价按王家算的，磅按老陈的。这事在这一片是常事",
                            pick: (st?: any) => { st.flags["后-换粮商"] = true; ctx.记象(st, { 陈: -2 }); },
                            后: "这一季的价按王家算的，跟老陈那个低价差不多。\n这一片的事，你到第三年才算看明白。" },
                        { text: "掉头回去找老陈，把话说明白",
                            sub: () => "绕了一圈还是他。早知道就不绕这一圈了",
                            pick: (st?: any) => {
                                st.flags["后-换粮商"] = true;
                                st.flags["后-找老陈"] = true;
                                ctx.记象(st, { 陈: 3 });
                            },
                            后: "他看你回来了，笑了一下，说：「绕一圈，还得来。」\n这回他没压价。" },
                    ] },
                { text: "自己拉进城卖，不经过他",
                    sub: () => "路是你自己找的，价也是你自己谈的",
                    续题: "车装到一半，他过来了",
                    续简: "这一片的粮都是过他手的。你自己拉走，等于把这一条路封了。",
                    续谁: "老陈",
                    续话: "你往车上装谷的时候，他背着手站在粮站门口看着，一直看到装完。",
                    续: [
                        { text: "接着装，装完就走",
                            sub: () => "路是自己找的。他不来拦，你也不去打招呼",
                            pick: (st?: any) => { st.名望 = (st.名望 || 0) + 10; ctx.记象(st, { 陈: -1 }); },
                            后: "车开出镇口的时候你从后视镜里看了一眼，他还站在那儿。\n那一年城里的价确实高，可来回的运费和误工，你没算进去。" },
                        { text: "装完过去跟他说一声：明年还卖给你",
                            sub: () => "这一趟是探路，往后还得在这一片种",
                            pick: (st?: any) => {
                                st.flags["后-留一条路"] = true;
                                st.名望 = (st.名望 || 0) + 10;
                                ctx.记象(st, { 陈: 2 });
                            },
                            后: "他说：「随你。」又说，「城里那家我认得，价高不高不好说。」\n第二年你才知道，他这句话是提醒你。" },
                    ] },
            ] } },
    { id: "现钱", 重: 62, 谁: "这一片", 题: "白条收不收", 当: (S?: any) => S.flags["条-要现钱"] && S.印象.陈 >= 0,
        说: "后来这一片收粮的都知道，农大那个学生不收白条。\n有人嫌麻烦，也有人专门找他，现钱结的，省心。",
        问: { options: [
                { text: "那就立个规矩，往后一律现钱",
                    sub: () => "话许出去收不回来。往后有人拿白条来，你都得挡回去",
                    续题: "规矩立了，来的人就杂了",
                    续简: "找上门的有本村的，也有外村的。挡回去的人多了，话就多。",
                    续谁: "这一片",
                    续话: "头一个月来了四家。第三家是外村的，说了半天好话。",
                    续: [
                        { text: "一家一家挡回去，一条都不松",
                            sub: () => "规矩就是用来挡人的。松一条，往后每一条都得松",
                            pick: (st?: any) => {
                                st.flags["后-立规矩"] = true;
                                ctx.记象(st, { 陈: 3 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "挡到第四家，人家转身就走了。\n可从那以后，找你的人先问一句「现钱收不收」，再谈价。" },
                        { text: "挡回去，但给人家指条路：去粮站找老陈",
                            sub: () => "你不收，总得给人留个去处",
                            pick: (st?: any) => {
                                st.flags["后-立规矩"] = true;
                                st.flags["后-指条路"] = true;
                                ctx.记象(st, { 陈: 2 });
                                st.名望 = (st.名望 || 0) + 15;
                            },
                            后: "老陈后来听说了，跟你说了句：「你倒会做人。」\n「我这儿收白条。」他说。\n「可我记性好。」" },
                    ] },
                { text: "熟人的白条可以收，别的一律现钱",
                    sub: () => "留个口子，往后好说话",
                    续题: "口子一留，就有人往里钻",
                    续简: "熟人这两个字没边。谁算熟人，得你自己说了算。",
                    续谁: "这一片",
                    续话: "口子留了不到一季，就有人托熟人来问。",
                    续: [
                        { text: "把口子收死：只认本村，也只认三家",
                            sub: () => "熟人得有数。不数清楚，口子就是洞",
                            pick: (st?: any) => {
                                st.flags["后-立规矩"] = true;
                                st.flags["后-口子收死"] = true;
                                ctx.记象(st, { 陈: 2 });
                                st.名望 = (st.名望 || 0) + 10;
                            },
                            后: "本村的就那三家。往后谁托人来说，你一句「你不在这三家里」，话就完了。" },
                        { text: "谁来说都行，只要是熟人引的",
                            sub: () => "这一片就是熟人社会。谁引的谁担着",
                            pick: (st?: any) => { ctx.记象(st, { 陈: 1 }); },
                            后: "到了秋天有两张白条没兑上。引荐那个人自己上门把钱送来了，脸很难看。\n第二季你把这条规矩改了。" },
                    ] },
                { text: "有人专门来找，那就把这一条做成名声",
                    sub: () => "现钱结的省心。这是你手上唯一比老陈强的地方",
                    续题: "名声要做，就得立得住",
                    续简: "名声是别人给的，可撑着名声的是你自己。哪一季你现钱结不出来了，名声当场就塌。",
                    续谁: "这一片",
                    续话: "有人专门从别的村过来找你。车停在田边，人下来先问现钱。",
                    续: [
                        { text: "跟他把话说死：米一过磅，当天结钱",
                            sub: () => "当天结这条最难，也最值钱",
                            pick: (st?: any) => {
                                st.flags["后-立规矩"] = true;
                                st.flags["后-做成名声"] = true;
                                st.名望 = (st.名望 || 0) + 25;
                                ctx.记象(st, { 陈: 1 });
                            },
                            后: "那天你手上现钱不够，跟同学借了两万，当天结了。\n这事传出去以后，来找你的人越来越多 —— 「农大那个，当天结。」" },
                        { text: "先不打这个包票，按能结多少结多少",
                            sub: () => "当天结的话说出去，遇上紧的月份就是打自己的脸",
                            pick: (st?: any) => {
                                st.flags["后-立规矩"] = true;
                                st.flags["后-现钱不打包票"] = true;
                                ctx.记象(st, { 陈: 2 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "你说了个期限：七天。七天这事办得到，办了三年没差过一天。\n名声没有当天结那么响，可也一直没塌。" },
                    ] },
            ] } },
    { id: "认养", 重: 68, 谁: "田边 · 五月", 题: "明年还认这份", 当: (S?: any) => S.third === "认养" && S.stats.ecology >= 60,
        说: "认养的人在田边站了一下午，孩子蹲下去摸稻叶，问这个是不是米。\n走的时候她说，明年还认这份。",
        问: { options: [
                { text: "跟她说，明年这片田还在",
                    sub: () => "话许出去容易。明年生态掉下来，你就兑不出这份米了",
                    续题: "话许出去了",
                    续简: "认养这份靠的是田里养得住。哪一年生态掉下来，人家的米就跟别人的一样了。",
                    续谁: "认养的人",
                    续话: "她笑了，说那就说定了。孩子问你要不要去看看他们家那盆花。",
                    续: [
                        { text: "记下来，明年的米按今年的养法出",
                            sub: () => "认养这份，认的是这一亩养出来的米。养法一改，这份就没了",
                            pick: (st?: any) => {
                                st.flags["后-续认养"] = true;
                                st.flags["后-照今年的养法"] = true;
                                ctx.记象(st, { 村: 2 });
                            },
                            后: "第二年开春她来电话问，你说照老规矩。\n那一季你为了保住生态，多花了两百多块钱，她不知道。" },
                        { text: "先应下来，明年的事明年说",
                            sub: () => "农业上的事一年一个样。话许太满，兑不出来更难堪",
                            pick: (st?: any) => { st.flags["后-续认养"] = true; ctx.记象(st, { 村: 1 }); },
                            后: "第二年她的孩子上小学了，来得少了。\n米还是照寄，只不过有两回是她自己下田来拿的。" },
                    ] },
                { text: "把孩子领到田里，从稻穗讲到米",
                    sub: () => "他问这个是不是米。这一句你能答半天",
                    续题: "蹲在田边，怎么跟他讲",
                    续简: "孩子问的是「这个是不是米」。这个问题不好答，答浅了没意思，答深了他听不懂。",
                    续谁: "认养的人",
                    续话: "孩子蹲下去揪了一粒，剥开看了看，说「这个是饭」。",
                    续: [
                        { text: "从这一粒剥到白米，一步一步给他看",
                            sub: () => "剥开、搓开、对着光看。手上有的东西最好讲",
                            pick: (st?: any) => {
                                st.flags["后-续认养"] = true;
                                st.flags["后-带孩子看田"] = true;
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 10;
                            },
                            后: "剥了六粒，他的手上全是米糠。他妈妈在旁边拍了两张照片。\n照片后来发在朋友圈，第一行写的是「原来米饭这么来的」。" },
                        { text: "让他自己插一株，秋天来看它变成什么样",
                            sub: () => "讲一百句不如让他自己种一株",
                            pick: (st?: any) => {
                                st.flags["后-续认养"] = true;
                                st.flags["后-带孩子看田"] = true;
                                st.flags["后-留一株给他"] = true;
                                ctx.记象(st, { 村: 3 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "你在田角上给他留了一小片，插了六株。秋天他真来了。\n那六株收下来就一小把，他捧着不撒手。" },
                    ] },
                { text: "先别许，等明年开春再说",
                    sub: () => "你不敢保证明年生态还撑得住",
                    续题: "她愣了一下",
                    续简: "她说这话不是来讨的。她站了一下午，就是想说这句话。",
                    续谁: "认养的人",
                    续话: "她愣了一下，说「也是」，拉着孩子往外走。走到埂上又停下来，回头问了一句：「那明年我要是还想认，找谁？」",
                    续: [
                        { text: "给她留个话：想认就来找我",
                            sub: () => "话没许死，门留着",
                            pick: (st?: any) => { ctx.记象(st, { 村: 1 }); },
                            后: "她说好，记了你的手机号。\n第二年她没来。第三年开春她来了，说去年孩子上小学忙。" },
                        { text: "跟她说清楚：不是我推，是我真不敢保证",
                            sub: () => "实话。她听不听得进去是另一回事",
                            pick: (st?: any) => { st.flags["后-跟她说明白"] = true; ctx.记象(st, { 村: 1 }); },
                            后: "她听完说：「能说这话的人不多。」\n她走了之后，那个下午你在田边坐到天黑。" },
                    ] },
            ] } },
    { id: "研学", 重: 68, 谁: "田边 · 秋分前", 题: "挂不挂这个点", 当: (S?: any) => S.third === "研学" && S.stats.ecology >= 60,
        说: "来的那批孩子一人拔了一根稗子，说要带回去给同学看。\n老师临走问你，能不能把这块田挂成学校的校外实践点。",
        问: { options: [
                { text: "挂，我这边接着带",
                    sub: () => "往后每年都得接几批孩子，田也得一直这么养着",
                    续题: "这个点怎么挂",
                    续简: "牌子挂上去容易。挂上去之后每年来的人、每年要出的力，都得先想清楚。",
                    续谁: "带队老师",
                    续话: "老师掏出笔来准备记。他说：「就写一年两批行不行？」",
                    续: [
                        { text: "一年接两批，我自己带",
                            sub: () => "人不多，你带得过来。来的孩子能下田，不是站在埂上看",
                            pick: (st?: any) => {
                                st.flags["后-挂实践点"] = true;
                                ctx.记象(st, { 师: 2 });
                                st.名望 = (st.名望 || 0) + 20;
                            },
                            后: "第一批来了四十二个孩子。下田的那半天，你嗓子全喊哑了。\n回去的时候有个孩子把稗子忘在田埂上了，你替他收着，收了三季。" },
                        { text: "挂个名就行，来的人让村里接",
                            sub: () => "你腾不出手。牌子挂着，人来了往村里领",
                            pick: (st?: any) => {
                                st.flags["后-挂实践点"] = true;
                                ctx.记象(st, { 师: -1 });
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 10;
                            },
                            后: "村里接了头一年，第二年就跟你抱怨人多。\n牌子还挂着。来的孩子站在田埂上拍了照就走。" },
                    ] },
                { text: "挂，但得先跟田主说一声",
                    sub: () => "地是租的。牌子挂在别人地上，还得他点头",
                    续题: "去跟田主开这个口",
                    续简: "地里来来往往一大群孩子，踩的是人家的地。他点了头，这事才算数。",
                    续谁: "田主",
                    续话: "田主听完了，先问了一句：「不要钱吧？」",
                    续: [
                        { text: "跟他说清楚：不要钱，但来的人会踩地",
                            sub: () => "不糊弄他。踩坏了哪一块，你赔",
                            pick: (st?: any) => {
                                st.flags["后-挂实践点"] = true;
                                st.flags["后-问了田主"] = true;
                                ctx.记象(st, { 主: 3 });
                                ctx.记象(st, { 师: 1 });
                                st.名望 = (st.名望 || 0) + 18;
                            },
                            后: "他说：「踩就踩吧，我小时候也在田里踩。」\n又说了一句：「来的人要是踩了别人家的，你别管。」" },
                        { text: "跟他说：来的人多了，村里能给他点好处",
                            sub: () => "拿村里的好处去许，这话你说不算",
                            pick: (st?: any) => {
                                st.flags["后-挂实践点"] = true;
                                st.flags["后-许了田主"] = true;
                                ctx.记象(st, { 主: 1 });
                                ctx.记象(st, { 村: -1 });
                            },
                            后: "他去村里问了一趟，什么也没问着，回来脸不太好。\n牌子还是挂上了。往后他见了你话比从前少。" },
                    ] },
                { text: "不挂。来的人多了，田就没法种",
                    sub: () => "这一亩是拿来种稻子的，不是拿来当教室的",
                    续题: "老师没再劝",
                    续简: "他点了点头，把那张表收回去了。表上原本空着一栏，是田块编号。",
                    续谁: "带队老师",
                    续话: "他说「也行」，把表收进包里。收的时候那张表折了一下。",
                    续: [
                        { text: "跟他说明年再说，今年的稻子实在走不开",
                            sub: () => "留个后年。田种得住，点挂得起来",
                            pick: (st?: any) => { st.flags["后-不挂"] = true; ctx.记象(st, { 师: 1 }); },
                            后: "他说：「明年你可得想着。」\n第二年开春他真又问了。你答应了，就是这版里那个点。" },
                        { text: "不改口。就是不带人看田",
                            sub: () => "这一亩是你的，你说了算",
                            pick: (st?: any) => { st.flags["后-不挂"] = true; ctx.记象(st, { 师: -1 }); },
                            后: "那一批孩子后来去了别的村。\n你的田埂上清净了，只是从那以后，再没人来问过你的种法。" },
                    ] },
            ] } },
    { id: "名人", 重: 88, 谁: "村里 · 开春", 题: "人家来问你种什么", 当: (S?: any) => S.名望 >= 60,
        说: "开春有人来问你今年种什么、什么时候插。问完还记在本子上。\n你才发现，这一带已经把你当成一个懂行的人了。",
        问: { options: [
                { text: "从头到尾给他讲一遍",
                    sub: () => "你才种了几季。可他问的时候是认真的",
                    续题: "他记到第三行停下了",
                    续简: "他本子上的字写得慢。写到「晒田」那两个字的时候，笔停住了。",
                    续谁: "来问的人",
                    续话: "他抬起头问你：「晒到什么样算够？」\n这一句把你问住了 —— 你自己是按手感的，说不上来。",
                    续: [
                        { text: "照实说：这个我说不精确，得看田面开没开缝",
                            sub: () => "说不精确就说说不精确。含混过去，他回去是要照做的",
                            pick: (st?: any) => {
                                st.flags["后-带人看田"] = true;
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 15;
                            },
                            后: "他把「田面开缝」四个字记上了，又在旁边画了个歪歪的小人蹲着。\n第二年他照做了，收成比前一年好。他见人就说这一句是你教的。" },
                        { text: "给他讲个大概的日期，让他自己看着办",
                            sub: () => "给日期比给手感到省事。可日期在那块地上不一定对",
                            pick: (st?: any) => { st.flags["后-带人看田"] = true; st.名望 = (st.名望 || 0) + 10; },
                            后: "他记了日期，谢了你，走了。\n那年他按日期晒的，晒过了两天。稻子没死，但穗小了一圈。他没来找你说这事。" },
                    ] },
                { text: "不讲了，领他到田里指着说",
                    sub: () => "嘴上的都是书上的。田里的东西，得蹲下去看",
                    续题: "蹲在田埂上，怎么指",
                    续简: "指着说的事，你就得当场答得上来。田不会替你说。",
                    续谁: "老周",
                    续话: "你领他往田里走，路上碰见老周。老周看了你们一眼，没过来，站在远处看着。",
                    续: [
                        { text: "蹲下去，一样一样指给他看",
                            sub: () => "水口、裂纹、叶色、基部。指到哪说到哪",
                            pick: (st?: any) => {
                                st.flags["后-带人看田"] = true;
                                ctx.记象(st, { 村: 3 });
                                st.名望 = (st.名望 || 0) + 20;
                            },
                            后: "蹲了半个钟头，两个人都是一腿泥。\n老周一直站在远处。等你们起来，他转身走了。" },
                        { text: "请老周过来一起说",
                            sub: () => "这一片的事他比你熟。让他说，你在旁边听",
                            pick: (st?: any) => {
                                st.flags["后-带人看田"] = true;
                                st.flags["后-请周一起"] = true;
                                ctx.记象(st, { 周: 3 });
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 20;
                            },
                            后: "老周过来蹲下，先没说话，用手把田面扒开给他看。\n「缝开到这个份上，」他说，「就够。」说完看了你一眼。" },
                    ] },
                { text: "别把我当懂行的，我也在学",
                    sub: () => "实话。这话说出去，有人觉得你实在，也有人觉得你不行",
                    续题: "他愣住了",
                    续简: "他来问，是因为人家告诉他这一片有个懂行的。你这一句把那个说法推翻了。",
                    续谁: "来问的人",
                    续话: "他愣在那儿，本子还摊着，笔停在半空。",
                    续: [
                        { text: "补一句：你要问，咱们一块儿去问老周",
                            sub: () => "自己不懂，就把人指对。这是你能做的最实在的一件事",
                            pick: (st?: any) => {
                                ctx.记象(st, { 村: 2 });
                                ctx.记象(st, { 周: 1 });
                                st.名望 = (st.名望 || 0) + 8;
                            },
                            后: "他真去找老周了。老周那天讲了一下午。\n后来这一片的人有事还是先来找你 —— 「农大那个，他不懂的会给你指对地方。」" },
                        { text: "就这一句，说完接着干你的活",
                            sub: () => "话到这儿就完了",
                            pick: (st?: any) => { ctx.记象(st, { 村: 1 }); },
                            后: "他把本子合上走了。后来再没人来问过你种什么。" },
                    ] },
            ] } },
    { id: "照片", 重: 60, 谁: "公众号", 题: "名字没写上", 当: (S?: any) => S.flags["拍-配合"],
        说: "那组照片最后还是用了，配的说明写的是「镇里的青年返乡创业」。\n底下评论说这片田种得好。你的名字没出现。",
        问: { options: [
                { text: "找公众号，让他们把名补上",
                    sub: () => "地不是你的，可这一季的稻子是你种的",
                    续题: "电话打过去了",
                    续简: "公众号是镇上的。那边接电话的人挺客气，说这个得问领导。",
                    续谁: "公众号",
                    续话: "那边说：「照片是镇里的，说明文字也是镇里定的。」停了一下又说。\n「你说怎么改？」",
                    续: [
                        { text: "就说加一句「由农大学生种植管理」",
                            sub: () => "争的是这一句。名字加不加在其次",
                            pick: (st?: any) => {
                                st.flags["后-要署名"] = true;
                                st.名望 = (st.名望 || 0) + 15;
                                ctx.记象(st, { 村: -1 });
                            },
                            后: "第二天那行字加上了，加在末尾，字号比正文小一号。\n村里有人看见了，说你这人爱较真。" },
                        { text: "说：把我的名字加上，别的不用改",
                            sub: () => "要的就是名字。这是你这一季的东西",
                            pick: (st?: any) => {
                                st.flags["后-要署名"] = true;
                                st.flags["后-点名"] = true;
                                st.名望 = (st.名望 || 0) + 18;
                                ctx.记象(st, { 村: -2 });
                            },
                            后: "名字加上了，挂在「种植指导」四个字后头。\n镇里那边打电话来问了一句，语气不算好。这事你后来没跟人提。" },
                    ] },
                { text: "算了。田种在那儿，谁拍的都一样",
                    sub: () => "底下说这片田种得好，这就够了",
                    续题: "这事你没再提",
                    续简: "照片底下那一行字，你翻来覆去看了两遍，关掉了。",
                    续谁: "老周",
                    续话: "过了几天老周在地头跟你说：「那张照片，我看着眼熟。」他没往下说。",
                    续: [
                        { text: "跟他说：照片拍的就是这块地",
                            sub: () => "他看得出来。这一片哪块地什么样，他比照片清楚",
                            pick: (st?: any) => { ctx.记象(st, { 周: 2 }); ctx.记象(st, { 村: 2 }); },
                            后: "他说：「拍得好。就是没写谁种的。」\n他说完就扛着锹走了。这一句话你在心里放了一季。" },
                        { text: "嗯一声，不接话",
                            sub: () => "照片的事到这儿就过去了",
                            pick: (st?: any) => { ctx.记象(st, { 村: 2 }); },
                            后: "那一组照片在镇上的公众号里挂了一整年。\n你后来自己转了一次，配了一行字：「地是租的，稻子是种的。」" },
                    ] },
                { text: "自己拍一组，每个节气拍一张",
                    sub: () => "别人拍的是风景，你拍的是账",
                    续题: "拍了六个节气了",
                    续简: "一开始拍得挺顺。拍到第六张你才发现，前面几张的角度全是一样的。",
                    续谁: "同学A",
                    续话: "同学A 看了眼你的相册，说：「你这六张，我分不出哪张是哪天。」",
                    续: [
                        { text: "从下一季开始连人一起拍",
                            sub: () => "地是一样的，人是变的。有人站在里头，那年那季就看得出来",
                            pick: (st?: any) => {
                                st.flags["后-自己拍"] = true;
                                st.flags["后-把人也拍进去"] = true;
                                st.名望 = (st.名望 || 0) + 15;
                            },
                            后: "老周肯站在田埂上让你拍 —— 条件是不许拍脸。\n两年攒下来那一组，田主看了半天，说想留一份。" },
                        { text: "接着拍地，把日子写在照片角上",
                            sub: () => "一样的角度才好对比。写上日子，就分得清了",
                            pick: (st?: any) => { st.flags["后-自己拍"] = true; st.名望 = (st.名望 || 0) + 10; },
                            后: "八个节气八张，一个角度。三年下来二十四张摞在一起。\n翻到最后那张，你自己也愣了一下。" },
                    ] },
            ] } },
    { id: "租牌", 重: 55, 谁: "田埂上", 题: "新牌子钉在木桩上", 当: (S?: any) => S.flags["牌-拔了"],
        说: "镇上来人补了一块新牌子，这回是钉在木桩上的，拔不动。\n路过的人拍照，位置还是你这一亩。",
        问: { options: [
                { text: "就这样吧，位置还是这一亩",
                    sub: () => "牌子上没你的名字，地里种的是你的稻子",
                    续题: "拍照的人一天比一天多",
                    续简: "周末有人在田埂上摆了三脚架。稻子还没熟，田埂先踩出一条道来。",
                    续谁: "老赵",
                    续话: "老赵从田埂上过，绕开了那几个拍照的，脸上没什么表情。",
                    续: [
                        { text: "跟老赵聊两句，问他村里怎么看这块牌子",
                            sub: () => "牌子的位置是你这一亩。村里人天天从这儿过",
                            pick: (st?: any) => { ctx.记象(st, { 村: 2 }); ctx.记象(st, { 赵: 2 }); },
                            后: "老赵说：「牌子是镇里的，地是田主的，稻子是你的。三个人三样东西。」\n他说完就走了。这一句话比什么都清楚。" },
                        { text: "什么也不说，回去接着干",
                            sub: () => "牌子立在那儿也不耽误种地",
                            pick: (st?: any) => { ctx.记象(st, { 村: 1 }); },
                            后: "那一季来拍照的人踩坏了两垄。\n你在田埂上插了根竹竿，拉了一条绳。没人看那根绳。" },
                    ] },
                { text: "去镇上问一句，这块田是我在种",
                    sub: () => "争的是一块牌子，也是一句话",
                    续题: "镇上的办公室里",
                    续简: "接待你的人挺客气，问了半天才明白你说的是哪块地。",
                    续谁: "镇上的",
                    续话: "他把手里的文件放下，说：「牌子是宣传口立的，你说的这个我得问问。」",
                    续: [
                        { text: "把话说完：不是要牌子，是要别写错",
                            sub: () => "不争面子，争的是别让人认错地方",
                            pick: (st?: any) => {
                                st.flags["后-争牌子"] = true;
                                st.名望 = (st.名望 || 0) + 18;
                                ctx.记象(st, { 村: -1 });
                            },
                            后: "牌子后来改了一行，加在背面：「本块田由农大学生种植管理」。\n字小，得凑近了才看得见。但那是你自己去争来的。" },
                        { text: "问到底：这个牌子谁定的、按什么定的",
                            sub: () => "话问到底了，人家就得给个说法",
                            pick: (st?: any) => {
                                st.flags["后-争牌子"] = true;
                                st.flags["后-问到底"] = true;
                                st.名望 = (st.名望 || 0) + 12;
                                ctx.记象(st, { 村: -2 });
                            },
                            后: "他翻了半天材料，最后说：「定的时候没想那么多。」\n这话你信。可村里从那以后见了你，客气是客气，话少了。" },
                    ] },
                { text: "自己在田边立一块，写清楚是谁在种",
                    sub: () => "不跟谁争。就是让路过的人知道这一亩有人管",
                    续题: "自己这块牌子上写什么",
                    续简: "一块牌子能写下的字不多。写什么，就看你最在意哪一样。",
                    续谁: "田主",
                    续话: "你拿着板子去田边的时候，田主正蹲在埂上。他抬头问你：「你也立一块？」",
                    续: [
                        { text: "写：这一亩由农大学生种植管理",
                            sub: () => "跟镇里那块避开，但把话说明白",
                            pick: (st?: any) => {
                                st.flags["后-自己立牌"] = true;
                                ctx.记象(st, { 主: 2 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "牌子立上了，比镇里那块矮一截。\n有人拍照的时候两块都拍进去，评论区里有人问：怎么有两块牌子。" },
                        { text: "写：这一亩，田主某某，种的人某某",
                            sub: () => "把两个人的名字都写上。地是人家的，这没什么好藏的",
                            pick: (st?: any) => {
                                st.flags["后-自己立牌"] = true;
                                st.flags["后-写上田主"] = true;
                                ctx.记象(st, { 主: 4 });
                                st.名望 = (st.名望 || 0) + 15;
                            },
                            后: "田主蹲在那儿看了半天，说：「我名字写小点儿。」\n后来他每年开春都拿布把那块牌子擦一遍。" },
                    ] },
            ] } },
    { id: "不种", 重: 64, 谁: "老周", 题: "今年到底种不种", 当: (S?: any) => (S.问周总 || 0) + (S.问周 || 0) >= 6,
        说: "又是一年。老周在地头看见你，没等你开口就先说了：\n「你今年，到底种不种？」",
        问: { options: [
                { text: "种，还种这一亩",
                    sub: () => "他等你这句话等了两年",
                    续题: "他等到了这一句",
                    续简: "等了两年的一句话，听过之后他不一定就走。他大概还有下半句。",
                    续谁: "老周",
                    续话: "他嗯了一声，脸上没什么变化，可手从兜里拿出来了。站了一会儿才开口。",
                    续: [
                        { text: "问他：今年您看我该怎么种",
                            sub: () => "他要说的就是这个。你先问，他就不用绕",
                            pick: (st?: any) => { st.flags["后-交底"] = true; ctx.记象(st, { 周: 5 }); },
                            后: "他说了一大段，是这几年他说得最长的一次。你一句都没插。\n说完他说：「就这些。记不住的你自己试。」" },
                        { text: "把这一季的打算先说给他听",
                            sub: () => "他问的是种不种，你说的是怎么种。他知道你心里有数了",
                            pick: (st?: any) => { st.flags["后-交底"] = true; ctx.记象(st, { 周: 4 }); },
                            后: "他听完点了点头，说：「那你就种你的。」\n那一季他一次都没指点过你，可你每一步怎么走，他都来看过。" },
                    ] },
                { text: "种。今年想试试新的种法",
                    sub: () => "把你想试的那套先跟他说一遍。他听不听是另一回事",
                    续题: "新种法怎么跟他说",
                    续简: "他要问的是「你还种不种」，你想说的是「能不能换个种法」。两句话得分开说。",
                    续谁: "老周",
                    续话: "他没接话，先把锹往地上一插，两只手搭在锹把上。",
                    续: [
                        { text: "先听他说完，再说你的",
                            sub: () => "他种了四十年。你要改的那几条，多半他已经试过一遍了",
                            pick: (st?: any) => {
                                st.flags["后-交底"] = true;
                                st.flags["后-听了老的"] = true;
                                ctx.记象(st, { 周: 4 });
                            },
                            后: "他没说你那套不行，只说了一条：「这个我第十年试过，那年水大，没试出来。」\n你没改主意。他也没再劝。" },
                        { text: "直接把你的账摊开给他看",
                            sub: () => "两季的账都在这儿。数比话说得清楚",
                            pick: (st?: any) => {
                                st.flags["后-交底"] = true;
                                st.flags["后-摊账"] = true;
                                ctx.记象(st, { 周: 2 });
                                st.名望 = (st.名望 || 0) + 10;
                            },
                            后: "他一页一页翻，翻到某一页停住了，指着上面一个数问：「这一笔你怎么算的？」\n那是你唯一一笔估的数。他看出来了。" },
                    ] },
                { text: "还不一定",
                    sub: () => "他点了点头，没再问。这是第三年了",
                    续题: "他扛起锹走了",
                    续简: "他说了句「行」，转身往南边去了。走了七八步。",
                    续谁: "老周",
                    续话: "他走了七八步，在田埂拐角那儿停下了，没回头。",
                    续: [
                        { text: "追上两步，跟他说今年还种",
                            sub: () => "他停在那儿，就是在等你这一句",
                            pick: (st?: any) => { st.flags["后-交底"] = true; ctx.记象(st, { 周: 3 }); },
                            后: "他回过头，说的还是那句：「那你种你的。」\n说完就走了。这句话他说过两回，这是第二回。" },
                        { text: "站在原地，没动",
                            sub: () => "话没说完，他也没再问",
                            pick: (st?: any) => { ctx.记象(st, { 周: -2 }); },
                            后: "他在拐角那儿站了一会儿，走了。\n那一年他再没问过你种不种。他那个岗年底撤了。" },
                    ] },
            ] } },
    { id: "立会", 重: 86, 谁: "村委会 · 冬月", 题: "最上头那把椅子", 当: (S?: any) => S.名望 >= 170,
        说: "冬月里村里议水渠的事，村长让人来叫你。\n你推门进去，屋里已经坐了七八个人，最上头空着一把椅子。",
        问: { options: [
                { text: "坐下，先听他们说",
                    sub: () => "屋里坐着的都是种了一辈子的人。先听，比先说强",
                    续题: "你坐下了，屋里静了一下",
                    续简: "他们等着你说。你这一坐下，会就开到了你身上。",
                    续谁: "村长",
                    续话: "村长咳了一声，说：「那咱接着议。」可屋里没人往下接。",
                    续: [
                        { text: "听到最后再说话",
                            sub: () => "一屋子人的话都听完了，你才知道哪一句是自己的",
                            pick: (st?: any) => {
                                st.flags["后-开过会"] = true;
                                ctx.记象(st, { 村: 3 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "散会的时候你说了三句。三句都说在水渠上，没一句在钱上。\n出门的时候村长跟你并排走了一段，什么也没说。" },
                        { text: "听到一半就把本子摊开",
                            sub: () => "你说的是你亲手记的数。他们说的是从前的事。两边对不上，得摆出来",
                            pick: (st?: any) => {
                                st.flags["后-开过会"] = true;
                                st.flags["后-会上摊账"] = true;
                                ctx.记象(st, { 村: 2 });
                                ctx.记象(st, { 周: 2 });
                                st.名望 = (st.名望 || 0) + 18;
                            },
                            后: "你把本子摊在桌上，指着那一页说：「前年这个水口，是这时候堵的。」\n坐在对面的老周点了一下头。他点的这一下，比什么都管用。" },
                    ] },
                { text: "先说一句：这事我不懂，我只报个数",
                    sub: () => "把话说在前头。懂的说懂，记的说记，这屋里没人怪你",
                    续题: "你把本子拿出来了",
                    续简: "屋里七八双眼睛。你手上只有一本记了两年的账，别的什么都没有。",
                    续谁: "村委会 · 冬月",
                    续话: "村长说：「你报。」屋里安静下来，有人把烟掐了。",
                    续: [
                        { text: "报这两年记的水账，一笔不添",
                            sub: () => "哪个水口什么时候堵的、堵了几天，都在本子上",
                            pick: (st?: any) => {
                                st.flags["后-开过会"] = true;
                                st.flags["后-会上报水账"] = true;
                                ctx.记象(st, { 村: 4 });
                                st.名望 = (st.名望 || 0) + 20;
                            },
                            后: "你报完，旁边一个老头说：「这数我认。」\n他是这一片管水最久的人。这句「我认」比会议记录管用。" },
                        { text: "报完就坐下来听",
                            sub: () => "报了数就完了。往下怎么议是他们的",
                            pick: (st?: any) => {
                                st.flags["后-开过会"] = true;
                                ctx.记象(st, { 村: 3 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "你报完坐下，会接着往下开。散会的时候有人过来问了你的名字。" },
                    ] },
                { text: "不坐那把椅子，搬个凳子坐门口",
                    sub: () => "那把椅子是留给说话的人的。你今天没话要说",
                    续题: "你坐到门口了",
                    续简: "门开着，外面是黑的。屋里的话从你背后一句一句过来。",
                    续谁: "村委会 · 冬月",
                    续话: "村长看了你一眼，没说什么，把椅子拉到一边去了。",
                    续: [
                        { text: "坐在门口，一句不落听完全程",
                            sub: () => "坐到门口听，比坐到前头听得清楚",
                            pick: (st?: any) => {
                                st.flags["后-开过会"] = true;
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 8;
                            },
                            后: "散会你最后一个走。这一片的水从哪儿来、往哪儿去，你是这一晚上才听明白的。" },
                        { text: "坐门口听完，散会以后单独找村长说",
                            sub: () => "会上说给一屋子人听，会后才是说给他一个人听",
                            pick: (st?: any) => {
                                st.flags["后-开过会"] = true;
                                st.flags["后-会后单独说"] = true;
                                ctx.记象(st, { 村: 3 });
                                st.名望 = (st.名望 || 0) + 10;
                            },
                            后: "你把会上没人接的那一句跟他说了。他听完说：「这话你别在会上说。」\n停了停又说：「跟我说就行。」" },
                    ] },
            ] } },
    { id: "代言", 重: 88, 谁: "镇上的 · 开春", 题: "稿子里那一句", 当: (S?: any) => S.名望 >= 220,
        说: "镇里要出一本讲这一带稻子的册子，让人来问你几句。\n来的人把录音笔搁在桌上，说：「你说，我记。」",
        问: { options: [
                { text: "照他问的答",
                    sub: () => "他问什么你答什么。这本册子是给外面的人看的",
                    续题: "他问了三句，你答了三句",
                    续简: "录音笔一直亮着红灯。稿子是他写，写成什么样，你现在还能说上一句话。",
                    续谁: "镇上的 · 开春",
                    续话: "他合上本子，说「够了」。",
                    续: [
                        { text: "跟他说：稿子出来给我看一眼",
                            sub: () => "不是不信他。是这一片的事，写错一个字就传下去了",
                            pick: (st?: any) => {
                                st.flags["后-过稿"] = true;
                                ctx.记象(st, { 村: 1 });
                                st.名望 = (st.名望 || 0) + 15;
                            },
                            后: "他把稿子给你看了。你改了两个地方：一个是水口的名，一个是稻子的行距。\n他两个都改了。" },
                        { text: "说：不用看了，你写吧",
                            sub: () => "人家是干这个的。你插手，人家未必高兴",
                            pick: (st?: any) => {
                                st.flags["后-没要稿"] = true;
                                ctx.记象(st, { 村: 1 });
                                st.名望 = (st.名望 || 0) + 8;
                            },
                            后: "册子印出来以后你翻了两页。水口的名写错了一个字。\n错的那一个字，往后外面的人都会照着念。" },
                    ] },
                { text: "先问一句：这本册子是给谁看的",
                    sub: () => "给外面的人看，和给这一片的人看，不是一个写法",
                    续题: "他说「给外面的人看」",
                    续简: "知道给谁看了，往下说什么就得挑。挑对了是替这一片说话，挑错了是替自己说话。",
                    续谁: "镇上的 · 开春",
                    续话: "他愣了一下，说：「给外面的人看。怎么了？」",
                    续: [
                        { text: "那就按外面人听得懂的说",
                            sub: () => "说水口、说行距、说什么时候断水。不绕，不玄",
                            pick: (st?: any) => {
                                st.flags["后-过稿"] = true;
                                st.flags["后-按外头人说"] = true;
                                st.名望 = (st.名望 || 0) + 18;
                            },
                            后: "他记得很快，中间问了一句：「水口是什么？」\n你才明白，以前那些稿子里写的「古法灌溉」，外面人一个都没看懂。" },
                        { text: "按这一片自己人的说法讲",
                            sub: () => "用这一片的话讲。外面人听不全懂，这一片的人听着对",
                            pick: (st?: any) => {
                                st.flags["后-过稿"] = true;
                                st.flags["后-按自己人说"] = true;
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 12;
                            },
                            后: "他记到一半停了，说：「这个词我写不进去。」\n后来那句他在稿子里留了个括号，括号里是你说的原话。" },
                    ] },
                { text: "跟他说：要写就写这一亩，别写我",
                    sub: () => "册子写的是这一带的稻子，不是哪个人的事",
                    续题: "他把录音笔往你这边推了推",
                    续简: "他要听的是人。你说的是地。这两样差着一层。",
                    续谁: "镇上的 · 开春",
                    续话: "他把录音笔往你这边推了推，说：「那你说说这一亩。」",
                    续: [
                        { text: "领他下田，让他自己看",
                            sub: () => "嘴说一百句，不如让他蹲下去看一眼",
                            pick: (st?: any) => {
                                st.flags["后-带他看田"] = true;
                                ctx.记象(st, { 村: 1 });
                                st.名望 = (st.名望 || 0) + 20;
                            },
                            后: "他在田埂上蹲了小半个钟头，拍了几张照。\n册子印出来的时候，那几张照片占了整整一页 —— 底下只有一行字：这一亩。" },
                        { text: "把这两年的账抄一份给他",
                            sub: () => "八个节气哪一步花了多少，纸上有",
                            pick: (st?: any) => { st.flags["后-抄账给他"] = true; st.名望 = (st.名望 || 0) + 16; },
                            后: "他把那几张账翻来覆去看了半天，说：「这个册子里放不下。」\n停了停又说：「我另写一篇。」" },
                    ] },
            ] } },
    { id: "传种", 重: 90, 谁: "邻田 · 秋后", 题: "上门讨种", 当: (S?: any) => S.名望 >= 280,
        说: "秋后有人上门讨种，是邻村种稻的。他手里拎着个布袋子，站在田埂上没好意思开口。\n「听说你这米能卖上价。」他说。\n「我想明年也试试。」",
        问: { options: [
                { text: "给他种，顺手把记的那几页也抄给他",
                    sub: () => "种子给了是一季的事。那几页给了，是往后的事",
                    续题: "他接过布袋，没走",
                    续简: "他要的是种，你给的是种加本子。这两样在他手里分量不一样。",
                    续谁: "邻田 · 秋后",
                    续话: "他把布袋揣进怀里，捏着那几页纸看了半天，说：「这个我看不太懂。」",
                    续: [
                        { text: "跟他一句一句讲本子上的数",
                            sub: () => "纸上写的是日子和水深。他种过，讲一遍就通",
                            pick: (st?: any) => {
                                st.flags["后-给种"] = true;
                                st.flags["后-连本子一起"] = true;
                                st.flags["后-讲了一遍"] = true;
                                ctx.记象(st, { 村: 2 });
                                st.名望 = (st.名望 || 0) + 22;
                            },
                            后: "讲到「哪一天断水」那一句，他打断你：「断到田面开缝？」\n他说他那边也这么做，就是不敢断狠。这话你记下来了 —— 第二年你试了一回。" },
                        { text: "让他拿回去自己看，看不懂再来问",
                            sub: () => "纸在他手里，路他自己走。这条路慢，但是他的",
                            pick: (st?: any) => {
                                st.flags["后-给种"] = true;
                                st.flags["后-连本子一起"] = true;
                                st.名望 = (st.名望 || 0) + 18;
                            },
                            后: "他秋后真来了两趟。第二趟带了半袋他自己留的种，说：「你那个种，我那块地种不住。」\n这话比谢你十句有用。" },
                    ] },
                { text: "先问他那块地的水土",
                    sub: () => "同一个种，换一块地未必成。这话得先问",
                    续题: "他说了说他那块地",
                    续简: "他说地在河边上，水大。这一句就够你听出问题了。",
                    续谁: "邻田 · 秋后",
                    续话: "他说：「我那地靠着河，水大。」他说这话的时候自己也觉得不对。",
                    续: [
                        { text: "跟他说明白：这个种在那儿未必成",
                            sub: () => "给不成的种，等于让人白搭一年",
                            pick: (st?: any) => {
                                st.flags["后-先问水土"] = true;
                                st.flags["后-没给种"] = true;
                                ctx.记象(st, { 村: 3 });
                                st.名望 = (st.名望 || 0) + 20;
                            },
                            后: "他站在田埂上愣了一会儿，说：「那你让我拿点啥？」\n你给他指了另一种。他第二年种的还真是那一类。" },
                        { text: "给他种，同时告诉他水怎么管",
                            sub: () => "种能给，可是得连水一起给。少给一样就是害他",
                            pick: (st?: any) => {
                                st.flags["后-给种"] = true;
                                st.flags["后-先问水土"] = true;
                                st.flags["后-连水一起给"] = true;
                                st.名望 = (st.名望 || 0) + 24;
                            },
                            后: "你把排水那一段讲了半个钟头。他临走说：「这比种贵。」\n第二年他那边收成一般，可没倒。他见人就说这是你教的。" },
                    ] },
                { text: "不给种，先领他去看一季",
                    sub: () => "种是死的，看是活的。看一季比给一袋强",
                    续题: "他愣住了",
                    续简: "他拎着布袋来，是奔着一袋种来的。你说的是让他等一年。",
                    续谁: "邻田 · 秋后",
                    续话: "他把布袋往身后挪了挪，说：「那我明年看什么？」",
                    续: [
                        { text: "看你怎么选种、怎么泡、什么时候断水",
                            sub: () => "从谷雨看到秋分。看完了他自己知道要哪一袋",
                            pick: (st?: any) => {
                                st.flags["后-不给种"] = true;
                                st.flags["后-领他看一季"] = true;
                                ctx.记象(st, { 村: 3 });
                                st.名望 = (st.名望 || 0) + 26;
                            },
                            后: "谷雨那天他来了，站在田埂上从头看到尾。秋分又来了一趟。\n第二年他自己留的种，比从你这儿拿的要合适。" },
                        { text: "跟他说：明年秋后你要是还想要，再来拿",
                            sub: () => "话留着。他要是真上心，会再来",
                            pick: (st?: any) => { st.flags["后-不给种"] = true; st.名望 = (st.名望 || 0) + 12; },
                            后: "他第二年没来。第三年来了，说去年那块地改种菜了。\n这回你给了他种，也给了本子。" },
                    ] },
            ] } },
    { id: "入志", 重: 94, 谁: "镇志办", 题: "这一亩要单记一笔", 当: (S?: any) => S.名望 >= 360,
        说: "镇里修志，管这事的人找到你，说京西稻这一节要写。\n他摊开一张表：「写谁种的、哪块地、哪一年。你报一报。」",
        问: { options: [
                { text: "照表报：哪块地、哪一年、谁种的",
                    sub: () => "表上就这三栏。一栏一栏填，不添别的",
                    续题: "报到「谁种的」那一栏",
                    续简: "笔停在那一栏上。这一栏填什么，往后几十年就照这个念。",
                    续谁: "镇志办",
                    续话: "他抬头问你：「这一栏，填你一个，还是都要填？」",
                    续: [
                        { text: "填三个人：田主、老周、我",
                            sub: () => "地是田主的，四十年那本子是老周的。这一栏填一个人不实在",
                            pick: (st?: any) => {
                                st.flags["后-入志"] = true;
                                st.flags["后-志上填三个"] = true;
                                ctx.记象(st, { 周: 3 });
                                ctx.记象(st, { 主: 3 });
                                st.名望 = (st.名望 || 0) + 30;
                            },
                            后: "他把三个名字都写上了，田主写在头一个。\n老周后来听说了，什么也没说。过了两天，他把那本本子又翻出来晒了晒。" },
                        { text: "填我一个，另两个写在后头的注里",
                            sub: () => "正栏一个人，注释里写全。表就那么宽",
                            pick: (st?: any) => {
                                st.flags["后-入志"] = true;
                                ctx.记象(st, { 主: 1 });
                                st.名望 = (st.名望 || 0) + 20;
                            },
                            后: "他照你写的填了。注释那一行字号小，可那一行里有田主和老周的名字。" },
                    ] },
                { text: "先问他：这一节怎么写，写多长",
                    sub: () => "志书上的字只言片语。写什么不写什么，得先知道",
                    续题: "他翻给你看了前面那一节",
                    续简: "前面写的是别的村，说的是「京西稻曾广泛种植」七个字。这一亩在这七个字里。",
                    续谁: "镇志办",
                    续话: "他说：「按理说，有一句就不错了。」",
                    续: [
                        { text: "跟他说：那就把这一句写实",
                            sub: () => "不争篇幅，争的是这一句里得有真东西",
                            pick: (st?: any) => {
                                st.flags["后-入志"] = true;
                                st.flags["后-写实那一句"] = true;
                                st.名望 = (st.名望 || 0) + 28;
                            },
                            后: "后来印出来那一句是：「稻作沿用旧法，田在某某村，种者某某。」\n字不多。可这一句里，有水口，有行距，有断水的那几天。" },
                        { text: "把这几年的账整本交给他",
                            sub: () => "他要多少有多少。用不用是他的事",
                            pick: (st?: any) => {
                                st.flags["后-入志"] = true;
                                st.flags["后-交了整本账"] = true;
                                st.名望 = (st.名望 || 0) + 24;
                            },
                            后: "他把账抱走了。过了半年给你送回来，封皮上多贴了一张条。\n条上写：「此本待整理入档」。那一节最后还是只写了一句，可他没把账还到村里。" },
                    ] },
                { text: "跟他说：这一笔别记我，记这一亩",
                    sub: () => "修志记的是地，不是人",
                    续题: "他把笔搁下了",
                    续简: "他修了这些年志，报上来的人都要往里挤。你这个是往回推。",
                    续谁: "镇志办",
                    续话: "他看了你一眼，说：「记地也得有个人名管着。」",
                    续: [
                        { text: "那就记田主的名，我写在注里",
                            sub: () => "地是他的。这一亩能留到今天，先得谢谢他肯租给你",
                            pick: (st?: any) => {
                                st.flags["后-入志"] = true;
                                st.flags["后-记田主"] = true;
                                ctx.记象(st, { 主: 4 });
                                st.名望 = (st.名望 || 0) + 26;
                            },
                            后: "田主的名写进志里了。这张样稿你拿去给他看的时候，他捏着纸边看了三遍。\n「我这一亩，」他说，「进了志了。」" },
                        { text: "就写「承包者某某」，不写全名",
                            sub: () => "留下一个位置，不留下一个人",
                            pick: (st?: any) => { st.flags["后-入志"] = true; st.名望 = (st.名望 || 0) + 18; },
                            后: "他照写了。印出来以后，村里有人问这一笔是谁。\n田主在旁边说了句：「我那块地。」" },
                    ] },
            ] } },
    { id: "赵站", 重: 56, 谁: "碾米房 · 秋后",
        题: "车 厢 是 空 的",
        当: (S?: any) => S.flags["人-顶了老赵"] || S.flags["人-认了软"] || S.flags["人-硬到底"],
        说: "新米下来了，你拉着粮去碾米房。\n"
            + "门口排着两辆车，老赵那辆停在最前头，车厢是空的。\n"
            + "他坐在驾驶室里，看见你了。\n"
            + "没下车，也没按喇叭。\n"
            + "去年在田埂上那几句话，过去快一年了，谁也没再提。",
        问: { options: [
                { text: "把车停到他旁边，等他先开口",
                    sub: (st?: any) => st.flags["人-认了软"]
                        ? "去年你应过他：出手之前先问一声"
                        : st.flags["人-顶了老赵"]
                            ? "上回你当着人说：问了你也不加价。埂那头有人看着"
                            : "你说过米是你的。他让你想清楚",
                    续题: "他把烟掐了", 续简: "驾驶室那扇窗摇下来一半，烟味先出来。",
                    续谁: "老赵", 续话: "他隔着半开的窗户看你，看了有一会儿。",
                    续: [
                        { text: "先问他一句：今年什么价",
                            后: "「你去年怎么不问？」他说。\n"
                                + "说完自己笑了一下，不像开玩笑。\n"
                                + "他还是报了个数，三块一，比去年低一毛。\n"
                                + "你听出来这一毛不是行价，是他给你的。\n"
                                + "你收下了。" },
                        { text: "先认一句：去年那事，是我话说急了",
                            后: "他愣了一下，把手从档杆上拿开。\n"
                                + "「急不急的，」他说，「你卖了不就完了。」\n"
                                + "他下了车，走到你车斗边上，抓了一把米在手里搓。\n"
                                + "「这成色比去年强。」\n"
                                + "价还是三块一，可这一句是他自己加的。" },
                        { text: "什么也不说，就停在那儿",
                            后: "两个人谁也没先说话。\n"
                                + "后头那辆车按了两声喇叭，绕过去了。\n"
                                + "过了一会儿他把车打着火，倒出去，走了。\n"
                                + "他从你旁边过的时候看了你一眼，还是没说话。\n"
                                + "那天夜里你把粮拉回仓里，没卖。" },
                    ] },
                { text: "倒出去，去镇上另找一家",
                    sub: () => "这一片收粮的就那几个。倒出去容易，想再回来就难了",
                    续题: "镇东头那家是去年新开的", 续简: "院子挺大，磅是新的，看门的是个年轻人。",
                    续谁: "收粮的", 续话: "「有粮？」他把门帘掀开一条缝，「拉进来看看。」",
                    续: [
                        { text: "让他看，价钱合适就出手",
                            后: "他抓了一把，掂了掂，报三块二。\n"
                                + "比老赵那边高。你问他怎么不去村里收，他说不敢去。\n"
                                + "「那边有人打过招呼。」他说这话的时候没看你。\n"
                                + "你听懂了。你这一车米，是从别人让出来的缝里挤出去的。" },
                        { text: "问他一句：老赵那边打过招呼没有",
                            后: "他停了一下，说没有。\n"
                                + "然后又问：「你问这个干什么。」\n"
                                + "你说没什么。\n"
                                + "他还是收了，价压到三块。\n"
                                + "这一趟你没亏，可你知道了：这个数还是老赵定的。" },
                        { text: "算了，拉回去",
                            后: "你把车倒出院子，一路开回去。\n"
                                + "路过碾米房的时候天已经黑了，老赵那辆车还在。\n"
                                + "你没停。\n"
                                + "那天晚上你在仓房里坐到很晚，粮堆在背后，一粒没动。" },
                    ] },
                { text: "下车，走过去敲他的车窗",
                    sub: () => "把话当面说开，比隔着两辆车强",
                    续题: "他把玻璃摇下来了", 续简: "里头收音机开着，在报天气。",
                    续谁: "老赵", 续话: "他把收音机关了，手还搭在旋钮上。",
                    续: [
                        { text: "问他：去年那车米，你还收不收",
                            后: "他看了你半天。\n"
                                + "「我收粮，」他说，「我不认人。」\n"
                                + "「你拉来，我过磅，什么成色什么价。」\n"
                                + "「你要是想让我认你这个人，那还没有。」\n"
                                + "他说完，把车往前挪了半米，磅前头那个位置让给了你。" },
                        { text: "跟他说：那一车，我就是想自己试试能不能卖上价",
                            后: "「试试。」他把这两个字嚼了一遍。\n"
                                + "「你试成了没有？」\n"
                                + "你说试成了。\n"
                                + "他嗯了一声，把窗摇上去一半，说：「那你接着试。」\n"
                                + "这句话你听不出是撵你还是放你。后来你想明白了，是放你。" },
                        { text: "什么也不说，递过去一根烟",
                            后: "他接了，没点，夹在耳朵上。\n"
                                + "两个人隔着车窗站了一会儿。\n"
                                + "后来是他先开口：「今年雨水多，米容易返潮。你这车搁几天了？」\n"
                                + "你说三天。\n"
                                + "他说赶紧出手。这一句是正经话。" },
                    ] },
            ] } },
    { id: "家账", 重: 62, 谁: "家里 · 腊月",
        题: "铁 盒 子 里 那 一 沓",
        当: (S?: any) => ["家-报了实数", "家-报了虚数", "家-顶了妈", "家-讲了", "家-没追", "家-问了他",
            "家-两头都要", "家-退了田", "家-呛了妈", "家-回去了", "家-先收了粮", "家-没定"]
            .some((f?: any) => S.flags[f]),
        说: "收完粮你回了一趟家。\n"
            + "你妈把你的屋子收拾过，床头放着一个铁盒子。\n"
            + "打开一看，一沓单子：学费的、住宿的，底下还压着一张医院的。\n"
            + "「不是叫你出。」她说。\n「就是让你心里有个数。」\n"
            + "你爸在院里劈柴，一下一下，没进屋。",
        问: { options: [
                { text: "把这一季的账，一笔一笔跟她算清楚",
                    sub: (st?: any) => st.flags["家-报了虚数"]
                        ? "「小两万」那个数，她信到今年"
                        : st.flags["家-报了实数"]
                            ? "你说过挣不了多少。第二天她往你卡上打了两千"
                            : st.flags["家-顶了妈"]
                                ? "电话里你说过：你别管我，我自己能撑"
                                : st.flags["家-呛了妈"]
                                    ? "饭桌上你反问过一句。那顿剩了半桌菜"
                                    : "她问过你一年能挣多少，你一直没正面答",
                    续题: "她把铁盒子挪到一边", 续简: "要算账，得先把桌子腾出来。",
                    续谁: "你妈", 续话: "「你说，我听着。」她坐下来，两只手放在膝盖上。",
                    续: [
                        { text: "算到最后一栏，告诉她还差多少",
                            后: "她没说话，拿过笔在那个数底下画了一道。\n"
                                + "过了一会儿她说：「你能把这个数算明白，比挣回来强。」\n"
                                + "铁盒子她当天就收走了。\n"
                                + "你走的那天早上，盒子又出现在你包里，里头少了一张单子。\n"
                                + "学费那一张。" },
                        { text: "只算田里那本，家里那本不动",
                            后: "你从书包里掏出记稻子的本子，一页一页翻给她看。\n"
                                + "哪天插的秧，哪天放的鸭，哪天倒的伏。\n"
                                + "她听着，中间插了一句：「你还记这个。」\n"
                                + "铁盒子里那些单子，你们一张都没提。\n"
                                + "临走她说了句：「记归记，别记出病来。」" },
                        { text: "算不下去，把本子合上",
                            后: "你翻到中间就翻不动了。\n"
                                + "那些数一个都对不上，因为你自己也没正经算过。\n"
                                + "她把盒子盖上，说算了，不说这个。\n"
                                + "那天夜里你听见她在隔壁跟你爸说话，说了很久，声音压得很低。\n"
                                + "第二天谁也没提这件事。" },
                    ] },
                { text: "问她一句：这沓单子，还差多少",
                    sub: (st?: any) => st.flags["家-回去了"]
                        ? "收粮那两天你连夜走的。田倒了一片"
                        : st.flags["家-先收了粮"]
                            ? "你先把粮收完才走的。到医院人已经推出来了"
                            : st.flags["家-没定"]
                                ? "你让家里先定。赶到的时候手术做完了"
                                : "盒子就摆在那儿。你不问，她也不会说",
                    续题: "她把盒子重新打开", 续简: "一张一张摊在桌上，摊了半张桌子。",
                    续谁: "你妈", 续话: "「你要问，我就跟你说明白。」",
                    续: [
                        { text: "说：差的这些我出",
                            后: "她抬头看你。\n"
                                + "「你出什么，」她说，「你才挣几个钱。」\n"
                                + "可她没把盒子收起来。\n"
                                + "第二天你走的时候，那张医院的单子不见了。剩下的都还在。\n"
                                + "你后来才知道，医院那张是你爸的。" },
                        { text: "说：那我先记下来，往后一笔一笔还",
                            后: "她笑了一下：「你还得起这个。」\n"
                                + "说完还是把盒子推到你那边，说那你记吧。\n"
                                + "你真抄了一份，抄在记稻子那个本子的最后一页上。\n"
                                + "抄完她说：「这张纸你别丢。」" },
                        { text: "问了，又说不出口别的",
                            后: "她等了一会儿，见你不说话，就把盒子盖上了。\n"
                                + "「不问也好。」她说，「问了你晚上也睡不着。」\n"
                                + "那天剩下的时间，你们说的都是别人家的事。\n"
                                + "走的时候她把盒子放回了柜子最上头那一层。" },
                    ] },
                { text: "什么也不问，去院里帮你爸劈柴",
                    sub: (st?: any) => st.flags["家-两头都要"]
                        ? "饭桌上你说过：书我不废，田我也不撂"
                        : st.flags["家-退了田"]
                            ? "你说过要退了田专心念书。什么时候退，你没说"
                            : st.flags["家-问了他"]
                                ? "你爸说过：我是怕你两头都落空"
                                : st.flags["家-没追"]
                                    ? "上回他来田里，你站在原地看他走的"
                                    : st.flags["家-讲了"]
                                        ? "你爸来田里那次，你追上去给他讲了一路"
                                        : "家里这些话，你一直没正经接过",
                    续题: "他把斧子递给你", 续简: "院里堆着半垛柴。他劈了一下午，一句话没说。",
                    续谁: "你爸", 续话: "他看你过来，把手里的斧子递给你，自己蹲到一边去了。",
                    续: [
                        { text: "劈完这垛，跟他说田里的事",
                            后: "你劈了半个多钟头，手上磨出一个泡。\n"
                                + "他在边上看着，中间说了一句「手腕别使死劲」。\n"
                                + "劈完你说起田里的事，他没接，只说：「你手上那个泡，明天还得疼。」\n"
                                + "这话是心疼，也是别的。" },
                        { text: "劈完就把斧子还给他，回屋去",
                            后: "你把斧子递回去，他接了。\n"
                                + "「你爷爷那会儿，也是这么劈的。」他说了一句。\n"
                                + "你没接上。\n"
                                + "那天晚上你在屋里听见他劈到很晚。那垛柴早就够了。" },
                        { text: "把斧子放下，跟他并排蹲着",
                            后: "你俩蹲在柴堆边上，谁也没说话。\n"
                                + "蹲了有一刻钟，他站起来，去灶上添了把火。\n"
                                + "「你妈那个盒子，」他说。\n「你别往心里去。」\n"
                                + "说完就进屋了。这句话是他这一年说得最长的一句。" },
                    ] },
            ] } },
    { id: "埂谈", 重: 55, 谁: "东门外 · 春",
        题: "桌 上 那 碗 白 米 饭",
        当: (S?: any) => ["感-坐下了", "感-没坐", "感-问了", "感-打过去了", "感-只回了一句", "感-岔开了",
            "感-留了", "感-删了", "感-问破了", "感-应了", "感-反问了", "感-没接"]
            .some((f?: any) => S.flags[f]),
        说: "转过年来，同学B发消息，说想见一面。\n"
            + "约在学校东门外那家小馆子。\n"
            + "你到的时候同学B已经坐下了，桌上摆着一碗白米饭，没动筷子。\n"
            + "「等你呢。」同学B说。\n"
            + "窗口那边还在喊号。",
        问: { options: [
                { text: "坐下，先不动筷子",
                    sub: (st?: any) => st.flags["感-应了"]
                        ? "收粮那天你说过：一定跟你说"
                        : st.flags["感-没接"]
                            ? "那句话你一直没接。搁了一年"
                            : st.flags["感-删了"]
                                ? "方案里那一页，你让删了"
                                : st.flags["感-留了"]
                                    ? "那一页你说留着。后来你寄了一袋新米过去"
                                    : st.flags["感-问破了"]
                                        ? "你问过一句：你写这个干什么"
                                        : "上回在埂上，话没说完",
                    续题: "同学B把这碗饭推过来一点", 续简: "推到桌子当中，谁都能够着的位置。",
                    续谁: "同学B", 续话: "「你尝一口。这家是新米。」",
                    续: [
                        { text: "夹一口，说这米是新打的",
                            后: "你尝了一口，说是新打的。\n"
                                + "同学B说：「我就想吃一碗大白米饭。」\n"
                                + "说完自己先笑了，说这话说了一年多了。\n"
                                + "你们那顿饭吃了两个钟头，聊的全是没用的。\n"
                                + "结账的时候同学B抢着付了，说下回你来。" },
                        { text: "先说正事：方案后来怎么样了",
                            后: "同学B说拿了奖，已经交上去了。\n"
                                + "「里头有一页是你。」说得很轻。\n"
                                + "你问哪一页。同学B说你自己想。\n"
                                + "那碗饭到凉了也没人动。\n"
                                + "出门的时候同学B说：「下次别老说正事了。」" },
                        { text: "什么也不说，先把饭吃了",
                            后: "两个人低头吃饭，一句话没有。\n"
                                + "吃到一半同学B忽然说：「你下地的时候是不是也这样。」\n"
                                + "你说哪样。\n"
                                + "「不说话，光干活。」\n"
                                + "这话你没答。可你听出来，这不是抱怨。" },
                    ] },
                { text: "问一句：今天叫我来，是不是有事",
                    sub: (st?: any) => st.flags["感-打过去了"]
                        ? "那通电话打到快两点。第二天你五点起的"
                        : st.flags["感-只回了一句"]
                            ? "那天夜里你只回了两个字：怎么了"
                            : st.flags["感-岔开了"]
                                ? "那一晚你把话岔到了包装和运费上"
                                : st.flags["感-反问了"]
                                    ? "收粮那天你反问过：你明年还在不在"
                                    : "同学B发消息的时候只说了见面，没说别的",
                    续题: "同学B把筷子放下了", 续简: "放得很齐，跟桌面平行。",
                    续谁: "同学B", 续话: "「有事。」说得很干脆，「我毕业要走了。」",
                    续: [
                        { text: "问去哪儿",
                            后: "「南边。」说了个城市名字。\n"
                                + "「下个月就走。」\n"
                                + "你说那挺远。同学B说是挺远。\n"
                                + "那碗白米饭一直摆在桌上，谁也没动。\n"
                                + "走的时候同学B说：「我那个方案里，第一作者写的是你。」" },
                        { text: "问一句：那这一亩你还拍不拍",
                            后: "同学B愣了一下，然后笑了。\n"
                                + "「你这人。」\n"
                                + "「我问你走了，你问我拍不拍。」\n"
                                + "话是这么说，眼圈有点红。\n"
                                + "后来同学B说：「拍。开春我回来一趟。」" },
                        { text: "不问。说那你多吃点",
                            后: "你把那碗饭往同学B那边推了推。\n"
                                + "同学B看着碗，半天没动。\n"
                                + "「你这个人，」同学B说，「什么都留到最后一刻才说。」\n"
                                + "那天到底也没说是什么事。\n"
                                + "后来你从别人那儿听说，同学B那个月就走了。" },
                    ] },
                { text: "把筷子拿起来，先吃",
                    sub: (st?: any) => st.flags["感-坐下了"]
                        ? "头一回在埂上，你把锄头插下就坐了"
                        : st.flags["感-没坐"]
                            ? "那天你下田了，一趟一趟从埂边过"
                            : st.flags["感-问了"]
                                ? "你问过一句：你今天是不是有事"
                                : "饭是热的，再放就凉了",
                    续题: "同学B也拿起筷子", 续简: "两个人闷头吃了半碗。",
                    续谁: "同学B", 续话: "「这家的米不行，陈的。」",
                    续: [
                        { text: "说：那你还点这个",
                            后: "「想吃。」同学B说。\n"
                                + "「陈的也吃。」\n"
                                + "你说下学期你那一亩新米下来，给你寄。\n"
                                + "同学B说行。这声「行」应得很快，像是等着这句话。\n"
                                + "后来你确实寄了。回了一句：「这个就是大白米饭。」" },
                        { text: "说：你那方案写完了没有",
                            后: "「写完了。」同学B说，「最后那页我留着没删。」\n"
                                + "你没接。\n"
                                + "同学B也没往下说，低头把碗里剩下的饭吃完了。\n"
                                + "那碗饭一粒没剩。\n"
                                + "出门的时候同学B说：「明年我把云台带来。」" },
                        { text: "什么也不说，把饭吃完",
                            后: "两个人把饭吃完了，谁也没多说话。\n"
                                + "结账的时候老板问打包不打包，同学B说不用。\n"
                                + "走到路口，同学B往东，你往西。\n"
                                + "走出去十几步，同学B在后面喊了一声。\n"
                                + "回头的时候人还站在那儿，摆了摆手。" },
                    ] },
            ] } },
    { id: "地权", 重: 60, 谁: "田主家 · 开春",
        题: "书 底 下 压 着 那 张 纸",
        当: (S?: any) => S.flags["人-加租"] || S.flags["人-找了村里"],
        说: "开春签租约。\n"
            + "田主把纸推过来，租金那一栏已经填好了，一千。跟去年一样。\n"
            + "「你看看。」他说。\n"
            + "他桌上另外压着一张纸，用一本书压着一角，露出来的地方有红章。",
        问: { options: [
                { text: "问他一句：压着那张是什么",
                    sub: (st?: any) => st.flags["人-加租"]
                        ? "去年你出到一千二，才把这块地留下"
                        : "去年这块地差点不是你的。你去村委会说的",
                    续题: "他把书挪开了", 续简: "挪开一点，又停住，没全露出来。",
                    续谁: "田主", 续话: "「跟你不相干。」他说。手还搭在书上。",
                    续: [
                        { text: "不看，说那就不看",
                            后: "他把书又压回去了。\n"
                                + "「你不问，我也不说。」他说。\n「就这样挺好。」\n"
                                + "租约签得很顺，一千，跟去年一样。\n"
                                + "你后来听村里人说，那张是别人家的意向书，出的是一千一。\n"
                                + "他到底没换人。" },
                        { text: "把书挪开，自己看",
                            后: "是一张村委会开的证明，写的是这一片地的权属待核。\n"
                                + "他一把收走了，脸沉下来。\n"
                                + "「你看看干什么。」\n"
                                + "租约还是签了。可从那以后，他见你说话都短一截。\n"
                                + "你知道那张纸跟你有关，就是不知道在哪一头。" },
                        { text: "说：您要是想涨，明说就行",
                            后: "他停了一下，笑了。\n"
                                + "「涨什么涨。」他把租约往前推了推，「签你的。」\n"
                                + "那张纸他一直压着，到你走都没再动。\n"
                                + "你出门的时候他在后头说了句：「你这孩子，心眼不少。」\n"
                                + "说这话的时候是笑着的。" },
                    ] },
                { text: "什么也不问，把租约一条一条看完",
                    sub: () => "一年一签的东西，看仔细不吃亏",
                    续题: "他一页一页等你翻", 续简: "茶都凉了，他也没催。",
                    续谁: "田主", 续话: "「看完了？」",
                    续: [
                        { text: "指着其中一条问：这条去年没有",
                            后: "他把纸拿过去看了看，说是村里新加的，都得加。\n"
                                + "「你要是不愿意，这条划了也行。」\n"
                                + "你说不用划。\n"
                                + "他签的时候手很稳。这一笔他签了三十年，你才签第二年。" },
                        { text: "看完就签",
                            后: "你从头看到尾，一个字没说，签了。\n"
                                + "他收纸的时候说：「你是第一个从头看完的。」\n"
                                + "「别人都签得比谁都快。」\n"
                                + "这话你听不出是夸还是嫌。" },
                        { text: "看完，把纸推回去，说有几条想改改",
                            后: "他挑了挑眉，说你说。\n"
                                + "你改了水电和排水那两条，都是很小的事。\n"
                                + "他听完，都答应了，改完才签。\n"
                                + "「小事你倒看得紧。」他说。\n"
                                + "你说大事我看不懂。他笑了。" },
                    ] },
                { text: "不看，直接签字",
                    sub: () => "一年的东西，签了就是了",
                    续题: "笔是他递过来的", 续简: "笔杆上缠着一圈胶布，用了很多年。",
                    续谁: "田主", 续话: "「爽快。」",
                    续: [
                        { text: "签完，问他一句今年还租不租给别人",
                            后: "「不租。」他说，「你种着就你种着。」\n"
                                + "这话说得很快，像是早就想好了。\n"
                                + "他把租约折起来收进抽屉，锁上了。\n"
                                + "那把锁咔哒一声，你才想起来，去年是没有锁的。" },
                        { text: "签完就走",
                            后: "你把笔还给他，出门。\n"
                                + "走到院里他喊了一声，说等一下。\n"
                                + "他出来的时候手里多了一小袋稻种，说是他表弟那边弄来的。\n"
                                + "「你拿去试试。」他说。\n「不成也没事。」\n"
                                + "你接过来，袋子是热的，刚从仓里拿出来。" },
                        { text: "签完，站那儿多问了一句地的事",
                            后: "你问他这块地往后几年稳不稳。\n"
                                + "他想了想，说：「你种一年算一年。」\n"
                                + "「我这么跟你说吧 —— 地是我的，可我上面还有人。」\n"
                                + "他指了指那张压着的纸，没往下说。" },
                    ] },
            ] } },
    { id: "地失", 重: 61, 谁: "村北 · 开春",
        题: "那 你 去 年 在 哪 儿 种",
        当: (S?: any) => S.flags["人-撕了租约"],
        说: "开春了，村南这一亩不是你的了。\n"
            + "你在村里转了两天，问了三家。\n"
            + "村北这家地薄，水也远，得从别人家的渠里过。\n"
            + "老头蹲在门口抽烟，问你：「你不是在村南种着吗？」",
        问: { options: [
                { text: "照实说：跟田主闹翻了",
                    sub: () => "这话说出去，村里一天就能传遍",
                    续题: "老头把烟袋在鞋底上磕了磕", 续简: "磕了两下，没抬头。",
                    续谁: "老头", 续话: "「村南那家我知道。他一亩地许给三家。」",
                    续: [
                        { text: "问他：那我这块地，他许没许给别人",
                            后: "「许了。」他说得很干脆。\n"
                                + "「去年秋天就许了。你不知道？」\n"
                                + "你确实不知道。\n"
                                + "他给了你一个价，比村南低两百。\n"
                                + "「你就种着吧，」他说。\n「我看你像个真想种的。」" },
                        { text: "不接这个话，说就租您这块吧",
                            后: "他看了你一会儿，点头。\n"
                                + "地是好地，就是水远。头一季你为了那一渠水，跑了六趟。\n"
                                + "秋天的时候村南那家来地头转了一圈，没跟你说话。\n"
                                + "他地里的稻子长得没你好。你看见了，没觉得痛快。" },
                        { text: "问他一句：他许给三家，那他怎么种",
                            后: "「他不管种。」老头笑了一声。\n"
                                + "「他只管收租。谁种得好他不管，谁给得多他记得住。」\n"
                                + "他把地租给了你，比村南便宜。\n"
                                + "签完他说：「你明年要是还想种，先来问我一声。」\n"
                                + "这句话你记住了。" },
                    ] },
                { text: "说：学校那边有事，种不开了",
                    sub: () => "撒个谎，省得村里传闲话",
                    续题: "老头没接这个话", 续简: "他抽完一袋烟，才开口。",
                    续谁: "老头", 续话: "「你手上的茧子，不像种不开的。」",
                    续: [
                        { text: "承认了：是跟田主闹翻了",
                            后: "他点头，像是早就知道。\n"
                                + "「村里的事，藏不住。」\n"
                                + "地租给你了。价不高，条件是把东头那条渠帮着清一清。\n"
                                + "清渠那天他来了，蹲在埂上看你干，一句话没说。" },
                        { text: "不承认，就这么签了",
                            后: "他把地租给你了，没再多问。\n"
                                + "「你不说就不说。」他说。\n「种地的人，我只看他种的怎么样。」\n"
                                + "那一季你种得很卖力，是给自己看的。\n"
                                + "秋天过磅的时候，他站在磅边上，一直看到最后一个数。" },
                        { text: "反问他：您怎么知道种不种得开",
                            后: "「我种了四十年。」他说。\n"
                                + "「种得开的人，不会来问我这块薄地。」\n"
                                + "这话没恶意，可你脸热了一下。\n"
                                + "地还是租了。这一季你收成很好，第二年他把旁边那一亩也给了你。" },
                    ] },
                { text: "问他这块地的水，从哪儿来",
                    sub: () => "地好不好是其次，水是头一件事",
                    续题: "他站起来，往东边指", 续简: "指的那个方向有一排杨树。",
                    续谁: "老头", 续话: "「过三家。到你这儿是第四道。」",
                    续: [
                        { text: "问：第四道还够不够用",
                            后: "「旱年不够。」他说，「得早放。」\n"
                                + "「你去年在村南不知道，那边是头道水。」\n"
                                + "这一句他说得没什么起伏，可你听出来了：\n"
                                + "从村南挪到村北，你挪的不只是地。" },
                        { text: "说：那我先试一季",
                            后: "他把地租给你了，一季一签。\n"
                                + "那一季你为水吃了不少苦。可你学会了一件事：\n"
                                + "什么时候放水得看上游三家什么时候插秧，不是看自己。\n"
                                + "这些老周跟你讲过，你那时候没往心里去。" },
                        { text: "算了，这块地不要了",
                            后: "你谢过他，走了。\n"
                                + "开春之后你又在镇上问了两处，都不合适。\n"
                                + "那一季你没种地，在学校待了整整半年。\n"
                                + "后来你路过村南，看见那块田里换了别人在插秧。" },
                    ] },
            ] } },
    { id: "村价", 重: 58, 谁: "村委会 · 春",
        题: "墙 上 那 张 纸 还 贴 着",
        当: (S?: any) => S.flags["人-缩了"] || S.flags["人-顶了村里"] || S.flags["人-带上村里"],
        说: "你去村委会办个证明。\n"
            + "院里坐着几个人等叫号。管事的看见你，说了句你先等等。\n"
            + "墙上贴着一张纸，是今年镇上定的收购价，三块二。\n"
            + "那张纸去年也贴过，一直没人揭。",
        问: { options: [
                { text: "等就等，坐在院里不催",
                    sub: (st?: any) => st.flags["人-顶了村里"]
                        ? "你去年顶过那一句。往后来办事，都得排最后"
                        : st.flags["人-缩了"]
                            ? "你去年说过：那我明年不卖了"
                            : "上一回你在这儿说的那些话，他还记着",
                    续题: "叫号的喊了两轮", 续简: "两轮都没喊你。你也没问。",
                    续谁: "管事的", 续话: "他出来倒水，看见你还坐着，愣了一下。",
                    续: [
                        { text: "问他一句：是不是还得等",
                            后: "「等什么等。」他把水壶放下，「你进来吧。」\n"
                                + "证明办得很快。写完他多说了一句：\n"
                                + "「去年那事，不是我一个人的意思。」\n"
                                + "「是有人到我这儿来说了话。」\n"
                                + "他没说是谁。你也没问。" },
                        { text: "不问，接着坐着",
                            后: "你一直坐到晌午。\n"
                                + "后头来的人一个接一个办完了，走了。\n"
                                + "最后他自己出来叫你，说办完再走吧。\n"
                                + "证明给你了，字写得比给别人那张大一号。\n"
                                + "你出门的时候，听见他在里头叹了口气。" },
                        { text: "起来走，改天再来",
                            后: "你把凳子挪回墙根，走了。\n"
                                + "走到院门口他喊住你，说你这人怎么这样。\n"
                                + "你说我不着急。\n"
                                + "证明第二天给你送到了田里，是他自己来的。\n"
                                + "站在埂上看了看你的苗，说了一句「长得不错」就走了。" },
                    ] },
                { text: "起身进去，问他一句：这个价是怎么定的",
                    sub: () => "三块二。你去年卖的是五块",
                    续题: "他把搪瓷杯端起来了", 续简: "杯子上掉了一块瓷，露出底下的黑铁。",
                    续谁: "管事的", 续话: "「镇上的价，不是我定的。」",
                    续: [
                        { text: "问他：那村里想没想过自己也定一个",
                            后: "他端着杯子想了想。\n"
                                + "「定不了。」他说，「定了谁收？」\n"
                                + "「你要是有路子，你说话。」\n"
                                + "你说有。他看了你半天，把杯子放下了。\n"
                                + "那年秋天他真叫了两户去你田里看。" },
                        { text: "问他：有几个人来说过话",
                            后: "「五个。」他说得很痛快。\n"
                                + "「都是种了一辈子的人。他们卖三块二，你卖五块。」\n"
                                + "「换你你怎么办。」\n"
                                + "这话你答不上来。\n"
                                + "他把证明给你开了，没再多说别的。" },
                        { text: "不问别的了，把证明开了就走",
                            后: "他开完证明，盖章，递给你。\n"
                                + "你走到门口，他在后头说了一句：\n"
                                + "「那个价，你自己心里有数就行。」\n"
                                + "「别在村里说。」\n"
                                + "你回头的时候他已经低头写东西了。" },
                    ] },
                { text: "不办了，转身出去",
                    sub: () => "一张证明而已，改天再说",
                    续题: "院里那几个人都抬头看你", 续简: "一路走出来，没人说话。",
                    续谁: "管事的", 续话: "他追到院门口：「你这个证明还办不办？」",
                    续: [
                        { text: "回头说：办，但我有个条件",
                            后: "他愣了。你说村里要办收购，得先跟种的人商量。\n"
                                + "他没答应，也没拒绝，只说这话不是他一个人能应的。\n"
                                + "证明当天办了。\n"
                                + "半个月后，村里开了一次会，叫了六户去。你也在里头。" },
                        { text: "说先不办了，走了",
                            后: "你走出村委会那条街，一直走到田边。\n"
                                + "田里的水还没放，你蹲下去把口子扒开了。\n"
                                + "证明后来是同学A 帮你跑的。\n"
                                + "他回来说，那个管事的问了一句「他还种不种」。" },
                        { text: "站住，回头跟他把去年的话说开",
                            后: "你说去年那几句，你没有不敬的意思。\n"
                                + "他听着，说：「我知道。」\n"
                                + "「可你知道，村里人不知道。」\n"
                                + "证明给你办了。你走的时候他补了一句：\n"
                                + "「往后有事，你先来找我。别直接去镇上。」" },
                    ] },
            ] } },
    { id: "周料", 重: 54, 谁: "田头 · 春",
        题: "后 来 那 份 材 料 怎 么 样 了",
        当: (S?: any) => S.flags["人-要署名"] || S.flags["人-分了家"] || S.flags["人-认了错"],
        说: "老周来田里坐了一下午，没怎么说话。\n"
            + "走的时候他问了一句：「上回那份材料，后来怎么样了？」\n"
            + "这句话问得很随便，像顺嘴。\n"
            + "可那份材料是去年交的，他记到现在。",
        问: { options: [
                { text: "照实说：后来没往下走",
                    sub: (st?: any) => st.flags["人-要署名"]
                        ? "你应过他，下回那份材料把他的名字加上"
                        : st.flags["人-分了家"]
                            ? "你跟他说过：那是学校的材料，跟这个不一样"
                            : st.flags["人-认了错"]
                                ? "你认过：那一段不该写成「田间调研」"
                                : "这话你没跟他正经说过",
                    续题: "他点了点头", 续简: "点得很轻，像是早就知道。",
                    续谁: "老周", 续话: "「没往下走就没往下走。」",
                    续: [
                        { text: "说：下回我一定把它办成",
                            后: "他看了你一眼，没说好也没说不好。\n"
                                + "「你先把你这一亩种明白。」他说。\n"
                                + "「别为我一个种地的，去跟人磨嘴皮子。」\n"
                                + "这话是拦你。你听得出来，他是怕你为他吃亏。" },
                        { text: "问他：您在意这个吗",
                            后: "他想了很久。\n"
                                + "「不在意。」他说。\n"
                                + "「可那句话是我说的。我说的时候是想着你种的这块地说的。」\n"
                                + "「写不写我名字不要紧，别写成是你自己想出来的就行。」" },
                        { text: "不说了，把本子拿出来给他看",
                            后: "你翻到记他那句话的那一页，递过去。\n"
                                + "他看了半天，说：「你还记着日子。」\n"
                                + "那一页上头有日期，有天气，有当时的苗情。\n"
                                + "「这个比署名强。」他说。\n「这个谁也改不了。」" },
                    ] },
                { text: "跟他说：那份东西，我后来没再管",
                    sub: (st?: any) => st.flags["人-分了家"]
                        ? "你分过家：学校的事归学校。学校那份，你也真撂了"
                        : st.flags["人-认了错"]
                            ? "你认过错。认完之后那份材料还是搁在抽屉里"
                            : "材料的事，你一直没跟他交代过",
                    续题: "他把手里的草根扔了", 续简: "扔在埂上，用脚踩了踩。",
                    续谁: "老周", 续话: "「不管就不管。」他说。\n「那你往后还写不写东西？」",
                    续: [
                        { text: "说还写",
                            后: "「写的时候记着点。」他说。\n"
                                + "「你写的东西，村里人看不懂，可会有别人看。」\n"
                                + "「别人看了，就当成这一片就是这么种的。」\n"
                                + "说完他站起来，说该回去喂鸡了。" },
                        { text: "说不知道还写不写",
                            后: "他嗯了一声，没再问。\n"
                                + "过了几天他拿来一沓纸，是他自己记的，字很潦草。\n"
                                + "「你要写就照这个写。」他说。\n"
                                + "「我认字不多，可记的都是真的。」\n"
                                + "那沓纸你留到今天。" },
                        { text: "反问他：您希望我写吗",
                            后: "他愣了一下，笑了。\n"
                                + "「我希不希望有什么用。」\n"
                                + "「你写，我这块地就在纸上多活几年。」\n"
                                + "「你不写，它也就是一块地。」\n"
                                + "这话他说得很轻，像自言自语。" },
                    ] },
                { text: "岔开：今年这块地的水怎么样",
                    sub: () => "话头转开，他就不会再提了",
                    续题: "他顺着你指的方向看过去", 续简: "看了一会儿，说东头那条渠该清了。",
                    续谁: "老周", 续话: "「你要是没空，我去说。」",
                    续: [
                        { text: "说：那麻烦您了",
                            后: "第二天他真去说了。\n"
                                + "渠清了三天，是村里出的人。\n"
                                + "材料的事他再没提过。\n"
                                + "你有一回想提，他摆摆手，说过去的事了。" },
                        { text: "说：我自己去说",
                            后: "他点点头。\n"
                                + "你去村委会说了，说通了。\n"
                                + "回来告诉他，他说：「行，你能自己说上话就行。」\n"
                                + "这句话他以前没说过。\n"
                                + "材料的事，就这么过去了。" },
                        { text: "什么也不接，两个人坐着",
                            后: "你们在埂上坐到天擦黑。\n"
                                + "他抽了两袋烟，一句话没说。\n"
                                + "走的时候他说了句：「你那个本子，别断。」\n"
                                + "就这一句。你听出来他还是在说那份材料。" },
                    ] },
            ] } },
    { id: "评论", 重: 53, 谁: "网上 · 冬",
        题: "底 下 那 条 评 论",
        当: (S?: any) => S.flags["感-要了那一段"] || S.flags["感-让他删"] || S.flags["感-问他为什么留"],
        说: "冬天那阵，片子不知道被谁转了一下，播放涨了一截。\n"
            + "底下多出几十条评论，说的都是稻子、节气、京西。\n"
            + "有一条被顶到了最上面，只有六个字：\n"
            + "「系鞋带那段好。」\n"
            + "点赞的那个人，头像是空的。",
        问: { options: [
                { text: "把那条评论截下来，发过去",
                    sub: (st?: any) => st.flags["感-要了那一段"]
                        ? "那一段你说过留着。片尾后来多了一行小字"
                        : st.flags["感-让他删"]
                            ? "那一段你让删了。后来换成了稻穗的空镜"
                            : "你问过留着干嘛。回答是「总得有点人味儿」",
                    续题: "那边正在输入，输了很久", 续简: "最后发过来的是一条链接，没配字。",
                    续谁: "同学B", 续话: "「你自己看。」",
                    续: [
                        { text: "点开看",
                            后: "是一个新剪的版本，比原来长了一分多钟。\n"
                                + "多出来的全是你。\n"
                                + "挑秧、扛袋子、蹲在田头啃馒头，还有一段是你在看天。\n"
                                + "看天那一段没有声音，只有风。\n"
                                + "最后黑屏，字幕打出来：\n"
                                + "「本片没有主角。」\n"
                                + "再一行：「也可能有一个。」" },
                        { text: "说：底下那条是你吧",
                            后: "那边过了很久才回。\n"
                                + "「哪个底下。」\n"
                                + "你说就那个说系鞋带的。\n"
                                + "「不知道。评论那么多。」\n"
                                + "然后又是一条：\n"
                                + "「是我又怎么样，我说的是实话。」\n"
                                + "再一条：\n"
                                + "「你要是不爱听，我删了。」\n"
                                + "那条评论一直在。你后来每个月都去看一眼还在不在。" },
                        { text: "什么也不说，回一个句号",
                            后: "你回了一个句号。\n"
                                + "那边也回了一个句号。\n"
                                + "然后就没了。\n"
                                + "那一整个冬天你们没再说过别的话。\n"
                                + "可你每次打开那个片子，进度条都会停在那十几秒上。\n"
                                + "系鞋带，系了很久。" },
                    ] },
                { text: "不吭声，自己存下来",
                    sub: () => "存的时候没想为什么，就是不想让它沉下去",
                    续题: "存完你翻了一遍自己的相册", 续简: "里头全是稻子，一张人也没有。",
                    续谁: "同学B", 续话: "（这条没有后续的话 —— 你没跟谁说。）",
                    续: [
                        { text: "把那张截图放在相册最前头",
                            后: "你把它挪到了最前面。\n"
                                + "以后每次打开相册，先看到的是那六个字。\n"
                                + "过了一阵你拍了第一张有人的照片：\n"
                                + "隔壁地的人在埂上抽烟，你顺手拍的。\n"
                                + "你说不清为什么从那天起开始拍人了。" },
                        { text: "存完就忘了，该干活干活",
                            后: "开春该翻地翻地，该买种买种。\n"
                                + "那张截图在相册里沉下去了，翻好几屏才找得到。\n"
                                + "有一回你翻到它，愣了一会儿，想不起是哪一年存的。\n"
                                + "可你还是没删。\n"
                                + "手机换了一部，导数据的时候，它跟着过来了。" },
                        { text: "转发给同学B，一个字都不配",
                            后: "转过去就没管了。\n"
                                + "第二天早上才看见回复，是凌晨三点发的。\n"
                                + "只有两个字：\n"
                                + "「删了。」\n"
                                + "你点回去看，原帖那条评论确实没了。\n"
                                + "你翻了半天，翻到一条新的，换成另外六个字：\n"
                                + "「种地的都不容易。」\n"
                                + "点赞的还是同一个人。" },
                    ] },
                { text: "去问一句：还有没有别的版本",
                    sub: () => "你问的是片子，可你自己知道不是",
                    续题: "那边发来一个压缩包", 续简: "文件名是日期，没有别的。",
                    续谁: "同学B", 续话: "「素材都在里头，你自己挑。」",
                    续: [
                        { text: "点开，一帧一帧看",
                            后: "三百多个片段，按日子排的。\n"
                                + "最早的是谷雨那天，镜头晃得厉害，是跑着拍的。\n"
                                + "你顺着日子往后翻，翻到冬天那一格，是空的。\n"
                                + "不是没有素材，是那一天**拍的人没开机**。\n"
                                + "那天同学B 站在仓房门口，问明年还贴不贴。\n"
                                + "你把那一格空着的地方，看了一会儿。" },
                        { text: "问他：你自己留了一份没有",
                            后: "「留那个干嘛。」\n"
                                + "你说万一以后有用。\n"
                                + "「以后有什么用。」\n"
                                + "过了一会儿又来一条：\n"
                                + "「留了。原片三个硬盘，宿舍放不下，放我姐那儿了。」\n"
                                + "「……你别跟别人说。」\n"
                                + "这句话之后，那一整天你没再收到消息。" },
                        { text: "算了，不点了",
                            后: "压缩包在聊天记录里躺着，一直没点开。\n"
                                + "过了几个月，链接过期了，变了一行灰字。\n"
                                + "你盯着那行灰字看了一会儿。\n"
                                + "想让他重发，又觉得为这个开口有点小题大做。\n"
                                + "后来你也没开这个口。\n"
                                + "那三百多个片段，你就再没看过。" },
                    ] },
            ] } },
    { id: "表", 重: 51, 谁: "仓房 · 开春",
        题: "墙 上 那 张 表",
        当: (S?: any) => S.flags["感-说还贴"] || S.flags["感-让他自己来看"] || S.flags["感-问走不走"],
        说: "开春头一件事是贴新表。\n"
            + "旧的那张揭下来，边角碎了一块，可日期那一行还看得清。\n"
            + "新的贴上去，旧的你没扔，卷起来塞在袋子底下。\n"
            + "仓房里就你一个人，也没谁问你在干什么。",
        问: { options: [
                { text: "拍张照片发过去，什么都不说",
                    sub: (st?: any) => st.flags["感-说还贴"]
                        ? "你说过：贴。你要是不来，我自己贴"
                        : st.flags["感-让他自己来看"]
                            ? "你说过：你明年来看一眼不就知道了"
                            : "你问过走不走。回答是「可能走，可能不走」",
                    续题: "照片发出去，半天没回", 续简: "你也没催，该干什么干什么。",
                    续谁: "同学B", 续话: "「新表字太小。」",
                    续: [
                        { text: "回：那你来给我写一张大的",
                            后: "「凭什么。」\n"
                                + "你说你字好看。\n"
                                + "「……行吧。」\n"
                                + "过了四天，快递到了。一张手抄的节气表，牛皮纸，墨写的。\n"
                                + "八个节气，底下一行小字：「谷雨开机」。\n"
                                + "你把它贴在新表旁边，两张并排。\n"
                                + "来的人都说这张手写的好看。你没说谁写的。" },
                        { text: "回：凑合看吧",
                            后: "「那你自己凑合。」\n"
                                + "对话就断在这儿了。\n"
                                + "过了两天又来一条：\n"
                                + "「表挂高一点，别让水汽熏着。」\n"
                                + "你照做了。挂高了一寸。\n"
                                + "那一寸是那一年里你听过的最不像关心的一句关心。" },
                        { text: "不回，把手机揣兜里继续干活",
                            后: "你把手机塞回兜里，接着码袋子。\n"
                                + "中午掏出来看，一条新消息：\n"
                                + "「照片拍得挺好看。」\n"
                                + "下午又是一条：\n"
                                + "「跟去年那张比，墙白了一点。」\n"
                                + "墙没变。变的是别的。\n"
                                + "两条消息你都是第二天才回的，回的都是「嗯」。" },
                    ] },
                { text: "把旧表压平，夹进本子里",
                    sub: () => "那张表上有去年一整年的日子，扔了可惜",
                    续题: "本子里多出一页", 续简: "硬，翻到那儿本子合不上。",
                    续谁: "同学B", 续话: "（这条也没有后续的话 —— 没人知道本子里多了张纸。）",
                    续: [
                        { text: "在旧表空白处把去年的收成记上",
                            后: "你在背面写了数：产量、品质、卖了多少、剩了多少。\n"
                                + "写完发现背面本来就有字。\n"
                                + "铅笔写的，很淡，一行：\n"
                                + "「他今年没歇过一天。」\n"
                                + "字不是你的。你想不起来这张表什么时候被人翻过面。\n"
                                + "那一页你后来再没翻开过，可你知道它在第几页。" },
                        { text: "就这么夹着，不写字",
                            后: "旧表就那么夹在本子里，一直没动。\n"
                                + "本子越记越厚，那一页鼓着。\n"
                                + "有人借去看，说你这本子怎么合不拢。\n"
                                + "你说有张纸。\n"
                                + "「什么纸。」\n"
                                + "你说去年的节气表，没什么用，就是没舍得扔。" },
                        { text: "拿去问一句：这张是不是你留的",
                            后: "你把旧表拍了过去。\n"
                                + "「不是。」\n"
                                + "回得很快。快到你觉得是假的。\n"
                                + "过了一会儿又来一条：\n"
                                + "「……是我去年撕下来描了一版。想画一张送你，画废了。」\n"
                                + "「那张你别看，难看。」\n"
                                + "那张表你后来看了很多回。不难看。\n"
                                + "描的那些字，比原表还工整。" },
                    ] },
                { text: "看着空墙站一会儿，再贴",
                    sub: () => "揭下来到贴上去，中间那段墙是白的",
                    续题: "墙上有块地方比别处干净", 续简: "贴了一年的纸，底下的墙没怎么落灰。",
                    续谁: "同学B", 续话: "（这一条也没有话 —— 那天仓房里就你一个人。）",
                    续: [
                        { text: "把新表往那块干净地方贴",
                            后: "位置对得很准，跟去年差不了多少。\n"
                                + "贴完退后两步看，觉得这一年的开头跟去年的开头长得一样。\n"
                                + "后来有人来仓房，说你这表怎么老是这一个位置。\n"
                                + "你说顺手。\n"
                                + "其实不是顺手。这块墙面是干净的，别处有灰。" },
                        { text: "故意往旁边挪一挪",
                            后: "你往边上挪了半尺，那块干净地方就露在外头了。\n"
                                + "一整年，每次进仓房都能看见那块白。\n"
                                + "开春那个人来的时候，一眼就看见了。\n"
                                + "「你怎么挪了。」\n"
                                + "你说换换位置。\n"
                                + "「那块墙……」\n"
                                + "话没说完就不说了。那天走得很早。" },
                        { text: "先不贴，让墙空几天",
                            后: "你把新表卷起来放在袋子上，一放放了六天。\n"
                                + "那六天进仓房总觉得少了点什么，可也说不上来。\n"
                                + "第七天才贴上。\n"
                                + "后来同学B问起为什么晚了几天。\n"
                                + "你说忙。\n"
                                + "「哦。」\n"
                                + "「我以为你不想贴了。」\n"
                                + "这句话说得很轻，说完就去说别的了。" },
                    ] },
            ] } },
];

ctx.后话一屏 = 3;

ctx.已走过 = (S?: any, id?: any) => {
    const v: any = (S.见后话 || {})[id];
    if (!v)
        return false;
    if (v === true)
        return false;
    return (S.季 || 1) - v < ctx.NUM.后话冷场;
};

ctx.引子 = (s?: any) => {
    const 一: any = String(s).split("\n")[0];
    return 一.length > 34 ? 一.slice(0, 34) + "…" : 一;
};

ctx.本季走过后话 = (S?: any) => (S.后话趟 || 0) === (S.季 || 1);

ctx.分类 = ["田里的", "手上的", "肥", "水", "虫", "收", "药", "灾"];
}
