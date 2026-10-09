import test from "node:test";
import assert from "node:assert/strict";
import { migrateDemoData } from "../apps/admin/src/domain/migration.ts";
function legacy() {
  return {
    version: 1,
    home: { title: "原标题", subtitle: "介绍", bannerAssetId: "img" },
    questions: [
      {
        id: "old-question",
        type: "law",
        stem: "旧题",
        answer: "正确文本",
        enabled: true,
        updatedAt: "2026-10-09",
      },
    ],
    words: [
      {
        id: "old-word",
        text: "词",
        pinyin: "cí",
        definition: "释义",
        example: "例句",
      },
    ],
    videos: [],
    candidates: [
      {
        id: "old-candidate",
        number: "001",
        name: "选手",
        intro: "简介",
        color: "#e9efe2",
        votes: 0,
        enabled: true,
      },
    ],
    assets: [
      {
        id: "img",
        name: "旧图片",
        url: "data:image/png;base64,abc",
        mime: "image/png",
        size: 123,
        createdAt: "2026-10-09",
      },
    ],
    activity: { title: "活动", dailyLimit: 3, enabled: true },
  };
}
test("旧本地内容升级后保留 ID、文字与图片，缺少选项的题目转为草稿", () => {
  const result = migrateDemoData(legacy());
  assert.equal(result.version, 2);
  assert.equal(result.questions[0].id, "old-question");
  assert.equal(result.questions[0].options[0].label, "正确文本");
  assert.equal(result.questions[0].enabled, false);
  assert.equal(result.home.bannerAssetId, "img");
  assert.equal(result.assets[0].url, "data:image/png;base64,abc");
  assert.equal(result.words[0].sortOrder, 0);
  assert.equal(result.activity.enabled, false);
});
test("新版记录升级幂等，非法版本不能静默重置", () => {
  const next = migrateDemoData(legacy());
  assert.deepEqual(migrateDemoData(next), next);
  assert.throws(() => migrateDemoData({ version: 999 }), /版本/);
});
