import test from "node:test";
import assert from "node:assert/strict";
import { createMiniRuntime } from "./helpers/mini-runtime.mjs";
test("词条列表和详情能够加载非内置的新 ID", async () => {
  const word = {
    id: "server-word-901",
    text: "新词",
    pinyin: "xīn cí",
    definition: "释义",
    example: "例句",
  };
  const app = createMiniRuntime({
    "/api/public/learning": { words: [word], lessons: [] },
    "/api/public/words/server-word-901": word,
  });
  const list = app.loadPage("pages/learning/index");
  await list.onShow();
  list.word({ currentTarget: { dataset: { id: word.id } } });
  const detail = app.loadPage("pages/word/index");
  await detail.onLoad({ id: word.id });
  assert.equal(detail.data.word?.id, word.id);
  assert.equal(detail.data.status, "ready");
});
test("选手详情从服务加载，并区分不存在的记录", async () => {
  const candidate = {
    id: "server-candidate-901",
    number: "901",
    name: "新选手",
    intro: "简介",
    color: "#e9efe2",
    mark: "手",
  };
  const app = createMiniRuntime({
    "/api/public/candidates/server-candidate-901": candidate,
  });
  const detail = app.loadPage("pages/candidate/index");
  await detail.onLoad({ id: candidate.id });
  assert.equal(detail.data.candidate?.id, candidate.id);
  const missing = app.loadPage("pages/candidate/index");
  await missing.onLoad({ id: "missing" });
  assert.equal(missing.data.status, "empty");
});
