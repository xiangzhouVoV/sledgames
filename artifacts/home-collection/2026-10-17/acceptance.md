# 首页游戏汇总与当前页导航验收

验收日期：2026-10-17（Asia/Shanghai）。基线为本次修改前的工作区构建，已包含此前尚未提交的 SnowBoard Game 改动。

首页新增 10 款游戏的紧凑汇总区，位于正文指南之后、FAQ 之前。卡片使用同一游戏目录数据，仅包含图片、名称和分类；原有首屏两张卡片保持原文。共享导航仅将当前 URL 对应项改为非交互的 span，其余链接及页脚保持。

## 全部自测结果

| 项目 | 结果 |
| --- | --- |
| 1. 首页 H1 和 head 白名单 | 通过。H1、title、description、canonical、4 个 OG 标签、theme-color、favicon、Google tag、AdSense、JSON-LD 原字节一致；整段 head 仅 CSS 构建文件名变化，无新增 style 标签。 |
| 2. 首页卡片数量 | 通过。main 内 12 张：首屏 2 张、汇总区 10 张。 |
| 3. 各游戏卡片链接 | 通过。Sled Rider 和 Snow Rider 2 各 2 张，其余 8 款各 1 张，顺序、图片 URL 和分类与同一数据源一致。Quick Start 与正文内链不计为卡片。 |
| 4. /games/ 内容区 | 通过。main、H1、游戏卡片、正文及页脚原字节不变；页面源文件未修改。 |
| 5. 首页结构化数据 | 通过。WebSite / ItemList / FAQPage 三段原字节一致，ItemList 保持 Sled Rider、Snow Rider 2 两条。 |
| 6. 375px / 1280px 全页截图 | 通过。首屏位置、尺寸及卡片计算样式与基线完全一致；汇总区分别两列、四列，无横向溢出，全部图片成功加载。 |
| 7. 占位文案 | 通过。21 个构建页面的可见正文均无 coming soon、empty、on the way 等占位文案。 |
| 8. 当前页导航 | 通过。当前项为无 href、tabindex、role、onclick 的 span；其他链接保留原目标与文案；键盘 Tab 跳过当前项；页脚链接全站保持。 |
| 9. CSS 保护 | 通过。所有旧 CSS 规则保留；新卡片规则仅使用 compact 选择器。导航另外只追加当前 span 的等效样式，含移动端及圣诞主题；原 .game-card / .game-grid 规则未修改、覆盖或删除。 |

`src/styles/global.css` 仅为本次新增一行 compact 样式导入，让新样式进入原共享 CSS 构建产物，避免 Astro 在首页 head 中额外内联 style。此前工作区已有的指南间距改动不属于本次提交。

## 自动检查

- Astro 类型检查：0 错误、0 警告、0 提示。
- 构建：21 页成功。
- 当前工作区静态/集成测试：34/34 通过。
- 当前工作区浏览器测试：36/36 通过。
- 与修改前基线的严格对比：184/184 通过。
- 暂存内容独立导出验证：类型检查、21 页构建及 29/29 项测试通过，确认本次提交不依赖此前尚未提交的页面优化。
- URL 集合、sitemap.xml、robots.txt、游戏数据、旧 GameGrid 与 Footer 源文件均保持不变。

复核脚本：`node scripts/verify-home-collection.mjs BASELINE_DIRECTORY REPORT_JSON`。

## 交付文件

- [源码 diff](implementation.diff)
- [375px 全页截图](home-375.png)
- [1280px 全页截图](home-1280.png)
- [逐项基线检查](verification.json)
- [浏览器尺寸、样式和图片检查](browser-verification.json)

共享导航及样式构建产物改变导致全站 HTML 重建属于预期变化；非首页 main 和所有页脚原文不变。本次提交只包含首页汇总、当前页导航及其必要测试/验收资料，不包含此前 SnowBoard Game 页面优化或其他需求文档。
