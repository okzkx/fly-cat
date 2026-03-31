## Long_MarkDownReader Markdown 渲染方案研究

## 目标

研究 `F:/okzkx/ClaudeWorkingSpace/Long_MarkDownReader` 的 Markdown 渲染方案，梳理它如何在桌面端完成：

1. Markdown 文件读取
2. 编辑态渲染
3. 预览态渲染
4. 本地图片与相对路径资源加载
5. 大纲、主题、高亮等附加能力

---

## 一句话结论

这个项目的核心方案是：

`Vue 3 + Tauri + Vditor`

其中：

1. `Vditor` 负责 Markdown 编辑、解析和 HTML 预览。
2. `Tauri` 负责本地文件读写、编码识别、图片字节读取和自定义协议注册。
3. 前端再补一层 DOM 后处理，专门修复 Vditor 在桌面本地文件场景下的图片、目录和主题问题。

它不是“纯 Markdown -> HTML 渲染器”方案，而是“编辑器内核 + 桌面本地资源适配层”方案。

---

## 整体架构

```text
Markdown 文件
    |
    v
Tauri command: read_markdown_file
    |
    v
Vue 页面拿到原始 Markdown 文本
    |
    +--> 编辑页: new Vditor(...)
    |         |
    |         +--> Vditor 解析 Markdown
    |         +--> 生成 wysiwyg / preview DOM
    |         +--> 前端额外修正图片与大纲
    |
    +--> 悬浮预览: Vditor.preview(...)
              |
              +--> 直接把 Markdown 渲染成只读 HTML

本地图片资源
    |
    +--> 前端把相对路径转成绝对路径或自定义协议
    |
    +--> Tauri:
            1. get_image_base64
            2. misty-img:// 自定义协议
```

---

## 主要渲染入口

项目里有三条和 Markdown 渲染直接相关的入口。

### 1. 主编辑页 `LibraryMode`

这是最核心的渲染入口。

特点：

1. 使用 `new Vditor('vditor-lib', ...)` 初始化编辑器。
2. 编辑模式默认走 `wysiwyg`，但支持 `both`、`preview`、`edit-mode` 工具栏切换。
3. 文件切换时调用 `read_markdown_file` 读取文本，然后 `vditor.setValue(content)`。
4. 通过 `preview.transform` 在预览 HTML 生成前改写图片地址。
5. 通过 `fixEditorImages()` 在实际编辑 DOM 渲染后再做一轮图片修正。
6. 通过 `MutationObserver` 扫描标题节点，手工维护目录树。

这说明它的设计重点不是“自定义 Markdown AST 渲染”，而是把 Vditor 当成现成内核，再围绕结果 DOM 做桌面适配。

### 2. 临时编辑页 `TempMode`

这是单文件打开模式，思路和 `LibraryMode` 基本一致，但是更轻量。

特点：

1. 仍然使用 `new Vditor(...)`。
2. 初始化时直接把读取到的文件内容放进 `value`。
3. 依旧使用 `fixEditorImages()` 修复本地图片。
4. 同样通过 `MutationObserver` 从编辑区 DOM 中提取标题形成目录。

可以把它看成 `LibraryMode` 的简化版渲染链路。

### 3. 悬浮预览 `HoverPreview`

这里没有初始化完整编辑器，而是调用静态方法：

`Vditor.preview(previewContent.value, result.content, { mode: 'light' })`

这条链路是标准“Markdown 文本 -> HTML 预览”，适合只读场景。

也说明作者把两类需求分开了：

1. 可编辑场景：`new Vditor(...)`
2. 只读预览场景：`Vditor.preview(...)`

---

## 渲染内核选型

### 为什么是 Vditor

从代码形态看，作者选择 Vditor 的原因大概是：

1. 一个组件同时覆盖编辑、预览、分屏。
2. 自带 Markdown 常见语法支持。
3. 自带代码高亮主题能力。
4. 提供 `preview.transform` 这种插槽，方便在 HTML 输出前改写资源路径。
5. 有现成工具栏，不需要自己实现 Markdown 编辑器。

