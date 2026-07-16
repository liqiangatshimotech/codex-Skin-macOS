# Codexskin Project Guide

本文档是机器猫 Codex 主题的来源记录、定制过程、架构说明和后续维护约束。后续修改本项目时，应先阅读本文档，再阅读对应源码。

最后整理日期：2026-07-16。

## 1. 项目目标

本项目为 macOS 上的 Codex/ChatGPT 桌面客户端提供一套机器猫风格的本地界面主题，目标是：

- 保留官方侧栏、项目选择、建议入口、任务内容、菜单和输入框的原生交互。
- 使用机器猫经典的蓝、白、红、黄配色，但避免整页高饱和蓝色造成视觉疲劳。
- 首页通过宽幅主题图、顶部品牌栏和轻量装饰形成明确主题感。
- 任务页保持低干扰，保证代码、对话和操作控件的可读性。
- 安装前自动备份官方资源，支持状态检查和恢复原版。
- 能整理成普通用户可双击安装的独立 macOS 文件夹和 ZIP。

本项目不是 OpenAI 官方产品，也不是 Codex 客户端源码的分支。

## 2. 定制来源

### 2.1 用户需求

主题最初来自用户提出的“给 Codex 客户端制作机器猫风格皮肤”。后续设计方向由实际截图反馈逐步确定：

- 第一目标是让主题真正加载到正在使用的客户端，而不是只做静态效果图。
- 初版强蓝色侧栏、散点背景和 CSS 拼出的机器猫头像显得生硬，头像比例也容易变形。
- 用户提供了两张粉色人物定制皮肤作为版式参考，希望机器猫主题同样具有饱满的主视觉、完整的首页层次和更成熟的输入区。
- 用户指出首页内容曾被挤进较小区域，随后又出现过主区域空白，因此最终版本把“不破坏官方布局”放在装饰丰富度之前。

用户提供的参考截图只用于理解信息密度、构图和视觉层次。参考图中的人物、花朵、草莓、蝴蝶结等素材没有复制到本项目，也不随安装包分发。

### 2.2 开源项目参考

主要参考项目：

- 项目名称：`Fei-Away/Codex-Dream-Skin`
- 仓库地址：https://github.com/Fei-Away/Codex-Dream-Skin
- macOS 说明：https://github.com/Fei-Away/Codex-Dream-Skin/blob/main/macos/README.md
- macOS 许可证：https://github.com/Fei-Away/Codex-Dream-Skin/blob/main/macos/LICENSE
- 许可证：MIT License，版权声明为 `Codex Dream Skin Studio contributors`。
- 信息核对日期：2026-07-16。

本项目从该开源项目借鉴的是产品和设计方法：

- 主题应该叠加在原生可交互控件上，而不是用一张整窗截图伪装界面。
- 首页使用宽幅主视觉，任务页使用更安静的背景和半透明内容层。
- 安装包应同时提供安装、验证或状态检查、恢复入口。
- 应优先使用客户端自带的 Node 运行时，降低普通用户的安装门槛。
- 主题和 API Key、Base URL、模型供应商配置必须彼此独立。

当前仓库没有包含该项目的目录、脚本或主题资源副本。`theme/doraemon.css`、`theme/doraemon.js`、`scripts/asar-patcher.mjs` 和发布脚本是本项目针对当前客户端单独实现的。

### 2.3 与参考项目的关键差异

| 项目 | Codex Dream Skin | 当前 Codexskin |
| --- | --- | --- |
| 注入方式 | 本机 `127.0.0.1` CDP 注入 | 修改客户端 `app.asar`，在 `webview/index.html` 注入本地 CSS/JS |
| 官方安装包 | 不修改 `.app`、`app.asar` 和代码签名 | 会修改 `Contents/Resources/app.asar`，因此可能影响代码签名状态 |
| 运行方式 | 启动 Codex 时维持本地注入器 | 安装后资源随客户端加载，不需要常驻注入进程 |
| 主题能力 | 可换图的主题工作室 | 固定的机器猫主题包 |
| 平台 | macOS 和 Windows 均有实现 | 当前仅支持 macOS |
| 恢复方式 | 停止注入并恢复启动状态 | 使用 `app.asar.codexskin.original.bak` 恢复原包 |

