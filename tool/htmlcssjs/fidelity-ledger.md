# HTML 实验室忠实度记录

日期：2026-07-30  
设计真源：`tool/design/desigen-web.pen`  
实验室首页：`tool/htmlcssjs/index.html`

## Pencil ↔ HTML

| 对比项 | Pencil 证据 | HTML 证据 | 结果 |
|---|---|---|---|
| 文案与流程 | `XQPuO` 统一营业台要求先选菜、最后选择履约 | `operations.html` → `quote.html` | 一致 |
| 构图 | `XQPuO` 232px 侧栏、菜品区、右侧当前账单 | `wide-operations.png` | 一致 |
| 1024 收纳 | `HSlRM` 图标侧栏、双列菜品、右侧账单 | `narrow-operations.png` | 一致 |
| 字体与色彩 | `WBYwh`：Noto Sans SC、IBM Plex Mono、Navy、Brass、Action | `tokens.css`、`wide-tokens.png` | 一致 |
| 间距与组件 | 4–48 间距、4/8/10 圆角、40/48 控件高度 | `tokens.html`、`site.css` | 一致 |
| 状态与权限 | `Uhqhz`：403、会话过期、409、过期、空、离线 | `states.html` | 一致 |
| 三类账单 | `GUEma`：堂食、外带、自取 | `bills.html` | 一致 |
| 岗位边界 | `nkNVQ` 后厨不显示金额和顾客隐私 | `kitchen.html` | 一致 |

## 动效与可访问性

- 页面内容按序入场，时长使用 `--motion-slow`。
- 实时连接状态使用低强度脉冲；任务可触发一次性扫光。
- 菜品卡提供悬停抬升、点击反馈和购物车数字弹性。
- 后厨卡片状态推进使用一次性离场，不持续抢占注意力。
- 右下角提供全局动效开关。
- `prefers-reduced-motion: reduce` 关闭非必要动画和过渡。
- 键盘焦点使用可见轮廓；Esc 可关闭临时反馈。

## 路由与运行验证

- `node tool/htmlcssjs/qa-smoke.cjs`：通过，检查 11 个路由文件、站内链接和共享资源。
- `node --check tool/htmlcssjs/site.js`：通过。
- `node --check tool/htmlcssjs/qa-smoke.cjs`：通过。
- 本地 HTTP：`operations.html` 返回 200，标题为“统一营业台 · Ray”。
- Edge Headless：1440×900 统一营业台、1024×768 统一营业台、1440×900 令牌页均成功生成截图。
- 浏览器首次使用 4173 端口时命中已存在的另一项目服务；已改用独立端口 48731 重跑，错误截图已被正确结果覆盖。

## 已知边界

- 实验室只使用明确标注的本地演示数据，不连接 API、认证、Cookie 或持久化。
- 当前会话、统一草稿、报价、统一账单、前厅任务、权限目录和员工门店授权接口尚未实现。
- 生产 Vue 工程尚未写入，Pencil ↔ 生产界面忠实度检查必须在生产实施后执行。

