<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { demo, saveDemo, newId } from "../stores/demo";
import type { Word, Video } from "../data/seed";
import { wordErrors, videoErrors, stableSort } from "../domain/content-model";
import AppIcon from "../components/AppIcon.vue";
import AssetPicker from "../components/AssetPicker.vue";
const tab = ref("words"),
  keyword = ref(""),
  status = ref(""),
  category = ref(""),
  dialog = ref(false),
  editingKind = ref("words");
const blank = () => ({
  id: "",
  text: "",
  pinyin: "",
  definition: "",
  example: "",
  title: "",
  category: "基础发音",
  duration: "待提供",
  url: "",
  cover: undefined as string | undefined,
  coverAssetId: undefined as string | undefined,
  sortOrder: 0,
  enabled: false,
});
const form = ref(blank());
const words = computed(() =>
  stableSort(demo.value.words).filter(
    (word) =>
      (!status.value || String(word.enabled) === status.value) &&
      `${word.text} ${word.pinyin}`.includes(keyword.value.trim()),
  ),
);
const videos = computed(() =>
  stableSort(demo.value.videos).filter(
    (video) =>
      (!status.value || String(video.enabled) === status.value) &&
      (!category.value || video.category === category.value) &&
      video.title.includes(keyword.value.trim()),
  ),
);
const categories = computed(() => [
  ...new Set([
    "基础发音",
    "日常表达",
    "朗读训练",
    ...demo.value.videos.map((video) => video.category),
  ]),
]);
function edit(item?: Word | Video) {
  editingKind.value = tab.value;
  form.value = {
    ...blank(),
    ...(item ? JSON.parse(JSON.stringify(item)) : {}),
  };
  dialog.value = true;
}
// [CONTRACT:C-02] words/videos 管理写模型包含 enabled/sortOrder/cover；公开聚合需过滤禁用项、排序，并返回统一公开 DTO。
function save() {
  const value = form.value,
    id = value.id || newId();
  let record: Word | Video;
  let errors: string[];
  if (editingKind.value === "words") {
    record = {
      id,
      text: value.text.trim(),
      pinyin: value.pinyin.trim(),
      definition: value.definition.trim(),
      example: value.example.trim(),
      enabled: value.enabled,
      sortOrder: value.sortOrder,
    };
    errors = wordErrors(record);
  } else {
    record = {
      id,
      title: value.title.trim(),
      category: value.category.trim(),
      duration: value.duration.trim() || "待提供",
      url: value.url.trim(),
      cover: value.cover,
      coverAssetId: value.coverAssetId,
      enabled: value.enabled,
      sortOrder: value.sortOrder,
    };
    errors = videoErrors(record);
  }
  if (errors.length) {
    ElMessage.warning(errors[0]);
    return;
  }
  if (
    editingKind.value === "words" &&
    demo.value.words.some(
      (word) => word.id !== id && word.text === form.value.text.trim(),
    )
  ) {
    ElMessage.warning("相同词语已存在，请编辑已有词条");
    return;
  }
  if (
    saveDemo((data) => {
      if (editingKind.value === "words") {
        const index = data.words.findIndex((item) => item.id === id);
        if (index < 0) data.words.push(record as Word);
        else data.words[index] = record as Word;
      } else {
        const index = data.videos.findIndex((item) => item.id === id);
        if (index < 0) data.videos.push(record as Video);
        else data.videos[index] = record as Video;
      }
    })
  ) {
    dialog.value = false;
    ElMessage.success("学习资源已保存到本地");
  }
}
async function remove(id: string) {
  try {
    await ElMessageBox.confirm("删除这条本地学习资源？", "删除资源", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    saveDemo((data) => {
      if (tab.value === "words")
        data.words = data.words.filter((item) => item.id !== id);
      else data.videos = data.videos.filter((item) => item.id !== id);
    });
  } catch {}
}
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">LEARNING RESOURCES</span>
      <h1>学习资源</h1>
      <p>维护词条、课程与展示顺序。</p>
    </div>
    <el-button type="primary" size="large" @click="edit()"
      ><AppIcon name="plus" :size="17" />{{
        tab === "words" ? "新增词条" : "新增视频"
      }}</el-button
    >
  </div>
  <section class="panel">
    <el-tabs
      v-model="tab"
      @tab-change="
        keyword = '';
        category = '';
      "
      ><el-tab-pane
        :label="'字典词条 · ' + demo.words.length"
        name="words" /><el-tab-pane
        :label="'学习视频 · ' + demo.videos.length"
        name="videos"
    /></el-tabs>
    <div class="filter-row">
      <el-input
        v-model="keyword"
        :placeholder="tab === 'words' ? '搜索词语或拼音' : '搜索视频标题'"
        class="search-input"
        clearable
      /><el-select v-model="status" placeholder="全部状态" clearable
        ><el-option value="true" label="已启用" /><el-option
          value="false"
          label="未启用" /></el-select
      ><el-select
        v-if="tab === 'videos'"
        v-model="category"
        placeholder="全部分类"
        clearable
        ><el-option
          v-for="item in categories"
          :key="item"
          :label="item"
          :value="item" /></el-select
      ><span class="filter-count">数值小者优先展示</span>
    </div>
    <el-table v-if="tab === 'words'" :data="words" empty-text="没有匹配的词条"
      ><el-table-column prop="text" label="词语" width="100" /><el-table-column
        prop="pinyin"
        label="拼音"
        width="150"
      /><el-table-column
        prop="definition"
        label="释义"
        min-width="230"
      /><el-table-column
        prop="example"
        label="例句"
        min-width="190"
      /><el-table-column
        prop="sortOrder"
        label="排序"
        width="70"
      /><el-table-column label="状态" width="95"
        ><template #default="{ row }"
          ><el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">{{
            row.enabled ? "已启用" : "未启用"
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
    <el-table v-else :data="videos" empty-text="没有匹配的课程"
      ><el-table-column label="课程" min-width="230"
        ><template #default="{ row }"
          ><div class="resource-title-cell">
            <img v-if="row.cover" :src="row.cover" alt="课程封面" /><span
              ><strong>{{ row.title }}</strong
              ><small>{{
                row.url ? "已填写视频地址" : "等待视频地址"
              }}</small></span
            >
          </div></template
        ></el-table-column
      ><el-table-column
        prop="category"
        label="分类"
        width="120"
      /><el-table-column
        prop="duration"
        label="时长"
        width="100"
      /><el-table-column
        prop="sortOrder"
        label="排序"
        width="70"
      /><el-table-column label="状态" width="95"
        ><template #default="{ row }"
          ><el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">{{
            row.enabled ? "已启用" : "未启用"
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
      启用课程前需要有效 HTTPS
      视频地址；本阶段不验证在线视频播放，资源仅保存在当前浏览器。
    </p>
  </section>
  <el-dialog
    v-model="dialog"
    :title="
      (form.id ? '编辑' : '新增') + (editingKind === 'words' ? '词条' : '课程')
    "
    width="min(650px,94vw)"
    ><el-form label-position="top"
      ><template v-if="editingKind === 'words'"
        ><div class="form-two-columns">
          <el-form-item label="词语"
            ><el-input v-model="form.text" maxlength="50" /></el-form-item
          ><el-form-item label="拼音"
            ><el-input v-model="form.pinyin" maxlength="100"
          /></el-form-item>
        </div>
        <el-form-item label="释义"
          ><el-input
            v-model="form.definition"
            type="textarea"
            :rows="3"
            maxlength="1000" /></el-form-item
        ><el-form-item label="例句"
          ><el-input
            v-model="form.example"
            type="textarea"
            :rows="2"
            maxlength="300" /></el-form-item></template
      ><template v-else
        ><el-form-item label="课程标题"
          ><el-input v-model="form.title" maxlength="100"
        /></el-form-item>
        <div class="form-two-columns">
          <el-form-item label="分类"
            ><el-select
              v-model="form.category"
              filterable
              allow-create
              default-first-option
              ><el-option
                v-for="item in categories"
                :key="item"
                :label="item"
                :value="item" /></el-select></el-form-item
          ><el-form-item label="时长说明"
            ><el-input
              v-model="form.duration"
              maxlength="30"
              placeholder="例如 08:30"
          /></el-form-item>
        </div>
        <el-form-item label="课程封面"
          ><AssetPicker
            v-model="form.cover"
            v-model:asset-id="form.coverAssetId" /></el-form-item
        ><el-form-item label="视频地址"
          ><el-input
            v-model="form.url"
            maxlength="2000"
            placeholder="HTTPS 地址，草稿可暂不填写" /></el-form-item
      ></template>
      <div class="form-two-columns">
        <el-form-item label="展示排序"
          ><el-input-number
            v-model="form.sortOrder"
            :min="0"
            :precision="0" /></el-form-item
        ><el-form-item label="启用状态"
          ><el-switch
            v-model="form.enabled"
            active-text="启用"
            inactive-text="未启用"
        /></el-form-item></div></el-form
    ><template #footer
      ><el-button @click="dialog = false">取消</el-button
      ><el-button type="primary" @click="save">保存到本地</el-button></template
    ></el-dialog
  >
</template>
