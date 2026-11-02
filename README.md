# Sled Games

[Play at sledgames.com · 访问网站](https://sledgames.com/)

## Build and deploy

Use Node.js 24 (`.nvmrc`), then run `npm ci` and `npm run build`. The static website is generated in `dist/`.

Cloudflare Workers uses `wrangler.jsonc` to publish the static files in `dist/` with a small routing Worker in `worker/index.mjs`. Static pages keep trailing slashes and the custom 404 page. The Worker forwards `/api/*` to the separate `sled-games-server` project through its `COMMENTS_API` service binding. The backend owns the D1 database, migrations, moderation, and private secrets. The production domain `sledgames.com` is attached to the `sledgames` Worker in the account pinned by `wrangler.jsonc`. Follow the [comment deployment steps](docs/comments.md#production-configuration-and-deployment) when releasing either project. The Cloudflare build settings are:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

For local validation without publishing, run `npm run deploy:check`. `npm run deploy` builds and publishes the frontend when a release is authorized; it does not deploy `sled-games-server` or apply its migrations. The ignored `.env.production` supplies `PUBLIC_TURNSTILE_SITE_KEY` for builds on this machine. Set the same public key in the build environment when using CI or another machine; the ignored file is not transferred by Git. Backend secrets must never be added to frontend build settings.

## Game comments

Every game detail page includes an English comment list and submission form at `#comments`. Visitors can use a nickname without an account. The list loads approved comments and owner replies, with pagination and retry states. A successful submission confirms that the comment is awaiting review; it does not add the pending comment to the public list.

The owner reviews comments at [the administrator page](https://sledgames.com/admin/comments/), using the single `admin` account. It supports status/game filters, approval, rejection, replies, and deletion. See [administrator access and operation](docs/admin-comments.md) for credentials, session behavior, and release notes.

Start the sibling `sled-games-server` project on port 8788, then run `npm run dev` here to use the website and same-origin API at `http://127.0.0.1:4321`. `PUBLIC_TURNSTILE_SITE_KEY= npm run dev:worker` serves the built site on port 8787 through the local Worker service binding, overriding the production build key so the local challenge bypass can be used. Only the public `PUBLIC_TURNSTILE_SITE_KEY` belongs in the frontend environment; administrator and verification secrets belong in the backend.

See [Comments: local setup, API, and moderation](docs/comments.md) for configuration and request examples. `npm run verify` checks the static site and API proxy; `npm run test:browser -- tests/browser/comments.spec.ts` checks the comment interface. Run the database-backed tests from `sled-games-server`. These commands do not create Cloudflare resources or publish either project.

Production comments and owner replies are stored in Cloudflare D1 database `sledgames-comments`, whose primary region was reported as WNAM (Western North America) at creation. In the Cloudflare dashboard, open **Storage & databases → D1 → sledgames-comments** to inspect its tables. Local development uses a separate database under the backend's `.wrangler/state` directory.

The contact page uses `sean1998312@gmail.com` by default. Set `PUBLIC_CONTACT_EMAIL` at build time to override the public inbox. Its form prepares an email draft locally; visitors open their email app or copy the draft into webmail to send it. No form backend or mail-service credentials are required.

Waddle Peaks currently uses its [official play page](https://play.benerits.com/en/g/waddle-peaks). Checked on 2026-10-19: its embed wrapper loads, but the actual game's `Content-Security-Policy: frame-ancestors https://play.benerits.com` blocks embedding from sledgames.com or localhost. Keep the official external play option until that policy supports external sites.

## English

Sled Games is a free online gaming website built around snowy slopes, winter sports, and festive sleigh adventures. Play in your browser without installing an app or creating a Sled Games account.

Choose a sledding game on the homepage, or use Play now to open one of the sled games. Each game has a dedicated guide page: [Sled Rider](https://sledgames.com/sled-rider/), [Snow Rider 2](https://sledgames.com/snow-rider-2/), [Gnome Bobsled](https://sledgames.com/gnome-bobsled/), [Sled Line](https://sledgames.com/sled-line/), and [Sleigh O’Balance](https://sledgames.com/sleigh-o-balance/). The first four have embedded players; Sleigh O’Balance links to the author’s official page to play. Browse [All Winter Games](https://sledgames.com/games/) for the complete collection across every category.

### Explore the games

- **[Sled Games](https://sledgames.com/)** — Choose downhill runs in Sled Rider and Snow Rider 2, ice-track time trials in Gnome Bobsled, route drawing in Sled Line, or gift balancing in Sleigh O’Balance.
- **[Snowboard Games](https://sledgames.com/snowboard-games/)** — Compare five board rides: Downhill Snowboard's survival runs, SnowBoard Game's 3D tracks, Snowboard King 2024's avalanche courses, Snowboard Game Party's obstacle racing, and Snowboard Girl's side-scrolling levels.
- **[Ski Games](https://sledgames.com/ski-games/)** — Follow course flags in Ski King, survive downhill runs in Ski Rush, explore Waddle Peaks' penguin events, or race other skiers in Snow Riders. Waddle Peaks starts on skis with snowboards to unlock. Snow Riders adds gems, gear upgrades, and snowy maps. Waddle Peaks opens on its official site; Snow Riders opens on Poki.
- **[Christmas Games](https://sledgames.com/christmas-games/)** — Choose eight festive games: snowball merging in Merge Christmas, gift catching in Santa Collecting Gifts, sleigh flying in Crazy Christmas Fun, tile matching in Xmas Triple Mahjong, block breaking in Xmas Balls, card pairs in Xmas Memory Match, finding differences in Scroll and Spot, or village running in Subway Santa Runner Christmas.

### Enjoy a little winter atmosphere

Bright blue winter scenery and falling snow set the mood for mountain adventures. The Christmas collection brings a warmer feel, with a green woodland backdrop, glowing lights, twinkling stars, a Christmas tree, and gently falling gift boxes.

Each game page includes an introduction, controls, instructions, practical tips, and answers to common questions. You can also discover another game from the same collection when you are ready for a new challenge.

Controls vary by game. Some adventures need a keyboard; Gnome Bobsled offers keyboard or mobile touch controls, and Sled Line supports drawing with a mouse or finger. Sleigh O’Balance uses mouse controls. Check each guide to choose a game that suits your device.

## 中文介绍

Sled Games 是一个以雪地、冬季运动和圣诞雪橇冒险为主题的免费在线游戏网站。无需安装应用，也无需注册 Sled Games 账号，即可在浏览器中游玩。

首页帮助你比较和选择雪橇游戏，也可以通过快速开始进入一款雪橇游戏。每款游戏都有独立的攻略页面：[Sled Rider](https://sledgames.com/sled-rider/)、[Snow Rider 2](https://sledgames.com/snow-rider-2/)、[Gnome Bobsled](https://sledgames.com/gnome-bobsled/)、[Sled Line](https://sledgames.com/sled-line/) 和 [Sleigh O’Balance](https://sledgames.com/sleigh-o-balance/)。前四款使用站内嵌入播放器；Sleigh O’Balance 则通过链接前往作者官方页面游玩。[全部冬季游戏](https://sledgames.com/games/)目录展示所有类别的游戏。

### 探索游戏

- **[雪橇游戏](https://sledgames.com/)** — 在 Sled Rider 和 Snow Rider 2 中挑战下坡滑行，在 Gnome Bobsled 中进行冰槽计时竞速，在 Sled Line 中画出道路，或在 Sleigh O’Balance 中装载礼物、保持配重平衡。
- **[单板滑雪游戏](https://sledgames.com/snowboard-games/)** — 比较五种挑战：Downhill Snowboard 的生存滑行、SnowBoard Game 的 3D 赛道、Snowboard King 2024 的雪崩追逐关卡、Snowboard Game Party 的障碍竞速，以及 Snowboard Girl 的横版关卡。
- **[双板滑雪游戏](https://sledgames.com/ski-games/)** — 在 Ski King 中按照旗标完成赛道，在 Ski Rush 中挑战下坡生存，在 Waddle Peaks 中体验企鹅山地项目，或在 Snow Riders 中与其他滑雪者竞速。Waddle Peaks 初始使用双板，可解锁单板；Snow Riders 提供宝石收集、装备升级和雪地地图解锁。Waddle Peaks 通过官方站试玩入口打开，Snow Riders 前往 Poki 游玩。
- **[圣诞游戏](https://sledgames.com/christmas-games/)** — 八款节日游戏包括 Merge Christmas 的雪球合成、Santa Collecting Gifts 的接礼物挑战、Crazy Christmas Fun 的雪橇飞行、Xmas Triple Mahjong 的三张麻将消除、Xmas Balls 的弹球打礼物块、Xmas Memory Match 的翻牌配对、Scroll and Spot 的滚动找不同，以及 Subway Santa Runner Christmas 的雪地村庄跑酷。

### 感受冬日与圣诞氛围

明亮的冰蓝雪景与飘落的雪花，为山地游戏增添冬日气息。圣诞专区则采用温暖的节日风格，搭配松绿树林、发光灯串、闪烁星星、圣诞树和缓缓下落的礼物盒。

每款游戏都配有介绍、操作说明、玩法步骤、实用技巧和常见问题解答。一轮结束后，还可以从同类游戏中找到下一项挑战。

不同游戏的操作方式有所区别：部分游戏需要键盘，Gnome Bobsled 提供键盘或移动触控操作，Sled Line 支持鼠标或手指画路，Sleigh O’Balance 使用鼠标操作。开始前查看各自的操作说明，选择适合自己设备的游戏即可。
