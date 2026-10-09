import {
  readPreviewSettings,
  savePreviewSettings,
  defaultPreviewSettings,
  type PreviewScenario,
  type PreviewBanner,
} from "../../services/preview-settings";
Page({
  data: {
    settings: { ...defaultPreviewSettings },
    scenarios: [
      { id: "normal", title: "正常内容", description: "显示配置和示例资源" },
      {
        id: "slow",
        title: "慢速加载",
        description: "先显示加载状态，再展示内容",
      },
      { id: "empty", title: "空数据", description: "显示资料待配置状态" },
      { id: "error", title: "加载失败", description: "显示请求失败和重试入口" },
    ],
    banners: [
      {
        id: "grassland",
        title: "草原",
        url: "/assets/questions/grassland.png",
      },
      { id: "mountain", title: "雪山", url: "/assets/questions/mountain.png" },
      { id: "lake", title: "湖泊", url: "/assets/questions/lake.png" },
      { id: "desert", title: "沙漠", url: "/assets/questions/desert.png" },
      { id: "none", title: "不展示图片", url: "" },
    ],
  },
  onLoad() {
    this.setData({ settings: readPreviewSettings() });
  },
  scenario(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      settings: {
        ...this.data.settings,
        scenario: String(e.currentTarget.dataset.id) as PreviewScenario,
      },
    });
  },
  banner(e: WechatMiniprogram.CustomEvent) {
    this.setData({
      settings: {
        ...this.data.settings,
        banner: String(e.currentTarget.dataset.id) as PreviewBanner,
      },
    });
  },
  title(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      settings: { ...this.data.settings, title: e.detail.value },
    });
  },
  subtitle(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({
      settings: { ...this.data.settings, subtitle: e.detail.value },
    });
  },
  save() {
    try {
      savePreviewSettings(this.data.settings);
      wx.switchTab({ url: "/pages/home/index" });
    } catch {
      wx.showToast({ title: "请填写标题并确认本地存储可用", icon: "none" });
    }
  },
  reset() {
    this.setData({ settings: { ...defaultPreviewSettings } });
  },
});
