<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { demo, saveDemo, newId } from "../stores/demo";
import { validateImage } from "../domain/local-repository";
import AppIcon from "../components/AppIcon.vue";
import { assetReferences } from "../domain/content-model";
import {
  serviceMode,
  getServiceAssets,
  uploadServiceAsset,
  deleteServiceAsset,
} from "../services/platform";
import type { ImageAsset } from "../../../../shared/contracts";
const remoteAssets = ref<ImageAsset[]>([]),
  loading = ref(false),
  problem = ref("");
async function load() {
  loading.value = true;
  problem.value = "";
  try {
    remoteAssets.value = await getServiceAssets();
  } catch (error) {
    problem.value = error instanceof Error ? error.message : "读取失败";
  } finally {
    loading.value = false;
  }
}
onMounted(() => {
  if (serviceMode) void load();
});
const picker = ref<HTMLInputElement>(),
  uploading = ref(false),
  keyword = ref(""),
  preview = ref("");
const assets = computed(() =>
  (serviceMode ? remoteAssets.value : demo.value.assets).filter((a) =>
    a.name.includes(keyword.value.trim()),
  ),
);
function dataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}
async function upload(event: Event) {
  // [PRE-LAUNCH:PL-04] 前端文件头/容量校验只用于预览；上线替换为 server 上传、解码校验、HTTPS URL 和引用权限。
  const input = event.target as HTMLInputElement,
    file = input.files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    if (serviceMode) {
      await uploadServiceAsset(file);
      await load();
      ElMessage.success("图片已上传至服务端");
      return;
    }
    const mime = validateImage(
      new Uint8Array(await file.slice(0, 12).arrayBuffer()),
      file.size,
    );
    const url = await dataUrl(file);
    if (
      saveDemo((d) =>
        d.assets.unshift({
          id: newId(),
          name: file.name,
          url,
          mime,
          size: file.size,
          createdAt: new Date().toLocaleDateString("sv-SE"),
        }),
      )
    )
      ElMessage.success("图片已保存到当前浏览器");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "图片读取失败");
  } finally {
    input.value = "";
    uploading.value = false;
  }
}
async function remove(id: string) {
  const references = serviceMode ? [] : assetReferences(demo.value, id);
  if (references.length) {
    ElMessage.warning("图片仍在使用：" + references.join("、"));
    return;
  }
  // [PRE-LAUNCH:PL-04] 服务端也必须原子检查引用，不能只信任本地检查结果。
  try {
    await ElMessageBox.confirm(
      serviceMode
        ? "确认删除这张图片？服务端会检查首页引用。"
        : "确认删除这张未被引用的本地图片？",
      "删除图片",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
      },
    );
    if (serviceMode) {
      await deleteServiceAsset(id);
      await load();
      ElMessage.success("图片已删除");
      return;
    }
    saveDemo((d) => {
      d.assets = d.assets.filter((a) => a.id !== id);
      if (d.home.bannerAssetId === id) d.home.bannerAssetId = null;
    });
  } catch (error) {
    if (error instanceof Error) ElMessage.error(error.message);
  }
}
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">IMAGE LIBRARY</span>
      <h1>图片资源</h1>
      <p>把合适的图片，放在合适的内容里。</p>
    </div>
    <el-button
      type="primary"
      size="large"
      :loading="uploading"
      @click="picker?.click()"
      ><AppIcon name="upload" :size="17" /> 添加图片</el-button
    ><input
      ref="picker"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      hidden
      @change="upload"
    />
  </div>
  <div class="module-notice">
    仅支持 JPEG、PNG、WebP，单张不超过 5 MiB。{{
      serviceMode
        ? "图片通过服务上传并保存；仅首页引用的图片可公开读取。"
        : "图片暂存当前浏览器，总容量取决于浏览器；后续接入对象存储。"
    }}
  </div>
  <section class="panel">
    <p v-if="loading" class="muted">正在读取图片…</p>
    <div v-if="problem" role="alert">
      <p>{{ problem }}</p>
      <el-button @click="load">重新读取</el-button>
    </div>
    <div class="filter-row">
      <el-input
        v-model="keyword"
        placeholder="搜索图片名称"
        clearable
        class="search-input"
        ><template #prefix
          ><AppIcon name="search" :size="17" /></template></el-input
      ><span class="filter-count">共 {{ assets.length }} 张图片</span>
    </div>
    <div v-if="assets.length" class="asset-grid">
      <article v-for="asset in assets" :key="asset.id" class="asset-card">
        <button
          class="asset-preview"
          :aria-label="`预览 ${asset.name}`"
          @click="preview = asset.url"
        >
          <img :src="asset.url" :alt="asset.name" />
        </button>
        <div class="asset-details">
          <strong :title="asset.name">{{ asset.name }}</strong
          ><span
            >{{ Math.ceil(asset.size / 1024) }} KB · {{ asset.createdAt }}</span
          >
          <div>
            <el-tag
              v-if="demo.home.bannerAssetId === asset.id"
              size="small"
              effect="plain"
              >首页使用中</el-tag
            ><el-button link type="danger" @click="remove(asset.id)"
              >删除</el-button
            >
          </div>
        </div>
      </article>
    </div>
    <div v-else-if="!loading && !problem" class="upload-empty">
      <span class="empty-image-icon"><AppIcon name="image" :size="36" /></span>
      <h3>{{ keyword ? "没有匹配的图片" : "你的第一张图片，从这里开始" }}</h3>
      <p>
        {{
          keyword ? "试试其他关键词。" : "上传首页展示图，让学习空间更有温度。"
        }}
      </p>
      <el-button v-if="!keyword" @click="picker?.click()"
        >选择本地图片</el-button
      >
    </div>
  </section>
  <el-dialog
    :model-value="!!preview"
    title="图片预览"
    width="min(800px, 92vw)"
    @close="preview = ''"
    ><img :src="preview" class="preview-image" alt="当前预览图片"
  /></el-dialog>
</template>
