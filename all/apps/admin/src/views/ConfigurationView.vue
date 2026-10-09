<script setup lang="ts">
import { computed } from "vue";
import { demo } from "../stores/demo";
import { moduleSetup, type ModuleKey } from "../data/module-setup";
import AppIcon from "../components/AppIcon.vue";
const modules = computed(() =>
  Object.entries(moduleSetup).map(([key, info]) => ({
    ...info,
    key: key as ModuleKey,
    count:
      key === "questions"
        ? demo.value.questions.length
        : key === "learning"
          ? demo.value.words.length + demo.value.videos.length
          : demo.value.candidates.length,
  })),
);
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">CONFIGURATION STATUS</span>
      <h1>模块配置状态</h1>
      <p>页面已准备好，正式资料到位后再完成数据接入。</p>
    </div>
    <span class="demo-pill">前端独立演示</span>
  </div>
  <div class="setup-intro">
    <span class="setup-intro-icon"><AppIcon name="clock" :size="26" /></span>
    <div>
      <h2>先搭好空间，再放入正式内容。</h2>
      <p>
        题库、学习和投票模块使用本地演示样本。这里集中展示正式上线前需要准备的配置。
      </p>
    </div>
  </div>
  <div class="setup-grid">
    <section v-for="item in modules" :key="item.key" class="panel setup-module">
      <div class="setup-module-top">
        <span class="icon-box" :class="item.color"
          ><AppIcon :name="item.icon" /></span
        ><el-tag type="warning" effect="plain">正式资料待配置</el-tag>
      </div>
      <h2>{{ item.title }}</h2>
      <p>{{ item.summary }}</p>
      <div class="setup-metrics">
        <span>本地演示条目</span><strong>{{ item.count }}</strong>
      </div>
      <ul>
        <li v-for="r in item.requirements" :key="r.title">
          <AppIcon name="clock" :size="14" />{{ r.title }}
        </li>
      </ul>
      <RouterLink :to="item.pendingPath" class="setup-main-link"
        >查看待配置清单 <AppIcon name="arrow" :size="17" /></RouterLink
      ><RouterLink :to="item.path" class="setup-secondary-link"
        >进入现有演示页面</RouterLink
      >
    </section>
  </div>
  <section class="panel setup-common">
    <div class="panel-heading">
      <h3>基础展示配置</h3>
      <span class="soft-label">已具备页面</span>
    </div>
    <div>
      <RouterLink to="/settings/home"
        ><span class="quick-icon"><AppIcon name="settings" /></span
        ><span
          ><strong>首页配置</strong
          ><small>维护标题、介绍与首页展示图片</small></span
        ><AppIcon name="chevron" :size="18" /></RouterLink
      ><RouterLink to="/assets"
        ><span class="quick-icon"><AppIcon name="image" /></span
        ><span
          ><strong>图片资源管理</strong
          ><small>本地上传、选择与预览图片</small></span
        ><AppIcon name="chevron" :size="18"
      /></RouterLink>
    </div>
    <p class="panel-footnote">
      管理网页与小程序目前分别保存本地数据；配置同步在后端接入后完成。
    </p>
  </section>
</template>
