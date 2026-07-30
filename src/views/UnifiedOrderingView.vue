<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { billApi, dineInApi, resourceApi } from "@/api/services";
import { errorMessage, errorStatus } from "@/api/http";
import type { Bill, BillQuote, DiningTable, Dish, Setmeal } from "@/types";

type Product = (Dish | Setmeal) & { kind: "dish" | "setmeal" };
type CartLine = { product: Product; quantity: number; remark: string };

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const quoteVisible = ref(false);
const quoteLoading = ref(false);
const products = ref<Product[]>([]);
const tables = ref<DiningTable[]>([]);
const keyword = ref("");
const activeKind = ref<"all" | "dish" | "setmeal">("all");
const cart = reactive<Record<string, CartLine>>({});
const draft = ref<Bill>();
const quote = ref<BillQuote>();
const fulfillment = reactive<{ serviceMode: "DINE_IN" | "TAKEOUT"; tableId?: number; guestCount: number }>({
  serviceMode: "DINE_IN",
  guestCount: 2
});

const filtered = computed(() => products.value.filter(product => {
  const kindMatches = activeKind.value === "all" || product.kind === activeKind.value;
  return kindMatches && product.name.toLowerCase().includes(keyword.value.trim().toLowerCase());
}));
const cartLines = computed(() => Object.values(cart).filter(line => line.quantity > 0));
const cartCount = computed(() => cartLines.value.reduce((sum, line) => sum + line.quantity, 0));
const cartTotal = computed(() => cartLines.value.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0));
const selectedTable = computed(() => tables.value.find(table => table.id === fulfillment.tableId));

