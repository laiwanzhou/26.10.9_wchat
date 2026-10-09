import { categories, getPracticeRoute } from "../../data/demo";
Page({
  data: { categories },
  start(e: WechatMiniprogram.CustomEvent) {
    const route = getPracticeRoute(String(e.currentTarget.dataset.id));
    if (route) wx.navigateTo({ url: route });
  },
});
