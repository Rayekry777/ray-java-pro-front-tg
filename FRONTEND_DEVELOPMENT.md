# Ray 商户端前端开发契约

## 1. 项目基线

- 目标端：Web。
- 工程：`D:\JavaPro\ctjava\ray-java-pro-front-tg`。
- 技术栈：Vue 3.5、TypeScript 5.8、Vite 7、Vue Router 4、Axios、Element Plus 2.10。
- 包管理器：npm，唯一锁文件为 `package-lock.json`。
- 构建输出：`dist/`。
- 环境变量：
  - `VITE_API_BASE`：浏览器请求前缀，默认 `/api`。
  - `VITE_API_TARGET`：本地 Vite 代理目标，当前示例为 `http://localhost:8081`。

## 2. 目录职责

- `src/api/`：统一 HTTP、认证头、错误归一化和业务服务。
- `src/session/`：商户会话、权限、岗位和授权门店的共享状态。
- `src/layouts/`：权限导航、当前门店、账号菜单和响应式应用外壳。
- `src/views/`：路由页面，负责加载、空、错、未授权和业务流程编排。
- `src/components/`：可复用表单、设置和反馈组件。
- `src/styles.css`：从已验收 Pencil 与 HTML 实验室还原的生产设计令牌和响应式规则。

## 3. 设计真源

- 设计契约：`tool/design/design-contract.md` V3。
- Pencil：`tool/design/desigen-web.pen`，方向 A 已验收。
- HTML 实验室：`tool/htmlcssjs/`，16 个路由和动效已验收。
- 忠实度记录：`cache/agent-validation/pencil-html/reports/fidelity-ledger.md`（本地验证缓存，不纳入版本控制）。

## 4. 接口边界

| 能力 | 状态 | 生产策略 |
|---|---|---|
| 商户登录、会话、切店、改密、退出 | 已实现 | 调用真实接口；角色、权限、门店以 `/api/merchant/v1/session/me` 为真源 |
| 营业聚合 | 已实现 | 调用 `/api/merchant/v1/operations/live`，使用刷新式聚合 |
| 统一账单草稿、报价、确认、查询与动作 | 已实现 | 调用真实接口并遵守 `allowedActions` |
| 统一后厨与前厅上菜 | 已实现 | 调用真实接口，后厨不展示金额和顾客隐私 |
| 堂食区域与桌台读取 | 已实现 | 仅调用 `/api/merchant/v1/dine-in/areas` 和 `/api/merchant/v1/dine-in/tables`；开台及后续流程进入统一账单 |
| 商品、员工、权限、营业设置 | 已实现 | 调用真实接口并按动作级权限控制入口 |
| 小程序统一 `PICKUP` 写入 | 开发中 | 商户端不创建；写入完成后直接进入统一账单中心 |
| 报表 | 未知 | 禁用入口，不发送网络请求 |
| 旧独立堂食订单与后厨接口 | 已废弃 | 不再调用 `/api/merchant/v1/dine-in/orders/**`、`/api/merchant/v1/dine-in/kitchen/**` 和 `/api/merchant/v1/dine-in/dashboard/**` |
| 旧自取订单接口 | 已废弃 | 不再调用 `/api/merchant/v1/order/**`，不保留兼容任务页 |
| 历史账单兼容查询 | 已废弃 | 不再调用 `/api/merchant/v1/bills/legacy/**`，账单详情只使用统一账单 ID |

商户接口唯一使用 `/api/merchant/v1/**`。服务层以默认 `VITE_API_BASE=/api` 为公共前缀，请求路径使用 `/merchant/v1/**`，浏览器最终请求完整的版本化地址。

## 5. 页面与路由状态

- `/login`：租户编码、员工账号和密码登录。
- `/`：营业聚合与岗位工作台。
- `/operations`：统一选菜、草稿、履约报价与确认。
- `/bills`、`/bills/:id`：统一账单查询、详情和 `allowedActions`。
- `/serve-tasks`：前厅待上菜任务。
- `/kitchen`：统一账单制作队列。
- `/products/*`：分类、菜品和套餐。
- `/employees`、`/access`：员工资料及角色/门店授权。
- `/store`、`/account`：门店营业设置和本人账号安全。
- `/reports`：接口未知的禁用说明。
- `/forbidden`：无权限状态。

## 6. 权限与状态规则

- 导航、路由和动作按钮均使用会话权限过滤；HTTP 403 仍是最终安全边界。
- 系统岗位：`TENANT_OWNER`、`STORE_MANAGER`、`CASHIER`、`WAITER`、`KITCHEN`。
- 切店成功后替换 JWT、重新加载完整会话并刷新当前门店数据。
- 统一账单按钮同时满足前端权限与服务端 `allowedActions` 才显示。
- 所有写操作必须处理重复提交；报价确认和收款使用独立幂等键。
- 401 清理本地 Token 并回到登录页；403、409 和超时显示可恢复反馈。

## 7. 验证基线

