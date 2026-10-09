import test from "node:test";
import assert from "node:assert/strict";
import {
  decodeHome,
  decodeLearning,
  decodeVoting,
  decodeWord,
} from "../shared/contracts.ts";
test("首页契约拒绝缺少 subtitle 和非法 title，不让 TypeError 进入页面", () => {
  assert.throws(() => decodeHome({ title: "标题", banner: null }), /格式/);
  assert.throws(
    () => decodeHome({ title: 1, subtitle: "介绍", banner: null }),
    /格式/,
  );
  assert.deepEqual(
    decodeHome({ title: "标题", subtitle: "介绍", banner: null }),
    { title: "标题", subtitle: "介绍", banner: null },
  );
});
test("聚合响应不能被通用分页包装替代", () => {
  assert.throws(() => decodeLearning({ items: [], page: 1, total: 0 }), /格式/);
  assert.deepEqual(decodeLearning({ words: [], lessons: [] }), {
    words: [],
    lessons: [],
  });
  assert.deepEqual(decodeVoting({ title: "活动", candidates: [] }), {
    title: "活动",
    candidates: [],
  });
});
test("词条校验保留服务返回的新 ID", () => {
  const value = {
    id: "server-word",
    text: "词条",
    pinyin: "cí tiáo",
    definition: "释义",
    example: "例句",
  };
  assert.deepEqual(decodeWord(value), value);
});