这套方案明显偏“产品交付效率”，不是偏“渲染内核可控性”。

### 当前使用方式

项目里主要使用的是：

1. `mode: 'wysiwyg'`
2. `preview.theme`
3. `preview.hljs`
4. `preview.transform`
5. `toolbar`
6. `input`
7. `after`

也就是说，它把 Vditor 当作“可配置编辑器”，没有深入修改 Vditor 的解析器本身。

---

## 文件读取与编码处理

这个项目对桌面场景做了一个非常关键的补丁：读取 Markdown 时先做编码识别。

后端命令：

1. `read_markdown_file(path)`
2. 使用 `chardetng::EncodingDetector`
3. 根据探测编码解码为字符串

这意味着它不假设所有 Markdown 都是 UTF-8，对于 Windows 本地知识库来说很实用。

所以它的“渲染方案”其实从读文件那一刻就开始了：

```text
磁盘字节
  -> 编码识别
  -> Unicode 字符串
  -> Vditor 渲染
```

如果这一步做不好，后面渲染再强也会出现乱码。

---

## 图片与本地资源加载方案

这是这套方案最值得研究的地方，也是它区别于普通 Web Markdown 渲染的核心。

### 问题背景

Markdown 在桌面本地文件场景里，经常会遇到这些问题：

1. 图片是相对路径，比如 `./img/a.png`
2. 路径里有中文、空格、特殊字符
3. 跨盘符访问
4. WebView 直接访问本地文件时受协议或安全限制
5. 编辑器内部预览和实际 DOM 加载路径处理不一致

Long_MarkDownReader 的方案不是只靠一种手段，而是双保险。

### 方案 A：预览阶段改写成自定义协议

在 `LibraryMode` 里，`preview.transform(html)` 会遍历生成后的 `<img src="">`，把相对路径改写成：

`misty-img://绝对路径`

处理逻辑大致是：

1. 先根据当前 Markdown 文件路径求出父目录。
2. 把 `./xxx.png` 或 `img/xxx.png` 拼成绝对路径。
3. 把绝对路径塞进 `misty-img://`。

然后 Tauri 在启动时注册：

`register_asynchronous_uri_scheme_protocol("misty-img", ...)`

这个协议处理器会：

1. 解析 `misty-img://...`
2. 解码 URL
3. 读取本地文件字节
4. 按扩展名返回正确 MIME
5. 响应给 WebView

这让“HTML 里引用本地图片”变成了“引用一个 app 内部自定义协议资源”。

### 方案 B：编辑态 DOM 再次替换成 Base64

作者显然发现只靠协议还不够稳，所以又加了一层 `fixEditorImages()`。

这个函数会：

1. 从 `vditor.vditor.wysiwyg.element` 找到所有 `<img>`
2. 读取它们当前的 `src`
3. 如果是相对路径，就转绝对路径
4. 优先调用 Tauri 命令 `get_image_base64(path)`
5. 把图片 `src` 直接替换成 `data:image/...;base64,...`
6. 如果 Base64 失败，再退回自定义协议或 `convertFileSrc`

也就是说，项目实际上有三层图片兜底：

1. `preview.transform` 改写为 `misty-img://`
2. `get_image_base64` 直接内联为 Data URL
3. 失败时再退回 `misty-img://` 或 `convertFileSrc`

这个策略非常桌面应用化，优先考虑“能显示出来”。

### 这套图片方案的优点

1. 能处理相对路径图片。
2. 能处理中文路径和空格路径。
3. 对 WebView 的本地文件限制有较强绕过能力。
4. Base64 方案几乎最稳。
5. 自定义协议方案适合作为统一资源入口。

### 这套图片方案的代价

1. 图片处理逻辑重复，`LibraryMode` 和 `TempMode` 都有一份。
2. 强依赖 Vditor 内部 DOM 结构。
3. Base64 对大图不友好，会增加内存和 DOM 体积。
4. 资源处理发生在“渲染之后”，不是更干净的渲染前资源抽象层。

---

## 目录生成方案

