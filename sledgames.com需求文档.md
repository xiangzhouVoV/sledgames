# sledgames.com v1 需求文档（2026-10-09 定稿）

## 0. 项目定义

英文**雪橇/雪上浏览器小游戏聚合站**，目标市场**美国**，主攻 Google 自然搜索。内容全部「一游戏一页面」，游戏通过**发行平台官方 iframe 代码**嵌入。变现 =「游戏区内平台广告分成 + 游戏区外自有 AdSense」。

**v1 交付目标**：1 首页 + 2 品类页 + 7 游戏页 + 1 总览页 + 5 合规页，全部服务端预渲染、可被 Google 完整抓取。

## 1. 技术选型（约束，非建议）

- **框架**：Next.js（App Router）**SSG 全量预渲染**，或 Astro。必须服务端渲染完整 HTML，禁止 CSR 空壳、禁止依赖客户端 JS 才有内容。
- **部署**：Cloudflare Pages绑定 sledgames.com，强制 HTTPS。
- **数据源**：单一 `data/games.json` 驱动全站，新增游戏只改这个文件。
- **样式**：纯 CSS，不用重型 UI 框架，**移动优先**（游戏区在手机自适应缩放）。
- **不做**：登录、评论、支付、订阅、原生 App（后两条是平台条款明令禁止）。

## 2. 硬约束（违反即返工）

1. 游戏一律用平台**官方 iframe 代码**；**禁止下载游戏文件自托管、禁止整站 iframe**。
2. GameDistribution 的 embed URL **必须动态带上 `gd_sdk_referrer_url=<当前页面完整 URL>`**（官方红字提示：不填广告效果会掉，裸链接被标为 "WRONG USAGE"）。
3. **评分、投票数、游玩次数、攻略、道具价格表一律不准编造**；无真实来源就不渲染该区块。
4. 广告位必须放在 **iframe 之外的 DOM 兄弟节点**，不许插进游戏区。
5. 全站英文、`lang="en"`、美式货币与日期。

## 3. 路由与目标词（v1 范围）

| 优先级 | URL | 类型 | 目标词 | 月搜索量(US) | KD |

|---|---|---|---|---|---|---|
| P0 | `/` | 首页 | sled games | 27,100 | 33.2 |
| P0 | `/sled-rider` | 游戏页 | sled rider | 49,500 | 32.9 |
| P0 | `/snowboard-games` | 品类页 | snowboard games | 18,100 | 27.2 |
| P0 | `/games` | 全站总览 | — | — | — |
| P1 | `/snowball-io` | 游戏页 | snowball io | 9,900 | 48.7 |
| P1 | `/moto-x3m-winter` | 游戏页 | moto x3m winter | 9,900 | — |
| P1 | `/snow-rider-2` | 游戏页 | snow rider 2 | 8,100 | — |
| P1 | `/ski-games` | 品类页 | ski games | 6,600 | 32.9 |
| P2 | `/snow-drift` | 游戏页 | snow drift | 5,400 | — |
| P2 | `/slope-rider-2` | 游戏页 | slope rider 2 | 3,600 | — |
| P2 | `/ski-simulator` | 游戏页 | ski simulator | 1,600 | 33.1 |
| P2 | `/snowboard-simulator` | 游戏页 | snowboard simulator | 720 | 25.7 |

**URL 规则**：游戏页 = `/游戏名-kebab-case`，**不带 `/games/` 前缀**（与对手 sledrider.io 首页打法一致）；品类页 = `/xxx-games`。

**v1 禁入**：`snow games`（6,600 但 KD 62.9 倒挂）、`snow rider`（183 万/月，KD 78.3，5 个 EMD 首页正面争夺）、`slope rider`（20.1 万/月，KD 57.3）、`snow rider 3d unblocked`（9.05 万/月，KD 80.5）。

## 4. 数据模型 `data/games.json`（全站唯一内容源）

```json
{
  "slug": "sled-rider",
  "title": "Sled Rider",
  "category": ["sledding-games", "snow-games"],
  "embed": {
    "provider": "gamemonetize",
    "iframeSrc": "https://html5.gamedistribution.com/<gameId>/?gd_sdk_referrer_url={{PAGE_URL}}",
    "width": 960,
    "height": 600
  },
  "developer": "",
  "released": "",
  "genres": ["Endless Runner", "3D"],
  "intro": "",
  "howToPlay": [],
  "tips": [],
  "faqs": [{"q": "", "a": ""}],
  "similar": ["snow-rider-2", "slope-rider-2"],
  "rating": null,
  "playCount": null
}
```

- 空值 / null 的字段 → 前端不渲染该区块（约束 3）。
- `embed.iframeSrc` 里的 `{{PAGE_URL}}` 构建时替换为该页 canonical URL（约束 2 的落地）。
- `similar` 驱动内链，至少 3 个。

## 5. 单页模板（区块顺序，照抄市场已验证形态）

