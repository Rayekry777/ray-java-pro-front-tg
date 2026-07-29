<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { dineInApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { KitchenItem, KitchenItemStatus } from "@/types";

const loading=ref(false), actionId=ref<number>(), items=ref<KitchenItem[]>([]), active=ref<KitchenItemStatus|"ALL">("ALL");
const columns=[["PENDING","待制作"],["COOKING","制作中"],["READY","待上菜"]] as const;
const visibleColumns=computed(()=>active.value==="ALL"?columns:columns.filter(c=>c[0]===active.value));
function byStatus(status:string){return items.value.filter(item=>item.status===status)}
async function load(){loading.value=true;try{items.value=await dineInApi.kitchenItems()}catch(e){ElMessage.error(errorMessage(e))}finally{loading.value=false}}
async function next(item:KitchenItem){actionId.value=item.id;try{if(item.status==="PENDING")await dineInApi.startItem(item.id);if(item.status==="COOKING")await dineInApi.readyItem(item.id);if(item.status==="READY")await dineInApi.serveItem(item.id);ElMessage.success("出餐状态已更新");await load()}catch(e){ElMessage.error(errorMessage(e))}finally{actionId.value=undefined}}
onMounted(load);
</script>
<template><div class="page">
  <div class="page-title compact"><div><p class="eyebrow">KITCHEN PASS</p><h1>出餐管理</h1><p>按制作状态推进菜品，制作完成后交由服务员确认上菜。</p></div><el-button @click="load">刷新</el-button></div>
  <section class="panel kitchen-filter"><el-radio-group v-model="active"><el-radio-button label="全部" value="ALL"/><el-radio-button label="待制作" value="PENDING"/><el-radio-button label="制作中" value="COOKING"/><el-radio-button label="待上菜" value="READY"/></el-radio-group></section>
  <section v-loading="loading" class="kitchen-board">
    <article v-for="[status,label] in visibleColumns" :key="status" class="kitchen-column"><header><h2>{{label}}</h2><span>{{byStatus(status).length}}</span></header>
      <div class="kitchen-cards"><div v-for="item in byStatus(status)" :key="item.id" class="kitchen-card"><div><strong>{{item.tableName}}</strong><small>#{{item.orderNo}}</small></div><h3>{{item.name}} <em>×{{item.quantity}}</em></h3><p v-if="item.flavors">{{item.flavors}}</p><p v-if="item.remark" class="kitchen-note">备注：{{item.remark}}</p><footer><time>{{item.submittedAt?.slice(11,16)}}</time><el-button type="primary" :loading="actionId===item.id" @click="next(item)">{{status==="PENDING"?"开始制作":status==="COOKING"?"制作完成":"确认上菜"}}</el-button></footer></div><el-empty v-if="!byStatus(status).length" :description="`暂无${label}菜品`"/></div>
    </article>
  </section>
</div></template>