这两套方案不能混写成同一种架构。引用参考项目时必须说明它采用 CDP，而本项目采用 ASAR 资源注入。

如果未来直接复制或改造参考项目的代码，必须同时引入并保留其 MIT 版权声明和许可证。MIT 许可证只覆盖其软件代码，不代表机器猫、人物、商标或第三方图片获得授权。

### 2.4 机器猫主视觉素材

当前主视觉文件：`theme/assets/doraemon-hero-v2.png`。

- 尺寸：1994 x 789 像素。
- SHA-256：`4a2609724112dd350149f39b7cd63ff5dcc80d95c9f40dab281af2bde62096d1`。
- 该图片是在本次机器猫主题定制过程中制作的本地主题素材，不来自 `Codex-Dream-Skin` 仓库。
- CSS 通过 `background-size: cover` 使用它，允许响应式裁切，但不能通过独立设置不同比例的宽高来拉伸图片。
- 不再使用多个 CSS 圆形、椭圆和线条拼接机器猫脸，避免眼睛、脸型和五官随容器比例变形。

机器猫及相关形象属于第三方知识产权。本素材及主题仅建议个人、本地、非商业使用；公开发布、售卖、宣传或商业分发前，需要自行确认版权、商标及衍生作品授权。

## 3. 定制过程

### 3.1 建立可注入主题

先将主题拆分为 CSS、运行时 JS 和图片资源，再通过 Node 脚本把这些文件写入客户端 `app.asar` 的 `webview/codexskin/`，同时向 `webview/index.html` 注入独立的 `<link>` 和 `<script>` 标签。这样不需要直接修改官方压缩 JavaScript chunk，也能明确识别和移除主题注入块。

初次安装时界面没有变化，因此验证了实际客户端路径、ASAR 中的页面入口、主题标记和完全退出重启流程。主题只有在按 `Cmd + Q` 退出客户端并重新打开后才会重新加载。

### 3.2 第一版机器猫视觉

第一版采用大面积亮蓝侧栏、点状背景、红黄强调色和 CSS 绘制的头像。它证明注入已生效，但存在以下问题：

- 侧栏蓝色过重，和主内容区割裂。
- 装饰元素较零散，首页主体仍然空。
- CSS 拼出的机器猫脸在不同容器尺寸下被拉长或压扁。
- 输入框和装饰线条过多，影响原生界面的克制感。

### 3.3 参考饱满型定制皮肤重做首页

根据用户提供的粉色定制皮肤和 `Codex-Dream-Skin` 的设计思路，第二阶段增加了：

- 宽幅机器猫主视觉。
- “机器猫 · 时光工作台 / DORAEMON CODE LAB”顶部品牌信息。
- 蓝、红、黄三色细节和铃铛元素。
- 更柔和的浅蓝白侧栏、主区底色和半透明输入框。
- 首页与任务页不同的背景强度。

这一阶段把机器猫图像从 CSS 图形改成固定比例的位图资源，解决了脸部变形问题。

### 3.4 修复首页内容挤压

为追求更饱满的首页，曾对首页标题、建议卡、项目选择器和输入框父容器施加较强的定位、尺寸和 flex 布局覆盖。实际客户端中，这些覆盖与官方响应式布局叠加，导致主要内容被压缩在页面上方，用户截图中红框区域出现明显拥挤。

修复方向是减少固定高度、绝对定位和父级 flex 重排，把主视觉改为主区域伪元素背景，让官方内容继续决定自己的位置和尺寸。

### 3.5 修复主区域空白

进一步修改后，客户端曾出现侧栏正常但主区域完全空白。症状表明基于不稳定 DOM 层级的标记和结构性样式在当前客户端版本中不兼容。

最终采用“安全恢复版”策略：

