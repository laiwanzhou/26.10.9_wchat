<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppIcon from "../components/AppIcon.vue";
import { signOut } from "../stores/demo";
import { moduleSetup } from "../data/module-setup";
const route = useRoute(),
  router = useRouter(),
  open = ref(false);
const nav = [
  { path: "/dashboard", name: "工作台概览", icon: "grid" },
  { path: "/questions", name: "题库管理", icon: "book" },
  { path: "/learning", name: "学习资源", icon: "learning" },
  { path: "/voting", name: "大赛管理", icon: "vote" },
  { path: "/assets", name: "图片资源", icon: "image" },
  { path: "/settings/home", name: "首页配置", icon: "settings" },
  { path: "/configuration", name: "配置状态", icon: "clock" },
];
const activePath = computed(() =>
  route.meta.pendingModule ? "/configuration" : route.path,
);
const pendingModule = computed(() =>
  Object.values(moduleSetup).find((info) => info.path === route.path),
);
function logout() {
  signOut();
  router.push("/login");
}
</script>
<template>
  <div class="workspace">
    <button
      v-if="open"
      class="sidebar-overlay"
      aria-label="关闭菜单"
      @click="open = false"
    ></button>
    <aside class="sidebar" :class="{ open }">
      <RouterLink to="/dashboard" class="brand"
        ><span class="brand-mark">言</span
        ><span
          >言习<span class="brand-sub">语言学习管理平台</span></span
        ></RouterLink
      >
      <div class="nav-label">工作空间</div>
      <nav>
        <RouterLink
          v-for="item in nav"
          :key="item.path"
          :to="item.path"
          :class="{ active: activePath === item.path }"
          @click="open = false"
          ><AppIcon :name="item.icon" /><span>{{ item.name }}</span
          ><span v-if="activePath === item.path" class="active-dot"></span
        ></RouterLink>
      </nav>
      <div class="sidebar-note">
        <span class="status-dot"></span>前端演示环境
        <p>内容仅保存在当前浏览器<br />后端服务将在后续接入</p>
      </div>
      <button class="sidebar-user" @click="logout">
        <span class="avatar">管</span
        ><span>演示管理员<small>退出演示登录</small></span
        ><AppIcon name="logout" :size="17" />
      </button>
    </aside>
    <div class="workspace-main">
      <header class="topbar">
        <div class="breadcrumb">
          <button
            class="menu-toggle"
            aria-label="展开菜单"
            @click="open = true"
          >
            <AppIcon name="menu" /></button
          ><span>管理平台</span><AppIcon name="chevron" :size="13" /><strong>{{
            route.meta.title
          }}</strong>
        </div>
        <div class="topbar-right">
          <span class="demo-pill">本地演示</span
          ><span class="topbar-divider"></span
          ><span class="avatar small">管</span
          ><span class="desktop-label">管理员</span>
        </div>
      </header>
      <main class="main-content">
        <div v-if="pendingModule" class="pending-notice">
          <AppIcon name="clock" :size="21" />
          <div>
            <strong>{{ pendingModule.title }}正式资料待配置</strong>
            <p>以下内容为本地演示，正式数据在资料确认后接入。</p>
          </div>
          <RouterLink :to="pendingModule.pendingPath"
            >查看待配置清单 →</RouterLink
          >
        </div>
        <RouterView />
      </main>
      <footer class="workspace-footer">
        <span>言习 · 让每一次表达，更有力量</span><span>前端预览 v0.1</span>
      </footer>
    </div>
  </div>
</template>