- 类型检查：`npm run typecheck`。
- 正式构建：`npm run build`。
- 运行验证：Vite 生产预览或本地开发服务，覆盖 1440×900、1024×768 和窄屏。
- 重点流程：登录初始化、权限路由、切店、统一开单、账单动作、后厨推进、上菜确认、无权限与网络错误。

## 8. 当前计划

1. 完成旧堂食订单、旧自取订单和历史账单兼容入口清理，并以统一账单作为唯一业务入口。
2. 在可回滚业务数据上验证统一账单收款、取消、清台、交付和幂等冲突处理。
3. 完成路由懒加载和 Element Plus 拆包，消除主 chunk 体积提醒。

## 9. 验证记录

### 2026-07-30

- 已读取并核对当前 Vue 工程、后端 Controller、统一账单 DTO/VO、会话 DTO/VO 和权限目录。
- 生产写入已获用户授权。
- `npm run typecheck`：通过。
- `npm run build`：通过；生成 `dist/`，存在单个主 chunk 超过 500 kB 的性能提醒。
- 本地生产预览：入口、登录、受保护路由回退和静态资源返回 200。
- 真实登录：`default` 租户管理员成功初始化租户负责人、默认门店和通配权限。
- 只读接口联调：会话、门店、营业聚合、账单、后厨、上菜、权限、角色、商品和营业设置均成功。
- 浏览器巡检：主要生产路由可达且无页面级错误；账单空筛选和历史详情兼容问题已修正。
- 生产截图：`cache/agent-validation/pencil-platform/web/production/`（本地验证缓存）。
- 未验证：收款、取消、清台、交付、员工授权和角色维护等写操作；真机不适用，接口以桌面浏览器联调。

### 2026-07-31

- 用户指出生产界面多处未忠实遵循已验收 HTML 实验室；重新对照 `tool/htmlcssjs/`、生产源码和历史截图后确认原忠实度结论过于宽松。
- 共享外壳：侧栏移除生产端新增的分组标题和重复账号表现，恢复实验室品牌、岗位卡、无显式滚动条导航、本班次卡与 232/84/底部导航三级响应式。
- 页面结构：经营总览恢复指标 + 当前任务 + 营业快照；统一营业台恢复实验室商品卡密度和 460px 当前账单；账单、后厨、任务页统一使用实验室标题与工作区结构。
- 管理页面：商品管理恢复卡片和分类列表；员工授权恢复 300px + 主工作区双栏；门店设置补齐模式网格和周营业时间。
- 路由导航新增回到页面顶部的滚动策略，避免跨页面保留旧滚动位置。
- 动效补齐：路由页面使用分层入场，标题/筛选/主工作区错峰上移，指标数字提供弹性反馈，任务提供一次性扫光，商品、后厨卡片和按钮提供悬停与按压反馈。
- 侧栏聚焦态由整块金色背景改为深色半透明聚焦面、短金色导轨和图标高亮；窄屏底部导航使用底部短导轨。
- 所有新增动画遵守 `prefers-reduced-motion`，系统要求减少动态效果时关闭非必要动画和过渡。
- `npm run typecheck`：通过。
- `npm run build`：通过；仍存在单个主 chunk 超过 500 kB 的既有性能提醒。
- 真实会话、响应式、动效与侧栏状态截图：`cache/agent-validation/pencil-platform/web/qa/`（本地验证缓存）。
- 未执行：收款、取消、清台、交付、角色保存、员工授权等业务写操作；本轮仅验证读取、页面结构和响应式表现。

### 2026-08-01

- 项目未上线，删除旧堂食订单、旧自取订单及历史账单兼容入口。
- 堂食、现场外带和自取查询全部收敛到统一账单；后厨与前厅任务直接使用统一账单商品接口。
- 删除一次性后端实施提示词 `BACKEND_DINE_IN_PROMPT.md`；其旧接口约定不再作为当前开发依据，历史内容仍可从 Git 记录追溯。
- `FRONTEND_DEVELOPMENT.md` 继续作为架构、页面、接口边界、验证和计划的唯一长期入口；后续约束变化直接更新本文件，不在项目根目录新增一次性提示词。
- 历史 Agent 验证截图、忠实度报告和可复用 QA 脚本已分别归档到 `cache/agent-validation/` 与 `cache/agent-tools/`；正式 Pencil、设计契约和 HTML 实验室仍保留在 `tool/`。
- `npm run typecheck`：通过。
- `npm run build`：通过；生成 `dist/`，仍存在单个主 JS chunk 超过 500 kB 的既有性能提醒。
- 本轮未执行运行验证和真实接口联调；桌面浏览器、移动端浏览器及真机均未验证。
- 商户请求统一迁移到 `/api/merchant/v1/**`，服务层相对 `VITE_API_BASE=/api` 使用 `/merchant/v1/**`；Axios 地址组合验证结果为 `/api/merchant/v1/session/me`。
- 路径迁移后 `npm run build` 通过（包含类型检查）；仍存在单个主 JS chunk 超过 500 kB 的既有性能提醒，未执行浏览器和真实账号联调。
