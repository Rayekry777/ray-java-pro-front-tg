<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { billApi } from "@/api/services";
import { errorMessage, errorStatus } from "@/api/http";
import type { BillKitchenItem } from "@/types";

const loading = ref(false);
const actionId = ref<number>();
const items = ref<BillKitchenItem[]>([]);
const tasks = computed(() => items.value.filter(item => item.status === "READY" && item.serviceMode === "DINE_IN"));
async function load() {
  loading.value = true;
  try { items.value = await billApi.kitchenItems("READY"); }
  catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
async function confirm(item: BillKitchenItem) {
  actionId.value = item.id;
  try {
    await billApi.serveItem(item.billId, item.id);
    ElMessage.success(`${item.name} 已确认上桌`);
    await load();
  } catch (error) {
    ElMessage.error(errorStatus(error) === 409 ? "任务已被其他员工处理" : errorMessage(error));
    if (errorStatus(error) === 409) await load();
  } finally { actionId.value = undefined; }
}
onMounted(load);
</script>

<template>
  <div class="page serve-page">
    <header class="page-head"><div><p class="eyebrow">FRONT SERVICE</p><h1>前厅上菜任务</h1><p>所有任务均来自统一账单，按制作完成时间等待上桌。</p></div><el-button @click="load">刷新任务</el-button></header>
    <section v-loading="loading" class="panel task-list">
      <div class="section-title"><h2>待上桌</h2><span class="tag">{{ tasks.length }} 项</span></div>
      <div class="tasks">
        <article v-for="task in tasks" :key="task.id" class="task">
          <i class="task-bar"></i>
          <div><h3>桌台 {{ task.tableId }} · {{ task.name }} ×{{ task.quantity }}</h3><p>#{{ task.billNo }}<template v-if="task.remark"> · {{ task.remark }}</template></p></div>
          <el-button type="primary" :loading="actionId===task.id" @click="confirm(task)">确认上桌</el-button>
        </article>
        <el-empty v-if="!loading&&!tasks.length" description="当前没有待上菜任务"/>
      </div>
    </section>
  </div>
</template>
