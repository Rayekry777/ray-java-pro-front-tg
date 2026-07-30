<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { rbacApi, resourceApi } from "@/api/services";
import { errorMessage } from "@/api/http";
import { useMerchantSession } from "@/session/merchantSession";
import type { Employee, PermissionDefinition, TenantRole } from "@/types";

const { session } = useMerchantSession();
const loading = ref(false);
const saving = ref(false);
const employees = ref<Employee[]>([]);
const roles = ref<TenantRole[]>([]);
const permissions = ref<PermissionDefinition[]>([]);
const selectedEmployee = ref<Employee>();
const selectedRoleIds = ref<number[]>([]);
const selectedStoreIds = ref<number[]>([]);
const defaultStoreId = ref<number>();
const activeTab = ref("employees");
const roleDialog = ref(false);
const editingRoleId = ref<number>();
const roleForm = reactive({ roleCode: "", name: "", description: "", permissions: [] as string[] });
const stores = computed(() => session.value?.authorizedStores || []);
const permissionGroups = computed(() => {
  const groups = new Map<string, PermissionDefinition[]>();
  for (const permission of permissions.value) {
    const namespace = permission.code.split(":")[0];
    groups.set(namespace, [...(groups.get(namespace) || []), permission]);
  }
  return [...groups.entries()];
});
async function load() {
  loading.value = true;
  try {
    const [employeePage, roleList, catalog] = await Promise.all([
      resourceApi.employees({ page: 1, pageSize: 100 }),
      rbacApi.roles(),
      rbacApi.permissions()
    ]);
    employees.value = employeePage.records;
    roles.value = roleList;
    permissions.value = catalog;
    if (!selectedEmployee.value && employees.value.length) await chooseEmployee(employees.value[0]);
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { loading.value = false; }
}
async function chooseEmployee(employee: Employee) {
  selectedEmployee.value = employee;
  saving.value = true;
  try {
    const [roleIds, storeAssignment] = await Promise.all([
      rbacApi.employeeRoles(employee.id),
      rbacApi.employeeStores(employee.id)
    ]);
    selectedRoleIds.value = roleIds;
    selectedStoreIds.value = storeAssignment.storeIds;
    defaultStoreId.value = storeAssignment.defaultStoreId;
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { saving.value = false; }
}
function handleStores(value: number[]) {
  selectedStoreIds.value = value;
  if (defaultStoreId.value && !value.includes(defaultStoreId.value)) defaultStoreId.value = value[0];
}
async function saveEmployeeAccess() {
  if (!selectedEmployee.value) return;
  if (!selectedStoreIds.value.length || !defaultStoreId.value) {
    ElMessage.warning("员工至少需要一个授权门店和默认门店");
    return;
  }
  saving.value = true;
  try {
    await rbacApi.assignEmployeeRoles(selectedEmployee.value.id, selectedRoleIds.value);
    await rbacApi.assignEmployeeStores(selectedEmployee.value.id, {
      storeIds: selectedStoreIds.value, defaultStoreId: defaultStoreId.value
    });
    ElMessage.success("员工岗位与门店授权已保存");
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { saving.value = false; }
}
function openRole(role?: TenantRole) {
  editingRoleId.value = role?.id;
  Object.assign(roleForm, {
    roleCode: role?.roleCode || "",
    name: role?.name || "",
    description: role?.description || "",
    permissions: [...(role?.permissions || [])]
  });
  roleDialog.value = true;
}
async function saveRole() {
  if (!roleForm.roleCode.trim() || !roleForm.name.trim()) {
    ElMessage.warning("角色编码和名称不能为空");
    return;
  }
  saving.value = true;
  try {
    const body = {
      roleCode: roleForm.roleCode.trim().toUpperCase(),
      name: roleForm.name.trim(), description: roleForm.description.trim() || undefined,
      permissions: roleForm.permissions
    };
    if (editingRoleId.value) await rbacApi.updateRole(editingRoleId.value, body);
    else await rbacApi.createRole(body);
    roleDialog.value = false;
    ElMessage.success("角色已保存");
    await load();
  } catch (error) { ElMessage.error(errorMessage(error)); }
  finally { saving.value = false; }
}
async function deleteRole(role: TenantRole) {
  await ElMessageBox.confirm(`确认删除自定义角色“${role.name}”？`, "删除角色", { type: "warning" });
  try { await rbacApi.deleteRole(role.id); ElMessage.success("角色已删除"); await load(); }
  catch (error) { if (error !== "cancel" && error !== "close") ElMessage.error(errorMessage(error)); }
}
onMounted(load);
</script>

<template>
  <div class="page access-page" v-loading="loading">
    <header class="page-head">
      <div><p class="eyebrow">EMPLOYEE ACCESS</p><h1>员工与权限</h1><p>岗位决定能力，门店授权决定数据范围；最后负责人保护由服务端执行。</p></div>
      <el-button v-if="activeTab==='roles'" type="primary" @click="openRole()">新建自定义角色</el-button>
    </header>
    <el-tabs v-model="activeTab" class="access-tabs">
      <el-tab-pane label="员工授权" name="employees">
        <section class="form-grid access-grid">
          <aside class="panel employee-list">
            <button v-for="employee in employees" :key="employee.id" class="employee-card" :class="{active:selectedEmployee?.id===employee.id}" @click="chooseEmployee(employee)">
              <span class="employee-avatar">{{ employee.name.slice(0,1) }}</span><div><strong>{{ employee.name }}</strong><small>@{{ employee.username }} · {{ employee.status===1?"启用":"禁用" }}</small></div>
            </button>
            <el-empty v-if="!employees.length" description="暂无员工"/>
          </aside>
          <article class="panel employee-form">
            <template v-if="selectedEmployee">
              <div class="section-title"><div><p class="eyebrow">ASSIGNMENT</p><h2>{{ selectedEmployee.name }}</h2></div><el-tag :type="selectedEmployee.status===1?'success':'info'">{{ selectedEmployee.status===1?"账号启用":"账号禁用" }}</el-tag></div>
              <h3>系统岗位与自定义角色</h3>
              <el-checkbox-group v-model="selectedRoleIds" class="role-check-grid">
                <el-checkbox v-for="role in roles" :key="role.id" :value="role.id" border>
                  <span>{{ role.name }}</span><small>{{ role.systemRole ? "系统岗位" : role.roleCode }}</small>
                </el-checkbox>
              </el-checkbox-group>
              <h3>授权门店</h3>
              <el-checkbox-group :model-value="selectedStoreIds" class="store-check-grid" @update:model-value="handleStores($event as number[])">
                <el-checkbox v-for="store in stores" :key="store.id" :value="store.id" border>{{ store.name }}</el-checkbox>
              </el-checkbox-group>
              <el-form-item label="默认门店" class="default-store-field">
                <el-select v-model="defaultStoreId" placeholder="选择默认门店"><el-option v-for="store in stores.filter(item=>selectedStoreIds.includes(item.id))" :key="store.id" :label="store.name" :value="store.id"/></el-select>
              </el-form-item>
              <el-alert title="权限边界" description="门店经理不能授予租户负责人，也不能管理越级权限；移除最后一个租户负责人会被服务端拒绝。" type="warning" :closable="false"/>
              <div class="form-actions"><el-button type="primary" :loading="saving" @click="saveEmployeeAccess">保存员工授权</el-button></div>
            </template>
            <el-empty v-else description="选择员工后配置岗位和门店"/>
          </article>
        </section>
      </el-tab-pane>
      <el-tab-pane label="角色与权限目录" name="roles">
        <section class="role-grid">
          <article v-for="role in roles" :key="role.id" class="panel role-card-production">
            <header><div><span class="tag" :class="{ok:role.systemRole}">{{ role.systemRole?"系统岗位":"自定义" }}</span><h2>{{ role.name }}</h2><code>{{ role.roleCode }}</code></div><strong>{{ role.permissions.includes("*")?"全部":role.permissions.length }}</strong></header>
            <p>{{ role.description || "暂无说明" }}</p>
            <div class="role-permission-preview"><span v-for="permission in role.permissions.slice(0,6)" :key="permission">{{ permission }}</span><small v-if="role.permissions.length>6">+{{ role.permissions.length-6 }}</small></div>
            <footer v-if="!role.systemRole"><el-button link type="primary" @click="openRole(role)">编辑</el-button><el-button link type="danger" @click="deleteRole(role)">删除</el-button></footer>
            <footer v-else><small>系统岗位只读，保持五类岗位基线</small></footer>
          </article>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="roleDialog" :title="editingRoleId?'编辑自定义角色':'新建自定义角色'" width="min(820px, 94vw)">
      <div class="role-basic-fields"><el-form-item label="角色编码"><el-input v-model="roleForm.roleCode" maxlength="64" placeholder="例如 SHIFT_LEADER"/></el-form-item><el-form-item label="角色名称"><el-input v-model="roleForm.name" maxlength="64"/></el-form-item></div>
      <el-form-item label="角色说明"><el-input v-model="roleForm.description" type="textarea" maxlength="255" show-word-limit/></el-form-item>
      <h3>固定权限目录</h3>
      <el-checkbox-group v-model="roleForm.permissions" class="permission-groups">
        <section v-for="[group,items] in permissionGroups" :key="group" class="permission-group"><h4>{{ group }}</h4><el-checkbox v-for="permission in items" :key="permission.code" :value="permission.code"><span>{{ permission.name }}</span><code>{{ permission.code }}</code></el-checkbox></section>
      </el-checkbox-group>
      <template #footer><el-button @click="roleDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="saveRole">保存角色</el-button></template>
    </el-dialog>
  </div>
</template>
