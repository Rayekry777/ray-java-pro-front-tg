<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { billApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { Bill, BillServiceMode, BillStatus } from "@/types";

const loading = ref(false);
const rows = ref<Bill[]>([]);
const total = ref(0);
const query = reactive<{ page: number; size: number; serviceMode: BillServiceMode | ""; status: BillStatus | "" }>({
  page: 1, size: 20, serviceMode: "", status: ""
});
const modeMap: Record<string, string> = { DINE_IN: "堂食", TAKEOUT: "现场外带", PICKUP: "自取", DELIVERY: "配送" };
const statusMap: Record<string, [string, string]> = {
  DRAFT: ["草稿", "info"], CONFIRMED: ["已确认", "primary"], DINING: ["就餐中", "primary"],
  WAIT_KITCHEN: ["待下厨", "warning"], COOKING: ["制作中", "primary"], READY: ["制作完成", "success"],
  SERVED: ["已上桌", "success"], WAIT_CHECKOUT: ["待收款", "warning"], PAID: ["已支付", "success"],
  COMPLETED: ["已完成", "info"], CANCELLED: ["已取消", "info"], REFUNDED: ["已退款", "info"]
};
function money(value?: number) { return `¥${Number(value || 0).toFixed(2)}`; }
function detailLocation(row: Bill) {
  return row.sourceType && row.sourceType !== "UNIFIED"
    ? { path: `/bills/${row.sourceId}`, query: { sourceType: row.sourceType, sourceId: String(row.sourceId) } }
    : `/bills/${row.id}`;
}
async function load() {
  loading.value = true;
  try {
    const result = await billApi.page(query);
    rows.value = result.records;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
function reset() {
  query.page = 1; query.serviceMode = ""; query.status = ""; load();
}
onMounted(load);
</script>

<template>
  <div class="page bills-page">
    <div class="page-title compact">
      <div><p class="eyebrow">BILL CENTER</p><h1>账单中心</h1><p>统一查询堂食、现场外带及迁移后的账单状态。</p></div>
      <router-link v-if="$route.meta && true" class="button primary" to="/operations">＋ 新建账单</router-link>
    </div>
    <section class="bill-mode-strip">
      <button :class="{active:query.serviceMode===''}" @click="query.serviceMode='';query.page=1;load()">全部</button>
      <button v-for="(label,mode) in modeMap" :key="mode" :class="{active:query.serviceMode===mode}" @click="query.serviceMode=mode as BillServiceMode;query.page=1;load()">{{ label }}</button>
    </section>
    <section class="panel filter-bar">
      <el-select v-model="query.status" placeholder="账单状态" clearable>
        <el-option v-for="(item,status) in statusMap" :key="status" :label="item[0]" :value="status"/>
      </el-select>
      <el-button type="primary" @click="query.page=1;load()">查询</el-button><el-button @click="reset">重置</el-button>
      <span class="compat-hint">历史自取继续在“自取任务”中处理</span>
    </section>
    <section class="panel table-panel">
      <el-table :data="rows" v-loading="loading" empty-text="当前筛选下暂无账单">
        <el-table-column prop="billNo" label="账单号" min-width="190"/>
        <el-table-column label="类型" width="115"><template #default="{row}"><span class="service-badge" :data-mode="row.serviceMode">{{ modeMap[row.serviceMode] || "待选择" }}</span></template></el-table-column>
        <el-table-column label="状态" width="110"><template #default="{row}"><el-tag :type="statusMap[row.status]?.[1] as any">{{ statusMap[row.status]?.[0] || row.status }}</el-tag></template></el-table-column>
        <el-table-column label="支付" width="100"><template #default="{row}"><el-tag :type="row.paymentStatus==='PAID'?'success':'warning'" effect="plain">{{ row.paymentStatus==='PAID'?'已支付':'未支付' }}</el-tag></template></el-table-column>
        <el-table-column label="金额" width="120"><template #default="{row}"><strong>{{ money(row.payableAmount) }}</strong></template></el-table-column>
        <el-table-column label="桌台/人数" min-width="120"><template #default="{row}">{{ row.serviceMode==='DINE_IN' ? `桌台 #${row.tableId || '-'} · ${row.guestCount || '-'} 人` : "不占桌台" }}</template></el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="175"/>
        <el-table-column label="操作" fixed="right" width="110"><template #default="{row}"><router-link :to="detailLocation(row)">查看详情 →</router-link></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="query.page" :page-size="query.size" layout="total, prev, pager, next" :total="total" @current-change="load"/>
    </section>
  </div>
</template>
