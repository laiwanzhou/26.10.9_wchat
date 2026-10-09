import {
  readHistory,
  clearHistory,
  type PracticeRecord,
} from "../../services/local";
Page({
  data: { history: [] as PracticeRecord[], answered: 0, correct: 0 },
  onShow() {
    this.refresh();
  },
  refresh() {
    const history = readHistory();
    this.setData({
      history,
      answered: history.reduce((n, r) => n + r.answered, 0),
      correct: history.reduce((n, r) => n + r.correct, 0),
    });
  },
  practice() {
    wx.switchTab({ url: "/pages/practice/index" });
  },
  preview() {
    wx.navigateTo({ url: "/pages/preview/index" });
  },
  reset() {
    wx.showModal({
      title: "清空本地记录",
      content: "仅清空当前设备的演示练习记录，清空后无法恢复。",
      confirmText: "清空",
      success: (res) => {
        if (res.confirm && clearHistory()) this.refresh();
      },
    });
  },
});
