<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { orderApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { FoodOrder } from "@/types";
const route = useRoute();
const loading = ref(false);
const order = ref<FoodOrder>();
async function load(){ loading.value=true; try{order.value=await orderApi.detail(Number(route.params.id));}catch(e){ElMessage.error(errorMessage(e));}finally{loading.value=false;} }
onMounted(load);
</script>
<template>
  <div class="page" v-loading="loading">
    <header class="page-head"><div><p class="eyebrow">ORDER · {{ order?.orderNo }}</p><h1>订单详情</h1><p>当前页面仅查看订单，不提供制作、上桌、收款、交付或清台动作。</p></div><router-link to="/orders">返回订单中心</router-link></header>
    <template v-if="order">
      <section class="panel detail-grid">
        <div><span>订单状态</span><strong>{{ order.orderStatus==='PLACED'?'已下单':'已取消' }}</strong></div>
        <div><span>支付状态</span><strong>{{ order.paymentStatus==='PAID'?'已支付':order.paymentStatus==='REFUNDED'?'已退款':'未支付' }}</strong></div>
        <div><span>用餐方式</span><strong>{{ order.serviceMode==='DINE_IN'?'堂食':'自取' }}</strong></div>
        <div><span>桌台/自取</span><strong>{{ order.serviceMode==='DINE_IN'?(order.tableName||order.tableNo):(order.pickupName||'到店自取') }}</strong></div>
        <div><span>下单时间</span><strong>{{ order.placedAt }}</strong></div>
        <div><span>应付金额</span><strong>¥{{ Number(order.payableAmount).toFixed(2) }}</strong></div>
      </section>
      <section class="panel order-items-panel"><h2>商品明细</h2><el-table class="desktop-data-table" :data="order.items"><el-table-column prop="name" label="商品"/><el-table-column prop="dishFlavor" label="口味"/><el-table-column prop="quantity" label="数量" width="90"/><el-table-column label="金额" width="120"><template #default="{row}">¥{{ Number(row.amount).toFixed(2) }}</template></el-table-column><el-table-column prop="remark" label="备注"/></el-table>
        <div class="mobile-order-items"><article v-for="item in order.items" :key="item.id" class="mobile-order-item"><div><strong>{{ item.name }}</strong><small>{{ item.dishFlavor || item.remark || "标准口味" }}</small></div><span>× {{ item.quantity }}</span><b>¥{{ Number(item.amount).toFixed(2) }}</b></article></div>
      </section>
    </template>
  </div>
</template>
