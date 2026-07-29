<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { authApi, workspaceApi } from "@/api/services";
import { clearSession } from "@/api/http";
import BusinessSettingsDialog from "@/components/BusinessSettingsDialog.vue";
import type { ShopBusinessSettings } from "@/types";
import { Bell, DataAnalysis, Dish, Food, HomeFilled, List, Menu, Refresh, SwitchButton, UserFilled } from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const collapsed = ref(false);
const businessDialogVisible = ref(false);
const businessSettings = ref<ShopBusinessSettings>();
const businessLoading = ref(false);
let businessChangeTimer: number | undefined;
let businessFallbackTimer: number | undefined;
let disposed = false;
const user = computed(() => {
  try { return JSON.parse(sessionStorage.getItem("ray-admin-user") || "{}"); } catch { return {}; }
});
const groups = [
  { label: "", items: [["/", "工作台", HomeFilled]] },
  { label: "堂食运营", items: [["/dine-in/tables", "桌台管理", Menu], ["/dine-in/orders", "堂食订单", List], ["/dine-in/kitchen", "出餐管理", Food]] },
  { label: "外卖运营", items: [["/delivery/orders", "外卖订单", List]] },
  { label: "基础管理", items: [["/dishes", "菜品管理", Dish], ["/setmeals", "套餐管理", Food], ["/categories", "分类管理", Menu], ["/employees", "员工管理", UserFilled], ["/reports", "数据统计", DataAnalysis]] }
] as const;
const businessTitle = computed(() => businessSettings.value?.effectiveStatus ? "营业中" : "已打烊");
const businessSubtitle = computed(() => {
  const settings = businessSettings.value;
  if (!settings) return "点击设置营业时间";
  if (settings.mode === "MANUAL_OPEN") return "强制营业 · 点击设置";
  if (settings.mode === "MANUAL_CLOSED") return "强制打烊 · 点击设置";
  if (settings.currentPeriod) return `${settings.currentPeriod.start}—${settings.currentPeriod.end}`;
  if (settings.nextChangeTime) {
    const next = new Date(settings.nextChangeTime);
    const day = next.toLocaleDateString("zh-CN", { weekday: "short" });
    const time = next.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} ${time} 开始营业`;
  }
  return "自动营业 · 暂无时段";
});
function clearBusinessChangeTimer() {
  if (businessChangeTimer !== undefined) {
    window.clearTimeout(businessChangeTimer);
    businessChangeTimer = undefined;
  }
}
function scheduleBusinessRefresh(settings: ShopBusinessSettings) {
  clearBusinessChangeTimer();
  if (settings.mode !== "AUTO" || !settings.nextChangeTime) return;

  // ZonedDateTime.toString() 可能带有 [Asia/Shanghai]，浏览器 Date 不识别该区域后缀。
  const parsableTime = settings.nextChangeTime.replace(/\[[^\]]+\]$/, "");
  const changeAt = new Date(parsableTime).getTime();
  if (!Number.isFinite(changeAt)) return;

  // 边界后延迟 500ms 再查询，避免客户端和服务端时钟存在毫秒级误差。
  const delay = Math.max(changeAt - Date.now() + 500, 500);
  businessChangeTimer = window.setTimeout(() => {
    void loadBusinessSettings();
  }, delay);
}
async function loadBusinessSettings() {
  if (businessLoading.value || disposed) return;
  businessLoading.value = true;
  try {
    const settings = await workspaceApi.shopBusinessSettings();
    if (disposed) return;
    businessSettings.value = settings;
    scheduleBusinessRefresh(settings);
  } catch {
    // 校准失败时保留上一次成功结果，等待聚焦或兜底任务再次请求。
  } finally {
    businessLoading.value = false;
  }
}
function handleBusinessSaved(settings: ShopBusinessSettings) {
  businessSettings.value = settings;
  scheduleBusinessRefresh(settings);
}
function handleBusinessChanged() {
  void loadBusinessSettings();
}
function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    void loadBusinessSettings();
  }
}
async function logout() {
  try { await authApi.logout(); } finally { clearSession(); router.replace("/login"); }
}
onMounted(() => {
  disposed = false;
  void loadBusinessSettings();
  window.addEventListener("ray:shop-business-changed", handleBusinessChanged);
  window.addEventListener("focus", handleBusinessChanged);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // 15 分钟低频校准一次，用于处理客户端时间调整、休眠和偶发请求失败。
  businessFallbackTimer = window.setInterval(handleBusinessChanged, 15 * 60 * 1000);
});
onBeforeUnmount(() => {
  disposed = true;
  clearBusinessChangeTimer();
  if (businessFallbackTimer !== undefined) {
    window.clearInterval(businessFallbackTimer);
  }
  window.removeEventListener("ray:shop-business-changed", handleBusinessChanged);
  window.removeEventListener("focus", handleBusinessChanged);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <div class="shell">
    <aside :class="{ collapsed }">
      <div class="brand"><span>R</span><div><strong>Ray</strong><small>餐厅运营台</small></div></div>
      <nav aria-label="主要导航">
        <div v-for="group in groups" :key="group.label" class="nav-group">
          <small v-if="group.label">{{group.label}}</small>
          <router-link v-for="[path,label,icon] in group.items" :key="path" :to="path" :class="{ active: route.path === path }">
            <el-icon><component :is="icon" /></el-icon><span>{{ label }}</span>
          </router-link>
        </div>
      </nav>
      <button class="shift" type="button" aria-label="打开营业设置" @click="businessDialogVisible=true">
        <i :class="{ off: !businessSettings?.effectiveStatus }"></i>
        <div><strong>{{ businessTitle }}</strong><small>{{ businessSubtitle }}</small></div>
      </button>
    </aside>
    <section class="app-main">
      <header class="topbar">
        <button class="plain-icon" aria-label="切换导航" @click="collapsed=!collapsed"><el-icon><Menu /></el-icon></button>
        <div class="store"><small>门店</small><strong>Ray 现代中餐厅</strong></div>
        <div class="top-actions">
          <span class="freshness">更新于 {{ new Date().toLocaleTimeString("zh-CN",{hour12:false}) }}</span>
          <button class="plain-icon" aria-label="刷新页面" @click="router.go(0)"><el-icon><Refresh /></el-icon></button>
          <button class="plain-icon notification" aria-label="3 条通知"><el-icon><Bell /></el-icon><b>3</b></button>
          <div class="user"><span class="avatar">{{ (user.name || "店").slice(0,1) }}</span><strong>{{ user.name || "管理员" }}</strong><button class="plain-icon" aria-label="退出登录" @click="logout"><el-icon><SwitchButton /></el-icon></button></div>
        </div>
      </header>
      <main><router-view /></main>
    </section>
    <BusinessSettingsDialog v-model="businessDialogVisible" @saved="handleBusinessSaved"/>
  </div>
</template>
