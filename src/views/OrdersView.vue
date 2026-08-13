<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { orderApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { FoodOrder, OrderServiceMode, PageResult } from "@/types";

const loading = ref(false);
const page = ref<PageResult<FoodOrder>>({ total: 0, records: [] });
const query = reactive<{page:number;size:number;serviceMode:OrderServiceMode|"";orderStatus:string;paymentStatus:string;keyword:string}>({ page: 1, size: 20, serviceMode: "", orderStatus: "", paymentStatus: "", keyword: "" });
const modeLabel = (mode: string) => mode === "DINE_IN" ? "堂食" : "自取";
const orderLabel = (status: string) => status === "CANCELLED" ? "已取消" : "已下单";
const paymentLabel = (status: string) => status === "PAID" ? "已支付" : status === "REFUNDED" ? "已退款" : "未支付";
async function load() {
  loading.value = true;
  try { page.value = await orderApi.page(query); }
  catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="page" v-loading="loading">
    <header class="page-head"><div><p class="eyebrow">ORDERS</p><h1>订单中心</h1><p>只读查看顾客提交的堂食和自取独立订单。</p></div></header>
    <section class="panel filter-bar">
      <el-input v-model="query.keyword" placeholder="订单号或桌台" clearable @keyup.enter="query.page=1;load()" />
      <el-select v-model="query.serviceMode" placeholder="用餐方式" clearable><el-option label="堂食" value="DINE_IN"/><el-option label="自取" value="PICKUP"/></el-select>
      <el-select v-model="query.orderStatus" placeholder="订单状态" clearable><el-option label="已下单" value="PLACED"/><el-option label="已取消" value="CANCELLED"/></el-select>
      <el-select v-model="query.paymentStatus" placeholder="支付状态" clearable><el-option label="未支付" value="UNPAID"/><el-option label="已支付" value="PAID"/><el-option label="已退款" value="REFUNDED"/></el-select>
      <el-button type="primary" @click="query.page=1;load()">查询</el-button>
    </section>
    <section class="panel desktop-data-table">
      <el-table :data="page.records">
        <el-table-column prop="orderNo" label="订单号" min-width="190"/>
        <el-table-column label="方式" width="90"><template #default="{row}">{{ modeLabel(row.serviceMode) }}</template></el-table-column>
        <el-table-column label="桌台/自取" min-width="150"><template #default="{row}">{{ row.serviceMode==='DINE_IN' ? (row.tableName || row.tableNo) : (row.pickupName || '到店自取') }}</template></el-table-column>
        <el-table-column label="订单状态" width="100"><template #default="{row}"><el-tag>{{ orderLabel(row.orderStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="支付状态" width="100"><template #default="{row}"><el-tag :type="row.paymentStatus==='PAID'?'success':'warning'">{{ paymentLabel(row.paymentStatus) }}</el-tag></template></el-table-column>
        <el-table-column label="应付金额" width="120"><template #default="{row}">¥{{ Number(row.payableAmount).toFixed(2) }}</template></el-table-column>
        <el-table-column prop="placedAt" label="下单时间" min-width="170"/>
        <el-table-column label="详情" width="90"><template #default="{row}"><router-link :to="`/orders/${row.id}`">查看</router-link></template></el-table-column>
      </el-table>
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.size" :total="page.total" layout="total, prev, pager, next" @current-change="load"/>
    </section>
    <section class="mobile-card-list" aria-label="订单列表">
      <router-link v-for="row in page.records" :key="row.id" class="mobile-data-card" :to="`/orders/${row.id}`">
        <header><strong>{{ row.orderNo }}</strong><span class="service-chip">{{ modeLabel(row.serviceMode) }}</span></header>
        <p>{{ row.serviceMode==='DINE_IN' ? (row.tableName || row.tableNo) : (row.pickupName || '到店自取') }}</p>
        <dl>
          <div><dt>订单</dt><dd>{{ orderLabel(row.orderStatus) }}</dd></div>
          <div><dt>支付</dt><dd>{{ paymentLabel(row.paymentStatus) }}</dd></div>
          <div><dt>金额</dt><dd class="money">¥{{ Number(row.payableAmount).toFixed(2) }}</dd></div>
        </dl>
        <footer><time>{{ row.placedAt }}</time><span>查看详情</span></footer>
      </router-link>
      <el-empty v-if="!page.records.length" description="暂无订单" />
      <el-pagination v-model:current-page="query.page" v-model:page-size="query.size" :total="page.total" layout="prev, pager, next" @current-change="load"/>
    </section>
  </div>
</template>
