import { http } from "./http";
import type {
  ApiResult, AuthorizedStore, BusinessData, BusinessMode, Category, CategoryPayload, DiningArea,
  DiningTable, DiningTableCreatePayload, DiningTableUpdatePayload, Dish, DishPayload, Employee,
  EmployeePayload, EmployeeStoreAssignment, MerchantSession,
  FoodOrder, OrderOverview, OrderServiceMode, OrderSummary, PageResult,
  PermissionDefinition, ProductOverview, Session, Setmeal, SetmealPayload,
  ShopBusinessSettings, StoreSwitchResult, TenantRole, WeeklyBusinessSchedule
} from "@/types";

const data = async <T>(request: Promise<{ data: ApiResult<T> }>) => (await request).data.data;
export const authApi = {
  login: (body: { tenantCode: string; username: string; password: string }) => data<Session>(http.post("/merchant/v1/employee/login", body)),
  logout: () => data<unknown>(http.post("/merchant/v1/employee/logout"))
};
export const sessionApi = {
  current: () => data<MerchantSession>(http.get("/merchant/v1/session/me")),
  stores: () => data<AuthorizedStore[]>(http.get("/merchant/v1/session/stores")),
  switchStore: (storeId: number) => data<StoreSwitchResult>(http.post("/merchant/v1/session/switch-store", { storeId })),
  changePassword: (body: { oldPassword: string; newPassword: string }) =>
    data<unknown>(http.put("/merchant/v1/session/password", body))
};
export const orderApi = {
  summary: () => data<OrderSummary>(http.get("/merchant/v1/orders/summary")),
  page: (query: { page: number; size: number; serviceMode?: OrderServiceMode | ""; orderStatus?: string; paymentStatus?: string; keyword?: string }) => {
    const params: Record<string, unknown> = { page: query.page, size: query.size };
    if (query.serviceMode) params.serviceMode = query.serviceMode;
    if (query.orderStatus) params.orderStatus = query.orderStatus;
    if (query.paymentStatus) params.paymentStatus = query.paymentStatus;
    if (query.keyword) params.keyword = query.keyword;
    return data<PageResult<FoodOrder>>(http.get("/merchant/v1/orders", { params }));
  },
  detail: (id: number) => data<FoodOrder>(http.get(`/merchant/v1/orders/${id}`))
};
export const rbacApi = {
  permissions: () => data<PermissionDefinition[]>(http.get("/merchant/v1/rbac/permissions")),
  roles: () => data<TenantRole[]>(http.get("/merchant/v1/rbac/roles")),
  createRole: (body: { roleCode: string; name: string; description?: string; permissions: string[] }) =>
    data<unknown>(http.post("/merchant/v1/rbac/roles", body)),
  updateRole: (id: number, body: { roleCode: string; name: string; description?: string; permissions: string[] }) =>
    data<unknown>(http.put(`/merchant/v1/rbac/roles/${id}`, body)),
  deleteRole: (id: number) => data<unknown>(http.delete(`/merchant/v1/rbac/roles/${id}`)),
  employeeRoles: (employeeId: number) =>
    data<number[]>(http.get(`/merchant/v1/rbac/employees/${employeeId}/roles`)),
  assignEmployeeRoles: (employeeId: number, roleIds: number[]) =>
    data<unknown>(http.put(`/merchant/v1/rbac/employees/${employeeId}/roles`, { roleIds })),
  employeeStores: (employeeId: number) =>
    data<EmployeeStoreAssignment>(http.get(`/merchant/v1/rbac/employees/${employeeId}/stores`)),
  assignEmployeeStores: (employeeId: number, body: EmployeeStoreAssignment) =>
    data<unknown>(http.put(`/merchant/v1/rbac/employees/${employeeId}/stores`, body))
};
export const workspaceApi = {
  business: () => data<BusinessData>(http.get("/merchant/v1/workspace/businessData")),
  dishes: () => data<ProductOverview>(http.get("/merchant/v1/workspace/overviewDishes")),
  setmeals: () => data<ProductOverview>(http.get("/merchant/v1/workspace/overviewSetmeals")),
  orders: () => data<OrderOverview>(http.get("/merchant/v1/workspace/overviewOrders")),
  shopStatus: () => data<number>(http.get("/merchant/v1/shop/status")),
  setShopStatus: (status: number) => data<unknown>(http.put(`/merchant/v1/shop/${status}`)),
  shopBusinessSettings: () => data<ShopBusinessSettings>(http.get("/merchant/v1/shop/business-settings")),
  setBusinessHours: (weeklySchedule: WeeklyBusinessSchedule) =>
    data<unknown>(http.put("/merchant/v1/shop/business-hours", { weeklySchedule })),
  setBusinessMode: (mode: BusinessMode) =>
    data<unknown>(http.put(`/merchant/v1/shop/mode/${mode}`))
};
export const dineInApi = {
  areas: () => data<DiningArea[]>(http.get("/merchant/v1/dine-in/areas")),
  tables: (params: Record<string, unknown> = {}) => data<DiningTable[]>(http.get("/merchant/v1/dine-in/tables", { params })),
  createTable: (body: DiningTableCreatePayload) => data<number>(http.post("/merchant/v1/dine-in/tables", body)),
  updateTable: (id: number, body: DiningTableUpdatePayload) => data<unknown>(http.put(`/merchant/v1/dine-in/tables/${id}`, body)),
  deleteTable: (id: number) => data<unknown>(http.delete(`/merchant/v1/dine-in/tables/${id}`))
};
export const resourceApi = {
  dishes: (params: Record<string, unknown>) => data<PageResult<Dish>>(http.get("/merchant/v1/dish/page", { params })),
  setmeals: (params: Record<string, unknown>) => data<PageResult<Setmeal>>(http.get("/merchant/v1/setmeal/page", { params })),
  categories: (params: Record<string, unknown>) => data<PageResult<Category>>(http.get("/merchant/v1/category/page", { params })),
  employees: (params: Record<string, unknown>) => data<PageResult<Employee>>(http.get("/merchant/v1/employee/page", { params })),
  dishStatus: (id: number, status: number) => data<unknown>(http.post("/merchant/v1/dish/status", { id, status })),
  setmealStatus: (id: number, status: number) => data<unknown>(http.post(`/merchant/v1/setmeal/status/${status}`, undefined, { params: { id } })),
  categoryStatus: (id: number, status: number) => data<unknown>(http.post("/merchant/v1/category/status", { id, status })),
  employeeStatus: (id: number, _status: number) => data<unknown>(http.post("/merchant/v1/employee/status", undefined, { params: { id } })),
  dishDetail: (id: number) => data<Dish>(http.get(`/merchant/v1/dish/${id}`)),
  createDish: (body: DishPayload) => data<string>(http.post("/merchant/v1/dish", body)),
  updateDish: (body: DishPayload) => data<string>(http.put("/merchant/v1/dish", body)),
  deleteDishes: (ids: number[]) => data<string>(http.delete("/merchant/v1/dish", { params: { ids: ids.join(",") } })),
  dishesByCategory: (categoryId: number) => data<Dish[]>(http.get("/merchant/v1/dish/list", { params: { categoryId } })),
  dishCategories: () => data<Category[]>(http.get("/merchant/v1/category/list", { params: { type: 1 } })),
  setmealCategories: () => data<Category[]>(http.get("/merchant/v1/category/list", { params: { type: 2 } })),
  setmealDetail: (id: number) => data<Setmeal>(http.get(`/merchant/v1/setmeal/${id}`)),
  createSetmeal: (body: SetmealPayload) => data<unknown>(http.post("/merchant/v1/setmeal", body)),
  updateSetmeal: (body: SetmealPayload) => data<unknown>(http.put("/merchant/v1/setmeal", body)),
  deleteSetmeals: (ids: number[]) => data<unknown>(http.delete("/merchant/v1/setmeal", { params: { ids: ids.join(",") } })),
  createCategory: (body: CategoryPayload) => data<string>(http.post("/merchant/v1/category", body)),
  updateCategory: (body: CategoryPayload) => data<string>(http.put("/merchant/v1/category", body)),
  deleteCategory: (id: number) => data<string>(http.delete("/merchant/v1/category", { params: { id } })),
  employeeDetail: (id: number) => data<Employee>(http.get(`/merchant/v1/employee/${id}`)),
  createEmployee: (body: EmployeePayload) => data<unknown>(http.post("/merchant/v1/employee", body)),
  updateEmployee: (body: EmployeePayload) => data<string>(http.put("/merchant/v1/employee", body)),
  editPassword: (body: { empId: number; oldPassword: string; newPassword: string }) =>
    data<string>(http.put("/merchant/v1/employee/editPassword", { id: body.empId, oldPassword: body.oldPassword, newPassword: body.newPassword })),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return data<string>(http.post("/merchant/v1/common/upload", form, { headers: { "Content-Type": "multipart/form-data" } }));
  }
};
export const reportApi = {
  turnover: (begin: string, end: string) => data<{ dateList: string; turnoverList: string }>(http.get("/merchant/v1/report/turnoverStatistics", { params: { begin, end } })),
  users: (begin: string, end: string) => data<{ dateList: string; newUserList: string; totalUserList: string }>(http.get("/merchant/v1/report/userStatistics", { params: { begin, end } })),
  orders: (begin: string, end: string) => data<{ dateList: string; orderCountList: string; validOrderCountList: string; totalOrderCount: number; validOrderCount: number; orderCompletionRate: number }>(http.get("/merchant/v1/report/ordersStatistics", { params: { begin, end } })),
  top10: (begin: string, end: string) => data<{ nameList: string; numberList: string }>(http.get("/merchant/v1/report/top10", { params: { begin, end } })),
  exportFile: async () => (await http.get("/merchant/v1/report/export", { responseType: "blob" })).data as Blob
};
