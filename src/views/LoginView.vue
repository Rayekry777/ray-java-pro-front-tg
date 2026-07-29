<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { authApi } from "@/api/services";
import { errorMessage, saveToken } from "@/api/http";

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ username: "", password: "" });
const rules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};
async function submit() {
  if (!await formRef.value?.validate().catch(() => false)) return;
  loading.value = true;
  try {
    const session = await authApi.login(form);
    saveToken(session.token);
    sessionStorage.setItem("ray-admin-user", JSON.stringify({ id: session.id, name: session.name, userName: session.userName }));
    await router.replace("/");
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
</script>
<template>
  <div class="login-page">
    <section class="login-hero"><div class="hero-mark">R</div><p>RESTAURANT OPERATIONS</p><h1>让每一份出餐<br>都有秩序。</h1><span>订单、菜品与运营数据，在一个工作台完成闭环。</span></section>
    <section class="login-panel">
      <div class="login-box">
        <p class="eyebrow">RAY ADMIN</p><h2>欢迎回来</h2><p class="muted">使用员工账号进入餐厅运营台</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
          <el-form-item label="用户名" prop="username"><el-input v-model.trim="form.username" size="large" autocomplete="username" placeholder="请输入用户名" /></el-form-item>
          <el-form-item label="密码" prop="password"><el-input v-model="form.password" size="large" type="password" show-password autocomplete="current-password" placeholder="请输入密码" /></el-form-item>
          <el-button class="login-button" type="primary" size="large" :loading="loading" @click="submit">进入运营台</el-button>
        </el-form>
      </div>
    </section>
  </div>
</template>
