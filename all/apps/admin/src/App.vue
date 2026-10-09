<script setup lang="ts">
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { authConnectionIssue } from "./stores/auth-connection";
const router = useRouter(),
  retrying = ref(false);
async function reconnect() {
  if (!authConnectionIssue.value || retrying.value) return;
  retrying.value = true;
  try {
    await router.push(authConnectionIssue.value.path);
  } finally {
    retrying.value = false;
  }
}
</script>
<template>
  <el-config-provider :locale="zhCn"
    ><RouterView />
    <section
      v-if="authConnectionIssue"
      class="auth-connection-notice"
      role="alert"
      aria-live="assertive"
    >
      <strong>暂时无法连接管理服务</strong>
      <p>
        {{ authConnectionIssue.message }}。当前页面已保留，连接恢复后可继续。
      </p>
      <el-button type="primary" :loading="retrying" @click="reconnect"
        >重新连接</el-button
      >
    </section>
  </el-config-provider>
</template>
<style scoped>
.auth-connection-notice {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  width: min(520px, calc(100vw - 32px));
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #d7b978;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 8px 32px #0002;
}
.auth-connection-notice p {
  line-height: 1.6;
  color: #65645d;
  margin: 10px 0 16px;
}
</style>