这个项目没有单独解析 Markdown AST 来构造目录，而是直接从渲染后的编辑 DOM 中读标题节点。

做法：

1. 取 `vditor.vditor.wysiwyg.element`
2. `querySelectorAll('h1, h2, h3, h4, h5, h6')`
3. 提取文本、层级、`data-id` 或 `id`
4. 再转换成树结构喂给 `n-tree`

为了保持同步，它还给编辑区挂了 `MutationObserver`，内容变化就重新扫描。

这是一个很“实用主义”的方案。

优点：

1. 实现快。
2. 不需要单独维护 Markdown 解析逻辑。
3. 目录一定和实际渲染结果一致。

缺点：

1. 强依赖编辑器生成的 DOM。
2. 一旦 Vditor 内部结构变化，功能可能失效。
3. 对大文档可能会有额外观察和扫描成本。

---

## 主题与代码高亮

主题处理也是复用 Vditor 自带能力，再通过外层样式覆盖。

### 内核侧

初始化时传入：

1. `theme: dark | classic`
2. `preview.theme.current: dark | light`
3. `preview.hljs.style: github / monokai / dracula / ...`

切换代码高亮时还会调用：

`vditor.setTheme(editorTheme, previewTheme, codeTheme)`

### 外层 UI 侧

应用自身用：

1. `Naive UI`
2. `body[data-theme=...]` CSS 变量
3. `:deep(.vditor-...)` 覆盖样式

例如：

1. 隐藏 Vditor 一些浮动工具层。
2. 控制背景透明。
3. 给 `vditor-reset` 限宽。
4. 让编辑器融入桌面应用外观。

所以它的主题方案是“双层主题”：

1. 编辑器内层由 Vditor 控制
2. 应用外层由 CSS 变量和 Naive UI 控制

---

## 编辑与预览的关系

这个项目不是把“编辑态”和“预览态”彻底分离，而是让 Vditor 一体承担两者。

```text
同一份 Markdown
   |
   +--> Vditor 编辑态 DOM
   |
   +--> Vditor 预览 HTML
   |
   +--> HoverPreview 中的只读预览
```

好处：

1. 功能复用度高。
2. 编辑和预览的 Markdown 语义基本一致。
3. 工具栏切换体验统一。

坏处：

1. 方案被 Vditor 深度绑定。
2. 很多增强只能围绕 Vditor 打补丁。
3. 如果以后想替换编辑器，迁移成本比较高。

---

## 值得借鉴的点

如果是为了给当前仓库研究 Markdown 渲染方案，下面这些点最值得借鉴。

### 1. 先解决本地资源，再谈渲染效果

这个项目最大的经验不是“哪家 Markdown 库更强”，而是：

桌面端 Markdown 的第一难点往往是本地资源和文件编码，不是语法解析本身。

### 2. 预览前改写资源路径

`preview.transform` 这种钩子非常有价值。

它提供了一个统一入口，可以在最终 HTML 落地前对：

1. 图片
2. 链接
3. 附件
4. 特殊块

做二次改写。

### 3. 需要一层“桌面适配层”

不要把浏览器端 Markdown 渲染逻辑直接搬进桌面应用。

桌面环境通常还需要：

1. 文件编码识别
2. 相对路径解析
3. 自定义协议
4. 本地字节读取
5. MIME 兜底

### 4. 只读预览和可编辑渲染可以分开选型

这个项目已经表现出这个趋势：

1. 编辑用 `new Vditor(...)`
2. 预览用 `Vditor.preview(...)`

如果未来要优化，完全可以继续拆：

1. 编辑器继续用 Vditor
2. 只读预览改成更轻的 Markdown 渲染器

---

## 明显短板

### 1. 逻辑重复

`LibraryMode` 和 `TempMode` 都有相似的：

1. 初始化 Vditor
2. 图片修复
3. 目录同步

这说明目前还没有抽成统一渲染适配层。

### 2. DOM 耦合很深

大量代码直接访问：

`vditor.vditor.wysiwyg.element`

这是一种强耦合写法，维护成本偏高。

### 3. 有能力预留但未完整收口

