import type { words, lessons } from "../../data/demo";
import { getLearning } from "../../services/content";
import {
  createResourceLoader,
  type ResourceStatus,
} from "../../domain/resource";
Page({
  data: {
    tab: "words",
    keyword: "",
    words: [] as typeof words,
    filteredWords: [] as typeof words,
    lessons: [] as typeof lessons,
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
        fetch: getLearning,
        isEmpty: (data) => !data.words.length && !data.lessons.length,
        apply: (state) => {
          if (!this.disposed) {
            const words = state.data?.words || [];
            this.setData({
              status: state.status,
              errorMessage: state.errorMessage,
              words,
              lessons: state.data?.lessons || [],
              filteredWords: words.filter((word) =>
                `${word.text} ${word.pinyin}`.includes(
                  this.data.keyword.trim(),
                ),
              ),
            });
          }
        },
      });
    return this.loader();
  },
  tab(e: WechatMiniprogram.CustomEvent) {
    this.setData({ tab: String(e.currentTarget.dataset.id) });
  },
  search(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const keyword = e.detail.value;
    this.setData({
      keyword,
      filteredWords: this.data.words.filter((w) =>
        `${w.text} ${w.pinyin}`.includes(keyword.trim()),
      ),
    });
  },
  clear() {
    this.setData({ keyword: "", filteredWords: this.data.words });
  },
  word(e: WechatMiniprogram.CustomEvent) {
    wx.navigateTo({
      url: `/pages/word/index?id=${e.currentTarget.dataset.id}`,
    });
  },
  lesson() {
    wx.showToast({ title: "视频资源待甲方提供", icon: "none" });
  },
});
