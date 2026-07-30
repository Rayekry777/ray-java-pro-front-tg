<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules, type UploadRequestOptions } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { errorMessage } from "@/api/http";
import { resourceApi } from "@/api/services";
import type { Category, DishFlavor, DishPayload } from "@/types";

const props = defineProps<{ modelValue: boolean; dishId?: number }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [] }>();
const formRef = ref<FormInstance>();
const loading = ref(false), saving = ref(false), uploading = ref(false);
const categories = ref<Category[]>([]);
const form = reactive<DishPayload>({ name: "", categoryId: 0, price: 0, image: "", description: "", status: 1, flavors: [] });
const visible = computed({ get: () => props.modelValue, set: value => emit("update:modelValue", value) });
const title = computed(() => props.dishId ? "编辑菜品" : "新增菜品");
const rules: FormRules = {
  name: [{ required: true, message: "请输入菜品名称", trigger: "blur" }],
  categoryId: [{ required: true, type: "number", min: 1, message: "请选择菜品分类", trigger: "change" }],
  price: [{ required: true, type: "number", min: 0.01, message: "价格必须大于 0", trigger: "blur" }],
  image: [{ required: true, message: "请上传菜品图片", trigger: "change" }]
};
function reset() {
  Object.assign(form, { id: undefined, name: "", categoryId: 0, price: 0, image: "", description: "", status: 1, flavors: [] });
  nextTick(() => formRef.value?.clearValidate());
}
async function open() {
  reset(); loading.value = true;
  try {
    categories.value = await resourceApi.dishCategories();
    if (props.dishId) {
      const detail = await resourceApi.dishDetail(props.dishId);
      Object.assign(form, {
        id: detail.id, name: detail.name, categoryId: detail.categoryId,
        price: detail.price, image: detail.image, description: detail.description || "",
        status: detail.status, flavors: (detail.flavors || []).map(item => ({ ...item }))
      });
    }
  } catch (error) { ElMessage.error(errorMessage(error)); visible.value = false; }
  finally { loading.value = false; }
}
function addFlavor() { form.flavors.push({ name: "", value: "" }); }
function removeFlavor(index: number) { form.flavors.splice(index, 1); }
async function uploadImage(options: UploadRequestOptions) {
  uploading.value = true;
  try {
    form.image = await resourceApi.upload(options.file);
    options.onSuccess(form.image);
    formRef.value?.validateField("image");
  } catch (error) { ElMessage.error(errorMessage(error)); throw error; }
  finally { uploading.value = false; }
}
async function submit() {
  if (!await formRef.value?.validate().catch(() => false)) return;
  const invalidFlavor = form.flavors.some(item => !item.name.trim() || !item.value.trim());
  if (invalidFlavor) return void ElMessage.warning("请完整填写口味名称和可选值");
  saving.value = true;
  const payload: DishPayload = {
    ...form,
      price: Number(form.price),
    flavors: form.flavors.map(({ id, dishId, name, value }: DishFlavor) => ({ id, dishId, name: name.trim(), value: value.trim() }))
  };
  try {
    props.dishId ? await resourceApi.updateDish(payload) : await resourceApi.createDish(payload);
    ElMessage.success(props.dishId ? "菜品已保存" : "菜品已新增");
    visible.value = false; emit("saved");
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { saving.value = false; }
}
watch(() => props.modelValue, value => { if (value) open(); });
</script>

<template>
  <el-dialog v-model="visible" :title="title" width="min(680px, 94vw)" destroy-on-close>
    <div v-loading="loading">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <div class="dish-form-grid">
          <el-form-item label="菜品名称" prop="name"><el-input v-model.trim="form.name" maxlength="32" show-word-limit placeholder="请输入菜品名称" /></el-form-item>
          <el-form-item label="菜品分类" prop="categoryId"><el-select v-model="form.categoryId" placeholder="请选择分类"><el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="价格（元）" prop="price"><el-input-number v-model="form.price" :min="0.01" :precision="2" :step="1" controls-position="right" /></el-form-item>
          <el-form-item label="销售状态"><el-radio-group v-model="form.status"><el-radio :value="1">起售</el-radio><el-radio :value="0">停售</el-radio></el-radio-group></el-form-item>
        </div>
        <el-form-item label="菜品图片" prop="image">
          <el-upload class="dish-uploader" :show-file-list="false" accept="image/png,image/jpeg,image/webp" :http-request="uploadImage">
            <img v-if="form.image" :src="form.image" alt="菜品图片">
            <div v-else class="upload-placeholder" v-loading="uploading"><el-icon><Plus /></el-icon><span>上传图片</span></div>
          </el-upload>
        </el-form-item>
        <el-form-item label="菜品描述"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入菜品描述" /></el-form-item>
        <div class="flavor-title"><div><strong>口味配置</strong><small>值按后端约定填写，例如：[&quot;微辣&quot;,&quot;中辣&quot;,&quot;重辣&quot;]</small></div><el-button @click="addFlavor"><el-icon><Plus /></el-icon>添加口味</el-button></div>
        <div v-if="form.flavors.length" class="flavor-list">
          <div v-for="(flavor,index) in form.flavors" :key="flavor.id || index" class="flavor-row"><el-input v-model.trim="flavor.name" placeholder="口味名称，如辣度" /><el-input v-model.trim="flavor.value" placeholder='可选值，如 ["微辣","中辣"]' /><el-button type="danger" plain @click="removeFlavor(index)">删除</el-button></div>
        </div>
        <el-empty v-else description="暂无口味配置" :image-size="54" />
      </el-form>
    </div>
    <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" :disabled="loading||uploading" @click="submit">保存菜品</el-button></template>
  </el-dialog>
</template>
