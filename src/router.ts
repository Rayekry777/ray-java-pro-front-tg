import { createRouter, createWebHistory } from "vue-router";
import { hasToken } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import LoginView from "@/views/LoginView.vue";
import AppLayout from "@/layouts/AppLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import OrdersView from "@/views/OrdersView.vue";
import OrderDetailView from "@/views/OrderDetailView.vue";
import ResourceView from "@/views/ResourceView.vue";
import AccountView from "@/views/AccountView.vue";
import StoreSettingsView from "@/views/StoreSettingsView.vue";
import DiningTablesView from "@/views/DiningTablesView.vue";
import EmployeeAccessView from "@/views/EmployeeAccessView.vue";
import ForbiddenView from "@/views/ForbiddenView.vue";
import NotFoundView from "@/views/NotFoundView.vue";

const ReportsView = () => import("@/views/ReportsView.vue");

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: "/login", component: LoginView, meta: { public: true } },
    {
      path: "/", component: AppLayout, children: [
        { path: "", name: "dashboard", component: DashboardView, meta: { permission: "order:read" } },
        { path: "orders", name: "orders", component: OrdersView, meta: { permission: "order:read" } },
        { path: "orders/:id(\\d+)", name: "order-detail", component: OrderDetailView, meta: { permission: "order:read" } },
        { path: "products/dishes", name: "dishes", component: ResourceView, props: { kind: "dishes" }, meta: { permission: "product:read" } },
        { path: "products/setmeals", name: "setmeals", component: ResourceView, props: { kind: "setmeals" }, meta: { permission: "product:read" } },
        { path: "products/categories", name: "categories", component: ResourceView, props: { kind: "categories" }, meta: { permission: "product:read" } },
        { path: "employees", name: "employees", component: ResourceView, props: { kind: "employees" }, meta: { permission: "employee:read" } },
        { path: "access", name: "access", component: EmployeeAccessView, meta: { permission: "rbac:manage" } },
        { path: "store", name: "store", component: StoreSettingsView, meta: { permission: "shop:manage" } },
        { path: "tables", name: "tables", component: DiningTablesView, meta: { permission: "dining-table:read" } },
        { path: "account", name: "account", component: AccountView },
        { path: "reports", name: "reports", component: ReportsView, meta: { permission: "report:read" } },
        { path: "forbidden", name: "forbidden", component: ForbiddenView }
      ]
    },
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
