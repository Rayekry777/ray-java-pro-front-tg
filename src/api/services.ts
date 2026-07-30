import { http } from "./http";
import type {
  ApiResult, AuthorizedStore, Bill, BillKitchenItem, BillQuote, BillServiceMode,
  BillStatus, BusinessData, BusinessMode, Category, CategoryPayload, DiningArea,
  DiningTable, Dish, DishPayload, DineInOrder, DineInOverview, Employee,
  EmployeePayload, EmployeeStoreAssignment, KitchenItem, MerchantSession,
  OperationsLive, Order, OrderOverview, OrderStatistics, PageResult,
  PermissionDefinition, ProductOverview, Session, Setmeal, SetmealPayload,
  ShopBusinessSettings, StoreSwitchResult, TenantRole, WeeklyBusinessSchedule
} from "@/types";

const data = async <T>(request: Promise<{ data: ApiResult<T> }>) => (await request).data.data;
export const authApi = {
  login: (body: { tenantCode: string; username: string; password: string }) => data<Session>(http.post("/admin/employee/login", body)),
  logout: () => data<unknown>(http.post("/admin/employee/logout"))
};
export const sessionApi = {
  current: () => data<MerchantSession>(http.get("/admin/session/me")),
  stores: () => data<AuthorizedStore[]>(http.get("/admin/session/stores")),
  switchStore: (storeId: number) => data<StoreSwitchResult>(http.post("/admin/session/switch-store", { storeId })),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    data<unknown>(http.put("/admin/session/password", body))
};
export const operationsApi = {
  live: () => data<OperationsLive>(http.get("/admin/operations/live"))
};
export const billApi = {
  createDraft: (remark?: string) => data<Bill>(http.post("/admin/bills/drafts", remark ? { remark } : {})),
  replaceItems: (id: number, items: Array<{ dishId?: number; setmealId?: number; quantity: number; remark?: string }>) =>
    data<Bill>(http.put(`/admin/bills/drafts/${id}/items`, { items })),
  quote: (id: number, body: { serviceMode: "DINE_IN" | "TAKEOUT"; tableId?: number; guestCount?: number }) =>
    data<BillQuote>(http.post(`/admin/bills/drafts/${id}/quote`, body)),
  confirm: (id: number, body: { quoteId: string; idempotencyKey: string }) =>
    data<Bill>(http.post(`/admin/bills/drafts/${id}/confirm`, body)),
  page: (query: { page: number; size: number; serviceMode?: BillServiceMode | ""; status?: BillStatus | "" }) => {
    const params: Record<string, unknown> = { page: query.page, size: query.size };
    if (query.serviceMode) params.serviceMode = query.serviceMode;
    if (query.status) params.status = query.status;
    return data<PageResult<Bill>>(http.get("/admin/bills", { params }));
  },
  detail: (id: number) => data<Bill>(http.get(`/admin/bills/${id}`)),
  legacyDetail: (sourceType: string, sourceId: number) =>
    data<Bill>(http.get(`/admin/bills/legacy/${sourceType}/${sourceId}`)),
  checkout: (id: number, body: { amount: number; paymentMethod: string; idempotencyKey: string }) =>
    data<Bill>(http.post(`/admin/bills/${id}/checkout`, body)),
  cancel: (id: number, reason: string) =>
    data<Bill>(http.post(`/admin/bills/${id}/cancel`, { reason })),
  clearTable: (id: number) => data<Bill>(http.post(`/admin/bills/${id}/clear-table`)),
  handover: (id: number) => data<Bill>(http.put(`/admin/bills/${id}/handover`)),
  kitchenItems: (status?: string) =>
    data<BillKitchenItem[]>(http.get("/admin/bills/kitchen/items", { params: status ? { status } : {} })),
  startItem: (billId: number, itemId: number) =>
    data<Bill>(http.put(`/admin/bills/${billId}/items/${itemId}/start`)),
  readyItem: (billId: number, itemId: number) =>
    data<Bill>(http.put(`/admin/bills/${billId}/items/${itemId}/ready`)),
  serveItem: (billId: number, itemId: number) =>
    data<Bill>(http.put(`/admin/bills/${billId}/items/${itemId}/serve`))
};
export const serveTaskApi = {
  list: () => data<KitchenItem[]>(http.get("/admin/serve/tasks")),
  confirm: (id: number) => data<unknown>(http.put(`/admin/serve/tasks/${id}/confirm`))
};
export const rbacApi = {
  permissions: () => data<PermissionDefinition[]>(http.get("/admin/rbac/permissions")),
  roles: () => data<TenantRole[]>(http.get("/admin/rbac/roles")),
  createRole: (body: { roleCode: string; name: string; description?: string; permissions: string[] }) =>
    data<unknown>(http.post("/admin/rbac/roles", body)),
  updateRole: (id: number, body: { roleCode: string; name: string; description?: string; permissions: string[] }) =>
    data<unknown>(http.put(`/admin/rbac/roles/${id}`, body)),
  deleteRole: (id: number) => data<unknown>(http.delete(`/admin/rbac/roles/${id}`)),
  employeeRoles: (employeeId: number) =>
    data<number[]>(http.get(`/admin/rbac/employees/${employeeId}/roles`)),
  assignEmployeeRoles: (employeeId: number, roleIds: number[]) =>
    data<unknown>(http.put(`/admin/rbac/employees/${employeeId}/roles`, { roleIds })),
  employeeStores: (employeeId: number) =>
    data<EmployeeStoreAssignment>(http.get(`/admin/rbac/employees/${employeeId}/stores`)),
  assignEmployeeStores: (employeeId: number, body: EmployeeStoreAssignment) =>
    data<unknown>(http.put(`/admin/rbac/employees/${employeeId}/stores`, body))
};
export const workspaceApi = {
  business: () => data<BusinessData>(http.get("/admin/workspace/businessData")),
  dishes: () => data<ProductOverview>(http.get("/admin/workspace/overviewDishes")),
  setmeals: () => data<ProductOverview>(http.get("/admin/workspace/overviewSetmeals")),
  orders: () => data<OrderOverview>(http.get("/admin/workspace/overviewOrders")),
  shopStatus: () => data<number>(http.get("/admin/shop/status")),
  setShopStatus: (status: number) => data<unknown>(http.put(`/admin/shop/${status}`)),
  shopBusinessSettings: () => data<ShopBusinessSettings>(http.get("/admin/shop/business-settings")),
  setBusinessHours: (weeklySchedule: WeeklyBusinessSchedule) =>
    data<unknown>(http.put("/admin/shop/business-hours", { weeklySchedule })),
  setBusinessMode: (mode: BusinessMode) =>
    data<unknown>(http.put(`/admin/shop/mode/${mode}`))
};
export const orderApi = {
  page: (params: Record<string, unknown>) => data<PageResult<Order>>(http.get("/admin/order/conditionSearch", { params })),
  statistics: async () => {
    const stats = await data<Record<string, number>>(http.get("/admin/order/statistics"));
    return {
      toBeConfirmed: stats.toBeConfirmed || 0,
      preparing: stats.preparing ?? stats.confirmed ?? 0,
      readyForPickup: stats.readyForPickup ?? stats.deliveryInProgress ?? 0
    } satisfies OrderStatistics;
  },
  detail: (id: number) => data<Order>(http.get(`/admin/order/details/${id}`)),
  confirm: (id: number) => data<unknown>(http.put("/admin/order/confirm", { id })),
  reject: (id: number, rejectionReason: string) => data<unknown>(http.put("/admin/order/rejection", { id, rejectionReason })),
  cancel: (id: number, cancelReason: string) => data<unknown>(http.put("/admin/order/cancel", { id, cancelReason })),
  readyForPickup: (id: number) => data<unknown>(http.put(`/admin/order/ready/${id}`)),
  collected: (id: number) => data<unknown>(http.put(`/admin/order/collected/${id}`))
};
export const dineInApi = {
  areas: () => data<DiningArea[]>(http.get("/admin/dine-in/areas")),
  tables: (params: Record<string, unknown> = {}) => data<DiningTable[]>(http.get("/admin/dine-in/tables", { params })),
  openTable: (tableId: number, body: { guestCount: number; waiterId?: number; remark?: string }) => data<{ orderId: number; orderNo: string }>(http.post(`/admin/dine-in/tables/${tableId}/open`, body)),
  orders: (params: Record<string, unknown>) => data<PageResult<DineInOrder>>(http.get("/admin/dine-in/orders", { params })),
  orderDetail: (id: number) => data<DineInOrder>(http.get(`/admin/dine-in/orders/${id}`)),
  addItems: (id: number, body: { items: Array<{ dishId?: number; setmealId?: number; quantity: number; remark?: string }> }) => data<unknown>(http.post(`/admin/dine-in/orders/${id}/items`, body)),
  submitKitchen: (id: number) => data<unknown>(http.post(`/admin/dine-in/orders/${id}/submit-kitchen`)),
  checkoutPreview: (id: number) => data<{ amount: number; discountAmount: number; payableAmount: number }>(http.post(`/admin/dine-in/orders/${id}/checkout-preview`, {})),
  pay: (id: number, body: { paymentMethod: string; payableAmount: number; remark?: string }) => data<unknown>(http.post(`/admin/dine-in/orders/${id}/pay`, body)),
  cancel: (id: number, reason: string) => data<unknown>(http.post(`/admin/dine-in/orders/${id}/cancel`, { reason })),
  clearTable: (id: number) => data<unknown>(http.post(`/admin/dine-in/orders/${id}/clear-table`)),
  kitchenItems: (params: Record<string, unknown> = {}) => data<KitchenItem[]>(http.get("/admin/dine-in/kitchen/items", { params })),
  startItem: (id: number) => data<unknown>(http.put(`/admin/dine-in/kitchen/items/${id}/start`)),
  readyItem: (id: number) => data<unknown>(http.put(`/admin/dine-in/kitchen/items/${id}/ready`)),
  serveItem: (id: number) => data<unknown>(http.put(`/admin/dine-in/kitchen/items/${id}/serve`)),
  overview: () => data<DineInOverview>(http.get("/admin/dine-in/dashboard/overview"))
};
export const resourceApi = {
  dishes: (params: Record<string, unknown>) => data<PageResult<Dish>>(http.get("/admin/dish/page", { params })),
  setmeals: (params: Record<string, unknown>) => data<PageResult<Setmeal>>(http.get("/admin/setmeal/page", { params })),
  categories: (params: Record<string, unknown>) => data<PageResult<Category>>(http.get("/admin/category/page", { params })),
  employees: (params: Record<string, unknown>) => data<PageResult<Employee>>(http.get("/admin/employee/page", { params })),
  dishStatus: (id: number, status: number) => data<unknown>(http.post("/admin/dish/status", { id, status })),
  setmealStatus: (id: number, status: number) => data<unknown>(http.post(`/admin/setmeal/status/${status}`, undefined, { params: { id } })),
  categoryStatus: (id: number, status: number) => data<unknown>(http.post("/admin/category/status", { id, status })),
  employeeStatus: (id: number, _status: number) => data<unknown>(http.post("/admin/employee/status", undefined, { params: { id } })),
  dishDetail: (id: number) => data<Dish>(http.get(`/admin/dish/${id}`)),
  createDish: (body: DishPayload) => data<string>(http.post("/admin/dish", body)),
  updateDish: (body: DishPayload) => data<string>(http.put("/admin/dish", body)),
  deleteDishes: (ids: number[]) => data<string>(http.delete("/admin/dish", { params: { ids: ids.join(",") } })),
  dishesByCategory: (categoryId: number) => data<Dish[]>(http.get("/admin/dish/list", { params: { categoryId } })),
  dishCategories: () => data<Category[]>(http.get("/admin/category/list", { params: { type: 1 } })),
  setmealCategories: () => data<Category[]>(http.get("/admin/category/list", { params: { type: 2 } })),
  setmealDetail: (id: number) => data<Setmeal>(http.get(`/admin/setmeal/${id}`)),
  createSetmeal: (body: SetmealPayload) => data<unknown>(http.post("/admin/setmeal", body)),
  updateSetmeal: (body: SetmealPayload) => data<unknown>(http.put("/admin/setmeal", body)),
  deleteSetmeals: (ids: number[]) => data<unknown>(http.delete("/admin/setmeal", { params: { ids: ids.join(",") } })),
  createCategory: (body: CategoryPayload) => data<string>(http.post("/admin/category", body)),
  updateCategory: (body: CategoryPayload) => data<string>(http.put("/admin/category", body)),
  deleteCategory: (id: number) => data<string>(http.delete("/admin/category", { params: { id } })),
  employeeDetail: (id: number) => data<Employee>(http.get(`/admin/employee/${id}`)),
  createEmployee: (body: EmployeePayload) => data<unknown>(http.post("/admin/employee", body)),
  updateEmployee: (body: EmployeePayload) => data<string>(http.put("/admin/employee", body)),
  editPassword: (body: { empId: number; oldPassword: string; newPassword: string }) =>
    data<string>(http.put("/admin/employee/editPassword", { id: body.empId, oldPassword: body.oldPassword, newPassword: body.newPassword })),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return data<string>(http.post("/admin/common/upload", form, { headers: { "Content-Type": "multipart/form-data" } }));
  }
};
export const reportApi = {
  turnover: (begin: string, end: string) => data<{ dateList: string; turnoverList: string }>(http.get("/admin/report/turnoverStatistics", { params: { begin, end } })),
  users: (begin: string, end: string) => data<{ dateList: string; newUserList: string; totalUserList: string }>(http.get("/admin/report/userStatistics", { params: { begin, end } })),
  orders: (begin: string, end: string) => data<{ dateList: string; orderCountList: string; validOrderCountList: string; totalOrderCount: number; validOrderCount: number; orderCompletionRate: number }>(http.get("/admin/report/ordersStatistics", { params: { begin, end } })),
  top10: (begin: string, end: string) => data<{ nameList: string; numberList: string }>(http.get("/admin/report/top10", { params: { begin, end } })),
  exportFile: async () => (await http.get("/admin/report/export", { responseType: "blob" })).data as Blob
};