- 初始安全版 JS 只主动标记侧栏、主区域、导航项、输入框和发送按钮。
- 首页只用于切换主区域主题状态和顶部装饰，不重排建议卡或项目选择器。
- 该安全版本中，`findHero` 和 `markCards` 的识别代码只保留用于排查，暂不启用 Hero 和卡片标记。
- CSS 中相关标题和卡片样式处于休眠状态；没有对应数据标记时不会作用于当前页面。
- 主题图通过主区域 `::before` 绘制，不插入会参与官方布局计算的内容容器。

不要在没有真实客户端回归测试的情况下重新启用这些 DOM 重排能力。

### 3.6 修正首页标题构图

安全版恢复后，官方标题位于主视觉正下方中央，与右侧机器猫没有形成完整构图。后续只重新启用了 `findHeading()`，并采用不改变文档流的视觉位移：

- 给原生标题添加 `data-codexskin-heading-placement="true"`，项目名按钮仍是官方可点击控件。
- 根据主区域尺寸计算标题目标位置，宽屏时放在主视觉左侧。
- 使用 `transform: translate3d(...)` 移动标题，保留原始布局占位，不修改父级 flex、高度或定位。
- 重新计算时先扣除当前位移，始终以未变换坐标为基准，避免每 3 秒在左侧和中央之间跳动。
- 主区域宽度小于 700px 时移除位置标记和自定义位移，自动回到官方居中布局。
- 这一阶段 `findHero()` 和建议卡标记仍保持禁用，避免同时改变多个区域。

### 3.7 填补快速模式下的首页空白

快速模式提示出现时，当前客户端不会显示四张原生建议卡。原先 300px 高的主视觉与底部提示条之间因此形成大块空白。修复没有插入不可点击的假卡片，而是让实验室主视觉按窗口高度延展：

- 高度使用 `min(540px, max(320px, calc(100vh - 300px)))`，在常见桌面高度下充分利用中部空间。
- 继续使用同一张固定比例位图和 `background-size: cover`，只响应式裁切，不拉伸机器猫形象。
- 快速模式状态下，主视觉自然覆盖原空白区；原生建议卡存在时，可叠放在主视觉下部。
- 900px 以下宽度仍使用单独的紧凑高度，避免窄窗口挤压输入区。
- 不移动快速模式提示、输入框或其父级布局，保留官方底部操作逻辑。

### 3.8 填补高窗口中的卡片与输入区间隔

在 1544 x 1092 等高窗口中，原生四张建议卡已经显示，但卡片与固定在底部的输入区之间仍有接近 300px 的空白。检查客户端构建代码后确认：首页把标题/建议卡区域和输入区域放在两个 `grow basis-0` 的 flex 子区中，高度增加时两区会等分剩余空间。

当前修复刻意不覆盖这两个 flex 父容器：

- `markCards(home)` 只给现有原生按钮添加 `data-codexskin-home-card="true"`，不移动或复制按钮。
- 卡片最小高度调整为 176px，图标与文字垂直居中，保留原生点击行为。
- 四个图标使用机器猫蓝、铃铛黄和强调红的圆形底座，卡片底部保留细色条。
- 主区域 `::after` 在主视觉和输入区之间绘制渐隐的实验室网格延续背景，设置 `pointer-events: none`，不拦截任何控件。
- 网格只负责消除大片纯色空白，不增加不可点击的假按钮或功能说明文字。
- 900px 以下宽度仍由已有媒体查询缩短主视觉和卡片，避免和输入区重叠。

`findHero()` 仍保持禁用。后续可以调整原生按钮本身，但不要重排建议卡 portal 或两个 `grow basis-0` 父容器。

### 3.9 参考满版布局收拢输入区

网格解决了纯色空白，但参考皮肤的关键布局关系是“主视觉、建议卡、大输入区连续排列”。为得到相同节奏，当前版本在不修改两个 `grow basis-0` 父容器的前提下，动态收拢输入区：

