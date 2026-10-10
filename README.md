# Sled Games

Astro + TypeScript + 纯 CSS，构建输出为静态 HTML，面向 `https://sledgames.com`。

## 本地开发

需要 Node.js 22.19+（建议 Node.js 24 LTS，`.nvmrc` 已指定 24）。

```sh
npm ci
cp .env.example .env
npm run dev
```

访问 `http://127.0.0.1:4321`。修改 JSON 后 Astro 会重新构建对应页面。

```sh
npm run verify         # 类型检查、静态构建、内容与协议测试
npx playwright install chromium
npm run test:browser   # 桌面/手机、禁用 JS、FAQ 与 404
npm run preview        # 预览 dist 中的构建产物
npm run release:check  # 检查上线所需的数据；当前阶段预计失败并列出缺项
```

## 本次实现范围

已跑通 Sled Rider 首页模板，并按最新要求为 Snowboard Games、Ski Games 各补入两款游戏。

- 已生成首页、`/games`、两个品类页、五个合规页、404、robots.txt 和 sitemap.xml。
- Header、Footer、官方 iframe 游戏区、广告占位、卡片、FAQ、分类入口复用同一套组件。
- Sled Rider 与首页合为同一个页面，采用首屏游玩布局：首页在游戏正上方显示紧凑的 `Play Sled Rider` H1，导航下直接加载游戏，广告位于游戏和工具栏之后；其他游戏页的页面标题保留给屏幕阅读器，无来源的资料区块不显示。
- JSON-LD：WebSite / VideoGame / FAQPage。FAQ 数据和可见问答使用同一来源；未配置 iframe 时不声明可免费游玩的 Offer。
- 游戏内链来自 `similar`，页脚自动列出全部游戏；新增条目后无需新增页面文件。
- Sled Rider 使用 AZGames 托管的游戏 iframe；两个品类新增 Downhill Snowboard、SnowBoard Game、Ski King、Ski Rush，使用 GameMonetize 官方 iframe。所有游戏支持全屏和重新加载；未启用 AdSense，联系邮箱待配置。

这是可运行的首阶段预览，**尚未达到正式上线验收**。

## UI 与布局

