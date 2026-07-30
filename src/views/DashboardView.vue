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
    <div class="page-title compact">
      <div><p class="eyebrow">LIVE OPERATIONS</p><h1>今天，先处理下一件事。</h1><p>{{ roleLabel }} · {{ session?.activeStore.name }}</p></div>
      <div class="title-actions"><span class="aggregate-freshness"><i></i>营业聚合 · {{ freshness }} 更新</span><el-button @click="load">刷新任务</el-button></div>
    </div>
    <el-alert v-if="loadError" title="营业聚合加载失败" :description="loadError" type="error" show-icon :closable="false"><template #default><el-button link type="primary" @click="load">重试</el-button></template></el-alert>
    <section class="stats overview-stats">
      <router-link v-for="[label,value,unit,path,permission] in metrics" v-show="hasPermission(String(permission))" :key="label" class="stat" :to="String(path)">
        <span>{{ label }}</span><strong>{{ value }}<em>{{ unit }}</em></strong><small>查看当前任务 →</small>
      </router-link>
    </section>
    <section class="overview-work-grid">
      <article v-if="hasPermission('bill:create')" class="panel hero-task">
        <div><p class="eyebrow">PRIMARY ACTION</p><h2>统一开单</h2><p>先完成选菜，最后选择堂食或现场外带，再由服务端给出最终报价。</p></div>
        <router-link class="button primary" to="/operations">开始选菜</router-link>
      </article>
      <article v-if="hasPermission('kitchen-item:read')" class="panel task-card" data-accent="warning">
        <span>后厨制作</span><strong>{{ live?.pendingKitchenItems || 0 }}</strong><p>项商品等待开始制作</p><router-link to="/kitchen">进入后厨 →</router-link>
      </article>
      <article v-if="hasPermission('serve-task:read')" class="panel task-card" data-accent="success">
        <span>前厅上菜</span><strong>{{ live?.readyToServeItems || 0 }}</strong><p>项已完成制作，等待上桌</p><router-link to="/serve-tasks">处理上菜 →</router-link>
      </article>
      <article v-if="hasPermission('pickup-order:read')" class="panel task-card" data-accent="info">
        <span>历史自取兼容</span><strong>{{ live?.pendingPickupOrders || 0 }}</strong><p>单小程序自取等待处理</p><router-link to="/pickup/orders">查看自取 →</router-link>
      </article>
    </section>
    <section class="panel workflow-panel">
      <div><p class="eyebrow">SERVICE FLOW</p><h2>营业闭环</h2></div>
      <ol><li><b>01</b><span>选菜</span></li><li><b>02</b><span>报价确认</span></li><li><b>03</b><span>制作</span></li><li><b>04</b><span>上菜 / 交付</span></li><li><b>05</b><span>收款 / 清台</span></li></ol>
    </section>
  </div>
</template>
