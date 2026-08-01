<template>
  <div class="page">
    <header class="page-head">
      <div><p class="eyebrow">REPORTS</p><h1>经营报表</h1><p>保留页面容量，当前不发送报表网络请求。</p></div>
    </header>
    <section class="panel unavailable-panel">
      <span class="feedback-code">?</span>
      <div><h2>接口证据待确认</h2><p>当前后端 Controller 扫描未发现 `/api/merchant/v1/report/**` 路由。为避免调用不存在或已废弃的接口，报表暂时停用。</p></div>
      <el-tag type="warning" effect="plain">UNKNOWN</el-tag>
    </section>
  </div>
</template>
