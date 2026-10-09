import { AdminApiError } from "./admin-client.ts";
export function createServiceGuard(options: {
  verify: () => Promise<unknown>;
  unavailable: (path: string, message: string) => void;
  clear: () => void;
}) {
  let generation = 0;
  return async (to: {
    path: string;
    fullPath: string;
  }): Promise<boolean | string> => {
    const current = ++generation;
    if (to.path === "/login") {
      options.clear();
      return true;
    }
    try {
      await options.verify();
      if (current !== generation) return false;
      options.clear();
      return true;
    } catch (error) {
      if (current !== generation) return false;
      if (error instanceof AdminApiError && error.status === 401) {
        options.clear();
        return "/login";
      }
      options.unavailable(
        to.fullPath,
        error instanceof Error
          ? error.message
          : "暂时无法确认登录状态，请重新连接",
      );
      return false;
    }
  };
}
