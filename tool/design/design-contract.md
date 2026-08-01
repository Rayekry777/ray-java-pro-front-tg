# Ray 餐厅运营台 Web 改版设计契约 V3

> 本契约锁定岗位权限、页面范围、业务闭环、接口边界和后续视觉验收标准。当前仅完成契约阶段，不代表生产功能已经实现。

```yaml
version: 3
reviewStatus: accepted
platform: web
projectRoot: D:\JavaPro\ctjava\ray-java-pro-front-tg
visualRisk: high
authorization:
  aiAssets: not_applicable
  penCreation: approved
  visualDecision: directionA_accepted
  tokenReview: accepted
  pencilReview: accepted
  labCreation: completed
  labReview: accepted
  productionWrite: approved
tokens:
  variables: 49
  showcaseNode: WBYwh
  themeAxis: none
  reviewStatus: accepted
pencil:
  filePath: D:\JavaPro\ctjava\ray-java-pro-front-tg\tool\design\desigen-web.pen
  tokens: ready
  decision: directionA
  components: ready
  screens:
    login: xBAKY
    managerOverview: rRiau
    unifiedOrdering: XQPuO
    fulfillmentAndQuote: pKJTw
    billCenter: GUEma
    frontServiceAndDelivery: QVDOV
    kitchen: nkNVQ
    employeeAccess: s4F0PC
  states: Uhqhz
  responsive: HSlRM
  status: accepted
lab:
  path: D:\JavaPro\ctjava\ray-java-pro-front-tg\tool\htmlcssjs
  routes: 16
  sharedShell: ready
  tokenPage: preserved
  interactions: ready
  motion: preserved
  fidelity: verified
  reviewStatus: accepted
  status: accepted
implementation:
  productionWriteAllowed: true
  sourceRoot: D:\JavaPro\ctjava\ray-java-pro-front-tg\src
  sessionAndPermissions: implemented
  unifiedOrdering: implemented
  billsAndFulfillment: implemented
  managementPages: implemented
  status: implemented
verification:
  typecheck: passed
  build: passed
  runtime: passed
  integration: read_only_passed
  fidelity: verified
  status: passed
```

## 1. 范围与证据

- 产品或页面：Ray 商户餐厅运营台 Web，覆盖员工登录、岗位工作台、统一开单、堂食、现场外带、自取订单处理、后厨、账单中心、员工与角色、商品和报表。
- 核心任务与目标用户：
  - 租户负责人：查看租户内全部授权门店，管理门店、员工、角色和经营数据。
  - 门店经理：处理被授权门店的全部经营业务，管理普通员工，但不能授予租户负责人或越级提权。
  - 前台/收银员：先完成选菜和购物车，最后选择堂食或现场外带，并处理结账、交付和清台；同时处理小程序自取订单。
  - 服务员：处理开台、点菜、加菜、提交后厨和确认上菜。
  - 后厨：只处理待制作、制作中和制作完成，不接触结账、完整顾客信息和经营报表。
- 本次包含：
  - 统一员工登录和会话初始化。
  - 角色权限驱动的导航、路由、按钮和默认工作台。
  - 当前门店切换与授权门店边界。
  - 运营台“先选菜、最后选择堂食或外带”的统一开单流程。
  - 已确认账单按堂食、外带、自取筛选和处理；账单创建前不按渠道分入口。
  - 微信小程序“先选菜、最后选择堂食或自取”的共同账单边界，但小程序页面由其独立设计契约负责。
  - 前厅服务任务与后厨制作任务分离。
  - 员工账号、角色和门店授权的一体化配置。
  - 403、会话过期、权限变化、数据过期和并发冲突状态。
- 本次不包含：
  - SaaS 平台管理端视觉或功能改造。
  - 美团外卖、饿了么等配送平台接入。
  - 顾客会员、供应链、发票、分账、真实退款和反结账实现。
  - 未经单独批准的生产代码、数据库迁移、Pencil 或 HTML 实验室写入。
