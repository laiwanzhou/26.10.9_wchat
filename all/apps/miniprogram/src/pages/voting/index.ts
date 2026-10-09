import type { candidates } from "../../data/demo";
import { getVoting } from "../../services/content";
import {
  createResourceLoader,
  type ResourceStatus,
} from "../../domain/resource";
Page({
  data: {
    candidates: [] as typeof candidates,
    keyword: "",
    filtered: [] as typeof candidates,
    title: "语言大赛",
    status: "loading" as ResourceStatus,
    errorMessage: "",
  },
  loader: null as (() => Promise<void>) | null,
  disposed: false,
  onShow(): Promise<void> {
    return this.load();
  },
  onUnload() {
    this.disposed = true;
  },
  load(): Promise<void> {
    if (!this.loader)
      this.loader = createResourceLoader({
        fetch: getVoting,
        isEmpty: (data) => !data.candidates.length,
        apply: (state) => {
          if (!this.disposed) {
            const candidates = state.data?.candidates || [];
            this.setData({
              status: state.status,
              errorMessage: state.errorMessage,
              title: state.data?.title || "语言大赛",
              candidates,
              filtered: candidates.filter((candidate) =>
                `${candidate.name} ${candidate.number}`.includes(
                  this.data.keyword.trim(),
                ),
              ),
            });
          }
        },
      });
    return this.loader();
  },
  search(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const keyword = e.detail.value;
    this.setData({
      keyword,
      filtered: this.data.candidates.filter((c) =>
        `${c.name} ${c.number}`.includes(keyword.trim()),
      ),
    });
  },
  detail(e: WechatMiniprogram.CustomEvent) {
    wx.navigateTo({
      url: `/pages/candidate/index?id=${e.currentTarget.dataset.id}`,
    });
  },
});
