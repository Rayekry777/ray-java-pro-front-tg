<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { dineInApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { DiningArea, DiningTable, TableStatus } from "@/types";

const router=useRouter(), loading=ref(false), opening=ref(false), error=ref("");
const areas=ref<DiningArea[]>([]), tables=ref<DiningTable[]>([]), activeArea=ref<number>(), openVisible=ref(false), selected=ref<DiningTable>();
const openForm=reactive({guestCount:2,remark:""});
const statusMap:Record<TableStatus,[string,string]>={AVAILABLE:["空闲","success"],OCCUPIED:["就餐中","primary"],WAIT_CHECKOUT:["待结账","warning"],RESERVED:["已预订","info"],DISABLED:["已停用","info"]};
const filtered=computed(()=>activeArea.value?tables.value.filter(t=>t.areaId===activeArea.value):tables.value);
const counts=computed(()=>({available:tables.value.filter(t=>t.status==="AVAILABLE").length,occupied:tables.value.filter(t=>t.status==="OCCUPIED").length,checkout:tables.value.filter(t=>t.status==="WAIT_CHECKOUT").length}));
async function load(){loading.value=true;error.value="";try{[areas.value,tables.value]=await Promise.all([dineInApi.areas(),dineInApi.tables()])}catch(e){error.value=errorMessage(e)}finally{loading.value=false}}
function choose(table:DiningTable){if(table.status==="AVAILABLE"){selected.value=table;openForm.guestCount=Math.min(2,table.capacity);openForm.remark="";openVisible.value=true}else if(table.currentOrderId)router.push({path:"/dine-in/orders",query:{orderId:table.currentOrderId}})}
async function openTable(){if(!selected.value)return;opening.value=true;try{const result=await dineInApi.openTable(selected.value.id,openForm);ElMessage.success(`${selected.value.name}已开台`);openVisible.value=false;router.push({path:"/dine-in/orders",query:{orderId:result.orderId}})}catch(e){ElMessage.error(errorMessage(e))}finally{opening.value=false}}
onMounted(load);
</script>
<template><div class="page">
  <header class="page-head"><div><p class="eyebrow">DINING ROOM</p><h1>桌台管理</h1><p>查看桌台状态，快速开台或进入当前堂食订单。</p></div><el-button @click="load">刷新桌台</el-button></header>
  <section class="order-summary"><article><span>空闲</span><strong>{{counts.available}}</strong></article><article><span>就餐中</span><strong>{{counts.occupied}}</strong></article><article><span>待结账</span><strong>{{counts.checkout}}</strong></article></section>
  <el-alert v-if="error" title="桌台数据加载失败" :description="error" type="error" show-icon><template #default><el-button @click="load">重试</el-button></template></el-alert>
  <section class="panel area-filter"><button :class="{active:!activeArea}" @click="activeArea=undefined">全部区域</button><button v-for="area in areas" :key="area.id" :class="{active:activeArea===area.id}" @click="activeArea=area.id">{{area.name}}</button></section>
  <section v-loading="loading" class="table-map">
    <button v-for="table in filtered" :key="table.id" class="dining-table" :class="table.status.toLowerCase()" :disabled="table.status==='DISABLED'" @click="choose(table)">
      <span>{{table.areaName}}</span><strong>{{table.name}}</strong><small>{{table.capacity}}人桌</small><el-tag :type="statusMap[table.status][1] as any" effect="plain">{{statusMap[table.status][0]}}</el-tag><em v-if="table.guestCount">{{table.guestCount}}人 · {{table.openedAt?.slice(11,16)}}</em>
    </button>
    <el-empty v-if="!loading&&!filtered.length" description="当前区域暂无桌台"/>
  </section>
  <el-dialog v-model="openVisible" :title="`开台 · ${selected?.name||''}`" width="min(460px,92vw)"><el-form label-position="top"><el-form-item label="就餐人数" required><el-input-number v-model="openForm.guestCount" :min="1" :max="selected?.capacity||20"/></el-form-item><el-form-item label="备注"><el-input v-model="openForm.remark" type="textarea" maxlength="100" show-word-limit/></el-form-item></el-form><template #footer><el-button @click="openVisible=false">取消</el-button><el-button type="primary" :loading="opening" @click="openTable">确认开台</el-button></template></el-dialog>
</div></template>
