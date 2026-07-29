<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { errorMessage } from "@/api/http";
import { resourceApi } from "@/api/services";
import type { CategoryPayload, EmployeePayload } from "@/types";

const props = defineProps<{ modelValue: boolean; kind: "categories"|"employees"|"password"; entity?: any }>();
const emit = defineEmits<{ "update:modelValue":[value:boolean]; saved:[] }>();
const visible = computed({get:()=>props.modelValue,set:value=>emit("update:modelValue",value)});
const formRef=ref<FormInstance>(),saving=ref(false),loading=ref(false);
const form=reactive<any>({});
const titles={categories:"分类",employees:"员工",password:"修改密码"};
const title=computed(()=>props.kind==="password"?"修改密码":`${props.entity?.id?"编辑":"新增"}${titles[props.kind]}`);
const rules=computed<FormRules>(()=>props.kind==="categories"?{
  name:[{required:true,message:"请输入分类名称",trigger:"blur"}],type:[{required:true,message:"请选择分类类型",trigger:"change"}],sort:[{required:true,type:"number",message:"请输入排序",trigger:"blur"}]
}:props.kind==="password"?{
  oldPassword:[{required:true,message:"请输入旧密码",trigger:"blur"}],newPassword:[{required:true,min:6,message:"新密码至少 6 位",trigger:"blur"}],confirmPassword:[{required:true,validator:(_r,_v,cb)=>_v===form.newPassword?cb():cb(new Error("两次密码不一致")),trigger:"blur"}]
}:{
  username:[{required:true,message:"请输入用户名",trigger:"blur"}],name:[{required:true,message:"请输入姓名",trigger:"blur"}],
  phone:[{required:true,pattern:/^1\d{10}$/,message:"请输入正确手机号",trigger:"blur"}],sex:[{required:true,message:"请选择性别",trigger:"change"}],
  idNumber:[{required:true,message:"请输入身份证号",trigger:"blur"}]
});
function init(){
  for(const key of Object.keys(form))delete form[key];
  if(props.kind==="categories")Object.assign(form,{id:props.entity?.id,name:props.entity?.name||"",type:props.entity?.type||1,sort:props.entity?.sort??0});
  if(props.kind==="employees")Object.assign(form,{id:props.entity?.id,username:props.entity?.username||"",name:props.entity?.name||"",phone:props.entity?.phone||"",sex:props.entity?.sex||"1",idNumber:props.entity?.idNumber||""});
  if(props.kind==="password")Object.assign(form,{empId:props.entity?.id,oldPassword:"",newPassword:"",confirmPassword:""});
  nextTick(()=>formRef.value?.clearValidate());
}
async function load(){
  init();
  if(props.kind==="employees"&&props.entity?.id){loading.value=true;try{Object.assign(form,await resourceApi.employeeDetail(props.entity.id))}catch(e){ElMessage.error(errorMessage(e));visible.value=false}finally{loading.value=false}}
}
async function submit(){
  if(!await formRef.value?.validate().catch(()=>false))return;saving.value=true;
  try{
    if(props.kind==="categories"){const body:CategoryPayload={id:form.id,name:form.name,type:form.type,sort:form.sort};form.id?await resourceApi.updateCategory(body):await resourceApi.createCategory(body)}
    if(props.kind==="employees"){const body:EmployeePayload={id:form.id,username:form.username,name:form.name,phone:form.phone,sex:form.sex,idNumber:form.idNumber};form.id?await resourceApi.updateEmployee(body):await resourceApi.createEmployee(body)}
    if(props.kind==="password")await resourceApi.editPassword({empId:form.empId,oldPassword:form.oldPassword,newPassword:form.newPassword});
    ElMessage.success(props.kind==="password"?"密码已修改":"保存成功");visible.value=false;emit("saved");
  }catch(e){ElMessage.error(errorMessage(e))}finally{saving.value=false}
}
watch(()=>props.modelValue,value=>{if(value)load()});
</script>
<template><el-dialog v-model="visible" :title="title" width="min(520px,94vw)" destroy-on-close><div v-loading="loading"><el-form ref="formRef" :model="form" :rules="rules" label-position="top">
  <template v-if="kind==='categories'"><el-form-item label="分类名称" prop="name"><el-input v-model.trim="form.name"/></el-form-item><el-form-item label="分类类型" prop="type"><el-radio-group v-model="form.type"><el-radio :value="1">菜品分类</el-radio><el-radio :value="2">套餐分类</el-radio></el-radio-group></el-form-item><el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" controls-position="right"/></el-form-item></template>
  <template v-else-if="kind==='employees'"><el-form-item label="用户名" prop="username"><el-input v-model.trim="form.username" :disabled="Boolean(form.id)"/></el-form-item><el-form-item label="姓名" prop="name"><el-input v-model.trim="form.name"/></el-form-item><el-form-item label="手机号" prop="phone"><el-input v-model.trim="form.phone" maxlength="11"/></el-form-item><el-form-item label="性别" prop="sex"><el-radio-group v-model="form.sex"><el-radio value="1">男</el-radio><el-radio value="0">女</el-radio></el-radio-group></el-form-item><el-form-item label="身份证号" prop="idNumber"><el-input v-model.trim="form.idNumber" maxlength="18"/></el-form-item></template>
  <template v-else><el-form-item label="旧密码" prop="oldPassword"><el-input v-model="form.oldPassword" type="password" show-password/></el-form-item><el-form-item label="新密码" prop="newPassword"><el-input v-model="form.newPassword" type="password" show-password/></el-form-item><el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="form.confirmPassword" type="password" show-password/></el-form-item></template>
</el-form></div><template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" :disabled="loading" @click="submit">保存</el-button></template></el-dialog></template>
