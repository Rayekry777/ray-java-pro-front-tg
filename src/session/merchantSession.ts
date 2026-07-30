import { computed, reactive, readonly } from "vue";
import { sessionApi } from "@/api/services";
import { clearSession, saveToken } from "@/api/http";
import type { MerchantSession } from "@/types";

const state = reactive<{
  current?: MerchantSession;
  loading: boolean;
  initialized: boolean;
  error: string;
}>({
  loading: false,
  initialized: false,
  error: ""
});

let inflight: Promise<MerchantSession> | undefined;

async function loadSession(force = false) {
  if (state.current && state.initialized && !force) return state.current;
  if (inflight) return inflight;
  state.loading = true;
  state.error = "";
  inflight = sessionApi.current()
    .then(session => {
      state.current = session;
      state.initialized = true;
      return session;
    })
    .catch(error => {
      state.current = undefined;
      state.initialized = false;
      state.error = error instanceof Error ? error.message : "会话初始化失败";
      throw error;
    })
    .finally(() => {
      state.loading = false;
      inflight = undefined;
    });
  return inflight;
}

function hasPermission(permission?: string) {
  if (!permission) return true;
  const permissions = state.current?.permissions || [];
  return permissions.includes("*") || permissions.includes(permission);
}

function hasAnyPermission(permissions: string[] = []) {
  return permissions.length === 0 || permissions.some(hasPermission);
}

async function switchStore(storeId: number) {
  const result = await sessionApi.switchStore(storeId);
  saveToken(result.token);
  return loadSession(true);
}

function resetMerchantSession() {
  state.current = undefined;
  state.initialized = false;
  state.error = "";
}

function endMerchantSession() {
  resetMerchantSession();
  clearSession();
}

export function useMerchantSession() {
  return {
    state: readonly(state),
    session: computed(() => state.current),
    employee: computed(() => state.current?.employee),
    activeStore: computed(() => state.current?.activeStore),
    roles: computed(() => state.current?.roles || []),
    permissions: computed(() => state.current?.permissions || []),
    loadSession,
    hasPermission,
    hasAnyPermission,
    switchStore,
    resetMerchantSession,
    endMerchantSession
  };
}
