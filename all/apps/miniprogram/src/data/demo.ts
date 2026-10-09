import type {
  QuestionOption,
  QuestionType,
  AnswerKind,
  QuestionContent,
  WordContent,
  VideoContent,
  CandidateContent,
} from "../contracts/generated";
export type Choice = QuestionOption;
export type QuestionCategory = QuestionType;
export type { AnswerKind };
export type PracticeQuestion = QuestionContent;
// [PRE-LAUNCH:PL-02][CONTRACT:C-01..C-03] 独立静态样本不与后台缓存同步；上线用同一服务的公开 DTO，保持生成契约一致。
export const categories = [
  {
    id: "idiom",
    title: "成语填空",
    desc: "在四字之间，积累语言之美",
    mark: "成",
    color: "green",
    count: 2,
    answerKind: "fill" as AnswerKind,
    route: "/pages/idiom-quiz/index",
  },
  {
    id: "law",
    title: "法律单选",
    desc: "通过示例，了解基础题型",
    mark: "法",
    color: "blue",
    count: 2,
    answerKind: "choice" as AnswerKind,
    route: "/pages/law-quiz/index",
  },
  {
    id: "image",
    title: "农牧民图片选择题",
    desc: "看图识词，贴近日常生活",
    mark: "图",
    color: "amber",
    count: 2,
    answerKind: "choice" as AnswerKind,
    route: "/pages/image-quiz/index",
  },
  {
    id: "poetry",
    title: "诗词填空",
    desc: "在经典诗句中，遇见好表达",
    mark: "诗",
    color: "purple",
    count: 2,
    answerKind: "fill" as AnswerKind,
    route: "/pages/poetry-quiz/index",
  },
];
export const questions: PracticeQuestion[] = [
  {
    id: "i1",
    type: "idiom",
    stem: "补全成语：\n持之以____。",
    answers: ["恒"],
    options: [],
    explanation:
      "“持之以恒”指长久坚持下去。示例采用文本精确匹配，忽略答案前后空格。",
  },
  {
    id: "i2",
    type: "idiom",
    stem: "补全成语：\n温故____新。",
    answers: ["知"],
    options: [],
    explanation: "“温故知新”指温习旧知识，从而获得新的理解。",
  },
  {
    id: "l1",
    type: "law",
    stem: "以下哪一项属于法律文本的名称形式？",
    answers: ["a"],
    options: [
      { id: "a", label: "宪法" },
      { id: "b", label: "游记" },
      { id: "c", label: "小说" },
      { id: "d", label: "童话" },
    ],
    explanation: "此题仅用于演示单选交互。正式法律题库及标准答案由甲方提供。",
  },
  {
    id: "l2",
    type: "law",
    stem: "在本示例中，“法律单选题”要求选择几个选项？",
    answers: ["b"],
    options: [
      { id: "a", label: "零个" },
      { id: "b", label: "一个" },
      { id: "c", label: "两个" },
      { id: "d", label: "全部" },
    ],
    explanation: "单选题每次选择一个选项；实际题目内容等待甲方材料。",
  },
  {
    id: "p1",
    type: "poetry",
    stem: "补全诗句：\n海内存知己，____。",
    answers: ["天涯若比邻"],
    options: [],
    explanation: "此句出自王勃《送杜少府之任蜀州》。此处只演示填空判分。",
  },
  {
    id: "p2",
    type: "poetry",
    stem: "补全诗句：\n白日依山尽，____。",
    answers: ["黄河入海流"],
    options: [],
    explanation: "此句出自王之涣《登鹳雀楼》。",
  },
  {
    id: "g1",
    type: "image",
    stem: "请选择与“草原”对应的图片。",
    answers: ["a"],
    options: [
      { id: "a", label: "草原", image: "/assets/questions/grassland.png" },
      { id: "b", label: "雪山", image: "/assets/questions/mountain.png" },
    ],
    explanation:
      "草原示例图呈现绿色草地和起伏的丘陵。当前图片为本地演示插画，后续可替换为甲方提供的图片。",
  },
  {
    id: "g2",
    type: "image",
    stem: "请选择与“湖泊”对应的图片。",
    answers: ["b"],
    options: [
      { id: "a", label: "沙漠", image: "/assets/questions/desert.png" },
      { id: "b", label: "湖泊", image: "/assets/questions/lake.png" },
    ],
    explanation: "湖泊示例图呈现被陆地围绕的蓝色水面。当前使用本地静态图片。",
  },
];
export function getPracticeRoute(type: string): string | null {
  return categories.find((category) => category.id === type)?.route || null;
}
export const words: WordContent[] = [
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
];
export const lessons: VideoContent[] = [
  {
    id: "v1",
    title: "从声母开始，练好每个音",
    category: "基础发音",
    duration: "待提供",
    url: "",
    mark: "声",
    color: "green",
  },
  {
    id: "v2",
    title: "日常表达：把一句话说清楚",
    category: "日常表达",
    duration: "待提供",
    url: "",
    mark: "说",
    color: "amber",
  },
];
export const candidates: CandidateContent[] = [
  {
    id: "c1",
    number: "001",
    name: "阿云",
    intro: "用声音记录家乡，让更多人听见草原的故事。",
    color: "green",
    mark: "云",
  },
  {
    id: "c2",
    number: "002",
    name: "小林",
    intro: "把每一次表达，变成一次真诚的分享。",
    color: "blue",
    mark: "林",
  },
  {
    id: "c3",
    number: "003",
    name: "卓玛",
    intro: "热爱语言，也热爱生活里的每一份美好。",
    color: "amber",
    mark: "玛",
  },
  {
    id: "c4",
    number: "004",
    name: "阿木",
    intro: "从家乡出发，用普通话分享自己的故事。",
    color: "purple",
    mark: "木",
  },
];
