import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  inferMapping,
  previewQuestionRows,
  mergeQuestionImport,
} from "../apps/admin/src/domain/question-import.ts";
import { readXlsx } from "../apps/admin/src/services/excel.ts";
const headers = [
  "题型",
  "题干",
  "选项A",
  "选项B",
  "标准答案",
  "图片A",
  "图片B",
];
const fill = { rowNumber: 2, cells: ["成语填空", "持之以___", "", "", "恒"] };
test("按列映射解析填空和单选，答案使用稳定选项 ID", () => {
  const rows = previewQuestionRows(
    [fill, { rowNumber: 3, cells: ["法律单选", "选择", "甲", "乙", "B"] }],
    inferMapping(headers),
    [],
    "reject",
  );
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].question.answers, ["恒"]);
  assert.deepEqual(rows[1].question.answers, ["b"]);
  assert.deepEqual(rows[1].errors, []);
});
test("错误定位保留原始 Excel 行号，图片缺失被拒绝", () => {
  const rows = previewQuestionRows(
    [
      {
        rowNumber: 19,
        cells: ["图片选择", "草原", "草原", "雪山", "A", "", ""],
      },
    ],
    inferMapping(headers),
    [],
    "reject",
  );
  assert.equal(rows[0].rowNumber, 19);
  assert.ok(rows[0].errors.some((e) => e.includes("图片")));
});
test("重复默认拒绝；明确覆盖保留已有 ID", () => {
  const mapping = inferMapping(headers);
  const first = previewQuestionRows([fill], mapping, [], "reject")[0].question;
  first.id = "existing-id";
  assert.ok(
    previewQuestionRows([fill], mapping, [first], "reject")[0].errors.some(
      (e) => e.includes("重复"),
    ),
  );
  const preview = previewQuestionRows([fill], mapping, [first], "replace");
  const merged = mergeQuestionImport(
    [first],
    preview,
    "replace",
    () => "new-id",
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, "existing-id");
});
test("有错误时整批不能提交，文件内重复也不自动覆盖", () => {
  const rows = previewQuestionRows(
    [fill, { ...fill, rowNumber: 3 }],
    inferMapping(headers),
    [],
    "replace",
  );
  assert.ok(rows[1].errors.some((e) => e.includes("重复")));
  assert.throws(
    () => mergeQuestionImport([], rows, "replace", () => "id"),
    /错误/,
  );
});
test("列顺序可调整，公式只在映射列中阻止导入", () => {
  const rows = previewQuestionRows(
    [
      {
        rowNumber: 8,
        cells: ["答案", "成语填空", "题干"],
        cellErrors: { 0: "不支持公式单元格" },
      },
    ],
    { answer: 0, type: 1, stem: 2 },
    [],
    "reject",
  );
  assert.ok(rows[0].errors.some((e) => e.includes("公式")));
});
test("真实 XLSX 解析保留稀疏行号，并拒绝公式读取", async () => {
  const require = createRequire(
    new URL("../apps/admin/package.json", import.meta.url),
  );
  const ExcelJS = require("exceljs");
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("样本");
  sheet.addRow(["题型", "题干", "标准答案"]);
  sheet.getRow(2).values = ["成语填空", "题干", "恒"];
  sheet.getRow(7).values = ["诗词填空", "题干", { formula: "1+1", result: 2 }];
  const parsed = await readXlsx(await book.xlsx.writeBuffer());
  assert.deepEqual(
    parsed[0].rows.map((r) => r.rowNumber),
    [2, 7],
  );
  assert.match(parsed[0].rows[1].cellErrors[2], /公式/);
});
