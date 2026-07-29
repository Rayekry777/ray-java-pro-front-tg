import { createRouter, createWebHistory } from "vue-router";
import { hasToken } from "@/api/http";
import LoginView from "@/views/LoginView.vue";
import AppLayout from "@/layouts/AppLayout.vue";
import DashboardView from "@/views/DashboardView.vue";
import OrdersView from "@/views/OrdersView.vue";
import ResourceView from "@/views/ResourceView.vue";
import ReportsView from "@/views/ReportsView.vue";
import TablesView from "@/views/dine-in/TablesView.vue";
import DineInOrdersView from "@/views/dine-in/DineInOrdersView.vue";
import KitchenView from "@/views/dine-in/KitchenView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", component: LoginView, meta: { public: true } },
    {
      path: "/", component: AppLayout, children: [
        { path: "", name: "dashboard", component: DashboardView },
        { path: "orders", redirect: "/takeaway/orders" },
        { path: "delivery/orders", redirect: "/takeaway/orders" },
        { path: "dine-in/tables", name: "dine-in-tables", component: TablesView },
        { path: "dine-in/orders", name: "dine-in-orders", component: DineInOrdersView },
        { path: "dine-in/kitchen", name: "dine-in-kitchen", component: KitchenView },
        { path: "takeaway/orders", name: "takeaway-orders", component: OrdersView },
        { path: "dishes", name: "dishes", component: ResourceView, props: { kind: "dishes" } },
        { path: "setmeals", name: "setmeals", component: ResourceView, props: { kind: "setmeals" } },
        { path: "categories", name: "categories", component: ResourceView, props: { kind: "categories" } },
        { path: "employees", name: "employees", component: ResourceView, props: { kind: "employees" } },
        { path: "reports", name: "reports", component: ReportsView }
      ]
    }
  ]
});
router.beforeEach((to) => {
  if (!to.meta.public && !hasToken()) return "/login";
  if (to.path === "/login" && hasToken()) return "/";
});
export default router;
