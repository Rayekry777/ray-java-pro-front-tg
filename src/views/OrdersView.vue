<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { errorMessage } from "@/api/http";
import { orderApi } from "@/api/services";
import type { Order, OrderStatistics } from "@/types";

const loading=ref(false), actionId=ref<number>(), rows=ref<Order[]>([]), total=ref(0), detail=ref<Order>(), detailVisible=ref(false);
const statistics=ref<OrderStatistics>({toBeConfirmed:0,preparing:0,readyForPickup:0});
const query=reactive({page:1,pageSize:10,number:"",pickupPhone:"",status:""});
const statusMap:Record<number,[string,string]>={1:["待付款","info"],2:["待接单","warning"],3:["备餐中","primary"],4:["待取餐","warning"],5:["已取走","success"],6:["已取消","info"]};
async function load(){loading.value=true;try{const [result,stats]=await Promise.all([orderApi.page(query),orderApi.statistics()]);rows.value=result.records;total.value=result.total;statistics.value=stats}catch(e){ElMessage.error(errorMessage(e))}finally{loading.value=false}}
async function showDetail(id:number){try{detail.value=await orderApi.detail(id);detailVisible.value=true}catch(e){ElMessage.error(errorMessage(e))}}
async function act(row:Order,type:"confirm"|"reject"|"cancel"|"ready"|"collected"){
  actionId.value=row.id;
  try{
    if(type==="confirm") await orderApi.confirm(row.id);
    if(type==="ready") await orderApi.readyForPickup(row.id);
    if(type==="collected") await orderApi.collected(row.id);
    if(type==="reject"||type==="cancel"){
      const {value}=await ElMessageBox.prompt(type==="reject"?"请输入拒单原因":"请输入取消原因",type==="reject"?"拒绝订单":"取消订单",{inputValidator:v=>Boolean(v.trim())||"原因不能为空"});
      if(type==="reject") await orderApi.reject(row.id,value); else await orderApi.cancel(row.id,value);
    }
    ElMessage.success("订单状态已更新");await load();
  }catch(e){if(e!=="cancel"&&e!=="close")ElMessage.error(errorMessage(e))}finally{actionId.value=undefined}
}
onMounted(load);
</script>
<template><div class="page">
  <div class="page-title compact"><div><p class="eyebrow">TAKEAWAY ORDERS</p><h1>外带订单</h1><p>处理接单、备餐、通知取餐和取走流程。</p></div></div>
  <section class="order-summary"><article><span>待接单</span><strong>{{statistics.toBeConfirmed}}</strong></article><article><span>备餐中</span><strong>{{statistics.preparing}}</strong></article><article><span>待取餐</span><strong>{{statistics.readyForPickup}}</strong></article></section>
  <section class="panel filter-bar"><el-input v-model="query.number" placeholder="订单号" clearable/><el-input v-model="query.pickupPhone" placeholder="取餐手机号" clearable/><el-select v-model="query.status" placeholder="订单状态" clearable><el-option v-for="(v,k) in statusMap" :key="k" :label="v[0]" :value="String(k)"/></el-select><el-button type="primary" @click="query.page=1;load()">查询</el-button></section>
  <section class="panel table-panel">
    <el-table :data="rows" v-loading="loading" empty-text="没有符合条件的订单">
      <el-table-column prop="number" label="订单号" min-width="130"/><el-table-column label="状态" width="100"><template #default="{row}"><el-tag :type="statusMap[row.status]?.[1]||'info'">{{statusMap[row.status]?.[0]||"未知"}}</el-tag></template></el-table-column>
      <el-table-column prop="orderDishes" label="菜品" min-width="190" show-overflow-tooltip/><el-table-column prop="pickupCode" label="取餐码" width="90"/><el-table-column prop="pickupName" label="取餐人" width="100"/><el-table-column prop="pickupPhone" label="手机号" width="130"/><el-table-column label="金额" width="100"><template #default="{row}">¥{{row.amount?.toFixed(2)}}</template></el-table-column><el-table-column prop="orderTime" label="下单时间" width="170"/>
      <el-table-column label="操作" fixed="right" width="285"><template #default="{row}"><el-button link @click="showDetail(row.id)">详情</el-button><el-button v-if="row.status===2" link type="primary" :loading="actionId===row.id" @click="act(row,'confirm')">接单</el-button><el-button v-if="row.status===2" link type="danger" @click="act(row,'reject')">拒单</el-button><el-button v-if="row.status===3" link type="primary" @click="act(row,'ready')">备餐完成</el-button><el-button v-if="row.status===4" link type="success" @click="act(row,'collected')">确认取走</el-button><el-button v-if="[1,2,3].includes(row.status)" link type="danger" @click="act(row,'cancel')">取消</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" layout="total, prev, pager, next" :total="total" @current-change="load"/>
  </section>
  <el-drawer v-model="detailVisible" title="外带订单详情" size="min(520px, 92vw)"><el-descriptions v-if="detail" :column="1" border><el-descriptions-item label="订单号">{{detail.number}}</el-descriptions-item><el-descriptions-item label="取餐码">{{detail.pickupCode||"待生成"}}</el-descriptions-item><el-descriptions-item label="菜品">{{detail.orderDishes}}</el-descriptions-item><el-descriptions-item label="金额">¥{{detail.amount}}</el-descriptions-item><el-descriptions-item label="取餐联系人">{{detail.pickupName}} · {{detail.pickupPhone}}</el-descriptions-item><el-descriptions-item label="预计取餐">{{detail.estimatedPickupTime||"尽快取餐"}}</el-descriptions-item><el-descriptions-item label="备注">{{detail.remark||"无"}}</el-descriptions-item></el-descriptions></el-drawer>
</div></template>
