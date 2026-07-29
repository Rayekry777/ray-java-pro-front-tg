<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { dineInApi, orderApi, workspaceApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { BusinessData, DineInOverview, OrderStatistics } from "@/types";

const loading=ref(false), switching=ref(false), refreshedAt=ref(""), errors=ref<string[]>([]);
const business=ref<BusinessData>(), dineIn=ref<DineInOverview>(), takeaway=ref<OrderStatistics>(), shopStatus=ref(0);
const metrics=computed(()=>[
  ["今日总营业额",`¥${(business.value?.turnover||0).toLocaleString("zh-CN",{minimumFractionDigits:2})}`,"全店"],
  ["今日有效订单",String(business.value?.validOrderCount||0),"堂食 + 外带"],
  ["平均客单价",`¥${(business.value?.unitPrice||0).toFixed(2)}`,"全渠道"],
  ["在店桌台",String(dineIn.value?.occupiedTables||0),"桌"],
  ["待取餐",String(takeaway.value?.readyForPickup||0),"单"]
]);
async function load(){
  loading.value=true;errors.value=[];
  const results=await Promise.allSettled([workspaceApi.business(),workspaceApi.shopStatus(),orderApi.statistics(),dineInApi.overview()]);
  if(results[0].status==="fulfilled")business.value=results[0].value;else errors.value.push(`经营数据：${errorMessage(results[0].reason)}`);
  if(results[1].status==="fulfilled")shopStatus.value=results[1].value;else errors.value.push(`店铺状态：${errorMessage(results[1].reason)}`);
  if(results[2].status==="fulfilled")takeaway.value=results[2].value;else errors.value.push(`外带数据：${errorMessage(results[2].reason)}`);
  if(results[3].status==="fulfilled")dineIn.value=results[3].value;else errors.value.push(`堂食数据：${errorMessage(results[3].reason)}`);
  refreshedAt.value=new Date().toLocaleTimeString("zh-CN",{hour12:false});loading.value=false;
}
async function toggleShop(){const next=shopStatus.value?0:1;switching.value=true;try{await workspaceApi.setShopStatus(next);shopStatus.value=next;window.dispatchEvent(new Event("ray:shop-business-changed"));ElMessage.success("店铺状态已更新")}catch(e){ElMessage.error(errorMessage(e))}finally{switching.value=false}}
onMounted(load);
</script>
<template><div class="page dashboard-overview" v-loading="loading">
  <div class="page-title compact"><div><p class="eyebrow">RESTAURANT OVERVIEW</p><h1>全店工作台</h1><p>统一关注堂食桌台、后厨出餐与外带取餐。</p></div><div class="title-actions"><span class="freshness">更新于 {{refreshedAt||"--:--:--"}}</span><el-button @click="load">刷新数据</el-button><div class="business-switch"><span class="status-dot" :class="{off:!shopStatus}"></span><div><small>全店营业状态</small><strong>{{shopStatus?"营业中":"已打烊"}}</strong></div><button class="switch" :class="{off:!shopStatus}" :disabled="switching" role="switch" :aria-checked="Boolean(shopStatus)" @click="toggleShop"><span></span></button></div></div></div>
  <el-alert v-if="errors.length" title="部分运营数据暂不可用" :description="errors.join('；')" type="warning" show-icon :closable="false"/>
  <section class="metrics dashboard-metrics"><article v-for="[label,value,note] in metrics" :key="label"><span>{{label}}</span><strong>{{value}}</strong><small>{{note}}</small></article></section>
  <section class="channel-grid">
    <article class="channel-card dine-channel"><header><div><p class="eyebrow">DINE-IN</p><h2>堂食运营</h2></div><router-link to="/dine-in/tables">进入桌台 →</router-link></header><div class="channel-stats"><div><span>空闲桌</span><strong>{{dineIn?.availableTables||0}}</strong></div><div><span>就餐中</span><strong>{{dineIn?.occupiedTables||0}}</strong></div><div><span>待结账</span><strong>{{dineIn?.waitingCheckoutTables||0}}</strong></div><div class="urgent-stat"><span>待上菜</span><strong>{{dineIn?.readyToServeItems||0}}</strong></div></div><footer><router-link class="button primary" to="/dine-in/tables">开台 / 桌台</router-link><router-link class="button secondary" to="/dine-in/orders">堂食订单</router-link><router-link class="button secondary" to="/dine-in/kitchen">出餐管理</router-link></footer></article>
    <article class="channel-card delivery-channel"><header><div><p class="eyebrow">TAKEAWAY</p><h2>外带运营</h2></div><router-link to="/takeaway/orders">进入订单 →</router-link></header><div class="channel-stats"><div><span>待接单</span><strong>{{takeaway?.toBeConfirmed||0}}</strong></div><div><span>备餐中</span><strong>{{takeaway?.preparing||0}}</strong></div><div><span>待取餐</span><strong>{{takeaway?.readyForPickup||0}}</strong></div><div><span>今日有效订单</span><strong>{{business?.validOrderCount||0}}</strong></div></div><footer><router-link class="button primary" to="/takeaway/orders">处理外带订单</router-link><router-link class="button secondary" to="/reports">查看经营报表</router-link></footer></article>
  </section>
  <section class="panel attention-strip"><div><p class="eyebrow">NOW</p><h2>当前需要关注</h2></div><ul><li><strong>{{dineIn?.waitingKitchenItems||0}}</strong><span>道菜等待制作</span></li><li><strong>{{dineIn?.readyToServeItems||0}}</strong><span>道菜等待上桌</span></li><li><strong>{{takeaway?.toBeConfirmed||0}}</strong><span>笔外带等待接单</span></li></ul></section>
</div></template>
