<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { serveTaskApi } from "@/api/services";
import { errorMessage, errorStatus } from "@/api/http";
import type { KitchenItem } from "@/types";

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
    <div class="page-title compact"><div><p class="eyebrow">FRONT SERVICE</p><h1>前厅上菜任务</h1><p>只显示制作完成且等待上桌的堂食菜品。</p></div><el-button @click="load">刷新任务</el-button></div>
    <section v-loading="loading" class="serve-grid">
      <article v-for="task in tasks" :key="task.id" class="panel serve-card">
        <header><div><span>{{ task.tableName }}</span><small>#{{ task.orderNo }}</small></div><time>{{ task.submittedAt?.slice(11,16) }}</time></header>
        <h2>{{ task.name }} <em>×{{ task.quantity }}</em></h2>
        <p v-if="task.flavors">{{ task.flavors }}</p><p v-if="task.remark" class="serve-note">备注：{{ task.remark }}</p>
        <footer><span class="tag ok">制作完成</span><el-button type="primary" :loading="actionId===task.id" @click="confirm(task)">确认上桌</el-button></footer>
      </article>
      <el-empty v-if="!loading&&!tasks.length" description="当前没有待上菜任务"/>
    </section>
  </div>
</template>