后端存在：

1. `save_image`
2. `export_to_html`

但当前前端里没有看到完整接通链路。工具栏里虽然有 `upload`，却没有看到对应上传配置。

这说明资源上传、导出渲染等能力还停留在半成品状态。

### 4. 图片兜底偏“补丁式”

Base64、协议、`convertFileSrc` 同时存在，能用，但层次感不够统一。

---

## 如果迁移思路到当前项目

如果目的是给当前仓库参考，我建议把它拆成三层来看，而不是原样照搬。

### 第一层：Markdown 渲染内核

决定谁来负责：

1. 只读渲染
2. 语法扩展
3. 代码高亮
4. 表格、任务列表、图片等基础语法

Long_MarkDownReader 的答案是 `Vditor`。

### 第二层：资源解析层

单独处理：

1. 相对路径转绝对路径
2. 本地文件 URL 安全访问
3. 图片 MIME
4. 中文路径与空格路径

这是它真正最有价值的一层。

### 第三层：视图增强层

例如：

1. 大纲
2. 悬浮预览
3. 主题换肤
4. 导出
5. 编辑器模式切换

这些都应该建立在前两层稳定之后。

---

## 适合当前仓库借鉴的最小结论

如果只提炼最核心的经验，可以记成下面这几条：

1. 桌面端 Markdown 渲染不要只关注解析器，必须连同本地资源访问一起设计。
2. 如果需要所见即所得编辑，`Vditor` 这种一体化方案能很快落地。
3. 如果主要是只读展示，`Vditor.preview()` 这种轻量链路更合适。
4. 本地图片推荐至少准备两层兜底：路径改写 + 二进制读取方案。
5. 大纲、主题、代码高亮这些附加能力可以先依赖渲染结果 DOM，后续再考虑抽象。

---

## 后续可以继续研究的点

如果还要继续深入，这几个方向值得再看一轮：

1. Vditor 对表格、任务列表、HTML 混排的兼容边界。
2. `upload` 工具栏为何未接通，是否原本计划用 `save_image`。
3. 大文档下 `MutationObserver + 全量扫描标题` 的性能表现。
4. Base64 图片策略在长文档、多图文档里的内存代价。
5. 如果只需要预览，是否值得换成更轻的 Markdown 渲染器。

---

## 对当前项目的结构影响评估

如果把 `Long_MarkDownReader` 的做法用于当前项目，为现有同步工具新增 Markdown 预览能力，结构破坏总体属于：

`不大到中等`

但这里有一个前提：

1. 目标是“新增只读预览能力”
2. 不是“把当前项目改造成一个 Markdown 编辑器”

如果只是前者，改动面可控；如果接近后者，结构影响会明显上升到中等偏大。

### 为什么不是高破坏

当前项目后端已经具备比较完整的 Markdown 生成管线，不需要为了预览功能重写同步主链路。

现有能力包括：

1. 飞书结构化内容已经被转换成 canonical document
2. canonical document 已经稳定渲染成 Markdown
3. 图片资源已经按相对路径写入本地 `_assets` 或配置目录
4. 渲染失败、图片处理失败、文件写入失败已经有明确阶段分类

这意味着项目最核心的内容生产链路其实已经存在：

```text
Feishu 文档
  -> 结构化 block
  -> canonical document
  -> Markdown 文件
  -> 本地图片资源
```

所以如果只是加“预览”，通常不需要去动：

1. `src-tauri/src/render.rs`
2. `src/services/markdown-renderer.ts`
3. 现有同步任务编排逻辑

### 真正会被动到的地方

如果增加 Markdown 预览，主要会新增或调整下面三层。

### 1. 前端页面壳层

当前项目本质上是一个：

`同步器 + 任务面板`

它现在没有“文档查看器”这个页面角色。

所以新增预览时，大概率要增加其中一种结构：

1. 独立 `PreviewPage`
2. `Drawer` / `Modal` 形式的预览面板
3. 首页右侧预览区

也就是说，变化首先发生在页面编排层，而不是同步内核层。

### 2. Tauri 运行时接口层

