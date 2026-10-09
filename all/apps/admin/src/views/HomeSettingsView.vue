<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { demo, saveDemo, resetDemo } from "../stores/demo";
import AppIcon from "../components/AppIcon.vue";
import {
  serviceMode,
  getServiceHome,
  getServiceAssets,
  saveServiceHome,
} from "../services/platform";
import type { ImageAsset } from "../../../../shared/contracts";
const loading = ref(serviceMode),
  saving = ref(false),
  problem = ref(""),
  remoteAssets = ref<ImageAsset[]>([]);
const form = ref(
  serviceMode
    ? { title: "", subtitle: "", bannerAssetId: null as string | null }
    : { ...demo.value.home },
);
const availableAssets = computed(() =>
  serviceMode ? remoteAssets.value : demo.value.assets,
);
const banner = computed(() =>
  availableAssets.value.find((a) => a.id === form.value.bannerAssetId),
);
async function load() {
  loading.value = true;
  problem.value = "";
  try {
    const [home, assets] = await Promise.all([
      getServiceHome(),
      getServiceAssets(),
    ]);
    form.value = home;
    remoteAssets.value = assets;
  } catch (error) {
    problem.value = error instanceof Error ? error.message : "读取失败";
  } finally {
    loading.value = false;
  }
}
onMounted(() => {
  if (serviceMode) void load();
});
async function save() {
  if (serviceMode) {
    if (loading.value || saving.value || problem.value) return;
    saving.value = true;
    try {
      form.value = await saveServiceHome({
        ...form.value,
        bannerAssetId: form.value.bannerAssetId || null,
      });
      ElMessage.success("首页配置已保存，小程序首页可通过接口读取");
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      saving.value = false;
    }
    return;
  }
  // [CONTRACT:C-02] title/subtitle/bannerAssetId 必须与共享契约、公开 HomeContent 和 server HomeConfig/PUT home 一致。
  if (!form.value.title.trim()) {
    ElMessage.warning("请填写首页标题");
    return;
  }
  if (
    form.value.bannerAssetId &&
    !demo.value.assets.some((a) => a.id === form.value.bannerAssetId)
  ) {
    ElMessage.warning("所选图片已不存在，请重新选择");
    return;
  }
  if (
    saveDemo(
      (d) =>
        (d.home = {
          ...form.value,
          title: form.value.title.trim(),
          subtitle: form.value.subtitle.trim(),
        }),
    )
  )
    ElMessage.success("首页配置已保存到本地。小程序仍使用独立演示数据。");
}
async function reset() {
  try {
    await ElMessageBox.confirm(
      "恢复后台全部演示数据？本地新增内容和图片将被清除。",
      "恢复演示",
      { confirmButtonText: "恢复", cancelButtonText: "取消", type: "warning" },
    );
    resetDemo();
    form.value = { ...demo.value.home };
  } catch {
    /* 用户取消 */
  }
}
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">HOME SETTINGS</span>
      <h1>首页配置</h1>
      <p>为学习者准备一个清晰、温暖的入口。</p>
    </div>
  </div>
  <div class="settings-layout">
    <section class="panel">
      <div class="panel-heading">
        <h3>展示内容</h3>
        <span class="soft-label">{{
          serviceMode ? "服务端保存" : "本地保存"
        }}</span>
      </div>
      <p v-if="loading" class="muted">正在读取首页配置…</p>
      <div v-if="problem" role="alert">
        <p>{{ problem }}</p>
        <el-button @click="load">重新读取</el-button>
      </div>
      <el-form label-position="top" :disabled="loading || !!problem || saving"
        ><el-form-item label="首页标题"
          ><el-input
            v-model="form.title"
            maxlength="60"
            show-word-limit
            size="large" /></el-form-item
        ><el-form-item label="首页介绍"
          ><el-input
            v-model="form.subtitle"
            type="textarea"
            :rows="3"
            maxlength="150"
            show-word-limit /></el-form-item
        ><el-form-item label="首页展示图片"
          ><el-select
            v-model="form.bannerAssetId"
            placeholder="使用默认文字封面"
            clearable
            @clear="form.bannerAssetId = null"
            ><el-option
              v-for="a in availableAssets"
              :key="a.id"
              :value="a.id"
              :label="a.name"
          /></el-select>
          <p class="field-help">
            先在
            <RouterLink to="/assets">图片资源</RouterLink>
            中添加图片，再进行选择。
          </p></el-form-item
        ><el-button type="primary" size="large" :loading="saving" @click="save"
          >保存首页配置</el-button
        ></el-form
      >
      <div v-if="!serviceMode" class="settings-divider"></div>
      <template v-if="!serviceMode">
        <h4>演示数据</h4>
        <p class="muted">后台与小程序目前分别运行，不会同步配置。</p>
        <el-button @click="reset">恢复后台演示数据</el-button>
      </template>
    </section>
    <section class="phone-preview-wrap">
      <span class="preview-label">首页封面预览</span>
      <div class="phone-preview">
        <div class="phone-top"><span>9:41</span><span>●●●　▰</span></div>
        <div class="phone-nav">言习 <span>•••　◯</span></div>
        <div class="phone-content">
          <span class="mini-greeting">你好，今天也一起进步</span>
          <div class="phone-hero" :class="{ 'has-image': banner }">
            <img v-if="banner" :src="banner.url" alt="首页封面" /><span
              class="eyebrow"
              >LEARN A LITTLE EVERY DAY</span
            >
            <h2>{{ form.title || "首页标题" }}</h2>
            <p>{{ form.subtitle || "填写首页介绍，让学习者了解这个空间。" }}</p>
          </div>
          <div class="phone-entry">
            <span><AppIcon name="book" /> 题库练习</span
            ><AppIcon name="arrow" />
          </div>
          <div class="phone-entry">
            <span><AppIcon name="learning" /> 普通话学习</span
            ><AppIcon name="arrow" />
          </div>
          <div class="phone-entry">
            <span><AppIcon name="vote" /> 语言大赛</span
            ><AppIcon name="arrow" />
          </div>
          <span class="phone-caption">{{
            serviceMode
              ? "保存后小程序可读取服务端首页配置"
              : "此预览仅展示后台本地配置"
          }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
