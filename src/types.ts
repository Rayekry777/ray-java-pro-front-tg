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
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "WAIT_CHECKOUT" | "RESERVED" | "DISABLED";
export type KitchenItemStatus = "PENDING" | "COOKING" | "READY" | "SERVED" | "RETURNED" | "CANCELLED";
export interface DiningArea { id: number; name: string; sort: number }
export interface DiningTable { id: number; areaId: number; areaName: string; tableNo: string; name: string; capacity: number; status: TableStatus; currentBillId?: number; guestCount?: number; openedAt?: string }
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
  suggestedWorkspace: "KITCHEN" | "DINE_IN_SERVICE" | "OPERATIONS" | "OVERVIEW";
}
export interface StoreSwitchResult { storeId: number; token: string }
export interface OperationsLive {
  occupiedTables: number;
  pendingKitchenItems: number;
  readyToServeItems: number;
  openBills: number;
  pendingPickupOrders: number;
  updatedAt: string;
  version: number;
}
export type BillServiceMode = "DINE_IN" | "TAKEOUT" | "PICKUP";
export type BillStatus =
  | "DRAFT" | "CONFIRMED" | "DINING" | "WAIT_KITCHEN" | "COOKING"
  | "READY" | "SERVED" | "WAIT_CHECKOUT" | "PAID" | "COMPLETED"
  | "CANCELLED" | "REFUNDED";
export interface BillItem {
  id: number;
  dishId?: number | null;
  setmealId?: number | null;
  name: string;
  image?: string | null;
  quantity: number;
  price: number;
  amount: number;
  status: string;
  remark?: string | null;
}
export interface Bill {
  id: number;
  sourceType: string;
  sourceId?: number | null;
  billNo: string;
  orderSource: string;
  serviceMode?: BillServiceMode | null;
  status: BillStatus;
  paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
  amount: number;
  discountAmount: number;
  payableAmount: number;
  tableId?: number | null;
  guestCount?: number | null;
  remark?: string | null;
  version: number;
  createTime: string;
  confirmedAt?: string | null;
  items: BillItem[];
  allowedActions: string[];
}
export interface BillQuote {
  billId: number;
  quoteId: string;
  version: number;
  amount: number;
  discountAmount: number;
  payableAmount: number;
  expiresAt: string;
}
export interface BillKitchenItem {
  id: number;
  billId: number;
  billNo: string;
  serviceMode: "DINE_IN" | "TAKEOUT";
  tableId?: number | null;
  name: string;
  quantity: number;
  status: KitchenItemStatus;
  remark?: string | null;
  submittedAt: string;
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
