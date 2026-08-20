# Ray 商户端前端开发契约

> 页面、接口或权限边界变化时，在同一任务内同步本文档。

## 工程基线

- 目标端：Web；Vue 3、TypeScript、Vite、Vue Router、Axios、Element Plus。
- API 公共前缀默认 `/api`，业务服务只写 `/merchant/v1/**`。
- 会话、权限和授权门店以 `/api/merchant/v1/session/me` 为真源。
- 路由、导航和按钮按权限过滤，HTTP 403 是最终安全边界。

## 当前业务边界

- 商户端只查看订单，不创建或修改订单。
- 已取消营业台、后厨、上菜、清台和交付页面及相关动作。
- 订单状态为 `PLACED` / `CANCELLED`，支付状态为 `UNPAID` / `PAID` / `REFUNDED`，两者分别展示。
- “已下单”不等于“已支付”。
- 桌台只展示 `ENABLED` / `DISABLED`，不展示占用人、当前订单、待清台或锁定状态。
- 商户系统岗位统一为租户负责人、门店经理和服务员；服务员编码为 `WAITER`。
- 原 `CASHIER`、`KITCHEN` 不再展示或创建，相关职责合并到服务员。

## 生产路由

| 路由 | 能力 | 权限 |
|---|---|---|
| `/login` | 商户登录 | 公共 |
| `/` | 订单只读概览 | `order:read` |
| `/orders` | 订单筛选与分页 | `order:read` |
| `/orders/:id` | 订单和商品快照详情 | `order:read` |
| `/tables` | 区域及桌台增删改查 | 读 `dining-table:read`，写 `dining-table:manage` |
| `/products/*` | 分类、菜品、套餐 | `product:*` |
| `/employees`、`/access` | 员工和角色授权 | `employee:*` |
| `/store`、`/account` | 营业设置与账号安全 | `shop:manage` / 登录态 |
| `/reports` | 经营指标、趋势图、销量 Top10 和 Excel 导出 | 读 `report:read`，导出 `report:export` |
| `/forbidden` | 无权限反馈 | 公共 |

不存在 `/operations`、`/bills`、`/kitchen`、`/serve-tasks` 生产路由。

## 已接订单接口

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | `/api/merchant/v1/orders` | 分页、订单号、方式、订单状态和支付状态筛选 |
| GET | `/api/merchant/v1/orders/summary` | 订单概览 |
| GET | `/api/merchant/v1/orders/{id}` | 订单与商品快照详情 |

页面不得调用旧 `/merchant/v1/bills/**` 或 `/merchant/v1/operations/live`。

## 经营报表

- 页面调用 `/api/merchant/v1/report/turnoverStatistics`、`ordersStatistics`、`top10`、`userStatistics` 和 `export`。
- 查询参数统一为包含首尾日期的 `begin/end=yyyy-MM-dd`；租户和门店由服务端会话确定，前端不提交隔离字段。
- 默认近 30 天，支持近 7/30/90 天和自定义日期；快捷选中态必须与当前范围同步。
- 菜单和路由需要 `report:read`，导出按钮需要 `report:export`；切店后保留当前路由并重新加载当前门店数据。
- 图表使用按需注册的 ECharts，并在 760px 以下切换为单列，日期控件不得产生页面级横向滚动。

## 桌台规则

- 新建与修改只提交区域、桌号、名称、容量、排序、状态和乐观锁版本。
- 状态只允许启用/停用；同一门店桌号不能重复。
- 有入口码或历史订单引用时，删除由后端返回 409，前端展示原始业务提示。
- 桌台已有订单仍可继续扫码下单，因为每次提交都会形成独立订单。

## 验证基线

- `npm run typecheck`
- `npm run build`
- 人工覆盖登录、切店、订单筛选/详情、桌台 CRUD、无权限、401/403/409 和窄屏布局。

## 2026-08-20 经营报表恢复记录

- 恢复结构化报表类型、日期参数、Excel Blob 导出、ECharts 5 按需图表和当前 Cupertino 页面风格。
- 近 7/30/90 天快捷项由响应式状态控制；点击后选中态同步移动，手动选择日期时取消快捷选中。
- 切店保留 `/reports` 路由并按门店 ID 重建页面；每次加载前清空旧数据，避免跨门店或跨日期残留。
- `npm run typecheck` 与 `npm run build` 已通过；Vite 仍提示现有入口包体积超过 500 kB，不影响构建产物。

## 2026-08-12 重构记录

- 账单中心改为只读订单中心，路由统一到 `/orders`。
- 删除营业开单、后厨制作和上菜任务页面。
- 首页改读订单汇总，不再读履约聚合。
- 桌台状态收敛为启用/停用，移除占用信息和动作。
- 合并收银员、旧服务员和订单查看员，统一为 `WAITER / 服务员`。

## 2026-08-13 UI 优化记录

- 商户端统一为平衡型 Cupertino 极简视觉：保留深海军蓝导航与铜金品牌色，页面画布调整为中性浅灰，收敛边框、阴影与装饰动效。
- 全局样式拆分为令牌、基础控件、应用外壳和页面四层，`src/styles.css` 继续作为唯一入口；清理已下线营业流程遗留样式。
- 顶栏改为轻量毛玻璃层，侧栏移除重复岗位与班次信息；桌面、中屏和窄屏分别使用完整侧栏、图标栏和底部导航。
- 订单、订单详情和桌台在 760px 以下使用卡片布局，避免数据表导致页面级横向滚动；其余管理页同步统一卡片、表单、弹窗和反馈状态。
- 可访问性基线包含可见键盘焦点、关键操作最小点击尺寸、非纯色状态表达和 `prefers-reduced-motion` 降级。
- 验证：`npm run typecheck`、`npm run build` 通过；已用 Chrome 检查 1440×900、1366×768、1024×768 和 390×844，截图保存在忽略目录 `cache/ui-refresh/`。Element Plus 既有大包体积告警仍保留。