顺序来自拆解 `sled rider` 现排第一的 sledrider.io 实际页面结构，**不要改顺序**：

```
1. <Header>     Logo + 导航（Home / Sled Games / Snowboard Games / Ski Games）+ 3~4 个同类游戏直链
2. <H1>         游戏名（纯游戏名，不堆修饰）
3. <AdSlot id="top">        自适应广告位（游戏区上方）
4. <GameStage>  iframe 游戏区：宽 100%、高 600~631px；移动端按 16:10 缩放
5. <InfoBar>    评分 / 投票数 / 游玩次数（无真实数据则整个隐藏）
6. <AdSlot id="below">      728x90（游戏区下方）
7. <H2> What is {Game}?      简介：开发者、发行时间、品类、玩法类型
8. <H2> How to Play          4~6 步，每步一句
9. <H2> Pro Tips & Tricks    3~5 条技巧
10. <Table> 道具/角色/价格表（可选，无数据则跳过）
11. <H2> Explore Other {Category} Games   5~8 个同类游戏卡片（缩略图+名称+一句描述）
12. <H2> FAQs                5 问，必须长尾（是否免费、要不要下载、和学习版区别、在哪玩、像不像某游戏）
13. <CategoryLinks>          底部分类入口
14. <Footer>  About Us / Contact Us / Privacy Policy / Terms of Use / Copyright + 全站游戏链接
```

**首页差异**：H1 = `Sled Games`，游戏区放主推游戏（sled rider）可玩 iframe，下方接「全部游戏」网格。
**品类页差异**：H1 = 品类词，无 iframe，改为该品类游戏网格 + 150~250 词品类介绍 + FAQ。

## 6. TDK 规则

| 项 | 规则 | 示例（sled rider） |
|---|---|---|
| Title | 游戏页 = **纯游戏名**；首页/品类页 = `{词} - Free Online {品类} Games` | `Sled Rider` |
| Description | 完整句 + 动作词，含核心词 1 次，140~160 字符 | `Play Sled Rider, a 3D endless sled-driving game full of obstacles! Control a sled, dodge trees and rocks, and unlock new sleds for free online.` |
| H1 | 与目标词一致，只出现一次 | `Sled Rider` |
| canonical | 自指绝对 URL | `https://sledgames.com/sled-rider` |

**结构化数据**：首页 `WebSite`（可含 SearchAction）；游戏页 `VideoGame`（name / applicationCategory: Game / operatingSystem: Web Browser / offers:{price:0}）；FAQ 区块同步挂 `FAQPage`。

## 7. 内链规则（三张网都要建）

1. **导航栏**：Home + 3 品类页 + 3~4 重点游戏页直链（全站每页都有）。
2. **正文内链**：每个游戏页「Explore Other」区块链 5~8 个同类游戏页（由 `similar` 字段驱动）。
3. **分类聚合**：`/games` 列全部游戏；品类页列该品类全部游戏；页脚再列一遍重点游戏。

要求：任意游戏页 → 任意其他游戏页点击距离 ≤ 3；每个新页上线必须从至少 3 个已有页面链过去（收录关键）。

## 8. 广告位

- 每页 3 个以内：游戏区上方 1 个（自适应）、游戏区下方 1 个（728x90）、内容中部 1 个。
- `<AdSlot>` 组件统一封装，**容器给固定高度**（防 CLS）；AdSense 未批时渲染占位空框，不影响布局。
- 广告与 iframe **必须是 DOM 兄弟节点，不能嵌套**。
- 游戏区内广告由平台 SDK 处理，本站不需要做任何事。

## 9. 合规与技术页

必备 5 页且内容不能是空壳：`/about`、`/contact`（真实邮箱）、`/privacy-policy`（**写明使用 Google AdSense、第三方广告 Cookie、平台游戏嵌入**）、`/terms-of-use`、`/copyright`。
另加：`/robots.txt`（允许全站抓取 + 指向 sitemap）、`/sitemap.xml`（自动生成、覆盖全站）、`404` 页（含游戏推荐，不做死胡同）。

## 10. 上线前验收清单

- [ ] 禁用 JS 后每页仍能看到完整正文（SSG 验证）
- [ ] 每个游戏页 iframe `src` 带上自己的页面 URL 参数
- [ ] 全站 TDK 唯一、无重复 Title
- [ ] 所有页面 canonical 自指，无互相指向
- [ ] 游戏页 LCP < 2.5s（iframe 用 `loading="lazy"`，首屏主推游戏不 lazy）
- [ ] 移动端游戏区不溢出、可点击
- [ ] sitemap 覆盖全部 11+ 页面
- [ ] 全站无任何编造的评分/次数/攻略数字
- [ ] 5 个合规页内容完整

## 11. 上线后立刻做（不属开发）