- 从 `.composer-surface-chrome` 向上查找同时包含 `group/project-selector` 的最小输入区根节点，确保项目栏和输入框作为一整块移动。
- 只有可见原生建议卡不少于三张且窗口高度至少 900px 时启用；快速模式、无卡片状态和矮窗口保持官方位置。
- 读取所有建议卡的实际底边，把输入区根节点定位到卡片下方 18px，最大上移量限制为 240px。
- 输入框最小高度随窗口高度增加 48px 至 140px，在上移后补足底部空间，使页面整体铺满而不是把空白移到最下方。
- 定时重算时先扣除已有位移，以未变换坐标为基准，避免输入区每三秒跳动。
- 该处理只使用 `transform` 和输入框 `min-height`，不改 flex 父级、不复制项目栏，也不拦截任何交互。

静态预览补充了项目栏结构，用于同时验证 1544 x 1092 满版布局和 1024 x 768 紧凑布局。

### 3.10 分发包整理

最终把稳定主题整理到 `release/Doraemon-Codex-Skin-macOS/`，加入：

- 双击安装脚本。
- 双击恢复原版脚本。
- 双击检查状态脚本。
- 自动识别 `/Applications/ChatGPT.app` 和 `/Applications/Codex.app`。
- `CODEX_APP_PATH` 自定义路径支持。
- 客户端自带 Node 优先、系统 Node 备用的运行时查找。
- 写权限不足时通过 `sudo` 请求管理员权限。
- 安装说明、预览和 NOTICE。

发布 ZIP 使用 macOS `ditto` 生成，以保留 `.command` 的可执行权限。

## 4. 当前实现架构

### 4.1 ASAR 安装器

`scripts/asar-patcher.mjs` 只使用 Node 内置模块，不依赖 npm 第三方包。主要流程：

1. 读取并校验 `Contents/Resources/app.asar` 的 ASAR 头。
2. 从 `webview/index.html` 删除旧的 `codexskin:doraemon` 注入块，保证重复安装幂等。
3. 给根 `<html>` 添加 `codexskin-doraemon` class 和 `data-codexskin="doraemon"`。
4. 把 CSS、JS 和主视觉写入 `webview/codexskin/`。
5. 首次安装时创建 `app.asar.codexskin.original.bak`，后续安装不覆盖这份原始备份。
6. 先写入 `.codexskin.tmp`，验证索引和主题资源完整后保留文件权限，再原子替换正式 ASAR。
7. 恢复时优先复制原始备份；没有备份时才尝试移除注入块和主题目录。

支持命令：`install`、`uninstall`、`status`、`validate`。

### 4.2 页面运行时

`theme/doraemon.js` 的职责是找到官方页面中需要主题化的稳定区域并添加数据标记：

- 优先使用 `aside.app-shell-left-panel`、`main.main-surface`、`.composer-surface-chrome` 等已知选择器。
- 已知选择器失效时，才根据位置、尺寸和文本做有限回退识别。
- 首页存在原生建议按钮时，只标记按钮本身用于视觉样式，不改写建议卡 portal 和 flex 父级。
- 使用 `MutationObserver` 处理 React 页面切换，并用 120ms 延迟合并频繁变更。
- 每 3 秒重新确认一次标记，窗口缩放时也会重新计算顶部装饰范围。
- 宽屏首页只对原生标题应用坐标位移；不改变标题父容器，窄屏自动恢复官方位置。
- 高窗口且建议卡可见时，动态标记包含项目栏的输入区根节点，使它紧接卡片并加高输入面板。
- 重复加载时先停止旧 observer、timer 和 resize handler，避免多实例叠加。
- 顶部品牌栏使用独立固定层，设置 `pointer-events: none`，不拦截官方按钮。

### 4.3 视觉样式

`theme/doraemon.css` 的主要层次：

