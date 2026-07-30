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
| 会话与门店 | V3 契约：会话自描述、授权门店与切店 | 共享账号菜单、门店切换对话框、`account.html` | 已预留 |
| 统一账单动作 | V3 契约：`allowedActions`、收款、取消、清台、交付与历史只读 | `bill-detail.html` | 已预留 |
| 商品与营业设置 | V3 契约：分类、菜品、套餐、营业模式和时段 | `products.html`、`store.html` | 已预留 |
| 接口状态 | V3 Controller 扫描：已实现、开发中、未知 | `api-coverage.html` | 一致 |

## 动效与可访问性

- 页面内容按序入场，时长使用 `--motion-slow`。
- 营业聚合更新时间使用低强度脉冲；任务可触发一次性扫光。
- 菜品卡提供悬停抬升、点击反馈和购物车数字弹性。
- 后厨卡片状态推进使用一次性离场，不持续抢占注意力。
- 右下角提供全局动效开关。
- `prefers-reduced-motion: reduce` 关闭非必要动画和过渡。
- 键盘焦点使用可见轮廓；Esc 可关闭临时反馈。

## 路由与运行验证

- `node tool/htmlcssjs/qa-smoke.cjs`：通过，检查 16 个路由文件、孤立页面、站内链接和共享资源。
- `node --check tool/htmlcssjs/site.js`：通过。
- `node --check tool/htmlcssjs/qa-smoke.cjs`：通过。
- 本地 HTTP：16 个路由均返回 200。
- Edge Headless：1440×900 统一账单详情、1024×768 统一账单详情、1440×900 接口覆盖页均成功生成 V3 截图。
- 浏览器首次使用 4173 端口时命中已存在的另一项目服务；已改用独立端口 48731 重跑，错误截图已被正确结果覆盖。

## 已知边界

- 实验室只使用明确标注的本地演示数据，不连接 API、认证、Cookie 或持久化。
- 商户会话、统一草稿、报价、统一账单、前厅任务、权限目录和员工门店授权均已按当前后端接口预留。
- 小程序统一 `PICKUP` 写入仍在开发中；旧 `/admin/order/**` 只作为历史自取兼容接口展示。
- 报表 Controller 尚无明确路由证据，实验室只提供禁用入口且不发请求。
- 生产 Vue 工程已于本轮写入；Pencil ↔ 生产界面忠实度检查见下节。

## Pencil ↔ 生产 Web

| 对比项 | 设计/实验室证据 | 生产证据 | 结果 |
|---|---|---|---|
| 登录构图与租户识别 | `login.html`、深色品牌叙事 + 登录面板 | `tool/production-login-v3.png`、`LoginView.vue` | 一致 |
| 权限外壳与门店上下文 | 232px 深色侧栏、岗位卡、切店与账号菜单 | `tool/production-overview-v3.png`、`AppLayout.vue` | 一致 |
| 营业聚合 | `operations/live` 刷新式聚合语义 | `DashboardView.vue` 真实调用与更新时间 | 一致 |
| 统一开单 | 先选菜，最后选择堂食或现场外带 | `tool/production-ordering-v3.png`、`UnifiedOrderingView.vue` | 一致 |
| 账单中心 1024 收纳 | 图标侧栏、筛选与统一账单表格 | `tool/production-bills-1024-v3.png` | 一致 |
| 账单动作与历史只读 | `allowedActions`、收款/清台/交付、历史只读 | `tool/production-bill-detail-v3.png`、`BillDetailView.vue` | 一致 |
| 后厨与上菜岗位边界 | 后厨不展示金额和顾客隐私 | `KitchenView.vue`、`ServeTasksView.vue` | 一致 |
| 权限、门店和账号 | 五类岗位、固定权限目录、营业设置、本人改密 | `EmployeeAccessView.vue`、`StoreSettingsView.vue`、`AccountView.vue` | 一致 |

### 生产验证

- `npm run typecheck`：通过。
- `npm run build`：通过，Vite 生成 `dist/`；存在大于 500 kB 的 chunk 性能提醒，无构建失败。
- 生产预览：`/`、`/login`、`/operations` 和静态资源返回 200。
- 浏览器真实登录：默认租户管理员成功初始化 `TENANT_OWNER`、默认门店和通配权限。
- 只读接口联调：会话、授权门店、营业聚合、账单分页、统一后厨、上菜任务、权限目录、角色、菜品、套餐和营业设置均返回成功。
- 浏览器路由巡检：统一营业台、账单、后厨、上菜、自取、商品、员工、权限、门店、账号和报表边界页面均可到达。
- 修正了空账单筛选参数触发 400，以及历史账单误走统一详情接口的问题。

### 生产边界

- 未执行收款、取消、清台、交付、角色保存和员工授权等破坏性或业务状态写入联调。
- 统一账单写流程已按真实 DTO/VO 实现，但需由业务测试账号在可回滚数据上完成端到端验收。
- 报表继续保持禁用且不发请求。
- 当前 Element Plus 全量引入使主 JS chunk 超过 500 kB，建议后续用路由懒加载和按需组件拆包优化。
