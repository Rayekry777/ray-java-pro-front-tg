<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { billApi } from "@/api/services";
import { errorMessage, errorStatus } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import type { BillKitchenItem, KitchenItemStatus } from "@/types";

const { hasPermission } = useMerchantSession();
const loading = ref(false);
const actionId = ref<number>();
const items = ref<BillKitchenItem[]>([]);
const active = ref<KitchenItemStatus | "ALL">("ALL");
const columns = [["PENDING", "待制作"], ["COOKING", "制作中"], ["READY", "制作完成"]] as const;
const visibleColumns = computed(() => active.value === "ALL" ? columns : columns.filter(column => column[0] === active.value));
const byStatus = (status: string) => items.value.filter(item => item.status === status);
async function load() {
  loading.value = true;
  try { items.value = await billApi.kitchenItems(); }
  catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
async function next(item: BillKitchenItem) {
  actionId.value = item.id;
  try {
    if (item.status === "PENDING") await billApi.startItem(item.billId, item.id);
    if (item.status === "COOKING") await billApi.readyItem(item.billId, item.id);
    ElMessage.success(item.status === "PENDING" ? "已开始制作" : "已完成制作");
    await load();
  } catch (error) {
    ElMessage.error(errorStatus(error) === 409 ? "任务已被其他员工处理，已刷新看板" : errorMessage(error));
    if (errorStatus(error) === 409) await load();
  } finally { actionId.value = undefined; }
}
onMounted(load);
</script>

<template>
  <div class="page kitchen-page">
    <div class="page-title compact">
      <div><p class="eyebrow">KITCHEN PASS</p><h1>后厨出餐</h1><p>统一处理堂食与现场外带制作；金额和顾客隐私不进入后厨。</p></div>
      <el-button @click="load">刷新看板</el-button>
    </div>
    <section class="kitchen-toolbar panel">
      <el-radio-group v-model="active"><el-radio-button value="ALL">全部</el-radio-button><el-radio-button value="PENDING">待制作</el-radio-button><el-radio-button value="COOKING">制作中</el-radio-button><el-radio-button value="READY">制作完成</el-radio-button></el-radio-group>
      <span>制作完成后：堂食进入前厅上菜，现场外带进入待交付</span>
    </section>
    <section v-loading="loading" class="kitchen-board production-kitchen-board">
      <article v-for="[status,label] in visibleColumns" :key="status" class="kitchen-column">
        <header><h2>{{ label }}</h2><span>{{ byStatus(status).length }}</span></header>
        <div class="kitchen-cards">
          <article v-for="item in byStatus(status)" :key="item.id" class="kitchen-ticket">
            <header><span class="service-badge" :data-mode="item.serviceMode">{{ item.serviceMode === "DINE_IN" ? "堂食" : "外带" }}</span><time>{{ item.submittedAt?.slice(11,16) }}</time></header>
            <small>#{{ item.billNo }}<template v-if="item.tableId"> · 桌台 {{ item.tableId }}</template></small>
            <h3>{{ item.name }} <em>×{{ item.quantity }}</em></h3><p v-if="item.remark">备注：{{ item.remark }}</p>
            <el-button v-if="status==='PENDING'&&hasPermission('kitchen-item:start')" type="primary" :loading="actionId===item.id" @click="next(item)">开始制作</el-button>
            <el-button v-if="status==='COOKING'&&hasPermission('kitchen-item:ready')" type="primary" :loading="actionId===item.id" @click="next(item)">制作完成</el-button>
            <span v-if="status==='READY'" class="ready-hint">{{ item.serviceMode === "DINE_IN" ? "等待前厅上菜" : "等待收款与交付" }}</span>
          </article>
          <el-empty v-if="!byStatus(status).length" :description="`暂无${label}任务`"/>
        </div>
      </article>
    </section>
  </div>
</template>
