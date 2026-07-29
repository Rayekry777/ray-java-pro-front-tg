export interface ApiResult<T> { code: number; data: T; msg?: string }
export interface PageResult<T> { total: number; records: T[] }
export interface Session { id: number; name: string; token: string; userName: string }
export interface BusinessData { newUsers: number; orderCompletionRate: number; turnover: number; unitPrice: number; validOrderCount: number }
export interface ProductOverview { discontinued: number; sold: number }
export interface OrderOverview { allOrders: number; cancelledOrders: number; completedOrders: number; deliveredOrders: number; waitingOrders: number }
export interface Order { id: number; number: string; status: number; orderTime: string; checkoutTime?: string; amount: number; remark?: string; userName: string; phone: string; address: string; consignee: string; estimatedDeliveryTime?: string; orderDishes: string; rejectionReason?: string; cancelReason?: string }
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
export interface OrderStatistics { confirmed: number; deliveryInProgress: number; toBeConfirmed: number }
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "WAIT_CHECKOUT" | "RESERVED" | "DISABLED";
export type DineInOrderStatus = "DINING" | "WAIT_KITCHEN" | "COOKING" | "WAIT_CHECKOUT" | "PAID" | "COMPLETED" | "CANCELLED";
export type KitchenItemStatus = "PENDING" | "COOKING" | "READY" | "SERVED" | "RETURNED" | "CANCELLED";
export interface DiningArea { id: number; name: string; sort: number }
export interface DiningTable { id: number; areaId: number; areaName: string; tableNo: string; name: string; capacity: number; status: TableStatus; currentOrderId?: number; guestCount?: number; openedAt?: string }
export interface DineInOrderItem { id: number; dishId?: number; setmealId?: number; name: string; quantity: number; price: number; amount: number; status: KitchenItemStatus; flavors?: string; remark?: string; urgeCount?: number }
export interface DineInOrder { id: number; orderNo: string; tableId: number; tableName: string; areaName: string; guestCount: number; status: DineInOrderStatus; paymentStatus: "UNPAID" | "PAID" | "REFUNDED"; amount: number; discountAmount: number; payableAmount: number; openedAt: string; checkoutTime?: string; remark?: string; waiterName?: string; items: DineInOrderItem[] }
export interface KitchenItem extends DineInOrderItem { orderId: number; orderNo: string; tableName: string; submittedAt: string }
export interface DineInOverview { totalTables: number; availableTables: number; occupiedTables: number; waitingCheckoutTables: number; todayOrders: number; todayTurnover: number; waitingKitchenItems: number; readyToServeItems: number }
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
