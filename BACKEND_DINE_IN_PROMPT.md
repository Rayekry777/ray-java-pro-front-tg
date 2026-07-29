# 后端改造提示词：堂食与外卖订单分域

请在现有 Java/Spring 餐饮后台中实现堂食订单域。必须保留现有外卖、登录、员工、分类、菜品、套餐、上传和报表接口的兼容性，不得改变已有接口的请求或返回语义。

## 一、统一响应与数据约束

- 所有 JSON 接口继续返回 `{ "code": 1或200, "data": ..., "msg": "..." }`。
- 时间统一返回 `yyyy-MM-dd HH:mm:ss`。
- ID 使用后端现有 ID 类型，前端按 number 接收。
- 菜品基础接口的 `price` 继续沿用现有“分”；堂食订单中的 `amount/discountAmount/payableAmount/item.price/item.amount` 按“元”返回。若后端决定统一单位，必须同步通知前端，不允许同一 DTO 内混用。
- 分页统一返回 `{ "total": number, "records": [] }`。
- 状态值必须使用下文英文枚举，不使用含义不明的数字。
- 所有状态推进、金额计算、权限和重复提交校验必须由后端负责，前端按钮控制不能作为业务校验。

## 二、保留的旧接口

继续兼容：

- `/admin/employee/*`
- `/admin/dish/*`
- `/admin/category/*`
- `/admin/setmeal/*`
- `POST /admin/common/upload`
- `/admin/report/*`
- `/admin/workspace/*`
- `/admin/order/*`（这些接口当前专用于外卖订单）

## 三、堂食枚举

桌台状态：

`AVAILABLE | OCCUPIED | WAIT_CHECKOUT | RESERVED | DISABLED`

堂食订单状态：

`DINING | WAIT_KITCHEN | COOKING | WAIT_CHECKOUT | PAID | COMPLETED | CANCELLED`

订单菜品状态：

`PENDING | COOKING | READY | SERVED | RETURNED | CANCELLED`

支付状态：

`UNPAID | PAID | REFUNDED`

支付方式至少支持：

`CASH | WECHAT | ALIPAY | BANK_CARD | OTHER`

## 四、当前前端已调用的新接口

### 区域与桌台

`GET /admin/dine-in/areas`

返回数组元素：

```json
{ "id": 1, "name": "一楼大厅", "sort": 1 }
```

`GET /admin/dine-in/tables?areaId=&status=&keyword=`

返回数组元素：

```json
{
  "id": 101,
  "areaId": 1,
  "areaName": "一楼大厅",
  "tableNo": "A01",
  "name": "A01桌",
  "capacity": 4,
  "status": "OCCUPIED",
  "currentOrderId": 9001,
  "guestCount": 3,
  "openedAt": "2026-07-26 11:20:00"
}
```

`POST /admin/dine-in/tables/{tableId}/open`

请求：

```json
{ "guestCount": 3, "waiterId": 12, "remark": "有儿童" }
```

返回：

```json
{ "orderId": 9001, "orderNo": "TS202607260001" }
```

开台必须在一个事务内完成“校验桌台空闲、创建堂食订单、将桌台改为 OCCUPIED”，并对重复请求做幂等或冲突处理。

### 堂食订单

`GET /admin/dine-in/orders?page=1&pageSize=10&orderNo=&status=`

`GET /admin/dine-in/orders/{id}`

订单详情/分页记录结构：

```json
{
  "id": 9001,
  "orderNo": "TS202607260001",
  "tableId": 101,
  "tableName": "A01桌",
  "areaName": "一楼大厅",
  "guestCount": 3,
  "status": "DINING",
  "paymentStatus": "UNPAID",
  "amount": 168.00,
  "discountAmount": 8.00,
  "payableAmount": 160.00,
  "openedAt": "2026-07-26 11:20:00",
  "checkoutTime": null,
  "remark": "有儿童",
  "waiterName": "张三",
  "items": []
}
```

`POST /admin/dine-in/orders/{id}/items`

请求：

```json
{
  "items": [
    { "dishId": 10, "quantity": 2, "remark": "少辣" },
    { "setmealId": 20, "quantity": 1, "remark": "" }
  ]
}
```

后台必须从商品数据读取有效价格，不能信任客户端提交价格；校验商品在售、数量大于零，并重新计算订单金额。

