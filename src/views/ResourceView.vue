<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { errorMessage } from "@/api/http";
import { resourceApi } from "@/api/services";
import DishFormDialog from "@/components/DishFormDialog.vue";
import EntityFormDialog from "@/components/EntityFormDialog.vue";
import SetmealFormDialog from "@/components/SetmealFormDialog.vue";
import { useMerchantSession } from "@/session/merchantSession";

const props=defineProps<{kind:"dishes"|"setmeals"|"categories"|"employees"}>();
const { hasPermission }=useMerchantSession();
const canManage=computed(()=>hasPermission(props.kind==="employees"?"employee:manage":"product:manage"));
const config=computed(()=>({
  dishes:{title:"菜品管理",eyebrow:"DISHES",search:"菜品名称"},
  setmeals:{title:"套餐管理",eyebrow:"SETMEALS",search:"套餐名称"},
  categories:{title:"分类管理",eyebrow:"CATEGORIES",search:"分类名称"},
  employees:{title:"员工管理",eyebrow:"EMPLOYEES",search:"员工姓名"}
}[props.kind]));
const loading=ref(false), changing=ref<number>(),rows=ref<any[]>([]),total=ref(0);const query=reactive({page:1,pageSize:10,name:"",status:""});
const dishDialog=ref(false), editingDishId=ref<number>();
const setmealDialog=ref(false),editingSetmealId=ref<number>(),entityDialog=ref(false),entityKind=ref<"categories"|"employees"|"password">("categories"),editingEntity=ref<any>();
const selected=ref<any[]>([]);
let loadVersion=0;
async function load(){
  const version=++loadVersion;
  loading.value=true;
  try{
    const result=await resourceApi[props.kind](query);
    if(version!==loadVersion)return;
    rows.value=result.records;
    total.value=result.total;
  }catch(e){
    if(version===loadVersion)ElMessage.error(errorMessage(e));
  }finally{
    if(version===loadVersion)loading.value=false;
  }
}
async function toggle(row:any){changing.value=row.id;const next=row.status===1?0:1;try{if(props.kind==="dishes")await resourceApi.dishStatus(row.id,next);if(props.kind==="setmeals")await resourceApi.setmealStatus(row.id,next);if(props.kind==="categories")await resourceApi.categoryStatus(row.id,next);if(props.kind==="employees")await resourceApi.employeeStatus(row.id,next);ElMessage.success("状态已更新");await load()}catch(e){ElMessage.error(errorMessage(e))}finally{changing.value=undefined}}
watch(()=>props.kind,()=>{
  loadVersion++;
  rows.value=[];
  total.value=0;
  selected.value=[];
  changing.value=undefined;
  query.page=1;
  query.name="";
  query.status="";
  load();
});onMounted(load);
function createDish(){editingDishId.value=undefined;dishDialog.value=true}
function editDish(id:number){editingDishId.value=id;dishDialog.value=true}
function createCurrent(){if(props.kind==="dishes")return createDish();if(props.kind==="setmeals"){editingSetmealId.value=undefined;setmealDialog.value=true;return}entityKind.value=props.kind as "categories"|"employees";editingEntity.value=undefined;entityDialog.value=true}
function editCurrent(row:any){if(props.kind==="dishes")return editDish(row.id);if(props.kind==="setmeals"){editingSetmealId.value=row.id;setmealDialog.value=true;return}entityKind.value=props.kind as "categories"|"employees";editingEntity.value=row;entityDialog.value=true}
function password(row:any){entityKind.value="password";editingEntity.value=row;entityDialog.value=true}
async function removeRows(targets:any[]){
  if(!targets.length)return;await ElMessageBox.confirm(`确定删除选中的 ${targets.length} 条数据吗？删除后不可恢复。`,"删除确认",{type:"warning",confirmButtonText:"删除",cancelButtonText:"取消"});
  try{
    if(props.kind==="dishes")await resourceApi.deleteDishes(targets.map(x=>x.id));
    if(props.kind==="setmeals")await resourceApi.deleteSetmeals(targets.map(x=>x.id));
    if(props.kind==="categories")await resourceApi.deleteCategory(targets[0].id);
    ElMessage.success("删除成功");selected.value=[];await load();
  }catch(e){if(e!=="cancel"&&e!=="close")ElMessage.error(errorMessage(e))}
}
</script>
<template><div class="page"><div class="page-title compact"><div><p class="eyebrow">{{config.eyebrow}}</p><h1>{{config.title}}</h1><p>数据来源于管理端真实分页接口。</p></div><div v-if="canManage" class="title-actions"><el-button v-if="['dishes','setmeals'].includes(kind)" type="danger" plain :disabled="!selected.length" @click="removeRows(selected)">批量删除</el-button><el-button type="primary" @click="createCurrent">新增{{config.title.replace('管理','')}}</el-button></div></div>
  <nav v-if="kind!=='employees'" class="resource-tabs" aria-label="商品管理分区"><router-link to="/products/dishes">菜品</router-link><router-link to="/products/setmeals">套餐</router-link><router-link to="/products/categories">分类</router-link></nav>
  <section class="panel filter-bar"><el-input v-model="query.name" :placeholder="config.search" clearable/><el-select v-model="query.status" placeholder="状态" clearable><el-option label="启用 / 起售" value="1"/><el-option label="禁用 / 停售" value="0"/></el-select><el-button type="primary" @click="query.page=1;load()">查询</el-button></section>
  <section class="panel table-panel"><el-table :data="rows" v-loading="loading" empty-text="暂无数据" @selection-change="selected=$event">
    <el-table-column v-if="['dishes','setmeals'].includes(kind)" type="selection" width="46"/>
    <el-table-column prop="name" label="名称" min-width="150"/><el-table-column v-if="kind==='employees'" prop="username" label="用户名" min-width="130"/><el-table-column v-if="kind==='employees'" prop="phone" label="手机号" min-width="130"/><el-table-column v-if="['dishes','setmeals'].includes(kind)" prop="categoryName" label="分类" min-width="120"/><el-table-column v-if="['dishes','setmeals'].includes(kind)" label="价格" width="110"><template #default="{row}">¥{{(row.price/100).toFixed(2)}}</template></el-table-column><el-table-column v-if="kind==='categories'" prop="sort" label="排序" width="90"/><el-table-column prop="updateTime" label="更新时间" min-width="170"/>
    <el-table-column label="状态" width="110"><template #default="{row}"><el-tag :type="row.status===1?'success':'info'">{{row.status===1?(kind==='employees'||kind==='categories'?'启用':'起售'):(kind==='employees'||kind==='categories'?'禁用':'停售')}}</el-tag></template></el-table-column>
    <el-table-column label="操作" :width="canManage?(kind==='employees'?240:210):100"><template #default="{row}"><template v-if="canManage"><el-button link type="primary" @click="editCurrent(row)">编辑</el-button><el-button v-if="kind==='employees'" link @click="password(row)">改密</el-button><el-button link :type="row.status===1?'danger':'primary'" :loading="changing===row.id" @click="toggle(row)">{{row.status===1?(kind==='employees'||kind==='categories'?'禁用':'停售'):(kind==='employees'||kind==='categories'?'启用':'起售')}}</el-button><el-button v-if="kind==='categories'" link type="danger" @click="removeRows([row])">删除</el-button></template><span v-else class="muted">只读</span></template></el-table-column>
  </el-table><el-pagination v-model:current-page="query.page" v-model:page-size="query.pageSize" layout="total, prev, pager, next" :total="total" @current-change="load"/></section>
  <DishFormDialog v-if="kind==='dishes'" v-model="dishDialog" :dish-id="editingDishId" @saved="load" />
  <SetmealFormDialog v-if="kind==='setmeals'" v-model="setmealDialog" :setmeal-id="editingSetmealId" @saved="load"/>
  <EntityFormDialog v-if="['categories','employees'].includes(kind)" v-model="entityDialog" :kind="entityKind" :entity="editingEntity" @saved="load"/>
</div></template>