面向英文休闲游戏玩家，参考 [Poki](https://poki.com/en/g/snow-riders) 与 [CrazyGames](https://www.crazygames.com/game/snow-rider-3d) 的分类入口、游戏展示和后续浏览方式。

- 雪白与冰蓝界面，深蓝文字，橙色主按钮；压缩首页介绍，让游戏窗口更早出现。
- 根据“第一屏就能玩”的要求，首页和游戏页取消游戏上方的广告占位；保留下方固定占位，始终位于游戏区外。桌面游戏高度适应视口，手机保持 16:10。
- 游戏卡片优先展示图片、名称、类别和可玩状态；未获授权的截图使用通用雪景插画。
- 桌面四列、手机通常两列、窄屏单列；手机主导航可横向滑动，主要操作目标至少 44px 高。
- FAQ 使用原生折叠交互，保留键盘焦点、跳过导航入口和减少动态效果的偏好支持。
- 首页使用明亮冰蓝渐变背景和白色 CSS 飘雪，背景上的文字使用深蓝，卡片保持清晰；手机减少雪花数量，雪层不接收鼠标或触摸事件，游戏和导航显示在雪层上方，系统开启减少动态效果时自动关闭飘雪。

## 数据与内容

`data/games.json` 是游戏内容的唯一数据源，根节点为游戏对象数组。

新增游戏时：

1. 使用唯一 kebab-case `slug`，其他游戏页面自动生成为 `/{slug}`；Sled Rider 固定使用首页 `/`，由 `gamePath` 统一生成链接。
2. `category` 使用 `sledding-games`、`snowboard-games` 或 `ski-games`。Sled Games 分类入口为首页。
3. 使用 140–160 字符英文 `description`；Title 和 H1 使用纯游戏名。
4. 将平台提供的官方 iframe **src 地址**填入 `embed.iframeSrc`，并填写正确 `provider`。不要填写整段 HTML 或复制对手网站地址。
5. `gamedistribution` 允许 `https://html5.gamedistribution.com/…`；`gamemonetize` 允许官方 `html5.gamemonetize.com`、`html5.gamemonetize.co` 和 `html5.gamemonetize.games` HTTPS 地址；后两个域名来自本轮核对的官方 EMBED 代码。`azgames` 仅允许已核验的 `https://gamea.azgame.io/sled-rider/`，其他路径会被构建拒绝。
6. `{{PAGE_URL}}` 替换为编码后的当前页面 canonical；GameDistribution 的 `gd_sdk_referrer_url` 会自动设置。Sled Rider 使用首页 URL，其他游戏使用各自的页面 URL。
7. 填写 `intro`、`howToPlay`、`tips`、`items`、`rating`、`playCount` 前，在对应 `sources` 字段记录真实来源链接。资料没有确认就留空。
8. `rating` 格式为 `{ "value": 4.2, "count": 123 }`（仅结构说明，不能使用示例数字作为实际数据）；`playCount` 为整数或 `null`。
9. `items` 格式为 `{ "name": "…", "price": "…" }` 数组；货币由内容明确写为美式格式，游戏内虚拟货币须保留实际单位。
10. `similar` 填其他现有游戏 slug；正式上线要求 5–8 个；本轮每个新游戏先链接同品类另一款游戏，首页的 All Games 展示当前全部五款游戏。
11. 可选 `thumbnail` 使用有授权的图片 URL 或 `public` 内图片路径。未配置时显示通用图形。

空 `embed.iframeSrc` 不加载第三方内容，仅提供游戏名称和浏览入口；无数据的列表不显示占位文案。构建会阻止非法 slug、分类、关联链接、未注明来源的游戏资料，以及非官方/非 HTTPS 游戏嵌入。

Sled Rider 正文参考 `https://sledrider.io/` 的玩法资料，按本站实际嵌入重新组织为原创英文；不复制参考站评分、游玩次数或道具价格。`sources` 记录参考链接，`controls` 使用 `{ "action": "…", "input": "…" }` 数组并需填写 `sources.controls`。

`GameGuide` 在首页渲染 Sled Rider 的完整介绍、操作表、玩法和技巧，并显示全部 FAQ；游戏窗口始终位于指南之前，指南及目录无需 JavaScript。Sled Rider 的卡片和导航统一链接到 `/`，`/sled-rider` 仅用于永久跳转，sitemap 不包含旧地址。首页同时输出 WebSite、VideoGame 和 FAQPage 结构化数据，游戏 URL 统一为 `https://sledgames.com/`。

站点分类介绍位于 `src/lib/category-content.mjs`；站点合规说明位于 `src/lib/legal.mjs`。它们描述网站本身，不存储游戏资料。

### Sled Rider 嵌入来源

- Player：`https://gamea.azgame.io/sled-rider/`，HTTP 200，游戏标题 / Unity 产品名为 Sled Rider，开发方为 azgames.io，加载页 canonical 指向 AZGames。
- 该地址通过 `https://sledrider.io/sled-rider.embed` 的实际游戏 iframe 核对；只引用发行方托管的游戏页面，不嵌入聚合站，也不下载或改写游戏资源。
- AZGames 页面公开提供 Embed 功能（例如 `https://azgames.io/slope-rider`）；本站仅启用上面核验过的 Sled Rider 地址。来源核验不能替代对本站的出版商许可记录。
- `sources.embed` 记录游戏源；保留真实浏览器 referrer，允许游戏自身加载完整 SDK、资源及广告。
- Sled Rider 卡片使用游戏加载页自身的 `25111403/loading.png` 封面，与实际游戏的 3D 雪道画面一致；`sources.thumbnail` 记录图片来源，首页及全部游戏列表共用该数据。

## 本轮品类游戏（2026-10-10）

| 品类 | 游戏页 | 官方资料 |
| --- | --- | --- |
| Snowboard Games | `/downhill-snowboard` | [Downhill Snowboard](https://gamemonetize.com/downhill-snowboard-game) |
| Snowboard Games | `/snowboard-game` | [SnowBoard Game](https://gamemonetize.com/snowboard-game-game) |
| Ski Games | `/ski-king` | [Ski King](https://gamemonetize.com/ski-king-game) |
| Ski Games | `/ski-rush` | [Ski Rush](https://gamemonetize.com/ski-rush-game) |

官方 EMBED 地址为 `https://html5.gamemonetize.co/<游戏 ID>/`，封面来自 `img.gamemonetize.com`；完整 SDK、资源、平台品牌及广告保持由平台提供。资料来源记录在每个游戏的 `sources` 中，评分和游玩次数仍为空。

最初选取的四款 GameDistribution 游戏，在使用真实 `https://sledgames.com/<游戏路径>` 参数时均返回 `blocked.html?...unregistered=true`。因此当前目录使用 GameMonetize 版本；保留 GameDistribution 的动态 `gd_sdk_referrer_url` 实现，后续注册并开通域名后再接入其游戏，不使用其他网站的 URL 冒充来源。实测证据保存在 `artifacts/category-games/2026-10-10/`。

[GameMonetize FAQ](https://gamemonetize.com/faq) 说明公开目录的嵌入方式，以及注册后添加网站获得分成的流程；分成资格与本轮游戏加载测试是两个独立事项，当前未开通分成账号。

本地无缓存、无登录的 Chrome 实测已进入四款游戏的游玩画面。平台广告保留，Ski King 在多个菜单步骤播放广告，Ski Rush 首次加载超过 16 秒。核验范围及截图索引见 `artifacts/category-games/2026-10-10/verification-summary.json`；这不代替生产域名、移动端游戏操作、完整死亡重开或广告收益验收。`npm run verify` 的 13 项检查和 10 项页面浏览器测试通过。

## 上线前待补项

- 提供真实、可收信的邮箱，设置 `PUBLIC_CONTACT_EMAIL` 后重新构建。
- 保存发行平台对本站的出版商许可记录。GameMonetize 的收益统计和分成需注册出版商并在后台添加网站；Sled Rider 的 AZGames 嵌入许可仍待完成核实。
- 根据真实来源补齐玩法资料和其他游戏，检查相关游戏数量及分类归属。
- 需求总述写 7 游戏页，路由表实际列出 **8 个游戏**；批量阶段需确认最终范围。当前上线检查以路由表的 8 个为准。
- Sled Rider 已补齐完整指南；本轮四款新游戏均有原创介绍、操作表、4 步玩法、3 条技巧、5 条 FAQ，以及官方游戏封面。
- 申请 AdSense 后再接入获批的广告代码、实际广告位和适用的隐私/同意管理。本阶段只有固定高度占位，不加载广告网络。
- 核验 5 个合规页与真实运营一致，运行性能检查，完成 LCP、实际第三方游戏与广告的 CLS 验收。
- 绑定域名、强制 HTTPS、提交 GSC 和 sitemap。

## 部署

Cloudflare Pages：构建命令 `npm run build`，输出目录 `dist`，设置合适 Node.js 版本及 `PUBLIC_CONTACT_EMAIL`。`public/_headers` 提供静态资源安全响应头，`public/_redirects` 将 `/sled-rider`（含尾斜杠）以 301 跳转到首页，适用于 Cloudflare Pages / Workers 静态资源。`src/pages/sled-rider.astro` 提供本地预览的 HTML 跳转兜底；不要在 `astro.config.mjs` 的 `redirects` 中再次声明同一路径，否则 Cloudflare 自动适配时追加规则会造成重复并拒绝部署。

Vercel：导入仓库，使用 Astro 静态构建；仓库内 `vercel.json` 定义构建输出、无尾斜杠路由与响应头。

确认上线资料齐全后，可将构建命令改为 `npm run build && npm run release:check`。没有自动部署或绑定任何外部账号。

参考：[Astro 静态路由文档](https://docs.astro.build/en/reference/routing-reference/)。
