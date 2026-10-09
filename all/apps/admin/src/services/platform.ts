import { createAdminClient, AdminApiError } from "../domain/admin-client";
import {
  decodeAssets,
  decodeAsset,
  decodeHomeConfig,
  decodeIdentity,
  type HomeConfig,
} from "../../../../shared/contracts";
export const serviceMode = import.meta.env.VITE_ADMIN_MODE === "service";
// [CONTRACT:C-02/C-04] 服务模式明确使用真实 API；401 失效通知及错误不允许回退本地保存。
const client = createAdminClient(fetch);
export async function api(
  path: string,
  options?: { method?: string; body?: unknown },
) {
  try {
    return await client(path, options);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401)
      window.dispatchEvent(new Event("yanxi-session-expired"));
    throw error;
  }
}
export const getIdentity = async () =>
  decodeIdentity(await api("/api/admin/auth/me"));
export const loginService = async (username: string, password: string) =>
  decodeIdentity(
    await api("/api/admin/auth/login", {
      method: "POST",
      body: { username, password },
    }),
  );
export const logoutService = async () => {
  await api("/api/admin/auth/logout", { method: "POST" });
};
export const getServiceHome = async () => {
  const value = await api("/api/admin/home");
  return value === null
    ? { title: "", subtitle: "", bannerAssetId: null }
    : decodeHomeConfig(value);
};
export const saveServiceHome = async (body: HomeConfig) =>
  decodeHomeConfig(await api("/api/admin/home", { method: "PUT", body }));
export const getServiceAssets = async () =>
  decodeAssets(await api("/api/admin/assets"));
export const uploadServiceAsset = async (file: File) => {
  const body = new FormData();
  body.append("file", file);
  return decodeAsset(await api("/api/admin/assets", { method: "POST", body }));
};
export const deleteServiceAsset = async (id: string) => {
  await api("/api/admin/assets/" + encodeURIComponent(id), {
    method: "DELETE",
  });
};
