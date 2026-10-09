<script setup lang="ts">
import { computed } from "vue";
import { demo } from "../stores/demo";
import { questionTypes } from "../data/seed";
import AppIcon from "../components/AppIcon.vue";
const stats = computed(() => [
  {
    label: "题库内容",
    value: demo.value.questions.length,
    unit: "道",
    icon: "book",
    color: "green",
    note: "涵盖四种练习题型",
  },
  {
    label: "字典词条",
    value: demo.value.words.length,
    unit: "条",
    icon: "learning",
    color: "blue",
    note: "拼音、释义与例句",
  },
  {
    label: "参赛选手",
    value: demo.value.candidates.length,
    unit: "位",
    icon: "vote",
    color: "amber",
    note: "本地示例选手资料",
  },
  {
    label: "图片资源",
    value: demo.value.assets.length,
    unit: "张",
    icon: "image",
    color: "purple",
    note: "当前浏览器保存的图片",
  },
]);
const typeCounts = computed(() =>
  Object.entries(questionTypes).map(([key, label]) => ({
    label,
    count: demo.value.questions.filter((q) => q.type === key).length,
  })),
);
</script>
<template>
  <div class="page-heading">
    <div>
      <span class="eyebrow">OVERVIEW</span>
      <h1>工作台概览</h1>
      <p>内容、资源与活动，在这里一目了然。</p>
    </div>
    <span class="date-label">前端演示 · 数据独立保存</span>
  </div>
  <section class="welcome-banner">
    <div>
      <span class="welcome-chip">你的内容工作空间</span>
      <h2>把好的内容，带给每一位学习者。</h2>
      <p>从一道练习题到一场语言大赛，让学习与表达相遇。</p>
      <RouterLink to="/questions" class="welcome-link"
        >开始管理内容 <AppIcon name="arrow" :size="17"
      /></RouterLink>
    </div>
    <div class="welcome-art" aria-hidden="true">
      <span class="art-book">言</span><span class="art-small">习</span><i></i>
    </div>
  </section>
  <div class="stat-grid">
    <article v-for="s in stats" :key="s.label" class="stat-card">
      <div class="stat-top">
        <span>{{ s.label }}</span
        ><span class="icon-box" :class="s.color"
          ><AppIcon :name="s.icon"
        /></span>
      </div>
      <div class="stat-number">
        {{ s.value }}<small>{{ s.unit }}</small>
      </div>
      <p>{{ s.note }}</p>
    </article>
  </div>
  <div class="overview-grid">
    <section class="panel">
      <div class="panel-heading">
        <h3>最近的题库内容</h3>
        <RouterLink to="/questions" class="text-link"
          >查看全部 <AppIcon name="arrow" :size="15"
        /></RouterLink>
      </div>
      <el-table :data="demo.questions.slice(0, 4)"
        ><el-table-column label="题目内容" min-width="230"
          ><template #default="{ row }"
            ><span class="table-title">{{ row.stem }}</span
            ><small class="table-sub">{{
              row.id.toUpperCase()
            }}</small></template
          ></el-table-column
        ><el-table-column label="题型" width="115"
          ><template #default="{ row }"
            ><el-tag effect="plain" type="info">{{
              questionTypes[row.type as keyof typeof questionTypes]
            }}</el-tag></template
          ></el-table-column
        ><el-table-column label="状态" width="90"
          ><template #default="{ row }"
            ><span class="state" :class="{ off: !row.enabled }"
              ><i></i>{{ row.enabled ? "已启用" : "草稿" }}</span
            ></template
          ></el-table-column
        ></el-table
      >
      <p class="panel-footnote">
        以上为本地演示内容，正式题库待甲方资料到位后配置。
      </p>
    </section>
    <section class="panel">
      <div class="panel-heading">
        <h3>题型分布</h3>
        <span class="soft-label">本地内容</span>
      </div>
      <div class="distribution">
        <div
          v-for="(t, index) in typeCounts"
          :key="t.label"
          class="distribution-row"
        >
          <div>
            <span><i :class="'tone-' + index"></i>{{ t.label }}</span
            ><strong>{{ t.count }} 道</strong>
          </div>
          <div class="bar-track">
            <div
              :class="'tone-' + index"
              :style="{
                width: demo.questions.length
                  ? `${(t.count / demo.questions.length) * 100}%`
                  : '0%',
              }"
            ></div>
          </div>
        </div>
      </div>
    </section>
  </div>
  <section class="panel quick-panel">
    <div class="panel-heading">
      <h3>常用操作</h3>
      <span class="muted">让内容维护更轻松</span>
    </div>
    <div class="quick-grid">
      <RouterLink
        v-for="s in [
          {
            to: '/questions',
            icon: 'plus',
            title: '新增题目',
            desc: '完善练习内容',
          },
          {
            to: '/learning',
            icon: 'learning',
            title: '维护学习资源',
            desc: '管理字典与视频',
          },
          {
            to: '/voting',
            icon: 'vote',
            title: '配置语言大赛',
            desc: '管理选手与投票设置',
          },
          {
            to: '/settings/home',
            icon: 'settings',
            title: '更新首页',
            desc: '调整标题与展示图片',
          },
        ]"
        :key="s.to"
        :to="s.to"
        ><span class="quick-icon"><AppIcon :name="s.icon" /></span
        ><span
          ><strong>{{ s.title }}</strong
          ><small>{{ s.desc }}</small></span
        ><AppIcon name="chevron" :size="16"
      /></RouterLink>
    </div>
  </section>
</template>
