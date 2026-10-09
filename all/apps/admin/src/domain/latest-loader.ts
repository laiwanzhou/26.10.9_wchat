export interface LoadPatch<T> {
  loading: boolean;
  value?: T;
  errorMessage: string;
}
export function createLatestLoader<T>(options: {
  fetch: () => Promise<T>;
  apply: (state: LoadPatch<T>) => void;
}) {
  let generation = 0,
    disposed = false;
  return {
    async load() {
      if (disposed) return;
      const current = ++generation;
      options.apply({ loading: true, errorMessage: "" });
      try {
        const value = await options.fetch();
        if (!disposed && current === generation)
          options.apply({ loading: false, value, errorMessage: "" });
      } catch (error) {
        if (!disposed && current === generation)
          options.apply({
            loading: false,
            errorMessage: error instanceof Error ? error.message : "读取失败",
          });
      }
    },
    dispose() {
      disposed = true;
      generation++;
    },
  };
}
