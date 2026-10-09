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

按需求第 13 节，先跑通 **Sled Rider 单页模板**，待检查确认后批量加入其他游戏。

- 已生成首页、`/sled-rider`、`/games`、两个品类页、五个合规页、404、robots.txt 和 sitemap.xml。
- Header、Footer、官方 iframe 游戏区、广告占位、卡片、FAQ、分类入口复用同一套组件。
- 游戏页按需求顺序排列，无资料的简介、玩法、技巧、价格、评分和次数区块不显示。
- JSON-LD：WebSite / VideoGame / FAQPage。FAQ 数据和可见问答使用同一来源；未配置 iframe 时不声明可免费游玩的 Offer。
- 游戏内链来自 `similar`，页脚自动列出全部游戏；新增条目后无需新增页面文件。
- 未确认 iframe、未启用 AdSense，联系邮箱待配置。分类页暂为空，其他游戏尚未批量加入。

这是可运行的首阶段预览，**尚未达到正式上线验收**。

## UI 与布局

面向英文休闲游戏玩家，参考 [Poki](https://poki.com/en/g/snow-riders) 与 [CrazyGames](https://www.crazygames.com/game/snow-rider-3d) 的分类入口、游戏展示和后续浏览方式。

- 雪白与冰蓝界面，深蓝文字，橙色主按钮；压缩首页介绍，让游戏窗口更早出现。
- 页面顺序遵循需求文档；广告固定占位并保持在游戏区外。
- 游戏卡片优先展示图片、名称、类别和可玩状态；未获授权的截图使用通用雪景插画。
- 桌面四列、手机通常两列、窄屏单列；手机主导航可横向滑动，主要操作目标至少 44px 高。
- FAQ 使用原生折叠交互，保留键盘焦点、跳过导航入口和减少动态效果的偏好支持。

## 数据与内容

`data/games.json` 是游戏内容的唯一数据源，根节点为游戏对象数组。

新增游戏时：

1. 使用唯一 kebab-case `slug`，页面自动生成为 `/{slug}`。
2. `category` 使用 `sledding-games`、`snowboard-games` 或 `ski-games`。Sled Games 分类入口为首页。
3. 使用 140–160 字符英文 `description`；Title 和 H1 使用纯游戏名。
4. 将平台提供的官方 iframe **src 地址**填入 `embed.iframeSrc`，并填写正确 `provider`。不要填写整段 HTML 或复制对手网站地址。
5. `gamedistribution` 允许 `https://html5.gamedistribution.com/…`；`gamemonetize` 允许 `https://html5.gamemonetize.com/…`。如后台提供其他官方域名，核实后扩展允许列表。
6. `{{PAGE_URL}}` 替换为编码后的当前页面 canonical；GameDistribution 的 `gd_sdk_referrer_url` 会自动设置。首页与游戏页分别使用自己的 URL。
7. 填写 `intro`、`howToPlay`、`tips`、`items`、`rating`、`playCount` 前，在对应 `sources` 字段记录真实来源链接。资料没有确认就留空。
8. `rating` 格式为 `{ "value": 4.2, "count": 123 }`（仅结构说明，不能使用示例数字作为实际数据）；`playCount` 为整数或 `null`。
9. `items` 格式为 `{ "name": "…", "price": "…" }` 数组；货币由内容明确写为美式格式，游戏内虚拟货币须保留实际单位。
10. `similar` 填其他现有游戏 slug；正式上线要求 5–8 个。首阶段只有一个游戏，因此留空。
11. 可选 `thumbnail` 使用有授权的图片 URL 或 `public` 内图片路径。未配置时显示通用图形。

空 `embed.iframeSrc` 显示待开放提示，不加载第三方内容。构建会阻止非法 slug、分类、关联链接、未注明来源的游戏资料，以及非官方/非 HTTPS 游戏嵌入。

站点分类介绍位于 `src/lib/category-content.mjs`；站点合规说明位于 `src/lib/legal.mjs`。它们描述网站本身，不存储游戏资料。

## 上线前待补项

- 提供真实、可收信的邮箱，设置 `PUBLIC_CONTACT_EMAIL` 后重新构建。
- 从出版商后台确认游戏授权及官方 embed，回填数据；实测桌面/手机可玩。
- 根据真实来源补齐玩法资料和其他游戏，检查相关游戏数量及分类归属。
- 需求总述写 7 游戏页，路由表实际列出 **8 个游戏**；批量阶段需确认最终范围。当前上线检查以路由表的 8 个为准。
- 首阶段 FAQ 描述当前预览状态；游戏上线后替换为与实际游戏对应的问答。
- 申请 AdSense 后再接入获批的广告代码、实际广告位和适用的隐私/同意管理。本阶段只有固定高度占位，不加载广告网络。
- 核验 5 个合规页与真实运营一致，运行性能检查，完成 LCP、实际第三方游戏与广告的 CLS 验收。
- 绑定域名、强制 HTTPS、提交 GSC 和 sitemap。

## 部署

Cloudflare Pages：构建命令 `npm run build`，输出目录 `dist`，设置合适 Node.js 版本及 `PUBLIC_CONTACT_EMAIL`。`public/_headers` 提供静态资源安全响应头。

Vercel：导入仓库，使用 Astro 静态构建；仓库内 `vercel.json` 定义构建输出、无尾斜杠路由与响应头。

确认上线资料齐全后，可将构建命令改为 `npm run build && npm run release:check`。没有自动部署或绑定任何外部账号。

参考：[Astro 静态路由文档](https://docs.astro.build/en/reference/routing-reference/)。
