<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { workspaceApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import type { BusinessDay, BusinessMode, ShopBusinessSettings, WeeklyBusinessSchedule } from "@/types";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [settings: ShopBusinessSettings];
}>();

const days: Array<{ key: BusinessDay; label: string }> = [
  { key: "MONDAY", label: "周一" },
  { key: "TUESDAY", label: "周二" },
  { key: "WEDNESDAY", label: "周三" },
  { key: "THURSDAY", label: "周四" },
  { key: "FRIDAY", label: "周五" },
  { key: "SATURDAY", label: "周六" },
  { key: "SUNDAY", label: "周日" }
];
const emptySchedule = (): WeeklyBusinessSchedule => ({
  MONDAY: [], TUESDAY: [], WEDNESDAY: [], THURSDAY: [],
  FRIDAY: [], SATURDAY: [], SUNDAY: []
});

const loading = ref(false);
const saving = ref(false);
const loadError = ref("");
const form = reactive<{ mode: BusinessMode; weeklySchedule: WeeklyBusinessSchedule }>({
  mode: "MANUAL_CLOSED",
  weeklySchedule: emptySchedule()
});
const modeTip = computed(() => ({
  AUTO: "系统按照下方每周营业时间自动判断营业状态。",
  MANUAL_OPEN: "店铺保持营业，下方时间暂不参与状态计算。",
  MANUAL_CLOSED: "店铺保持打烊，下方时间暂不参与状态计算。"
}[form.mode]));

function cloneSchedule(schedule?: Partial<WeeklyBusinessSchedule>): WeeklyBusinessSchedule {
  const result = emptySchedule();
  for (const { key } of days) {
    result[key] = (schedule?.[key] || []).map(slot => ({ start: slot.start, end: slot.end }));
  }
  return result;
}

async function load() {
  loading.value = true;
  loadError.value = "";
  try {
    const settings = await workspaceApi.shopBusinessSettings();
    form.mode = settings.mode;
    form.weeklySchedule = cloneSchedule(settings.weeklySchedule);
  } catch (error) {
    loadError.value = errorMessage(error);
  } finally {
    loading.value = false;
  }
}

function addSlot(day: BusinessDay) {
  const slots = form.weeklySchedule[day];
  const previousEnd = slots.at(-1)?.end;
  if (!previousEnd) {
    slots.push({ start: "10:30", end: "14:30" });
    return;
  }
  const [hour, minute] = previousEnd.split(":").map(Number);
  const endMinutes = Math.min(hour * 60 + minute + 60, 23 * 60 + 59);
  const end = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
  if (previousEnd >= end) {
    ElMessage.warning("当天已经没有可添加的时间");
    return;
  }
  slots.push({ start: previousEnd, end });
}
function removeSlot(day: BusinessDay, index: number) {
  form.weeklySchedule[day].splice(index, 1);
}
function validateSchedule(): string | undefined {
  for (const { key, label } of days) {
    const sorted = [...form.weeklySchedule[key]].sort((a, b) => a.start.localeCompare(b.start));
    for (let index = 0; index < sorted.length; index++) {
      const slot = sorted[index];
      if (!slot.start || !slot.end) return `${label}的营业时段不完整`;
      if (slot.start >= slot.end) return `${label}的结束时间必须晚于开始时间`;
      if (index > 0 && slot.start < sorted[index - 1].end) return `${label}的营业时段不能重叠`;
    }
  }
}
async function save() {
  const validationMessage = validateSchedule();
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }
  saving.value = true;
  try {
    await workspaceApi.setBusinessHours(cloneSchedule(form.weeklySchedule));
    await workspaceApi.setBusinessMode(form.mode);
    const settings = await workspaceApi.shopBusinessSettings();
    ElMessage.success("营业设置已保存");
    emit("saved", settings);
    emit("update:modelValue", false);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}

watch(() => props.modelValue, visible => {
  if (visible) load();
});
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="营业设置"
    width="min(760px, 94vw)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-loading="loading" class="business-settings">
      <el-alert
        v-if="loadError"
        title="营业设置加载失败"
        :description="loadError"
        type="error"
        show-icon
        :closable="false"
      />
      <el-button v-if="loadError" link type="primary" @click="load">重新加载</el-button>

      <template v-else>
        <section class="business-mode">
          <div><strong>营业模式</strong><small>{{ modeTip }}</small></div>
          <el-radio-group v-model="form.mode">
            <el-radio-button value="AUTO">自动营业</el-radio-button>
            <el-radio-button value="MANUAL_OPEN">强制营业</el-radio-button>
            <el-radio-button value="MANUAL_CLOSED">强制打烊</el-radio-button>
          </el-radio-group>
        </section>

        <div class="schedule-heading">
          <div><strong>每周营业时间</strong><small>支持每天设置多个时段，空白表示当天休息。</small></div>
        </div>

        <section class="weekly-schedule">
          <article v-for="day in days" :key="day.key" class="schedule-day">
            <strong>{{ day.label }}</strong>
            <div v-if="form.weeklySchedule[day.key].length" class="schedule-slots">
              <div v-for="(slot, index) in form.weeklySchedule[day.key]" :key="index" class="schedule-slot">
                <el-time-picker v-model="slot.start" value-format="HH:mm" format="HH:mm" :clearable="false" placeholder="开始"/>
                <span>至</span>
                <el-time-picker v-model="slot.end" value-format="HH:mm" format="HH:mm" :clearable="false" placeholder="结束"/>
                <el-button link type="danger" @click="removeSlot(day.key, index)">删除</el-button>
              </div>
            </div>
            <span v-else class="day-closed">今日休息</span>
            <el-button class="add-slot" link type="primary" @click="addSlot(day.key)">＋ 添加时段</el-button>
          </article>
        </section>
      </template>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="loading || Boolean(loadError)" @click="save">保存设置</el-button>
    </template>
  </el-dialog>
</template>