- 工程、接口与产品证据：
  - 目标工程为 Vue 3.5、Vite 7、TypeScript 5.8、Element Plus 2.10。
  - 后端已具备商户 JWT、`tenant_id + store_id` 隔离、动作级权限、五类系统岗位、员工角色和门店授权、403 与审计链。
- 所有商户 Controller 仅声明 `/api/merchant/v1/**` 路由；实验室和生产实现统一使用版本化路径。
  - 当前前端只按 Token 判断登录，登录会话不包含角色、权限和门店上下文；侧栏和路由对所有员工固定展示。
  - 后端已提供统一账单草稿、报价、确认、查询、收款、取消、清台、制作、上菜和现场外带交付；旧堂食与 `TAKEAWAY/DELIVERY` 数据通过历史账单只读门面兼容。
  - 当前实验室仍把多项已实现接口标成“尚未实现”，且缺少统一账单详情、账号安全、角色权限目录、门店营业设置、商品管理和历史只读账单的产品空间。
- 参考 UI、截图或 `.pen`：
  - 产品方法参考美团餐饮系统公开的一站式前厅、生产、收银、外带和经营管理思路，不复制其专有界面。
  - `tool/production-dashboard.png` 和 `tool/htmlcssjs/` 仅作为既有工程证据，不是本次改版视觉真源。
  - 当前没有可复用的 `.pen` 文件。
- 必须保持：
  - Ray 品牌名称。
  - Vue 3 + Element Plus 唯一 UI 提供方。
  - 后端权限和数据范围为安全真源，前端隐藏菜单不能代替 HTTP 403。
  - 平台账号、商户员工账号和顾客身份保持独立认证边界。
  - 现有已实现接口在迁移期间保持兼容。
- 可以改变：
  - 全部商户端页面信息架构、侧栏分组、首页、桌台与订单交互、出餐视图和响应式规则。
  - 当前暖白、深色侧栏和橙色强调可在保持品牌识别的前提下重新建立令牌。
- 仍未知：
  - 真实在线支付、退款、反结账、换台、并台、催菜、退菜和预订的最终接口。
  - 正式租户域名或租户编码自动识别策略。
  - 生产环境实时通道最终采用 SSE、WebSocket 或轮询。

### 1.1 账单术语锁

| 账单类型 | 枚举 | 业务定义 | 允许创建端 |
|---|---|---|---|
| 堂食 | `DINE_IN` | 顾客在桌就餐，必须绑定有效桌台 | 运营台、持有有效桌码上下文的小程序 |
| 外带 | `TAKEOUT` | 顾客在门店现场由员工点单并打包带走，不要求顾客账号或预约取餐时间 | 运营台 |
| 自取 | `PICKUP` | 顾客在小程序提前下单，到店凭取餐码领取 | 微信小程序；运营台只处理，不新建 |

- `orderSource` 与 `serviceMode` 是两个独立维度。
- 运营台来源 `MERCHANT_WEB` 只允许创建 `DINE_IN/TAKEOUT`。
- 小程序来源 `WECHAT_MINI` 只允许创建 `DINE_IN/PICKUP`。
- 当前代码中的 `TAKEAWAY` 按历史自取兼容数据处理，目标模型不得继续用它同时表示外带和自取。

## 2. 目标端与接口

- 设备或窗口：桌面浏览器为主，设计基准 1440×900；必须覆盖 1366×768 和 1024×768；768px 以下仅保证安全收纳和可完成关键操作，不作为移动 POS 主目标。
- 输入：鼠标、键盘和触控屏；主要营业动作最小点击目标 40px，危险动作不得只靠颜色区分。
- 导航：同一 Web 应用按权限生成岗位入口；后厨允许进入沉浸式全屏看板，但仍共享会话、门店和错误处理。
- 安全区：固定顶部栏、可收纳侧栏、页面内滚动；结账和订单主操作在常用尺寸下保持可见。
- 唯一 UI 提供方：Vue 3 + Element Plus。

