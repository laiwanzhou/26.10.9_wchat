import { migrateDemoData } from "../domain/migration.ts";
export type {
  QuestionRecord as Question,
  QuestionType,
  WordRecord as Word,
  VideoRecord as Video,
  CandidateRecord as Candidate,
  ImageAsset as Asset,
  DemoData,
} from "../../../../shared/contracts";
export const questionTypes = {
  idiom: "成语填空",
  law: "法律单选",
  image: "农牧民图片选择题",
  poetry: "诗词填空",
};
// [PRE-LAUNCH:PL-02] 这里只提供本地样本；未来公开数据与管理写入需通过同一后端，见唯一 plan。
const legacySeed = {
  version: 1,
  home: {
    title: "每天一点，表达更好",
    subtitle: "学普通话，读经典，让每一句话更有力量。",
    bannerAssetId: null,
  },
  questions: [
    {
      id: "q1",
      type: "idiom",
      stem: "补全成语：持之以____。",
      answer: "恒",
      enabled: true,
      updatedAt: "2026-10-09",
    },
    {
      id: "q2",
      type: "poetry",
      stem: "补全诗句：海内存知己，____。",
      answer: "天涯若比邻",
      enabled: true,
      updatedAt: "2026-10-09",
    },
    {
      id: "q3",
      type: "law",
      stem: "以下哪一项属于法律文本的名称形式？",
      answer: "宪法",
      enabled: true,
      updatedAt: "2026-10-09",
    },
    {
      id: "q4",
      type: "image",
      stem: "选择与“草原”对应的图片。",
      answer: "草原图片",
      enabled: false,
      updatedAt: "2026-10-09",
    },
    {
      id: "q5",
      type: "idiom",
      stem: "补全成语：温故____新。",
      answer: "知",
      enabled: true,
      updatedAt: "2026-10-09",
    },
    {
      id: "q6",
      type: "poetry",
      stem: "补全诗句：白日依山尽，____。",
      answer: "黄河入海流",
      enabled: true,
      updatedAt: "2026-10-09",
    },
  ],
  words: [
    {
      id: "w1",
      text: "学习",
      pinyin: "xué xí",
      definition: "通过阅读、听讲、实践等获得知识或技能。",
      example: "每天坚持学习，慢慢积累。",
    },
    {
      id: "w2",
      text: "表达",
      pinyin: "biǎo dá",
      definition: "把思想、情感或意思表示出来。",
      example: "清楚地表达自己的想法。",
    },
    {
      id: "w3",
      text: "春天",
      pinyin: "chūn tiān",
      definition: "四季中的第一季。",
      example: "春天到了，草木渐渐变绿。",
    },
    {
      id: "w4",
      text: "草原",
      pinyin: "cǎo yuán",
      definition: "以草本植物为主的广阔地带。",
      example: "微风吹过辽阔的草原。",
    },
  ],
  videos: [
    {
      id: "v1",
      title: "从声母开始，练好每个音",
      category: "基础发音",
      duration: "待提供",
      url: "",
    },
    {
      id: "v2",
      title: "日常表达：把一句话说清楚",
      category: "日常表达",
      duration: "待提供",
      url: "",
    },
  ],
  candidates: [
    {
      id: "c1",
      number: "001",
      name: "阿云",
      intro: "用声音记录家乡，让更多人听见草原的故事。",
      color: "#e9efe2",
      votes: 0,
      enabled: true,
    },
    {
      id: "c2",
      number: "002",
      name: "小林",
      intro: "把每一次表达，变成一次真诚的分享。",
      color: "#e8edf4",
      votes: 0,
      enabled: true,
    },
    {
      id: "c3",
      number: "003",
      name: "卓玛",
      intro: "热爱语言，也热爱生活里的每一份美好。",
      color: "#f3e9de",
      votes: 0,
      enabled: true,
    },
    {
      id: "c4",
      number: "004",
      name: "阿木",
      intro: "从家乡出发，用普通话分享自己的故事。",
      color: "#e9e4f1",
      votes: 0,
      enabled: false,
    },
  ],
  assets: [],
  activity: { title: "用声音，连接你我", dailyLimit: 3, enabled: false },
};
export const seed = migrateDemoData(legacySeed);
seed.questions[2] = {
  ...seed.questions[2],
  options: [
    { id: "a", label: "宪法" },
    { id: "b", label: "游记" },
    { id: "c", label: "小说" },
    { id: "d", label: "童话" },
  ],
  answers: ["a"],
  enabled: true,
  migrationNote: undefined,
};
seed.questions[3] = {
  ...seed.questions[3],
  options: [
    { id: "a", label: "草原", image: "/demo-media/grassland.png" },
    { id: "b", label: "雪山", image: "/demo-media/mountain.png" },
  ],
  answers: ["a"],
  migrationNote: undefined,
};
