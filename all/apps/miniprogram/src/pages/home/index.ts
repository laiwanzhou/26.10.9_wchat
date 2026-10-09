import { categories, words, getPracticeRoute } from "../../data/demo";
import { readHistory } from "../../services/local";
import { getHome, type HomeContent } from "../../services/content";
import {
  createResourceLoader,
  type ResourceStatus,
} from "../../domain/resource";
Page({
  data: {
    categories,
    word: words[1],
    answered: 0,
    correct: 0,
    home: null as HomeContent | null,
    status: "loading" as ResourceStatus,
    errorMessage: "",
    bannerFailed: false,
  },
  loader: null as (() => Promise<void>) | null,
  disposed: false,
  onShow(): Promise<void> {
    const history = readHistory();
    this.setData({
      answered: history.reduce((n, r) => n + r.answered, 0),
      correct: history.reduce((n, r) => n + r.correct, 0),
    });
    return this.load();
  },
  load(): Promise<void> {
    if (!this.loader)
      this.loader = createResourceLoader({
        fetch: getHome,
        isEmpty: (home) => home === null || !home.title.trim(),
        apply: (state) => {
          if (!this.disposed)
            this.setData({
              status: state.status,
              errorMessage: state.errorMessage,
              home: state.data,
              bannerFailed: false,
            });
        },
      });
    return this.loader();
  },
  onUnload() {
    this.disposed = true;
  },
  bannerError() {
    this.setData({ bannerFailed: true });
  },
  preview() {
    wx.navigateTo({ url: "/pages/preview/index" });
  },
  start(e: WechatMiniprogram.CustomEvent) {
    const route = getPracticeRoute(String(e.currentTarget.dataset.id));
    if (route) wx.navigateTo({ url: route });
  },
  practice() {
    wx.switchTab({ url: "/pages/practice/index" });
  },
  learning() {
    wx.switchTab({ url: "/pages/learning/index" });
  },
  voting() {
    wx.navigateTo({ url: "/pages/voting/index" });
  },
  word() {
    wx.navigateTo({ url: "/pages/word/index?id=w2" });
  },
});
