import test from "node:test";
import assert from "node:assert/strict";
import {
  LocalRepository,
  validateImage,
} from "../apps/admin/src/domain/local-repository.ts";
import {
  gradeAnswer,
  summarize,
} from "../apps/miniprogram/src/domain/practice.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, v),
  };
}
test("本地保存后重新创建仓库，仍能读取保存内容", () => {
  const storage = memoryStorage();
  const check = (x) => typeof x?.title === "string";
  const repo = new LocalRepository(storage, "demo", { title: "原标题" }, check);
  repo.save({ title: "新标题" });
  assert.equal(
    new LocalRepository(storage, "demo", { title: "原标题" }, check).read()
      .title,
    "新标题",
  );
});
test("非法缓存恢复初始数据，不导致页面无法打开", () => {
  const storage = memoryStorage();
  storage.setItem("demo", "{invalid");
  assert.deepEqual(
    new LocalRepository(
      storage,
      "demo",
      { title: "初始" },
      (x) => typeof x?.title === "string",
    ).read(),
    { title: "初始" },
  );
  storage.setItem("demo", '{"title":42}');
  assert.deepEqual(
    new LocalRepository(
      storage,
      "demo",
      { title: "初始" },
      (x) => typeof x?.title === "string",
    ).read(),
    { title: "初始" },
  );
});
test("保存失败时保留旧状态，并把错误交给界面提示", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw Error("空间不足");
    },
  };
  const repo = new LocalRepository(
    storage,
    "demo",
    { title: "原标题" },
    (x) => typeof x?.title === "string",
  );
  assert.throws(() => repo.save({ title: "新标题" }), /空间不足/);
  assert.equal(repo.read().title, "原标题");
});
test("读取结果的修改不污染仓库；非法保存被拒绝", () => {
  const repo = new LocalRepository(
    memoryStorage(),
    "demo",
    { title: "原标题" },
    (x) => typeof x?.title === "string",
  );
  repo.read().title = "偷偷改动";
  assert.equal(repo.read().title, "原标题");
  assert.throws(() => repo.save({ title: 42 }), /数据/);
});
test("图片校验拒绝伪装图片和超过 5 MiB 的文件", () => {
  assert.throws(
    () => validateImage(new Uint8Array([60, 115, 118, 103]), 4),
    /格式/,
  );
  assert.throws(
    () => validateImage(new Uint8Array([255, 216, 255]), 5242881),
    /5 MiB/,
  );
  assert.equal(
    validateImage(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), 1024),
    "image/png",
  );
});
test("填空只归一前后空格，并接受多个标准答案", () => {
  assert.equal(
    gradeAnswer("  海内存知己  ", ["海内存知己", "海內存知己"]),
    true,
  );
  assert.equal(gradeAnswer("海内 存知己", ["海内存知己"]), false);
  assert.equal(gradeAnswer("", ["海内存知己"]), false);
});
test("选择题按稳定选项编号判分", () => {
  assert.equal(gradeAnswer("b", ["b"]), true);
  assert.equal(gradeAnswer("a", ["b"]), false);
});
test("结果统计不把未提交题算成答错", () => {
  assert.deepEqual(summarize([true, false, null, true]), {
    total: 4,
    answered: 3,
    correct: 2,
    wrong: 1,
    accuracy: 67,
  });
  assert.deepEqual(summarize([]), {
    total: 0,
    answered: 0,
    correct: 0,
    wrong: 0,
    accuracy: 0,
  });
});