订单菜品返回结构：

```json
{
  "id": 7001,
  "dishId": 10,
  "setmealId": null,
  "name": "宫保鸡丁",
  "quantity": 2,
  "price": 48.00,
  "amount": 96.00,
  "status": "PENDING",
  "flavors": "少辣",
  "remark": "",
  "urgeCount": 0
}
```

`POST /admin/dine-in/orders/{id}/submit-kitchen`

仅将当前订单中尚未下厨的 `PENDING` 菜品提交后厨；重复调用不得重复生成菜品。订单状态应按实际菜品状态推进。

`POST /admin/dine-in/orders/{id}/checkout-preview`

当前前端发送空 JSON `{}`，返回：

```json
{ "amount": 168.00, "discountAmount": 8.00, "payableAmount": 160.00 }
```

`POST /admin/dine-in/orders/{id}/pay`

请求：

```json
{ "paymentMethod": "CASH", "payableAmount": 160.00, "remark": "" }
```

后端必须重新核对试算金额，不可信任客户端 `payableAmount`；支付成功后订单进入 `PAID`，桌台进入 `WAIT_CHECKOUT`。

`POST /admin/dine-in/orders/{id}/cancel`

请求：

```json
{ "reason": "顾客离店" }
```

`POST /admin/dine-in/orders/{id}/clear-table`

清台必须在一个事务内校验订单已支付或已取消、将订单改为 `COMPLETED`、将桌台改为 `AVAILABLE`、解除 `currentOrderId` 并记录时间。未支付订单禁止清台。

### 后厨与上菜

`GET /admin/dine-in/kitchen/items?status=&areaId=&tableId=&orderNo=`

返回数组元素是在订单菜品字段上增加：

```json
{
  "orderId": 9001,
  "orderNo": "TS202607260001",
  "tableName": "A01桌",
  "submittedAt": "2026-07-26 11:35:00"
}
```

状态推进接口：

- `PUT /admin/dine-in/kitchen/items/{itemId}/start`：`PENDING -> COOKING`
- `PUT /admin/dine-in/kitchen/items/{itemId}/ready`：`COOKING -> READY`
- `PUT /admin/dine-in/kitchen/items/{itemId}/serve`：`READY -> SERVED`

非法状态转换返回明确业务错误；重复请求应幂等或返回可识别的冲突信息。所有菜品已上菜后，订单可以进入 `WAIT_CHECKOUT`，但不得自动标记支付。

### 堂食工作台

`GET /admin/dine-in/dashboard/overview`

返回：

```json
{
  "totalTables": 30,
  "availableTables": 12,
  "occupiedTables": 15,
  "waitingCheckoutTables": 3,
  "todayOrders": 86,
  "todayTurnover": 12860.00,
  "waitingKitchenItems": 18,
  "readyToServeItems": 6
}
```

前端工作台会将此接口与以下旧接口并行调用，某一渠道失败不会阻塞另一渠道：

- `GET /admin/workspace/businessData`
- `GET /admin/shop/status`
- `GET /admin/order/statistics`

## 五、数据库与事务要求

至少建立或等价实现：

- 堂食区域表
- 桌台表
- 堂食订单表
- 堂食订单菜品表
- 支付/退款记录（可复用现有支付表，但必须区分渠道）
- 状态流转记录或操作日志

必须保证：

- 一个桌台同一时间最多存在一个活动堂食订单。
- 订单号全局唯一，堂食和外卖能够识别渠道。
- 金额使用 `BigDecimal`，禁止使用浮点计算。
- 开台、支付、取消、清台和关键状态流转具备事务。
- 状态更新使用乐观锁、版本号或条件更新防止并发覆盖。
- 列表接口避免 N+1 查询。
- 返回业务错误时提供可直接展示的中文 `msg`。

## 六、暂未接入前端但下一阶段预留

后续再实现退菜、催菜、换台、并台、预订、桌台增删改、优惠、真实支付、退款和分渠道报表。不要为了这些能力修改当前已约定接口的语义。

实现完成后请输出：

1. 新增/修改的数据库迁移。
2. Controller 接口清单。
3. 请求和返回 DTO。
4. 状态机和事务说明。
5. 权限点。
6. 单元测试与集成测试结果。
7. 与上述契约存在的任何差异，禁止静默改字段。
