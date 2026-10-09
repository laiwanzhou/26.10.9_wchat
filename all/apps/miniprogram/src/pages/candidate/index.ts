import { getCandidate } from "../../services/content";
import {
  createResourceLoader,
  type ResourceStatus,
} from "../../domain/resource";
import type { CandidateContent } from "../../contracts/generated";
// [CONTRACT:C-03/C-04] 与选手列表同源，从 candidate/:id 读取；发布、照片 URI 与 DTO 同 shared/Mock/server 联动。
Page({
  data: {
    candidate: null as CandidateContent | null,
    status: "loading" as ResourceStatus,
    errorMessage: "",
    photoFailed: false,
  },
  loader: null as (() => Promise<void>) | null,
  disposed: false,
  onLoad(options: Record<string, string | undefined>): Promise<void> {
    this.loader = createResourceLoader({
      fetch: () => getCandidate(options.id || ""),
      isEmpty: (value) => value === null,
      apply: (state) => {
        if (!this.disposed)
          this.setData({
            candidate: state.data,
            status: state.status,
            errorMessage: state.errorMessage,
            photoFailed: false,
          });
      },
    });
    return this.loader();
  },
  load(): Promise<void> {
    return this.loader ? this.loader() : Promise.resolve();
  },
  photoError() {
    this.setData({ photoFailed: true });
  },
  onUnload() {
    this.disposed = true;
  },
});