| 能力 | HTTP 方法 + 路径 | 状态 | 设计与网络动作 |
|---|---|---|---|
| 员工登录 | `POST /api/merchant/v1/employee/login` | implemented | 增加租户编码输入；成功后只保存 Token，再初始化会话 |
| 当前会话 | `GET /api/merchant/v1/session/me` | implemented | 返回员工、租户、当前门店、授权门店、角色、权限和建议工作台；应用外壳和岗位入口以此为准 |
| 授权门店 | `GET /api/merchant/v1/session/stores` | implemented | 门店切换器的真实数据源 |
| 切换门店 | `POST /api/merchant/v1/session/switch-store` | implemented | 成功后替换 Token，清空门店级页面缓存并重新初始化 |
| 修改本人密码 | `PUT /api/merchant/v1/session/password` | implemented | 账号安全抽屉；成功后提示重新登录 |
| 退出登录 | `POST /api/merchant/v1/employee/logout` | implemented | 清除服务端会话版本并返回登录页 |
| 角色维护 | `GET/POST /api/merchant/v1/rbac/roles`、`PUT/DELETE /api/merchant/v1/rbac/roles/{id}` | implemented | 系统角色只读，自定义角色按权限目录配置 |
| 权限目录 | `GET /api/merchant/v1/rbac/permissions` | implemented | 角色编辑器只允许从服务端目录选择权限 |
| 员工角色 | `/api/merchant/v1/rbac/employees/{employeeId}/roles` | implemented | 员工编辑流程中的角色步骤 |
| 员工门店授权 | `/api/merchant/v1/rbac/employees/{employeeId}/stores` | implemented | 员工编辑流程中的门店步骤 |
| 员工管理 | `/api/merchant/v1/employee/**` | implemented | 需要与角色和门店配置整合；经理只能管理普通员工 |
| 营业聚合任务 | `GET /api/merchant/v1/operations/live` | implemented | 营业台任务数量、更新时间和聚合状态真源 |
| 创建账单草稿 | `POST /api/merchant/v1/bills/drafts` | implemented | 开始选菜时创建，不提前要求账单类型 |
| 编辑草稿菜品 | `PUT /api/merchant/v1/bills/drafts/{id}/items` | implemented | 统一维护菜品或套餐、数量和备注 |
| 按履约方式报价 | `POST /api/merchant/v1/bills/drafts/{id}/quote` | implemented | 最后选择 `DINE_IN/TAKEOUT` 后报价；堂食填写桌台和人数 |
| 确认账单 | `POST /api/merchant/v1/bills/drafts/{id}/confirm` | implemented | 使用 `quoteId` 和幂等键确认；价格或草稿变化进入 409 状态 |
| 统一账单查询 | `GET /api/merchant/v1/bills`、`GET /api/merchant/v1/bills/{id}` | implemented | 按服务方式和状态筛选；响应包含服务端 `allowedActions` |
| 历史账单详情 | `GET /api/merchant/v1/bills/legacy/{sourceType}/{sourceId}` | implemented | `LEGACY_DINE_IN/LEGACY_PICKUP` 只读详情，无可执行动作 |
| 统一账单收款 | `POST /api/merchant/v1/bills/{id}/checkout` | implemented | 独立支付方式、金额和幂等键；支付与履约状态分开 |
| 统一账单取消 | `POST /api/merchant/v1/bills/{id}/cancel` | implemented | 仅在 `allowedActions` 包含取消时显示，必须填写原因 |
| 统一堂食清台 | `POST /api/merchant/v1/bills/{id}/clear-table` | implemented | 仅已支付且全部上桌的堂食账单可执行 |
| 统一外带交付 | `PUT /api/merchant/v1/bills/{id}/handover` | implemented | 仅已支付且制作完成的 `TAKEOUT` 可交付 |
| 堂食区域与桌台 | `GET /api/merchant/v1/dine-in/areas`、`GET /api/merchant/v1/dine-in/tables` | implemented | 营业台桌台区真实数据 |
| 开台 | `POST /api/merchant/v1/dine-in/tables/{tableId}/open` | implemented | 在当前桌上下文继续点餐，不跳列表页 |
| 堂食订单与明细 | `GET /api/merchant/v1/dine-in/orders`、`GET /api/merchant/v1/dine-in/orders/{id}` | implemented | 活跃订单在营业台处理，分页页只承担历史和异常查询 |
| 加菜与提交后厨 | `POST /api/merchant/v1/dine-in/orders/{id}/items`、`POST /api/merchant/v1/dine-in/orders/{id}/submit-kitchen` | implemented | 后加菜必须持续显示“下厨 N 项”，不能按聚合状态隐藏 |
| 堂食结账与清台 | `POST /api/merchant/v1/dine-in/orders/{id}/checkout-preview`、`pay`、`clear-table` | implemented | 结账前展示未下厨/未上菜警告；支付后显示“待清台” |
| 堂食动作许可 | 订单详情 `allowedActions`、未下厨/未上菜计数 | implemented | 所有主按钮由服务端动作许可和前端权限交集决定 |
| 后厨制作 | `/api/merchant/v1/dine-in/kitchen/items/**` | implemented | 后厨只推进待制作、制作中和制作完成 |
| 统一账单后厨 | `GET /api/merchant/v1/bills/kitchen/items`、`PUT /api/merchant/v1/bills/{billId}/items/{itemId}/start|ready|serve` | implemented | 堂食和现场外带统一制作，堂食完成后进入上菜 |
| 前厅上菜任务 | `GET /api/merchant/v1/serve/tasks`、`PUT /api/merchant/v1/serve/tasks/{id}/confirm` | implemented | 制作完成后由前厅确认上桌 |
| 现有自取订单 | `/api/merchant/v1/order/**` | implemented | 作为历史 `TAKEAWAY` 自取兼容接口；迁移完成前保持可用 |
| 现场外带账单 | 统一账单中的 `serviceMode=TAKEOUT` | implemented | 不占桌台，不要求顾客账号、预约时间或小程序取餐身份 |
| 自取账单处理 | 旧 `/api/merchant/v1/order/**` 与统一账单历史门面 | implemented | 旧 `TAKEAWAY` 按 `PICKUP` 展示；接单、拒单、备妥、取走继续走兼容接口 |
| 三类账单统一后厨任务 | 新堂食和外带走 `/api/merchant/v1/bills/kitchen/**`；旧自取走兼容接口 | developing | 实验室明确双轨来源，不伪造尚未提供的小程序统一账单写接口 |
| 菜品与分类 | `/api/merchant/v1/dish/**`、`/api/merchant/v1/category/**` | implemented | 有权限者真实调用，无权限者不显示入口 |
| 套餐 | `/api/merchant/v1/setmeal/**` | implemented | 与分类、菜品共同归入商品管理 |
| 门店营业设置 | `/api/merchant/v1/shop/status`、`/api/merchant/v1/shop/business-settings`、营业时段与模式更新接口 | implemented | 门店设置页覆盖手动开关、营业模式和周营业时段 |
| 报表 | `/api/merchant/v1/report/**` | unknown | 当前 Controller 扫描未取得路由证据；入口保留为禁用“待接口确认”，不发请求 |

