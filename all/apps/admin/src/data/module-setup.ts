export type ModuleKey = "questions" | "learning" | "voting";
export const moduleSetup = {
  questions: {
    title: "题库",
    eyebrow: "QUESTION BANK SETUP",
    icon: "book",
    color: "green",
    path: "/questions",
    pendingPath: "/questions/pending",
    summary: "四种题型入口与答题界面已完成，正式题目与标准答案等待资料。",
    requirements: [
      {
        title: "正式题库文件",
        description: "成语、法律、农牧民图片题、诗词四类内容及分类信息。",
      },
      {
        title: "标准答案与判分口径",
        description: "选择题选项、填空题标准答案，以及允许的答案写法。",
      },
      {
        title: "图片题素材",
        description: "图片文件与题目、选项之间的对应关系。",
      },
    ],
    next: "资料确认后，建立正式题库模型并接入导入和查询接口。",
  },
  learning: {
    title: "学习资源",
    eyebrow: "LEARNING RESOURCES SETUP",
    icon: "learning",
    color: "blue",
    path: "/learning",
    pendingPath: "/learning/pending",
    summary: "字典查询、词条详情与课程展示界面已完成，正式学习资源等待资料。",
    requirements: [
      {
        title: "字典数据",
        description: "字词、拼音、释义与例句，或可接入的数据接口。",
      },
      {
        title: "视频资料",
        description: "课程名称、分类、封面及可播放的视频地址。",
      },
      { title: "课程展示信息", description: "学习顺序、时长与课程简介。" },
    ],
    next: "资料确认后，接入字典查询、课程列表与视频播放。",
  },
  voting: {
    title: "投票活动",
    eyebrow: "VOTING SETUP",
    icon: "vote",
    color: "amber",
    path: "/voting",
    pendingPath: "/voting/pending",
    summary: "活动入口、选手列表与介绍界面已完成，正式活动配置等待资料。",
    requirements: [
      { title: "选手资料", description: "选手编号、姓名、照片与介绍。" },
      {
        title: "活动时间与开启配置",
        description: "明确活动开始和结束时间，以及投票开放状态。",
      },
      {
        title: "每日 IP 投票限额",
        description: "正式每日次数待确认；北京时间每天 04:00 切换额度。",
      },
    ],
    next: "资料确认后，接入选手数据、服务端 IP 限额和票数统计。",
  },
} as const;
