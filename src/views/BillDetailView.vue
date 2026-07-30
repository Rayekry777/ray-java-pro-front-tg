<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute } from "vue-router";
import { billApi } from "@/api/services";
import { errorMessage, errorStatus } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import type { Bill } from "@/types";

const route = useRoute();
const { hasPermission } = useMerchantSession();
const loading = ref(false);
const acting = ref("");
const bill = ref<Bill>();
const modeLabels: Record<string, string> = { DINE_IN: "堂食", TAKEOUT: "现场外带", PICKUP: "自取", DELIVERY: "配送" };
const modeLabel = computed(() => modeLabels[bill.value?.serviceMode || ""] || "待选择");
const readonly = computed(() => bill.value?.sourceType && bill.value.sourceType !== "UNIFIED");
const can = (permission: string) => bill.value?.allowedActions?.includes(permission) && hasPermission(permission);
const canHandover = computed(() => bill.value?.serviceMode === "TAKEOUT"
  && bill.value.status === "READY" && bill.value.paymentStatus === "PAID" && hasPermission("bill:checkout"));
function money(value?: number) { return `¥${Number(value || 0).toFixed(2)}`; }
async function load() {
  loading.value = true;
  try {
    const sourceType = typeof route.query.sourceType === "string" ? route.query.sourceType : "";
    const sourceId = Number(route.query.sourceId);
    bill.value = sourceType && sourceId
      ? await billApi.legacyDetail(sourceType, sourceId)
      : await billApi.detail(Number(route.params.id));
  }
  catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
async function run(type: "checkout" | "cancel" | "clear" | "handover") {
  if (!bill.value) return;
  acting.value = type;
  try {
    if (type === "checkout") {
      const { value: method } = await ElMessageBox.prompt("请输入支付方式：CASH、WECHAT、ALIPAY、BANK_CARD 或 OTHER", "登记收款", {
        inputValue: "CASH",
        inputValidator: value => ["CASH", "WECHAT", "ALIPAY", "BANK_CARD", "OTHER"].includes(value) || "支付方式不正确"
      });
      bill.value = await billApi.checkout(bill.value.id, {
        amount: bill.value.payableAmount, paymentMethod: method,
        idempotencyKey: crypto.randomUUID().replaceAll("-", "")
      });
    }
    if (type === "cancel") {
      const { value } = await ElMessageBox.prompt("请输入取消原因", "取消账单", { inputValidator: value => Boolean(value.trim()) || "原因不能为空" });
      bill.value = await billApi.cancel(bill.value.id, value);
    }
    if (type === "clear") {
      await ElMessageBox.confirm("确认顾客已离店并释放桌台？", "堂食清台");
      bill.value = await billApi.clearTable(bill.value.id);
    }
    if (type === "handover") {
      await ElMessageBox.confirm("确认现场外带商品已交给顾客？", "确认交付");
      bill.value = await billApi.handover(bill.value.id);
    }
    ElMessage.success("账单状态已更新");
  } catch (error) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(errorStatus(error) === 409 ? "账单状态已变化，正在重新加载" : errorMessage(error));
      if (errorStatus(error) === 409) await load();
    }
  } finally {
    acting.value = "";
  }
}
onMounted(load);
</script>

<template>
  <div class="page bill-detail-page" v-loading="loading">
    <header class="page-head">
      <div><p class="eyebrow">BILL · {{ bill?.billNo || "LOADING" }}</p><h1>统一账单详情</h1><p>下一动作同时受服务端 allowedActions、账单状态和岗位权限约束。</p></div>
      <router-link class="button secondary" to="/bills">返回账单中心</router-link>
    </header>
    <div v-if="readonly" class="readonly-banner">历史兼容账单只读展示，不提供收款、取消或履约动作。</div>
    <section v-if="bill" class="bill-status-rail">
      <div class="status-step done">01<br><strong>创建</strong></div>
      <div class="status-step" :class="{done:bill.status!=='DRAFT',current:bill.status==='DRAFT'}">02<br><strong>确认</strong></div>
      <div class="status-step" :class="{done:['READY','SERVED','PAID','COMPLETED'].includes(bill.status),current:['CONFIRMED','COOKING'].includes(bill.status)}">03<br><strong>制作</strong></div>
      <div class="status-step" :class="{done:bill.paymentStatus==='PAID',current:bill.paymentStatus==='UNPAID'&&bill.status!=='DRAFT'}">04<br><strong>收款</strong></div>
      <div class="status-step" :class="{done:bill.status==='COMPLETED',current:bill.paymentStatus==='PAID'&&bill.status!=='COMPLETED'}">05<br><strong>完成</strong></div>
    </section>
    <section v-if="bill" class="detail-layout">
      <div class="detail-main panel">
        <div class="detail-meta">
          <div><span>履约类型</span><strong>{{ modeLabel }}</strong></div><div><span>账单状态</span><strong>{{ bill.status }}</strong></div>
          <div><span>支付状态</span><strong>{{ bill.paymentStatus }}</strong></div><div><span>草稿版本</span><strong>v{{ bill.version }}</strong></div>
        </div>
        <el-table :data="bill.items" empty-text="账单暂无商品">
          <el-table-column prop="name" label="商品" min-width="180"/><el-table-column prop="status" label="制作状态" width="120"/>
          <el-table-column prop="quantity" label="数量" width="80"/><el-table-column label="单价" width="100"><template #default="{row}">{{ money(row.price) }}</template></el-table-column>
          <el-table-column label="小计" width="110"><template #default="{row}">{{ money(row.amount) }}</template></el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140"/>
        </el-table>
        <div class="bill-notes"><span>创建于 {{ bill.createTime?.replace("T"," ") }}</span><span>{{ bill.remark || "无整单备注" }}</span></div>
      </div>
      <aside class="action-panel panel">
        <p class="eyebrow">NEXT ACTION</p><h2>当前可执行动作</h2>
        <div class="bill-money"><span>应收金额</span><strong>{{ money(bill.payableAmount) }}</strong><small>商品 {{ money(bill.amount) }} · 优惠 {{ money(bill.discountAmount) }}</small></div>
        <div class="action-stack">
          <el-button v-if="can('bill:checkout')" type="primary" :loading="acting==='checkout'" @click="run('checkout')">登记收款</el-button>
          <el-button v-if="canHandover" type="primary" :loading="acting==='handover'" @click="run('handover')">确认外带交付</el-button>
          <el-button v-if="can('dining-table:clear')" type="primary" :loading="acting==='clear'" @click="run('clear')">确认清台</el-button>
          <el-button v-if="can('bill:cancel')" type="danger" plain :loading="acting==='cancel'" @click="run('cancel')">取消账单</el-button>
          <el-empty v-if="!bill.allowedActions.length&&!canHandover" :image-size="54" description="当前没有待执行动作"/>
        </div>
        <p class="action-hint">按钮由当前员工权限与后端 `allowedActions` 共同决定；HTTP 403 仍是最终安全边界。</p>
      </aside>
    </section>
  </div>
</template>
