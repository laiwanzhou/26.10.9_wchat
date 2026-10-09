import { getWord } from "../../services/content";
import {
  createResourceLoader,
  type ResourceStatus,
} from "../../domain/resource";
import type { WordContent } from "../../contracts/generated";
// [CONTRACT:C-02/C-04] 与词条列表使用同一服务，不能切 HTTP 后仍查样本；与 shared 契约、mock 详情和 server words/:id 一起修改。
Page({
  data: {
    word: null as WordContent | null,
    status: "loading" as ResourceStatus,
    errorMessage: "",
  },
  loader: null as (() => Promise<void>) | null,
  disposed: false,
  onLoad(options: Record<string, string | undefined>): Promise<void> {
    this.loader = createResourceLoader({
      fetch: () => getWord(options.id || ""),
      isEmpty: (value) => value === null,
      apply: (state) => {
        if (!this.disposed)
          this.setData({
            word: state.data,
            status: state.status,
            errorMessage: state.errorMessage,
          });
      },
    });
    return this.loader();
  },
  load(): Promise<void> {
    return this.loader ? this.loader() : Promise.resolve();
  },
  onUnload() {
    this.disposed = true;
  },
});