### 2.1 V3 实验室接口预留修订

本轮不改变已接受的 Pencil 方向、令牌、色彩、密度和响应式规则，只修订实验室的信息架构、页面状态和接口标注：

1. 应用外壳增加会话菜单：查看当前员工与岗位、切换授权门店、修改本人密码、退出登录。
2. 经营总览改用 `operations/live` 语义，不再写“实时通道已连接”，明确当前实现为刷新式聚合。
3. 统一开单完整表达 `draft → items → quote → confirm`，报价页展示 `quoteId/version/expiresAt` 和重复确认。
4. 新增统一账单详情工作区，覆盖 `allowedActions`、收款、取消、清台、上菜、外带交付及历史只读来源。
5. 后厨页面区分统一账单制作队列与旧自取兼容任务，避免宣称三类新账单已完全统一写入。
6. 员工权限页补齐固定权限目录、五类系统岗位只读状态、员工角色和门店授权保存。
7. 新增商品管理、门店营业设置和账号安全页面；报表仅保留禁用入口。
8. 新增“接口覆盖”评审页，逐项标注已实现、开发中、未知及对应实验页面，不发起任何网络请求。
9. 更新状态矩阵：401、403、409 报价过期、支付幂等冲突、桌台冲突、最后负责人保护、无授权门店和历史只读。

