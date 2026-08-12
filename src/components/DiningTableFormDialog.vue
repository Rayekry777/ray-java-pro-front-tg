<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { dineInApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { DiningArea, DiningTable, DiningTableCreatePayload, DiningTableUpdatePayload } from "@/types";

const props = defineProps<{ modelValue: boolean; areas: DiningArea[]; table?: DiningTable }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [] }>();
const visible = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value)
});
const formRef = ref<FormInstance>();
const saving = ref(false);
const form = reactive<DiningTableUpdatePayload>({
  areaId: 0,
  tableNo: "",
  name: "",
  capacity: 4,
  sort: 0,
  status: "AVAILABLE",
  version: 0
});
const rules: FormRules = {
  areaId: [{ required: true, type: "number", min: 1, message: "请选择所属区域", trigger: "change" }],
  tableNo: [{ required: true, message: "请输入桌号", trigger: "blur" }, { max: 16, message: "桌号不能超过 16 个字符", trigger: "blur" }],
  name: [{ required: true, message: "请输入桌台名称", trigger: "blur" }, { max: 32, message: "桌台名称不能超过 32 个字符", trigger: "blur" }],
  capacity: [{ required: true, type: "number", min: 1, max: 50, message: "容纳人数为 1～50 人", trigger: "change" }],
  sort: [{ required: true, type: "number", min: 0, max: 9999, message: "排序为 0～9999", trigger: "change" }],
  status: [{ required: true, message: "请选择桌台状态", trigger: "change" }]
};

function initialize() {
  Object.assign(form, props.table ? {
    areaId: props.table.areaId,
    tableNo: props.table.tableNo,
    name: props.table.name,
    capacity: props.table.capacity,
    sort: props.table.sort,
    status: props.table.status === "DISABLED" ? "DISABLED" : "AVAILABLE",
    version: props.table.version
  } : {
    areaId: props.areas[0]?.id || 0,
    tableNo: "",
    name: "",
    capacity: 4,
    sort: 0,
    status: "AVAILABLE",
    version: 0
  });
  nextTick(() => formRef.value?.clearValidate());
}

async function submit() {
  if (!await formRef.value?.validate().catch(() => false)) return;
  saving.value = true;
  const body: DiningTableCreatePayload = {
    areaId: form.areaId,
    tableNo: form.tableNo.trim(),
    name: form.name.trim(),
    capacity: form.capacity,
    sort: form.sort,
    status: form.status
  };
  try {
    if (props.table) await dineInApi.updateTable(props.table.id, { ...body, version: form.version });
    else await dineInApi.createTable(body);
    ElMessage.success(props.table ? "桌台已更新" : "桌台已新增");
    visible.value = false;
    emit("saved");
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}

watch(() => props.modelValue, value => { if (value) initialize(); });
</script>

<template>
  <el-dialog v-model="visible" :title="table ? '编辑桌台' : '新增桌台'" width="min(560px, 94vw)" destroy-on-close>
    <el-alert v-if="!areas.length" title="当前门店没有可用区域" description="请先通过初始化数据或后端维护启用的堂食区域。" type="warning" :closable="false" show-icon />
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="table-form">
      <el-form-item label="所属区域" prop="areaId">
        <el-select v-model="form.areaId" placeholder="选择区域" :disabled="!areas.length">
          <el-option v-for="area in areas" :key="area.id" :label="area.name" :value="area.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="桌号" prop="tableNo"><el-input v-model="form.tableNo" maxlength="16" placeholder="例如 A03" /></el-form-item>
      <el-form-item label="桌台名称" prop="name"><el-input v-model="form.name" maxlength="32" placeholder="例如 大厅 A03" /></el-form-item>
      <div class="table-form-grid">
        <el-form-item label="容纳人数" prop="capacity"><el-input-number v-model="form.capacity" :min="1" :max="50" controls-position="right" /></el-form-item>
        <el-form-item label="显示排序" prop="sort"><el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right" /></el-form-item>
      </div>
      <el-form-item label="维护状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio-button value="AVAILABLE">可用</el-radio-button>
          <el-radio-button value="DISABLED">停用</el-radio-button>
        </el-radio-group>
        <small class="table-form-hint">营业中、待清台和已预留状态由业务流程维护，不能在这里手动设置。</small>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible=false">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="!areas.length" @click="submit">保存桌台</el-button>
    </template>
  </el-dialog>
</template>
