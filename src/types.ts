export interface ApiResult<T> { code: number; data: T; msg?: string }
export interface PageResult<T> { total: number; records: T[] }
export interface Session { id: number; name: string; token: string; userName: string; tenantId: number; storeId: number }
export interface BusinessData { newUsers: number; orderCompletionRate: number; turnover: number; unitPrice: number; validOrderCount: number }
export interface ProductOverview { discontinued: number; sold: number }
export interface OrderOverview { allOrders: number; cancelledOrders: number; completedOrders: number; deliveredOrders: number; waitingOrders: number }
export interface DishFlavor { id?: number; dishId?: number; name: string; value: string }
export interface Dish { id: number; name: string; categoryId: number; categoryName: string; price: number; image: string; description: string; status: number; updateTime: string; flavors?: DishFlavor[] }
export interface DishPayload { id?: number; name: string; categoryId: number; price: number; image: string; description: string; status: number; flavors: DishFlavor[] }
export interface SetmealDish { id?: number; setmealId?: number; dishId: number; name: string; price: number; copies: number }
export interface Setmeal extends Dish { setmealDishes?: SetmealDish[] }
export interface SetmealPayload { id?: number; categoryId: number; name: string; price: number; status: number; description: string; image: string; setmealDishes: SetmealDish[] }
export interface Category { id: number; name: string; type: number; sort: number; status: number; updateTime?: string }
export interface Employee { id: number; username: string; name: string; phone: string; sex: string; idNumber: string; status: number; updateTime: string }
export interface CategoryPayload { id?: number; name: string; type: number; sort: number }
export interface EmployeePayload { id?: number; username: string; name: string; phone: string; sex: string; idNumber: string }
export type TableStatus = "ENABLED" | "DISABLED";
export interface DiningArea { id: number; name: string; sort: number }
export interface DiningTable { id: number; areaId: number; areaName: string; tableNo: string; name: string; capacity: number; sort: number; status: TableStatus; version: number }
export interface DiningTableCreatePayload { areaId: number; tableNo: string; name: string; capacity: number; sort: number; status: TableStatus }
export interface DiningTableUpdatePayload extends DiningTableCreatePayload { version: number }
export type BusinessMode = "AUTO" | "MANUAL_OPEN" | "MANUAL_CLOSED";
export type BusinessDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export interface BusinessTimeSlot { start: string; end: string }
export type WeeklyBusinessSchedule = Record<BusinessDay, BusinessTimeSlot[]>;
export interface ShopBusinessSettings {
  mode: BusinessMode;
  effectiveStatus: number;
  weeklySchedule: WeeklyBusinessSchedule;
  currentPeriod?: BusinessTimeSlot | null;
  nextChangeTime?: string | null;
  updatedAt?: string | null;
  updatedBy?: number | null;
}

export interface MerchantEmployeeSession { id: number; username: string; name: string }
export interface MerchantTenantSession {
  id: number;
  tenantCode: string;
  name: string;
  status: string;
  expireTime?: string | null;
}
export interface AuthorizedStore {
  id: number;
  storeCode: string;
  name: string;
  timezone: string;
  defaultStore: boolean;
}
export interface MerchantSession {
  employee: MerchantEmployeeSession;
  tenant: MerchantTenantSession;
  activeStore: AuthorizedStore;
  authorizedStores: AuthorizedStore[];
  roles: string[];
  permissions: string[];
  suggestedWorkspace: "ORDERS" | "OVERVIEW";
}
export interface StoreSwitchResult { storeId: number; token: string }
export interface OrderSummary {
  todayOrders: number;
  dineInOrders: number;
  pickupOrders: number;
  unpaidOrders: number;
  paidAmount: number;
  updatedAt: string;
  version: number;
}
export type OrderServiceMode = "DINE_IN" | "PICKUP";
export interface FoodOrderItem {
  id: number;
  dishId?: number | null;
  setmealId?: number | null;
  name: string;
  image?: string | null;
  quantity: number;
  price: number;
  amount: number;
  dishFlavor?: string | null;
  remark?: string | null;
}
export interface FoodOrder {
  id: number;
  orderNo: string;
  serviceMode: OrderServiceMode;
  orderStatus: "PLACED" | "CANCELLED";
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  amount: number;
  discountAmount: number;
  payableAmount: number;
  tableId?: number | null;
  tableNo?: string | null;
  tableName?: string | null;
  areaName?: string | null;
  pickupName?: string | null;
  pickupPhone?: string | null;
  pickupTime?: string | null;
  remark?: string | null;
  placedAt: string;
  paidAt?: string | null;
  createTime: string;
  items: FoodOrderItem[];
}
export interface TenantRole {
  id: number;
  roleCode: string;
  name: string;
  status: string;
  systemRole: boolean;
  description?: string | null;
  permissions: string[];
}
export interface PermissionDefinition { code: string; name: string }
export interface EmployeeStoreAssignment { storeIds: number[]; defaultStoreId: number }
export interface TurnoverReport { dateList: string[]; turnoverList: number[] }
export interface OrderReport {
  dateList: string[];
  orderCountList: number[];
  validOrderCountList: number[];
  totalOrderCount: number;
  validOrderCount: number;
  orderCompletionRate: number;
}
export interface SalesTop10Report { nameList: string[]; numberList: number[] }
export interface UserReport { dateList: string[]; totalUserList: number[]; newUserList: number[] }
