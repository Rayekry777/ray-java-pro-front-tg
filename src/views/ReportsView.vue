<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Download, Refresh } from "@element-plus/icons-vue";
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";
import VChart from "vue-echarts";
import { reportApi } from "@/api/services";
import { errorMessage, errorStatus } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import type { OrderReport, SalesTop10Report, TurnoverReport, UserReport } from "@/types";

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent]);

const merchantSession = useMerchantSession();
const loading = ref(false);
const exporting = ref(false);
const error = ref("");
const quickRange = ref<number | null>(30);
const range = ref<[Date, Date]>([daysAgo(29), startOfToday()]);
const turnover = ref<TurnoverReport>();
const orders = ref<OrderReport>();
const top10 = ref<SalesTop10Report>();
const users = ref<UserReport>();
let loadSequence = 0;

const begin = computed(() => formatDate(range.value[0]));
const end = computed(() => formatDate(range.value[1]));
const totalTurnover = computed(() => sum(turnover.value?.turnoverList));
const averageOrder = computed(() => orders.value?.validOrderCount
  ? totalTurnover.value / orders.value.validOrderCount
  : 0);
const newUserCount = computed(() => sum(users.value?.newUserList));
const hasData = computed(() => Boolean(
  totalTurnover.value > 0
  || sum(orders.value?.orderCountList) > 0
  || sum(top10.value?.numberList) > 0
  || sum(users.value?.totalUserList) > 0
));

