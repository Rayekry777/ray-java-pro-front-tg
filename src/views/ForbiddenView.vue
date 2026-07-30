<script setup lang="ts">
import { useRouter } from "vue-router";
import { useMerchantSession } from "@/session/merchantSession";

const router = useRouter();
const { session } = useMerchantSession();
</script>

<template>
  <div class="feedback-page">
    <section class="feedback-panel">
      <span class="feedback-code">403</span>
      <p class="eyebrow">PERMISSION REQUIRED</p>
      <h1>当前岗位没有访问权限</h1>
      <p>你的菜单和操作范围由服务端会话实时决定。若权限刚刚发生变化，请重新进入或联系租户负责人。</p>
      <div class="feedback-actions">
        <el-button type="primary" @click="router.push('/')">返回岗位首页</el-button>
        <el-button @click="router.back()">返回上一页</el-button>
      </div>
      <small v-if="session">当前身份：{{ session.employee.name }} · {{ session.roles.join(" / ") || "未分配岗位" }}</small>
    </section>
  </div>
</template>
