<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { moduleSetup, type ModuleKey } from "../data/module-setup";
import AppIcon from "../components/AppIcon.vue";
const route = useRoute();
const module = computed(
  () => moduleSetup[route.meta.pendingModule as ModuleKey],
);
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">{{ module.eyebrow }}</span>
      <h1>{{ module.title }}待配置</h1>
      <p>{{ module.summary }}</p>
    </div>
    <RouterLink to="/configuration" class="text-link"
      >全部配置状态 <AppIcon name="arrow" :size="17"
    /></RouterLink>
  </div>
  <section class="panel pending-module-hero">
    <span class="pending-large-icon" :class="module.color"
      ><AppIcon :name="module.icon" :size="36" /></span
    ><el-tag type="warning" effect="plain">等待正式资料</el-tag>
    <h2>{{ module.title }}页面已就绪</h2>
    <p>当前可体验前端页面，正式内容在材料确认后配置。</p>
    <RouterLink :to="module.path" class="pending-demo-button"
      >进入{{ module.title }}演示 <AppIcon name="arrow" :size="17"
    /></RouterLink>
  </section>
  <section class="panel pending-requirements">
    <div class="panel-heading">
      <h3>需要准备的资料</h3>
      <span class="soft-label">{{ module.requirements.length }} 项</span>
    </div>
    <article v-for="(item, index) in module.requirements" :key="item.title">
      <span class="requirement-index">0{{ index + 1 }}</span>
      <div>
        <h4>{{ item.title }}</h4>
        <p>{{ item.description }}</p>
      </div>
      <span class="requirement-status">待提供</span>
    </article>
  </section>
  <section class="pending-next">
    <AppIcon name="check" :size="20" />
    <div>
      <strong>资料到位后的下一步</strong>
      <p>{{ module.next }}</p>
    </div>
  </section>
</template>