- 根主题变量：蓝、白、红、黄、文字、边框和阴影。
- 侧栏：浅蓝白背景、细边界、蓝色图标和低对比选中态。
- 主区域：首页使用随窗口高度约束的宽幅主题图；任务页使用更低对比的主题图叠层。
- 首页标题：宽屏左对齐到主题图留白区域，保留项目按钮交互；窄屏使用官方布局。
- 建议卡和中段背景：放大原生可点击卡片，并用不接收事件的实验室网格连接主视觉与输入区。
- 顶部装饰：铃铛品牌标识和 `TIME MACHINE READY` 状态。
- 输入区：普通窗口保留官方尺寸；高窗口满版状态下加高面板，并增加边框、轻阴影、顶部三色细线和发送按钮配色。
- 弹层和代码区：只统一边框与阴影，不改变交互或文档流。
- 响应式：在 1120px、900px、760px 下逐步减少装饰，并尊重 `prefers-reduced-motion`。

## 5. 文件结构与所有权

```text
codexskin/
├── AGENTS.md                         # 本文档，项目来源和维护规则
├── README.md                         # 开发目录的简要使用说明
├── package.json                      # 开发命令
├── scripts/
│   └── asar-patcher.mjs              # ASAR 安装、恢复、状态和验证
├── theme/
│   ├── doraemon.css                  # 主题视觉
│   ├── doraemon.js                   # DOM 识别和装饰运行时
│   └── assets/doraemon-hero-v2.png  # 宽幅主视觉
├── preview/
│   └── index.html                    # 静态预览
└── release/
    ├── Doraemon-Codex-Skin-macOS/   # 面向普通用户的完整分发目录
    └── Doraemon-Codex-Skin-macOS-v*.zip
```

根目录的 `scripts/`、`theme/` 和 `preview/` 是开发源文件。`release/Doraemon-Codex-Skin-macOS/` 是由这些源文件同步得到的分发副本。修改主题时先改根目录源文件，验证后再同步到 release；不要只改 release 中的副本。

## 6. 视觉维护约束

- 保持蓝、白为主，红、黄只做强调，避免回到整页高饱和单色。
- 主视觉必须使用固定宽高比的位图，不使用 CSS 椭圆重新拼脸，也不直接拉伸图片。
- 允许 `background-size: cover` 裁切；需要保留机器猫面部和主要道具时，应通过 `background-position` 调整取景。
- 不给不稳定的 React 父容器强行设置 `display`、`position`、固定 `height`、`overflow` 或 flex 排列。
- 不把首页做成一张不可交互的全窗图片，所有官方入口必须仍可点击。
- 装饰层默认 `pointer-events: none`，不能遮挡窗口按钮、菜单、项目选择或输入区。
- 任务页的文字对比度和代码可读性优先于主题图曝光度。
- 修改选择器时必须同时检查中文和英文首页文本回退是否仍合理。

## 7. 开发与验证

开发目录常用命令：

```bash
npm run status
npm run install:skin
npm run validate
npm run uninstall:skin
```

这些 npm 命令默认操作 `/Applications/ChatGPT.app`。测试其他路径时直接运行：

```bash
node scripts/asar-patcher.mjs status --app "/Applications/Codex.app"
node scripts/asar-patcher.mjs install --app "/Applications/Codex.app"
```

静态检查：

```bash
node --check scripts/asar-patcher.mjs
node --check theme/doraemon.js
zsh -n release/Doraemon-Codex-Skin-macOS/*.command
zsh -n release/Doraemon-Codex-Skin-macOS/scripts/launcher-common.zsh
```

真实客户端回归步骤：

1. 使用 `Cmd + Q` 完全退出客户端。
2. 确认原始备份存在或首次安装会创建备份。
3. 安装并运行 `status`，确认输出 `Doraemon skin: installed`。
4. 重新打开客户端，检查首页、任务页、聊天页、项目切换、侧栏滚动、菜单和输入发送。
5. 调整窗口到宽屏、中等宽度和窄屏，确认主视觉只裁切、不拉伸，文字和输入区不重叠。
6. 至少创建或打开一个真实任务，确认主题不是只在首页正常。
7. 测试恢复脚本，确认官方界面能够重新打开。

