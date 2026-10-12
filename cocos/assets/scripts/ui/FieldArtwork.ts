/** 稻田、农具和年景图形。由现有网页迁移；后续直接在本文件维护。 */
import type { GameContext } from '../runtime/GameContext';

export function register(ctx: GameContext): void {
// 田的画：保留原玩法的计算或流程。
ctx.田的画 = function (S?: any) {
    const e: any = S.stats.ecology, q: any = S.stats.quality, h: any = S.stats.harvest;
    const 割了: any = S.termIndex >= S.节气.length;
    const 段: any = 割了 ? "成熟" : ((S.节气[S.termIndex] || {}).阶段 || "成熟");
    const 倒: any = !!S.codex["倒伏"];
    const 新倒: any = 倒 && !ctx.已倒过;
    if (倒)
        ctx.已倒过 = true;
    const k: any = (ctx.阶段高[段] || 1) * (割了 ? 0.20 : 1);
    const 年色: any = S.年景 ? S.年景.色 : "";
    const 今景: any = ctx.年景天[S.年景 ? S.年景.名 : ""];
    const 天: any = 今景 ? 今景.天
        : 年色 === "d" ? ["#a7aeae", "#d2d6d0"]
            : 年色 === "a" ? ["#cadfc4", "#f6f9ee"]
                : ["#bccfc8", "#e9efe4"];
    const 水: any = e >= 85 ? "#a9c9bb" : e >= 70 ? "#9cb8a6" : e >= 50 ? "#93a08c"
        : e >= 32 ? "#8b917f" : "#858878";
    const 熟: any = 割了 || 段 === "成熟";
    const 叶: any = 熟 ? "#c8a03c" : q >= 78 ? "#63a04b" : q >= 62 ? "#579041"
        : q >= 45 ? "#3d7030" : "#274d1f";
    const 穗色: any = 熟 ? "#dcbb52" : 段 === "灌浆" ? "#a8b95c" : 叶;
    const 稀: any = h < 700;
    const 丛: any = [];
    const 排: any = [
        { y: 58, s: 0.50, n: 13, 淡: 0.34, w: 1.5 },
        { y: 84, s: 0.76, n: 11, 淡: 0.14, w: 1.9 },
        { y: 116, s: 1.08, n: 9, 淡: 0, w: 2.4 },
    ];
    排.forEach((R?: any, ri?: any) => {
        const 步: any = 320 / R.n;
        for (let i: any = 0; i < R.n; i++) {
            const 段位: any = Math.floor(i / 3);
            if (稀 && (ri === 2 ? 段位 % 2 === 0 : ri === 1 ? 段位 % 3 === 1 : false))
                continue;
            const x: any = 步 * (i + 0.5) + (ri % 2 ? 步 * 0.5 : 0);
            if (x > 318)
                continue;
            const 高: any = 84 * R.s * k;
            const 叶片: any = [-17, -8, 0, 8, 17].map((偏?: any) => {
                const hh: any = 高 * (1 - Math.abs(偏) / 34), dx: any = 偏 * 0.62;
                return `<path d="M${x.toFixed(1)} ${R.y} Q${(x + dx * 1.8).toFixed(1)} ${(R.y - hh * 0.58).toFixed(1)} `
                    + `${(x + dx).toFixed(1)} ${(R.y - hh).toFixed(1)}" stroke="${叶}" stroke-width="${R.w.toFixed(1)}" `
                    + `fill="none" stroke-linecap="round"/>`;
            }).join("");
            const 有穗: any = !割了 && (段 === "灌浆" || 段 === "成熟");
            const 穗: any = 有穗 ? [-17, 0, 17].map((偏?: any) => {
                const hh: any = 高 * (1 - Math.abs(偏) / 34), dx: any = 偏 * 0.62, d: any = 偏 >= 0 ? 1 : -1;
                const 垂: any = 段 === "成熟" ? 1.6 : 0.7;
                return `<path d="M${(x + dx).toFixed(1)} ${(R.y - hh).toFixed(1)} `
                    + `q${(d * 3).toFixed(1)} ${(垂 * 3).toFixed(1)} ${(d * 7).toFixed(1)} ${(垂 * 5).toFixed(1)}" `
                    + `stroke="${穗色}" stroke-width="${(R.w * 1.7).toFixed(1)}" fill="none" stroke-linecap="round"/>`;
            }).join("") : "";
            const 这株倒: any = 倒 && (ri === 2 || (ri === 1 && i % 4 !== 0) || (ri === 0 && i % 5 === 2));
            const cls: any = 这株倒 ? (新倒 ? "clump fall" : "clump lie") : "clump";
            const st: any = 这株倒 ? ` style="--lie:${(58 + (i % 5) * 6).toFixed(0)}deg"` : "";
            丛.push(`<g class="${cls}"${st} opacity="${(1 - R.淡).toFixed(2)}">${叶片}${穗}</g>`);
        }
    });
    const 有鸭: any = !!(S.flags && S.flags["稻鸭"]);
    const 蛙数: any = e >= 85 ? 3 : e >= 70 ? 2 : 0;
    const 苗期: any = !割了 && 段 === "苗期";
    const 盖了膜: any = !!(S.flags && S.flags["盖膜"]) && 苗期;
    const 今: any = (S.节气[S.termIndex] || {});
    const 待动手: any = ctx.大田屏(今) && ctx.screen === "decision";
    const 家什层: any = 待动手
        ? ctx.有位(今).map((i?: any) => {
            const h: any = 今.热区[i];
            return h && h.画 && ctx.家什[h.画]
                ? `<g class="shi s${i}">${ctx.家什[h.画](h.x, h.y, h.尺 || 1.5)}</g>` : "";
        }).join("")
        : "";
    const 埂色: any = e >= 70 ? "#93a06d" : e >= 50 ? "#8b916a" : "#88885f";
    const 埂: any = `<path d="M0 126.5 q56 -3.6 112 -1.4 q78 3 208 -1.4 V140 H0Z" fill="${埂色}"/>`
        + `<path d="M0 126.5 q56 -3.6 112 -1.4 q78 3 208 -1.4" stroke="#ffffff" stroke-width="1"`
        + ` fill="none" opacity=".25"/>`;
    const 蛙: any = (x?: any, y?: any, s?: any) => `<g transform="translate(${x} ${y}) scale(${s})">`
        + `<ellipse cx="0" cy="0" rx="7.2" ry="4.2" fill="#6f9a38"/>`
        + `<path d="M-6.4 2 l-3.6 1.8" stroke="#6f9a38" stroke-width="2.6" stroke-linecap="round"/>`
        + `<path d="M6 1.8 l3.2 1.6" stroke="#6f9a38" stroke-width="2" stroke-linecap="round"/>`
        + `<circle cx="-2.4" cy="-4" r="2.3" fill="#7cab41"/><circle cx="2.6" cy="-4.2" r="2.1" fill="#7cab41"/>`
        + `<circle cx="-2.4" cy="-4" r="1.05" fill="#2b3026"/><circle cx="2.6" cy="-4.2" r="0.95" fill="#2b3026"/>`
        + `<path d="M-4.6 -0.6 q4.6 -2 9.2 0" stroke="#5b8030" stroke-width="0.8" fill="none" opacity=".75"/>`
        + `</g>`;
    const 蛙位: any = [[64, 131.5, 1.15], [172, 134, 0.9], [258, 131, 1.05]].slice(0, 蛙数);
    const 螺: any = (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">`
        + `<ellipse cx="0" cy="0" rx="3.4" ry="2.4" fill="#6b6250"/>`
        + `<path d="M-1.6 0.3 q1.8 -1.9 3.4 -0.5" stroke="#a99e86" stroke-width="0.9" fill="none"/>`
        + `</g>`;
    const 螺位: any = [[27, 131], [124, 133], [213, 130.6], [296, 132.4]];
    const 虫: any = (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">`
        + `<ellipse cx="0" cy="0" rx="2.4" ry="1" fill="#3c4432" opacity=".85"/>`
        + `<path d="M-1.4 0.6 l-2.4 1.8 M1.4 0.6 l2.4 1.8 M0 0.6 l0 2.2" stroke="#3c4432"`
        + ` stroke-width="0.55" fill="none" opacity=".7"/></g>`;
    const 虫位: any = [[46, 104], [150, 96], [232, 110], [292, 100]];
    let 水里: any = "";
    if (有鸭) {
        水里 += `<g opacity=".95"><ellipse cx="58" cy="78" rx="13" ry="6.6" fill="#fdfcf6"/>`
            + `<circle cx="71" cy="71.6" r="4.4" fill="#fdfcf6"/><path d="M75 71.6 l5.4 -1.7" stroke="#d09a2c" stroke-width="2.4"/>`
            + `<path d="M46 78 q-4 -3 -1 -6" stroke="#e6e2d2" stroke-width="2" fill="none"/></g>`
            + `<g opacity=".92"><ellipse cx="252" cy="90" rx="11" ry="5.6" fill="#f9f7ee"/>`
            + `<circle cx="263" cy="84.4" r="3.8" fill="#f9f7ee"/><path d="M266.6 84.4 l4.6 -1.5" stroke="#d09a2c" stroke-width="2"/>`
            + `<path d="M242 90 q-3.6 -2.6 -1 -5.2" stroke="#e6e2d2" stroke-width="1.8" fill="none"/></g>`;
    }
    if (e >= 70)
        水里 += 虫位.map(([x, y]: any) => 虫(x, y)).join("");
    if (e < 32) {
        水里 += `<rect x="48" y="112" width="126" height="2.2" fill="#eceae0" opacity=".55"/>`
            + `<rect x="192" y="104" width="98" height="2.4" fill="#eceae0" opacity=".4"/>`
            + `<rect x="0" y="122" width="320" height="3.8" fill="#eceae0" opacity=".85"/>`;
    }
    const 天气层: any = 今景 && 今景.层 ? 今景.层() : "";
    const 近前: any = 埂
        + (e >= 85 ? 螺位.map(([x, y]: any) => 螺(x, y)).join("") : "")
        + 蛙位.map(([x, y, s]: any) => 蛙(x, y, s)).join("")
        + 家什层;
    const 膜层: any = 盖了膜
        ? `<path d="M2 140 V68 q0 -11 11 -11 H307 q11 0 11 11 V140Z" fill="#eff6f1" opacity=".34"/>`
            + [26, 74, 122, 170, 218, 266, 300].map((x?: any) => `<path d="M${x} 140 V68" stroke="#7e9488" stroke-width="1" opacity=".34"/>`).join("")
            + `<path d="M2 140 V68 q0 -11 11 -11 H307 q11 0 11 11 V140" fill="none"
           stroke="#b9cbc0" stroke-width="1.3" opacity=".85"/>`
            + `<path d="M8 74 q152 -16 304 0" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".5"/>`
            + `<text x="12" y="64" font-size="9" fill="#5d7268" opacity=".9">膜 底 下</text>`
        : "";
    const 棚没拆: any = !!(S.flags && S.flags["盖膜"] && S.flags["棚-没拆"]) && !苗期;
    const 棚架层: any = 棚没拆
        ? `<g>
        <rect x="0" y="52" width="112" height="88" fill="#3f4a3a" opacity=".15"/>
        ${[12, 42, 72, 100].map((x?: any) => `<path d="M${x} 140 V72 q0 -10 10 -10" stroke="#8d7c56" stroke-width="1.7" fill="none" opacity=".92"/>`).join("")}
        <path d="M112 140 V72 q0 -10 -9 -10" stroke="#8d7c56" stroke-width="1.7" fill="none" opacity=".92"/>
        <path d="M12 68 H104" stroke="#8d7c56" stroke-width="1.2" fill="none" opacity=".6"/>
        <path d="M42 140 V80 M42 84 q7 -5 13 -1" stroke="#9c8a63" stroke-width="1.1" fill="none" opacity=".75"/>
        <path d="M100 92 q-5 6 -1 13" stroke="#eef4ef" stroke-width="1.4" fill="none" opacity=".5"/>
        <text x="10" y="60" font-size="9" fill="#6d7861" opacity=".9">棚 还 立 着</text>
      </g>`
        : "";
    return `<svg class="tian" viewBox="0 0 320 140" role="img"
      aria-label="你的田：${ctx.esc(段)}，生态 ${e}，品质 ${q}，产量 ${h} 斤${倒 ? "，已倒伏" : ""}">
    <defs><linearGradient id="tianSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${天[0]}"/><stop offset="1" stop-color="${天[1]}"/>
    </linearGradient>
    <linearGradient id="旱泥" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9c8b5e"/><stop offset="1" stop-color="#cbbd92"/>
    </linearGradient></defs>
    <rect width="320" height="46" fill="url(#tianSky)"/>
    <path d="M0 44 q42 -13 88 -4 q44 9 82 -2 q58 -13 150 5 v9 H0Z" fill="#7d8f72" opacity="${今景 ? 今景.山 : (年色 === "d" ? ".42" : ".58")}"/>
    <rect y="46" width="320" height="94" fill="${水}"/>
    <rect y="46" width="320" height="1.8" fill="#ffffff" opacity=".3"/>
    ${水里}
    ${丛.join("")}
    ${天气层}
    ${近前}
    ${棚架层}
    ${膜层}
  </svg>`;
};

// 田的样子：保留原玩法的计算或流程。
ctx.田的样子 = function (S?: any) {
    const { ecology: e, quality: q, harvest: h }: any = S.stats, out: any = [];
    if (e >= 85)
        out.push("田水清，看得见螺蛳贴着泥走。天一黑，蛙声一大片。");
    else if (e >= 70)
        out.push("田埂上能碰见青蛙，水里也有小虫在游。");
    else if (e >= 50)
        out.push("田里不算脏，可也没什么活物。土踩上去是实的。");
    else if (e >= 32)
        out.push("土有点板。蹲下去翻，蚯蚓少见。");
    else
        out.push("水发浑，田埂边积着一层白膜。田里静得吓人，一声虫叫都没有。");
    if (S.flags && S.flags["稻鸭"])
        out.push("鸭子还在秧行间一趟一趟地趟。");
    if (q >= 78)
        out.push("叶片挺，颜色正，秆子捏着硬。");
    else if (q >= 62)
        out.push("长势中规中矩，看不出什么毛病。");
    else if (q >= 45)
        out.push("叶色偏深，有点贪青，剑叶还黑绿着不褪。");
    else
        out.push("叶子黑绿得发亮，秆子捏着发软，基部节间拉得老长，长得太猛了。");
    if (h >= 1100)
        out.push("稻子密，人走进去要拨开。");
    else if (h <= 600)
        out.push("田里稀，风一吹能看见地皮。");
    return out.join("");
};
}

// 所有函数注册后，再按原顺序初始化数据，避免循环依赖。
export function initialize(ctx: GameContext): void {
ctx.阶段高 = { 苗期: 0.30, 分蘖: 0.52, 孕穗: 0.74, 灌浆: 0.90, 成熟: 1.00 };

ctx.已倒过 = false;

ctx.家什 = {
    簸箕: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6" rx="15" ry="2.4" fill="#5f6b58" opacity=".2"/>
    <path d="M-15 -2 q15 10 30 0 q-2 7.6 -15 7.6 q-13 0 -15 -7.6Z" fill="#c4a877"/>
    <path d="M-15 -2 q15 10 30 0" stroke="#9c8253" stroke-width="1" fill="none"/>
    <ellipse cx="0" cy="-1.6" rx="10.5" ry="3.2" fill="#dcc98e"/>
    <path d="M-6.5 -1.8 l1.5 -1.1 M-1.5 -2.4 l1.3 -1.1 M3.5 -2.2 l1.5 -1.1"
      stroke="#b8a468" stroke-width="1" stroke-linecap="round"/>
    </g>`,
    种袋: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7" rx="11" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <path d="M-9 6.4 V-4 q0 -6 9 -6 q9 0 9 6 V6.4Z" fill="#d9ceb5" stroke="#a89a7c" stroke-width="1"/>
    <path d="M-9 -4 q9 3.2 18 0" stroke="#a89a7c" stroke-width="1" fill="none"/>
    <path d="M-3.6 -9.6 q3.6 -2.6 7.2 0" stroke="#8a7f66" stroke-width="1.4" fill="none"/>
    <circle cx="0" cy="1.4" r="2.8" fill="#a84a35"/>
    </g>`,
    换种袋: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7" rx="11" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <path d="M-9.4 6.4 V-2.6 q0 -7 9.4 -7 q9.4 0 9.4 7 V6.4Z"
      fill="#cdbd97" stroke="#a2906a" stroke-width="1"/>
    <path d="M-9.4 1.6 q9.4 2.6 18.8 0" stroke="#a2906a" stroke-width=".8" fill="none"/>
    <path d="M-9.4 -2.6 q9.4 3 18.8 0" stroke="#a2906a" stroke-width="1" fill="none"/>
    <path d="M-4.6 -8.6 q4.6 -3.4 9.2 0" stroke="#8a7f66" stroke-width="1.4" fill="none"/>
    <path d="M-3.4 -6.6 q3.4 -2.4 6.8 0" stroke="#b8a97f" stroke-width="2.2" fill="none"/>
    <path d="M4.6 -6.2 l3 -2.6" stroke="#8a7f66" stroke-width=".9"/>
    <g transform="rotate(9 8 -9)">
      <rect x="4.4" y="-11.4" width="7.6" height="5.4" rx=".6"
        fill="#f4efe0" stroke="#c3bba2" stroke-width=".8"/>
      <path d="M5.8 -10.2 h4.8 M5.8 -8.9 h3.4" stroke="#b3a98e" stroke-width=".7"/>
    </g>
    </g>`,
    膜卷: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6.5" rx="16" ry="2.6" fill="#5f6b58" opacity=".22"/>
    <rect x="-15" y="-5.5" width="30" height="11" rx="5.5" fill="#f4f8f5" stroke="#93a69a" stroke-width="1"/>
    <ellipse cx="15" cy="0" rx="3" ry="5.5" fill="#e3ebe5" stroke="#93a69a" stroke-width=".9"/>
    <ellipse cx="15" cy="0" rx="1.1" ry="2.2" fill="#b6c6bb"/>
    <path d="M-9 -5.5 v11 M-3 -5.5 v11" stroke="#d3ddd7" stroke-width=".8"/>
    </g>`,
    秧铲: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7" rx="9" ry="2" fill="#5f6b58" opacity=".2"/>
    <path d="M0 -13 v9" stroke="#a8763f" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M0 -12 q4.4 -1.6 3.2 -5.4" stroke="#8a5f2f" stroke-width="2.2"
      fill="none" stroke-linecap="round"/>
    <path d="M-7 -4 h14 v6.6 q-1.6 5.4 -7 5.4 q-5.4 0 -7 -5.4Z"
      fill="#b9c2c6" stroke="#87949a" stroke-width="1"/>
    <path d="M-7 -4 h14" stroke="#9aa7ad" stroke-width="1"/>
    <path d="M-7 1 q7 3 14 0" stroke="#cfd6d9" stroke-width=".8" fill="none"/>
    </g>`,
    搪瓷盆: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6.4" rx="10.5" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <path d="M-11 -2 q11 12.4 22 0" fill="#eef1f2" stroke="#a9b4b8" stroke-width="1"/>
    <ellipse cx="0" cy="-2" rx="11" ry="3.6" fill="#f8fafa" stroke="#a9b4b8" stroke-width="1"/>
    <ellipse cx="0" cy="-1.5" rx="8.4" ry="2.4" fill="#dde5e7"/>
    <path d="M-11 -2 q11 -7.4 22 0" fill="none" stroke="#4a7fa8" stroke-width="1.7"/>
    </g>`,
    叶色卡: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="8" rx="9" ry="2" fill="#5f6b58" opacity=".2"/>
    <g transform="rotate(-6)">
      <rect x="-12" y="-9" width="24" height="18" rx="1.6" fill="#f8f3e4"
        stroke="#c3bba2" stroke-width="1"/>
      ${["#8aa35c", "#6a8f3e", "#48742c", "#2a4d1c"].map((c?: any, i?: any) => '<rect x="' + (-10 + i * 5.4) + '" y="-6.4" width="4.6" height="7.4" rx=".8" fill="' + c + '"/>').join("")}
      <rect x="-10" y="2.8" width="20" height="1.6" rx=".8" fill="#c3bba2"/>
    </g>
    </g>`,
    芽谷: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6.6" rx="11" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <path d="M-11 -1.4 q11 9.6 22 0" fill="#d9c69c" stroke="#b3966a" stroke-width="1"/>
    <ellipse cx="0" cy="-1.4" rx="11" ry="3.7" fill="#eadcb6" stroke="#b3966a" stroke-width="1"/>
    <ellipse cx="0" cy="-1.2" rx="8.2" ry="2.5" fill="#d2bf90"/>
    ${[-7, -3.6, 0, 3.6, 7].map((d?: any, i?: any) => {
        const 斜: any = (i - 2) * .85;
        const 尖: any = `M${d} -2 q${斜} -3.4 ${斜 * 1.6} -6`;
        return `<path d="${尖}" stroke="#eef3e0" stroke-width="2.2" fill="none" stroke-linecap="round"/>`
            + `<path d="${尖}" stroke="#9dc267" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
    }).join("")}
    </g>`,
    水尺: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="8.6" rx="8" ry="2" fill="#5f6b58" opacity=".2"/>
    <rect x="-1.5" y="-19" width="3" height="27" rx=".9" fill="#e6d9b6"
      stroke="#b3a077" stroke-width=".8"/>
    <path d="M-1.5 -13.6 h3 M-1.5 -8.6 h3 M-1.5 -3.6 h3" stroke="#7d6a44" stroke-width="1.1"/>
    <path d="M-1.5 -17.6 h3" stroke="#a8442f" stroke-width="1.4"/>
    <path d="M-14 1.2 q14 3.4 28 0" stroke="#8fb6c9" stroke-width="1.5" fill="none"/>
    <path d="M-14 1.2 q14 3.4 28 0 v4.4 q-14 3.4 -28 0Z" fill="#a9cbdb" opacity=".5"/>
    </g>`,
    空秆: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="9" rx="10" ry="2.2" fill="#4a3d22" opacity=".26"/>
    ${["M-6 9 q2.4 -9.5 5 -16", "M-1 -7 q4.8 -1.4 8 -6.4"]
        .map((d?: any, i?: any) => `<path d="${d}" stroke="#f6efd8" stroke-width="${i ? 3.8 : 4.4}"
        fill="none" stroke-linecap="round"/>`).join("")}
    ${["M-6 9 q2.4 -9.5 5 -16", "M-1 -7 q4.8 -1.4 8 -6.4"]
        .map((d?: any) => `<path d="${d}" stroke="#6b5730" stroke-width="1.1"
        fill="none" stroke-linecap="round"/>`).join("")}
    /* 「空」就在这一笔：断口是个洞，一眼能看进去 */
    <ellipse cx="-1.1" cy="-6.6" rx="2.7" ry="1.5" fill="#3d3016"
      transform="rotate(-38 -1.1 -6.6)"/>
    <path d="M-4 1.6 q1.8 .7 3.4 0" stroke="#6b5730" stroke-width="1.2" fill="none"/>
    ${[-5.2, -2.6, 0, 2.6, 5.2].map((d?: any) => `<path d="M${7 + d * .42} ${-13.4 + Math.abs(d) * .6} q${d * .8} 3.8 ${d * 1.1} 6.2"
        stroke="#f6efd8" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join("")}
    ${[-5.2, -2.6, 0, 2.6, 5.2].map((d?: any) => `<path d="M${7 + d * .42} ${-13.4 + Math.abs(d) * .6} q${d * .8} 3.8 ${d * 1.1} 6.2"
        stroke="#6b5730" stroke-width=".75" fill="none" stroke-linecap="round"/>`).join("")}
    </g>`,
    秧把: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="6" rx="12" ry="2.2" fill="#5f6b58" opacity=".2"/>
    ${[-9, -4.5, 0, 4.5, 9].map((d?: any) => `<path d="M0 5 Q${(d * .55).toFixed(1)} -2 ${d} -11" stroke="${Math.abs(d) > 6 ? "#5f9c42" : "#4b8434"}"
        stroke-width="2" fill="none" stroke-linecap="round"/>`).join("")}
    <path d="M-4.4 3.4 q4.4 -2.4 8.8 0" stroke="#b4915c" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    </g>`,
    水口: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7" rx="12" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <rect x="-11" y="-9" width="22" height="16" rx="1.5" fill="#7f8a68"/>
    <rect x="-9.4" y="-7.6" width="18.8" height="3.6" rx="1.2" fill="#bd9a63"/>
    <rect x="-9.4" y="-2.2" width="18.8" height="3.6" rx="1.2" fill="#a5834f"/>
    <rect x="-9.4" y="3.2" width="18.8" height="3.6" rx="1.2" fill="#bd9a63"/>
    <rect x="-1" y="-9" width="2" height="16" fill="#6a7355"/>
    <circle cx="0" cy="-5.8" r="1.5" fill="#6a7355"/>
    </g>`,
    稗草: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    ${[-13, -4.5, 4, 12.5].map((d?: any, i?: any) => `<path d="M0 0 Q${(d * .5).toFixed(1)} -10 ${d} -21"
        stroke="${i % 2 ? "#93b062" : "#a6c073"}" stroke-width="2.3" fill="none" stroke-linecap="round"/>`).join("")}
    <path d="M-1.6 0 q1.6 -1.6 3.2 0" stroke="#7d9450" stroke-width="1.6" fill="none"/>
    </g>`,
    药桶: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7" rx="10.5" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <rect x="-8" y="-7" width="16" height="14" rx="3" fill="#dfe6da" stroke="#6e7f68" stroke-width="1.1"/>
    <rect x="-8" y="-0.6" width="16" height="4.2" fill="#9db096"/>
    <rect x="-4" y="-10" width="8" height="3.4" rx="1.4" fill="#8fa08a"/>
    <path d="M8 -4 q8 0.6 9 7.4" stroke="#6e7a68" stroke-width="1.3" fill="none"/>
    <path d="M16.6 3 l4 4" stroke="#9aa88f" stroke-width="2.4" stroke-linecap="round"/>
    </g>`,
    化肥袋: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7" rx="10" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <path d="M-8 6.4 V-5 q0 -5 8 -5 q8 0 8 5 V6.4Z" fill="#e8e4d5" stroke="#a9a48d" stroke-width="1"/>
    <path d="M-8 -5 q8 3.2 16 0" stroke="#a9a48d" stroke-width="1" fill="none"/>
    <rect x="-5.4" y="-3.2" width="10.8" height="6.4" rx="1.2" fill="#5b7fa8"/>
    <text x="0" y="1.6" font-size="4.8" fill="#ffffff" text-anchor="middle"
      font-family="sans-serif">N</text>
    </g>`,
    镰刀: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7" rx="13" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <path d="M-13 4 Q-14.4 -8.6 -0.6 -9.6" stroke="#c6cac3" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M-12.6 3.4 Q-13.8 -7.8 -1.2 -8.8" stroke="#f0f2ee" stroke-width="1" fill="none" stroke-linecap="round"/>
    <rect x="-17.4" y="1.2" width="11" height="4.6" rx="2.3" transform="rotate(26 -12 3.5)" fill="#8a6b4a"/>
    </g>`,
    铁锹: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="0" cy="7.6" rx="12" ry="2.2" fill="#5f6b58" opacity=".2"/>
    <rect x="-1.7" y="-13" width="3.4" height="14" rx="1.7" fill="#b4915c"/>
    <rect x="-1.7" y="-13" width="3.4" height="3.4" rx="1.7" fill="#9c7a49"/>
    <path d="M-5.2 -1.6 h10.4 v4.6 q0 4.4 -5.2 6.6 q-5.2 -2.2 -5.2 -6.6Z"
      fill="#bcc0b7" stroke="#8c9187" stroke-width=".9"/>
    </g>`,
    鸭: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <ellipse cx="-3" cy="1" rx="13" ry="6.4" fill="#fdfcf6"/>
    <path d="M-14 1.6 q-3.6 -2.8 -1 -5.6" stroke="#e6e2d2" stroke-width="2" fill="none"/>
    <circle cx="10" cy="-5.4" r="4.4" fill="#fdfcf6"/>
    <path d="M14.2 -5.4 l5.6 -1.8" stroke="#d09a2c" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="11.4" cy="-6.4" r="0.9" fill="#2b3026"/>
    <path d="M-6 -2.6 q5 -2.4 10 -0.4" stroke="#e8e4d6" stroke-width="1.1" fill="none"/>
    </g>`,
    沟: (x?: any, y?: any, s: any = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-26 0 q26 7 52 0 q-26 8 -52 0Z" fill="#6f6a52"/>
    <path d="M-26 0 q26 7 52 0" stroke="#5c5943" stroke-width="1" fill="none"/>
    <rect x="-19" y="-1.4" width="38" height="2.6" rx="1.3" fill="#4f4c3a" opacity=".75"/>
    <path d="M-14 2.4 q6 1.6 12 0.6 M4 3 q6 1 11 -0.4" stroke="#7c7660" stroke-width="1.1"
      fill="none" stroke-linecap="round"/>
    </g>`,
};

ctx.落雨 = (n?: any) => Array.from({ length: n }, (_?: any, i?: any) => {
    const x: any = (i * 37 + 11) % 332 - 8, y: any = (i * 23 + 5) % 118;
    return `<path d="M${x} ${y} l4.6 12" stroke="#ffffff" stroke-width=".75"`
        + ` opacity=".42" stroke-linecap="round"/>`;
}).join("");

ctx.涟漪 = (位?: any) => 位.map(([x, y]: any, i?: any) => `<ellipse cx="${x}" cy="${y}" rx="${5 + i * 1.1}" ry="${1.5 + i * .3}"`
    + ` fill="none" stroke="#ffffff" stroke-width=".7" opacity=".34"/>`).join("");

ctx.挂霜 = () => `<rect y="72" width="320" height="68" fill="#f4f8fa" opacity=".3"/>`
    + Array.from({ length: 16 }, (_?: any, i?: any) => {
        const x: any = (i * 41 + 7) % 320, y: any = 58 + (i * 17) % 54;
        return `<circle cx="${x}" cy="${y}" r="${(.9 + (i % 3) * .35).toFixed(2)}"`
            + ` fill="#ffffff" opacity=".6"/>`;
    }).join("");

ctx.退水 = () => `<rect y="47" width="320" height="21" fill="#b5a67c"/>`
    + `<rect y="47" width="320" height="21" fill="url(#旱泥)" opacity=".55"/>`
    + `<path d="M0 68.5 q62 -3.4 132 -1.2 q88 2.6 188 -1.4" stroke="#8b7d55"`
    + ` stroke-width="1.3" fill="none" opacity=".85"/>`
    + [14, 52, 96, 140, 188, 236, 282].map((x?: any, i?: any) => `<path d="M${x} 49 l${i % 2 ? 3.2 : -3.8} 5.4 l${i % 3 ? -2.4 : 3.2} 7.4"`
        + ` stroke="#8b7d55" stroke-width=".95" fill="none" opacity=".5"/>`).join("");

ctx.压寒 = () => `<rect y="26" width="320" height="114" fill="#b9cfe0" opacity=".17"/>`
    + `<rect y="120" width="320" height="20" fill="#eef4f8" opacity=".38"/>`;

ctx.放晴 = () => `<ellipse cx="288" cy="4" rx="126" ry="92" fill="#fff3c4" opacity=".17"/>`
    + `<ellipse cx="298" cy="0" rx="78" ry="58" fill="#fff8dc" opacity=".2"/>`
    + `<ellipse cx="306" cy="-4" rx="40" ry="31" fill="#fffdf0" opacity=".26"/>`;

ctx.年景天 = {
    秋淋: { 天: ["#8d979c", "#c2cacc"], 山: ".62",
        层: () => ctx.落雨(34) + ctx.涟漪([[52, 62], [148, 74], [246, 58], [104, 96], [286, 88]]) },
    早霜: { 天: ["#b6c4ce", "#eef3f5"], 山: ".5", 层: () => ctx.挂霜() },
    凉夏: { 天: ["#c4c9c4", "#d3d8d2"], 山: ".2",
        层: () => `<rect y="14" width="320" height="126" fill="#e6e9e2" opacity=".3"/>`
            + Array.from({ length: 15 }, (_?: any, i?: any) => {
                const x: any = (i * 53 + 17) % 334 - 8, y: any = (i * 31 + 9) % 110;
                return `<path d="M${x} ${y} l2 6.5" stroke="#ffffff"`
                    + ` stroke-width=".6" opacity=".32" stroke-linecap="round"/>`;
            }).join("") },
    伏旱: { 天: ["#d9d2ae", "#f8f5e2"], 山: ".34", 层: () => ctx.退水() },
    倒春寒: { 天: ["#a6b4c0", "#dde6ea"], 山: ".55", 层: () => ctx.压寒() },
    暖春: { 天: ["#cfe2c6", "#fbfcf2"], 山: ".5", 层: () => "" },
    丰年: { 天: ["#d3e6c8", "#fdfef6"], 山: ".55", 层: () => ctx.放晴() },
    雨水匀: { 天: ["#cfe0d4", "#f8fbf4"], 山: ".55", 层: () => "" },
    暖秋: { 天: ["#d9e3c2", "#fbfaf0"], 山: ".5", 层: () => ctx.放晴() },
};

ctx.大田屏 = (d?: any) => !!(d && d.热区 && d.options && d.热区.length === d.options.length);

ctx.小字文 = (o?: any, S?: any) => {
    if (!o)
        return "";
    const v: any = o.注 !== undefined ? o.注 : o.小字;
    if (v === undefined || v === null)
        return "";
    const t: any = typeof v === "function" ? v(S) : v;
    return t || "";
};

ctx.算 = (v?: any, S?: any) => (typeof v === "function" ? v(S) : v);

ctx.算数 = (v?: any, S?: any) => ctx.算(v, S) || 0;

ctx.注文 = (o?: any, S?: any) => {
    const t: any = ctx.小字文(o, S);
    return t ? `<span class="sz">${ctx.esc(t)}</span>` : "";
};

ctx.方向文 = (o?: any, S?: any) => {
    if (!o)
        return "";
    const e: any = ctx.算(o.effect, S);
    if (!e || typeof e !== "object")
        return "";
    const 出: any = [];
    for (const k of ["harvest", "quality", "ecology"]) {
        const v: any = Number(e[k]) || 0;
        if (Math.abs(v) < 4)
            continue;
        出.push(`<u class="${v > 0 ? "up" : "dn"}">${ctx.LABEL[k]}${v > 0 ? "↑" : "↓"}</u>`);
    }
    return 出.length ? `<span class="dir">${出.join("")}</span>` : "";
};

ctx.说话 = (d?: any) => {
    if (!d || !d.story)
        return "";
    const t: any = typeof d.story.text === "function" ? d.story.text(ctx.S) : d.story.text;
    return `<div class="say"><span class="who">${ctx.esc(d.story.who)}</span>${ctx.para(t)}</div>`;
};
}
