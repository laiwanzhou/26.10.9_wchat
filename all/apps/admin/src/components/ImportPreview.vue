<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { demo, saveDemo, newId } from "../stores/demo";
import { questionTypes, type QuestionType } from "../data/seed";
import {
  importFields,
  inferMapping,
  previewQuestionRows,
  mergeQuestionImport,
  type FieldMapping,
  type DuplicateMode,
} from "../domain/question-import";
import { readXlsx, exampleWorkbook, type ImportSheet } from "../services/excel";
const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
const picker = ref<HTMLInputElement>(),
  sheets = ref<ImportSheet[]>([]),
  sheetName = ref(""),
  mapping = ref<FieldMapping>({}),
  fileName = ref(""),
  error = ref(""),
  reading = ref(false),
  mode = ref<DuplicateMode>("reject"),
  onlyErrors = ref(false),
  page = ref(1),
  templateBusy = ref(false);
let generation = 0;
const sheet = computed(() =>
  sheets.value.find((item) => item.name === sheetName.value),
);
const preview = computed(() =>
  sheet.value
    ? previewQuestionRows(
        sheet.value.rows,
        mapping.value,
        demo.value.questions,
        mode.value,
      )
    : [],
);
const errors = computed(() => preview.value.filter((row) => row.errors.length));
const replacements = computed(() =>
  preview.value.filter((row) => row.replacesId && !row.errors.length),
);
const filtered = computed(() =>
    onlyErrors.value ? errors.value : preview.value,
  ),
  rows = computed(() =>
    filtered.value.slice((page.value - 1) * 20, page.value * 20),
  );
