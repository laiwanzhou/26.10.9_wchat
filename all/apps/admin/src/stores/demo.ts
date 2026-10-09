import { shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { LocalRepository } from "../domain/local-repository";
import { seed, type DemoData } from "../data/seed";
import { migrateDemoData, isDemoData } from "../domain/migration.ts";
const storage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
};
const key = "yanxi-admin-demo-v1";
let originalCache: string | null = null,
  cacheProblem = false,
  migrationMessage = "";
let initial: DemoData = seed;
try {
  originalCache = storage.getItem(key);
  if (originalCache) {
    const parsed: unknown = JSON.parse(originalCache);
    initial = migrateDemoData(parsed);
    if ((parsed as { version?: number }).version === 1)
      migrationMessage =
        "旧记录已保留并升级；缺少选项的选择题转为待补全草稿，旧活动保持关闭。";
  }
} catch {
  cacheProblem = true;
  migrationMessage =
    "旧缓存无法安全读取，原缓存未覆盖。请先备份或使用恢复演示数据。";
}
// [PRE-LAUNCH:PL-02] 本地存储只是演示适配器。上线需替换为管理 API 与数据库，不把当前缓存当成跨端共享数据。
const repository = new LocalRepository<DemoData>(
  storage,
  key,
  initial,
  isDemoData,
);
export const demo = shallowRef(repository.read());
export const demoMigrationNotice = migrationMessage;
// [PRE-LAUNCH:PL-06] 缓存备份只用于本地升级恢复，不能代替 PostgreSQL/对象存储备份、恢复验证和发布回退。
function backupOriginal() {
  if (originalCache && !storage.getItem("yanxi-admin-demo-backup-before-v2"))
    storage.setItem("yanxi-admin-demo-backup-before-v2", originalCache);
}
export function saveDemo(change: (next: DemoData) => void): boolean {
  if (cacheProblem) {
    ElMessage.error("缓存无法升级，请先备份并恢复演示数据");
    return false;
  }
  try {
    const next = repository.read();
    change(next);
    backupOriginal();
    repository.save(next);
    demo.value = repository.read();
    return true;
  } catch {
    ElMessage.error("本地保存失败，可能是浏览器存储空间不足。原有数据已保留。");
    return false;
  }
}
export const newId = () => crypto.randomUUID();
export function resetDemo() {
  try {
    backupOriginal();
    repository.save(structuredClone(seed));
    demo.value = repository.read();
    cacheProblem = false;
    ElMessage.success("演示数据已恢复，旧缓存备份已保留");
  } catch {
    ElMessage.error("恢复失败，原有数据已保留");
  }
}
// [PRE-LAUNCH:PL-01] 登录标记不是鉴权。与 LoginView、未来 admin API/auth/me/login/logout 和服务端 Cookie 会话一起替换。
export function isSignedIn(): boolean {
  try {
    return sessionStorage.getItem("yanxi-demo-session") === "active";
  } catch {
    return false;
  }
}
export function signIn() {
  sessionStorage.setItem("yanxi-demo-session", "active");
}
export function signOut() {
  try {
    sessionStorage.removeItem("yanxi-demo-session");
  } catch {}
}
