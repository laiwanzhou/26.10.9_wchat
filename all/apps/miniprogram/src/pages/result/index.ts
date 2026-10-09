import { getPracticeRoute } from "../../data/demo";
Page({
  data: { type: "", correct: 0, total: 0, accuracy: 0 },
  onLoad(options: Record<string, string | undefined>) {
    const total = Math.max(0, Number(options.total) || 0),
      correct = Math.min(total, Math.max(0, Number(options.correct) || 0));
    this.setData({
      type: options.type || "",
      correct,
      total,
      accuracy: Math.max(0, Math.min(100, Number(options.accuracy) || 0)),
    });
  },
  again() {
    const route = getPracticeRoute(this.data.type);
    if (route) wx.redirectTo({ url: route });
    else wx.switchTab({ url: "/pages/practice/index" });
  },
  home() {
    wx.switchTab({ url: "/pages/practice/index" });
  },
  history() {
    wx.switchTab({ url: "/pages/profile/index" });
  },
});
