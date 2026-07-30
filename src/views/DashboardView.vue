<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { operationsApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import type { OperationsLive } from "@/types";

const { session, hasPermission } = useMerchantSession();
const loading = ref(false);
const live = ref<OperationsLive>();
const loadError = ref("");
const freshness = computed(() => live.value?.updatedAt
  ? new Date(live.value.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })
  : "--:--");
const roleNames: Record<string, string> = {
  TENANT_OWNER: "租户负责人", STORE_MANAGER: "门店经理", CASHIER: "前台 / 收银员", WAITER: "服务员", KITCHEN: "后厨"
};
const roleLabel = computed(() => session.value?.roles.map(role => roleNames[role] || role).join(" / ") || "当前员工");
const metrics = computed(() => [
  ["占用桌台", live.value?.occupiedTables || 0, "桌", "/dine-in/tables", "dining-table:read"],
  ["待制作", live.value?.pendingKitchenItems || 0, "项", "/kitchen", "kitchen-item:read"],
  ["待上菜", live.value?.readyToServeItems || 0, "项", "/serve-tasks", "serve-task:read"],
  ["营业账单", live.value?.openBills || 0, "单", "/bills", "bill:read"],
  ["待接自取", live.value?.pendingPickupOrders || 0, "单", "/pickup/orders", "pickup-order:read"]
]);
const priorityTasks = computed(() => [
  { title: "后厨待制作", description: "进入后厨出餐中心推进制作状态", value: live.value?.pendingKitchenItems || 0, unit: "项", path: "/kitchen", permission: "kitchen-item:read", mode: "takeout" },
  { title: "前厅待上菜", description: "制作完成后由前厅确认上桌", value: live.value?.readyToServeItems || 0, unit: "项", path: "/serve-tasks", permission: "serve-task:read", mode: "dine-in" },
  { title: "营业中账单", description: "查看堂食、外带与历史自取账单", value: live.value?.openBills || 0, unit: "单", path: "/bills", permission: "bill:read", mode: "dine-in" },
  { title: "历史自取待接单", description: "兼容小程序旧自取订单处理", value: live.value?.pendingPickupOrders || 0, unit: "单", path: "/pickup/orders", permission: "pickup-order:read", mode: "pickup" }
].filter(item => hasPermission(item.permission)));
async function load() {
  loading.value = true; loadError.value = "";
  try { live.value = await operationsApi.live(); }
  catch (error) { loadError.value = errorMessage(error); ElMessage.error(loadError.value); }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="page production-overview" v-loading="loading">
    <header class="page-head">
      <div><p class="eyebrow">RAY · {{ roleLabel }}</p><h1>经营总览</h1><p>使用营业聚合快照安排当前任务与异常优先级。</p></div>
      <div class="title-actions"><span class="aggregate-freshness"><i></i>营业聚合 · {{ freshness }} 更新</span><el-button @click="load">刷新任务</el-button></div>
    </header>
    <el-alert v-if="loadError" title="营业聚合加载失败" :description="loadError" type="error" show-icon :closable="false"><template #default><el-button link type="primary" @click="load">重试</el-button></template></el-alert>
    <section class="stats overview-stats">
      <router-link v-for="[label,value,unit,path,permission] in metrics" v-show="hasPermission(String(permission))" :key="label" class="stat" :to="String(path)">
        <span>{{ label }}</span><strong>{{ value }}<em>{{ unit }}</em></strong><small>查看当前任务 →</small>
      </router-link>
    </section>
    <div class="split">
      <section class="panel task-list">
        <div class="section-title"><div><p class="eyebrow">NOW</p><h2>当前优先任务</h2></div><router-link v-if="hasPermission('serve-task:read')" to="/serve-tasks">查看全部 →</router-link></div>
        <div class="tasks">
          <router-link v-for="item in priorityTasks" :key="item.path" class="task" :data-mode="item.mode" :to="item.path">
            <i class="task-bar"></i>
            <div><h3>{{ item.title }}</h3><p>{{ item.description }}</p></div>
            <strong class="timer">{{ item.value }} {{ item.unit }}</strong>
          </router-link>
          <el-empty v-if="!priorityTasks.length" description="当前岗位暂无聚合任务入口"/>
        </div>
      </section>
      <aside class="panel activity">
        <div class="section-title"><h2>营业快照</h2><span class="tag ok">聚合已更新</span></div>
        <div class="timeline">
          <div class="timeline-row"><b>{{ freshness }}</b><i></i><span>营业聚合数据已刷新</span></div>
          <div class="timeline-row"><b>v{{ live?.version || 0 }}</b><i></i><span>当前聚合快照版本</span></div>
          <div class="timeline-row"><b>{{ live?.occupiedTables || 0 }} 桌</b><i></i><span>{{ session?.activeStore.name }} 当前占用桌台</span></div>
        </div>
        <router-link v-if="hasPermission('bill:create')" class="button primary overview-order-entry" to="/operations">进入统一营业台</router-link>
      </aside>
    </div>
  </div>
</template>
