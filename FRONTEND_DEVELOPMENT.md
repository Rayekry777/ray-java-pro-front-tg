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
- 忠实度记录：`tool/htmlcssjs/fidelity-ledger.md`。

## 4. 接口边界

| 能力 | 状态 | 生产策略 |
|---|---|---|
| 商户登录、会话、切店、改密、退出 | 已实现 | 调用真实接口；角色、权限、门店以 `/admin/session/me` 为真源 |
| 营业聚合 | 已实现 | 调用 `/admin/operations/live`，使用刷新式聚合 |
| 统一账单草稿、报价、确认、查询与动作 | 已实现 | 调用真实接口并遵守 `allowedActions` |
| 统一后厨与前厅上菜 | 已实现 | 调用真实接口，后厨不展示金额和顾客隐私 |
| 旧自取订单 | 已实现 | 继续使用 `/admin/order/**` 兼容接口并明确标注“历史自取” |
| 商品、员工、权限、营业设置 | 已实现 | 调用真实接口并按动作级权限控制入口 |
| 小程序统一 `PICKUP` 写入 | 开发中 | 商户端不创建，只保留兼容查询和处理入口 |
| 报表 | 未知 | 禁用入口，不发送网络请求 |

接口同时具有 `/api/merchant/v1/**` 别名；当前前端沿用 `/admin/**`，由 `VITE_API_BASE` 和本地代理统一转发。

## 5. 页面与路由状态

- `/login`：租户编码、员工账号和密码登录。
- `/`：营业聚合与岗位工作台。
- `/operations`：统一选菜、草稿、履约报价与确认。
- `/bills`、`/bills/:id`：统一账单查询、详情和 `allowedActions`。
- `/serve-tasks`：前厅待上菜任务。
- `/kitchen`：统一账单制作队列。
- `/pickup/orders`：历史自取兼容任务。
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

1. 已落地商户会话、权限路由和新版应用外壳。
2. 已落地营业聚合、统一开单、账单详情、后厨和上菜。
3. 已落地员工权限、商品、门店和账号安全。
4. 已完成类型检查、构建、运行、只读接口联调和 Pencil ↔ 生产忠实度验证。
5. 后续：在可回滚业务数据上验证统一账单写流程，并进行路由懒加载和 Element Plus 拆包。

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
- 生产截图：`tool/production-login-v3.png`、`production-overview-v3.png`、`production-ordering-v3.png`、`production-bills-1024-v3.png`、`production-bill-detail-v3.png`。
- 未验证：收款、取消、清台、交付、员工授权和角色维护等写操作；真机不适用，接口以桌面浏览器联调。
