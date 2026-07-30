<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="feedback-page">
    <section class="feedback-panel">
      <span class="feedback-code">404</span>
      <p class="eyebrow">PAGE NOT FOUND</p>
      <h1>这个页面不在当前运营台中</h1>
      <p>页面可能已经迁移，或你使用了失效的旧链接。</p>
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </section>
  </div>
</template>
