<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { dineInApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import DiningTableFormDialog from "@/components/DiningTableFormDialog.vue";
import { useMerchantSession } from "@/session/merchantSession";
import type { DiningArea, DiningTable, TableStatus } from "@/types";

const { activeStore, hasPermission } = useMerchantSession();
const canManage = computed(() => hasPermission("dining-table:manage"));
const loading = ref(false);
const rows = ref<DiningTable[]>([]);
const areas = ref<DiningArea[]>([]);
const loadError = ref("");
const dialogVisible = ref(false);
const editing = ref<DiningTable>();
const query = reactive<{ areaId?: number; status: TableStatus | ""; keyword: string }>({ status: "", keyword: "" });
let loadVersion = 0;

const statusMeta: Record<TableStatus, { label: string; type: "success" | "warning" | "danger" | "info" }> = {
  AVAILABLE: { label: "可用", type: "success" },
  OCCUPIED: { label: "使用中", type: "warning" },
  WAIT_CHECKOUT: { label: "待清台", type: "danger" },
  RESERVED: { label: "已预留", type: "warning" },
  DISABLED: { label: "已停用", type: "info" }
};
function tableStatusMeta(status: TableStatus) {
  return statusMeta[status];
}

function configurable(table: DiningTable) {
  return !table.currentBillId && (table.status === "AVAILABLE" || table.status === "DISABLED");
}
async function load() {
  const version = ++loadVersion;
  loading.value = true;
  loadError.value = "";
  const params: Record<string, unknown> = {};
  if (query.areaId) params.areaId = query.areaId;
  if (query.status) params.status = query.status;
  if (query.keyword.trim()) params.keyword = query.keyword.trim();
  try {
    const [areaResult, tableResult] = await Promise.all([dineInApi.areas(), dineInApi.tables(params)]);
    if (version !== loadVersion) return;
    areas.value = areaResult;
    rows.value = tableResult;
  } catch (error) {
    if (version !== loadVersion) return;
    loadError.value = errorMessage(error);
    rows.value = [];
  } finally {
    if (version === loadVersion) loading.value = false;
  }
}
function createTable() {
  editing.value = undefined;
  dialogVisible.value = true;
}
function editTable(table: DiningTable) {
  if (!configurable(table)) {
    ElMessage.warning("该桌台正在营业、待清台或已预留，暂不能编辑");
    return;
  }
  editing.value = table;
  dialogVisible.value = true;
}
async function deleteTable(table: DiningTable) {
  if (!configurable(table)) {
    ElMessage.warning("该桌台当前不能删除");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除 ${table.areaName} · ${table.tableNo} 吗？存在扫码入口或历史堂食记录时，服务端会拒绝删除。`,
      "删除桌台",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
    await dineInApi.deleteTable(table.id);
    ElMessage.success("桌台已删除");
    await load();
  } catch (error) {
    if (error !== "cancel" && error !== "close") ElMessage.error(errorMessage(error));
  }
}
onMounted(load);
</script>

<template>
  <div class="page dining-tables-page">
    <header class="page-head">
      <div><p class="eyebrow">DINING TABLES</p><h1>桌台管理</h1><p>维护 {{ activeStore?.name }} 的桌号、区域、人数和启停状态。</p></div>
      <el-button v-if="canManage" type="primary" :disabled="!areas.length" @click="createTable">新增桌台</el-button>
    </header>

    <section class="panel table-summary">
      <div><span>全部桌台</span><strong>{{ rows.length }}</strong></div>
      <div><span>当前可用</span><strong>{{ rows.filter(row => row.status === 'AVAILABLE').length }}</strong></div>
      <div><span>营业占用</span><strong>{{ rows.filter(row => row.status === 'OCCUPIED' || row.status === 'WAIT_CHECKOUT').length }}</strong></div>
      <div><span>已停用</span><strong>{{ rows.filter(row => row.status === 'DISABLED').length }}</strong></div>
    </section>

    <section class="panel filter-bar table-filter-bar">
      <el-select v-model="query.areaId" placeholder="全部区域" clearable><el-option v-for="area in areas" :key="area.id" :label="area.name" :value="area.id" /></el-select>
      <el-select v-model="query.status" placeholder="全部状态" clearable>
        <el-option v-for="(meta, status) in statusMeta" :key="status" :label="meta.label" :value="status" />
      </el-select>
      <el-input v-model="query.keyword" placeholder="桌号或桌台名称" clearable @keyup.enter="load" />
      <el-button type="primary" @click="load">查询</el-button>
    </section>

    <el-alert v-if="loadError" title="桌台加载失败" :description="loadError" type="error" show-icon :closable="false">
      <template #default><el-button link type="primary" @click="load">重新加载</el-button></template>
    </el-alert>
    <section v-else v-loading="loading" class="panel table-panel">
      <el-table :data="rows" empty-text="当前筛选条件下暂无桌台">
        <el-table-column prop="tableNo" label="桌号" width="110"><template #default="{ row }"><strong class="table-number">{{ row.tableNo }}</strong></template></el-table-column>
        <el-table-column prop="name" label="桌台名称" min-width="170" />
        <el-table-column prop="areaName" label="所属区域" min-width="130" />
        <el-table-column prop="capacity" label="容纳人数" width="110"><template #default="{ row }">{{ row.capacity }} 人</template></el-table-column>
        <el-table-column prop="sort" label="排序" width="90" />
        <el-table-column label="状态" width="110"><template #default="{ row }"><el-tag :type="tableStatusMeta(row.status).type">{{ tableStatusMeta(row.status).label }}</el-tag></template></el-table-column>
        <el-table-column label="当前业务" min-width="150"><template #default="{ row }"><span v-if="row.currentBillId">账单 #{{ row.currentBillId }}<template v-if="row.guestCount"> · {{ row.guestCount }} 人</template></span><span v-else class="muted">无占用</span></template></el-table-column>
        <el-table-column label="操作" :width="canManage ? 150 : 90" fixed="right"><template #default="{ row }"><template v-if="canManage"><el-button link type="primary" :disabled="!configurable(row)" @click="editTable(row)">编辑</el-button><el-button link type="danger" :disabled="!configurable(row)" @click="deleteTable(row)">删除</el-button></template><span v-else class="muted">只读</span></template></el-table-column>
      </el-table>
    </section>
    <p v-if="canManage" class="table-maintenance-hint">有扫码入口或历史堂食记录的桌台请改为“停用”，系统会保留业务追溯关系。</p>

    <DiningTableFormDialog v-model="dialogVisible" :areas="areas" :table="editing" @saved="load" />
  </div>
</template>
