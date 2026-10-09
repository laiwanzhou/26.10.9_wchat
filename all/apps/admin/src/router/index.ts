import { createRouter, createWebHashHistory } from "vue-router";
import { isSignedIn } from "../stores/demo";
import AdminLayout from "../layouts/AdminLayout.vue";
import { serviceMode, getIdentity } from "../services/platform";
const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0, left: 0 }),
  routes: [
    {
      path: "/login",
      component: () => import("../views/LoginView.vue"),
      meta: { title: "登录" },
    },
    {
      path: "/",
      component: AdminLayout,
      redirect: "/dashboard",
      children: [
        {
          path: "configuration",
          component: () => import("../views/ConfigurationView.vue"),
          meta: { title: "模块配置状态" },
        },
        {
          path: "questions/pending",
          component: () => import("../views/PendingModuleView.vue"),
          meta: { title: "题库待配置", pendingModule: "questions" },
        },
        {
          path: "learning/pending",
          component: () => import("../views/PendingModuleView.vue"),
          meta: { title: "学习资源待配置", pendingModule: "learning" },
        },
        {
          path: "voting/pending",
          component: () => import("../views/PendingModuleView.vue"),
          meta: { title: "投票活动待配置", pendingModule: "voting" },
        },
        {
          path: "dashboard",
          component: () => import("../views/DashboardView.vue"),
          meta: { title: "工作台概览" },
        },
        {
          path: "questions",
          component: () => import("../views/QuestionsView.vue"),
          meta: { title: "题库管理" },
        },
        {
          path: "learning",
          component: () => import("../views/LearningView.vue"),
          meta: { title: "学习资源" },
        },
        {
          path: "voting",
          component: () => import("../views/VotingView.vue"),
          meta: { title: "大赛管理" },
        },
        {
          path: "assets",
          component: () => import("../views/AssetsView.vue"),
          meta: { title: "图片资源" },
        },
        {
          path: "settings/home",
          component: () => import("../views/HomeSettingsView.vue"),
          meta: { title: "首页配置" },
        },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/dashboard" },
  ],
});
router.beforeEach(async (to) => {
  if (serviceMode) {
    if (to.path === "/login") return;
    try {
      await getIdentity();
      return;
    } catch {
      return "/login";
    }
  }
  if (to.path !== "/login" && !isSignedIn()) return "/login";
  if (to.path === "/login" && isSignedIn()) return "/dashboard";
});
window.addEventListener("yanxi-session-expired", () => {
  if (router.currentRoute.value.path !== "/login")
    void router.replace("/login");
});
export default router;