const baseChart: EChartsOption = {
  animationDuration: 220,
  grid: { left: 12, right: 18, top: 18, bottom: 36, containLabel: true },
  textStyle: { fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei UI, sans-serif" }
};
const turnoverOption = computed<EChartsOption>(() => lineOption(
  turnover.value?.dateList || [], turnover.value?.turnoverList || [], "营业额", "¥", "#b88945"
));
const orderOption = computed<EChartsOption>(() => ({
  ...baseChart,
  tooltip: { trigger: "axis" },
  legend: { bottom: 0, data: ["全部订单", "有效订单"] },
  xAxis: { type: "category", boundaryGap: false, data: orders.value?.dateList || [] },
  yAxis: { type: "value", minInterval: 1 },
  series: [
    { name: "全部订单", type: "line", smooth: true, data: orders.value?.orderCountList || [], itemStyle: { color: "#244b66" }, areaStyle: { color: "rgba(36,75,102,.08)" } },
    { name: "有效订单", type: "line", smooth: true, data: orders.value?.validOrderCountList || [], itemStyle: { color: "#5b8c73" }, areaStyle: { color: "rgba(91,140,115,.08)" } }
  ]
}));
const top10Option = computed<EChartsOption>(() => ({
  ...baseChart,
  grid: { left: 12, right: 28, top: 12, bottom: 12, containLabel: true },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  xAxis: { type: "value", minInterval: 1 },
  yAxis: { type: "category", inverse: true, data: top10.value?.nameList || [], axisLabel: { width: 108, overflow: "truncate" } },
  series: [{ name: "销量", type: "bar", barMaxWidth: 20, data: top10.value?.numberList || [], itemStyle: { color: "#b88945", borderRadius: [0, 4, 4, 0] } }]
}));
const userOption = computed<EChartsOption>(() => ({
  ...baseChart,
  tooltip: { trigger: "axis" },
  legend: { bottom: 0, data: ["顾客总量", "新增顾客"] },
  xAxis: { type: "category", boundaryGap: false, data: users.value?.dateList || [] },
  yAxis: { type: "value", minInterval: 1 },
  series: [
    { name: "顾客总量", type: "line", smooth: true, data: users.value?.totalUserList || [], itemStyle: { color: "#244b66" } },
    { name: "新增顾客", type: "line", smooth: true, data: users.value?.newUserList || [], itemStyle: { color: "#c86f4a" } }
  ]
}));

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysAgo(days: number) {
  const date = startOfToday();
  date.setDate(date.getDate() - days);
  return date;
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sum(values?: number[]) {
  return (values || []).reduce((total, value) => total + Number(value || 0), 0);
}

function lineOption(dates: string[], values: number[], name: string, unit: string, color: string): EChartsOption {
  return {
    ...baseChart,
    tooltip: { trigger: "axis", valueFormatter: (value: unknown) => `${unit}${Number(value || 0).toFixed(2)}` },
    xAxis: { type: "category", boundaryGap: false, data: dates },
    yAxis: { type: "value", axisLabel: { formatter: (value: number) => `${unit}${value}` } },
    series: [{ name, type: "line", smooth: true, data: values, itemStyle: { color }, lineStyle: { width: 3 }, areaStyle: { color: `${color}18` } }]
  };
}

function setQuickRange(days: number) {
  quickRange.value = days;
  range.value = [daysAgo(days - 1), startOfToday()];
  void load();
}

function setCustomRange() {
  quickRange.value = null;
  void load();
}

function resetReportData() {
  turnover.value = undefined;
  orders.value = undefined;
  top10.value = undefined;
  users.value = undefined;
}

function failureMessage(reason: unknown) {
  const status = errorStatus(reason);
  if (status === 401) return "登录状态已失效，正在返回登录页";
  if (status === 403) return "当前账号没有经营报表权限";
  return errorMessage(reason);
}

async function load() {
  const sequence = ++loadSequence;
  loading.value = true;
  error.value = "";
  resetReportData();
  const results = await Promise.allSettled([
    reportApi.turnover(begin.value, end.value),
    reportApi.orders(begin.value, end.value),
    reportApi.top10(begin.value, end.value),
    reportApi.users(begin.value, end.value)
  ]);
  if (sequence !== loadSequence) return;

  const [turnoverResult, ordersResult, top10Result, usersResult] = results;
  const failures: string[] = [];
  if (turnoverResult.status === "fulfilled") turnover.value = turnoverResult.value; else failures.push("营业额");
  if (ordersResult.status === "fulfilled") orders.value = ordersResult.value; else failures.push("订单");
  if (top10Result.status === "fulfilled") top10.value = top10Result.value; else failures.push("销量");
  if (usersResult.status === "fulfilled") users.value = usersResult.value; else failures.push("顾客");
  if (failures.length) {
    const rejected = results.find(result => result.status === "rejected");
    const reason = rejected?.status === "rejected" ? rejected.reason : undefined;
    error.value = `${failures.join("、")}数据加载失败：${failureMessage(reason)}`;
  }
  loading.value = false;
}

async function exportReport() {
  exporting.value = true;
  try {
    const response = await reportApi.exportFile(begin.value, end.value);
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `经营报表-${begin.value}-${end.value}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    ElMessage.success("报表已导出");
  } catch (requestError) {
    ElMessage.error(failureMessage(requestError));
  } finally {
    exporting.value = false;
  }
}

onMounted(() => void load());
</script>

<template>
  <div class="page reports-page" v-loading="loading">
    <header class="page-head reports-head">
      <div>
        <p class="eyebrow">REPORTS · {{ merchantSession.activeStore.value?.name || "当前门店" }}</p>
        <h1>经营报表</h1>
        <p>查看营业额、订单、商品销量和顾客增长趋势。</p>
      </div>
      <div class="title-actions">
        <span class="aggregate-freshness"><i></i>{{ begin }} 至 {{ end }}</span>
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
        <el-button v-if="merchantSession.hasPermission('report:export')" type="primary" :icon="Download" :loading="exporting" @click="exportReport">导出</el-button>
      </div>
    </header>

    <el-alert v-if="error" title="部分报表加载失败" :description="error" type="error" show-icon :closable="false" />

    <section class="panel reports-filter-bar">
      <div class="report-quick-ranges" role="group" aria-label="快速日期范围">
        <button type="button" :class="{ active: quickRange === 7 }" :aria-pressed="quickRange === 7" @click="setQuickRange(7)">近 7 天</button>
        <button type="button" :class="{ active: quickRange === 30 }" :aria-pressed="quickRange === 30" @click="setQuickRange(30)">近 30 天</button>
        <button type="button" :class="{ active: quickRange === 90 }" :aria-pressed="quickRange === 90" @click="setQuickRange(90)">近 90 天</button>
      </div>
      <div class="report-date-range">
        <el-date-picker v-model="range" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :clearable="false" @change="setCustomRange" />
      </div>
      <span class="report-scope">顾客数据按当前租户统计</span>
    </section>

    <section class="stats report-stats">
      <article class="stat report-stat-primary"><span>营业额</span><strong>¥{{ totalTurnover.toFixed(2) }}</strong><small>已支付有效订单</small></article>
      <article class="stat"><span>有效订单</span><strong>{{ orders?.validOrderCount || 0 }}<em>单</em></strong><small>共 {{ orders?.totalOrderCount || 0 }} 笔订单</small></article>
      <article class="stat"><span>订单完成率</span><strong>{{ ((orders?.orderCompletionRate || 0) * 100).toFixed(1) }}<em>%</em></strong><small>有效订单 / 全部订单</small></article>
      <article class="stat"><span>客单价</span><strong>¥{{ averageOrder.toFixed(2) }}</strong><small>按有效订单计算</small></article>
      <article class="stat"><span>新增顾客</span><strong>{{ newUserCount }}<em>人</em></strong><small>租户范围</small></article>
    </section>

    <div v-if="!loading && !hasData" class="panel reports-empty"><el-empty description="当前日期范围暂无报表数据" /></div>
    <section v-else class="report-chart-grid">
      <article class="panel report-chart-panel"><header><div><h2>营业额趋势</h2><p>按日统计已支付营业额</p></div><el-tag type="warning" effect="plain">营业额</el-tag></header><VChart class="report-chart" :option="turnoverOption" autoresize /></article>
      <article class="panel report-chart-panel"><header><div><h2>订单趋势</h2><p>全部订单与有效订单对比</p></div><el-tag type="info" effect="plain">订单</el-tag></header><VChart class="report-chart" :option="orderOption" autoresize /></article>
      <article class="panel report-chart-panel"><header><div><h2>商品销量 Top10</h2><p>已支付有效订单商品数量</p></div><el-tag type="success" effect="plain">销量</el-tag></header><VChart class="report-chart report-chart-top" :option="top10Option" autoresize /></article>
      <article class="panel report-chart-panel"><header><div><h2>顾客增长</h2><p>租户顾客总量与新增数量</p></div><el-tag type="danger" effect="plain">顾客</el-tag></header><VChart class="report-chart" :option="userOption" autoresize /></article>
    </section>
  </div>
</template>