watch(sheetName, () => {
  mapping.value = sheet.value ? inferMapping(sheet.value.headers) : {};
  page.value = 1;
});
watch([onlyErrors, mode, mapping], () => (page.value = 1), { deep: true });
watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      generation++;
      reading.value = false;
    }
  },
);
async function pick(event: Event) {
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file) return;
  const current = ++generation;
  error.value = "";
  sheets.value = [];
  sheetName.value = "";
  mapping.value = {};
  fileName.value = file.name;
  reading.value = true;
  try {
    if (!/\.xlsx$/i.test(file.name))
      throw Error("只支持 .xlsx，请将旧 Excel 文件另存为 .xlsx");
    if (file.size > 10 * 1024 * 1024) throw Error("文件不能超过 10 MiB");
    const parsed = await readXlsx(await file.arrayBuffer());
    if (current !== generation) return;
    if (!parsed.length) throw Error("没有可读取的工作表");
    sheets.value = parsed;
    sheetName.value = parsed[0].name;
  } catch (issue) {
    if (current === generation)
      error.value =
        issue instanceof Error ? issue.message : "Excel 文件无法解析";
  } finally {
    if (current === generation) reading.value = false;
    input.value = "";
  }
}
async function template() {
  templateBusy.value = true;
  try {
    const bytes = await exampleWorkbook();
    const url = URL.createObjectURL(
      new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "题库演示模板.xlsx";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    ElMessage.error("模板生成失败");
  } finally {
    templateBusy.value = false;
  }
}
// [PRE-LAUNCH:PL-08] 当前原子写入本地仓库。后续换 POST /api/admin/questions/import，重复策略与批次结果/失败回滚必须同改。
async function confirm() {
  if (!preview.value.length || errors.value.length) return;
  try {
    await ElMessageBox.confirm(
      "确认将 " +
        preview.value.length +
        " 条题目导入当前浏览器？覆盖已有 " +
        replacements.value.length +
        " 条，不会写入服务器。",
      "确认导入",
      { confirmButtonText: "确认导入", cancelButtonText: "取消" },
    );
    if (
      saveDemo(
        (data) =>
          (data.questions = mergeQuestionImport(
            data.questions,
            preview.value,
            mode.value,
            newId,
          )),
      )
    ) {
      ElMessage.success("题目已导入本地题库");
      emit("update:modelValue", false);
    }
  } catch (issue) {
    if (issue instanceof Error) ElMessage.error(issue.message);
  }
}
</script>
<template>
  <el-dialog
    :model-value="modelValue"
    title="Excel 导入预览"
    width="min(1060px,96vw)"
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <div class="module-notice">
      仅支持 .xlsx，10 MiB、2000 行、64
      列以内。不执行公式、不解析内嵌图片。列映射可调整，最终模板等待甲方样本确认。
    </div>
    <div class="import-toolbar">
      <el-button type="primary" :loading="reading" @click="picker?.click()"
        >选择 Excel 文件</el-button
      ><el-button :loading="templateBusy" @click="template"
        >下载演示模板</el-button
      ><span>{{ fileName || "尚未选择文件" }}</span
      ><input ref="picker" type="file" accept=".xlsx" hidden @change="pick" />
    </div>
    <div v-if="error" class="validation-errors" role="alert">{{ error }}</div>
    <template v-if="sheet"
      ><div class="form-two-columns">
        <el-form-item label="工作表"
          ><el-select v-model="sheetName"
            ><el-option
              v-for="item in sheets"
              :key="item.name"
              :value="item.name"
              :label="item.name" /></el-select></el-form-item
        ><el-form-item label="重复题目处理"
          ><el-select v-model="mode"
            ><el-option value="reject" label="拒绝重复题目（默认）" /><el-option
              value="replace"
              label="按题型＋题干覆盖，并保留原 ID" /></el-select
        ></el-form-item>
      </div>
      <div class="editor-section-heading">
        <strong>列映射</strong
        ><span class="field-help">首行为列名；同一列不能重复映射。</span>
      </div>
      <div class="mapping-grid">
        <div v-for="field in importFields" :key="field.key">
          <label>{{ field.label }}</label
          ><el-select
            :model-value="mapping[field.key] ?? undefined"
            clearable
            placeholder="不映射"
            @change="mapping = { ...mapping, [field.key]: $event ?? null }"
            ><el-option
              v-for="(header, index) in sheet.headers"
              :key="index"
              :value="index"
              :label="header + ' [列' + (index + 1) + ']'"
          /></el-select>
        </div>
      </div>
      <div class="import-summary">
        <span
          >共 <strong>{{ preview.length }}</strong> 行</span
        ><span class="import-error-count"
          >错误 <strong>{{ errors.length }}</strong> 行</span
        ><span
          >覆盖已有 <strong>{{ replacements.length }}</strong> 行</span
        ><el-switch v-model="onlyErrors" active-text="只看错误行" />
      </div>
      <el-table :data="rows" max-height="330" empty-text="没有可预览的数据"
        ><el-table-column
          prop="rowNumber"
          label="Excel 行号"
          width="100"
        /><el-table-column label="题型" width="140"
          ><template #default="{ row }">{{
            questionTypes[row.question.type as QuestionType] || "未识别"
          }}</template></el-table-column
        ><el-table-column label="题干" min-width="200"
          ><template #default="{ row }">{{
            row.question.stem
          }}</template></el-table-column
        ><el-table-column label="标准答案" min-width="120"
          ><template #default="{ row }">{{
            row.question.answers.join(" / ")
          }}</template></el-table-column
        ><el-table-column label="校验结果" min-width="250"
          ><template #default="{ row }"
            ><span v-if="row.errors.length" class="import-row-error">{{
              row.errors.join("；")
            }}</span
            ><el-tag
              v-else
              :type="row.replacesId ? 'warning' : 'success'"
              effect="plain"
              >{{ row.replacesId ? "可导入，将覆盖" : "可导入" }}</el-tag
            ></template
          ></el-table-column
        ></el-table
      >
      <div class="table-footer">
        <span>选择题答案填 A/B/C/D 或唯一选项文本；填空多个答案用 | 分隔。</span
        ><el-pagination
          v-model:current-page="page"
          :page-size="20"
          :total="filtered.length"
          layout="prev, pager, next"
        />
      </div> </template
    ><template #footer
      ><el-button @click="emit('update:modelValue', false)">取消</el-button
      ><el-button
        type="primary"
        :disabled="reading || !preview.length || !!errors.length"
        @click="confirm"
        >确认导入 {{ preview.length }} 条</el-button
      ></template
    >
  </el-dialog>
</template>
