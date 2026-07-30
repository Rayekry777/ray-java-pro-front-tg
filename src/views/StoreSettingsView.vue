<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import BusinessSettingsDialog from "@/components/BusinessSettingsDialog.vue";
import { workspaceApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import type { BusinessDay, ShopBusinessSettings } from "@/types";

const { activeStore } = useMerchantSession();
const loading = ref(false);
const dialogVisible = ref(false);
const settings = ref<ShopBusinessSettings>();
const weekdays: Array<[BusinessDay, string]> = [
  ["MONDAY", "周一"], ["TUESDAY", "周二"], ["WEDNESDAY", "周三"], ["THURSDAY", "周四"],
  ["FRIDAY", "周五"], ["SATURDAY", "周六"], ["SUNDAY", "周日"]
];
async function load() {
  loading.value = true;
  try { settings.value = await workspaceApi.shopBusinessSettings(); }
  catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
function saved(value: ShopBusinessSettings) {
  settings.value = value;
  window.dispatchEvent(new Event("ray:shop-business-changed"));
}
onMounted(load);
</script>

<template>
  <div class="page store-page">
    <header class="page-head">
      <div><p class="eyebrow">STORE SETTINGS</p><h1>门店营业设置</h1><p>配置当前授权门店的营业模式和每周营业时段。</p></div>
      <el-button type="primary" @click="dialogVisible=true">编辑营业设置</el-button>
    </header>
    <section v-loading="loading" class="mode-grid">
      <article class="panel store-identity">
        <p class="eyebrow">ACTIVE STORE</p><h2>{{ activeStore?.name }}</h2>
        <p>{{ activeStore?.storeCode }} · {{ activeStore?.timezone }}</p>
        <span class="tag ok">{{ settings?.effectiveStatus ? "当前营业中" : "当前已打烊" }}</span>
      </article>
      <article class="mode-card" :class="{selected:settings?.mode==='AUTO'}"><span class="tag">自动营业</span><h3>跟随周营业时间</h3><p>系统按配置时段自动判断营业状态。</p></article>
      <article class="mode-card" :class="{selected:settings?.mode==='MANUAL_OPEN'}"><span class="tag ok">强制营业</span><h3>忽略营业时段</h3><p>适用于临时延长营业或特殊活动。</p></article>
      <article class="mode-card" :class="{selected:settings?.mode==='MANUAL_CLOSED'}"><span class="tag warn">强制打烊</span><h3>暂停接收新业务</h3><p>已有订单仍可继续制作和交付。</p></article>
    </section>
    <section class="panel schedule-panel">
      <div class="section-title"><div><p class="eyebrow">WEEKLY SCHEDULE</p><h2>周营业时间</h2></div><span class="tag">{{ settings?.mode === "AUTO" ? "自动生效" : "当前由手动模式覆盖" }}</span></div>
      <div class="schedule-grid">
        <div v-for="[day,label] in weekdays" :key="day" class="schedule-row">
          <strong>{{ label }}</strong>
          <span :class="{muted:!settings?.weeklySchedule?.[day]?.length}">{{ settings?.weeklySchedule?.[day]?.length ? "营业" : "休息" }}</span>
          <span>{{ settings?.weeklySchedule?.[day]?.map(slot => `${slot.start}–${slot.end}`).join(" · ") || "未设置营业时段" }}</span>
        </div>
      </div>
    </section>
    <BusinessSettingsDialog v-model="dialogVisible" @saved="saved"/>
  </div>
</template>
