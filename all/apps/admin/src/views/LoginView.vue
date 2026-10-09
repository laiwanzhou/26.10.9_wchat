<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { signIn } from "../stores/demo";
import AppIcon from "../components/AppIcon.vue";
const username = ref(""),
  password = ref(""),
  busy = ref(false),
  router = useRouter();
function login() {
  // [PRE-LAUNCH:PL-01] 演示账号仅用于本地页面；与 stores/demo、真实 /api/admin/auth/login/me/logout、Cookie 会话和 401 处理一起替换。
  if (username.value.trim() !== "admin" || password.value !== "demo2026") {
    ElMessage.error("演示账号或密码不正确");
    return;
  }
  busy.value = true;
  try {
    signIn();
    router.push("/dashboard");
  } catch {
    ElMessage.error("浏览器无法保存演示会话，请允许本地存储");
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="login-page">
    <section class="login-story">
      <div class="login-brand">
        <span class="brand-mark">言</span>言习 <span>YANXI</span>
      </div>
      <div class="login-art">
        <div class="art-ring"></div>
        <span class="art-character">言</span
        ><span class="art-caption">LEARN · EXPRESS · CONNECT</span>
      </div>
      <h1>让每一句话，<br />都连接更大的世界。</h1>
      <p>一个工作台，管理学习内容与精彩活动。</p>
      <div class="login-story-footer">语言学习 · 内容管理 · 活动运营</div>
    </section>
    <section class="login-form-area">
      <form class="login-card" @submit.prevent="login">
        <span class="eyebrow">WELCOME BACK</span>
        <h2>欢迎来到管理工作台</h2>
        <p class="muted">登录后，开始管理你的学习空间。</p>
        <label
          >管理员账号<el-input
            v-model="username"
            placeholder="请输入账号"
            autocomplete="username"
            size="large" /></label
        ><label
          >密码<el-input
            v-model="password"
            type="password"
            show-password
            placeholder="请输入密码"
            autocomplete="current-password"
            size="large" /></label
        ><el-button
          type="primary"
          native-type="submit"
          size="large"
          :loading="busy"
          class="login-button"
          >进入工作台 <AppIcon name="arrow"
        /></el-button>
        <div class="login-demo">
          <strong>本地演示账号</strong
          ><span>账号 <code>admin</code>　密码 <code>demo2026</code></span
          ><small>仅用于页面体验，尚未接入真实身份认证。</small>
        </div>
        <span class="login-copyright">言习管理平台 · 前端独立演示</span>
      </form>
    </section>
  </div>
</template>