function keyOf(product: Product) { return `${product.kind}:${product.id}`; }
function money(value?: number) { return `¥${Number(value || 0).toFixed(2)}`; }
function add(product: Product) {
  const key = keyOf(product);
  if (!cart[key]) cart[key] = { product, quantity: 0, remark: "" };
  cart[key].quantity += 1;
}
function decrease(line: CartLine) {
  line.quantity -= 1;
  if (line.quantity <= 0) delete cart[keyOf(line.product)];
}
function apiItems() {
  return cartLines.value.map(line => ({
    ...(line.product.kind === "dish" ? { dishId: line.product.id } : { setmealId: line.product.id }),
    quantity: line.quantity,
    remark: line.remark.trim() || undefined
  }));
}
async function loadProducts() {
  loading.value = true;
  try {
    const [dishResult, setmealResult] = await Promise.all([
      resourceApi.dishes({ page: 1, pageSize: 100, status: 1 }),
      resourceApi.setmeals({ page: 1, pageSize: 100, status: 1 })
    ]);
    products.value = [
      ...dishResult.records.map(item => ({ ...item, kind: "dish" as const })),
      ...setmealResult.records.map(item => ({ ...item, kind: "setmeal" as const }))
    ];
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
async function openQuote() {
  if (!cartLines.value.length) {
    ElMessage.warning("请先选择菜品或套餐");
    return;
  }
  saving.value = true;
  try {
    draft.value ||= await billApi.createDraft();
    draft.value = await billApi.replaceItems(draft.value.id, apiItems());
    if (!tables.value.length) tables.value = await dineInApi.tables({ status: "AVAILABLE" });
    fulfillment.tableId ||= tables.value[0]?.id;
    quote.value = undefined;
    quoteVisible.value = true;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}
async function requestQuote() {
  if (!draft.value) return;
  if (fulfillment.serviceMode === "DINE_IN" && !fulfillment.tableId) {
    ElMessage.warning("请选择可用桌台");
    return;
  }
  quoteLoading.value = true;
  try {
    quote.value = await billApi.quote(draft.value.id, fulfillment.serviceMode === "DINE_IN"
      ? { serviceMode: "DINE_IN", tableId: fulfillment.tableId, guestCount: fulfillment.guestCount }
      : { serviceMode: "TAKEOUT" });
  } catch (error) {
    ElMessage.error(errorStatus(error) === 409 ? "桌台或草稿状态已变化，请刷新后重新报价" : errorMessage(error));
  } finally {
    quoteLoading.value = false;
  }
}
async function confirm() {
  if (!draft.value || !quote.value) return;
  quoteLoading.value = true;
  try {
    const bill = await billApi.confirm(draft.value.id, {
      quoteId: quote.value.quoteId,
      idempotencyKey: crypto.randomUUID().replaceAll("-", "")
    });
    ElMessage.success("账单已确认并进入营业流程");
    quoteVisible.value = false;
    await router.push(`/bills/${bill.id}`);
  } catch (error) {
    if (errorStatus(error) === 409) quote.value = undefined;
    ElMessage.error(errorStatus(error) === 409 ? "报价已过期或账单发生变化，请重新报价" : errorMessage(error));
  } finally {
    quoteLoading.value = false;
  }
}
onMounted(loadProducts);
</script>

<template>
  <div class="ordering-page">
    <section class="ordering-catalog">
      <header class="page-head ordering-head">
        <div><p class="eyebrow">DRAFT · MERCHANT_WEB</p><h1>统一营业台</h1><p>先创建草稿并完成选品，结算时再选择堂食或外带。</p></div>
        <el-button @click="loadProducts">刷新商品</el-button>
      </header>
      <div class="catalog-tools">
        <el-input v-model="keyword" size="large" clearable placeholder="搜索菜品或套餐"/>
        <el-radio-group v-model="activeKind" size="large">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="dish">单点</el-radio-button>
          <el-radio-button value="setmeal">套餐</el-radio-button>
        </el-radio-group>
      </div>
      <section v-loading="loading" class="production-dish-grid">
        <article v-for="product in filtered" :key="keyOf(product)" class="panel production-dish" tabindex="0" @click="add(product)" @keydown.enter="add(product)">
          <div class="dish-media">
            <img v-if="product.image" :src="product.image" :alt="product.name"/>
            <span v-else>{{ product.name.slice(0, 1) }}</span>
          </div>
          <div class="dish-copy"><strong>{{ product.name }}</strong><strong>{{ money(product.price) }}</strong></div>
        </article>
        <el-empty v-if="!loading&&!filtered.length" description="当前没有可售商品"/>
      </section>
    </section>

    <aside class="production-cart">
      <div class="cart-heading"><div><p class="eyebrow">CURRENT BILL</p><h2>当前账单草稿</h2></div><Transition name="count-pop" mode="out-in"><span :key="cartCount" class="cart-count">{{ cartCount }}</span></Transition></div>
      <p class="cart-rule">商品变化后覆盖草稿明细，并使旧报价失效</p>
      <div class="cart-lines">
        <article v-for="line in cartLines" :key="keyOf(line.product)" class="cart-line">
          <div><strong>{{ line.product.name }}</strong><small>{{ money(line.product.price) }} / 份</small></div>
          <div class="quantity-control"><button type="button" @click="decrease(line)">−</button><b>{{ line.quantity }}</b><button type="button" @click="line.quantity++">＋</button></div>
        </article>
        <el-empty v-if="!cartLines.length" :image-size="72" description="点击左侧商品加入账单"/>
      </div>
      <div class="cart-bottom">
        <div class="cart-total"><span>商品小计</span><strong>{{ money(cartTotal) }}</strong></div>
        <el-button type="primary" size="large" :loading="saving" :disabled="!cartLines.length" @click="openQuote">去结算 · 选择堂食或外带</el-button>
      </div>
    </aside>

    <el-dialog v-model="quoteVisible" title="履约方式与最终报价" width="min(820px, 94vw)" destroy-on-close>
      <div class="quote-production-layout">
        <section>
          <p class="eyebrow">FULFILLMENT</p>
          <div class="option-grid">
            <button class="option" :class="{selected:fulfillment.serviceMode==='DINE_IN'}" @click="fulfillment.serviceMode='DINE_IN';quote=undefined"><span>堂食</span><h3>绑定桌台</h3><p>需要选择空闲桌台和就餐人数。</p></button>
            <button class="option" :class="{selected:fulfillment.serviceMode==='TAKEOUT'}" @click="fulfillment.serviceMode='TAKEOUT';quote=undefined"><span>外带</span><h3>现场打包带走</h3><p>不占桌台，不需要顾客账号或预约时间。</p></button>
          </div>
          <div v-if="fulfillment.serviceMode==='DINE_IN'" class="fulfillment-fields">
            <el-form-item label="空闲桌台">
              <el-select v-model="fulfillment.tableId" placeholder="选择桌台" @change="quote=undefined">
                <el-option v-for="table in tables" :key="table.id" :label="`${table.areaName} · ${table.name}（${table.capacity}人）`" :value="table.id"/>
              </el-select>
            </el-form-item>
            <el-form-item label="就餐人数"><el-input-number v-model="fulfillment.guestCount" :min="1" :max="50" @change="quote=undefined"/></el-form-item>
          </div>
          <el-alert v-else title="现场外带" description="确认后进入统一后厨制作，制作完成且已收款后可确认交付。" type="info" :closable="false"/>
        </section>
        <section class="quote-card">
          <p class="eyebrow">QUOTE</p>
          <template v-if="quote">
            <div class="money-row"><span>商品金额</span><strong>{{ money(quote.amount) }}</strong></div>
            <div class="money-row"><span>优惠</span><strong>− {{ money(quote.discountAmount) }}</strong></div>
            <div class="money-row total-row"><span>应收</span><strong>{{ money(quote.payableAmount) }}</strong></div>
            <dl class="quote-meta"><div><dt>报价编号</dt><dd>{{ quote.quoteId }}</dd></div><div><dt>草稿版本</dt><dd>v{{ quote.version }}</dd></div><div><dt>有效期至</dt><dd>{{ quote.expiresAt.replace("T", " ").slice(0, 19) }}</dd></div></dl>
          </template>
          <div v-else class="quote-empty"><strong>{{ selectedTable?.name || (fulfillment.serviceMode==='TAKEOUT'?'现场外带':'待选桌台') }}</strong><p>点击“获取最终报价”后才能确认账单。</p></div>
        </section>
      </div>
      <template #footer>
        <el-button @click="quoteVisible=false">返回选菜</el-button>
        <el-button v-if="!quote" type="primary" :loading="quoteLoading" @click="requestQuote">获取最终报价</el-button>
        <el-button v-else type="primary" :loading="quoteLoading" @click="confirm">确认账单</el-button>
      </template>
    </el-dialog>
  </div>
</template>