## 3. 页面、流程与状态

| 页面或区域 | 核心任务 | 入口与出口 | 目标尺寸 | 必需状态 |
|---|---|---|---|---|
| 员工登录 | 识别租户并登录员工账号 | 未登录入口 → 建立会话 → 岗位首页 | 1440/1366/1024 | 默认、校验、提交、错误、账号禁用、租户无效 |
| 会话初始化与应用外壳 | 加载角色、权限和当前门店 | 登录/刷新 → 允许页面或 403 | 全尺寸 | 加载、401、403、门店无授权、切店、会话过期 |
| 负责人/经理经营总览 | 查看门店任务、指标和异常 | 首页 → 营业台/订单/报表 | 1440/1366/1024 | 加载、部分失败、空、数据过期、未授权 |
| 统一营业台 | 进入后直接选菜，不提前选择账单类型 | 首页 → 菜单/购物车 → 履约选择 | 1440/1366/1024 | 加载、空购物车、失效商品、价格变化、离线、选中、并发冲突 |
| 履约与报价确认 | 最后选择堂食或外带并获取最终报价 | 购物车 → 堂食/外带信息 → 报价 → 确认账单 | 1440/1366/1024 | 未选择、堂食桌台冲突、外带打包信息、报价变化、重复确认 |
| 堂食账单工作区 | 处理已确认堂食账单的下厨、上菜、结账和清台 | 账单中心/桌台 → 当前账单 → 保留上下文 | 1440/1366/1024 | 就餐、待下厨、制作中、待上菜、待结账、待清台、预订、停用 |
| 外带账单工作区 | 处理员工现场开立的外带账单 | 账单中心 → 外带详情 → 交付完成 | 1440/1366/1024 | 待下厨、制作中、待交付、已交付、取消、错误 |
| 自取任务工作区 | 处理小程序自取账单 | 当前任务/账单中心 → 自取详情 → 核码取走 | 1440/1366/1024 | 待接单、即将超时、备餐中、待取餐、已取走、拒单、取消、错误 |
| 前厅服务任务 | 确认制作完成的菜品上桌 | 营业台提醒 → 服务任务 → 当前桌 | 1440/1366/1024 | 待上菜、超时、已被他人处理、订单已结账 |
| 后厨出餐中心 | 推进制作状态 | 岗位首页/侧栏 → 制作完成 | 1440/1366/1024 | 待制作、制作中、制作完成、空、过期、冲突、声音关闭 |
| 账单中心 | 查询已确认账单和异常 | 侧栏 → 详情 → 返回筛选结果 | 1440/1366/1024 | 全部/堂食/外带/自取、加载、空、错误、筛选、分页、未授权 |
| 统一账单详情 | 根据 `allowedActions` 完成下一动作 | 账单中心/桌台 → 详情 → 收款/取消/清台/交付 | 1440/1366/1024 | 堂食、外带、历史只读、支付幂等、桌台冲突、动作不可用 |
| 员工管理 | 创建员工并分配岗位和门店 | 侧栏 → 员工表单 → 保存 | 1440/1366/1024 | 基本资料、角色、门店、越权禁用、最后负责人保护 |
| 角色权限 | 查看系统角色和自定义角色 | 侧栏 → 角色详情 → 保存 | 1440/1366/1024 | 权限目录加载、系统角色只读、越权、冲突 |
| 商品管理 | 管理分类、菜品、套餐和起售状态 | 侧栏 → 商品列表/编辑 | 1440/1366/1024 | 加载、空、搜索、停售、关联冲突、无权限 |
| 门店营业设置 | 管理营业状态、模式和周时段 | 会话菜单/侧栏 → 门店设置 | 1440/1366/1024 | 自动、手动营业、手动打烊、跨日时段、保存冲突 |
| 账号安全 | 修改本人密码并退出所有旧会话 | 会话菜单 → 修改密码 → 登录 | 全尺寸 | 当前密码错误、新密码校验、提交、成功退出 |
| 接口覆盖 | 评审页面与当前 Controller 路由的预留关系 | 设计系统/状态矩阵 → 覆盖清单 | 1440/1024 | 已实现、开发中、未知、兼容只读 |
| 报表占位 | 说明接口证据不足 | 侧栏禁用入口 | 全尺寸 | 未知、不可点击、不发请求 |
| 403 无权限 | 明确解释并安全返回 | 路由守卫/HTTP 403 → 岗位首页 | 全尺寸 | 缺少入口权限、动作权限变化、门店权限撤销 |