如果出现主区域空白、内容挤压或无法输入，先恢复原版，不要继续叠加 CSS 修补。

## 8. 同步与打包

验证根目录源文件后，同步到分发目录：

```bash
rsync -a scripts/asar-patcher.mjs release/Doraemon-Codex-Skin-macOS/scripts/asar-patcher.mjs
rsync -a theme/doraemon.css theme/doraemon.js release/Doraemon-Codex-Skin-macOS/theme/
rsync -a theme/assets/doraemon-hero-v2.png release/Doraemon-Codex-Skin-macOS/theme/assets/
rsync -a preview/index.html release/Doraemon-Codex-Skin-macOS/preview/index.html
rsync -a AGENTS.md release/Doraemon-Codex-Skin-macOS/AGENTS.md
```

确认双击入口保留可执行权限：

```bash
chmod +x release/Doraemon-Codex-Skin-macOS/*.command
chmod +x release/Doraemon-Codex-Skin-macOS/scripts/launcher-common.zsh
chmod +x release/Doraemon-Codex-Skin-macOS/scripts/asar-patcher.mjs
```

生成 ZIP 时使用新的版本文件名，不覆盖已经交付的旧包：

```bash
ditto -c -k --sequesterRsrc --keepParent \
  release/Doraemon-Codex-Skin-macOS \
  release/Doraemon-Codex-Skin-macOS-vX.Y.Z.zip
```

发布前检查：

```bash
unzip -t release/Doraemon-Codex-Skin-macOS-vX.Y.Z.zip
zipinfo -l release/Doraemon-Codex-Skin-macOS-vX.Y.Z.zip
shasum -a 256 release/Doraemon-Codex-Skin-macOS-vX.Y.Z.zip
```

`zipinfo -l` 中三个 `.command`、`launcher-common.zsh` 和 `asar-patcher.mjs` 应显示可执行权限。

## 9. 分发与安装口径

给普通用户发送完整 ZIP，不要单独发送 `.command` 文件。接收方应：

1. 解压整个目录。
2. 使用 `Cmd + Q` 完全退出 Codex/ChatGPT。
3. 双击 `安装机器猫主题.command`；如果 Gatekeeper 阻止，右键选择“打开”。
4. 看到 `Doraemon skin: installed` 后重新启动客户端。
5. 客户端升级后主题可能被覆盖，可再次安装。
6. 出现兼容问题时双击 `恢复原版界面.command`。

详细用户说明以 `release/Doraemon-Codex-Skin-macOS/安装说明.md` 为准。

## 10. 安全与合规边界

- 安装器会修改官方客户端资源，这与参考项目的 CDP 方案不同，必须在说明中明确告知用户。
- 不读取、不上传、不修改 API Key、Base URL、账号、模型配置或项目代码。
- 不在安装器中加入网络请求、遥测、静默下载或第三方中转配置。
- 不覆盖已有的原始 ASAR 备份；修改备份策略前必须证明可恢复性。
- 客户端自动更新可能改变 ASAR 格式、入口路径或 DOM 结构，更新后必须重新验证。
- 公开分享时保留非官方声明、修改客户端资源的风险提示和第三方 IP 使用限制。
- 参考项目的 MIT 许可不能替代机器猫相关视觉形象的授权。

## 11. 后续维护规则

- 任何架构、注入方式、素材来源、参考项目或分发流程变化，都要同步更新本文档。
- 视觉改动必须附真实客户端截图，并同时验证首页和至少一个任务页面。
- 调整 Hero 容器、建议卡 portal 或首页两个 `grow basis-0` 父级前，必须先解释为什么不会再次导致挤压或空白页。
- 新主题图片要记录来源、尺寸和 SHA-256；来源不明的图片不能进入发布包。
- 根目录源文件是唯一开发基准，release 目录只作为可分发快照。
- 不删除恢复脚本、状态检查或 NOTICE 来缩小安装包。
- 不把参考项目描述为本项目的直接上游或同一实现；准确用语是“设计和产品方法参考”。
