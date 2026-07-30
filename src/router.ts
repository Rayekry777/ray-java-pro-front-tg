import { createRouter, createWebHistory } from "vue-router";
import { hasToken } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import LoginView from "@/views/LoginView.vue";
import AppLayout from "@/layouts/AppLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import UnifiedOrderingView from "@/views/UnifiedOrderingView.vue";
import BillsView from "@/views/BillsView.vue";
import BillDetailView from "@/views/BillDetailView.vue";
import ServeTasksView from "@/views/ServeTasksView.vue";
import OrdersView from "@/views/OrdersView.vue";
import ResourceView from "@/views/ResourceView.vue";
import ReportsView from "@/views/ReportsView.vue";
import AccountView from "@/views/AccountView.vue";
import StoreSettingsView from "@/views/StoreSettingsView.vue";
import EmployeeAccessView from "@/views/EmployeeAccessView.vue";
import ForbiddenView from "@/views/ForbiddenView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import TablesView from "@/views/dine-in/TablesView.vue";
import DineInOrdersView from "@/views/dine-in/DineInOrdersView.vue";
import KitchenView from "@/views/dine-in/KitchenView.vue";

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: "/login", component: LoginView, meta: { public: true } },
    {
      path: "/", component: AppLayout, children: [
        { path: "", name: "dashboard", component: DashboardView, meta: { permission: "operations:read" } },
        { path: "operations", name: "operations", component: UnifiedOrderingView, meta: { permission: "bill:create" } },
        { path: "bills", name: "bills", component: BillsView, meta: { permission: "bill:read" } },
        { path: "bills/:id(\\d+)", name: "bill-detail", component: BillDetailView, meta: { permission: "bill:read" } },
        { path: "serve-tasks", name: "serve-tasks", component: ServeTasksView, meta: { permission: "serve-task:read" } },
        { path: "dine-in/tables", name: "dine-in-tables", component: TablesView, meta: { permission: "dining-table:read" } },
        { path: "dine-in/orders", name: "dine-in-orders", component: DineInOrdersView, meta: { permission: "dine-in-order:read" } },
        { path: "kitchen", name: "kitchen", component: KitchenView, meta: { permission: "kitchen-item:read" } },
        { path: "pickup/orders", name: "pickup-orders", component: OrdersView, meta: { permission: "pickup-order:read" } },
        { path: "products/dishes", name: "dishes", component: ResourceView, props: { kind: "dishes" }, meta: { permission: "product:read" } },
        { path: "products/setmeals", name: "setmeals", component: ResourceView, props: { kind: "setmeals" }, meta: { permission: "product:read" } },
        { path: "products/categories", name: "categories", component: ResourceView, props: { kind: "categories" }, meta: { permission: "product:read" } },
        { path: "employees", name: "employees", component: ResourceView, props: { kind: "employees" }, meta: { permission: "employee:read" } },
        { path: "access", name: "access", component: EmployeeAccessView, meta: { permission: "rbac:manage" } },
        { path: "store", name: "store", component: StoreSettingsView, meta: { permission: "shop:manage" } },
        { path: "account", name: "account", component: AccountView },
        { path: "reports", name: "reports", component: ReportsView, meta: { permission: "report:read" } },
        { path: "forbidden", name: "forbidden", component: ForbiddenView }
      ]
    },
    { path: "/orders", redirect: "/pickup/orders" },
    { path: "/takeaway/orders", redirect: "/pickup/orders" },
    { path: "/dine-in/kitchen", redirect: "/kitchen" },
    { path: "/dishes", redirect: "/products/dishes" },
    { path: "/setmeals", redirect: "/products/setmeals" },
    { path: "/categories", redirect: "/products/categories" },
    { path: "/:pathMatch(.*)*", component: NotFoundView, meta: { public: true } }
  ]
});

router.beforeEach(async to => {
  if (to.meta.public) return to.path === "/login" && hasToken() ? "/" : true;
  if (!hasToken()) return { path: "/login", query: { redirect: to.fullPath } };
  const merchantSession = useMerchantSession();
  try { await merchantSession.loadSession(); }
  catch { return "/login"; }
  const permission = typeof to.meta.permission === "string" ? to.meta.permission : undefined;
  if (permission && !merchantSession.hasPermission(permission)) return "/forbidden";
  return true;
});
export default router;