统一开单主流程：

`登录 → 会话初始化 → 营业台 → 选菜 → 购物车 → 最后选择堂食或外带 → 补充履约信息 → 重新报价 → 确认账单`

堂食后续流程：

`确认堂食账单 → 下厨 → 制作完成 → 前厅确认上菜 → 结账 → 待清台 → 清台`

外带后续流程：

`确认外带账单 → 下厨 → 制作完成 → 待交付 → 确认交付`

自取处理流程：

`小程序确认自取账单 → 运营台待接单 → 接单备餐 → 制作完成 → 待取餐 → 核验取餐码 → 确认取走`

权限主流程：

`租户负责人/经理 → 创建员工 → 选择允许的角色 → 选择授权门店 → 保存 → 员工登录 → 进入岗位工作台`

必须覆盖：加载、空、错、离线、未授权、禁用、重复提交、数据过期、409 并发冲突、选中、悬停、键盘焦点和目标端响应式收纳。

## 4. 设计约束

- 产品世界与类比方向：高峰期餐厅的实时调度台；强调当前任务、下一动作、等待时长和责任岗位。
- 期望气质与识别元素：可信、紧凑、快速、清晰；延续 Ray 深色导航与暖色品牌识别，状态色必须有文字和图标辅助。
- 必须避免：
  - 把经营报表当成营业台首要内容。
  - 在选菜之前要求员工先进入“堂食”或“外带”频道。
  - 把现场外带和小程序自取合并成一个 `TAKEAWAY` 概念。
  - 同一桌业务在桌台、订单和后厨页面之间反复跳转。
  - 只按角色名称在前端硬编码权限。
  - 让后厨看到完整顾客手机号、订单金额、退款和员工管理。
  - 大面积装饰图、低对比灰字、过度圆角、巨大标题和只适合展示稿的留白。
  - 复制美团商标、专有文案或专有页面布局。
- Pencil 可自由判断：桌台密度、右侧工作区宽度、任务卡层级、状态色具体色值、侧栏折叠方式和轻量动效。
- 真实示例内容与文案锁：
  - 门店：Ray 现代中餐厅。
  - 角色：租户负责人、门店经理、前台/收银员、服务员、后厨。
  - 桌台：一楼大厅 A08 桌，4 人桌。
  - 外带：现场流水号 016，打包 2 份。
  - 自取：取餐码 082，预计 12:10 取餐。
  - 核心动作锁：加入购物车、去结算、选择堂食、选择外带、重新报价、确认账单、下厨、制作完成、确认上桌、结账、清台、接单、确认交付、确认取走。
- 令牌与主题类别：品牌、背景、表面、文字、边框、堂食状态、外带状态、制作状态、成功、警告、危险、焦点；字体、字号、行高、间距、圆角、阴影、密度、层级和动效时长。
- 可复用组件及变体：应用外壳、门店切换器、权限导航项、任务计数、桌台卡、订单卡、状态标签、等待计时、当前桌工作区、菜品行、主动作栏、确认对话框、403、空状态和错误重试。
- 响应式与可访问性：
  - 1440/1366 使用侧栏 + 主内容 + 上下文面板。
  - 1024 收窄侧栏和上下文面板，保持主动作可见。
  - 768 以下侧栏抽屉化、上下文面板全屏化，禁止水平压缩至不可操作。
  - 支持键盘焦点、语义标题、ARIA 标签、状态非纯色表达和 `prefers-reduced-motion`。
