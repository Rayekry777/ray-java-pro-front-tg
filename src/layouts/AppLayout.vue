<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Avatar, CloseBold, DataAnalysis, Dish, Food, HomeFilled, Key, List,
  Menu, Operation, Refresh, Setting, Shop, SwitchButton, Tickets, UserFilled
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

const groups = computed(() => [
  { label: "", items: [
    { path: "/", label: "经营总览", icon: HomeFilled, permission: "operations:read" },
    { path: "/operations", label: "统一营业台", icon: Operation, permission: "bill:create" },
    { path: "/serve-tasks", label: "当前任务", icon: Tickets, permission: "serve-task:read" }
  ] },
  { label: "账单与履约", items: [
    { path: "/bills", label: "账单中心", icon: List, permission: "bill:read" },
    { path: "/dine-in/tables", label: "堂食桌台", icon: Menu, permission: "dining-table:read" },
    { path: "/kitchen", label: "后厨出餐", icon: Food, permission: "kitchen-item:read" },
    { path: "/pickup/orders", label: "自取任务", icon: Tickets, permission: "pickup-order:read" }
  ] },
  { label: "经营管理", items: [
    { path: "/products/dishes", label: "商品管理", icon: Dish, permission: "product:read" },
    { path: "/employees", label: "员工管理", icon: UserFilled, permission: "employee:read" },
    { path: "/access", label: "角色与授权", icon: Key, permission: "rbac:manage" },
    { path: "/store", label: "门店设置", icon: Shop, permission: "shop:manage" },
    { path: "/reports", label: "经营报表", icon: DataAnalysis, permission: "report:read", disabled: true }
  ] }
].map(group => ({ ...group, items: group.items.filter(item => merchantSession.hasPermission(item.permission)) })).filter(group => group.items.length));

function isActive(path: string) {
  return path === "/" ? route.path === "/" : route.path.startsWith(path);
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
    await router.replace("/");
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
    <aside :class="{collapsed}">
      <router-link class="brand" to="/"><span>R</span><div><strong>RAY</strong><small>餐厅运营台</small></div></router-link>
      <div class="sidebar-role"><strong>{{ session?.roles.map(role => ({TENANT_OWNER:"租户负责人",STORE_MANAGER:"门店经理",CASHIER:"前台 / 收银员",WAITER:"服务员",KITCHEN:"后厨"}[role] || role)).join(" / ") }}</strong><small>{{ session?.activeStore.name }}</small></div>
      <nav aria-label="主要导航">
        <div v-for="group in groups" :key="group.label" class="nav-group">
          <small v-if="group.label">{{ group.label }}</small>
          <template v-for="item in group.items" :key="item.path">
            <span v-if="item.disabled" class="nav-disabled" title="接口待确认"><el-icon><component :is="item.icon"/></el-icon><span>{{ item.label }}</span><b>待确认</b></span>
            <router-link v-else :to="item.path" :class="{active:isActive(item.path)}" @click="collapsed=true">
              <el-icon><component :is="item.icon"/></el-icon><span>{{ item.label }}</span>
            </router-link>
          </template>
        </div>
      </nav>
      <div class="shift-card"><span>当前班次</span><strong>{{ session?.tenant.name }}</strong><small>{{ session?.activeStore.timezone }}</small></div>
    </aside>

    <section class="app-main">
      <header class="topbar production-topbar">
        <button class="plain-icon mobile-menu" aria-label="切换导航" @click="collapsed=!collapsed"><el-icon><component :is="collapsed?Menu:CloseBold"/></el-icon></button>
        <div class="live aggregate-label"><i class="live-dot"></i><span>门店会话已初始化</span></div>
        <div class="top-actions">
          <button class="store-switch-button" type="button" @click="openStores">
            <span><small>当前门店</small><strong>{{ session?.activeStore.name }}</strong></span><b>⌄</b>
          </button>
          <button class="plain-icon" aria-label="刷新当前页面" @click="router.go(0)"><el-icon><Refresh/></el-icon></button>
          <el-dropdown trigger="click">
            <button class="account-button">
              <span class="avatar">{{ session?.employee.name.slice(0,1) }}</span>
              <span><strong>{{ session?.employee.name }}</strong><small>@{{ session?.employee.username }}</small></span><b>⌄</b>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :icon="Avatar" @click="router.push('/account')">账号安全</el-dropdown-item>
                <el-dropdown-item v-if="merchantSession.hasPermission('shop:manage')" :icon="Setting" @click="router.push('/store')">门店营业设置</el-dropdown-item>
                <el-dropdown-item divided :icon="SwitchButton" @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main><router-view/></main>
      <footer class="production-footer"><span>Ray 运营台 · 当前权限由服务端会话提供</span><span>{{ session?.tenant.tenantCode }} · {{ session?.activeStore.storeCode }}</span></footer>
    </section>

    <el-dialog v-model="storeDialog" title="切换授权门店" width="min(560px, 94vw)">
      <p class="muted">切换成功后将替换 Token、重新加载岗位权限，并回到新门店的经营总览。</p>
      <div class="store-options">
        <button v-for="store in session?.authorizedStores" :key="store.id" class="store-option" :class="{selected:targetStoreId===store.id}" @click="targetStoreId=store.id">
          <strong>{{ store.name }}</strong><small>{{ store.storeCode }} · {{ store.timezone }}<template v-if="store.defaultStore"> · 默认门店</template></small>
        </button>
      </div>
      <template #footer><el-button @click="storeDialog=false">取消</el-button><el-button type="primary" :loading="switching" @click="switchStore">确认切换</el-button></template>
    </el-dialog>
  </div>
</template>
