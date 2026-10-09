import type { SheetRow } from "../domain/question-import";
export interface ImportSheet {
  name: string;
  headers: string[];
  rows: SheetRow[];
}
function cellText(value: unknown): { text: string; error?: string } {
  if (value === null || value === undefined) return { text: "" };
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return { text: String(value) };
  if (value instanceof Date) return { text: value.toISOString() };
  if (typeof value === "object") {
    const cell = value as Record<string, unknown>;
    if ("formula" in cell || "sharedFormula" in cell)
      return { text: "", error: "不支持公式单元格，请转为文本或数值" };
    if (Array.isArray(cell.richText))
      return {
        text: cell.richText.map((part) => String(part.text || "")).join(""),
      };
    if (typeof cell.text === "string") return { text: cell.text };
    if ("error" in cell) return { text: "", error: "Excel 单元格包含错误" };
  }
  return { text: "", error: "单元格类型不支持" };
}
// [PRE-LAUNCH:PL-08] .xlsx/10MiB/2000行/64列只是客户端预览限制；服务端需再检查压缩展开大小、公式、字段、引用和批次提交。
export async function readXlsx(data: ArrayBuffer): Promise<ImportSheet[]> {
  if (data.byteLength > 10 * 1024 * 1024)
    throw Error("Excel 文件不能超过 10 MiB");
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data as Parameters<typeof workbook.xlsx.load>[0]);
  const sheets: ImportSheet[] = [];
  for (const sheet of workbook.worksheets) {
    if (sheet.columnCount > 64) throw Error("工作表最多支持 64 列，请精简列");
    const headers = Array.from(
      { length: sheet.columnCount },
      (_, index) =>
        cellText(sheet.getRow(1).getCell(index + 1).value).text ||
        "未命名列 " + (index + 1),
    );
    const rows: SheetRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cells: string[] = [],
        cellErrors: Record<number, string> = {};
      for (let index = 0; index < headers.length; index++) {
        const parsed = cellText(row.getCell(index + 1).value);
        cells.push(parsed.text);
        if (parsed.error)
          cellErrors[index] = "列 " + (index + 1) + "：" + parsed.error;
      }
      if (cells.some(Boolean) || Object.keys(cellErrors).length)
        rows.push({ rowNumber, cells, cellErrors });
      if (rows.length > 2000) throw Error("每张工作表最多支持 2000 行数据");
    });
    if (headers.length) sheets.push({ name: sheet.name, headers, rows });
  }
  return sheets;
}
export async function exampleWorkbook(): Promise<ArrayBuffer> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("题库示例");
  sheet.addRow([
    "题型",
    "题干",
    "选项A",
    "选项B",
    "选项C",
    "选项D",
    "标准答案",
    "图片A",
    "图片B",
    "图片C",
    "图片D",
    "解析",
    "启用",
    "排序",
  ]);
  sheet.addRow([
    "成语填空",
    "补全成语：坚持不___。",
    "",
    "",
    "",
    "",
    "懈",
    "",
    "",
    "",
    "",
    "每行一题；填空多个答案用 | 分隔",
    "否",
    1,
  ]);
  sheet.addRow([
    "法律单选",
    "以下哪一项属于法律文本的名称形式？",
    "宪法",
    "游记",
    "小说",
    "童话",
    "A",
    "",
    "",
    "",
    "",
    "选择答案可填写 A/B/C/D",
    "否",
    2,
  ]);
  sheet.addRow([
    "农牧民图片选择题",
    "选择草原图片",
    "草原",
    "雪山",
    "",
    "",
    "A",
    "/demo-media/grassland.png",
    "/demo-media/mountain.png",
    "",
    "",
    "图片暂用地址列，不解析内嵌图片",
    "否",
    3,
  ]);
  sheet.addRow([
    "诗词填空",
    "白日依山尽，___。",
    "",
    "",
    "",
    "",
    "黄河入海流",
    "",
    "",
    "",
    "",
    "演示模板，最终字段等待甲方样本",
    "否",
    4,
  ]);
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => (column.width = 22));
  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}
