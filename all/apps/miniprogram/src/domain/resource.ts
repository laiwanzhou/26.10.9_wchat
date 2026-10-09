export type ResourceStatus = "loading" | "ready" | "empty" | "error";
export interface ResourceState<T> {
  status: ResourceStatus;
  data: T | null;
  errorMessage: string;
}
export function createResourceLoader<T>(options: {
  fetch: () => Promise<T>;
  isEmpty: (data: T) => boolean;
  apply: (state: ResourceState<T>) => void;
}) {
  let generation = 0;
  return async function load(): Promise<void> {
    const current = ++generation;
    options.apply({ status: "loading", data: null, errorMessage: "" });
    try {
      const data = await options.fetch();
      if (current !== generation) return;
      options.apply({
        status: options.isEmpty(data) ? "empty" : "ready",
        data,
        errorMessage: "",
      });
    } catch (error) {
      if (current !== generation) return;
      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "内容加载失败，请重试";
      options.apply({ status: "error", data: null, errorMessage: message });
    }
  };
}
