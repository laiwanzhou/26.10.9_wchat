<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { demo, saveDemo, resetDemo } from "../stores/demo";
import AppIcon from "../components/AppIcon.vue";
const form = ref({ ...demo.value.home });
const banner = computed(() =>
  demo.value.assets.find((a) => a.id === form.value.bannerAssetId),
);
function save() {
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
        <span class="soft-label">本地保存</span>
      </div>
      <el-form label-position="top"
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
              v-for="a in demo.assets"
              :key="a.id"
              :value="a.id"
              :label="a.name"
          /></el-select>
          <p class="field-help">
            先在
            <RouterLink to="/assets">图片资源</RouterLink>
            中添加图片，再进行选择。
          </p></el-form-item
        ><el-button type="primary" size="large" @click="save"
          >保存首页配置</el-button
        ></el-form
      >
      <div class="settings-divider"></div>
      <h4>演示数据</h4>
      <p class="muted">后台与小程序目前分别运行，不会同步配置。</p>
      <el-button @click="reset">恢复后台演示数据</el-button>
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
          <span class="phone-caption">此预览仅展示后台本地配置</span>
        </div>
      </div>
    </section>
  </div>
</template>
