import test from "node:test";
import assert from "node:assert/strict";
import {
  questionErrors,
  wordErrors,
  videoErrors,
  activityErrors,
  beijingToUtc,
  utcToBeijing,
  stableSort,
  assetReferences,
} from "../apps/admin/src/domain/content-model.ts";
const question = () => ({
  id: "q1",
  type: "law",
  stem: "请选择正确选项",
  answers: ["b"],
  options: [
    { id: "a", label: "甲" },
    { id: "b", label: "乙" },
  ],
  explanation: "",
  enabled: true,
  sortOrder: 0,
  updatedAt: "2026-10-09",
});
test("导入的图片地址不能是任意文本或脚本协议", () => {
  const q = question();
  q.type = "image";
  q.options.forEach((option) => (option.image = "javascript:bad"));
  assert.ok(questionErrors(q).some((error) => error.includes("地址")));
});
test("HTTPS 视频地址也必须有可解析的主机", () => {
  const value = {
    id: "v",
    title: "课",
    category: "分类",
    duration: "待提供",
    url: "https:///broken",
    enabled: true,
    sortOrder: 0,
  };
  assert.ok(videoErrors(value).length > 0);
});
test("单选题答案必须指向现有选项，删除正确选项后不能启用", () => {
  const q = question();
  q.options.pop();
  assert.ok(questionErrors(q).some((e) => e.includes("答案")));
});
test("选择题拒绝重复选项编号或多个标准答案", () => {
  const q = question();
  q.options[1].id = "a";
  q.answers = ["a", "b"];
  const errors = questionErrors(q);
  assert.ok(errors.some((e) => e.includes("编号")));
  assert.ok(errors.some((e) => e.includes("一个")));
});
test("图片题每个选项必须有图片，填空题不接受选择选项", () => {
  const image = question();
  image.type = "image";
  assert.ok(questionErrors(image).some((e) => e.includes("图片")));
  const fill = question();
  fill.type = "idiom";
  assert.ok(questionErrors(fill).some((e) => e.includes("选项")));
});
test("完整选择题与多个标准答案的填空题可通过", () => {
  assert.deepEqual(questionErrors(question()), []);
  const fill = {
    ...question(),
    type: "poetry",
    options: [],
    answers: ["答案一", "答案二"],
  };
  assert.deepEqual(questionErrors(fill), []);
});
test("词条必填字段和排序有效性受到校验", () => {
  const w = {
    id: "w",
    text: " ",
    pinyin: "",
    definition: "",
    example: "",
    enabled: true,
    sortOrder: -1,
  };
  assert.ok(wordErrors(w).length >= 3);
});
test("启用课程必须有 HTTPS 地址；关闭课程允许未提供地址", () => {
  const v = {
    id: "v",
    title: "课程",
    category: "基础",
    duration: "待提供",
    url: "",
    enabled: true,
    sortOrder: 0,
  };
  assert.ok(videoErrors(v).some((e) => e.includes("地址")));
  assert.deepEqual(videoErrors({ ...v, enabled: false }), []);
  assert.ok(
    videoErrors({ ...v, url: "http://example.test/video.mp4" }).length > 0,
  );
});
test("北京时间转换固定为 UTC+8，不依赖电脑本地时区", () => {
  assert.equal(beijingToUtc("2026-10-09T04:00:00"), "2026-10-08T20:00:00.000Z");
  assert.equal(utcToBeijing("2026-10-08T20:00:00.000Z"), "2026-10-09T04:00:00");
  assert.equal(beijingToUtc(""), null);
  assert.throws(() => beijingToUtc("2026-02-31T04:00:00"));
});
test("开启活动必须有正确时间区间和整数额度", () => {
  const a = {
    title: "活动",
    startAt: null,
    endAt: null,
    dailyLimit: 3,
    enabled: true,
  };
  assert.ok(activityErrors(a).some((e) => e.includes("时间")));
  assert.ok(
    activityErrors({ ...a, enabled: false, dailyLimit: 1.5 }).some((e) =>
      e.includes("整数"),
    ),
  );
  assert.ok(
    activityErrors({
      ...a,
      startAt: "2026-10-10T00:00:00.000Z",
      endAt: "2026-10-09T00:00:00.000Z",
    }).some((e) => e.includes("晚于")),
  );
});
test("排序数小者先显示，同序按 ID 稳定排序且不改原数组", () => {
  const source = [
    { id: "b", sortOrder: 2 },
    { id: "c", sortOrder: 1 },
    { id: "a", sortOrder: 2 },
  ];
  assert.deepEqual(
    stableSort(source).map((x) => x.id),
    ["c", "a", "b"],
  );
  assert.equal(source[0].id, "b");
});
test("图片引用涵盖首页、题目、选手和课程", () => {
  const d = {
    home: { bannerAssetId: "img" },
    questions: [
      {
        ...question(),
        options: [{ id: "a", label: "甲", imageAssetId: "img" }],
      },
    ],
    candidates: [{ name: "选手", photoAssetId: "img" }],
    videos: [{ title: "课程", coverAssetId: "img" }],
  };
  assert.equal(assetReferences(d, "img").length, 4);
});
