<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { demo, saveDemo, newId } from "../stores/demo";
import type { Candidate } from "../data/seed";
import {
  activityErrors,
  beijingToUtc,
  utcToBeijing,
  stableSort,
} from "../domain/content-model";
import AppIcon from "../components/AppIcon.vue";
import AssetPicker from "../components/AssetPicker.vue";
const keyword = ref(""),
  dialog = ref(false);
const settings = ref({
  ...demo.value.activity,
  startLocal: utcToBeijing(demo.value.activity.startAt),
  endLocal: utcToBeijing(demo.value.activity.endAt),
});
const blank = (): Candidate => ({
  id: "",
  name: "",
  number: "",
  intro: "",
  color: "#e9efe2",
  mark: "",
  votes: 0,
  enabled: false,
  sortOrder: 0,
  photo: undefined,
  photoAssetId: undefined,
});
const form = ref(blank());
const rows = computed(() =>
  stableSort(demo.value.candidates).filter((item) =>
    `${item.name} ${item.number}`.includes(keyword.value.trim()),
  ),
);
const previewStatus = computed(() => {
  const a = demo.value.activity;
  if (!a.enabled) return "未开启";
  const now = Date.now();
  if (a.startAt && now < Date.parse(a.startAt)) return "待开始";
  if (a.endAt && now >= Date.parse(a.endAt)) return "已结束";
  return "配置已开启";
});
function edit(item?: Candidate) {
  form.value = item ? JSON.parse(JSON.stringify(item)) : blank();
  dialog.value = true;
}
function save() {
  if (!form.value.name.trim() || !form.value.number.trim()) {
    ElMessage.warning("请填写编号和姓名");
    return;
  }
  if (!Number.isSafeInteger(form.value.sortOrder) || form.value.sortOrder < 0) {
    ElMessage.warning("排序必须为非负整数");
    return;
  }
  if (
    demo.value.candidates.some(
      (item) =>
        item.id !== form.value.id && item.number === form.value.number.trim(),
    )
  ) {
    ElMessage.warning("选手编号已存在");
    return;
  }
  const record = {
    ...form.value,
    id: form.value.id || newId(),
    name: form.value.name.trim(),
    number: form.value.number.trim(),
    intro: form.value.intro.trim(),
    mark: form.value.name.trim().slice(-1),
  };
  if (
    saveDemo((data) => {
      const index = data.candidates.findIndex((item) => item.id === record.id);
      if (index < 0) data.candidates.push(record);
      else data.candidates[index] = record;
    })
  ) {
    dialog.value = false;
    ElMessage.success("选手资料已保存到本地");
  }
}
// [CONTRACT:C-03] 页面用北京时间字符串，接口/存储使用 UTC ISO；与 ActivityConfig、server activity DTO 和小程序活动响应同改。
// [PRE-LAUNCH:PL-07] enabled 只保存配置。真实日期/IP/04:00/并发计票由服务端校验；此页面不会开通投票。
function saveSettings() {
  try {
    const activity = {
      title: settings.value.title.trim(),
      dailyLimit: settings.value.dailyLimit,
      enabled: settings.value.enabled,
      startAt: beijingToUtc(settings.value.startLocal || ""),
      endAt: beijingToUtc(settings.value.endLocal || ""),
    };
    const errors = activityErrors(activity);
    if (errors.length) {
      ElMessage.warning(errors[0]);
      return;
    }
    if (saveDemo((data) => (data.activity = activity)))
      ElMessage.success("活动配置已保存到本地，真实投票仍未开放");
  } catch (issue) {
    ElMessage.warning(
      issue instanceof Error ? issue.message : "时间格式不正确",
    );
  }
}
async function remove(id: string) {
  try {
    await ElMessageBox.confirm("删除这位本地选手？", "删除选手", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    saveDemo(
      (data) =>
        (data.candidates = data.candidates.filter((item) => item.id !== id)),
    );
  } catch {}
}
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">LANGUAGE COMPETITION</span>
      <h1>大赛管理</h1>
      <p>准备活动时间、参赛资料与展示顺序。</p>
    </div>
    <el-button type="primary" size="large" @click="edit()"
      ><AppIcon name="plus" :size="17" />新增选手</el-button
    >
  </div>
  <div class="module-notice amber-notice">
    <AppIcon name="clock" :size="18" />这里只保存前端配置；真实投票、IP
    限额和计票在后端接入后实施。
  </div>
  <div class="voting-layout">
    <section class="panel">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索选手姓名或编号"
          clearable
          class="search-input"
        /><span class="filter-count">{{ rows.length }} 位选手</span>
      </div>
      <el-table :data="rows" empty-text="没有匹配的选手"
        ><el-table-column label="选手" min-width="180"
          ><template #default="{ row }"
            ><div class="candidate-cell">
              <img
                v-if="row.photo"
                :src="row.photo"
                class="candidate-photo"
                alt="选手照片"
              /><span
                v-else
                class="candidate-avatar"
                :style="{ background: row.color }"
                >{{ row.mark }}</span
              ><span
                ><strong>{{ row.name }}</strong
                ><small>编号 {{ row.number }}</small></span
              >
            </div></template
          ></el-table-column
        ><el-table-column
          prop="intro"
          label="个人简介"
          min-width="170"
          show-overflow-tooltip
        /><el-table-column
          prop="sortOrder"
          label="排序"
          width="70"
        /><el-table-column label="展示" width="90"
          ><template #default="{ row }"
            ><el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">{{
              row.enabled ? "展示" : "隐藏"
            }}</el-tag></template
          ></el-table-column
        ><el-table-column label="操作" width="120"
          ><template #default="{ row }"
            ><el-button link type="primary" @click="edit(row)">编辑</el-button
            ><el-button link type="danger" @click="remove(row.id)"
              >删除</el-button
            ></template
          ></el-table-column
        ></el-table
      >
      <p class="panel-footnote">
        照片从图片资源选择；数值小者优先，同序项保持稳定顺序。
      </p>
    </section>
    <section class="panel activity-panel">
      <div class="panel-heading">
        <h3>活动配置</h3>
        <el-tag effect="plain" type="info">{{ previewStatus }}</el-tag>
      </div>
      <el-form label-position="top"
        ><el-form-item label="活动名称"
          ><el-input v-model="settings.title" maxlength="60" /></el-form-item
        ><el-form-item label="开始时间（北京时间）"
          ><el-date-picker
            v-model="settings.startLocal"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间" /></el-form-item
        ><el-form-item label="结束时间（北京时间）"
          ><el-date-picker
            v-model="settings.endLocal"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间" /></el-form-item
        ><el-form-item label="每个 IP 每日投票次数"
          ><el-input-number
            v-model="settings.dailyLimit"
            :min="1"
            :precision="0"
          />
          <p class="field-help">正式限额待确认；演示值可调整。</p></el-form-item
        ><el-form-item label="每日额度刷新时间"
          ><div class="reset-time">
            <AppIcon name="clock" :size="18" /><strong>04:00</strong
            ><span>北京时间</span>
          </div></el-form-item
        ><el-form-item label="投票开启配置"
          ><el-switch v-model="settings.enabled" />
          <p class="field-help">
            开启需完整起止时间；不会开放真实投票。
          </p></el-form-item
        ><el-button type="primary" class="full-width" @click="saveSettings"
          >保存本地配置</el-button
        ></el-form
      >
    </section>
  </div>
  <el-dialog
    v-model="dialog"
    :title="form.id ? '编辑选手' : '新增选手'"
    width="min(620px,94vw)"
    ><el-form label-position="top"
      ><div class="form-two-columns">
        <el-form-item label="选手编号"
          ><el-input v-model="form.number" maxlength="20" /></el-form-item
        ><el-form-item label="姓名"
          ><el-input v-model="form.name" maxlength="40"
        /></el-form-item>
      </div>
      <el-form-item label="选手照片"
        ><AssetPicker
          v-model="form.photo"
          v-model:asset-id="form.photoAssetId" /></el-form-item
      ><el-form-item label="个人简介"
        ><el-input
          v-model="form.intro"
          type="textarea"
          :rows="3"
          maxlength="300"
          show-word-limit
      /></el-form-item>
      <div class="form-two-columns">
        <el-form-item label="展示排序"
          ><el-input-number
            v-model="form.sortOrder"
            :min="0"
            :precision="0" /></el-form-item
        ><el-form-item label="展示状态"
          ><el-switch
            v-model="form.enabled"
            active-text="展示"
            inactive-text="隐藏"
        /></el-form-item></div></el-form
    ><template #footer
      ><el-button @click="dialog = false">取消</el-button
      ><el-button type="primary" @click="save">保存到本地</el-button></template
    ></el-dialog
  >
</template>
