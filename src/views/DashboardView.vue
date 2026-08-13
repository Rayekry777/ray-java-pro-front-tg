<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { orderApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { OrderSummary } from "@/types";

const loading = ref(false);
const summary = ref<OrderSummary>();
const loadError = ref("");
const freshness = computed(() => summary.value?.updatedAt
  ? new Date(summary.value.updatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--");
async function load(){ loading.value=true; loadError.value=""; try{summary.value=await orderApi.summary();}catch(e){loadError.value=errorMessage(e);ElMessage.error(loadError.value);}finally{loading.value=false;} }
onMounted(load);
</script>
<template>
  <div class="page production-overview" v-loading="loading">
    <header class="page-head"><div><p class="eyebrow">ray-tg · READ ONLY</p><h1>经营总览</h1><p>查看当前门店今日订单汇总。</p></div><div class="title-actions"><span class="aggregate-freshness"><i></i>{{ freshness }} 更新</span><el-button @click="load">刷新</el-button></div></header>
    <el-alert v-if="loadError" title="订单汇总加载失败" :description="loadError" type="error" show-icon :closable="false"/>
    <section class="stats overview-stats">
      <router-link class="stat" to="/orders"><span>今日订单</span><strong>{{ summary?.todayOrders || 0 }}<em>单</em></strong></router-link>
      <router-link class="stat" to="/orders"><span>堂食订单</span><strong>{{ summary?.dineInOrders || 0 }}<em>单</em></strong></router-link>
      <router-link class="stat" to="/orders"><span>自取订单</span><strong>{{ summary?.pickupOrders || 0 }}<em>单</em></strong></router-link>
      <router-link class="stat" to="/orders"><span>未支付订单</span><strong>{{ summary?.unpaidOrders || 0 }}<em>单</em></strong></router-link>
      <router-link class="stat" to="/orders"><span>已支付金额</span><strong>¥{{ Number(summary?.paidAmount || 0).toFixed(2) }}</strong></router-link>
    </section>
    <section class="panel"><h2>当前业务边界</h2><p class="muted">订单中心只提供查看；系统不再处理后厨制作、上桌、交付、清台和人工登记收款。</p></section>
  </div>
</template>
