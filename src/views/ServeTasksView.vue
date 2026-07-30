<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { serveTaskApi } from "@/api/services";
import { errorMessage, errorStatus } from "@/api/http";
import type { KitchenItem } from "@/types";
import { useMerchantSession } from "@/session/merchantSession";

const { hasPermission } = useMerchantSession();
const loading = ref(false);
const actionId = ref<number>();
const tasks = ref<KitchenItem[]>([]);
async function load() {
  loading.value = true;
  try { tasks.value = await serveTaskApi.list(); }
  catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
async function confirm(item: KitchenItem) {
  actionId.value = item.id;
  try { await serveTaskApi.confirm(item.id); ElMessage.success(`${item.name} 已确认上桌`); await load(); }
  catch (error) {
    ElMessage.error(errorStatus(error) === 409 ? "任务已被其他员工处理" : errorMessage(error));
    if (errorStatus(error) === 409) await load();
  } finally { actionId.value = undefined; }
}
onMounted(load);
</script>

<template>
  <div class="page serve-page">
    <header class="page-head"><div><p class="eyebrow">FRONT SERVICE</p><h1>前厅服务与交付</h1><p>按等待时间与责任岗位安排下一动作。</p></div><el-button @click="load">刷新任务</el-button></header>
    <div class="split">
      <section v-loading="loading" class="panel task-list">
        <div class="section-title"><h2>待上桌</h2><span class="tag">{{ tasks.length }} 项</span></div>
        <div class="tasks">
          <article v-for="task in tasks" :key="task.id" class="task">
            <i class="task-bar"></i>
            <div><h3>{{ task.tableName }} · {{ task.name }} ×{{ task.quantity }}</h3><p>#{{ task.orderNo }}<template v-if="task.flavors"> · {{ task.flavors }}</template><template v-if="task.remark"> · {{ task.remark }}</template></p></div>
            <el-button type="primary" :loading="actionId===task.id" @click="confirm(task)">确认上桌</el-button>
          </article>
          <el-empty v-if="!loading&&!tasks.length" description="当前没有待上菜任务"/>
        </div>
      </section>
      <aside class="panel task-list">
        <div class="section-title"><h2>交付与取餐</h2><span class="tag warn">分流处理</span></div>
        <div class="tasks">
          <router-link v-if="hasPermission('bill:read')" class="task" data-mode="takeout" to="/bills">
            <i class="task-bar"></i><div><h3>现场外带</h3><p>在统一账单中心查看待交付账单</p></div><span>查看 →</span>
          </router-link>
          <router-link v-if="hasPermission('pickup-order:read')" class="task" data-mode="pickup" to="/pickup/orders">
            <i class="task-bar"></i><div><h3>历史自取</h3><p>在兼容任务页完成接单与取走</p></div><span>查看 →</span>
          </router-link>
        </div>
      </aside>
    </div>
  </div>
</template>