1. 提交 GSC + sitemap；
2. 注册 GameMonetize（45% 分成，NET 30、$30 起付）和 GameDistribution（50% Net Revenue，EUR 50 起付）**两家出版商账号** → 后台逐个核可嵌版本（`sled rider` 公开目录未确认，需后台搜）→ 代码回填 `games.json`；
3. 申请 AdSense（内容齐了就申请，前置审核周期）；
4. 外链按 A 方案节奏走。

## 12. 决策链与依据（为什么这么定）

**赛道选择（数据来自站内工具实测，2026-10 上旬）**
- 词池分三层：品类词约 5.4 万/月（sled games 27,100 / KD 33.2；snowboard games 18,100 / KD 27.2；ski games 6,600 / KD 32.9；snow games 6,600 但 KD 62.9 弃）；长尾（ski games 一族 50 词约 2.4 万/月，变体高度重叠不能累加）；单游戏品牌词可争约 8.6 万/月（sled rider 49,500 / KD 32.9；snowball io 9,900 / KD 48.7 且第一名 DR 仅 1；moto x3m winter 9,900；snow rider 2 8,100；snow drift 5,400；slope rider 2 3,600）。
- 三档合计估算可到 **3.8~5.4 万访问/月**（估算值，非工具数字）。
- 季节形状：高位 10 月~次年 3 月，1~3 月峰值，7 月谷底。流量以美国为主（AdSense 单价高的一档）。

**盘面机会**
- sled rider 第 1 名 sledrider.io：注册 11 个月、DR 30、体验分 17/100（全盘垫底）→ 工具判定「新站正在赢，是此词可做的最强证据」。
- snowball io 第 1 名 snowball-io.io：DR 仅 1。
- snowboard games 第 1 名 snowboarding-game.io：DR 2。盘面最弱占位者门槛极低。
- 赛道存在成熟的「EMD 单游戏站矩阵」（sledrider.io / slope-rider.io / sloperider.org / sloperider2.io / slopegame-2.io 等），全是用域名直拼游戏名、首页押一个游戏，多数注册不满 18 个月。

**变现结构（重要纠正）**
- 官方发行网络的游戏区内广告**按分成给站长**（GameMonetize 45% / GameDistribution 50% Net Revenue），不是「拿不到」；游戏区外的 AdSense 100% 自留。
- 走官方嵌法 = 有授权（签出版商许可协议），避开了扒文件自托管的版权风险。
- 因此本项目的「版权风险」这层已基本消除，代价是 eCPM 由平台定、不能做订阅/原生 App。

**方案选择：走 A（正面打成熟词 + 外链碾压）**
- 社群依据：2026 年 2 月新词新站比赛第一名张瑜复盘——成熟游戏词必须**发 2 个月外链、引用域名做到 200~300 个**才会慢慢排到首页直至第一。
- 哥飞成本参照：一个老词新站「三个月起量，大概花了 5000 美金外链费用」；上站要快、外链要快，初期先用导航站、博客评论等快速可获取的外链打底（他自述发一条博客评论外链成本极低）。
- 现实成本区间 **$1,400~$5,000**，用免费/低成本链打底 + 客座文章补权重可压到千元级。
- 节奏：200~300 个域名摊到 2 个月，**每天 3~5 条**（「外链增长速度」是被哥飞列为封站风险维度之一；那份复盘没有给具体增速数字，不许编）。

**外链选站三条判据**（哥飞定义）：① DR 不低；② 有流量、特别是自然搜索流量；③ 在关键词下能拿到排名。
实操：自然占比 ≥40%、月自然流量至少几千、流量曲线不在跌。

## 13. 下一步待办（新会话可直接接）

1. 交 Codex 开发 v1（先用 `sled-rider` 一个页面跑通模板，确认后批量生成）；
2. 挖一批同类游戏词补进 P1/P2（撑厚页面池 = 长期流量上限）；
3. 出 2 个月外链排期表（把已实测合格的那批站排进去 + 免费链配比）；
4. 12 月顺带铺一批圣诞主题页（thesantatracker.com 同时吃 snow rider / sled rider / snow rider 3d unblocked 三个词，证明两拨受众重叠）。

## 14. 已知坑（务必别踩）

- 别接 Adsterra / Monetag 这类零门槛联盟：群友实测装了之后出现跳转劫持，哥飞确认是它导致的，后果是「劫持完了谷歌排名都下降了」。
- 别整站 iframe 别人的站（会把对方付款页也框进来）。
- 游戏区内的收益不靠「搬文件」变成自己的；自托管不改变产权，只改变谁付服务器钱，且法律责任更重。
- 平台广告可能展示不出来：GameMonetize 自己的出版商指南说后台 AD Impressions 为 0 时建议去申请 AdSense → 所以 AdSense 那条线照样要申请，别只押一边。
- 参考站 sledrider.io 走的是「扒文件自托管 + 自己 AdSense」，**我们只抄它的页面区块结构，不抄它的技术实现**。
