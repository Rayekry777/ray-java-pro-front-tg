<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Avatar, CloseBold, DataAnalysis, Dish, Grid, HomeFilled, List,
  Menu, Refresh, Setting, Shop, SwitchButton, UserFilled
} from "@element-plus/icons-vue";
import { authApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";

const route = useRoute();
const router = useRouter();
const merchantSession = useMerchantSession();
const collapsed = ref(false);
const storeDialog = ref(false);
const switching = ref(false);
const targetStoreId = ref<number>();
const session = merchantSession.session;

const roleLabels: Record<string, string> = {
  TENANT_OWNER: "租户负责人",
  STORE_MANAGER: "门店经理",
  WAITER: "服务员"
};
const primaryRoleLabel = computed(() => session.value?.roles.map(role => roleLabels[role] || role).join(" / ") || "当前员工");
type NavItem = { path: string; activePrefix?: string; label: string; icon: unknown; permission: string };
const navItems = computed<NavItem[]>(() => [
  { path: "/", label: "订单总览", icon: HomeFilled, permission: "order:read" },
  { path: "/orders", label: "订单中心", icon: List, permission: "order:read" },
  { path: "/products/dishes", activePrefix: "/products", label: "商品管理", icon: Dish, permission: "product:read" },
  { path: "/tables", label: "桌台管理", icon: Grid, permission: "dining-table:read" },
  {
    path: merchantSession.hasPermission("rbac:manage") ? "/access" : "/employees",
    label: "员工权限",
    icon: UserFilled,
    permission: merchantSession.hasPermission("rbac:manage") ? "rbac:manage" : "employee:read"
  },
  { path: "/store", label: "门店设置", icon: Shop, permission: "shop:manage" },
  { path: "/reports", label: "经营报表", icon: DataAnalysis, permission: "report:read" }
].filter(item => merchantSession.hasPermission(item.permission)));

function isActive(path: string, activePrefix?: string) {
  return path === "/" ? route.path === "/" : route.path.startsWith(activePrefix || path);
}
function openStores() {
  targetStoreId.value = session.value?.activeStore.id;
  storeDialog.value = true;
}
async function switchStore() {
  if (!targetStoreId.value || targetStoreId.value === session.value?.activeStore.id) {
    storeDialog.value = false;
    return;
  }
  switching.value = true;
  try {
    await merchantSession.switchStore(targetStoreId.value);
    storeDialog.value = false;
    ElMessage.success(`已切换至 ${session.value?.activeStore.name}`);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally { switching.value = false; }
}
async function logout() {
  try { await authApi.logout(); }
  catch { /* 服务端会话不可用时仍需清理本地凭据。 */ }
  finally {
    merchantSession.endMerchantSession();
    await router.replace("/login");
  }
}
</script>

<template>
  <div class="shell production-shell" :class="{'nav-collapsed':collapsed}">
    <aside class="sidebar" :class="{collapsed}">
      <router-link class="brand" to="/">
        <span class="brand-mark">R</span>
        <span class="brand-copy"><strong>ray-tg</strong><small>商户端</small></span>
      </router-link>
      <nav class="nav" aria-label="主要导航">
        <template v-for="item in navItems" :key="item.path">
          <router-link :to="item.path" :class="{active:isActive(item.path, item.activePrefix)}" @click="collapsed=true">
            <el-icon class="nav-icon"><component :is="item.icon"/></el-icon>
            <span class="nav-label">{{ item.label }}</span>
          </router-link>
        </template>
      </nav>
      <div class="sidebar-caption">ray-tg 商户端</div>
    </aside>

    <section class="app-main">
      <header class="topbar production-topbar">
        <button class="plain-icon mobile-menu" aria-label="切换导航" @click="collapsed=!collapsed"><el-icon><component :is="collapsed?Menu:CloseBold"/></el-icon></button>
        <div class="live aggregate-label"><i class="live-dot"></i><span>{{ session?.activeStore.name }} · 订单只读</span></div>
        <div class="top-actions">
          <button class="store-switch-button" type="button" aria-label="切换当前门店" @click="openStores">
            <span>{{ session?.activeStore.name }}</span><b aria-hidden="true">⌄</b>
          </button>
          <button class="plain-icon" aria-label="刷新当前页面" @click="router.go(0)"><el-icon><Refresh/></el-icon></button>
          <el-dropdown trigger="click">
            <button class="account-button" aria-label="打开员工账号菜单">
              <span class="account-avatar-mini">{{ session?.employee.name.slice(0, 1) }}</span>
              <span class="account-copy"><strong>{{ session?.employee.name }}</strong><small>{{ primaryRoleLabel }}</small></span>
              <b aria-hidden="true">⌄</b>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="Avatar" @click="router.push('/account')">账号安全</el-dropdown-item>
                <el-dropdown-item v-if="merchantSession.hasPermission('shop:manage')" :icon="Setting" @click="router.push('/store')">门店营业设置</el-dropdown-item>
                <el-dropdown-item v-if="merchantSession.hasPermission('dining-table:read')" :icon="Grid" @click="router.push('/tables')">桌台管理</el-dropdown-item>
                <el-dropdown-item divided :icon="SwitchButton" @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main>
        <router-view v-slot="{ Component, route: currentRoute }">
          <Transition name="route-stage" mode="out-in">
            <component :is="Component" :key="`${currentRoute.path}:${session?.activeStore.id || 0}`"/>
          </Transition>
        </router-view>
      </main>
      <footer class="production-footer"><span>ray-tg 商户端 · 当前权限由服务端会话提供</span><span>{{ session?.tenant.tenantCode }} · {{ session?.activeStore.storeCode }}</span></footer>
    </section>

    <el-dialog v-model="storeDialog" title="切换授权门店" width="min(560px, 94vw)">
      <p class="muted">切换成功后将替换 Token、重新加载岗位权限，并刷新当前页面的门店数据。</p>
      <div class="store-options">
        <button v-for="store in session?.authorizedStores" :key="store.id" class="store-option" :class="{selected:targetStoreId===store.id}" @click="targetStoreId=store.id">
          <strong>{{ store.name }}</strong><small>{{ store.storeCode }} · {{ store.timezone }}<template v-if="store.defaultStore"> · 默认门店</template></small>
        </button>
      </div>
      <template #footer><el-button @click="storeDialog=false">取消</el-button><el-button type="primary" :loading="switching" @click="switchStore">确认切换</el-button></template>
    </el-dialog>
  </div>
</template>
