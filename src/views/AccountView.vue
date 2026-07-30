<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { useRouter } from "vue-router";
import { authApi, sessionApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";

const router = useRouter();
const merchantSession = useMerchantSession();
const formRef = ref<FormInstance>();
const saving = ref(false);
const form = reactive({ oldPassword: "", newPassword: "", confirmPassword: "" });
const rules: FormRules = {
  oldPassword: [{ required: true, min: 6, max: 64, message: "请输入当前密码", trigger: "blur" }],
  newPassword: [{ required: true, min: 8, max: 64, message: "新密码至少 8 位", trigger: "blur" }],
  confirmPassword: [{
    validator: (_rule, value, callback) => value === form.newPassword ? callback() : callback(new Error("两次输入的新密码不一致")),
    trigger: "blur"
  }]
};
async function submit() {
  if (!await formRef.value?.validate().catch(() => false)) return;
  saving.value = true;
  try {
    await sessionApi.changePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
    ElMessage.success("密码已修改，请重新登录");
    try { await authApi.logout(); } finally {
      merchantSession.endMerchantSession();
      await router.replace("/login");
    }
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="page account-page">
    <header class="page-head">
      <div><p class="eyebrow">ACCOUNT SECURITY</p><h1>账号安全</h1><p>修改本人密码后，旧会话将失效并返回登录页。</p></div>
    </header>
    <section class="account-grid">
      <article class="panel account-summary">
        <span class="account-avatar">{{ merchantSession.employee.value?.name.slice(0, 1) }}</span>
        <h2>{{ merchantSession.employee.value?.name }}</h2>
        <p>@{{ merchantSession.employee.value?.username }}</p>
        <dl>
          <div><dt>当前门店</dt><dd>{{ merchantSession.activeStore.value?.name }}</dd></div>
          <div><dt>系统岗位</dt><dd>{{ merchantSession.roles.value.join(" / ") || "未分配" }}</dd></div>
          <div><dt>权限数量</dt><dd>{{ merchantSession.permissions.value.includes("*") ? "全部" : merchantSession.permissions.value.length }}</dd></div>
        </dl>
      </article>
      <article class="panel password-panel">
        <p class="eyebrow">CHANGE PASSWORD</p><h2>修改登录密码</h2>
        <el-alert title="安全提醒" description="新密码建议同时包含字母、数字和符号，不要与其他系统共用。" type="info" show-icon :closable="false"/>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-form-item label="当前密码" prop="oldPassword"><el-input v-model="form.oldPassword" type="password" show-password autocomplete="current-password"/></el-form-item>
          <el-form-item label="新密码" prop="newPassword"><el-input v-model="form.newPassword" type="password" show-password autocomplete="new-password"/></el-form-item>
          <el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="form.confirmPassword" type="password" show-password autocomplete="new-password"/></el-form-item>
          <el-button type="primary" :loading="saving" @click="submit">保存并重新登录</el-button>
        </el-form>
      </article>
    </section>
  </div>
</template>
