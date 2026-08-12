<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { authApi } from "@/api/services";
import { errorMessage, saveToken } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";

const router = useRouter();
const merchantSession = useMerchantSession();
const formRef = ref<FormInstance>();
const loading = ref(false);
const form = reactive({ tenantCode: "", username: "", password: "" });
const rules: FormRules = {
  tenantCode: [{ required: true, message: "请输入租户编码", trigger: "blur" }],
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
};
async function submit() {
  if (!await formRef.value?.validate().catch(() => false)) return;
  loading.value = true;
  try {
    const session = await authApi.login(form);
    saveToken(session.token);
    merchantSession.resetMerchantSession();
    const current = await merchantSession.loadSession(true);
    const target = {
      ORDERS: "/orders",
      OVERVIEW: "/"
    }[current.suggestedWorkspace] || "/";
    await router.replace(target);
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
</script>
<template>
  <div class="login-page login">
    <section class="login-hero">
      <div class="login-brand"><div class="hero-mark">R</div><strong>RAY 运营台</strong></div>
      <p>RESTAURANT ORDERS</p><h1>让每一笔订单<br>都清晰可查。</h1>
      <span>查看顾客提交的独立订单，并维护当前门店的桌台与商品。</span>
    </section>
    <section class="login-panel">
      <div class="login-box">
        <p class="eyebrow">MERCHANT SIGN IN</p><h2>员工登录</h2><p class="muted">先识别租户，再进入你的授权门店和岗位工作台。</p>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
          <el-form-item label="租户编码" prop="tenantCode"><el-input v-model.trim="form.tenantCode" size="large" maxlength="32" autocomplete="organization" placeholder="例如 default" /></el-form-item>
          <el-form-item label="用户名" prop="username"><el-input v-model.trim="form.username" size="large" autocomplete="username" placeholder="请输入用户名" /></el-form-item>
          <el-form-item label="密码" prop="password"><el-input v-model="form.password" size="large" type="password" show-password autocomplete="current-password" placeholder="请输入密码" /></el-form-item>
          <el-button class="login-button" type="primary" size="large" :loading="loading" @click="submit">进入运营台</el-button>
        </el-form>
        <p class="login-boundary">平台账号、商户员工账号和顾客身份使用独立认证边界。</p>
      </div>
    </section>
  </div>
</template>
