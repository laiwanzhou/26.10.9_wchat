<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { demo, saveDemo, newId, demoMigrationNotice } from "../stores/demo";
import { questionTypes, type Question, type QuestionType } from "../data/seed";
import {
  questionErrors,
  formatQuestionAnswer,
  stableSort,
} from "../domain/content-model";
import AppIcon from "../components/AppIcon.vue";
import AssetPicker from "../components/AssetPicker.vue";
import ImportPreview from "../components/ImportPreview.vue";
const keyword = ref(""),
  type = ref(""),
  status = ref(""),
  page = ref(1),
  dialog = ref(false),
  importOpen = ref(false),
  attempted = ref(false),
  fillAnswers = ref("");
const blank = (): Question => ({
  id: "",
  type: "idiom",
  stem: "",
  answers: [],
  options: [],
  explanation: "",
  enabled: false,
  sortOrder: 0,
  updatedAt: "",
});
const form = ref(blank());
let previousType: QuestionType = "idiom";
const choice = computed(
  () => form.value.type === "law" || form.value.type === "image",
);
const selectedAnswer = computed({
  get: () => form.value.answers[0] || "",
  set: (value: string) => (form.value.answers = value ? [value] : []),
});
const filtered = computed(() =>
  stableSort(demo.value.questions).filter(
    (q) =>
      (!type.value || q.type === type.value) &&
      (!status.value || String(q.enabled) === status.value) &&
      q.stem.includes(keyword.value.trim()),
  ),
);
const rows = computed(() =>
  filtered.value.slice((page.value - 1) * 8, page.value * 8),
);
const currentRecord = computed(() => ({
  ...form.value,
  answers: choice.value
    ? form.value.answers
    : [
        ...new Set(
          fillAnswers.value
            .split(/\r?\n/)
            .map((a) => a.trim())
            .filter(Boolean),
        ),
      ],
}));
const issues = computed(() => questionErrors(currentRecord.value));
watch([keyword, type, status], () => (page.value = 1));
watch(
  () => filtered.value.length,
  () =>
    (page.value = Math.max(
      1,
      Math.min(page.value, Math.ceil(filtered.value.length / 8)),
    )),
);
function edit(q?: Question) {
  form.value = q ? JSON.parse(JSON.stringify(q)) : blank();
  previousType = form.value.type;
  fillAnswers.value = choice.value ? "" : form.value.answers.join("\n");
  attempted.value = false;
  dialog.value = true;
}
function changeType(next: QuestionType) {
  const wasChoice = previousType === "law" || previousType === "image";
  const isChoice = next === "law" || next === "image";
  if (wasChoice !== isChoice) {
    form.value.options = isChoice
      ? ["a", "b", "c", "d"].map((id) => ({ id, label: "" }))
      : [];
    form.value.answers = [];
    fillAnswers.value = "";
  }
  previousType = next;
}
function addOption() {
  if (form.value.options.length < 8)
    form.value.options.push({ id: newId(), label: "" });
}
function removeOption(index: number) {
  const removed = form.value.options.splice(index, 1)[0];
  if (form.value.answers.includes(removed.id)) form.value.answers = [];
}
// [CONTRACT:C-01] 保存完整 options/answers，不把正确答案文本当作选择 ID。与导入、共享契约、小程序答题和未来 server questions 同改。
function save() {
  attempted.value = true;
  if (!Number.isSafeInteger(form.value.sortOrder) || form.value.sortOrder < 0) {
    ElMessage.warning("排序必须为非负整数");
    return;
  }
  if (!form.value.stem.trim()) {
    ElMessage.warning("请填写题干");
    return;
  }
  if (form.value.enabled && issues.value.length) {
    ElMessage.warning(issues.value[0]);
    return;
  }
  const record: Question = JSON.parse(
    JSON.stringify({
      ...currentRecord.value,
      stem: form.value.stem.trim(),
      id: form.value.id || newId(),
      updatedAt: new Date().toISOString(),
      migrationNote: issues.value.length ? "草稿资料待补全" : undefined,
    }),
  );
  if (
    saveDemo((d) => {
      const index = d.questions.findIndex((q) => q.id === record.id);
      if (index < 0) d.questions.unshift(record);
      else d.questions[index] = record;
    })
  ) {
    dialog.value = false;
    ElMessage.success(
      record.enabled ? "题目已启用并保存到本地" : "草稿已保存到本地",
    );
  }
}
async function remove(q: Question) {
  try {
    await ElMessageBox.confirm("删除这道本地题目？", "删除题目", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    saveDemo(
      (d) => (d.questions = d.questions.filter((item) => item.id !== q.id)),
    );
  } catch {}
}
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">QUESTION BANK</span>
      <h1>题库管理</h1>
      <p>从选项到答案，维护完整的练习内容。</p>
    </div>
    <div class="page-actions">
      <el-button size="large" @click="importOpen = true"
        ><AppIcon name="upload" :size="17" />导入预览</el-button
      ><el-button type="primary" size="large" @click="edit()"
        ><AppIcon name="plus" :size="17" />新增题目</el-button
      >
    </div>
  </div>
  <div class="module-notice">
    当前保存到本地浏览器，选择／填空结构与小程序契约一致；真实数据同步后续接入。
  </div>
  <div v-if="demoMigrationNotice" class="module-notice amber-notice">
    {{ demoMigrationNotice }}
  </div>
  <section class="panel">
    <div class="filter-row">
      <el-input
        v-model="keyword"
        placeholder="搜索题目内容"
        clearable
        class="search-input"
      /><el-select v-model="type" placeholder="全部题型" clearable
        ><el-option
          v-for="(label, key) in questionTypes"
          :key="key"
          :value="key"
          :label="label" /></el-select
      ><el-select v-model="status" placeholder="全部状态" clearable
        ><el-option value="true" label="已启用" /><el-option
          value="false"
          label="草稿" /></el-select
      ><span class="filter-count">共 {{ filtered.length }} 道题目</span>
    </div>
    <el-table :data="rows" empty-text="没有匹配的题目"
      ><el-table-column label="题目内容" min-width="230"
        ><template #default="{ row }"
          ><strong class="table-title">{{ row.stem }}</strong
          ><small class="table-sub"
            >{{ row.id.slice(0, 8)
            }}<span v-if="row.migrationNote">
              · {{ row.migrationNote }}</span
            ></small
          ></template
        ></el-table-column
      ><el-table-column label="题型" width="150"
        ><template #default="{ row }"
          ><el-tag effect="plain" type="info">{{
            questionTypes[row.type as QuestionType]
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="标准答案" min-width="130"
        ><template #default="{ row }">{{
          formatQuestionAnswer(row) || "待填写"
        }}</template></el-table-column
      ><el-table-column label="状态" width="85"
        ><template #default="{ row }"
          ><span class="state" :class="{ off: !row.enabled }"
            ><i></i>{{ row.enabled ? "已启用" : "草稿" }}</span
          ></template
        ></el-table-column
      ><el-table-column
        prop="sortOrder"
        label="排序"
        width="70"
      /><el-table-column label="操作" width="120"
        ><template #default="{ row }"
          ><el-button link type="primary" @click="edit(row)">编辑</el-button
          ><el-button link type="danger" @click="remove(row)"
            >删除</el-button
          ></template
        ></el-table-column
      ></el-table
    >
    <div class="table-footer">
      <span>选择答案按选项保存；填空可设置多个接受的答案。</span
      ><el-pagination
        v-model:current-page="page"
        :page-size="8"
        :total="filtered.length"
        layout="prev, pager, next"
      />
    </div>
  </section>
  <el-dialog
    v-model="dialog"
    :title="form.id ? '编辑题目' : '新增题目'"
    width="min(720px,94vw)"
    destroy-on-close
  >
    <el-form label-position="top"
      ><div class="form-two-columns">
        <el-form-item label="题型"
          ><el-select v-model="form.type" @change="changeType"
            ><el-option
              v-for="(label, key) in questionTypes"
              :key="key"
              :value="key"
              :label="label" /></el-select></el-form-item
        ><el-form-item label="展示排序"
          ><el-input-number v-model="form.sortOrder" :min="0" :precision="0"
        /></el-form-item>
      </div>
      <el-form-item label="题干"
        ><el-input
          v-model="form.stem"
          type="textarea"
          :rows="3"
          maxlength="1000"
          show-word-limit
      /></el-form-item>
      <template v-if="choice"
        ><div class="editor-section-heading">
          <strong>选择选项</strong
          ><el-button :disabled="form.options.length >= 8" @click="addOption"
            >添加选项</el-button
          >
        </div>
        <div
          v-for="(option, index) in form.options"
          :key="option.id"
          class="question-option-editor"
        >
          <div class="option-editor-row">
            <span class="option-editor-letter">{{
              String.fromCharCode(65 + index)
            }}</span
            ><el-input
              v-model="option.label"
              :aria-label="'选项' + String.fromCharCode(65 + index)"
              placeholder="请输入选项内容"
              maxlength="300"
            /><el-button link type="danger" @click="removeOption(index)"
              >删除</el-button
            >
          </div>
          <AssetPicker
            v-if="form.type === 'image'"
            v-model="option.image"
            v-model:asset-id="option.imageAssetId"
          />
        </div>
        <el-form-item label="正确答案"
          ><el-select v-model="selectedAnswer" placeholder="请选择正确选项"
            ><el-option
              v-for="(option, index) in form.options"
              :key="option.id"
              :value="option.id"
              :label="
                String.fromCharCode(65 + index) +
                ' · ' +
                (option.label || '未填写')
              " /></el-select></el-form-item
      ></template>
      <el-form-item v-else label="可接受的标准答案"
        ><el-input
          v-model="fillAnswers"
          type="textarea"
          :rows="3"
          placeholder="每行填写一个答案；前后空格会忽略"
        />
        <p class="field-help">
          不进行语义判分；是否接受不同写法以甲方规则为准。
        </p></el-form-item
      >
      <el-form-item label="解析"
        ><el-input
          v-model="form.explanation"
          type="textarea"
          :rows="2"
          maxlength="1000" /></el-form-item
      ><el-form-item label="启用状态"
        ><el-switch
          v-model="form.enabled"
          active-text="启用"
          inactive-text="草稿"
      /></el-form-item>
    </el-form>
    <div
      v-if="(attempted || form.enabled) && issues.length"
      class="validation-errors"
      role="alert"
    >
      <strong>启用前需补齐：</strong>
      <ul>
        <li v-for="issue in issues" :key="issue">{{ issue }}</li>
      </ul>
      <span v-if="!form.enabled">仍可保存为草稿。</span>
    </div>
    <template #footer
      ><el-button @click="dialog = false">取消</el-button
      ><el-button type="primary" @click="save">保存到本地</el-button></template
    >
  </el-dialog>
  <ImportPreview v-model="importOpen" />
</template>