- 候选方向数量与选择方式：高风险改版在 `.pen` 中提供 2 个结构不同的可编辑方向；用户选择后再完善令牌、组件和完整页面，不授权自动代选。

## 5. AI 素材

无。本次改版不需要 Logo、插画、纹理或产品图；全部界面、图标、状态和组件保持代码及 Pencil 原生可编辑。

## 6. Pencil 与实验室交付

- Token Showcase：独立顶层画布、Pencil Variables、品牌与语义色阶、字体、间距、形状、密度、动效令牌、组件状态和截图证据。
- Pencil：
  - 2 个高风险结构方向。
  - 登录、负责人/经理总览、统一选菜与购物车、最后履约选择、报价确认、堂食账单、外带账单、自取任务、前厅任务、后厨出餐、账单中心、员工角色门店配置、403。
  - 1440、1366、1024 和窄屏关键收纳状态。
  - 角色权限矩阵及系统角色只读状态。
- HTML 实验室：
  - 共享外壳与真实页面链接。
  - 独立令牌页。
  - 登录后岗位切换演示、门店切换、先选菜后选择堂食/外带、报价变化、三类账单筛选、后厨流程、403 和数据过期。
  - 不连接 API、认证或持久化；示例数据必须明确为设计演示。
  - 使用少量可关闭并尊重 reduced-motion 的任务高亮、面板切换和状态推进动效。
- 页面连接：首页可以到达全部授权页面；统一开单在确认前不分频道，确认后的账单中心可按堂食、外带、自取筛选；后厨看板可返回岗位允许的首页；403 只返回可访问页面。
- 验收：Pencil ↔ 实验室、Pencil ↔ 生产 Web 均建立 fidelity ledger，比较文案、构图、字体、色彩、间距、组件、状态、响应式和权限可见性。

## 7. 用户审批

```markdown
- [x] 接受 V3 接口同步设计契约
- [ ] 允许创建或修改 Pencil `.pen`
- [ ] 接受 Pencil 设计令牌与 Token Showcase
- [x] 接受 Pencil 页面、状态与响应式
- [x] 允许生成 HTML 实验室
- [x] 接受 HTML 实验室与动效
- [x] 允许写入生产工程
- [ ] 授权自动选择高风险视觉方向
```

- 用户原话：
  - `ok按你推荐的来，分阶段执行`
  - `逻辑有问题，应该运营台是在最后阶段再选择外带或者堂食，小程序上应该是点单最后选择堂食还是自取，先给方案，账单系统应该是分三个级别堂食，外带，自取`
  - `更新`
  - `ok多加一些华丽的动效`
- 历史授权解释：上述契约修订阶段仅允许修订 V2；后续 Pencil 已完成并验收。
- HTML 实验室授权解释：已批准生成实验室，并要求增加更华丽的动效；已加入页面入场、任务扫光、实时脉冲、数字弹性、卡片反馈和状态推进，同时提供动效开关与 reduced-motion 降级。当前实验室待验收，仍未授权生产写入。
- V3 修订说明：2026-07-30 按当前商户 Controller 重新分类接口状态，新增统一账单详情、会话与账号安全、商品、门店设置、接口覆盖及更完整异常状态；Pencil 视觉方向和令牌保持不变。
- V3 契约审批：用户回复 `ok继续`，已接受接口同步范围；本次不修改 Pencil、令牌、AI 素材或视觉方向。
- V3 实验室授权：用户回复 `批准修改 HTML 实验室`；接口预留修订、页面补齐和验证已完成，当前等待实验室验收。
- V3 实验室验收：用户回复 `接受`；HTML 实验室、响应式状态与动效已验收通过，生产工程仍待单独授权。
- V3 生产工程授权：用户提出 `帮我根据新的设计稿来改我的项目`；已明确授权将验收后的设计写入 Vue Web 生产工程。
- 要求修改：已取消过早渠道入口，改为统一选菜后在最后一步选择履约方式；账单锁定堂食、外带、自取三种类型。