当前 Tauri 命令主要围绕：

1. 同步任务
2. 状态查询
3. 目录打开
4. 权限与配置

还没有现成的“查看器接口”，例如：

1. 读取某个已同步 Markdown 文件内容
2. 读取本地图片字节
3. 提供预览专用资源协议

如果采用 `Long_MarkDownReader` 那种本地图片策略，就需要在这层补接口。

### 3. 前端运行时抽象层

当前项目前端有一个很明确的设计：

同一套 UI 同时支持：

1. Tauri 运行时
2. 浏览器模拟运行时

而 Markdown 本地文件预览天然更偏向 Tauri。

这意味着一旦增加本地文件预览，最容易变复杂的不是同步逻辑，而是运行时兼容逻辑：

1. Tauri 下走真实文件读取
2. 浏览器模式要么禁用预览
3. 要么提供 mock/fallback 行为

所以结构扩散风险主要在 `tauriRuntime` 抽象这一层。

---

## 两种接入方式的破坏面对比

### 方案 A：轻量只读预览

这是我更推荐的方向。

做法是：

1. 保持现有同步管线不变
2. 新增一个 viewer 模块
3. 读取本地 `.md` 文件
4. 用轻量 Markdown 渲染器或受控预览组件展示
5. 单独补图片相对路径解析

这种方式的特点：

1. 不改现有同步结果格式
2. 不引入完整编辑器内核
3. 不需要复刻 `Long_MarkDownReader` 的大量 DOM 后处理
4. 更像“新增查看子系统”

对结构的影响：

`低到中`

### 方案 B：接近 Long_MarkDownReader 的 Vditor 集成版

做法是：

1. 前端引入 `Vditor`
2. 新增预览或编辑容器
3. Tauri 补 `read_markdown_file`、图片读取、自定义协议等能力
4. 需要处理本地图片路径、主题、代码高亮
5. 可能还要补目录树、预览模式切换、DOM 修正逻辑

这种方式的特点：

1. 预览效果会更接近桌面 Markdown 编辑器
2. 后续扩展到编辑能力更容易
3. 但会把当前项目从“同步工具”往“文档工具”方向拉

对结构的影响：

`中等偏大`

因为它不只是多一个页面，而是开始引入一整套编辑器内核及其适配层。

---

## 破坏面为什么主要不在同步内核

当前项目后端渲染链路已经足够成熟，预览功能不是“从零构建 Markdown”，而是“消费现有 Markdown 产物”。

所以真正高风险的部分不是：

1. Feishu 内容抓取
2. Markdown 生成
3. 图片落盘

而是：

1. 如何在前端组织预览入口
2. 如何读取本地 Markdown 和图片
3. 如何兼容 Tauri / 浏览器双运行时
4. 是否引入完整编辑器依赖

换句话说，风险更多是：

`产品结构风险 / 前端架构风险`

而不是：

`同步管线风险`

---

## 推荐判断

如果目标只是给当前项目补一个“查看同步结果”的能力，我的建议是：

不要原样照搬 `Long_MarkDownReader`，而是只借它最有价值的两部分：

1. 本地 Markdown 预览思路
2. 本地图片路径与资源访问兜底思路

避免直接照搬的部分：

1. 完整 `Vditor` 编辑器壳
2. 大量依赖内部 DOM 的修补逻辑
3. 面向编辑器的一体化模式切换设计

这样做的结果通常是：

1. 结构破坏更小
2. 新功能边界更清晰
3. 不会把同步工具过早演化成文档编辑器

---

## 最终结论

把 `Long_MarkDownReader` 的思路用于当前项目时：

1. 如果定位为“新增只读 Markdown 预览”，结构破坏不大到中等，整体可控。
2. 如果定位为“引入一套接近编辑器级别的 Vditor 能力”，结构破坏会升到中等偏大。
3. 当前项目最不该动的是同步内核；最适合新增的是独立 viewer 层。
4. 真正需要重点设计的不是 Markdown 生成，而是预览入口、本地文件读取、图片资源解析和双运行时兼容。
