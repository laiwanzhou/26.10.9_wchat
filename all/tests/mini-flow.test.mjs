import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
const buildRoot = resolve(import.meta.dirname, "../apps/miniprogram/dist");
function loadQuiz(pagePath = "pages/quiz/index") {
  let page;
  const cache = new Map(),
    storage = new Map(),
    toasts = [],
    navigations = [];
  const wx = {
    getStorageSync: (k) => storage.get(k),
    setStorageSync: (k, v) => storage.set(k, v),
    showToast: (x) => toasts.push(x),
    setNavigationBarTitle: () => {},
    redirectTo: (x) => navigations.push(x),
    navigateTo: (x) => navigations.push(x),
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const require = (specifier) =>
      load(resolve(dirname(file), specifier + ".js"));
    vm.runInNewContext(
      readFileSync(file, "utf8"),
      {
        module,
        exports: module.exports,
        require,
        wx,
        Page: (definition) => {
          page = definition;
        },
        console,
      },
      { filename: file },
    );
    return module.exports;
  }
  load(resolve(buildRoot, pagePath + ".js"));
  page.setData = (patch) => Object.assign(page.data, patch);
  return { page, storage, toasts, navigations };
}
test("完整填空练习可保存一次成绩，连点提交不会重复计题或写入记录", () => {
  const { page, storage, navigations } = loadQuiz();
  page.onLoad({ type: "idiom" });
  page.input({ detail: { value: "恒" } });
  page.submit();
  page.submit();
  assert.equal(page.data.correct, true);
  page.next();
  page.input({ detail: { value: "知" } });
  page.submit();
  page.next();
  page.next();
  const history = storage.get("yanxi-mini-history-v1");
  assert.equal(history.length, 1);
  assert.equal(history[0].correct, 2);
  assert.equal(history[0].accuracy, 100);
  assert.equal(navigations.length, 1);
  assert.match(navigations[0].url, /correct=2&total=2&accuracy=100/);
});
test("空答案不会提交，未知题型显示空状态", () => {
  const { page, toasts } = loadQuiz();
  page.onLoad({ type: "poetry" });
  page.submit();
  assert.equal(page.data.submitted, false);
  assert.equal(toasts.length, 1);
  const invalid = loadQuiz().page;
  invalid.onLoad({ type: "unknown" });
  assert.equal(invalid.data.total, 0);
  assert.ok(invalid.data.error);
});

const entries = [
  ["idiom", "/pages/idiom-quiz/index", "fill", "成语填空"],
  ["law", "/pages/law-quiz/index", "choice", "法律单选"],
  ["image", "/pages/image-quiz/index", "choice", "农牧民图片选择题"],
  ["poetry", "/pages/poetry-quiz/index", "fill", "诗词填空"],
];
for (const [type, route, kind, title] of entries) {
  test(`${title}入口点击后进入对应独立答题页`, () => {
    const { page, navigations } = loadQuiz("pages/practice/index");
    page.start({ currentTarget: { dataset: { id: type } } });
    assert.equal(navigations[0].url, route);
    const destination = loadQuiz(route.slice(1)).page;
    destination.onLoad({ type: "unknown" });
    assert.equal(destination.data.type, type);
    assert.equal(destination.data.answerKind, kind);
  });
  test(`${title}按正确题型加载静态题，初始不能提交`, () => {
    const { page } = loadQuiz();
    page.onLoad({ type });
    assert.equal(page.data.answerKind, kind);
    assert.equal(page.data.title, title);
    assert.equal(page.data.canSubmit, false);
    assert.ok(page.data.total >= 2);
  });
}
test("单选切换只保留一个选项，提交错误后标出标准答案并锁定选择", () => {
  const { page } = loadQuiz();
  page.onLoad({ type: "law" });
  assert.equal(typeof page.radioChange, "function");
  page.radioChange({ detail: { value: "a" } });
  page.radioChange({ detail: { value: "b" } });
  assert.equal(page.data.answer, "b");
  assert.equal(page.data.optionViews.filter((o) => o.selected).length, 1);
  assert.equal(page.data.canSubmit, true);
  page.submit();
  assert.equal(page.data.correct, false);
  assert.equal(
    page.data.optionViews.find((o) => o.id === "a").state,
    "correct",
  );
  assert.equal(page.data.optionViews.find((o) => o.id === "b").state, "wrong");
  page.radioChange({ detail: { value: "a" } });
  assert.equal(page.data.answer, "b");
  page.next();
  assert.equal(page.data.answer, "");
  assert.equal(page.data.canSubmit, false);
});
test("图片选择题提供本地图片，可选择并完成判分", () => {
  const { page } = loadQuiz();
  page.onLoad({ type: "image" });
  assert.equal(typeof page.radioChange, "function");
  for (const option of page.data.question.options) {
    assert.match(option.image, /^\/assets\/questions\/.+\.png$/);
    const bytes = readFileSync(resolve(buildRoot, option.image.slice(1)));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  }
  page.radioChange({ detail: { value: "a" } });
  page.submit();
  assert.equal(page.data.correct, true);
  assert.equal(page.data.displayAnswer, "草原");
});
test("填空题忽略前后空格，提交后不允许改答案", () => {
  const { page } = loadQuiz();
  page.onLoad({ type: "poetry" });
  page.input({ detail: { value: "   " } });
  assert.equal(page.data.canSubmit, false);
  page.input({ detail: { value: " 天涯若比邻 " } });
  assert.equal(page.data.canSubmit, true);
  page.submit();
  assert.equal(page.data.correct, true);
  page.input({ detail: { value: "其他答案" } });
  assert.equal(page.data.answer, " 天涯若比邻 ");
});
test("单选拒绝不存在的选项编号，也不接受填空输入事件", () => {
  const { page } = loadQuiz();
  page.onLoad({ type: "law" });
  assert.equal(typeof page.radioChange, "function");
  page.radioChange({ detail: { value: "unknown" } });
  page.input({ detail: { value: "a" } });
  assert.equal(page.data.answer, "");
  assert.equal(page.data.canSubmit, false);
});
